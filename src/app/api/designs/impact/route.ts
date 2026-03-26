import { NextResponse } from 'next/server';
import { BetaAnalyticsDataClient } from '@google-analytics/data';
import { supabaseServer } from '@/lib/supabaseServer';
import { unstable_cache } from 'next/cache';

const getImpactData = unstable_cache(
  async (propertyId: string, clientEmail: string, privateKey: string) => {
    // 1. Fetch mappings from Supabase
    const { data: mappings, error: dbError } = await supabaseServer
      .from('design_routes')
      .select('figma_id, route');

    if (dbError) throw dbError;
    if (!mappings || mappings.length === 0) {
      return { totalViews: 0, itemsByDate: {}, mappedCount: 0 };
    }

    const routes = mappings.map(m => m.route).filter(Boolean);

    // 2. Fetch GA4 data for these routes
    const analyticsDataClient = new BetaAnalyticsDataClient({
      credentials: { client_email: clientEmail, private_key: privateKey }
    });

    const [response] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
      dimensions: [{ name: 'date' }],
      metrics: [{ name: 'screenPageViews' }],
      dimensionFilter: {
        filter: {
          fieldName: 'pagePath',
          inListFilter: { values: routes }
        }
      }
    });

    const itemsByDate: any = {};
    let totalViews = 0;

    response.rows?.forEach(row => {
      const dateVal = row.dimensionValues?.[0]?.value || '';
      const views = parseInt(row.metricValues?.[0]?.value || '0', 10);
      const formattedDate = dateVal.length === 8 
        ? `${dateVal.substring(0,4)}-${dateVal.substring(4,6)}-${dateVal.substring(6,8)}` 
        : dateVal;

      if (!itemsByDate[formattedDate]) itemsByDate[formattedDate] = { views: 0 };
      itemsByDate[formattedDate].views += views;
      totalViews += views;
    });

    return {
      totalViews,
      itemsByDate,
      mappedCount: mappings.length
    };
  },
  ['design-impact-data'],
  { revalidate: 600 } // 10 minutes
);

export async function GET() {
  const propertyId = process.env.GOOGLE_ANALYTICS_PROPERTY_ID;
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!propertyId || !clientEmail || !privateKey) {
    return NextResponse.json({ error: 'GA4 credentials missing' }, { status: 401 });
  }

  try {
    const data = await getImpactData(propertyId, clientEmail, privateKey);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Impact API error:', error);
    return NextResponse.json({ error: 'Failed to fetch impact data', details: error.message }, { status: 500 });
  }
}

