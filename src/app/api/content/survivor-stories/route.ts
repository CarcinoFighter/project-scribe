import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(req: NextRequest) {
  const { data: stories, error } = await supabaseAdmin
    .from('survivor_stories')
    .select('id, name, slug, content, tags, image_url, created_at, updated_at')
    .eq('status', 'published')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch stories' }, { status: 500 });
  }

  return NextResponse.json({ stories });
}

