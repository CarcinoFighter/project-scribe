import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { sendPushToUser } from '@/lib/pushNotify';

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
      assigned_to, // Now expected to be an array of UUIDs
      title,
      description,
      status,
      priority,
      due_date,
      category,
      category_icon,
      department,
    } = await req.json();

    if (!assigned_to || !Array.isArray(assigned_to) || assigned_to.length === 0 || !title || !category) {
      return NextResponse.json({ error: 'Missing required fields or invalid assigned_to' }, { status: 400 });
    }

    // Validation for single-assignee categories
    if ((category === 'blog' || category === 'survivor_story') && assigned_to.length > 1) {
      return NextResponse.json({ error: 'Only one person can be assigned to blogs and stories' }, { status: 400 });
    }

    // For content types, auto-create a draft document
    let document_id: string | null = null;
    const primaryAssignee = assigned_to[0];

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
          author_ids: assigned_to, // Array for articles
          author_id: primaryAssignee, // Keep old for compatibility if needed
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
          author_id: primaryAssignee,
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
          author_id: primaryAssignee,
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
        assigned_to: primaryAssignee, // Keep for backward compatibility
        assigned_to_ids: assigned_to, // New array column
        assigned_by: payload.userId,
        title,
        description: description || '',
        category,
        category_icon: category_icon || null,
        department: department || null,
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
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Fire push notification to all assignees (non-blocking)
    assigned_to.forEach(uid => {
      sendPushToUser(uid, {
        title: '📋 New task assigned to you',
        body: title,
        tag: `task-${data.id}`,
        url: '/tasks',
      }).catch(() => {});
    });

    return NextResponse.json({ success: true, assignment: data, document_id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

