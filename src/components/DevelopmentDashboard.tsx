'use client';

import React, { useState, useEffect } from 'react';
import { Github, GitBranch, AlertCircle, TrendingUp, Code, Activity, Server, CheckCircle2, XCircle, Clock, Hash } from 'lucide-react';
import { StatCard, GenericActivityChart } from './DashboardStats';

interface RepoStat {
  id: number;
  name: string;
  description: string;
  stars: number;
  forks: number;
  openIssues: number;
  language: string;
  updatedAt: string;
}

export default function DevelopmentDashboard() {
  const [repos, setRepos] = useState<RepoStat[]>([]);
  const [totalCommits, setTotalCommits] = useState(0);
  const [totalPrs, setTotalPrs] = useState(0);
  const [apiStatus, setApiStatus] = useState<'healthy' | 'error'>('healthy');
  const [activity, setActivity] = useState<{ date: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchGitHubData() {
      try {
        const res = await fetch('/api/github/stats');
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to fetch GitHub stats');
        }
        
        const data = await res.json();
        setRepos(data.repos || []);
        setTotalCommits(data.totalCommits || 0);
        setTotalPrs(data.totalPrsMerged || 0);
        setActivity(data.activity || []);
        setApiStatus(data.apiStatus || 'healthy');
      } catch (err: any) {
        console.error('GitHub API error:', err);
        setError(err.message);
        setApiStatus('error');
      } finally {
        setLoading(false);
      }
    }
    fetchGitHubData();
  }, []);

  const contributionBars = activity.map((a, i) => ({
    label: new Date(a.date).toLocaleDateString('en-US', { weekday: 'short' }),
    isToday: i === 6,
    value: a.count,
  }));

  const totalWeeklyContributions = activity.reduce((a, b) => a + b.count, 0);

  return (
    <div className="anim-fade-up">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Code size={20} style={{ color: '#3b82f6' }} />
        </div>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Development Overview</h2>
          <p style={{ fontSize: 13, color: 'var(--text-4)', margin: 0 }}>Core Metrics for project-scribe & carcino-fighters-website</p>
        </div>
      </div>

      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <div className="anim-stagger" style={{ '--i': 0 } as React.CSSProperties}>
          <StatCard
            label="Total Commits"
            value={loading ? '-' : totalCommits}
            sub="Across targeted repositories"
            icon={Hash}
            accent={true}
            colorHex="var(--accent)"
          />
        </div>
        <div className="anim-stagger" style={{ '--i': 1 } as React.CSSProperties}>
          <StatCard
            label="PRs Merged"
            value={loading ? '-' : totalPrs}
            sub="Total lifetime merged"
            icon={GitBranch}
            accent={false}
            colorHex="var(--accent)"
          />
        </div>
        <div className="anim-stagger" style={{ '--i': 2 } as React.CSSProperties}>
          <StatCard
            label="API Status"
            value={error ? "Error" : (apiStatus === 'healthy' ? "Healthy" : "Unknown")}
            sub={error ? error.substring(0, 30) : "GitHub Integration OK"}
            icon={error || apiStatus === 'error' ? AlertCircle : Activity}
            accent={false}
            colorHex={error || apiStatus === 'error' ? "#ef4444" : "#10b981"}
          />
        </div>
      </div>

      <div className="anim-fade-up" style={{ animationDelay: '0.12s' }}>
        <GenericActivityChart
          bars={contributionBars}
          title="Contribution Streak"
          subtitle="Commits per day this week"
          highlightText={`${totalWeeklyContributions} this week`}
          highlightIcon={TrendingUp}
          highlightColor="var(--accent)"
          barColor="var(--accent)"
          hoverFormat={(val) => `${val} commits`}
        />
      </div>

      <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 16, marginTop: 32 }}>Tracked Repositories</h3>
      
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1,2].map(i => (
            <div key={i} className="glass-raised" style={{ height: 80, borderRadius: 'var(--r-lg)', animation: 'lp-shimmer 1.4s ease-in-out infinite' }} />
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {repos.map(repo => (
            <div key={repo.id} className="glass-raised" style={{ padding: '16px 20px', borderRadius: 'var(--r-lg)', display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <Github size={15} style={{ color: 'var(--text)' }} />
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{repo.name}</span>
                  <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 99, background: 'var(--bg-deep)', color: 'var(--text-4)' }}>{repo.language || 'Code'}</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-4)' }}>{repo.description}</div>
              </div>
            </div>
          ))}
          {repos.length === 0 && !loading && !error && (
            <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-4)', fontSize: 14 }}>
              No repositories found or access denied.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

