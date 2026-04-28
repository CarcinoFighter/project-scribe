import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { revalidateTagSafe } from '@/lib/revalidate';

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
  if (!payload) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  try {
    const { assignmentId } = await req.json();

    if (!assignmentId) {
      return NextResponse.json({ error: 'Missing assignmentId' }, { status: 400 });
    }

    // 1. Fetch the assignment
    const { data: assignment, error: fetchError } = await supabaseAdmin
      .from('work_assignments')
      .select('*')
      .eq('id', assignmentId)
      .single();

    if (fetchError || !assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    if (assignment.document_id) {
      return NextResponse.json({ error: 'Document already initialized', document_id: assignment.document_id });
    }

    // 2. Determine document type
    let table = '';
    if (assignment.category === 'article') table = 'cancer_docs';
    else if (assignment.category === 'blog') table = 'blogs';
    else if (assignment.category === 'survivor_story') table = 'survivor_stories';

    if (!table) {
      return NextResponse.json({ error: 'Invalid category for document initialization' }, { status: 400 });
    }

    // 3. Create the document
    const slug = slugify(assignment.title);
    const docData: any = {
      slug,
      content: '',
      status: 'draft',
      author_id: assignment.assigned_to,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (table === 'survivor_stories') docData.name = assignment.title;
    else docData.title = assignment.title;

    const { data: doc, error: docError } = await supabaseAdmin
      .from(table)
      .insert(docData)
      .select('id')
      .single();

    if (docError) {
      console.error('Error creating doc during init:', docError);
      return NextResponse.json({ error: 'Failed to create document' }, { status: 500 });
    }

    // 4. Update the assignment with the new document_id
    const { error: updateError } = await supabaseAdmin
      .from('work_assignments')
      .update({ document_id: doc.id })
      .eq('id', assignmentId);

    if (updateError) {
      console.error('Error updating assignment with doc_id:', updateError);
      // We still return success for the doc creation, but warn about the link
      return NextResponse.json({ 
        success: true, 
        document_id: doc.id, 
        warning: 'Document created but failed to link to assignment. Please refresh or update manually.' 
      });
    }

    // Invalidate caches
    revalidateTagSafe('all-tasks');
    if (assignment.assigned_to_ids) {
      assignment.assigned_to_ids.forEach((uid: string) => revalidateTagSafe(`user-tasks-${uid}`));
    } else if (assignment.assigned_to) {
      revalidateTagSafe(`user-tasks-${assignment.assigned_to}`);
    }

    return NextResponse.json({ success: true, document_id: doc.id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

