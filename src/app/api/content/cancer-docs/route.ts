import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(req: NextRequest) {
  const { data: docs, error } = await supabaseAdmin
    .from('cancer_docs')
    .select('id, title, slug, content, created_at, updated_at, author:users(name, avatar_url)')
    .eq('status', 'published')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch docs' }, { status: 500 });
  }

  return NextResponse.json({ docs });
}

