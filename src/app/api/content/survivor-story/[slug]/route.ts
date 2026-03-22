import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;

  const { data: story, error } = await supabaseAdmin
    .from('survivor_stories')
    .select('*, author:users(name, avatar_url)')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (error || !story) {
    return NextResponse.json({ error: 'Story not found' }, { status: 404 });
  }

  return NextResponse.json({ story });
}
