import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { jwtDecode } from 'jwt-decode';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

interface DecodedToken {
  sub: string;
  email: string;
}

function getAuthUser(req: NextRequest): string | null {
  const token = req.cookies.get('cw_token')?.value;
  if (!token) return null;

  try {
    const decoded = jwtDecode<DecodedToken>(token);
    return decoded.sub;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const userId = getAuthUser(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const fromDate = searchParams.get('from_date');
  const toDate = searchParams.get('to_date');
  const upcoming = searchParams.get('upcoming') === 'true';

  try {
    let query = supabaseAdmin.from('calendar_events').select('*');

    if (upcoming) {
      const today = new Date().toISOString().split('T')[0];
      query = query.gte('date', today).order('date', { ascending: true }).order('time', { ascending: true });
    } else if (fromDate && toDate) {
      query = query.gte('date', fromDate).lte('date', toDate).order('date', { ascending: true });
    } else {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
      query = query.gte('date', startOfMonth).lte('date', endOfMonth).order('date', { ascending: true });
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (err) {
    console.error('Error fetching calendar events:', err);
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const userId = getAuthUser(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { title, description, date, time, duration_minutes, meeting_link, location, assigned_to, department } = body;

    if (!title || !date || !time) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin.from('calendar_events').insert({
      title,
      description: description || null,
      date,
      time,
      duration_minutes: duration_minutes || 60,
      meeting_link: meeting_link || null,
      location: location || null,
      department: department || null,
      assigned_to: assigned_to || [],
      created_by: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }).select().single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    console.error('Error creating calendar event:', err);
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const userId = getAuthUser(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const eventId = searchParams.get('id');

  if (!eventId) {
    return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
  }

  try {
    const body = await req.json();

    const { data, error } = await supabaseAdmin
      .from('calendar_events')
      .update({
        ...body,
        updated_at: new Date().toISOString()
      })
      .eq('id', eventId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (err) {
    console.error('Error updating calendar event:', err);
    return NextResponse.json({ error: 'Failed to update event' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const userId = getAuthUser(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const eventId = searchParams.get('id');

  if (!eventId) {
    return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
  }

  try {
    const { error } = await supabaseAdmin
      .from('calendar_events')
      .delete()
      .eq('id', eventId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error deleting calendar event:', err);
    return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 });
  }
}