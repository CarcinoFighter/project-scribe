import { google } from 'googleapis';
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { unstable_cache } from 'next/cache';

export const dynamic = 'force-dynamic';

async function fetchSheetData(auth: any, spreadsheetId: string, range: string) {
  const sheets = google.sheets({ version: 'v4', auth });
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  });
  return response.data.values;
}

const getCachedApplicationsData = unstable_cache(
  async (clientEmail: string, privateKey: string, configs: { id: string | undefined, name: string }[]) => {
    try {
      const auth = new google.auth.GoogleAuth({
        credentials: {
          client_email: clientEmail,
          private_key: privateKey,
        },
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
      });

      const googleAuthClient = await auth.getClient();
      const results: Record<string, any[][] | null | undefined> = {};

      await Promise.all(configs.map(async (config) => {
        if (config.id) {
          try {
            const data = await fetchSheetData(googleAuthClient, config.id, 'A1:Z100');
            results[config.name] = data || [];
          } catch (e: any) {
            console.error(`Error fetching sheet ${config.name} (${config.id}):`, e.message);
            results[config.name] = null;
          }
        }
      }));

      return results;
    } catch (error: any) {
      console.error('Applications API cache fetch overall error:', error);
      throw error;
    }
  },
  ['recruitment-applications'],
  { revalidate: 300 } // 5 minutes cache
);

export async function GET(req: NextRequest) {
  const token = req.cookies.get('cw_token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const payload = verifyToken(token);
  if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

  // Fetch fresh user data from DB to check department and admin access
  const { data: user, error: userError } = await supabaseAdmin
    .from('users')
    .select('admin_access, department')
    .eq('id', payload.userId)
    .single();

  if (userError || !user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Restrict to Leadership department or Admin access
  const isLeadership = user.department === 'Leadership';
  const isAdmin = user.admin_access;

  if (!isLeadership && !isAdmin) {
    return NextResponse.json({ error: 'Forbidden: Leadership access required' }, { status: 403 });
  }

  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY
    ?.replace(/\\n/g, '\n')
    ?.replace(/^"(.*)"$/, '$1');

  if (!clientEmail || !privateKey) {
    return NextResponse.json({ error: 'Google API credentials missing in .env' }, { status: 500 });
  }

  const sheetConfigs = [
    { id: process.env.GOOGLE_SHEETS_TECH_ID, name: 'Development' },
    { id: process.env.GOOGLE_SHEETS_WRITER_ID, name: 'Writers\' Block' },
    { id: process.env.GOOGLE_SHEETS_DESIGN_ID, name: 'Design Lab' },
    { id: process.env.GOOGLE_SHEETS_MARKETING_ID, name: 'Marketing' },
  ];

  try {
    const results = await getCachedApplicationsData(clientEmail, privateKey, sheetConfigs);
    return NextResponse.json(results);
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
