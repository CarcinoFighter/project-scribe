import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { saveLocalDoc, deleteLocalDoc } from '@/lib/localFiles';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { diff_match_patch } from 'diff-match-patch';

const dmp = new diff_match_patch();

export async function POST(req: NextRequest) {
  const token = req.cookies.get('cw_token')?.value;

  if (!token) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  const userId = payload.userId;
  const { id, title, content, patch, contentType, status, slug } = await req.json();

  if (!title || !contentType) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    let table = '';
    if (contentType === 'blogs') table = 'blogs';
    else if (contentType === 'survivor_stories') table = 'survivor_stories';
    else if (contentType === 'cancer_docs') table = 'cancer_docs';

    if (!table) {
      return NextResponse.json({ error: 'Invalid content type' }, { status: 400 });
    }

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    let finalContent = content || '';

    if (isUuid && patch) {
      // Advanced: Apply patch to the current content in the database
      const { data: currentDoc, error: fetchError } = await supabaseAdmin
        .from(table)
        .select('content')
        .eq('id', id)
        .single();
      
      if (!fetchError && currentDoc) {
        try {
          const patches = dmp.patch_fromText(patch);
          const [mergedContent, results] = dmp.patch_apply(patches, currentDoc.content || '');
          
          // Check if any part of the patch was actually applied
          if (results.some(r => r === true)) {
            finalContent = mergedContent;
          } else {
            // If all patches failed or were redundant, keep the current content
            finalContent = currentDoc.content || '';
          }
        } catch (err) {
          console.error('Patch application failed on server:', err);
          finalContent = currentDoc.content || ''; // Be safe, don't overwrite with garbage
        }
      }
    }

    const docData: any = {
      content: finalContent,
      status: status,
      updated_at: new Date().toISOString(),
    };

    // Only set author_id for new documents
    if (!isUuid) {
      docData.author_id = userId;
    }

    if (table === 'survivor_stories') {
      docData.name = title;
    } else {
      docData.title = title;
    }

    if (slug) {
      docData.slug = slug;
    } else {
      docData.slug = title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    }

    let finalId = id;

    if (isUuid) {
      // Update existing Supabase record
      const { error: updateError } = await supabaseAdmin
        .from(table)
        .update(docData)
        .eq('id', id);

      if (updateError) throw updateError;
    } else {
      // Insert new Supabase record
      const { data: newDoc, error: insertError } = await supabaseAdmin
        .from(table)
        .insert({
          ...docData,
          created_at: new Date().toISOString()
        })
        .select('id')
        .single();

      if (insertError) throw insertError;
      finalId = newDoc.id;

      // Cleanup local draft if it was promoted from filesystem
      if (id && !isUuid) {
        deleteLocalDoc(id);
      }
    }

    // Sync status and title back to the linked work_assignment
    if (status || title) {
      let taskStatus = status;
      if (status === 'draft') taskStatus = 'in_progress';
      else if (status === 'published') taskStatus = 'done';
      // Specialized workflow statuses (ready_for_proofreading, etc.) are kept as-is

      const taskUpdate: any = { updated_at: new Date().toISOString() };
      if (status) taskUpdate.status = taskStatus;
      if (title)  taskUpdate.title = title;

      await supabaseAdmin
        .from('work_assignments')
        .update(taskUpdate)
        .eq('document_id', finalId);
    }

    return NextResponse.json({ success: true, doc: { id: finalId } });
  } catch (err: any) {
    console.error('Save error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

