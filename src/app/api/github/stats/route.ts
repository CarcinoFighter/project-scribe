import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';

const targetRepos = [
  { owner: 'CarcinoFighter', name: 'project-scribe' },
  { owner: 'CarcinoFighter', name: 'carcino-fighters-website' }
];

const getGithubStatsData = unstable_cache(
  async (pat: string) => {
    const headers = {
      'Authorization': `token ${pat}`,
      'Accept': 'application/vnd.github.v3+json',
      'X-GitHub-Api-Version': '2022-11-28'
    };

    let totalCommits = 0;
    let totalPrsMerged = 0;
    const combinedActivity: Record<string, number> = {};

    const repoStats = await Promise.all(targetRepos.map(async ({ owner, name }) => {
      try {
        // 1. Total commits count
        const commitsRes = await fetch(`https://api.github.com/repos/${owner}/${name}/commits?per_page=1`, { headers });
        if (commitsRes.ok) {
          const linkHeader = commitsRes.headers.get('link');
          if (linkHeader) {
            const match = linkHeader.match(/&page=(\d+)>; rel="last"/);
            if (match) totalCommits += parseInt(match[1]);
          }
        }

        // 2. Merged PRs count
        const pullsRes = await fetch(`https://api.github.com/search/issues?q=repo:${owner}/${name}+is:pr+is:merged`, { headers });
        if (pullsRes.ok) {
          const pullsData = await pullsRes.json();
          totalPrsMerged += pullsData.total_count || 0;
        }

        // 3. Recent activity (7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const since = sevenDaysAgo.toISOString();
        const activityRes = await fetch(`https://api.github.com/repos/${owner}/${name}/commits?since=${since}&per_page=100`, { headers });
        if (activityRes.ok) {
          const commits = await activityRes.json();
          commits.forEach((c: any) => {
            const date = c.commit.author.date.split('T')[0];
            combinedActivity[date] = (combinedActivity[date] || 0) + 1;
          });
        }
      } catch (err) {
        console.error(`Error fetching Github data for ${owner}/${name}:`, err);
      }
    }));

    // Format activity for the last 7 days
    const weekLabels = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      weekLabels.push({
        date: dateStr,
        count: combinedActivity[dateStr] || 0
      });
    }

    return {
      totalCommits,
      totalPrsMerged,
      activity: weekLabels,
      apiStatus: 'healthy'
    };
  },
  ['github-stats-data'],
  { revalidate: 600 } // 10 minutes
);

export async function GET() {
  const pat = process.env['GITHUB-PAT'] || process.env.GITHUB_PAT;
  
  if (!pat) {
    return NextResponse.json({ error: 'GitHub PAT is not configured in .env' }, { status: 401 });
  }

  try {
    const data = await getGithubStatsData(pat);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('GitHub API Route error:', error);
    return NextResponse.json({ error: 'Internal server error while fetching GitHub data', details: error.message }, { status: 500 });
  }
}


