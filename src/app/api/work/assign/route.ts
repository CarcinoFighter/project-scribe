import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    + '-' + Date.now();
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get('cw_token')?.value;

  if (!token) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const payload = verifyToken(token);
  if (!payload || !payload.adminAccess) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  try {
    const { 
      assigned_to, 
      title, 
      description, 
      status, 
      priority, 
      due_date, 
      category, 
      department 
    } = await req.json();

    if (!assigned_to || !title || !category) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // For content types, auto-create a draft document
    let document_id: string | null = null;

    if (category === 'article') {
      // Create draft in cancer_docs
      const slug = slugify(title);
      const { data: doc, error: docError } = await supabaseAdmin
        .from('cancer_docs')
        .insert({
          title,
          slug,
          content: '',
          status: 'draft',
          author_id: assigned_to,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (docError) {
        console.error('Error creating cancer_doc draft:', docError);
      } else {
        document_id = doc.id;
      }
    } else if (category === 'blog') {
      // Create draft in blogs
      const slug = slugify(title);
      const { data: doc, error: docError } = await supabaseAdmin
        .from('blogs')
        .insert({
          title,
          slug,
          content: '',
          status: 'draft',
          author_id: assigned_to,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (docError) {
        console.error('Error creating blog draft:', docError);
      } else {
        document_id = doc.id;
      }
    } else if (category === 'survivor_story') {
      // Create draft in survivor_stories
      const slug = slugify(title);
      const { data: doc, error: docError } = await supabaseAdmin
        .from('survivor_stories')
        .insert({
          name: title,
          slug,
          content: '',
          status: 'draft',
          author_id: assigned_to,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (docError) {
        console.error('Error creating survivor_story draft:', docError);
      } else {
        document_id = doc.id;
      }
    }

    const { data, error } = await supabaseAdmin
      .from('work_assignments')
      .insert({
        assigned_to,
        assigned_by: payload.userId,
        title,
        description: description || '',
        category,
        department: category === 'task' ? department : null,
        status: status || 'todo',
        priority: priority || 'normal',
        due_date,
        document_id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Assignment error:', error);
      // If document_id column doesn't exist, retry without it
      if (error.message?.includes('document_id')) {
        const { data: fallback, error: fallbackError } = await supabaseAdmin
          .from('work_assignments')
          .insert({
            assigned_to,
            assigned_by: payload.userId,
            title,
            description: description || '',
            category,
            department: category === 'task' ? department : null,
            status: status || 'todo',
            priority: priority || 'normal',
            due_date,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (fallbackError) {
          return NextResponse.json({ error: fallbackError.message }, { status: 500 });
        }
        return NextResponse.json({ success: true, assignment: fallback, document_id });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, assignment: data, document_id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

