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

  const userId = payload.userId;

  try {
    // Fetch from all tables where user is the proofreader and status is 'proofreading'
    const [blogs, stories, docs, tasks] = await Promise.all([
      supabaseAdmin.from('blogs').select('*').eq('proofreader_id', userId).eq('status', 'proofreading'),
      supabaseAdmin.from('survivor_stories').select('*').eq('proofreader_id', userId).eq('status', 'proofreading'),
      supabaseAdmin.from('cancer_docs').select('*').eq('proofreader_id', userId).eq('status', 'proofreading'),
      supabaseAdmin.from('work_assignments').select('*').eq('proofreader_id', userId).eq('status', 'proofreading'),
    ]);

    if (blogs.error || stories.error || docs.error || tasks.error) {
      console.error('Error fetching proofreader queue:', { blogs: blogs.error, stories: stories.error, docs: docs.error, tasks: tasks.error });
      return NextResponse.json({ error: 'Failed to fetch proofreader queue' }, { status: 500 });
    }

    const allDocsRaw = [
      ...(blogs.data || []).map(b => ({ ...b, type: 'blogs' })),
      ...(stories.data || []).map(s => ({ ...s, type: 'survivor_stories' })),
      ...(docs.data || []).map(d => ({ ...d, type: 'cancer_docs' })),
      ...(tasks.data || []).map(t => ({ ...t, type: 'tasks', author_id: t.assigned_to })),
    ];

    if (allDocsRaw.length === 0) {
      return NextResponse.json({ documents: [] });
    }

    // Fetch author information
    const authorIds = Array.from(new Set(allDocsRaw.map(d => d.author_id).filter(Boolean)));
    
    let authorsMap: Record<string, any> = {};
    if (authorIds.length > 0) {
      const { data: authors, error: authorsError } = await supabaseAdmin
        .from('users')
        .select('id, name, avatar_url')
        .in('id', authorIds);
      
      if (!authorsError && authors) {
        authors.forEach(a => { authorsMap[a.id] = a; });
      }
    }

    // Normalize
    const documents = allDocsRaw.map(doc => ({
      ...doc,
      title: doc.type === 'survivor_stories' ? (doc.name || 'Untitled Story') : (doc.title || 'Untitled'),
      author: authorsMap[doc.author_id] || null
    })).sort(
      (a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime()
    );

    return NextResponse.json({ documents });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
