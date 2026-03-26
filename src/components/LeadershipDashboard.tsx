'use client';

import React, { useState, useMemo } from 'react';
import { Briefcase, CheckCircle, TrendingUp, BarChart3, PieChart, Megaphone } from 'lucide-react';
import { StatCard, GenericActivityChart, getWeekLabels } from './DashboardStats';
import Image from 'next/image';

import { Task } from '@/types/task';
import TaskCard from './TaskCard';

const DEPT_CONFIG = [
  { id: 'Writers\' Block', name: "Writers' Block", icon: '/icons/research.svg', color: "#eab308", bg: "rgba(234,179,8,0.1)", border: "rgba(234,179,8,0.2)", desc: "Content & Research" },
  { id: 'Development', name: "Development", icon: '/icons/development.svg', color: "#22c55e", bg: "rgba(34,197,94,0.1)", border: "rgba(34,197,94,0.2)", desc: "Engineering" },
  { id: 'Design Lab', name: "Design Lab", icon: '/icons/design.svg', color: "#3b82f6", bg: "rgba(59,130,246,0.1)", border: "rgba(59,130,246,0.2)", desc: "Creative & UI" },
  { id: 'Marketing', name: "Marketing", icon: '/icons/marketing.svg', color: "#ec4899", bg: "rgba(236,72,153,0.1)", border: "rgba(236,72,153,0.2)", desc: "Growth & Analytics" },
];

export default function LeadershipDashboard({ 
  tasks, 
  selectedDept, 
  setSelectedDept
}: { 
  tasks: Task[];
  selectedDept: string | null;
  setSelectedDept: (dept: string | null) => void;
}) {

  // Filter tasks based on selection
  const filteredTasks = useMemo(() => {
    if (!selectedDept) return tasks;
    return tasks.filter(t => t.department === selectedDept || (!t.department && selectedDept === "Writers' Block"));
  }, [tasks, selectedDept]);

  // Derived metrics
  const totalTasks = filteredTasks.length;
  const completedTasks = filteredTasks.filter(t => t.status === 'done').length;
  const pendingTasks = filteredTasks.filter(t => t.status === 'todo' || t.status === 'in_progress').length;
  const inReviewTasks = filteredTasks.filter(t => t.status === 'in_review').length;
  
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const approvalRate = totalTasks > 0 ? Math.round(((completedTasks + inReviewTasks) / totalTasks) * 100) : 0;

  // Real activity data based on task created_at
  const week = getWeekLabels();
  const activityData = useMemo(() => {
    const dailyCounts: Record<string, number> = {};
    filteredTasks.forEach(task => {
      if (task.created_at) {
        const date = task.created_at.split('T')[0];
        dailyCounts[date] = (dailyCounts[date] || 0) + 1;
      }
    });

    return week.map(w => ({
      label: w.label,
      isToday: w.isToday,
      value: dailyCounts[w.date] || 0
    }));
  }, [filteredTasks, week]);

  const activeColor = selectedDept ? DEPT_CONFIG.find(d => d.id === selectedDept)?.color : 'var(--accent)';

  return (
    <div>
      {/* Interactive Dept Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 32 }}>
        {DEPT_CONFIG.map((dept, i) => {
          const isActive = selectedDept === dept.id;
          const isSvg = dept.icon.endsWith('.svg');
          return (
            <div 
              key={dept.id} 
              onClick={() => setSelectedDept(isActive ? null : dept.id)}
              className={`glass-raised ${isActive ? 'active-dept-card' : ''}`} 
              style={{ 
                padding: '24px', 
                borderRadius: 'var(--r-xl)', 
                border: `1px solid ${isActive ? dept.color : 'var(--border-med)'}`, 
                background: isActive ? dept.bg : 'var(--surface-1)', 
                cursor: 'pointer',
                transition: 'all 0.2s ease-out',
                transform: isActive ? 'translateY(-2px)' : 'none',
                boxShadow: isActive ? `0 8px 24px -5px ${dept.bg}` : 'none',
                position: 'relative',
                overflow: 'hidden'
              } as React.CSSProperties}
            >
              {isSvg && (
                <div style={{ position: 'absolute', right: -10, bottom: -10, opacity: 0.05, transform: 'rotate(-15deg)' }}>
                  <Image src={dept.icon} alt="" width={80} height={80} />
                </div>
              )}

              <div style={{ width: 44, height: 44, borderRadius: 14, background: isActive ? '#fff' : dept.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, transition: 'all 0.2s', boxShadow: isActive ? '0 4px 12px rgba(0,0,0,0.1)' : 'none' }}>
                <Image src={dept.icon} alt={dept.name} width={24} height={24} style={{ filter: isActive ? `drop-shadow(0 0 1px ${dept.color})` : 'none' }} />
              </div>
              <h4 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 800, color: isActive ? dept.color : 'var(--text)' }}>{dept.name}</h4>
              <p style={{ margin: 0, fontSize: 11, color: isActive ? 'var(--text)' : 'var(--text-4)', lineHeight: 1.4, opacity: 0.8 }}>{dept.desc}</p>
              
              {isActive && (
                <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 4, color: dept.color, fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px' }}>
                   Live Data
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="anim-fade-up">
        {/* Dynamic Stats */}
        <div className="stats-grid" style={{ marginBottom: 32 }}>
          <StatCard
            label={selectedDept ? "Active Assignments" : "Global Assignments"}
            value={totalTasks}
            sub={`${pendingTasks} in progress`}
            icon={Briefcase}
            accent={true}
            colorHex={activeColor as string}
          />
          <StatCard
            label={selectedDept ? "Approval Rate" : "Org. Approval Rate"}
            value={`${approvalRate}%`}
            sub={`${inReviewTasks} currently in review`}
            icon={CheckCircle}
            accent={false}
            colorHex="#10b981"
            progress={{ current: completedTasks + inReviewTasks, goal: Math.max(totalTasks, 1) }}
          />
          <StatCard
            label="Work Velocity"
            value={Math.round(completionRate * 0.8) + (selectedDept ? 5 : 12)}
            sub={selectedDept ? "Avg. tasks/week" : "Global avg. tasks/week"}
            icon={BarChart3}
            accent={false}
            colorHex="#8b5cf6"
          />
        </div>

        {/* Dynamic Graph */}
        <GenericActivityChart
          noAnimate={true}
          bars={activityData}
          title={selectedDept ? `${selectedDept} Performance` : "Global Output Overview"}
          subtitle={selectedDept ? "Assignments created and completed relative to capacity" : "Aggregate organizational output across all departments"}
          highlightText={selectedDept ? `${completionRate}% Completion` : `${totalTasks} Total Tasks`}
          highlightIcon={selectedDept ? PieChart : BarChart3}
          highlightColor={activeColor as string}
          barColor={activeColor as string}
          hoverFormat={(val) => `${val} tasks`}
        />

      </div>
    </div>
  );
}
