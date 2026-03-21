import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;

  const { data: blog, error } = await supabaseAdmin
    .from('blogs')
    .select('*, author:users(name, avatar_url)')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (error || !blog) {
    return NextResponse.json({ error: 'Blog not found' }, { status: 404 });
  }

  return NextResponse.json({ blog });
}
