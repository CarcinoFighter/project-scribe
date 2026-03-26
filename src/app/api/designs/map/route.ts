import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export async function POST(req: Request) {
  try {
    const { figma_id, route } = await req.json();

    if (!figma_id || !route) {
      return NextResponse.json({ error: 'Missing figma_id or route' }, { status: 400 });
    }

    // Upsert the mapping to Supabase
    const { error } = await supabaseServer
      .from('design_routes')
      .upsert({ 
        figma_id, 
        route,
        updated_at: new Date().toISOString() 
      }, { onConflict: 'figma_id' });

    if (error) {
      console.error('Supabase error mapping design:', error);
      return NextResponse.json({ error: `Failed to save mapping: ${error.message}` }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: `Mapped ${figma_id} to ${route}` });

  } catch (error) {
    console.error('API Error in /api/designs/map:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
