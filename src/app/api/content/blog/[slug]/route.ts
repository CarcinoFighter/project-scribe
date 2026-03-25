import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(req: NextRequest, props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const { slug } = params;

  const { data: blog, error } = (await supabaseAdmin
    .from('blogs')
    .select('*, author_id')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()) as { data: any, error: any };

  if (error || !blog) {
    return NextResponse.json({ error: 'Blog not found' }, { status: 404 });
  }

  // Manually fetch author if author_id exists
  if (blog.author_id) {
    const { data: author } = await supabaseAdmin
      .from('users')
      .select('name, avatar_url')
      .eq('id', blog.author_id)
      .single();
    
    if (author) {
      blog.author = author;
    }
  }

  return NextResponse.json({ blog });
}
