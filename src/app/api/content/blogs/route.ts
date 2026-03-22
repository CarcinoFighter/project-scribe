import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(req: NextRequest) {
  const { data: blogs, error } = await supabaseAdmin
    .from('blogs')
    .select('id, title, slug, content, tags, image_url, created_at, updated_at, author_id, status')
    .eq('status', 'published')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching blogs:', error);
    return NextResponse.json({ error: 'Failed to fetch blogs' }, { status: 500 });
  }

  if (!blogs || blogs.length === 0) {
    return NextResponse.json({ blogs: [] });
  }

  // Manually fetch author details
  const authorIds = [...new Set(blogs.map(b => b.author_id))].filter(Boolean);
  
  if (authorIds.length > 0) {
    const { data: authors, error: authorError } = await supabaseAdmin
      .from('users')
      .select('id, name, avatar_url')
      .in('id', authorIds);

    if (!authorError && authors) {
      const authorMap = Object.fromEntries(authors.map(a => [a.id, a]));
      const blogsWithAuthor = blogs.map(b => ({
        ...b,
        author: authorMap[b.author_id] || null
      }));
      return NextResponse.json({ blogs: blogsWithAuthor });
    }
  }

  return NextResponse.json({ blogs });
}

