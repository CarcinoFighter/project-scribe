import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(req: NextRequest) {
  const token = req.cookies.get('cw_token')?.value;

  if (!token) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const payload = verifyToken(token);
  if (!payload || !payload.adminAccess) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  try {
    // Fetch from all 4 tables documents/tasks in 'review' status (no join)
    const [blogs, stories, docs, tasks] = await Promise.all([
      supabaseAdmin.from('blogs').select('*').in('status', ['in_review', 'ready_for_proofreading', 'ready_for_upload']),
      supabaseAdmin.from('survivor_stories').select('*').in('status', ['in_review', 'ready_for_proofreading', 'ready_for_upload']),
      supabaseAdmin.from('cancer_docs').select('*').in('status', ['in_review', 'ready_for_proofreading', 'ready_for_upload']),
      supabaseAdmin.from('work_assignments').select('*').in('status', ['in_review', 'ready_for_proofreading', 'ready_for_upload']).eq('category', 'task'),
    ]);

    if (blogs.error || stories.error || docs.error || tasks.error) {
      console.error('Error fetching review queue docs:', { blogs: blogs.error, stories: stories.error, docs: docs.error, tasks: tasks.error });
      return NextResponse.json({ error: 'Failed to fetch review queue documents' }, { status: 500 });
    }

    const allDocsRaw = [
      ...(blogs.data || []).map(b => ({ ...b, type: 'blogs' })),
      ...(stories.data || []).map(s => ({ ...s, type: 'survivor_stories' })),
      ...(docs.data || []).map(d => ({ ...d, type: 'cancer_docs' })),
      ...(tasks.data || []).map(t => ({ ...t, type: 'tasks', author_id: t.assigned_to, assigned_by: t.assigned_by })),
    ];

    if (allDocsRaw.length === 0) {
      return NextResponse.json({ documents: [] });
    }

    // Fetch author information separately
    const authorIds = Array.from(new Set(allDocsRaw.map(d => d.author_id).filter(Boolean)));
    
    const authorsMap: Record<string, any> = {};
    if (authorIds.length > 0) {
      const { data: authors, error: authorsError } = await supabaseAdmin
        .from('users')
        .select('id, name, avatar_url')
        .in('id', authorIds);
      
      if (!authorsError && authors) {
        authors.forEach(a => { authorsMap[a.id] = a; });
      }
    }

    // Normalize and attach authors
    const allReviewDocs = allDocsRaw.map(doc => ({
      ...doc,
      title: doc.type === 'survivor_stories' ? (doc.name || 'Untitled Story') : (doc.title || 'Untitled'),
      author: authorsMap[doc.author_id] || null
    })).sort(
      (a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime()
    );

    return NextResponse.json({ documents: allReviewDocs });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

