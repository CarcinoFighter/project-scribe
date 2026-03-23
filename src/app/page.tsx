'use client';

import React, {
  useState, useEffect, useRef, useCallback, useMemo,
} from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import {
  FileText, BookOpen, Search, Moon, Sun, Bell, BellOff,
  ChevronRight, Plus, TrendingUp, Clock, BarChart2,
  Star, MoreHorizontal, Trash2, ExternalLink,
  ArrowRight, Settings,
  Activity, ChevronDown, PenTool,
  Home, Edit3, Award,
  Check, ArrowUpDown, Target, Loader2,
  Briefcase, Users, Heart, Calendar, Zap,
  Flame, BookMarked, Sparkles, TrendingDown,
} from 'lucide-react';
import { useUser } from '@/lib/useUser';
import AccountMenu from '@/components/AccountMenu';
import Toast from '@/components/Toast';
import SettingsModal, { loadSettings, saveSettings, applySettings, DEFAULT_SETTINGS, THEMES } from '@/components/SettingsModal';
import type { AppSettings } from '@/components/SettingsModal';

// ─── Types ───────────────────────────────────────────────────────────────────
interface Doc {
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
interface Notif { id: string; title: string; body: string; time: string; read: boolean; }
interface Task {
  id: string; title: string; description: string;
  category: 'task' | 'article' | 'blog' | 'survivor_story' | 'awareness_post';
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'normal' | 'high';
  due_date: string; department?: string; document_id?: string;
}
interface Cmd { id: string; label: string; hint?: string; icon: React.ElementType; shortcut?: string; group: string; }
type SortKey = 'date' | 'words' | 'status';
type FilterStatus = 'all' | 'published' | 'review' | 'draft';

// ─── Date helpers ─────────────────────────────────────────────────────────────
function getTodayStr() { return new Date().toISOString().split('T')[0]; }

function getWeekWindow() {
  const today = new Date(); today.setHours(0,0,0,0);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today); d.setDate(today.getDate() - (6 - i));
    return { date: d.toISOString().split('T')[0], label: d.toLocaleDateString('en-US',{weekday:'short'}), isToday: i === 6 };
  });
}

function getGreeting(name?: string) {
  const h = new Date().getHours();
  const part = h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
  const first = name?.split(' ')[0];
  return `Good ${part}${first ? `, ${first}` : ''}`;
}

function getTodayLabel() {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

// ─── Word helpers ─────────────────────────────────────────────────────────────
function countWords(text: string) { const t = text.trim(); return t ? t.split(/\s+/).length : 0; }
function excerptFrom(md: string) {
  for (const line of md.split('\n')) {
    const c = line.replace(/^#{1,6}\s+/,'').replace(/[*_`~[\]]/g,'').trim();
    if (c.length > 20) return c.slice(0,140)+(c.length>140?'…':'');
  }
  return '';
}
function fmtDate(iso: string) { return new Date(iso).toLocaleDateString('en-US',{month:'short',day:'numeric'}); }
function fmtWords(n: number) { return n >= 1000 ? `${(n/1000).toFixed(1)}k` : String(n); }
function sortDocs(docs: Doc[], by: SortKey) {
  return [...docs].sort((a,b) => {
    if (by==='date')   return new Date(b.date).getTime()-new Date(a.date).getTime();
    if (by==='words')  return b.words-a.words;
    if (by==='status') return a.status.localeCompare(b.status);
    return 0;
  });
}
function filterDocs(docs: Doc[], s: FilterStatus) { return s==='all' ? docs : docs.filter(d=>d.status===s); }

// ─── Seed data ────────────────────────────────────────────────────────────────
const SEED_NOTIFS: Notif[] = [
  { id:'n1', title:'Word goal reached', body:'You hit your word goal for the day — keep going!', time:'2m ago', read:false },
  { id:'n2', title:'Draft reminder',    body:'You have 2 documents still in draft.',              time:'1h ago', read:false },
  { id:'n3', title:'Weekly summary',    body:'Great writing week — check your overview.',          time:'3h ago', read:true  },
];

function buildCmds(): Cmd[] {
  return [
    { id:'new-doc',     label:'New Document',    hint:'Open editor',       icon:Plus,       shortcut:'Ctrl+N', group:'Create'      },
    { id:'open-editor', label:'Open Editor',      hint:'Go to /editor',     icon:Edit3,                         group:'Navigate'    },
    { id:'go-articles', label:'View Articles',    hint:'Show articles',     icon:FileText,                      group:'Navigate'    },
    { id:'go-blogs',    label:'View Blog Posts',  hint:'Show blogs',        icon:BookOpen,                      group:'Navigate'    },
    { id:'go-overview', label:'Overview',          hint:'Dashboard home',    icon:Home,                          group:'Navigate'    },
    { id:'theme',       label:'Toggle Theme',     hint:'Dark / Light',      icon:Moon,       shortcut:'Ctrl+T', group:'Preferences' },
    { id:'settings',    label:'Account Settings', hint:'Profile & billing', icon:Settings,                      group:'Preferences' },
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

// ── Status pill ───────────────────────────────────────────────────────────────
function StatusPill({ status }: { status: string }) {
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

// ── Notification panel ────────────────────────────────────────────────────────
function NotifPanel({ notifs, onMarkAllRead, onClose }: { notifs:Notif[]; onMarkAllRead:()=>void; onClose:()=>void; }) {
  const unread = notifs.filter(n=>!n.read).length;
  return (
    <div className="glass-overlay anim-drop-in" style={{ position:'absolute', right:0, top:'calc(100% + 8px)', borderRadius:'var(--r-lg)', width:300, overflow:'hidden', zIndex:200 }}>
      <div style={{ padding:'12px 16px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:7 }}>
          <Bell size={13} strokeWidth={2} style={{ color:'var(--text-3)' }} />
          <span style={{ fontSize:13, fontWeight:600, color:'var(--text)' }}>Notifications</span>
          {unread>0 && <span style={{ fontSize:10.5, fontWeight:700, background:'var(--accent)', color:'#fff', borderRadius:99, padding:'1px 6px' }}>{unread}</span>}
        </div>
        {unread>0 && (
          <button className="tb-btn" onClick={onMarkAllRead} style={{ fontSize:11.5, gap:4, color:'var(--accent)', padding:'3px 7px', borderRadius:6 }}>
            <BellOff size={11} strokeWidth={2} /> Mark read
          </button>
        )}
      </div>
      <div style={{ maxHeight:300, overflowY:'auto' }}>
        {notifs.map(n => (
          <div key={n.id} style={{ padding:'11px 16px', borderBottom:'1px solid var(--border)', background:!n.read?'var(--accent-subtle)':'transparent' }}>
            <div style={{ display:'flex', gap:9 }}>
              {!n.read && <div style={{ width:5, height:5, borderRadius:'50%', background:'var(--accent)', flexShrink:0, marginTop:6 }} />}
              <div style={{ flex:1, paddingLeft:n.read?14:0 }}>
                <div style={{ fontSize:12.5, fontWeight:600, color:'var(--text)', lineHeight:1.3 }}>{n.title}</div>
                <div style={{ fontSize:11.5, color:'var(--text-4)', marginTop:2, lineHeight:1.5 }}>{n.body}</div>
                <div style={{ fontSize:10.5, color:'var(--text-4)', marginTop:4 }}>{n.time}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ padding:'10px 16px', borderTop:'1px solid var(--border)' }}>
        <button className="tb-btn" onClick={onClose} style={{ fontSize:12, color:'var(--accent)', gap:4, padding:'4px 0' }}>
          Close <ChevronRight size={11} />
        </button>
      </div>
    </div>
  );
}

// ── Command palette ────────────────────────────────────────────────────────────
interface CtxPos { x:number; y:number; docId:string }

function CommandPalette({ docs, onClose, onCommand }: { docs:Doc[]; onClose:()=>void; onCommand:(id:string)=>void; }) {
  const [query,    setQuery]    = useState('');
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef  = useRef<HTMLDivElement>(null);
  const wrapRef  = useRef<HTMLDivElement>(null);
  const router   = useRouter();
  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => { setSelected(0); }, [query]);
  const cmds = useMemo(() => buildCmds(), []);
  const q = query.trim().toLowerCase();
  const matchDocs = useMemo(() => q ? docs.filter(d=>d.title.toLowerCase().includes(q)) : [], [docs,q]);
  const matchCmds = useMemo(() => cmds.filter(c=>!q||c.label.toLowerCase().includes(q)||(c.hint??'').toLowerCase().includes(q)), [cmds,q]);
  const groups    = useMemo(() => matchCmds.reduce<Record<string,Cmd[]>>((acc,cmd) => { (acc[cmd.group]??=[]).push(cmd); return acc; }, {}), [matchCmds]);
  type FI = {kind:'doc';doc:Doc;idx:number}|{kind:'cmd';cmd:Cmd;idx:number};
  const flat = useMemo<FI[]>(() => { let i=0; return [...matchDocs.map(doc=>({kind:'doc' as const,doc,idx:i++})), ...Object.values(groups).flat().map(cmd=>({kind:'cmd' as const,cmd,idx:i++}))]; }, [matchDocs,groups]);
  const run = useCallback((id:string) => { onCommand(id); onClose(); }, [onCommand,onClose]);
  useEffect(() => {
    const kh = (e:KeyboardEvent) => {
      if (e.key==='Escape') { onClose(); return; }
      if (e.key==='ArrowDown') { e.preventDefault(); setSelected(s=>Math.min(s+1,flat.length-1)); }
      if (e.key==='ArrowUp')   { e.preventDefault(); setSelected(s=>Math.max(s-1,0)); }
      if (e.key==='Enter') { e.preventDefault(); const item=flat[selected]; if(!item)return; if(item.kind==='doc'){router.push('/editor');onClose();}else run(item.cmd.id); }
    };
    const mh = (e:MouseEvent) => { if(wrapRef.current&&!wrapRef.current.contains(e.target as Node))onClose(); };
    window.addEventListener('keydown',kh); document.addEventListener('mousedown',mh);
    return () => { window.removeEventListener('keydown',kh); document.removeEventListener('mousedown',mh); };
  }, [flat,selected,run,onClose,router]);
  useEffect(() => { listRef.current?.querySelector(`[data-idx="${selected}"]`)?.scrollIntoView({block:'nearest'}); }, [selected]);
  return createPortal(
    <>
      <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.40)', backdropFilter:'blur(4px)', zIndex:9989 }} />
      <div ref={wrapRef} className="glass-overlay scale-in" style={{ position:'fixed', top:'12%', left:'50%', transform:'translateX(-50%)', width:520, maxWidth:'calc(100vw - 32px)', borderRadius:18, overflow:'hidden', zIndex:9990 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'0 16px', borderBottom:'1px solid var(--border-med)', height:52 }}>
          <Search size={15} strokeWidth={1.8} style={{ color:'var(--text-3)', flexShrink:0 }} />
          <input ref={inputRef} value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search documents and commands…" style={{ flex:1, background:'none', border:'none', outline:'none', fontFamily:'inherit', fontSize:15, color:'var(--text)' }} />
          <kbd onClick={onClose} style={{ cursor:'pointer', fontSize:11 }}>Esc</kbd>
        </div>
        <div ref={listRef} style={{ maxHeight:360, overflowY:'auto', padding:6 }}>
          {flat.length===0 ? (
            <div style={{ padding:'28px 16px', textAlign:'center', color:'var(--text-4)', fontSize:13 }}>No results for &ldquo;{query}&rdquo;</div>
          ) : (
            <>
              {matchDocs.length>0 && (
                <section>
                  <div style={{ padding:'6px 10px 3px', fontSize:10, fontWeight:700, letterSpacing:'0.10em', textTransform:'uppercase', color:'var(--text-4)' }}>Documents</div>
                  {matchDocs.map(doc => {
                    const entry = flat.find(f=>f.kind==='doc'&&f.doc.id===doc.id)!;
                    const Icon = doc.type==='blogs' ? BookOpen : FileText;
                    return (
                      <button key={doc.id} data-idx={entry.idx} className={`cmd-item${entry.idx===selected?' selected':''}`} onMouseEnter={()=>setSelected(entry.idx)} onClick={()=>{router.push('/editor');onClose();}}>
                        <Icon size={14} strokeWidth={1.8} style={{ flexShrink:0, opacity:0.75 }} />
                        <span style={{ flex:1 }}>{doc.title}</span>
                        {doc.isActive && <span style={{ fontSize:9, background:'var(--accent)', color:'#fff', borderRadius:4, padding:'1px 5px', fontWeight:700 }}>ACTIVE</span>}
                      </button>
                    );
                  })}
                </section>
              )}
              {Object.entries(groups).map(([group,groupCmds]) => (
                <section key={group}>
                  <div style={{ padding:'6px 10px 3px', fontSize:10, fontWeight:700, letterSpacing:'0.10em', textTransform:'uppercase', color:'var(--text-4)' }}>{group}</div>
                  {groupCmds.map(cmd => {
                    const entry = flat.find(f=>f.kind==='cmd'&&f.cmd.id===cmd.id)!;
                    const Icon = cmd.icon;
                    return (
                      <button key={cmd.id} data-idx={entry.idx} className={`cmd-item${entry.idx===selected?' selected':''}`} onMouseEnter={()=>setSelected(entry.idx)} onClick={()=>run(cmd.id)}>
                        <Icon size={14} strokeWidth={1.8} style={{ flexShrink:0, opacity:0.75 }} />
                        <span style={{ flex:1 }}>{cmd.label}</span>
                        {cmd.hint && <span style={{ fontSize:11.5, color:'var(--text-4)' }}>{cmd.hint}</span>}
                        {cmd.shortcut && <kbd>{cmd.shortcut}</kbd>}
                      </button>
                    );
                  })}
                </section>
              ))}
            </>
          )}
        </div>
      </div>
    </>,
    document.body
  );
}

// ── Doc context menu ──────────────────────────────────────────────────────────
function DocContextMenu({ pos, docs, onStar, onDelete, onOpen, onClose }: { pos:CtxPos; docs:Doc[]; onStar:(id:string)=>void; onDelete:(id:string)=>void; onOpen:()=>void; onClose:()=>void; }) {
  const doc = docs.find(d=>d.id===pos.docId);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h=(e:MouseEvent)=>{ if(ref.current&&!ref.current.contains(e.target as Node))onClose(); };
    const k=(e:KeyboardEvent)=>{ if(e.key==='Escape')onClose(); };
    document.addEventListener('mousedown',h); document.addEventListener('keydown',k);
    return ()=>{ document.removeEventListener('mousedown',h); document.removeEventListener('keydown',k); };
  }, [onClose]);
  if(!doc) return null;
  const left = Math.min(pos.x, window.innerWidth-190);
  const top  = Math.min(pos.y, window.innerHeight-130);
  return createPortal(
    <div ref={ref} className="glass-overlay scale-in" style={{ position:'fixed', left, top, width:182, borderRadius:'var(--r-lg)', overflow:'hidden', zIndex:9980, padding:4 }}>
      {[
        { icon:ExternalLink, label:'Open in Editor',   action:()=>{onOpen();onClose();} },
        { icon:Star,         label:doc.starred?'Remove star':'Add star', action:()=>{onStar(doc.id);onClose();}, style:doc.starred?{color:'var(--accent)'}:undefined },
        { icon:Trash2,       label:'Delete',            action:()=>{onDelete(doc.id);onClose();}, style:{color:'#ef4444'} },
      ].map(item => (
        <button key={item.label} className="tb-btn" style={{ width:'100%', justifyContent:'flex-start', padding:'8px 12px', borderRadius:'var(--r-sm)', gap:9, ...(item.style||{}) }} onClick={item.action}>
          <item.icon size={13} strokeWidth={1.8} />
          <span style={{ fontSize:12.5 }}>{item.label}</span>
        </button>
      ))}
    </div>,
    document.body
  );
}

// ── Sort/filter bar ───────────────────────────────────────────────────────────
function SortFilterBar({ sortBy, setSortBy, filter, setFilter, total }: { sortBy:SortKey; setSortBy:(k:SortKey)=>void; filter:FilterStatus; setFilter:(f:FilterStatus)=>void; total:number; }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16, flexWrap:'wrap' }}>
      <div style={{ display:'flex', gap:3, background:'var(--bg-deep)', border:'1px solid var(--border)', borderRadius:99, padding:3 }}>
        {(['all','published','review','draft'] as FilterStatus[]).map(f => (
          <button key={f} className="tb-btn" onClick={()=>setFilter(f)} style={{ padding:'3px 11px', borderRadius:99, fontSize:11.5, fontWeight:filter===f?600:400, background:filter===f?'var(--surface-2)':'transparent', color:filter===f?'var(--text)':'var(--text-4)', boxShadow:filter===f?'var(--sh-xs)':undefined, textTransform:'capitalize' }}>
            {f==='all'?`All (${total})`:f}
          </button>
        ))}
      </div>
      <div style={{ flex:1 }} />
      <div style={{ display:'flex', alignItems:'center', gap:4 }}>
        <span style={{ fontSize:11.5, color:'var(--text-4)' }}>Sort by</span>
        {(['date','words','status'] as SortKey[]).map(k => (
          <button key={k} className="tb-btn" onClick={()=>setSortBy(k)} style={{ padding:'3px 9px', borderRadius:6, fontSize:11.5, background:sortBy===k?'var(--accent-subtle2)':'transparent', color:sortBy===k?'var(--accent)':'var(--text-4)', fontWeight:sortBy===k?600:400, textTransform:'capitalize' }}>
            {k}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon: Icon, accent, onClick, progress }: { label:string; value:string|number; sub:string; icon:React.ElementType; accent?:boolean; onClick?:()=>void; progress?:{current:number;goal:number}; }) {
  const [hov, setHov] = useState(false);
  const pct = progress ? Math.min(progress.current/progress.goal,1) : null;
  const R=9, C=2*Math.PI*R;
  return (
    <div
      role={onClick?'button':undefined} tabIndex={onClick?0:undefined}
      onClick={onClick}
      onMouseEnter={()=>onClick&&setHov(true)}
      onMouseLeave={()=>onClick&&setHov(false)}
      style={{
        background: accent
          ? 'linear-gradient(135deg, var(--accent) 0%, var(--accent-hover) 100%)'
          : 'var(--surface-1)',
        border: `1px solid ${accent?'transparent':'var(--border)'}`,
        borderRadius:'var(--r-lg)', padding:'16px 18px',
        boxShadow: accent ? '0 4px 24px var(--accent-glow), 0 1px 4px rgba(0,0,0,0.10)' : 'var(--sh-xs)',
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
            <circle cx="12" cy="12" r={R} fill="none" stroke={pct>=1?'#4ade80':(accent?'#fff':'var(--accent)')} strokeWidth="2" strokeLinecap="round"
              strokeDasharray={C} strokeDashoffset={C*(1-pct)} className="goal-ring"
              style={{ transform:'rotate(-90deg)', transformOrigin:'12px 12px' }}/>
          </svg>
        ) : (
          <div style={{ width:28, height:28, borderRadius:8, background:accent?'rgba(255,255,255,0.18)':'var(--accent-subtle)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <Icon size={13} strokeWidth={2} style={{ color:accent?'#fff':'var(--accent)' }} />
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

// ── Activity chart ─────────────────────────────────────────────────────────────
function ActivityChart({ docs, weekWords }: { docs:Doc[]; weekWords:number }) {
  const [hov, setHov] = useState<number|null>(null);
  const week = useMemo(()=>getWeekWindow(),[]);
  const bars = useMemo(()=>week.map(({date,label,isToday})=>({ label, isToday, words:docs.filter(d=>d.date===date).reduce((s,d)=>s+d.words,0) })),[docs,week]);
  const max  = Math.max(...bars.map(b=>b.words), 1);
  return (
    <div className="glass-raised" style={{ borderRadius:'var(--r-lg)', padding:'18px 20px', marginBottom:20 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
        <div>
          <div style={{ fontSize:14, fontWeight:700, color:'var(--text)', letterSpacing:'-0.01em' }}>Writing Activity</div>
          <div style={{ fontSize:12, color:'var(--text-4)', marginTop:2 }}>Words written per day this week</div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 12px', borderRadius:'var(--r-sm)', background:'var(--accent-subtle)', border:'1px solid var(--accent-subtle2)' }}>
          <Activity size={11} style={{ color:'var(--accent)' }} />
          <span style={{ fontSize:12, fontWeight:700, color:'var(--accent)' }}>{fmtWords(weekWords)} this week</span>
        </div>
      </div>
      <div style={{ display:'flex', alignItems:'flex-end', gap:8, height:100 }}>
        {bars.map((b,i) => (
          <div key={b.label} onMouseEnter={()=>setHov(i)} onMouseLeave={()=>setHov(null)}
            style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:6, height:'100%', justifyContent:'flex-end', position:'relative', cursor:'default' }}>
            {hov===i && (
              <div className="anim-fade-up" style={{ position:'absolute', bottom:'calc(100% + 4px)', background:'var(--surface-2)', border:'1px solid var(--border-med)', borderRadius:6, padding:'3px 8px', fontSize:11, fontWeight:700, color:'var(--text)', whiteSpace:'nowrap', boxShadow:'var(--sh-sm)', pointerEvents:'none', zIndex:10 }}>
                {b.words===0 ? 'No words' : fmtWords(b.words)+' words'}
              </div>
            )}
            <div
              className="anim-chart-bar"
              style={{
                width:'100%', borderRadius:'5px 5px 3px 3px',
                background: b.words===0 ? 'var(--bg-deep)' : b.isToday ? 'linear-gradient(180deg, var(--accent-light) 0%, var(--accent) 100%)' : 'var(--accent-subtle2)',
                height:`${Math.max((b.words/max)*100, b.words===0?6:10)}%`,
                boxShadow: b.isToday&&b.words>0 ? '0 2px 12px var(--accent-glow)' : 'none',
                transition: 'transform 0.10s',
                transform: hov===i ? 'scaleX(0.80)' : 'scaleX(1)',
                transformOrigin: 'bottom center',
                '--i': i,
              } as React.CSSProperties}
            />
            <span style={{ fontSize:10, color:b.isToday?'var(--accent)':'var(--text-4)', fontWeight:b.isToday?700:400 }}>{b.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Task card ─────────────────────────────────────────────────────────────────
function TaskCard({ task, onComplete }: { task:Task; onComplete:(id:string)=>void }) {
  const [hov, setHov] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const isArticle=task.category==='article', isBlog=task.category==='blog', isStory=task.category==='survivor_story';
  const showEditor=(isArticle||isBlog||isStory)&&!!task.document_id;
  const handleEdit=(e:React.MouseEvent)=>{ e.stopPropagation(); const t=isArticle?'cancer_docs':isBlog?'blogs':'survivor_stories'; router.push(`/editor?id=${task.document_id}&type=${t}`); };
  const handleComplete=async()=>{ setLoading(true); await onComplete(task.id); setLoading(false); };

  const priCfg: Record<string,{bg:string;color:string;border:string}> = {
    high:   { bg:'rgba(239,68,68,0.10)',  color:'#ef4444', border:'rgba(239,68,68,0.20)'  },
    normal: { bg:'rgba(245,158,11,0.09)', color:'#f59e0b', border:'rgba(245,158,11,0.20)' },
    low:    { bg:'rgba(74,222,128,0.09)', color:'#4ade80', border:'rgba(74,222,128,0.20)' },
  };
  const p = priCfg[task.priority]||priCfg.normal;

  return (
    <div
      onMouseEnter={()=>setHov(true)}
      onMouseLeave={()=>setHov(false)}
      className="glass-raised"
      style={{ padding:'14px 16px', borderRadius:'var(--r-lg)', display:'flex', alignItems:'center', gap:14, border:`1px solid ${hov?'var(--border-med)':'var(--border)'}`, transition:'transform 0.13s, box-shadow 0.13s, border-color 0.13s', transform:hov?'translateY(-1px)':'none', boxShadow:hov?'var(--sh-sm)':'var(--sh-xs)' }}
    >
      <div style={{ width:36, height:36, borderRadius:10, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center',
        background: isArticle?'rgba(59,130,246,0.10)':isBlog?'var(--accent-subtle)':isStory?'rgba(16,185,129,0.10)':'var(--bg-deep)' }}>
        {isArticle?<FileText size={16} style={{color:'#3b82f6'}}/>:isBlog?<BookOpen size={16} style={{color:'var(--accent)'}}/>:isStory?<Heart size={16} style={{color:'#10b981'}}/>:<Briefcase size={16} style={{color:'var(--text-4)'}}/>}
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:4 }}>
          <span style={{ fontSize:13, fontWeight:600, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{task.title}</span>
          <span style={{ fontSize:9, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em', padding:'2px 6px', borderRadius:5, background:p.bg, color:p.color, border:`1px solid ${p.border}`, flexShrink:0 }}>{task.priority}</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
          {task.due_date && <span style={{ fontSize:11, color:'var(--text-4)', display:'flex', alignItems:'center', gap:3 }}><Calendar size={10}/>{fmtDate(task.due_date)}</span>}
          {task.department && <span style={{ fontSize:11, color:'var(--text-4)', display:'flex', alignItems:'center', gap:3 }}><Users size={10}/>{task.department}</span>}
        </div>
      </div>
      <div style={{ display:'flex', gap:6, flexShrink:0 }}>
        {showEditor && (
          <button onClick={handleEdit} className="tb-btn" style={{ background:'var(--accent-subtle2)', color:'var(--accent)', padding:'5px 11px', borderRadius:7, fontSize:11.5, fontWeight:700, border:'1px solid var(--accent-subtle)', whiteSpace:'nowrap' }}>
            Edit
          </button>
        )}
        <button onClick={handleComplete} disabled={loading} className="tb-btn"
          style={{ background:'rgba(16,185,129,0.10)', color:'#10b981', padding:'5px 11px', borderRadius:7, fontSize:11.5, fontWeight:700, border:'1px solid rgba(16,185,129,0.20)', whiteSpace:'nowrap', opacity:loading?0.6:1 }}>
          {loading ? <Loader2 size={12} style={{animation:'spin 0.7s linear infinite'}}/> : <><Check size={11}/><span>Done</span></>}
        </button>
      </div>
    </div>
  );
}

// ── Doc card ──────────────────────────────────────────────────────────────────
function DocCard({ doc, onStar, onContextMenu }: { doc:Doc; onStar:(id:string)=>void; onContextMenu:(e:React.MouseEvent,id:string)=>void; }) {
  const [hov, setHov] = useState(false);
  const router = useRouter();
  const isArticle = doc.type==='cancer_docs'||doc.type==='survivor_stories';
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
          {(doc.tags||[]).slice(0,3).map(tag=>(
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
function QuickAction({ icon: Icon, label, sublabel, color, bg, onClick }: { icon: React.ElementType; label:string; sublabel:string; color:string; bg:string; onClick:()=>void; }) {
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
function EmptyDocState({ type, onNew }: { type:'articles'|'blogs'; onNew:()=>void }) {
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

// ─────────────────────────────────────────────────────────────────────────────
// MAIN DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();

  const [docs,             setDocs]             = useState<Doc[]>([]);
  const [lsDoc,            setLsDoc]            = useState<Doc|null>(null);
  const [isDark,           setIsDark]           = useState(false);
  const [showSettings,     setShowSettings]     = useState(false);
  const [appSettings,      setAppSettings]      = useState<AppSettings>(DEFAULT_SETTINGS);
  const [activeNav,        setActiveNav]        = useState<'home'|'articles'|'blogs'>('home');
  const [showCmd,          setShowCmd]          = useState(false);
  const [notifs,           setNotifs]           = useState<Notif[]>(SEED_NOTIFS);
  const [toast,            setToast]            = useState<string|null>(null);
  const [sortBy,           setSortBy]           = useState<SortKey>('date');
  const [filter,           setFilter]           = useState<FilterStatus>('all');
  const [ctxMenu,          setCtxMenu]          = useState<CtxPos|null>(null);
  const [showNotifPanel,   setShowNotifPanel]   = useState(false);
  const [showAccountMenu,  setShowAccountMenu]  = useState(false);
  const [accountMenuPos,   setAccountMenuPos]   = useState<{top:number;right:number}|null>(null);
  const [wordGoal,         setWordGoal]         = useState(0);
  const [tasks,            setTasks]            = useState<Task[]>([]);
  const [docsLoading,      setDocsLoading]      = useState(true);
  const [tasksLoading,     setTasksLoading]     = useState(true);

  const notifRef      = useRef<HTMLDivElement>(null);
  const accountBtnRef = useRef<HTMLButtonElement>(null);
  const accountRef    = useRef<HTMLDivElement>(null);
  const appSettingsRef = useRef<AppSettings>(DEFAULT_SETTINGS);

  useEffect(() => { appSettingsRef.current = appSettings; }, [appSettings]);

  useEffect(() => {
    try {
      const s = loadSettings(); setAppSettings(s);
      const darkFromTheme = applySettings(s); setIsDark(darkFromTheme);
      const goal = localStorage.getItem('cs-goal');
      if (goal) setWordGoal(parseInt(goal,10)||0);
      const rawContent = localStorage.getItem('cs-content');
      const name = localStorage.getItem('cs-name')||'Untitled Document';
      if (rawContent) {
        const words=countWords(rawContent), readTime=Math.max(1,Math.round(words/200)), excerpt=excerptFrom(rawContent);
        setLsDoc({ id:'ls-active', type:'cancer_docs', title:name, excerpt:excerpt||'Document in editor.', words, status:'draft', date:getTodayStr(), readTime, tags:[], starred:false, isActive:true });
      }
    } catch {}
  }, []);

  useEffect(() => {
    (async()=>{ try { const r=await fetch('/api/documents'); if(r.ok){const d=await r.json();setDocs(d.documents);} } catch {} finally { setDocsLoading(false); } })();
  }, []);

  useEffect(() => {
    (async()=>{ try { const r=await fetch('/api/work'); if(r.ok){const d=await r.json();setTasks(d.assignments||[]);} } catch {} finally { setTasksLoading(false); } })();
  }, []);

  useEffect(() => {
    const h=(e:KeyboardEvent)=>{ const mod=e.ctrlKey||e.metaKey; if(mod&&e.key==='k'){e.preventDefault();setShowCmd(c=>!c);} if(e.key==='Escape'){setShowCmd(false);setCtxMenu(null);setShowNotifPanel(false);setShowAccountMenu(false);} };
    window.addEventListener('keydown',h); return()=>window.removeEventListener('keydown',h);
  }, []);

  useEffect(() => {
    const h=(e:MouseEvent)=>{ if(!notifRef.current?.contains(e.target as Node))setShowNotifPanel(false); if(!accountBtnRef.current?.contains(e.target as Node))setShowAccountMenu(false); };
    document.addEventListener('mousedown',h); return()=>document.removeEventListener('mousedown',h);
  }, []);

  const showToastMsg = useCallback((msg:string)=>setToast(msg),[]);

  const toggleStar = useCallback((id:string)=>{ if(id==='ls-active'){setLsDoc(d=>d?{...d,starred:!d.starred}:null);setToast(lsDoc?.starred?'Removed from starred':'Added to starred');return;} setDocs(ds=>ds.map(d=>d.id===id?{...d,starred:!d.starred}:d)); const doc=docs.find(d=>d.id===id); setToast(doc?.starred?'Removed from starred':'Added to starred'); },[docs,lsDoc]);

  const deleteDoc = useCallback(async(id:string)=>{ const all=lsDoc?[lsDoc,...docs]:docs; const doc=all.find(d=>d.id===id); if(!doc)return; if(id==='ls-active'){setLsDoc(null);localStorage.removeItem('cs-content');localStorage.removeItem('cs-name');localStorage.removeItem('cs-tabs');}else{setDocs(ds=>ds.filter(d=>d.id!==id));try{await fetch(`/api/documents?id=${id}&type=${doc.type}`,{method:'DELETE'});}catch{}} setToast(`Deleted "${doc.title.slice(0,28)}…"`); },[docs,lsDoc]);

  const handleCompleteTask = useCallback(async(taskId:string)=>{ try { const r=await fetch('/api/work',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:taskId,status:'done'})}); if(r.ok){setTasks(ts=>ts.map(t=>t.id===taskId?{...t,status:'done'}:t));setToast('Task completed ✓');}else{setToast('Failed to update task');} }catch{setToast('Error updating task');} },[]);

  const toggleTheme = useCallback(()=>{ const cur=appSettingsRef.current; const d2l:Record<string,string>={'default-dark':'default-light','catppuccin-mocha':'catppuccin-latte','solarized-dark':'solarized-light'}; const l2d=Object.fromEntries(Object.entries(d2l).map(([k,v])=>[v,k])); const curDark=THEMES[cur.theme]?.dark??isDark; const next={...cur,theme:curDark?(d2l[cur.theme]??'default-light'):(l2d[cur.theme]??'default-dark')}; setAppSettings(next);saveSettings(next);setIsDark(applySettings(next)); },[isDark]);

  const handleCommand = useCallback((id:string)=>{ if(id==='theme')toggleTheme(); else if(id==='new-doc'||id==='open-editor')router.push('/editor'); else if(id==='go-articles')setActiveNav('articles'); else if(id==='go-blogs')setActiveNav('blogs'); else if(id==='go-overview')setActiveNav('home'); else if(id==='settings')setShowSettings(true); },[toggleTheme,router]);

  const allDocs = useMemo(()=>lsDoc?[lsDoc,...docs]:docs,[docs,lsDoc]);
  const articles    = useMemo(()=>allDocs.filter(d=>d.type==='cancer_docs'||d.type==='survivor_stories'),[allDocs]);
  const blogs       = useMemo(()=>allDocs.filter(d=>d.type==='blogs'),[allDocs]);
  const totalWords  = useMemo(()=>allDocs.reduce((s,d)=>s+d.words,0),[allDocs]);
  const published   = useMemo(()=>allDocs.filter(d=>d.status==='published').length,[allDocs]);
  const drafts      = useMemo(()=>allDocs.filter(d=>d.status==='draft').length,[allDocs]);
  const starredDocs = useMemo(()=>allDocs.filter(d=>d.starred),[allDocs]);
  const unreadCount = useMemo(()=>notifs.filter(n=>!n.read).length,[notifs]);
  const weekWindow  = useMemo(()=>getWeekWindow().map(w=>w.date),[]);
  const weekWords   = useMemo(()=>allDocs.filter(d=>weekWindow.includes(d.date)).reduce((s,d)=>s+d.words,0),[allDocs,weekWindow]);
  const goalProgress = wordGoal>0&&lsDoc ? {current:lsDoc.words,goal:wordGoal} : null;
  const sortedArticles = useMemo(()=>filterDocs(sortDocs(articles,sortBy),filter),[articles,sortBy,filter]);
  const sortedBlogs    = useMemo(()=>filterDocs(sortDocs(blogs,sortBy),filter),[blogs,sortBy,filter]);
  const pendingTasks   = useMemo(()=>tasks.filter(t=>t.status!=='done'),[tasks]);
  const doneTasks      = useMemo(()=>tasks.filter(t=>t.status==='done'),[tasks]);

  const handleContextMenu = useCallback((e:React.MouseEvent,id:string)=>{ const rect=(e.currentTarget as HTMLElement).getBoundingClientRect(); setCtxMenu({docId:id,x:rect.left,y:rect.bottom+4}); },[]);

  const sep = { width:1, height:18, background:'var(--border-med)', margin:'0 2px', flexShrink:0, display:'inline-block' } as const;

  // ── Skeleton loader ──────────────────────────────────────────────────────
  const Skeleton = ({ w='100%', h=14, r=6 }: { w?:string|number; h?:number; r?:number }) => (
    <div style={{ width:w, height:h, borderRadius:r, background:'var(--bg-deep)', animation:'lp-shimmer 1.4s ease-in-out infinite' }}/>
  );

  return (
    <div className={`app-bg ${isDark?'dark':''}`} style={{ minHeight:'100vh', display:'flex', flexDirection:'column' }}>

      {/* ══ HEADER ═══════════════════════════════════════════════════════════ */}
      <header
        id="app-header"
        className="app-header flex-shrink-0 anim-slide-down"
        style={{
          height:52, display:'flex', alignItems:'center', padding:'0 14px', gap:4,
          position:'sticky', top:0, zIndex:50,
          borderBottom:'1px solid var(--border-med)',
          background:'var(--surface-0)',
          backdropFilter:'blur(20px) saturate(180%) brightness(1.02)',
          WebkitBackdropFilter:'blur(20px) saturate(180%) brightness(1.02)',
          boxShadow:'inset 0 -1px 0 var(--border-med), 0 1px 12px rgba(0,0,0,0.04)',
        }}
      >
        {/* Logo */}
        <div style={{ display:'flex', alignItems:'center', gap:7, marginRight:4, flexShrink:0, userSelect:'none' }}>
          <Image src="/logo.svg" alt="Carcino" width={18} height={22} priority/>
          <span style={{ fontWeight:700, fontSize:14, color:'var(--text)', letterSpacing:'-0.02em' }}>
            Carcino <span style={{ color:'var(--accent)' }}>Vantage</span>
          </span>
        </div>

        <span style={sep}/>

        {/* Command search */}
        <button className="tb-btn" onClick={()=>setShowCmd(true)} title="Search (Ctrl+K)"
          style={{ gap:7, padding:'5px 10px', borderRadius:8, border:'1px solid var(--border)', background:'var(--bg-deep)' }}>
          <Search size={12} strokeWidth={1.8} style={{ opacity:0.6 }}/>
          <span className="hidden sm:inline" style={{ fontSize:12, color:'var(--text-4)', fontWeight:400, whiteSpace:'nowrap' }}>
            Search or command…
          </span>
          <kbd style={{ fontSize:9, padding:'1px 5px', borderRadius:4, background:'var(--bg-alt)', border:'1px solid var(--border-strong)', color:'var(--text-4)', lineHeight:1.7 }}>⌘K</kbd>
        </button>

        <div style={{ flex:1 }}/>

        <div style={{ display:'flex', alignItems:'center', gap:2 }}>
          {/* Notifications */}
          <div ref={notifRef} style={{ position:'relative' }}>
            <button className="tb-btn" title="Notifications" onClick={()=>{setShowNotifPanel(o=>!o);setShowAccountMenu(false);}}
              style={{ position:'relative', background:showNotifPanel?'var(--accent-subtle2)':undefined, color:showNotifPanel?'var(--accent)':undefined }}>
              <Bell size={15} strokeWidth={1.8}/>
              {unreadCount>0 && (
                <span key={unreadCount} className="anim-badge-bounce"
                  style={{ position:'absolute', top:4, right:4, width:7, height:7, borderRadius:99, background:'var(--accent)', border:'1.5px solid var(--bg)' }}/>
              )}
            </button>
            {showNotifPanel && <NotifPanel notifs={notifs} onMarkAllRead={()=>{setNotifs(ns=>ns.map(n=>({...n,read:true})));setToast('All read');}} onClose={()=>setShowNotifPanel(false)}/>}
          </div>

          {/* Theme */}
          <button className="tb-btn" onClick={toggleTheme} title={isDark?'Light mode':'Dark mode'}>
            {isDark?<Sun size={15} strokeWidth={1.8}/>:<Moon size={15} strokeWidth={1.8}/>}
          </button>

          <span style={sep}/>

          {/* New */}
          <Link href="/editor">
            <button className="tb-btn" style={{ background:'var(--accent)', color:'#fff', padding:'5px 14px', borderRadius:8, fontWeight:600, fontSize:12.5, gap:5, boxShadow:'0 1px 8px var(--accent-glow)' }}>
              <Plus size={13} strokeWidth={2.5}/>
              <span className="hidden sm:inline">New</span>
            </button>
          </Link>

          <span style={sep}/>

          {/* Account */}
          <div ref={accountRef} style={{ position:'relative' }}>
            <button ref={accountBtnRef} className="tb-btn"
              onClick={()=>{ if(!showAccountMenu&&accountBtnRef.current){const r=accountBtnRef.current.getBoundingClientRect();setAccountMenuPos({top:r.bottom+8,right:window.innerWidth-r.right});} setShowAccountMenu(o=>!o);setShowNotifPanel(false); }}
              style={{ gap:6, padding:'3px 8px 3px 4px', borderRadius:8, background:showAccountMenu?'var(--accent-subtle2)':undefined }}>
              {user?.avatar_url ? (
                <div style={{ width:24, height:24, borderRadius:'50%', overflow:'hidden' }}>
                  <Image src={user.avatar_url} alt="Profile" width={24} height={24}/>
                </div>
              ) : (
                <div style={{ width:24, height:24, borderRadius:'50%', background:'linear-gradient(135deg,var(--accent) 0%,var(--accent-hover) 100%)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:9.5, fontWeight:700 }}>
                  {user?.name?.split(' ').map((n:string)=>n[0]).join('').slice(0,2)||'S'}
                </div>
              )}
              <span className="hidden md:block" style={{ fontSize:12.5, fontWeight:600, color:'var(--text)' }}>{user?.name||''}</span>
              <ChevronDown size={11} strokeWidth={2.5} style={{ color:'var(--text-4)' }}/>
            </button>
          </div>
        </div>
      </header>

      {/* ══ BODY ═════════════════════════════════════════════════════════════ */}
      <div style={{ display:'flex', flex:1, minHeight:0 }}>

        {/* ── SIDEBAR ────────────────────────────────────────────────────── */}
        <aside className="sidebar-col anim-slide-left"
          style={{ width:216, flexShrink:0, borderRight:'1px solid var(--border)', padding:'16px 10px', display:'flex', flexDirection:'column', gap:2, position:'sticky', top:52, height:'calc(100vh - 52px)', overflowY:'auto', animationDelay:'0.06s' }}>

          <div style={{ fontSize:9.5, fontWeight:700, color:'var(--text-4)', letterSpacing:'0.12em', textTransform:'uppercase', padding:'0 8px 8px' }}>Workspace</div>

          {([
            { id:'home',     label:'Overview',    icon:Home,     count:null,           href:null },
            { id:'articles', label:'Articles',    icon:FileText, count:articles.length, href:null },
            { id:'blogs',    label:'Blog Posts',  icon:BookOpen, count:blogs.length,    href:null },
            { id:'work',     label:'Assignments', icon:Briefcase,count:pendingTasks.length||null, href:'/work' },
            { id:'team',     label:'Team',        icon:Users,    count:null,           href:'/team' },
          ] as const).map((item,i) => {
            const isActive = activeNav===(item.id as string);
            const inner = (
              <>
                <item.icon size={13} strokeWidth={isActive?2.2:1.8} style={{ flexShrink:0 }}/>
                <span style={{ flex:1, fontSize:13, fontWeight:isActive?600:400 }}>{item.label}</span>
                {item.count!==null && item.count>0 && (
                  <span style={{ fontSize:10, fontWeight:700, borderRadius:99, padding:'1px 7px', background:isActive?'var(--accent)':'var(--bg-deep)', color:isActive?'#fff':'var(--text-4)', flexShrink:0 }}>
                    {item.count}
                  </span>
                )}
              </>
            );
            const sharedStyle: React.CSSProperties = { display:'flex', alignItems:'center', gap:7, padding:'7px 10px', borderRadius:'var(--r-sm)', border:'none', background:isActive?'var(--accent-subtle2)':'transparent', color:isActive?'var(--accent)':'var(--text-3)', cursor:'pointer', fontFamily:'inherit', textAlign:'left', width:'100%', transition:'background 0.10s, color 0.10s', '--i':i } as React.CSSProperties;
            return item.href ? (
              <Link key={item.id} href={item.href} style={{ ...sharedStyle, textDecoration:'none' }} className="outline-item anim-stagger">{inner}</Link>
            ) : (
              <button key={item.id} onClick={()=>setActiveNav(item.id as 'home'|'articles'|'blogs')} className="outline-item anim-stagger" style={sharedStyle}>{inner}</button>
            );
          })}

          <div style={{ height:1, background:'var(--border)', margin:'10px 4px 8px' }}/>

          <div style={{ fontSize:9.5, fontWeight:700, color:'var(--text-4)', letterSpacing:'0.12em', textTransform:'uppercase', padding:'0 8px 6px' }}>Starred</div>

          {starredDocs.length===0 ? (
            <p style={{ fontSize:11.5, color:'var(--text-4)', padding:'2px 10px', margin:0, lineHeight:1.5 }}>
              Star a document to pin it here.
            </p>
          ) : starredDocs.map(doc => (
            <button key={doc.id} className="outline-item" onClick={()=>router.push('/editor')}
              style={{ display:'flex', alignItems:'center', gap:7, padding:'5px 10px', borderRadius:'var(--r-sm)', border:'none', background:'transparent', color:'var(--text-3)', cursor:'pointer', fontFamily:'inherit', fontSize:12, width:'100%', textAlign:'left' }}>
              <Star size={10} fill="var(--accent)" stroke="none" style={{ flexShrink:0 }}/>
              <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {doc.title.length>24?doc.title.slice(0,24)+'…':doc.title}
              </span>
            </button>
          ))}

          {/* Word goal widget */}
          {wordGoal>0&&lsDoc && (
            <>
              <div style={{ height:1, background:'var(--border)', margin:'10px 4px 8px' }}/>
              <div style={{ padding:'10px 10px', borderRadius:'var(--r-sm)', background:'var(--accent-subtle)', border:'1px solid var(--accent-subtle2)' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                    <Target size={11} style={{ color:'var(--accent)' }}/>
                    <span style={{ fontSize:11.5, fontWeight:600, color:'var(--accent)' }}>Word Goal</span>
                  </div>
                  <span style={{ fontSize:10.5, color:'var(--accent)', fontWeight:600 }}>
                    {Math.round((lsDoc.words/wordGoal)*100)}%
                  </span>
                </div>
                <div style={{ fontSize:12, color:'var(--text)', fontWeight:600, marginBottom:6 }}>
                  {lsDoc.words.toLocaleString()} <span style={{ color:'var(--text-4)', fontWeight:400 }}>/ {wordGoal.toLocaleString()}</span>
                </div>
                <div style={{ height:4, background:'var(--bg-deep)', borderRadius:99, overflow:'hidden' }}>
                  <div style={{ height:'100%', background:lsDoc.words>=wordGoal?'#4ade80':'var(--accent)', borderRadius:99, width:`${Math.min((lsDoc.words/wordGoal)*100,100)}%`, transition:'width 0.4s cubic-bezier(0.34,1.2,0.64,1)' }}/>
                </div>
              </div>
            </>
          )}

          <div style={{ flex:1 }}/>

          {/* Open editor CTA */}
          <Link href="/editor" style={{ textDecoration:'none' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, padding:'9px 12px', borderRadius:'var(--r-md)', border:'1px solid var(--border-med)', background:'var(--accent-subtle)', color:'var(--accent)', cursor:'pointer', transition:'all 0.13s' }}
              onMouseOver={e=>{(e.currentTarget as HTMLDivElement).style.background='var(--accent-subtle2)';}} 
              onMouseOut={e=>{(e.currentTarget as HTMLDivElement).style.background='var(--accent-subtle)';}}>
              <PenTool size={12} strokeWidth={2.2}/>
              <span style={{ fontSize:12.5, fontWeight:600, flex:1 }}>Open Editor</span>
              <ArrowRight size={11}/>
            </div>
          </Link>
        </aside>

        {/* ── MAIN CONTENT ───────────────────────────────────────────────── */}
        <main style={{ flex:1, padding:'28px 30px', overflowY:'auto', minWidth:0 }}>

          {/* ── Overview ─────────────────────────────────────────────────── */}
          {activeNav==='home' && (
            <>
              {/* Greeting */}
              <div className="anim-fade-up" style={{ marginBottom:24 }}>
                <h1 style={{ fontSize:22, fontWeight:700, color:'var(--text)', margin:'0 0 3px', letterSpacing:'-0.025em', lineHeight:1.2 }}>
                  {getGreeting(user?.name)}
                </h1>
                <p style={{ fontSize:13, color:'var(--text-4)', margin:0 }}>{getTodayLabel()} · {allDocs.length} documents · {fmtWords(totalWords)} total words</p>
              </div>

              {/* Quick actions */}
              <div className="anim-fade-up" style={{ display:'flex', gap:10, marginBottom:20, animationDelay:'0.04s', flexWrap:'wrap' }}>
                <QuickAction icon={FileText}  label="New Article"       sublabel="Research or cancer doc" color="#3b82f6"         bg="rgba(59,130,246,0.08)"  onClick={()=>router.push('/editor')}/>
                <QuickAction icon={BookOpen}  label="New Blog Post"     sublabel="Share your perspective" color="var(--accent)"   bg="var(--accent-subtle)"   onClick={()=>router.push('/editor')}/>
                <QuickAction icon={Heart}     label="Survivor Story"    sublabel="Community & support"    color="#10b981"         bg="rgba(16,185,129,0.08)"  onClick={()=>router.push('/editor')}/>
              </div>

              {/* Stat cards */}
              <div className="stats-grid anim-fade-up" style={{ marginBottom:18, animationDelay:'0.08s' }}>
                {[
                  { label:'Total Words',    value:fmtWords(totalWords), sub:`${allDocs.length} documents`,                     icon:BarChart2,  accent:true,  onClick:undefined,                       progress:undefined },
                  { label:'This Week',      value:fmtWords(weekWords),  sub:'words written',                                   icon:TrendingUp, accent:false, onClick:()=>showToastMsg('Week stats'),  progress:undefined },
                  { label:'Published',      value:published,            sub:`${drafts} draft${drafts!==1?'s':''} remaining`,   icon:Award,      accent:false, onClick:()=>setActiveNav('articles'),    progress:undefined },
                  goalProgress
                    ? { label:'Word Goal',  value:`${Math.round((goalProgress.current/goalProgress.goal)*100)}%`, sub:`${goalProgress.current.toLocaleString()} / ${goalProgress.goal.toLocaleString()}`, icon:Target, accent:false, onClick:undefined, progress:goalProgress }
                    : { label:'Avg Read',   value:allDocs.length?`${Math.round(allDocs.reduce((s,d)=>s+d.readTime,0)/allDocs.length)}m`:'—', sub:'per document', icon:Clock, accent:false, onClick:undefined, progress:undefined },
                ].map((card,i) => (
                  <div key={card.label} className="anim-stagger" style={{'--i':i} as React.CSSProperties}>
                    <StatCard {...card} icon={card.icon}/>
                  </div>
                ))}
              </div>

              {/* Activity chart */}
              <div className="anim-fade-up" style={{ animationDelay:'0.12s' }}>
                <ActivityChart docs={allDocs} weekWords={weekWords}/>
              </div>

              {/* Pending assignments */}
              {!tasksLoading && pendingTasks.length>0 && (
                <div style={{ marginBottom:24 }} className="anim-fade-up" >
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
                    <Briefcase size={14} strokeWidth={2} style={{ color:'var(--accent)' }}/>
                    <span style={{ fontSize:14, fontWeight:700, color:'var(--text)', letterSpacing:'-0.01em' }}>Pending Assignments</span>
                    <span style={{ fontSize:10.5, fontWeight:700, borderRadius:99, padding:'2px 9px', background:'var(--accent)', color:'#fff' }}>{pendingTasks.length}</span>
                    <div style={{ flex:1 }}/>
                    <Link href="/work" style={{ textDecoration:'none' }}>
                      <button className="tb-btn" style={{ fontSize:11.5, gap:3, color:'var(--accent)' }}>View all <ChevronRight size={11}/></button>
                    </Link>
                  </div>
                  <div className="task-grid-2">
                    {pendingTasks.slice(0,4).map(task => (
                      <TaskCard key={task.id} task={task} onComplete={handleCompleteTask}/>
                    ))}
                  </div>
                </div>
              )}

              {/* Completed tasks — collapsed summary */}
              {!tasksLoading && doneTasks.length>0 && (
                <div style={{ marginBottom:24 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:6, padding:'10px 14px', borderRadius:'var(--r-md)', background:'rgba(74,222,128,0.06)', border:'1px solid rgba(74,222,128,0.14)' }}>
                    <Check size={13} strokeWidth={2.5} style={{ color:'#4ade80' }}/>
                    <span style={{ fontSize:13, fontWeight:600, color:'var(--text-3)' }}>{doneTasks.length} assignment{doneTasks.length!==1?'s':''} completed</span>
                    <span style={{ fontSize:11.5, color:'#4ade80', marginLeft:'auto' }}>Great work!</span>
                  </div>
                </div>
              )}

              {/* Recent documents */}
              <div className="doc-grid-2" style={{ gap:24 }}>
                <div>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <FileText size={13} strokeWidth={2} style={{ color:'#3b82f6' }}/>
                      <span style={{ fontSize:13.5, fontWeight:700, color:'var(--text)', letterSpacing:'-0.01em' }}>Articles</span>
                      {articles.length>0 && <span style={{ fontSize:10.5, color:'var(--text-4)', background:'var(--bg-deep)', borderRadius:99, padding:'1px 7px' }}>{articles.length}</span>}
                    </div>
                    <button className="tb-btn" onClick={()=>setActiveNav('articles')} style={{ fontSize:11.5, gap:2, color:'var(--accent)' }}>
                      View all <ChevronRight size={11}/>
                    </button>
                  </div>
                  {docsLoading ? (
                    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                      {[0,1].map(i=><div key={i} style={{ border:'1px solid var(--border)', borderRadius:'var(--r-lg)', padding:'13px 15px', display:'flex', flexDirection:'column', gap:8 }}><Skeleton h={12} w="60%"/><Skeleton h={14} w="90%"/><Skeleton h={11} w="80%"/></div>)}
                    </div>
                  ) : articles.length===0 ? (
                    <EmptyDocState type="articles" onNew={()=>router.push('/editor')}/>
                  ) : (
                    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                      {articles.slice(0,3).map((doc,i)=>(
                        <div key={doc.id} className="anim-stagger" style={{'--i':i+1} as React.CSSProperties}>
                          <DocCard doc={doc} onStar={toggleStar} onContextMenu={handleContextMenu}/>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <BookOpen size={13} strokeWidth={2} style={{ color:'var(--accent)' }}/>
                      <span style={{ fontSize:13.5, fontWeight:700, color:'var(--text)', letterSpacing:'-0.01em' }}>Blog Posts</span>
                      {blogs.length>0 && <span style={{ fontSize:10.5, color:'var(--text-4)', background:'var(--bg-deep)', borderRadius:99, padding:'1px 7px' }}>{blogs.length}</span>}
                    </div>
                    <button className="tb-btn" onClick={()=>setActiveNav('blogs')} style={{ fontSize:11.5, gap:2, color:'var(--accent)' }}>
                      View all <ChevronRight size={11}/>
                    </button>
                  </div>
                  {docsLoading ? (
                    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                      {[0,1].map(i=><div key={i} style={{ border:'1px solid var(--border)', borderRadius:'var(--r-lg)', padding:'13px 15px', display:'flex', flexDirection:'column', gap:8 }}><Skeleton h={12} w="60%"/><Skeleton h={14} w="90%"/><Skeleton h={11} w="80%"/></div>)}
                    </div>
                  ) : blogs.length===0 ? (
                    <EmptyDocState type="blogs" onNew={()=>router.push('/editor')}/>
                  ) : (
                    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                      {blogs.slice(0,3).map((doc,i)=>(
                        <div key={doc.id} className="anim-stagger" style={{'--i':i+1} as React.CSSProperties}>
                          <DocCard doc={doc} onStar={toggleStar} onContextMenu={handleContextMenu}/>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* ── Articles list ─────────────────────────────────────────────── */}
          {activeNav==='articles' && (
            <>
              <div className="anim-fade-up" style={{ marginBottom:20, display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12 }}>
                <div>
                  <h1 style={{ fontSize:21, fontWeight:700, color:'var(--text)', margin:'0 0 3px', letterSpacing:'-0.025em' }}>Articles</h1>
                  <p style={{ fontSize:13, color:'var(--text-4)', margin:0 }}>{articles.length} articles · {articles.filter(a=>a.status==='published').length} published</p>
                </div>
                <Link href="/editor">
                  <button className="tb-btn" style={{ background:'var(--accent)', color:'#fff', padding:'7px 14px', borderRadius:'var(--r-md)', fontWeight:600, fontSize:13, gap:6, flexShrink:0, boxShadow:'0 1px 8px var(--accent-glow)' }}>
                    <Plus size={14} strokeWidth={2.5}/> New Article
                  </button>
                </Link>
              </div>
              <SortFilterBar sortBy={sortBy} setSortBy={setSortBy} filter={filter} setFilter={setFilter} total={articles.length}/>
              {sortedArticles.length===0 ? (
                <EmptyDocState type="articles" onNew={()=>router.push('/editor')}/>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {sortedArticles.map((doc,i)=>(
                    <div key={doc.id} className="anim-stagger-fast" style={{'--i':i} as React.CSSProperties}>
                      <DocCard doc={doc} onStar={toggleStar} onContextMenu={handleContextMenu}/>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── Blogs list ────────────────────────────────────────────────── */}
          {activeNav==='blogs' && (
            <>
              <div className="anim-fade-up" style={{ marginBottom:20, display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12 }}>
                <div>
                  <h1 style={{ fontSize:21, fontWeight:700, color:'var(--text)', margin:'0 0 3px', letterSpacing:'-0.025em' }}>Blog Posts</h1>
                  <p style={{ fontSize:13, color:'var(--text-4)', margin:0 }}>{blogs.length} posts · {blogs.filter(b=>b.status==='published').length} published</p>
                </div>
                <Link href="/editor">
                  <button className="tb-btn" style={{ background:'var(--accent)', color:'#fff', padding:'7px 14px', borderRadius:'var(--r-md)', fontWeight:600, fontSize:13, gap:6, flexShrink:0, boxShadow:'0 1px 8px var(--accent-glow)' }}>
                    <Plus size={14} strokeWidth={2.5}/> New Post
                  </button>
                </Link>
              </div>
              <SortFilterBar sortBy={sortBy} setSortBy={setSortBy} filter={filter} setFilter={setFilter} total={blogs.length}/>
              {sortedBlogs.length===0 ? (
                <EmptyDocState type="blogs" onNew={()=>router.push('/editor')}/>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {sortedBlogs.map((doc,i)=>(
                    <div key={doc.id} className="anim-stagger-fast" style={{'--i':i} as React.CSSProperties}>
                      <DocCard doc={doc} onStar={toggleStar} onContextMenu={handleContextMenu}/>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* ══ OVERLAYS ════════════════════════════════════════════════════════ */}
      {showCmd && <CommandPalette docs={allDocs} onClose={()=>setShowCmd(false)} onCommand={handleCommand}/>}
      {ctxMenu && <DocContextMenu pos={ctxMenu} docs={allDocs} onStar={toggleStar} onDelete={deleteDoc} onOpen={()=>router.push('/editor')} onClose={()=>setCtxMenu(null)}/>}
      {toast && <Toast message={toast} onDismiss={()=>setToast(null)}/>}

      {showAccountMenu && accountMenuPos && createPortal(
        <div style={{ position:'fixed', top:accountMenuPos.top, right:accountMenuPos.right, zIndex:9960 }} onMouseDown={e=>e.stopPropagation()}>
          <AccountMenu user={user} onClose={()=>setShowAccountMenu(false)} onToast={showToastMsg} onOpenSettings={()=>setShowSettings(true)}/>
        </div>,
        document.body
      )}

      {showSettings && (
        <SettingsModal settings={appSettings} onClose={()=>setShowSettings(false)} onChange={next=>{setAppSettings(next);saveSettings(next);setIsDark(applySettings(next));}}/>
      )}
    </div>
  );
}
