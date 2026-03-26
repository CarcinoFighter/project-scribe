'use client';

import React, { useState, useEffect } from 'react';
import { BarChart, Users, MousePointerClick, TrendingUp, Globe, AlertCircle } from 'lucide-react';
import { StatCard, GenericActivityChart, getWeekLabels } from './DashboardStats';

export default function MarketingDashboard() {
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalViews, setTotalViews] = useState(0);
  const [bounceRate, setBounceRate] = useState('0%');
  const [pageViewsBars, setPageViewsBars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const week = getWeekLabels();
  const totalViewsThisWeek = pageViewsBars.reduce((a, b) => a + b.value, 0);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const res = await fetch('/api/analytics');
        if (!res.ok) {
          const err = await res.json();
          setError(err.error || 'Failed to fetch GA4 stats');
          setLoading(false);
          return;
        }
        
        const data = await res.json();
        setTotalUsers(data.totalUsers || 0);
        setTotalViews(data.totalViews || 0);
        setBounceRate(data.averageBounceRate || '0%');
        
        // Map the itemsByDate to our week labels
        const bars = week.map((w) => {
          const dayData = data.itemsByDate?.[w.date] || { views: 0 };
          return {
            label: w.label,
            isToday: w.isToday,
            value: dayData.views,
          };
        });
        setPageViewsBars(bars);
      } catch (err: any) {
        // Just set the error silently without throwing an exception to avoid Next.js dev overlays
        setError(err.message || 'Network error');
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, []);

  return (
    <div className="anim-fade-up">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <BarChart size={20} style={{ color: '#f59e0b' }} />
        </div>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Marketing Analytics</h2>
          <p style={{ fontSize: 13, color: 'var(--text-4)', margin: 0 }}>Google Analytics (GA4) Overview</p>
        </div>
      </div>

      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <div className="anim-stagger" style={{ '--i': 0 } as React.CSSProperties}>
          <StatCard
            label="Total Active Users"
            value={loading ? '-' : totalUsers.toLocaleString()}
            sub="Past 7 days"
            icon={Users}
            accent={true}
            colorHex="var(--accent)"
          />
        </div>
        <div className="anim-stagger" style={{ '--i': 1 } as React.CSSProperties}>
          <StatCard
            label="Page Views"
            value={loading ? '-' : totalViews.toLocaleString()}
            sub="Past 7 days"
            icon={MousePointerClick}
            accent={false}
            colorHex="var(--accent)"
          />
        </div>
        <div className="anim-stagger" style={{ '--i': 2 } as React.CSSProperties}>
          <StatCard
            label="API Status & Bounce Rate"
            value={error ? "Error" : bounceRate}
            sub={error ? error.substring(0, 30) : "Google Analytics Data API"}
            icon={error ? AlertCircle : Globe}
            accent={false}
            colorHex={error ? "#ef4444" : "#10b981"}
          />
        </div>
      </div>

      <div className="anim-fade-up" style={{ animationDelay: '0.12s' }}>
        <GenericActivityChart
          bars={pageViewsBars}
          title="Traffic Overview"
          subtitle="Page views per day this week"
          highlightText={`${totalViewsThisWeek.toLocaleString()} this week`}
          highlightIcon={TrendingUp}
          highlightColor="var(--accent)"
          barColor="var(--accent)"
          hoverFormat={(val) => `${val.toLocaleString()} views`}
        />
      </div>
    </div>
  );
}
