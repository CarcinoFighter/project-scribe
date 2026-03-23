import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(req: NextRequest) {
  const { data: docs, error } = await supabaseAdmin
    .from('cancer_docs')
    .select('id, title, slug, content, created_at, updated_at, author_id, status, color')
    .eq('status', 'published')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching cancer_docs:', error);
    return NextResponse.json({ error: 'Failed to fetch docs' }, { status: 500 });
  }

  if (!docs || docs.length === 0) {
    return NextResponse.json({ docs: [] });
  }

  // Manually fetch author details since FK relationship is missing in Supabase
  const authorIds = [...new Set(docs.map(doc => doc.author_id))].filter(Boolean);
  
  if (authorIds.length > 0) {
    const { data: authors, error: authorError } = await supabaseAdmin
      .from('users')
      .select('id, name, avatar_url')
      .in('id', authorIds);

    if (!authorError && authors) {
      const authorMap = Object.fromEntries(authors.map(a => [a.id, a]));
      const docsWithAuthor = docs.map(doc => ({
        ...doc,
        author: authorMap[doc.author_id] || null
      }));
      return NextResponse.json({ docs: docsWithAuthor });
    }
  }

  return NextResponse.json({ docs });
}

