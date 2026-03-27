import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { BetaAnalyticsDataClient } from '@google-analytics/data';
import { unstable_cache } from 'next/cache';
import fs from 'fs';
import path from 'path';

const FIGMA_FILE_KEY = 'B9bsb3LhFv8Fd38zLAKdUn';

let lastRateLimitTime = 0;
const COOLDOWN = 60000; // 60 seconds

const getDesignsData = unstable_cache(
  async (pat: string, propertyId?: string, clientEmail?: string, privateKey?: string) => {
    if (Date.now() - lastRateLimitTime < COOLDOWN) {
      throw new Error('Cooling down after rate limit');
    }

    let webPageId: string | null = null;
    const pageIdCachePath = path.join(process.cwd(), '.figma_web_page_id.txt');
    
    // 1. Check if we have a cached Web Page ID
    try {
      if (fs.existsSync(pageIdCachePath)) {
        webPageId = fs.readFileSync(pageIdCachePath, 'utf8').trim();
      }
    } catch (e) {}

    // 2. If no Web Page ID is cached, fetch the document at depth=1 to find it
    if (!webPageId) {
      const depthRes = await fetch(`https://api.figma.com/v1/files/${FIGMA_FILE_KEY}?depth=1`, {
        headers: { 'X-Figma-Token': pat }
      });

      if (!depthRes.ok) {
        if (depthRes.status === 429) lastRateLimitTime = Date.now();
        throw new Error(`Figma API error (depth=1): ${depthRes.status}`);
      }

      const depthData = await depthRes.json();
      const webPage = depthData.document?.children?.find((p: any) => p.name === 'Web');

      if (!webPage) {
        throw new Error('Web page not found in Figma file');
      }
      
      webPageId = webPage.id as string;
      try {
        fs.writeFileSync(pageIdCachePath, webPageId, 'utf8');
      } catch (e) {}
    }

    // 3. Fetch ONLY the Web page node and its direct children
    const nodesRes = await fetch(`https://api.figma.com/v1/files/${FIGMA_FILE_KEY}/nodes?ids=${webPageId}`, {
      headers: { 'X-Figma-Token': pat }
    });

    if (!nodesRes.ok) {
      if (nodesRes.status === 429) lastRateLimitTime = Date.now();
      throw new Error(`Figma API error (nodes): ${nodesRes.status}`);
    }

    const nodesData = await nodesRes.json();
    const webPageNode = nodesData.nodes?.[webPageId]?.document;
    
    if (!webPageNode || !webPageNode.children) {
      throw new Error('Invalid Web page node structure');
    }

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
    const findSections = (node: any) => {
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
          lastModified: nodesData.lastModified || new Date().toISOString(),
          metrics: route ? routeMetrics[route] : null
        });
      }
      // Since depth=2, node.children will not contain Frames, so we just stop at Sections
    };

    if (webPageNode && webPageNode.children) {
      const sections = webPageNode.children.filter((n: any) => n.type === 'SECTION');
      sections.forEach(findSections);
    }

    return {
      fileId: FIGMA_FILE_KEY,
      fileName: nodesData.name,
      lastModified: nodesData.lastModified || new Date().toISOString(),
      designs
    };
  },
  ['design-lab-data'],
  { revalidate: 1800 } // 30 minutes
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
    const cachePath = path.join(process.cwd(), '.figma_cache.json');
    
    // In dev, try to serve from disk cache first
    // Dev hack: NEVER call Figma repeatedly if cache exists (delete cache manually to refresh)
    try {
      if (process.env.NODE_ENV === 'development' && fs.existsSync(cachePath)) {
        const cachedData = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
        return NextResponse.json(cachedData);
      }
    } catch (e) {
      console.error('Error reading figma cache:', e);
    }

    const data = await getDesignsData(pat, propertyId, clientEmail, privateKey);
    
    // Save to disk cache
    try {
      if (process.env.NODE_ENV === 'development') {
        fs.writeFileSync(cachePath, JSON.stringify(data), 'utf8');
      }
    } catch (e) {
      console.error('Error writing figma cache:', e);
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Designs API Route error:', error);
    
    // If rate limited, try to return stale cache instead of throwing
    try {
      const cachePath = path.join(process.cwd(), '.figma_cache.json');
      if (fs.existsSync(cachePath)) {
        console.log('Serving STALE cache due to Figma API error');
        const staleData = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
        return NextResponse.json(staleData);
      }
    } catch (e) {}
    
    // Check if it's a Figma rate limit error
    const isRateLimit = error.message?.includes('429');
    
    return NextResponse.json(
      { 
        error: isRateLimit ? 'Figma Rate Limit Exceeded' : 'Failed to fetch designs data', 
        details: error.message,
        suggestion: isRateLimit ? 'Please wait exactly 60 seconds before refreshing the Design Lab so the rate limit can reset.' : undefined
      }, 
      { status: isRateLimit ? 429 : 500 }
    );
  }
}

