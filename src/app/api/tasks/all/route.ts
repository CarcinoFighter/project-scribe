import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { unstable_cache } from 'next/cache';

const getAllAssignmentsCached = unstable_cache(
  async () => {
    // Fetch ALL assignments
    const { data: assignments, error: assignmentsError } = await supabaseAdmin
      .from('work_assignments')
      .select('*')
      .order('created_at', { ascending: false });

    if (assignmentsError) throw assignmentsError;
    if (!assignments) return [];

    // Manually fetch user info and document titles for all unique IDs involved
    const userIds = new Set<string>();
    const docIdsByCategory: Record<string, Set<string>> = {
      'article': new Set(),
      'blog': new Set(),
      'survivor_story': new Set()
    };

    assignments.forEach((a: any) => {
      if (a.assigned_to_ids && Array.isArray(a.assigned_to_ids)) {
        a.assigned_to_ids.forEach((id: string) => userIds.add(id));
      } else if (a.assigned_to) {
        userIds.add(a.assigned_to);
      }
      if (a.assigned_by) userIds.add(a.assigned_by);
      if (a.proofreader_id) userIds.add(a.proofreader_id);

      if (a.document_id && docIdsByCategory[a.category]) {
        docIdsByCategory[a.category].add(a.document_id);
      }
    });

    const [usersRes, ...docResList] = await Promise.all([
      userIds.size > 0 ? supabaseAdmin.from('users').select('id, name, username, avatar_url, department').in('id', Array.from(userIds)) : Promise.resolve({ data: [] }),
      ...['article', 'blog', 'survivor_story'].map(async (cat) => {
        const ids = Array.from(docIdsByCategory[cat]);
        if (ids.length === 0) return { cat, data: [] };
        const table = cat === 'article' ? 'cancer_docs' : (cat === 'blog' ? 'blogs' : 'survivor_stories');
        const { data } = await supabaseAdmin.from(table).select(cat === 'survivor_story' ? 'id, name' : 'id, title').in('id', ids);
        return { cat, data: data || [] };
      })
    ]);

    const userMap = new Map((usersRes.data || []).map((u: any) => [u.id, u]));
    const docTitleMap = new Map();
    docResList.forEach((res: any) => {
      res.data.forEach((d: any) => {
        docTitleMap.set(d.id, d.title || d.name);
      });
    });

    const enriched = assignments.map((a: any) => {
      const assigner = a.assigned_by ? userMap.get(a.assigned_by) : null;
      const proofreader = a.proofreader_id ? userMap.get(a.proofreader_id) : null;
      let assignees: any[] = [];
      
      if (a.assigned_to_ids && Array.isArray(a.assigned_to_ids)) {
        assignees = a.assigned_to_ids.map((id: string) => userMap.get(id)).filter(Boolean);
      } else if (a.assigned_to) {
        const u = userMap.get(a.assigned_to);
        if (u) assignees = [u];
      }

      return {
        ...a,
        assignees,
        assignee: assignees[0] || null,
        assigner,
        proofreader,
        document_title: docTitleMap.get(a.document_id) || null
      };
    });

    return enriched;
  },
  ['all-assignments-cache'],
  { revalidate: 300, tags: ['all-tasks'] }
);

export async function GET(req: NextRequest) {
  const token = req.cookies.get('cw_token')?.value;

  if (!token) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  try {
    // 1. Fetch user department to verify permission level
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('department')
      .eq('id', payload.userId)
      .single();

    if (userError) {
      return NextResponse.json({ error: 'Failed to verify permissions' }, { status: 500 });
    }

    const isLeadership = payload.adminAccess || userData.department === 'Leadership';

    if (!isLeadership) {
      return NextResponse.json({ error: 'Leadership or Admin access required' }, { status: 403 });
    }

    const assignments = await getAllAssignmentsCached();

    return NextResponse.json({ assignments });
  } catch (err: any) {
    console.error('All assignments API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
