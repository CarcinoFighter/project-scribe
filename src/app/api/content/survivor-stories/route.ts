import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(req: NextRequest) {
  const { data: stories, error } = await supabaseAdmin
    .from('survivor_stories')
    .select('id, name:title, slug, content, tags, image_url, created_at, updated_at, author_id, status')
    .eq('status', 'published')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching survivor_stories:', error);
    return NextResponse.json({ error: 'Failed to fetch stories' }, { status: 500 });
  }

  if (!stories || stories.length === 0) {
    return NextResponse.json({ stories: [] });
  }

  // Manually fetch author details
  const authorIds = [...new Set(stories.map(s => s.author_id))].filter(Boolean);
  
  if (authorIds.length > 0) {
    const { data: authors, error: authorError } = await supabaseAdmin
      .from('users')
      .select('id, name, avatar_url')
      .in('id', authorIds);

    if (!authorError && authors) {
      const authorMap = Object.fromEntries(authors.map(a => [a.id, a]));
      const storiesWithAuthor = stories.map(s => ({
        ...s,
        author: authorMap[s.author_id] || null
      }));
      return NextResponse.json({ stories: storiesWithAuthor });
    }
  }

  return NextResponse.json({ stories });
}

