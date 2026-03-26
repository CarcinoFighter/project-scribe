'use client';

import React, { useState } from 'react';

// ── Generic Stat card ─────────────────────────────────────────────────────────
// ── Generic Stat card ─────────────────────────────────────────────────────────
export function StatCard({ label, value, sub, icon: Icon, accent, onClick, progress, colorHex }: { label:string; value:string|number; sub:string; icon:React.ElementType; accent?:boolean; onClick?:()=>void; progress?:{current:number;goal:number}; colorHex?: string; }) {
  const [hov, setHov] = useState(false);
  const pct = progress ? Math.min(progress.current/progress.goal,1) : null;
  const R=9, C=2*Math.PI*R;
  const mainColor = colorHex || 'var(--accent)';
  
  // Helper to handle alpha with potential CSS variables
  const getAlphaColor = (base: string, alpha: string) => {
    if (base.includes('var(')) {
      const opacity = parseInt(alpha, 16) / 255;
      return `color-mix(in srgb, ${base}, transparent ${Math.round((1 - opacity) * 100)}%)`;
    }
    return `${base}${alpha}`;
  };

  return (
    <div
      role={onClick?'button':undefined} tabIndex={onClick?0:undefined}
      onClick={onClick}
      onMouseEnter={()=>onClick&&setHov(true)}
      onMouseLeave={()=>onClick&&setHov(false)}
      style={{
        background: accent
          ? `linear-gradient(135deg, ${mainColor} 0%, ${getAlphaColor(mainColor, 'cc')} 100%)`
          : 'var(--surface-1)',
        border: `1px solid ${accent?'transparent':'var(--border)'}`,
        borderRadius:'var(--r-lg)', padding:'16px 18px',
        boxShadow: accent ? `0 4px 24px ${getAlphaColor(mainColor, '40')}, 0 1px 4px rgba(0,0,0,0.10)` : 'var(--sh-xs)',
        cursor: onClick?'pointer':'default',
        transform: hov?'translateY(-2px)':'none',
        transition: 'transform 0.14s, box-shadow 0.14s',
        userSelect: 'none', isolation: 'isolate',
      }}
    >
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
        <span style={{ fontSize:11, fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase', color:accent?'rgba(255,255,255,0.70)':'var(--text-4)' }}>
          {label}
        </span>
        {pct!==null ? (
          <svg width="24" height="24" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r={R} fill="none" stroke={accent?'rgba(255,255,255,0.22)':'var(--border-strong)'} strokeWidth="2"/>
            <circle cx="12" cy="12" r={R} fill="none" stroke={pct>=1?'#4ade80':(accent?'#fff':mainColor)} strokeWidth="2" strokeLinecap="round"
              strokeDasharray={C} strokeDashoffset={C*(1-pct)} className="goal-ring"
              style={{ transform:'rotate(-90deg)', transformOrigin:'12px 12px', transition: 'stroke-dashoffset 0.5s ease-out' }}/>
          </svg>
        ) : (
          <div style={{ width:28, height:28, borderRadius:8, background:accent?'rgba(255,255,255,0.18)':getAlphaColor(mainColor, '1a'), display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <Icon size={13} strokeWidth={2} style={{ color:accent?'#fff':mainColor }} />
          </div>
        )}
      </div>
      <div style={{ fontSize:28, fontWeight:700, letterSpacing:'-0.035em', lineHeight:1, color:accent?'#fff':'var(--text)' }}>
        {value}
      </div>
      <div style={{ fontSize:11.5, marginTop:5, color:accent?'rgba(255,255,255,0.60)':'var(--text-4)' }}>{sub}</div>
    </div>
  );
}

// ── Generic Activity chart ───────────────────────────────────────────────────
export function GenericActivityChart({ 
  bars, title, subtitle, highlightText, highlightIcon: HighlightIcon, highlightColor, barColor, hoverFormat, noAnimate 
}: { 
  bars: { label: string; isToday: boolean; value: number }[];
  title: string;
  subtitle: string;
  highlightText: string;
  highlightIcon: React.ElementType;
  highlightColor: string;
  barColor: string;
  hoverFormat: (val: number) => string;
  noAnimate?: boolean;
}) {
  const [hov, setHov] = useState<number|null>(null);
  const max = Math.max(...bars.map(b=>b.value), 1);
  
  // Helper to handle alpha with potential CSS variables
  const getAlphaColor = (base: string, alpha: string) => {
    if (base.includes('var(')) {
      const opacity = parseInt(alpha, 16) / 255;
      return `color-mix(in srgb, ${base}, transparent ${Math.round((1 - opacity) * 100)}%)`;
    }
    return `${base}${alpha}`;
  };

  return (
    <div className="glass-raised" style={{ borderRadius:'var(--r-lg)', padding:'18px 20px', marginBottom:20 }}>
      <div className="dash-chart-header" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
        <div>
          <div style={{ fontSize:14, fontWeight:700, color:'var(--text)', letterSpacing:'-0.01em' }}>{title}</div>
          <div style={{ fontSize:12, color:'var(--text-4)', marginTop:2 }}>{subtitle}</div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 12px', borderRadius:'var(--r-sm)', background:getAlphaColor(highlightColor, '1a'), border:`1px solid ${getAlphaColor(highlightColor, '33')}` }}>
          <HighlightIcon size={11} style={{ color:highlightColor }} />
          <span style={{ fontSize:12, fontWeight:700, color:highlightColor }}>{highlightText}</span>
        </div>
      </div>
      <div style={{ display:'flex', alignItems:'flex-end', gap:8, height:100 }}>
        {bars.map((b,i) => (
          <div key={b.label} onMouseEnter={()=>setHov(i)} onMouseLeave={()=>setHov(null)}
            style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:6, height:'100%', justifyContent:'flex-end', position:'relative', cursor:'default' }}>
            {hov===i && (
              <div className={noAnimate ? "" : "anim-fade-up"} style={{ position:'absolute', bottom:'calc(100% + 4px)', background:'var(--surface-2)', border:'1px solid var(--border-med)', borderRadius:6, padding:'3px 8px', fontSize:11, fontWeight:700, color:'var(--text)', whiteSpace:'nowrap', boxShadow:'var(--sh-sm)', pointerEvents:'none', zIndex:10 }}>
                {hoverFormat(b.value)}
              </div>
            )}
            <div
              className={noAnimate ? "" : "anim-chart-bar"}
              style={{
                width:'100%', borderRadius:'5px 5px 3px 3px',
                background: b.value===0 ? 'var(--bg-deep)' : b.isToday ? `linear-gradient(180deg, ${getAlphaColor(barColor, 'ee')} 0%, ${barColor} 100%)` : getAlphaColor(barColor, '66'),
                height:`${Math.max((b.value/max)*100, b.value===0?6:10)}%`,
                boxShadow: b.isToday&&b.value>0 ? `0 2px 12px ${getAlphaColor(barColor, '40')}` : 'none',
                transition: 'transform 0.10s',
                transform: hov===i ? 'scaleX(0.80)' : 'scaleX(1)',
                transformOrigin: 'bottom center',
                '--i': i,
              } as React.CSSProperties}
            />
            <span style={{ fontSize:10, color:b.isToday?barColor:'var(--text-4)', fontWeight:b.isToday?700:400 }}>{b.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function getWeekLabels() {
  const today = new Date(); today.setHours(0,0,0,0);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today); d.setDate(today.getDate() - (6 - i));
    return { date: d.toISOString().split('T')[0], label: d.toLocaleDateString('en-US',{weekday:'short'}), isToday: i === 6 };
  });
}
