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

  // Fetch ALL assignments
  const { data: assignments, error: assignmentsError } = await supabaseAdmin
    .from('work_assignments')
    .select('*')
    .order('created_at', { ascending: false });

  if (assignmentsError) {
    console.error('Error fetching all assignments:', assignmentsError);
    return NextResponse.json({ error: 'Failed to fetch assignments' }, { status: 500 });
  }

  // Manually fetch user info for all unique IDs involved
  const userIds = new Set<string>();
  assignments.forEach((a: any) => {
    if (a.assigned_to_ids && Array.isArray(a.assigned_to_ids)) {
      a.assigned_to_ids.forEach((id: string) => userIds.add(id));
    } else if (a.assigned_to) {
      userIds.add(a.assigned_to);
    }
    if (a.assigned_by) userIds.add(a.assigned_by);
  });

  if (userIds.size > 0) {
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, name, username, avatar_url, department')
      .in('id', Array.from(userIds));

    if (!usersError && users) {
      const userMap = new Map(users.map(u => [u.id, u]));
      const enriched = assignments.map((a: any) => {
        const assigner = a.assigned_by ? userMap.get(a.assigned_by) : null;
        let assignees: any[] = [];
        
        if (a.assigned_to_ids && Array.isArray(a.assigned_to_ids)) {
          assignees = a.assigned_to_ids.map((id: string) => userMap.get(id)).filter(Boolean);
        } else if (a.assigned_to) {
          const u = userMap.get(a.assigned_to);
          if (u) assignees = [u];
        }

        return {
          ...a,
          assignees, // Return array
          assignee: assignees[0] || null, // Keep for backward compatibility
          assigner
        };
      });
      return NextResponse.json({ assignments: enriched });
    }
  }

  return NextResponse.json({ assignments });
}

