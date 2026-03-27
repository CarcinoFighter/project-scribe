'use client';

import React, { useState, useEffect } from 'react';
import { Figma, Link as LinkIcon, AlertCircle, RefreshCw, BarChart2, Eye, Layout } from 'lucide-react';
import Image from 'next/image';

import { StatCard, GenericActivityChart, getWeekLabels } from './DashboardStats';

interface DesignData {
  id: string;
  name: string;
  lastModified: string;
  route: string | null;
  metrics?: {
    users: number;
    views: number;
    avgSession: number;
  };
}

export default function DesignLabDashboard() {
  const [designs, setDesigns] = useState<DesignData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [impactData, setImpactData] = useState<any>(null);
  const [mappingId, setMappingId] = useState<string | null>(null);
  const [mappingRoute, setMappingRoute] = useState('');

  const week = getWeekLabels();
  
  const designImpactBars = week.map((w) => {
    const dayData = impactData?.itemsByDate?.[w.date] || { views: 0 };
    return {
      label: w.label,
      isToday: w.isToday,
      value: dayData.views,
    };
  });
  const totalImpactViews = impactData?.totalViews || 0;

  useEffect(() => {
    async function fetchDesigns() {
      try {
        const res = await fetch('/api/designs');
        if (!res.ok) {
          const err = await res.json();
          const mainError = err.error || 'Failed to fetch Figma designs';
          const errMsg = err.suggestion ? `${mainError}. ${err.suggestion}` : mainError;
          setError(errMsg);
          setLoading(false);
          return;
        }
        
        const data = await res.json();
        setDesigns(data.designs || []);
      } catch (err: any) {
        // Just set the error silently to prevent Next.js dev overlays
        setError(err.message || 'Network error');
      } finally {
        setLoading(false);
      }
    }

    async function fetchImpact() {
      try {
        const res = await fetch('/api/designs/impact');
        if (res.ok) {
          const data = await res.json();
          setImpactData(data);
        }
      } catch (err) {
        console.error('Impact fetch error:', err);
      }
    }

    fetchDesigns();
    fetchImpact();
  }, []);

  async function handleMap(figma_id: string) {
    if (!mappingRoute.startsWith('/')) {
      alert('Route must start with / (e.g. /dashboard)');
      return;
    }

    try {
      const res = await fetch('/api/designs/map', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ figma_id, route: mappingRoute })
      });

      if (res.ok) {
        // Refresh designs to show new mapping
        const dRes = await fetch('/api/designs');
        const dData = await dRes.json();
        setDesigns(dData.designs || []);
        
        // Refresh impact
        const iRes = await fetch('/api/designs/impact');
        const iData = await iRes.json();
        setImpactData(iData);

        setMappingId(null);
        setMappingRoute('');
      } else {
        const err = await res.json();
        alert(`Error: ${err.error}`);
      }
    } catch (e) {
      alert('Failed to save mapping');
    }
  }

  const linkedDesignsArr = designs.filter(d => d.route);
  const unlinkedDesignsArr = designs.filter(d => !d.route);
  const linkedDesignsCount = linkedDesignsArr.length;

  return (
    <div className="anim-fade-up">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(242,78,30,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Figma size={20} style={{ color: '#f24e1e' }} />
        </div>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Design Lab</h2>
          <p style={{ fontSize: 13, color: 'var(--text-4)', margin: 0 }}>Figma UI & Route Analytics</p>
        </div>
      </div>

      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <div className="anim-stagger" style={{ '--i': 0 } as React.CSSProperties}>
          <StatCard
            label="Tracked Designs"
            value={loading ? '-' : designs.length}
            sub="Frames mapped from Figma"
            icon={Layout}
            accent={true}
            colorHex="var(--accent)"
          />
        </div>
        <div className="anim-stagger" style={{ '--i': 1 } as React.CSSProperties}>
          <StatCard
            label="Auto-linked Routes"
            value={loading ? '-' : linkedDesignsCount}
            sub={`${unlinkedDesignsArr.length} unlinked`}
            icon={LinkIcon}
            accent={false}
            colorHex="var(--accent)"
          />
        </div>
        <div className="anim-stagger" style={{ '--i': 2 } as React.CSSProperties}>
          <StatCard
            label="API Status"
            value={error ? "Error" : "Healthy"}
            sub={error ? error.substring(0, 30) : "Figma Integration OK"}
            icon={error ? AlertCircle : BarChart2}
            accent={false}
            colorHex={error ? "#ef4444" : "#10b981"}
          />
        </div>
      </div>

      <div className="anim-fade-up" style={{ animationDelay: '0.12s' }}>
        <GenericActivityChart
          bars={designImpactBars}
          title="Design Impact Overview"
          subtitle="GA4 Views across all linked Figma designs this week"
          highlightText={`${(totalImpactViews/1000).toFixed(1)}k this week`}
          highlightIcon={BarChart2}
          highlightColor="var(--accent)"
          barColor="var(--accent)"
          hoverFormat={(val) => `${val.toLocaleString()} views`}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', margin: 0 }}>Design Library</h3>
        <button className="tb-btn" style={{ padding: '6px 12px', background: 'var(--bg-deep)', borderRadius: 8, fontSize: 12, border: '1px solid var(--border)' }}>
          <RefreshCw size={12} style={{ marginRight: 6 }} /> Sync Figma
        </button>
      </div>

      {loading ? (
        <div className="doc-grid-2">
          {[1, 2].map(i => (
            <div key={i} className="glass-raised" style={{ height: 200, borderRadius: 'var(--r-lg)', animation: 'lp-shimmer 1.4s ease-in-out infinite' }} />
          ))}
        </div>
      ) : (
        <>
          {linkedDesignsArr.length > 0 && (
            <div className="doc-grid-2" style={{ gap: 16, marginBottom: 32 }}>
              {linkedDesignsArr.map(design => (
                <div key={design.id} className="glass-raised" style={{ borderRadius: 'var(--r-lg)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ padding: 0 }}>
                    <div style={{ height: 140, position: 'relative', background: 'var(--bg-deep)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Layout size={40} style={{ color: 'var(--border-strong)', opacity: 0.5 }} />
                      <div style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', padding: '4px 8px', borderRadius: 99, color: '#fff', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <LinkIcon size={10} style={{ color: '#1abc9c' }} /> {design.route}
                      </div>
                    </div>
                  </div>
                  <div style={{ padding: '16px' }}>
                    <h4 style={{ margin: '0 0 6px 0', fontSize: 14, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{design.name}</h4>
                    <p style={{ margin: 0, fontSize: 11, color: 'var(--text-4)' }}>Last modified: {new Date(design.lastModified).toLocaleDateString()}</p>
                    
                    <div style={{ borderTop: '1px solid var(--border)', marginTop: 12, paddingTop: 12 }}>
                      {design.metrics ? (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-4)' }}>
                            <Eye size={12} style={{ color: 'var(--text)' }} /> {(design.metrics.views/1000).toFixed(1)}k
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-4)' }}>
                            <BarChart2 size={12} style={{ color: 'var(--text)' }} /> {design.metrics.users.toLocaleString()} users
                          </div>
                        </div>
                      ) : (
                        <div style={{ fontSize: 12, color: 'var(--text-4)' }}>Waiting for GA4 traffic...</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {unlinkedDesignsArr.length > 0 && (
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', margin: '0 0 16px 0' }}>Unmapped Frames</h3>
              <div className="glass-raised" style={{ borderRadius: 'var(--r-lg)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    {unlinkedDesignsArr.map((design, i) => (
                      <tr key={design.id} style={{ borderBottom: i === unlinkedDesignsArr.length - 1 ? 'none' : '1px solid var(--border-med)', fontSize: 13, color: 'var(--text)' }}>
                        <td style={{ padding: '12px 16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Layout size={13} style={{ color: 'var(--text-4)' }} /> {design.name}
                        </td>
                        <td style={{ padding: '12px 16px', color: 'var(--text-4)' }}>
                          {new Date(design.lastModified).toLocaleDateString()}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          {mappingId === design.id ? (
                            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                              <input 
                                autoFocus
                                value={mappingRoute}
                                onChange={(e) => setMappingRoute(e.target.value)}
                                placeholder="/route"
                                style={{ width: 100, fontSize: 11, padding: '4px 8px', borderRadius: 6, border: '1px solid var(--accent)', background: 'var(--bg-deep)', color: 'var(--text)' }}
                                onKeyDown={(e) => e.key === 'Enter' && handleMap(design.id)}
                              />
                              <button 
                                onClick={() => handleMap(design.id)}
                                style={{ padding: '4px 8px', background: 'var(--accent)', color: '#fff', borderRadius: 6, fontSize: 11, fontWeight: 700, border: 'none' }}
                              >
                                Save
                              </button>
                            </div>
                          ) : (
                            <button 
                              onClick={() => { setMappingId(design.id); setMappingRoute(''); }}
                              className="tb-btn" 
                              style={{ padding: '4px 10px', background: 'var(--accent-subtle)', color: 'var(--accent)', borderRadius: 6, fontSize: 11.5, fontWeight: 600 }}
                            >
                              Map Route
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
