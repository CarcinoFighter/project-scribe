import { NextResponse } from 'next/server';
import { BetaAnalyticsDataClient } from '@google-analytics/data';
import { unstable_cache } from 'next/cache';

const getAnalyticsData = unstable_cache(
  async (propertyId: string, clientEmail: string, privateKey: string) => {
    const analyticsDataClient = new BetaAnalyticsDataClient({
      credentials: {
        client_email: clientEmail,
        private_key: privateKey,
      },
    });

    const [response] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
      dimensions: [{ name: 'date' }],
      metrics: [
        { name: 'activeUsers' },
        { name: 'screenPageViews' },
        { name: 'bounceRate' }
      ],
    });

    let totalActiveUsers = 0;
    let totalViews = 0;
    let totalBounceRate = 0;
    const itemsByDate: any = {};

    response.rows?.forEach(row => {
      const dateVal = row.dimensionValues?.[0].value || '';
      const activeUsers = parseInt(row.metricValues?.[0].value || '0', 10);
      const views = parseInt(row.metricValues?.[1].value || '0', 10);
      const bounceRate = parseFloat(row.metricValues?.[2].value || '0');

      totalActiveUsers += activeUsers;
      totalViews += views;
      totalBounceRate += bounceRate;

      const formattedDate = dateVal.length === 8 
        ? `${dateVal.substring(0,4)}-${dateVal.substring(4,6)}-${dateVal.substring(6,8)}` 
        : dateVal;

      itemsByDate[formattedDate] = { activeUsers, views, bounceRate };
    });

    const averageBounceRate = response.rows && response.rows.length > 0 
      ? (totalBounceRate / response.rows.length).toFixed(1) + '%' 
      : '0%';

    return {
      totalUsers: totalActiveUsers,
      totalViews: totalViews,
      averageBounceRate: averageBounceRate,
      itemsByDate
    };
  },
  ['marketing-analytics'],
  { revalidate: 600 } // 10 minutes
);

export async function GET() {
  const propertyId = process.env.GOOGLE_ANALYTICS_PROPERTY_ID;
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!propertyId || !clientEmail || !privateKey) {
    return NextResponse.json({ error: 'GA4 credentials missing from .env' }, { status: 401 });
  }

  try {
    const data = await getAnalyticsData(propertyId, clientEmail, privateKey);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('GA4 API Route error:', error);
    if (error?.details?.includes('SERVICE_DISABLED') || error?.message?.includes('Google Analytics Data API')) {
      return NextResponse.json(
        { error: 'Google Analytics Data API is disabled. Please enable it in the Google Cloud Console.' },
        { status: 403 }
      );
    }
    return NextResponse.json({ error: 'Internal server error while fetching GA4 data', details: String(error) }, { status: 500 });
  }
}

