'use client';

import React, { useState } from 'react';
import { 
  FileText, BookOpen, Heart, Clock, Star, MoreHorizontal, Plus, ArrowRight
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Task } from '@/types/task';
import OriginalTaskCard from './TaskCard';

export interface Doc {
  id: string;
  type: 'blogs' | 'survivor_stories' | 'cancer_docs';
  title: string;
  excerpt: string;
  words: number;
  status: 'published' | 'review' | 'draft';
  date: string;
  readTime: number;
  tags: string[];
  starred: boolean;
  isActive?: boolean;
}

// ── Status pill ───────────────────────────────────────────────────────────────
export function StatusPill({ status }: { status: string }) {
  const cfg: Record<string, { bg: string; color: string; border: string }> = {
    published: { bg:'var(--accent-subtle2)', color:'var(--accent)',  border:'rgba(143,107,187,0.20)' },
    review:    { bg:'rgba(245,158,11,0.10)', color:'#f59e0b',        border:'rgba(245,158,11,0.20)'  },
    draft:     { bg:'var(--bg-deep)',        color:'var(--text-4)',  border:'var(--border-med)'      },
  };
  const s = cfg[status] || cfg.draft;
  return (
    <span style={{ fontSize:10, fontWeight:700, letterSpacing:'0.05em', textTransform:'uppercase',
      padding:'2px 7px', borderRadius:99, background:s.bg, color:s.color,
      border:`1px solid ${s.border}`, flexShrink:0, lineHeight:'16px' }}>
      {status}
    </span>
  );
}

// ── Activity chart ─────────────────────────────────────────────────────────────
export function ActivityChart({ docs, weekWords }: { docs: Doc[]; weekWords: number }) {
  const [hov, setHov] = useState<number|null>(null);
  
  const today = new Date(); today.setHours(0,0,0,0);
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today); d.setDate(today.getDate() - (6 - i));
    return { date: d.toISOString().split('T')[0], label: d.toLocaleDateString('en-US',{weekday:'short'}), isToday: i === 6 };
  });

  const bars = week.map(({date,label,isToday}) => {
    const dayDocs = docs.filter(d => d.date === date);
    return { 
      label, 
      isToday, 
      published: dayDocs.filter(d => d.status === 'published').reduce((s, d) => s + d.words, 0),
      review:    dayDocs.filter(d => d.status === 'review').reduce((s, d) => s + d.words, 0),
      draft:     dayDocs.filter(d => d.status === 'draft').reduce((s, d) => s + d.words, 0),
      total:     dayDocs.reduce((s, d) => s + d.words, 0)
    };
  });
  const max = Math.max(...bars.map(b => b.total), 1);
  const fmtWords = (n: number) => n >= 1000 ? `${(n/1000).toFixed(1)}k` : String(n);

  return (
    <div className="glass-raised" style={{ borderRadius:'var(--r-lg)', padding:'18px 20px', marginBottom:20 }}>
      <div className="dash-chart-header" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
        <div>
          <div style={{ fontSize:14, fontWeight:700, color:'var(--text)', letterSpacing:'-0.01em' }}>Writing Activity</div>
          <div style={{ fontSize:12, color:'var(--text-4)', marginTop:2 }}>Words written per day this week</div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 12px', borderRadius:'var(--r-sm)', background:'var(--accent-subtle)', border:'1px solid var(--accent-subtle2)' }}>
          <div style={{ width: 11, height: 11, borderRadius: '50%', background: 'var(--accent)' }} />
          <span style={{ fontSize:12, fontWeight:700, color:'var(--accent)' }}>{fmtWords(weekWords)} this week</span>
        </div>
      </div>
      <div style={{ display:'flex', alignItems:'flex-end', gap:8, height:100 }}>
        {bars.map((b,i) => (
          <div key={b.label} onMouseEnter={()=>setHov(i)} onMouseLeave={()=>setHov(null)}
            style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:6, height:'100%', justifyContent:'flex-end', position:'relative', cursor:'default' }}>
            {hov===i && (
              <div className="anim-fade-up" style={{ position:'absolute', bottom:'calc(100% + 4px)', background:'var(--surface-2)', border:'1px solid var(--border-med)', borderRadius:6, padding:'6px 10px', fontSize:11, color:'var(--text)', whiteSpace:'nowrap', boxShadow:'var(--sh-md)', pointerEvents:'none', zIndex:10, display:'flex', flexDirection:'column', gap:2 }}>
                <div style={{ fontWeight:800, marginBottom:2 }}>{b.total === 0 ? 'No activity' : b.total.toLocaleString() + ' words'}</div>
                {b.published > 0 && <div style={{ display:'flex', alignItems:'center', gap:5, color:'var(--accent)' }}><div style={{ width:6, height:6, borderRadius:'50%', background:'var(--accent)' }}/> {b.published.toLocaleString()} Published</div>}
                {b.review > 0 && <div style={{ display:'flex', alignItems:'center', gap:5, color:'#f59e0b' }}><div style={{ width:6, height:6, borderRadius:'50%', background:'#f59e0b' }}/> {b.review.toLocaleString()} In Review</div>}
                {b.draft > 0 && <div style={{ display:'flex', alignItems:'center', gap:5, color:'var(--text-4)' }}><div style={{ width:6, height:6, borderRadius:'50%', background:'var(--text-4)' }}/> {b.draft.toLocaleString()} Draft</div>}
              </div>
            )}
            <div
              className="anim-chart-bar"
              style={{
                width:'100%', borderRadius:'5px 5px 3px 3px',
                height:`${Math.max((b.total/max)*100, b.total===0?6:10)}%`,
                transition: 'transform 0.10s',
                transform: hov===i ? 'scaleX(0.80)' : 'scaleX(1)',
                transformOrigin: 'bottom center',
                display: 'flex',
                flexDirection: 'column-reverse',
                overflow: 'hidden',
                background: b.total === 0 ? 'var(--bg-deep)' : 'transparent',
                '--i': i,
              } as React.CSSProperties}
            >
              {b.total > 0 && (
                <>
                  <div style={{ flex: b.published, background: b.isToday ? 'linear-gradient(180deg, var(--accent-light) 0%, var(--accent) 100%)' : 'var(--accent)', minHeight: b.published > 0 ? 2 : 0 }} />
                  <div style={{ flex: b.review, background: '#f59e0b', minHeight: b.review > 0 ? 2 : 0 }} />
                  <div style={{ flex: b.draft, background: 'var(--text-4)', minHeight: b.draft > 0 ? 2 : 0 }} />
                </>
              )}
            </div>
            <span style={{ fontSize:10, color:b.isToday?'var(--accent)':'var(--text-4)', fontWeight:b.isToday?700:400 }}>{b.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Doc card ──────────────────────────────────────────────────────────────────
export function DocCard({ 
  doc, 
  onStar, 
  onContextMenu 
}: { 
  doc: Doc; 
  onStar: (id: string) => void; 
  onContextMenu: (e: React.MouseEvent, id: string) => void; 
}) {
  const [hov, setHov] = useState(false);
  const router = useRouter();
  const fmtWords = (n: number) => n >= 1000 ? `${(n/1000).toFixed(1)}k` : String(n);
  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('en-US',{month:'short',day:'numeric'});
  
  const typeColor = doc.type==='cancer_docs' ? '#3b82f6' : doc.type==='survivor_stories' ? '#10b981' : 'var(--accent)';
  const typeBg    = doc.type==='cancer_docs' ? 'rgba(59,130,246,0.10)' : doc.type==='survivor_stories' ? 'rgba(16,185,129,0.10)' : 'var(--accent-subtle)';
  const TypeIcon  = doc.type==='cancer_docs' ? FileText : doc.type==='survivor_stories' ? Heart : BookOpen;
  
  return (
    <div
      role="button" tabIndex={0}
      onMouseEnter={()=>setHov(true)}
      onMouseLeave={()=>setHov(false)}
      onClick={()=>router.push(`/editor?id=${doc.id}&type=${doc.type}`)}
      onKeyDown={e=>{if(e.key==='Enter')router.push(`/editor?id=${doc.id}&type=${doc.type}`);}}
      style={{
        background: hov ? 'var(--surface-1)' : 'transparent',
        border: `1px solid ${doc.isActive?'rgba(143,107,187,0.35)':hov?'var(--border-med)':'var(--border)'}`,
        borderRadius:'var(--r-lg)', padding:'13px 15px',
        cursor:'pointer', transition:'all 0.13s',
        display:'flex', flexDirection:'column', gap:8,
        transform: hov?'translateY(-1px)':'none',
        boxShadow: hov?'var(--sh-sm)':'none',
        userSelect:'none',
      }}
    >
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8 }}>
        <div style={{ display:'flex', alignItems:'center', gap:7 }}>
          <div style={{ width:24, height:24, borderRadius:6, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', background:typeBg }}>
            <TypeIcon size={11} strokeWidth={2.2} style={{ color:typeColor }}/>
          </div>
          <StatusPill status={doc.status}/>
          {doc.isActive && <span style={{ fontSize:9, fontWeight:700, background:'var(--accent)', color:'#fff', borderRadius:4, padding:'1px 6px', letterSpacing:'0.05em', textTransform:'uppercase' }}>Live</span>}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:3 }}>
          {doc.starred && <Star size={11} fill="var(--accent)" stroke="none"/>}
          <button className="tb-btn" onClick={e=>{e.stopPropagation();onContextMenu(e,doc.id);}} style={{ padding:'2px 4px', borderRadius:5, opacity:hov?1:0, transition:'opacity 0.10s' }}>
            <MoreHorizontal size={13}/>
          </button>
        </div>
      </div>
      <h3 style={{ fontSize:13.5, fontWeight:600, color:'var(--text)', lineHeight:1.42, margin:0 }}>{doc.title||'Untitled'}</h3>
      <p style={{ fontSize:11.5, color:'var(--text-4)', lineHeight:1.58, margin:0, overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' as const }}>
        {doc.excerpt||'No preview available.'}
      </p>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8, marginTop:2 }}>
        <div style={{ display:'flex', gap:3, flexWrap:'wrap', minWidth:0 }}>
          {(doc.tags||[]).slice(0,3).map((tag: string)=>(
            <span key={tag} style={{ fontSize:10, color:'var(--text-4)', background:'var(--bg-deep)', borderRadius:4, padding:'1px 6px' }}>#{tag}</span>
          ))}
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center', flexShrink:0 }}>
          <span style={{ fontSize:10.5, color:'var(--text-4)', display:'flex', alignItems:'center', gap:2 }}><Clock size={9}/>{doc.readTime||1}m</span>
          <span style={{ fontSize:10.5, color:'var(--text-4)' }}>{fmtWords(doc.words||0)}</span>
          <span style={{ fontSize:10.5, color:'var(--text-4)' }}>{fmtDate(doc.date)}</span>
        </div>
      </div>
    </div>
  );
}

// ── Quick action button ────────────────────────────────────────────────────────
export function QuickAction({ icon: Icon, label, sublabel, color, bg, onClick }: { icon: React.ElementType; label:string; sublabel:string; color:string; bg:string; onClick:()=>void; }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={()=>setHov(true)}
      onMouseLeave={()=>setHov(false)}
      style={{
        flex:1, minWidth:0, display:'flex', alignItems:'center', gap:12,
        padding:'12px 16px', borderRadius:'var(--r-lg)',
        border:`1px solid ${hov?color.replace(')',',0.35)').replace('rgb','rgba'):'var(--border)'}`,
        background: hov ? bg : 'transparent',
        cursor:'pointer', fontFamily:'inherit', textAlign:'left',
        transition:'all 0.13s', transform:hov?'translateY(-1px)':'none',
        boxShadow: hov?'var(--sh-sm)':'none',
      }}
    >
      <div style={{ width:32, height:32, borderRadius:9, background:bg, border:`1px solid ${color.replace(')',',0.25)').replace('rgb','rgba')}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'transform 0.13s', transform:hov?'scale(1.06)':'scale(1)' }}>
        <Icon size={15} style={{ color }} strokeWidth={2}/>
      </div>
      <div>
        <div style={{ fontSize:13, fontWeight:600, color:'var(--text)', lineHeight:1.3 }}>{label}</div>
        <div style={{ fontSize:11, color:'var(--text-4)', marginTop:1 }}>{sublabel}</div>
      </div>
      <ArrowRight size={13} style={{ marginLeft:'auto', color:hov?color:'var(--border-strong)', flexShrink:0, transition:'all 0.13s', transform:hov?'translateX(2px)':'none' }}/>
    </button>
  );
}

// ── Empty doc state ───────────────────────────────────────────────────────────
export function EmptyDocState({ type, onNew }: { type:'articles'|'blogs'; onNew:()=>void }) {
  const Icon = type==='articles' ? FileText : BookOpen;
  const label = type==='articles' ? 'article' : 'blog post';
  return (
    <div style={{ padding:'36px 20px', textAlign:'center', border:'1px dashed var(--border-med)', borderRadius:'var(--r-lg)', background:'var(--bg-alt)' }}>
      <Icon size={28} strokeWidth={1.2} style={{ margin:'0 auto 12px', display:'block', color:'var(--text-4)', opacity:0.45 }}/>
      <div style={{ fontSize:14, fontWeight:600, color:'var(--text)', marginBottom:6 }}>No {label}s yet</div>
      <div style={{ fontSize:12, color:'var(--text-4)', marginBottom:16 }}>Start writing your first {label}.</div>
      <button onClick={onNew} className="tb-btn" style={{ background:'var(--accent)', color:'#fff', padding:'7px 16px', borderRadius:'var(--r-md)', fontWeight:600, fontSize:12.5, gap:6, margin:'0 auto', display:'flex', boxShadow:'0 2px 12px var(--accent-glow)' }}>
        <Plus size={13} strokeWidth={2.5}/> New {label}
      </button>
    </div>
  );
}

// ── Skeleton loader ──────────────────────────────────────────────────────
export function Skeleton({ w='100%', h=14, r=6 }: { w?:string|number; h?:number; r?:number }) {
  return (
    <div style={{ width:w, height:h, borderRadius:r, background:'var(--bg-deep)', animation:'lp-shimmer 1.4s ease-in-out infinite' }}/>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────
export { StatCard } from './DashboardStats';

// ── Task card ─────────────────────────────────────────────────────────────────
export { default as TaskCard } from './TaskCard';
