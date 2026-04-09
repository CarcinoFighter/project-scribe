'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FileText, BookOpen, Heart, Briefcase, 
  Calendar, Users, Check, Loader2 
} from 'lucide-react';
import { Task } from '@/types/task';

function fmtDate(iso: string) { 
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); 
}

export default function TaskCard({ task, onComplete }: { task: Task; onComplete: (id: string) => void }) {
  const [hov, setHov] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  
  const isArticle = task.category === 'article';
  const isBlog = task.category === 'blog';
  const isStory = task.category === 'survivor_story';
  const showEditor = (isArticle || isBlog || isStory) && !!task.document_id;
  
  const handleEdit = (e: React.MouseEvent) => { 
    e.stopPropagation(); 
    const t = isArticle ? 'cancer_docs' : isBlog ? 'blogs' : 'survivor_stories'; 
    router.push(`/editor?id=${task.document_id}&type=${t}`); 
  };
  
  const handleComplete = async () => { 
    if (isArticle || isBlog || isStory) {
      handleEdit({ stopPropagation: () => {} } as any);
      return;
    }
    setLoading(true); 
    await onComplete(task.id); 
    setLoading(false); 
  };

  const priCfg: Record<string, { bg: string; color: string; border: string }> = {
    high:   { bg: 'rgba(239,68,68,0.10)',  color: '#ef4444', border: 'rgba(239,68,68,0.20)'  },
    normal: { bg: 'rgba(245,158,11,0.09)', color: '#f59e0b', border: 'rgba(245,158,11,0.20)' },
    low:    { bg: 'rgba(74,222,128,0.09)', color: '#4ade80', border: 'rgba(74,222,128,0.20)' },
  };
  const p = priCfg[task.priority] || priCfg.normal;

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      className="glass-raised"
      style={{ 
        padding: '14px 16px', 
        borderRadius: 'var(--r-lg)', 
        display: 'flex', 
        alignItems: 'center', 
        gap: 14, 
        border: `1px solid ${hov ? 'var(--border-med)' : 'var(--border)'}`, 
        transition: 'transform 0.13s, box-shadow 0.13s, border-color 0.13s', 
        transform: hov ? 'translateY(-1px)' : 'none', 
        boxShadow: hov ? 'var(--sh-sm)' : 'var(--sh-xs)' 
      }}
    >
      <div style={{ 
        width: 36, height: 36, borderRadius: 10, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: isArticle ? 'rgba(59,130,246,0.10)' : isBlog ? 'var(--accent-subtle)' : isStory ? 'rgba(16,185,129,0.10)' : 'var(--bg-deep)' 
      }}>
        {isArticle ? <FileText size={16} style={{ color: '#3b82f6' }} /> : 
         isBlog ? <BookOpen size={16} style={{ color: 'var(--accent)' }} /> : 
         isStory ? <Heart size={16} style={{ color: '#10b981' }} /> : 
         <Briefcase size={16} style={{ color: 'var(--text-4)' }} />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</span>
          <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '2px 6px', borderRadius: 5, background: p.bg, color: p.color, border: `1px solid ${p.border}`, flexShrink: 0 }}>{task.priority}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {task.due_date && <span style={{ fontSize: 11, color: 'var(--text-4)', display: 'flex', alignItems: 'center', gap: 3 }}><Calendar size={10} />{fmtDate(task.due_date)}</span>}
          {task.department && <span style={{ fontSize: 11, color: 'var(--text-4)', display: 'flex', alignItems: 'center', gap: 3 }}><Users size={10} />{task.department}</span>}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        {showEditor && (
          <button onClick={handleEdit} className="tb-btn" style={{ background: 'var(--accent-subtle2)', color: 'var(--accent)', padding: '5px 11px', borderRadius: 7, fontSize: 11.5, fontWeight: 700, border: '1px solid var(--accent-subtle)', whiteSpace: 'nowrap' }}>
            Edit
          </button>
        )}
        <button onClick={handleComplete} disabled={loading} className="tb-btn"
          style={{ background: 'rgba(16,185,129,0.10)', color: '#10b981', padding: '5px 11px', borderRadius: 7, fontSize: 11.5, fontWeight: 700, border: '1px solid rgba(16,185,129,0.20)', whiteSpace: 'nowrap', opacity: loading ? 0.6 : 1 }}>
          {loading ? <Loader2 size={12} style={{ animation: 'spin 0.7s linear infinite' }} /> : <><Check size={11} /><span>Done</span></>}
        </button>
      </div>
    </div>
  );
}
