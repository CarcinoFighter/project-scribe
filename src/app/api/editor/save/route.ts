import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const token = req.cookies.get('cw_token')?.value;

  if (!token) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  const { id, title, slug, content, contentType, status, tags } = await req.json();

  if (!title || !slug || !contentType) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Map contentType to table name
  const table = contentType; // survivor_stories, blogs, cancer_docs
  
  // Handle 'name' vs 'title' column
  const data: any = {
    slug,
    content,
    status,
    tags,
    author_id: payload.userId,
    updated_at: new Date().toISOString(),
  };

  if (table === 'survivor_stories') {
    data.name = title;
  } else {
    data.title = title;
  }

  let result;
  if (id && id !== 'ls-active') {
    // Update existing
    result = await supabaseAdmin
      .from(table)
      .update(data)
      .eq('id', id)
      .select()
      .single();
  } else {
    // Insert new
    result = await supabaseAdmin
      .from(table)
      .insert([data])
      .select()
      .single();
  }

  if (result.error) {
    console.error('Save error:', result.error);
    return NextResponse.json({ error: result.error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, doc: result.data });
}
