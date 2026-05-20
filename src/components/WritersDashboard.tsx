'use client';

import React from 'react';
import Link from 'next/link';
import { 
  FileText, BookOpen, Heart, BarChart2, TrendingUp, Award, Target, Clock, ChevronRight, Briefcase, Check
} from 'lucide-react';
import { 
  StatCard, ActivityChart, QuickAction, DocCard, EmptyDocState, Skeleton, TaskCard, 
  Doc 
} from '@/components/WritersDashboardComponents';
import { fmtWords as utilFmtWords } from '@/lib/utils';

interface WritersDashboardProps {
  user: {
    id: string;
    name: string;
    email: string;
    avatar_url: string | null;
    admin_access: boolean;
    department: string | null;
  };
  allDocs: Doc[];
  fmtWords?: (n: number) => string;
  totalWords: number;
  weekWords: number;
  published: number;
  drafts: number;
  goalProgress: { current: number; goal: number } | null;
  docsLoading: boolean;
  tasksLoading: boolean;
  pendingTasks: any[]; // These are Task objects, using any for now but should use Task
  doneTasks: any[];
  articles: Doc[];
  blogs: Doc[];
  router: { push: (url: string) => void };
  setActiveNav: (nav: 'home' | 'articles' | 'blogs') => void;
  toggleStar: (id: string) => void;
  handleContextMenu: (e: React.MouseEvent, id: string) => void;
  handleTaskCardComplete: (taskId: string) => Promise<void>;
  selectedDept?: string | null;
  canCreate?: boolean;
}

export default function WritersDashboard({
  user, allDocs, fmtWords, totalWords, weekWords, published, drafts, goalProgress,
  docsLoading, tasksLoading, pendingTasks, doneTasks, articles, blogs,
  router, setActiveNav, toggleStar, handleContextMenu, handleTaskCardComplete, selectedDept,
  canCreate = true,
}: WritersDashboardProps) {
  const displayFmtWords = fmtWords || utilFmtWords;
  return (
    <>
      {/* CREATE ACTIONS — Row of three buttons */}
      {canCreate && (
        <div className="anim-fade-up dash-quick-actions" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 40, animationDelay: '0.02s' }}>
          <QuickAction icon={FileText} label="New Article" sublabel="Research or cancer doc" color="#3b82f6" bg="rgba(59,130,246,0.08)" onClick={() => router.push('/editor')} />
          <QuickAction icon={BookOpen} label="New Blog Post" sublabel="Share your perspective" color="var(--accent)" bg="var(--accent-subtle)" onClick={() => router.push('/editor')} />
          <QuickAction icon={Heart} label="Survivor Story" sublabel="Community & support" color="#10b981" bg="rgba(16,185,129,0.08)" onClick={() => router.push('/editor')} />
        </div>
      )}

      <hr style={{ border: 'none', borderTop: '1px solid var(--rule)', margin: '40px 0', boxShadow: '0 1.5px 0 var(--ink), 0 3px 0 var(--rule)', height: 0 }} />

      {/* TOP ROW: Activity Chart + Insight Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, marginBottom: 40 }}>
        <div className="anim-fade-up" style={{ animationDelay: '0.04s' }}>
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: '8px', fontFamily: 'var(--ff-mono)', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--mid)', margin: 0, marginBottom: 8 }}>This Week</p>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)', margin: 0, letterSpacing: '-0.02em' }}>Writing Activity</h2>
          </div>
          <ActivityChart docs={allDocs} weekWords={weekWords} />
        </div>

        <div className="anim-fade-up" style={{ animationDelay: '0.06s' }}>
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: '8px', fontFamily: 'var(--ff-mono)', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--mid)', margin: 0, marginBottom: 8 }}>Insights</p>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)', margin: 0, letterSpacing: '-0.02em' }}>Performance</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { label: 'Avg Read Time', value: allDocs.length ? `${Math.round(allDocs.reduce((s, d) => s + d.readTime, 0) / allDocs.length)}m` : '—', sub: 'per document', icon: Clock, accent: false, onClick: undefined, progress: undefined },
              { label: 'Peak Engagement', value: Math.max(...allDocs.map(d => d.readTime), 0) || '—', sub: 'max read time', icon: TrendingUp, accent: false, onClick: () => {}, progress: undefined },
            ].map((card) => (
              <div key={card.label}>
                <StatCard {...card} icon={card.icon} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid var(--rule)', margin: '40px 0', boxShadow: '0 1.5px 0 var(--ink), 0 3px 0 var(--rule)', height: 0 }} />

      {/* CONTENT GRID: Articles, Blogs, Assignments */}
      <div style={{ marginBottom: 20 }}>
        <p style={{ fontSize: '8px', fontFamily: 'var(--ff-mono)', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--mid)', margin: 0, marginBottom: 8 }}>Content</p>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)', margin: 0, letterSpacing: '-0.02em' }}>Your Work</h2>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, marginBottom: 40 }}>
        {/* ARTICLES SECTION */}
        <div className="anim-fade-up" style={{ animationDelay: '0.08s' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileText size={14} strokeWidth={1.8} style={{ color: '#3b82f6' }} />
              <div>
                <p style={{ fontSize: '9px', fontFamily: 'var(--ff-mono)', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--mid)', margin: 0 }}>Articles</p>
                <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', margin: 0, letterSpacing: '-0.01em' }}>{articles.length}</p>
              </div>
            </div>
            {articles.length > 0 && <button className="tb-btn" onClick={() => setActiveNav('articles')} style={{ fontSize: 11, gap: 3, color: 'var(--accent)' }}>
              View all <ChevronRight size={11} />
            </button>}
          </div>
          {docsLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[0, 1].map(i => <div key={i} style={{ border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '13px 15px', display: 'flex', flexDirection: 'column', gap: 8 }}><Skeleton h={12} w="60%" /><Skeleton h={14} w="90%" /><Skeleton h={11} w="80%" /></div>)}
            </div>
          ) : articles.length === 0 ? (
            <EmptyDocState type="articles" onNew={() => router.push('/editor')} canCreate={canCreate} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {articles.slice(0, 3).map((doc, i) => (
                <div key={doc.id} className="anim-stagger" style={{ '--i': i + 1 } as React.CSSProperties}>
                  <DocCard doc={doc} onStar={toggleStar} onContextMenu={handleContextMenu} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* BLOG POSTS SECTION */}
        <div className="anim-fade-up" style={{ animationDelay: '0.10s' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <BookOpen size={14} strokeWidth={1.8} style={{ color: 'var(--accent)' }} />
              <div>
                <p style={{ fontSize: '9px', fontFamily: 'var(--ff-mono)', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--mid)', margin: 0 }}>Blog Posts</p>
                <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', margin: 0, letterSpacing: '-0.01em' }}>{blogs.length}</p>
              </div>
            </div>
            {blogs.length > 0 && <button className="tb-btn" onClick={() => setActiveNav('blogs')} style={{ fontSize: 11, gap: 3, color: 'var(--accent)' }}>
              View all <ChevronRight size={11} />
            </button>}
          </div>
          {docsLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[0, 1].map(i => <div key={i} style={{ border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '13px 15px', display: 'flex', flexDirection: 'column', gap: 8 }}><Skeleton h={12} w="60%" /><Skeleton h={14} w="90%" /><Skeleton h={11} w="80%" /></div>)}
            </div>
          ) : blogs.length === 0 ? (
            <EmptyDocState type="blogs" onNew={() => router.push('/editor')} canCreate={canCreate} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {blogs.slice(0, 3).map((doc, i) => (
                <div key={doc.id} className="anim-stagger" style={{ '--i': i + 1 } as React.CSSProperties}>
                  <DocCard doc={doc} onStar={toggleStar} onContextMenu={handleContextMenu} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ASSIGNMENTS SECTION */}
        {!tasksLoading && pendingTasks.length > 0 && user?.department !== 'Leadership' && (
          <div className="anim-fade-up" style={{ animationDelay: '0.12s' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Briefcase size={14} strokeWidth={1.8} style={{ color: 'var(--accent)' }} />
                <div>
                  <p style={{ fontSize: '9px', fontFamily: 'var(--ff-mono)', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--mid)', margin: 0 }}>Assignments</p>
                  <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', margin: 0, letterSpacing: '-0.01em' }}>{pendingTasks.length} pending</p>
                </div>
              </div>
              <Link href="/tasks" style={{ textDecoration: 'none' }}>
                <button className="tb-btn" style={{ fontSize: 11, gap: 3, color: 'var(--accent)' }}>View all <ChevronRight size={11} /></button>
              </Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {pendingTasks.slice(0, 3).map((task, i) => (
                <div key={task.id} className="anim-stagger" style={{ '--i': i + 1 } as React.CSSProperties}>
                  <TaskCard task={task} onComplete={handleTaskCardComplete} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* COMPLETED TASKS SUMMARY */}
      {!tasksLoading && doneTasks.length > 0 && (
        <div style={{ marginBottom: 32 }} className="anim-fade-up">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px', background: 'var(--cream)', border: '1px solid var(--rule)', borderLeft: '2px solid #4ade80' }}>
            <Check size={14} strokeWidth={2.5} style={{ color: '#4ade80', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '8px', fontFamily: 'var(--ff-mono)', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--mid)', margin: 0 }}>Completed</p>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', margin: 0 }}>{doneTasks.length} assignment{doneTasks.length !== 1 ? 's' : ''} finished</p>
            </div>
          </div>
        </div>
      )}

      {/* Leadership assignments rollup */}
      {user?.department === 'Leadership' && (
        <div style={{ marginTop: 40, marginBottom: 80 }} className="anim-fade-up">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, borderBottom: '1px solid var(--border)', paddingBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--accent-subtle2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Briefcase size={16} style={{ color: 'var(--accent)' }} />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', margin: 0, letterSpacing: '-0.02em' }}>
                {selectedDept ? `${selectedDept} Assignments` : "Global Assignment Rollup"}
              </h3>
            </div>
            <span style={{ fontSize: 11, color: 'var(--text-4)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
              All Categories & Articles
            </span>
          </div>
        </div>
      )}
    </>
  );
}
