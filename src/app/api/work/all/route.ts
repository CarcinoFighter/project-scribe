import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

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
    if (a.assigned_to) userIds.add(a.assigned_to);
    if (a.assigned_by) userIds.add(a.assigned_by);
  });

  if (userIds.size > 0) {
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, name, username, avatar_url, department')
      .in('id', Array.from(userIds));

    if (!usersError && users) {
      const userMap = new Map(users.map(u => [u.id, u]));
      const enriched = assignments.map((a: any) => ({
        ...a,
        assignee: a.assigned_to ? userMap.get(a.assigned_to) : null,
        assigner: a.assigned_by ? userMap.get(a.assigned_by) : null,
      }));
      return NextResponse.json({ assignments: enriched });
    }
  }

  return NextResponse.json({ assignments });
}
