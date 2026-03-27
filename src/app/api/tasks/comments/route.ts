import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(req: NextRequest) {
  const token = req.cookies.get('cw_token')?.value;
  if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const payload = verifyToken(token);
  if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const taskId = searchParams.get('taskId');

  if (!taskId) return NextResponse.json({ error: 'taskId is required' }, { status: 400 });

  const { data: comments, error } = await supabaseAdmin
    .from('task_comments')
    .select('*, user:users(id, name, avatar_url)')
    .eq('task_id', taskId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }

  return NextResponse.json({ comments });
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get('cw_token')?.value;
  if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const payload = verifyToken(token);
  if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

  try {
    const { taskId, content, type = 'comment' } = await req.json();

    if (!taskId || !content) {
      return NextResponse.json({ error: 'taskId and content are required' }, { status: 400 });
    }

    const { data: existingAssignment } = await supabaseAdmin
      .from('work_assignments')
      .select('id')
      .eq('id', taskId)
      .single();

    if (!existingAssignment) {
      const tables = ['blogs', 'survivor_stories', 'cancer_docs'];
      let docTitle = 'Document Task';
      let authorId = payload.userId;
      let category = 'article';

      for (const t of tables) {
        const { data: doc } = await supabaseAdmin.from(t).select('title, name, author_id').eq('id', taskId).single();
        if (doc) {
          docTitle = doc.title || doc.name || 'Untitled Document';
          authorId = doc.author_id || authorId;
          category = t === 'blogs' ? 'blog' : (t === 'survivor_stories' ? 'survivor_story' : 'article');
          break;
        }
      }

      const { error: stubError } = await supabaseAdmin.from('work_assignments').insert({
        id: taskId,
        title: docTitle,
        status: 'proofreading',
        assigned_to: authorId,
        assigned_by: payload.userId,
        category: category,
        priority: 'normal',
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      if (stubError) {
        console.error('Failed to create stub assignment:', stubError);
      }
    }
    // -------------------------------------------------------

    const { data: comment, error } = await supabaseAdmin
      .from('task_comments')
      .insert({
        task_id: taskId,
        user_id: payload.userId,
        content,
        type
      })
      .select('*, user:users(id, name, avatar_url)')
      .single();

    if (error) {
      console.error('Error adding comment:', error);
      return NextResponse.json({
        error: 'Failed to add comment',
        details: error.message,
        hint: error.hint,
        code: error.code
      }, { status: 500 });
    }

    return NextResponse.json({ comment });
  } catch (err: any) {
    return NextResponse.json({ error: 'Invalid request', details: err.message }, { status: 400 });
  }
}
