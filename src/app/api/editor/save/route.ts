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

  const { id, title, slug, content, contentType, status, tags, author_id: providedAuthorId } = await req.json();

  if (!title || !slug || !contentType) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Map contentType to table name
  const table = contentType; // survivor_stories, blogs, cancer_docs
  const dbStatus = status === 'review' ? 'in_review' : status;
  
  // Predict if it's a completely new doc
  const isNewDoc = !id || id === 'ls-active' || id.startsWith('new-');
  
  // 1. If it's an existing document, check current state for status transitions
  let currentAuthorId = providedAuthorId;
  if (!isNewDoc) {
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from(table)
      .select('author_id, status')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('Error fetching document for validation:', fetchError);
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
    data.author_id = currentAuthorId || payload.userId; // Use provided author_id or fallback to current user
    data.created_at = new Date().toISOString();
    result = await supabaseAdmin
      .from(table)
      .insert([data])
      .select()
      .single();
  }

  if (result.error) {
    console.error('Save error:', result.error);
    return NextResponse.json({ error: result.error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, doc: result.data });
}
