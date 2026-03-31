import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { saveLocalDoc } from '@/lib/localFiles';

export async function POST(req: NextRequest) {
  const token = req.cookies.get('cw_token')?.value;

  if (!token) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  const { id, title, content, contentType, status } = await req.json();

  if (!title || !contentType) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Save to local filesystem
  try {
    const newId = saveLocalDoc({
      id: id || '',
      type: contentType as any,
      status: (status === 'review' || status === 'in_review') ? 'review' : 'draft',
      title: title,
      content: content || '',
      tags: [],
      starred: false
    });

    return NextResponse.json({ success: true, doc: { id: newId } });
  } catch (err: any) {
    console.error('Save error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

