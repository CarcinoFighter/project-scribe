import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(req: NextRequest) {
    try {
      const [blogsRes, storiesRes, docsRes] = await Promise.all([
        supabaseAdmin
          .from('blogs')
          .select('id, title, slug, content, tags, image_url, created_at, updated_at, author_id')
          .eq('status', 'published'),
        supabaseAdmin
          .from('survivor_stories')
          .select('id, name:title, slug, content, tags, image_url, created_at, updated_at, author_id')
          .eq('status', 'published'),
        supabaseAdmin
          .from('cancer_docs')
          .select('id, title, slug, content, created_at, updated_at, author_id')
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

      // Process manual joins since FKs are missing
      let finalBlogs = blogsRes.data as any[] || [];
      let finalDocs = docsRes.data as any[] || [];
      let finalStories = storiesRes.data as any[] || [];
      
      const missingAuthorBlogs = finalBlogs.filter(b => !b.author && b.author_id);
      const missingAuthorDocs = finalDocs.filter(d => !d.author && d.author_id);
      const missingAuthorStories = finalStories.filter(s => !s.author && s.author_id);
      
      const allMissingAuthorIds = [...new Set([
        ...missingAuthorBlogs.map(b => b.author_id),
        ...missingAuthorDocs.map(d => d.author_id),
        ...missingAuthorStories.map(s => s.author_id)
      ])].filter(Boolean);

      if (allMissingAuthorIds.length > 0) {
        const { data: authors } = await supabaseAdmin
          .from('users')
          .select('id, name, avatar_url')
          .in('id', allMissingAuthorIds);
        
        if (authors) {
          const authorMap = Object.fromEntries(authors.map(a => [a.id, a]));
          
          finalBlogs = finalBlogs.map(b => ({
            ...b,
            author: b.author || authorMap[b.author_id] || null
          }));

          finalDocs = finalDocs.map(d => ({
            ...d,
            author: d.author || authorMap[d.author_id] || null
          }));
          
          finalStories = finalStories.map(s => ({
            ...s,
            author: s.author || authorMap[s.author_id] || null
          }));
        }
      }

      const normalizedBlogs = (finalBlogs || []).map(b => ({
        ...b,
        type: 'blog',
      }));

    const normalizedStories = (finalStories || []).map(s => ({
      ...s,
      title: s.name, // Normalize 'name' to 'title'
      type: 'survivor_story',
    }));

    const normalizedDocs = (finalDocs || []).map(d => ({
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
