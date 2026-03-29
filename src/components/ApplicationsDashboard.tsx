'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2, AlertCircle, FileText, Code, Palette, Megaphone } from 'lucide-react';

const DEPT_CONFIG = [
  { id: 'Development', name: 'Development', icon: Code, color: '#22c55e' },
  { id: 'Writers\' Block', name: 'Writers\' Block', icon: FileText, color: '#eab308' },
  { id: 'Design Lab', name: 'Design Lab', icon: Palette, color: '#3b82f6' },
  { id: 'Marketing', name: 'Marketing', icon: Megaphone, color: '#ec4899' },
];

export function ApplicationsDashboard() {
  const [data, setData] = useState<Record<string, any[][] | null>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftState, setScrollLeftState] = useState(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeftState(scrollRef.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 1.5; // multiplier for speed
    scrollRef.current.scrollLeft = scrollLeftState - walk;
  };

  useEffect(() => {
    fetch('/api/applications')
      .then(res => res.json())
      .then(d => {
        if (d.error) setError(d.error);
        else setData(d);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  let currentSheetData: any[][] = [];
  let headers: string[] = [];
  let rows: any[][] = [];

  if (activeTab === 'ALL') {
    // Collect all rows from all departments
    const allRows: any[][] = [];
    let commonHeaders: string[] = ['TIMESTAMP', 'DEPARTMENT'];
    let headerInitialized = false;

    DEPT_CONFIG.forEach(dept => {
      const deptData = data[dept.id];
      if (deptData && deptData.length > 0) {
        if (!headerInitialized) {
          // Use headers from the first sheet found
          commonHeaders = [deptData[0][0], 'DEPARTMENT', ...deptData[0].slice(1)];
          headerInitialized = true;
        }
        // Add each row with department name
        const contentRows = deptData.slice(1).map(row => [
          row[0], // Timestamp
          dept.name, // Added Department
          ...row.slice(1) // Reamining columns
        ]);
        allRows.push(...contentRows);
      }
    });
    
    headers = commonHeaders;
    rows = allRows;
  } else {
    currentSheetData = (data[activeTab] || []) as any[][];
    headers = currentSheetData.length > 0 ? (currentSheetData[0] as string[]) : [];
    rows = currentSheetData.slice(1);
  }

  const filteredRows = rows.filter(row => 
    row.some(cell => String(cell).toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) {
    return (
      <div style={{ padding: '64px 0', textAlign: 'center', border: '1px solid var(--rule)', background: 'var(--paper)' }}>
        <Loader2 size={24} className="anim-spin" style={{ color: 'var(--accent)', margin: '0 auto 12px' }} />
        <p className="db-cap">FETCHING GLOBAL RECRUITMENT DATA...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ border: '1px solid var(--rule)', padding: 24, background: 'var(--accent-sub)' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <AlertCircle size={14} style={{ color: 'var(--accent)', marginTop: 2 }} />
          <div>
            <h4 className="db-cap" style={{ color: 'var(--ink)', marginBottom: 4 }}>System Authentication Error</h4>
            <p style={{ fontFamily: 'var(--ff-mono)', fontSize: 10, color: 'var(--mid)', lineHeight: 1.4 }}>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="anim-fade-up">
      {/* Newspaper Headers */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          <span className="db-cap" style={{ color: 'var(--accent)', fontWeight: 700 }}>RECRUITMENT BUREAU</span>
          <div style={{ flex: 1, height: 1, background: 'var(--rule)' }} />
          <span className="db-cap">{activeTab.toUpperCase()}</span>
        </div>
        <h2 className="db-page-title" style={{ fontSize: 24 }}>Internship Applications<em>.</em></h2>
      </div>

      <hr className="db-triple-rule" />

      {/* Filter Bar (Editorial Style) */}
      <div className="db-filter-bar" style={{ marginBottom: 22 }}>
        <div className="db-filter-label" style={{ background: 'var(--paper)', minWidth: 'auto' }}>DEPT:</div>
        <button
          onClick={() => setActiveTab('ALL')}
          className={`db-filter-btn${activeTab === 'ALL' ? ' active' : ''}`}
        >
          ALL ({Object.values(data).reduce((acc, curr) => acc + (curr?.length ? curr.length - 1 : 0), 0)})
        </button>
        {DEPT_CONFIG.map((dept) => {
          const isActive = activeTab === dept.id;
          const count = data[dept.id]?.length ? data[dept.id]!.length - 1 : 0;
          return (
            <button
              key={dept.id}
              onClick={() => setActiveTab(dept.id)}
              className={`db-filter-btn${isActive ? ' active' : ''}`}
            >
              {dept.name} {count > 0 && `(${count})`}
            </button>
          );
        })}
        <div className="db-filter-spacer" />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', minWidth: 200 }}>
          <Search size={10} style={{ position: 'absolute', left: 10, color: 'var(--mid)' }} />
          <input
            type="text"
            placeholder="SEARCH RECORDS..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              padding: '7px 10px 7px 30px',
              fontFamily: 'var(--ff-mono)',
              fontSize: 9,
              letterSpacing: '0.08em',
              color: 'var(--ink)',
              outline: 'none',
            }}
          />
        </div>
      </div>

      {/* Data Table */}
      <div 
        ref={scrollRef}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        style={{ 
          border: '1px solid var(--rule)', 
          borderBottom: 'none', 
          background: 'var(--paper)', 
          overflowX: 'auto', 
          marginBottom: 48,
          cursor: isDragging ? 'grabbing' : 'grab',
          userSelect: isDragging ? 'none' : 'auto'
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--accent-sub)', borderBottom: '1.5px solid var(--rule)' }}>
              {headers.map((h, i) => (
                <th key={i} className="db-cap" style={{ padding: '16px 20px', fontSize: '11px', color: 'var(--ink)', whiteSpace: 'nowrap' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row, i) => (
              <tr 
                key={i} 
                className="db-card"
                style={{ borderBottom: '1px solid var(--rule)' }}
              >
                {row.map((cell, j) => (
                  <td key={j} style={{ 
                    padding: '20px', 
                    fontFamily: 'var(--ff-mono)', 
                    fontSize: '13px', 
                    color: 'var(--mid)', 
                    letterSpacing: '0.01em', 
                    lineHeight: '1.6',
                    minWidth: '180px',
                    maxWidth: '450px',
                    wordBreak: 'break-word',
                    whiteSpace: 'normal',
                    verticalAlign: 'top'
                  }}>
                    {cell}
                  </td>
                ))}
                {row.length < headers.length && 
                  Array.from({ length: headers.length - row.length }).map((_, k) => (
                    <td key={`empty-${k}`} style={{ padding: '20px' }} />
                  ))
                }
              </tr>
            ))}
            {filteredRows.length === 0 && (
              <tr>
                <td colSpan={headers.length || 1} style={{ padding: '64px 0', textAlign: 'center' }}>
                    <div className="db-cap" style={{ opacity: 0.4 }}>NO CANDIDATES MATCHING CRITERIA</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Info */}
      <div style={{ padding: '12px 0', display: 'flex', justifyContent: 'flex-end' }}>
          <p className="db-cap" style={{ fontSize: 7, opacity: 0.6 }}>Connected to Google Cloud Identity Platform (v4.0.1)</p>
      </div>
    </div>
  );
}
