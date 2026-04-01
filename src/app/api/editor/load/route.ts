import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { loadLocalDoc } from '@/lib/localFiles';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

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
  const type = searchParams.get('type') as 'blogs' | 'survivor_stories' | 'cancer_docs' | null;

  if (!id || id === 'ls-active') {
    return NextResponse.json({ error: 'Document not found or local-only draft' }, { status: 404 });
  }

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

  try {
    let doc: any = null;

    if (isUuid) {
      // Fetch from Supabase
      const tables = type ? [type] : ['blogs', 'survivor_stories', 'cancer_docs'];
      
      for (const table of tables) {
        const { data, error } = await supabaseAdmin
          .from(table)
          .select('*')
          .eq('id', id)
          .single();
        
        if (!error && data) {
          doc = {
            id: data.id,
            type: table,
            title: data.title || data.name || 'Untitled',
            content: data.content || '',
            status: data.status || 'draft',
            slug: data.slug,
            author_id: data.author_id,
            date: (data.updated_at || data.created_at || new Date().toISOString()).split('T')[0]
          };
          break;
        }
      }
    }

    // Fallback to local if not found in Supabase (or not a UUID)
    if (!doc) {
      doc = loadLocalDoc(id);
    }

    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, doc });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

