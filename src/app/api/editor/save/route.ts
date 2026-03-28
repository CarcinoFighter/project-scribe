import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: NextRequest) {
  const token = req.cookies.get('cw_token')?.value;

  if (!token) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  const { id, title, slug, content, contentType, status, tags, author_id: providedAuthorId } = await req.json();

  if (!title || !slug || !contentType) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Map contentType to table name
  const table = contentType; // survivor_stories, blogs, cancer_docs
  const dbStatus = status === 'review' ? 'in_review' : status;
  
  // Predict if it's a completely new doc
  let isNewDoc = !id || id === 'ls-active' || id.startsWith('new-');
  let isMovingTable = false;
  let oldTableToCleanup = '';
  
  // 1. If it's an existing document, check current table and potential migration
  let currentAuthorId = providedAuthorId;
  if (!isNewDoc) {
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from(table)
      .select('author_id, status')
      .eq('id', id)
      .single();

    if (fetchError) {
      // Document not found in target table — check other tables for a cross-table migration
      let foundInOtherTable = false;
      const otherTables = ['blogs', 'survivor_stories', 'cancer_docs'].filter(t => t !== table);
      for (const ot of otherTables) {
        const { data: found } = await supabaseAdmin.from(ot).select('author_id, status').eq('id', id).single();
        if (found) {
          isMovingTable = true;
          oldTableToCleanup = ot;
          currentAuthorId = found.author_id;
          isNewDoc = true; // Treat as insert into new table
          foundInOtherTable = true;
          break;
        }
      }
      // Not found anywhere — treat as a brand-new insert to avoid a zero-row UPDATE
      if (!foundInOtherTable) {
        isNewDoc = true;
      }
    } else if (existing) {
      currentAuthorId = existing.author_id;

      // Validation: Only admins can publish
      if (status === 'published' && existing.status !== 'published') {
        if (!payload.adminAccess) {
          return NextResponse.json({ error: 'Only administrators can publish content.' }, { status: 403 });
        }
        // Validation: Admins cannot self-approve
        if (currentAuthorId === payload.userId) {
          return NextResponse.json({ error: 'Self-approval is not allowed. Another admin must approve this content.' }, { status: 403 });
        }
      }
    }
  } else {
    // For NEW documents, ensure they don't start as published if they are not admin
    if (status === 'published' && !payload.adminAccess) {
      return NextResponse.json({ error: 'Only administrators can create published content.' }, { status: 403 });
    }
  }

  // Handle 'name' vs 'title' column
  const data: any = {
    slug,
    content,
    status: dbStatus,
    updated_at: new Date().toISOString(),
  };

  // Only include tags for supported content types
  if (table !== 'cancer_docs') {
    data.tags = tags || [];
  }

  if (table === 'survivor_stories') {
    data.name = title;
  } else {
    data.title = title;
  }

  let result;
  if (!isNewDoc) {
    // Update existing
    result = await supabaseAdmin
      .from(table)
      .update(data)
      .eq('id', id)
      .select()
      .single();
  } else {
    // Insert new
    data.author_id = currentAuthorId || payload.userId;
    data.created_at = new Date().toISOString();
    if (isMovingTable && id) {
      data.id = id; // Preserve ID across migration
    }
    result = await supabaseAdmin
      .from(table)
      .insert([data])
      .select()
      .single();

    // If was moving tables, cleanup the old one on success
    if (isMovingTable && !result.error && oldTableToCleanup) {
      await supabaseAdmin.from(oldTableToCleanup).delete().eq('id', id);
    }
  }

  if (result.error) {
    console.error('Save error:', result.error);
    return NextResponse.json({ error: result.error.message }, { status: 500 });
  }

  // 2. Synchronize status with work_assignments if applicable
  if (!isNewDoc) {
     let assignmentStatus = '';
     if (dbStatus === 'in_review') assignmentStatus = 'in_review';
     else if (dbStatus === 'published') assignmentStatus = 'done';

     if (assignmentStatus) {
       await supabaseAdmin
         .from('work_assignments')
         .update({ status: assignmentStatus, updated_at: new Date().toISOString() })
         .eq('document_id', id);
     }
  }

  return NextResponse.json({ success: true, doc: result.data });
}

