import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const token = req.cookies.get('cw_token')?.value;

  if (!token) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const type = searchParams.get('type'); // blogs, survivor_stories, cancer_docs

  if (!id || !type || id === 'ls-active') {
    return NextResponse.json({ error: 'Document not found or local-only draft' }, { status: 404 });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from(type)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error(`Load error [${type}:${id}]:`, error);
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    // Normalize for the editor
    const doc = {
      id: data.id,
      title: data.title || data.name || 'Untitled',
      content: data.content || '',
      slug: data.slug || '',
      status: data.status || 'draft',
      type: type as any,
      author_id: data.author_id,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };

    return NextResponse.json({ success: true, doc });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
