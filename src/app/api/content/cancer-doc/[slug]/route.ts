import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;

  const { data: doc, error } = (await supabaseAdmin
    .from('cancer_docs')
    .select('*, author_id')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()) as { data: any, error: any };

  if (error || !doc) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 });
  }

  // Manually fetch author if author_id exists
  if (doc.author_id) {
    const { data: author } = await supabaseAdmin
      .from('users')
      .select('name, avatar_url')
      .eq('id', doc.author_id)
      .single();
    
    if (author) {
      doc.author = author;
    }
  }

  return NextResponse.json({ doc });
}
