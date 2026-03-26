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
import { fmtWords as utilFmtWords, getGreeting, getTodayLabel } from '@/lib/utils';

interface WritersDashboardProps {
  user: any;
  allDocs: Doc[];
  fmtWords?: (n: number) => string; // Optional if we use util
  totalWords: number;
  weekWords: number;
  published: number;
  drafts: number;
  goalProgress: { current: number; goal: number } | null;
  docsLoading: boolean;
  tasksLoading: boolean;
  pendingTasks: any[];
  doneTasks: any[];
  articles: Doc[];
  blogs: Doc[];
  router: any;
  setActiveNav: (nav: 'home' | 'articles' | 'blogs') => void;
  toggleStar: (id: string) => void;
  handleContextMenu: (e: React.MouseEvent, id: string) => void;
  handleTaskCardComplete: (taskId: string) => Promise<void>;
  selectedDept?: string | null;
}

export default function WritersDashboard({
  user, allDocs, fmtWords, totalWords, weekWords, published, drafts, goalProgress,
  docsLoading, tasksLoading, pendingTasks, doneTasks, articles, blogs,
  router, setActiveNav, toggleStar, handleContextMenu, handleTaskCardComplete, selectedDept
}: WritersDashboardProps) {
  const displayFmtWords = fmtWords || utilFmtWords;
  return (
    <>
      <div className="anim-fade-up" style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 13, color: 'var(--text-4)', margin: 0 }}>
          {allDocs.length} documents · {displayFmtWords(totalWords)} total words
        </p>
      </div>

      {/* Quick actions */}
      <div className="anim-fade-up dash-quick-actions" style={{ display: 'flex', gap: 10, marginBottom: 20, animationDelay: '0.04s', flexWrap: 'wrap' }}>
        <QuickAction icon={FileText} label="New Article" sublabel="Research or cancer doc" color="#3b82f6" bg="rgba(59,130,246,0.08)" onClick={() => router.push('/editor')} />
        <QuickAction icon={BookOpen} label="New Blog Post" sublabel="Share your perspective" color="var(--accent)" bg="var(--accent-subtle)" onClick={() => router.push('/editor')} />
        <QuickAction icon={Heart} label="Survivor Story" sublabel="Community & support" color="#10b981" bg="rgba(16,185,129,0.08)" onClick={() => router.push('/editor')} />
      </div>

      {/* Stat cards */}
      <div className="stats-grid anim-fade-up" style={{ marginBottom: 18, animationDelay: '0.08s' }}>
        {[
          { label: 'Total Words', value: displayFmtWords(totalWords), sub: `${allDocs.length} documents`, icon: BarChart2, accent: true, onClick: undefined, progress: undefined },
          { label: 'This Week', value: displayFmtWords(weekWords), sub: 'words written', icon: TrendingUp, accent: false, onClick: () => {}, progress: undefined },
          { label: 'Published', value: published, sub: `${drafts} draft${drafts !== 1 ? 's' : ''} remaining`, icon: Award, accent: false, onClick: () => setActiveNav('articles'), progress: undefined },
          goalProgress
            ? { label: 'Word Goal', value: `${Math.round((goalProgress.current / goalProgress.goal) * 100)}%`, sub: `${goalProgress.current.toLocaleString()} / ${goalProgress.goal.toLocaleString()}`, icon: Target, accent: false, onClick: undefined, progress: goalProgress }
            : { label: 'Avg Read', value: allDocs.length ? `${Math.round(allDocs.reduce((s, d) => s + d.readTime, 0) / allDocs.length)}m` : '—', sub: 'per document', icon: Clock, accent: false, onClick: undefined, progress: undefined },
        ].map((card, i) => (
          <div key={card.label} className="anim-stagger" style={{ '--i': i } as React.CSSProperties}>
            <StatCard {...card} icon={card.icon} />
          </div>
        ))}
      </div>

      {/* Activity chart */}
      <div className="anim-fade-up" style={{ animationDelay: '0.12s' }}>
        <ActivityChart docs={allDocs} weekWords={weekWords} />
      </div>

      {/* Recent documents */}
      <div className="doc-grid-2" style={{ gap: 24, marginBottom: 24 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <FileText size={13} strokeWidth={2} style={{ color: '#3b82f6' }} />
              <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.01em' }}>Articles</span>
              {articles.length > 0 && <span style={{ fontSize: 10.5, color: 'var(--text-4)', background: 'var(--bg-deep)', borderRadius: 99, padding: '1px 7px' }}>{articles.length}</span>}
            </div>
            <button className="tb-btn" onClick={() => setActiveNav('articles')} style={{ fontSize: 11.5, gap: 2, color: 'var(--accent)' }}>
              View all <ChevronRight size={11} />
            </button>
          </div>
          {docsLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[0, 1].map(i => <div key={i} style={{ border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '13px 15px', display: 'flex', flexDirection: 'column', gap: 8 }}><Skeleton h={12} w="60%" /><Skeleton h={14} w="90%" /><Skeleton h={11} w="80%" /></div>)}
            </div>
          ) : articles.length === 0 ? (
            <EmptyDocState type="articles" onNew={() => router.push('/editor')} />
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
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <BookOpen size={13} strokeWidth={2} style={{ color: 'var(--accent)' }} />
              <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.01em' }}>Blog Posts</span>
              {blogs.length > 0 && <span style={{ fontSize: 10.5, color: 'var(--text-4)', background: 'var(--bg-deep)', borderRadius: 99, padding: '1px 7px' }}>{blogs.length}</span>}
            </div>
            <button className="tb-btn" onClick={() => setActiveNav('blogs')} style={{ fontSize: 11.5, gap: 2, color: 'var(--accent)' }}>
              View all <ChevronRight size={11} />
            </button>
          </div>
          {docsLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[0, 1].map(i => <div key={i} style={{ border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '13px 15px', display: 'flex', flexDirection: 'column', gap: 8 }}><Skeleton h={12} w="60%" /><Skeleton h={14} w="90%" /><Skeleton h={11} w="80%" /></div>)}
            </div>
          ) : blogs.length === 0 ? (
            <EmptyDocState type="blogs" onNew={() => router.push('/editor')} />
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
      </div>

      {/* Pending assignments — Hidden for Leadership to avoid double lists */}
      {!tasksLoading && pendingTasks.length > 0 && user?.department !== 'Leadership' && (
        <div style={{ marginBottom: 24 }} className="anim-fade-up" >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Briefcase size={14} strokeWidth={2} style={{ color: 'var(--accent)' }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.01em' }}>Pending Assignments</span>
            <span style={{ fontSize: 10.5, fontWeight: 700, borderRadius: 99, padding: '2px 9px', background: 'var(--accent)', color: '#fff' }}>{pendingTasks.length}</span>
            <div style={{ flex: 1 }} />
            <Link href="/tasks" style={{ textDecoration: 'none' }}>
              <button className="tb-btn" style={{ fontSize: 11.5, gap: 3, color: 'var(--accent)' }}>View all <ChevronRight size={11} /></button>
            </Link>
          </div>
          <div className="task-grid-2">
            {pendingTasks.slice(0, 4).map(task => (
              <TaskCard key={task.id} task={task} onComplete={handleTaskCardComplete} />
            ))}
          </div>
        </div>
      )}

      {/* Completed tasks — collapsed summary */}
      {!tasksLoading && doneTasks.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 14px', borderRadius: 'var(--r-md)', background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.14)' }}>
            <Check size={13} strokeWidth={2.5} style={{ color: '#4ade80' }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-3)' }}>{doneTasks.length} assignment{doneTasks.length !== 1 ? 's' : ''} completed</span>
            <span style={{ fontSize: 11.5, color: '#4ade80', marginLeft: 'auto' }}>Great work!</span>
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

          {(() => {
            const filtered = !selectedDept ? [] : []; // This logic needs to be handled via props or similar
            // For now, I'll pass the tasks down if needed, but the rollup is specific to Leadership
            return null; // LeadershipDashboard might handle this better
          })()}
        </div>
      )}
    </>
  );
}
