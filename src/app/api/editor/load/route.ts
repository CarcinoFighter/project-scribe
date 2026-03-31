import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { loadLocalDoc } from '@/lib/localFiles';

export async function GET(req: NextRequest) {
  const token = req.cookies.get('cw_token')?.value;

  if (!token) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id || id === 'ls-active') {
    return NextResponse.json({ error: 'Document not found or local-only draft' }, { status: 404 });
  }

  try {
    const doc = loadLocalDoc(id);

    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, doc });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

