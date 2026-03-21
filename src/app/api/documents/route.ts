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
    type: 'blog',
    title: b.title,
  }));

  const normalizedStories = (stories.data || []).map(s => ({
    ...s,
    type: 'article', // Map survivor stories to 'article' for current UI
    title: s.name,
  }));

  const normalizedDocs = (docs.data || []).map(d => ({
    ...d,
    type: 'article',
    title: d.title,
  }));

  const allDocs = [...normalizedBlogs, ...normalizedStories, ...normalizedDocs].sort(
    (a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime()
  );

  return NextResponse.json({ documents: allDocs });
}
