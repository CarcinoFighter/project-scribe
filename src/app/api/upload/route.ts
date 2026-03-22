import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const token = req.cookies.get('cw_token')?.value;

  if (!token) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const timestamp = Date.now();
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '');
    const path = `${payload.userId}/${timestamp}-${cleanFileName}`;

    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('task-submissions')
      .upload(path, file, { upsert: true });

    if (uploadError) {
      console.error('Upload Error:', uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }
    
    const { data } = supabaseAdmin.storage.from('task-submissions').getPublicUrl(uploadData.path);
    
    return NextResponse.json({ success: true, url: data.publicUrl });
  } catch (err: any) {
    console.error('Unexpected Upload Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
