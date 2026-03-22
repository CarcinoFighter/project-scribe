import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;

  const { data: doc, error } = await supabaseAdmin
    .from('cancer_docs')
    .select('*, author:users(name, avatar_url)')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (error || !doc) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 });
  }

  return NextResponse.json({ doc });
}
