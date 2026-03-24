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
      return NextResponse.json({ error: 'Failed to add comment' }, { status: 500 });
    }

    return NextResponse.json({ comment });
  } catch (err) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
