'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

interface MiniCalendarProps {
  value: string; // ISO date string (YYYY-MM-DD)
  onChange: (date: string) => void;
}

export default function MiniCalendar({ value, onChange }: MiniCalendarProps) {
  const [currentDate, setCurrentDate] = useState(value ? new Date(value) : new Date());
  
  const month = currentDate.getMonth();
  const year = currentDate.getFullYear();
  
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleDateSelect = (day: number) => {
    const selectedDate = new Date(year, month, day);
    // Adjust to local date string YYYY-MM-DD
    const yyyy = selectedDate.getFullYear();
    const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const dd = String(selectedDate.getDate()).padStart(2, '0');
    onChange(`${yyyy}-${mm}-${dd}`);
  };

  const isSelected = (day: number) => {
    if (!value) return false;
    const vDate = new Date(value);
    return vDate.getDate() === day && vDate.getMonth() === month && vDate.getFullYear() === year;
  };

  const isToday = (day: number) => {
    const today = new Date();
    return today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
  };

  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(<div key={`empty-${i}`} className="w-8 h-8" />);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    days.push(
      <button
        key={d}
        type="button"
        onClick={() => handleDateSelect(d)}
        className={`w-8 h-8 rounded-full text-xs font-semibold flex items-center justify-center transition-all ${
          isSelected(d)
            ? 'bg-[var(--accent)] text-white shadow-lg shadow-[var(--accent-glow)] scale-110'
            : isToday(d)
            ? 'bg-[var(--accent-subtle2)] text-[var(--accent)]'
            : 'text-[var(--text-3)] hover:bg-[var(--surface-1)] hover:text-[var(--text)]'
        }`}
      >
        {d}
      </button>
    );
  }

  return (
    <div className="bg-[var(--bg-deep)] border border-[var(--border-med)] rounded-[var(--r-md)] p-3 w-fit anim-fade-in shadow-xl glass-raised">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-xs font-bold text-[var(--text)] px-1">
          {monthNames[month]} {year}
        </h4>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-1 hover:bg-[var(--surface-1)] rounded-md text-[var(--text-4)] transition-colors"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            className="p-1 hover:bg-[var(--surface-1)] rounded-md text-[var(--text-4)] transition-colors"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-1 text-center mb-1">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
          <div key={idx} className="w-8 text-[10px] font-black text-[var(--text-4)] uppercase tracking-tighter">
            {day}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {days}
      </div>
    </div>
  );
}
