import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { BetaAnalyticsDataClient } from '@google-analytics/data';
import { unstable_cache } from 'next/cache';

const FIGMA_FILE_KEY = 'B9bsb3LhFv8Fd38zLAKdUn';

const getDesignsData = unstable_cache(
  async (pat: string, propertyId?: string, clientEmail?: string, privateKey?: string) => {
    // 1. Fetch Figma file depth=2 to find the Web page
    const depthRes = await fetch(`https://api.figma.com/v1/files/${FIGMA_FILE_KEY}?depth=2`, {
      headers: { 'X-Figma-Token': pat },
      cache: 'no-store' // We handle caching via unstable_cache instead
    });

    if (!depthRes.ok) {
      throw new Error(`Figma API error (depth=2): ${depthRes.status}`);
    }

    const depthData = await depthRes.json();
    const webPage = depthData.document?.children?.find((p: any) => p.name === 'Web');

    if (!webPage) {
      throw new Error('Web page not found in Figma file');
    }

    // 1b. Fetch only the Web page node
    const nodesRes = await fetch(`https://api.figma.com/v1/files/${FIGMA_FILE_KEY}/nodes?ids=${webPage.id}`, {
      headers: { 'X-Figma-Token': pat },
      cache: 'no-store'
    });

    if (!nodesRes.ok) {
      throw new Error(`Figma API error (nodes): ${nodesRes.status}`);
    }

    const nodesData = await nodesRes.json();
    const webPageNode = nodesData.nodes[webPage.id]?.document;
    
    // 2. Fetch manual mappings from Supabase
    const { data: dbMappings } = await supabaseServer
      .from('design_routes')
      .select('figma_id, route');
    
    const mappingDict: Record<string, string> = {};
    const mappedRoutes: string[] = [];
    if (dbMappings) {
      dbMappings.forEach(m => {
        mappingDict[m.figma_id] = m.route;
        mappedRoutes.push(m.route);
      });
    }

    // 3. Fetch GA4 metrics if credentials provided
    const routeMetrics: Record<string, { views: number, users: number }> = {};
    if (propertyId && clientEmail && privateKey && mappedRoutes.length > 0) {
      try {
        const analyticsDataClient = new BetaAnalyticsDataClient({
          credentials: { client_email: clientEmail, private_key: privateKey }
        });
        const [response] = await analyticsDataClient.runReport({
          property: `properties/${propertyId}`,
          dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
          dimensions: [{ name: 'pagePath' }],
          metrics: [{ name: 'screenPageViews' }, { name: 'activeUsers' }],
          dimensionFilter: {
            filter: {
              fieldName: 'pagePath',
              inListFilter: { values: mappedRoutes }
            }
          }
        });
        response.rows?.forEach(row => {
          const path = row.dimensionValues?.[0]?.value || '';
          routeMetrics[path] = {
            views: parseInt(row.metricValues?.[0]?.value || '0', 10),
            users: parseInt(row.metricValues?.[1]?.value || '0', 10)
          };
        });
      } catch (e) {
        console.error('GA4 fetch error in designs API:', e);
      }
    }

    // 4. Transform data
    const designs: any[] = [];
    const findFrames = (node: any) => {
      if (node.type === 'SECTION') {
        let route = null;
        let name = node.name || 'Untitled';
        if (name.includes('- /')) {
          const parts = name.split('- /');
          name = parts[0].trim();
          route = '/' + parts[1].trim();
        }
        if (mappingDict[node.id]) route = mappingDict[node.id];

        designs.push({
          id: node.id,
          name: name,
          route: route,
          lastModified: depthData.lastModified,
          thumbnailUrl: depthData.thumbnailUrl,
          metrics: route ? routeMetrics[route] : null
        });
      }
      if (node.children) node.children.forEach(findFrames);
    };

    if (webPageNode && webPageNode.children) {
      webPageNode.children.forEach(findFrames);
    }

    return {
      fileId: FIGMA_FILE_KEY,
      fileName: depthData.name,
      lastModified: depthData.lastModified,
      thumbnailUrl: depthData.thumbnailUrl,
      designs
    };
  },
  ['design-lab-data'],
  { revalidate: 600 } // 10 minutes
);

export async function GET() {
  const pat = process.env['FIGMA-PAT'] || process.env.FIGMA_PAT;
  const propertyId = process.env.GOOGLE_ANALYTICS_PROPERTY_ID;
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!pat) {
    return NextResponse.json({ error: 'Figma PAT is not configured in .env' }, { status: 401 });
  }

  try {
    const data = await getDesignsData(pat, propertyId, clientEmail, privateKey);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Designs API Route error:', error);
    
    // Check if it's a Figma rate limit error
    const isRateLimit = error.message?.includes('429');
    
    return NextResponse.json(
      { 
        error: isRateLimit ? 'Figma Rate Limit Exceeded' : 'Failed to fetch designs data', 
        details: error.message,
        suggestion: isRateLimit ? 'Please wait a minute before refreshing the Design Lab.' : undefined
      }, 
      { status: isRateLimit ? 429 : 500 }
    );
  }
}

