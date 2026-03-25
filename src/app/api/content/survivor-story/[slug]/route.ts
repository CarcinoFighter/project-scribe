import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(req: NextRequest, props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const { slug } = params;

  const { data: story, error } = (await supabaseAdmin
    .from('survivor_stories')
    .select('*, name:title, author_id')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()) as { data: any, error: any };

  if (error || !story) {
    return NextResponse.json({ error: 'Story not found' }, { status: 404 });
  }

  // Manually fetch author if author_id exists
  if (story.author_id) {
    const { data: author } = await supabaseAdmin
      .from('users')
      .select('name, avatar_url')
      .eq('id', story.author_id)
      .single();
    
    if (author) {
      story.author = author;
    }
  }

  return NextResponse.json({ story });
}
