import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(req: NextRequest) {
  try {
    const [blogsRes, storiesRes, docsRes] = await Promise.all([
      supabaseAdmin
        .from('blogs')
        .select('id, title, slug, content, tags, image_url, created_at, updated_at, author:users(name, avatar_url)')
        .eq('status', 'published'),
      supabaseAdmin
        .from('survivor_stories')
        .select('id, name, slug, content, tags, image_url, created_at, updated_at, author:users(name, avatar_url)')
        .eq('status', 'published'),
      supabaseAdmin
        .from('cancer_docs')
        .select('id, title, slug, content, created_at, updated_at, author:users(name, avatar_url)')
        .eq('status', 'published'),
    ]);

    if (blogsRes.error || storiesRes.error || docsRes.error) {
      console.error('Error fetching combined content:', {
        blogs: blogsRes.error,
        stories: storiesRes.error,
        docs: docsRes.error,
      });
      return NextResponse.json({ error: 'Failed to fetch content' }, { status: 500 });
    }

    const normalizedBlogs = (blogsRes.data || []).map(b => ({
      ...b,
      type: 'blog',
    }));

    const normalizedStories = (storiesRes.data || []).map(s => ({
      ...s,
      title: s.name, // Normalize 'name' to 'title'
      type: 'survivor_story',
    }));

    const normalizedDocs = (docsRes.data || []).map(d => ({
      ...d,
      type: 'article',
    }));

    const allContent = [...normalizedBlogs, ...normalizedStories, ...normalizedDocs].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return NextResponse.json({ content: allContent });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
