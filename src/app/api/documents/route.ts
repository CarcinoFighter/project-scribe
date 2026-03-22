import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(req: NextRequest) {
  const token = req.cookies.get('cw_token')?.value;

  if (!token) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  // Fetch from all 3 tables
  const [blogs, stories, docs] = await Promise.all([
    supabaseAdmin.from('blogs').select('*').eq('author_id', payload.userId),
    supabaseAdmin.from('survivor_stories').select('*').eq('author_id', payload.userId),
    supabaseAdmin.from('cancer_docs').select('*').eq('author_id', payload.userId),
  ]);

  if (blogs.error || stories.error || docs.error) {
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
  }

  // Normalize data for the dashboard
  const normalizedBlogs = (blogs.data || []).map(b => ({
    ...b,
    type: 'blogs',
    title: b.title || 'Untitled Blog',
    excerpt: b.excerpt || 'No summary available.',
    tags: b.tags || [],
    words: b.words || 0,
    readTime: b.read_time || Math.ceil((b.content?.length || 0) / 1000) || 1,
    date: b.updated_at || b.created_at,
  }));

  const normalizedStories = (stories.data || []).map(s => ({
    ...s,
    type: 'survivor_stories',
    title: s.name || 'Untitled Story',
    excerpt: s.excerpt || 'No summary available.',
    tags: s.tags || [],
    words: s.words || 0,
    readTime: s.read_time || Math.ceil((s.content?.length || 0) / 1000) || 1,
    date: s.updated_at || s.created_at,
  }));

  const normalizedDocs = (docs.data || []).map(d => ({
    ...d,
    type: 'cancer_docs',
    title: d.title || 'Untitled Document',
    excerpt: d.excerpt || 'No summary available.',
    tags: d.tags || [],
    words: d.words || 0,
    readTime: d.read_time || Math.ceil((d.content?.length || 0) / 1000) || 1,
    date: d.updated_at || d.created_at,
  }));

  const allDocs = [...normalizedBlogs, ...normalizedStories, ...normalizedDocs].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return NextResponse.json({ documents: allDocs });
}

export async function DELETE(req: NextRequest) {
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
  const type = searchParams.get('type');

  if (!id || !type) {
    return NextResponse.json({ error: 'Missing document id or type' }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from(type)
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

