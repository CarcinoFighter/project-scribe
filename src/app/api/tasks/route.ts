import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { unstable_cache } from 'next/cache';

// Cache specifically based on whether it's a global or user-specific fetch
const getAssignmentsCached = unstable_cache(
  async (userId: string) => {
    let query = supabaseAdmin.from('work_assignments').select('*');
    
    query = query.or(`assigned_to.eq.${userId},assigned_to_ids.cs.{${userId}},proofreader_id.eq.${userId}`);

    const { data: assignments, error } = await query.order('due_date', { ascending: true });

    if (error) throw error;
    return assignments;
  },
  ['user-assignments'],
  { revalidate: 300 } // 5 minutes
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
    // 1. Fetch user department to check for Leadership
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('department')
      .eq('id', payload.userId)
      .single();

    if (userError) throw userError;

    const isLeadership = payload.adminAccess || userData.department === 'Leadership';
    
    // 2. Fetch assignments (only user-specific)
    const assignments = await getAssignmentsCached(payload.userId);
    
    // 3. Enrich assignments with user info and document titles
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

    return NextResponse.json({ assignments: enriched });
  } catch (error: any) {
    console.error('Fetch assignments error:', error);
    return NextResponse.json({ error: 'Failed to fetch assignments' }, { status: 500 });
  }
}


export async function PATCH(req: NextRequest) {
  const token = req.cookies.get('cw_token')?.value;

  if (!token) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

  try {
    const { 
      id, status, submission_media_url, 
      assigned_to_ids, priority, due_date, title, description,
      proofreader_id, type 
    } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    // 1. Fetch user department to verify permission level
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('department')
      .eq('id', payload.userId)
      .single();

    if (userError) throw userError;

    const isLeadership = payload.adminAccess || userData.department === 'Leadership';

    const updateData: any = {
      updated_at: new Date().toISOString() 
    };

    if (status !== undefined) {
      let s = status;
      if (status === 'published') s = 'done';
      updateData.status = s;
    }
    if (proofreader_id !== undefined) updateData.proofreader_id = proofreader_id;

    // Determine target table and filter table-specific columns
    let table = 'work_assignments';
    if (type === 'blogs') table = 'blogs';
    else if (type === 'survivor_stories') table = 'survivor_stories';
    else if (type === 'cancer_docs') table = 'cancer_docs';

    // Columns only for work_assignments
    if (table === 'work_assignments') {
      if (priority !== undefined) updateData.priority = priority;
      if (due_date !== undefined) updateData.due_date = due_date;
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      
      // Allow Leadership or Admin to update assigned_to_ids
      if (assigned_to_ids !== undefined && isLeadership) {
        updateData.assigned_to_ids = assigned_to_ids;
      }

      if (submission_media_url !== undefined) {
        updateData.submission_media_url = submission_media_url;
        updateData.submitted_at = new Date().toISOString();
      }
    }

    let query = supabaseAdmin
      .from(table)
      .update(updateData)
      .eq('id', id);

    // Filter to own tasks if not Leadership/Admin
    if (!isLeadership && table === 'work_assignments') {
      query = query.or(`assigned_to.eq.${payload.userId},assigned_to_ids.cs.{${payload.userId}},proofreader_id.eq.${payload.userId}`);
    }

    const { data, error } = await query.select();

    if (error) {
      console.error('Update operation error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'No records updated' }, { status: 404 });
    }

    const updated = data[0];

    // --- Bi-directional Sync Logic ---
    
    // 1. Sync content table -> work_assignments (Existing logic refined)
    if (table !== 'work_assignments') {
      await supabaseAdmin
        .from('work_assignments')
        .update({
          status: updateData.status,
          proofreader_id: updateData.proofreader_id,
          updated_at: new Date().toISOString(),
        })
        .eq('document_id', id);
    } 
    // 2. Sync work_assignments -> content table (New logic)
    else if (updated.document_id && updated.category) {
      let docTable = '';
      if (updated.category === 'article') docTable = 'cancer_docs';
      else if (updated.category === 'blog') docTable = 'blogs';
      else if (updated.category === 'survivor_story') docTable = 'survivor_stories';

      if (docTable) {
        const docUpdate: any = { updated_at: new Date().toISOString() };
        
        if (status !== undefined) {
          // Status Mapping
          if (status === 'done') docUpdate.status = 'published';
          else if (status === 'in_progress') docUpdate.status = 'draft';
          else docUpdate.status = status;
        }
        
        if (title !== undefined) {
          if (docTable === 'survivor_stories') docUpdate.name = title;
          else docUpdate.title = title;
        }

        await supabaseAdmin
          .from(docTable)
          .update(docUpdate)
          .eq('id', updated.document_id);
      }
    }

    // Notification Logic
    if (submission_media_url !== undefined && updated.assigned_by) {
      const { notifyUser } = await import('@/lib/pushNotify');
      await notifyUser(updated.assigned_by, {
        title: '📤 Task submitted',
        body: `"${updated.title}" has been submitted for review.`,
        url: '/queues',
      }).catch(e => console.error('Notify assigner failed:', e));
    }

    return NextResponse.json({ success: true, assignment: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
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

  try {
    // 1. Fetch user department to verify permission level
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('department')
      .eq('id', payload.userId)
      .single();

    if (userError) throw userError;

    const isLeadership = payload.adminAccess || userData.department === 'Leadership';

    if (!isLeadership) {
      return NextResponse.json({ error: 'Delete permissions required (Leadership or Admin)' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    // Verify that the current user assigned the task
    const { data: task, error: fetchError } = await supabaseAdmin
      .from('work_assignments')
      .select('assigned_by')
      .eq('id', id)
      .single();

    if (fetchError || !task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    if (task.assigned_by !== payload.userId) {
      return NextResponse.json({ error: 'You can only delete tasks you assigned' }, { status: 403 });
    }

    const { error } = await supabaseAdmin
      .from('work_assignments')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Delete assignment error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

