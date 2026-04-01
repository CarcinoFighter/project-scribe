import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getLocalDocs } from '@/lib/localFiles';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { countWords, excerptFrom } from '@/lib/utils';

export async function GET(req: NextRequest) {
  const token = req.cookies.get('cw_token')?.value;

  if (!token) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  const userId = payload.userId;

  try {
    // 1. Fetch from local filesystem
    const localDocs = getLocalDocs();

    // 2. Fetch from Supabase
    const [blogsRes, storiesRes, docsRes] = await Promise.all([
      supabaseAdmin
        .from('blogs')
        .select('*')
        .eq('author_id', userId),
      supabaseAdmin
        .from('survivor_stories')
        .select('*')
        .eq('author_id', userId),
      supabaseAdmin
        .from('cancer_docs')
        .select('*')
        .eq('author_id', userId),
    ]);

    const supabaseDocs: any[] = [];

    const processSupabase = (data: any[] | null, type: string) => {
      if (!data) return;
      data.forEach(doc => {
        const content = doc.content || '';
        const words = countWords(content);
        supabaseDocs.push({
          id: doc.id,
          type: type as any,
          title: doc.title || doc.name || 'Untitled',
          excerpt: excerptFrom(content),
          words: words,
          status: doc.status || 'draft',
          date: (doc.updated_at || doc.created_at || new Date().toISOString()).split('T')[0],
          readTime: Math.max(1, Math.round(words / 200)),
          tags: doc.tags || [],
          starred: false,
          content: content,
          slug: doc.slug
        });
      });
    };

    processSupabase(blogsRes.data, 'blogs');
    processSupabase(storiesRes.data, 'survivor_stories');
    processSupabase(docsRes.data, 'cancer_docs');

    // Combine and sort by date descending
    const allDocs = [...localDocs, ...supabaseDocs].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return NextResponse.json({ documents: allDocs });
  } catch (err: any) {
    console.error('Fetch documents error:', err);
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

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const type = searchParams.get('type');

  if (!id) {
    return NextResponse.json({ error: 'Missing document id' }, { status: 400 });
  }

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

  try {
    if (isUuid) {
      if (!type) {
        return NextResponse.json({ error: 'Type is required for remote deletion' }, { status: 400 });
      }
      
      let table = '';
      if (type === 'blogs') table = 'blogs';
      else if (type === 'survivor_stories') table = 'survivor_stories';
      else if (type === 'cancer_docs') table = 'cancer_docs';

      if (!table) return NextResponse.json({ error: 'Invalid type' }, { status: 400 });

      const { error } = await supabaseAdmin
        .from(table)
        .delete()
        .eq('id', id);

      if (error) throw error;
    } else {
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(process.cwd(), 'drafts', `${id}.md`);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

