'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Check, User, Loader2 } from 'lucide-react';
import Image from 'next/image';

interface TeamMember {
  id: string;
  name: string;
  avatar_url: string | null;
  department: string;
}

interface MultiPersonSelectProps {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  maxSelections?: number;
  placeholder?: string;
}

export default function MultiPersonSelect({ 
  selectedIds, 
  onChange, 
  maxSelections,
  placeholder = "Search team members..." 
}: MultiPersonSelectProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchMembers = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/team');
        if (res.ok) {
          const data = await res.json();
          setMembers(data.users || []);
        }
      } catch (err) {
        console.error('Error fetching members:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMembers();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedMembers = members.filter(m => selectedIds.includes(m.id));
  const filteredMembers = members.filter(m => 
    !selectedIds.includes(m.id) && 
    (m.name.toLowerCase().includes(query.toLowerCase()) || 
     m.department.toLowerCase().includes(query.toLowerCase()))
  );

  const handleSelect = (id: string) => {
    if (maxSelections && selectedIds.length >= maxSelections) {
      // If max is 1, replace. Otherwise do nothing or show error.
      if (maxSelections === 1) {
        onChange([id]);
      }
      setIsOpen(false);
      setQuery('');
      return;
    }
    onChange([...selectedIds, id]);
    setQuery('');
    if (maxSelections === 1) setIsOpen(false);
  };

  const handleRemove = (id: string) => {
    onChange(selectedIds.filter(sid => sid !== id));
  };

  return (
    <div className="relative" ref={containerRef}>
      <div 
        className={`min-h-[42px] w-full bg-[var(--bg-deep)] border border-[var(--border-med)] rounded-[var(--r-md)] p-1.5 flex flex-wrap gap-1.5 focus-within:border-[var(--accent)] transition-colors cursor-text`}
        onClick={() => setIsOpen(true)}
      >
        {selectedMembers.map(member => (
          <div 
            key={member.id} 
            className="flex items-center gap-1.5 pl-1 pr-1.5 py-0.5 bg-[var(--accent-subtle2)] border border-[var(--accent-subtle)] text-[var(--accent)] rounded-full text-xs font-medium animate-in fade-in scale-in-95 duration-200"
          >
            {member.avatar_url ? (
              <Image src={member.avatar_url} alt={member.name} width={18} height={18} className="rounded-full" />
            ) : (
              <div className="w-[18px] h-[18px] rounded-full bg-[var(--accent)] flex items-center justify-center text-[8px] font-bold text-white">
                {member.name[0]}
              </div>
            )}
            <span>{member.name}</span>
            <button 
              onClick={(e) => { e.stopPropagation(); handleRemove(member.id); }}
              className="hover:bg-[var(--accent-subtle)] rounded-full p-0.5 transition-colors"
            >
              <X size={10} />
            </button>
          </div>
        ))}
        
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)}
          placeholder={selectedIds.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[120px] bg-transparent border-none outline-none text-sm text-[var(--text)] px-2 py-1 placeholder:text-[var(--text-4)]"
          disabled={maxSelections ? selectedIds.length >= maxSelections && maxSelections !== 1 : false}
        />

        <div className="flex items-center pr-2 text-[var(--text-4)]">
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
        </div>
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--bg-alt)] border border-[var(--border-strong)] rounded-[var(--r-md)] shadow-xl z-[100] max-h-60 overflow-y-auto anim-scale-up">
          {filteredMembers.length > 0 ? (
            <div className="p-1">
              {filteredMembers.map(member => (
                <button
                  key={member.id}
                  onClick={() => handleSelect(member.id)}
                  className="w-full flex items-center gap-3 px-3 py-2 hover:bg-[var(--bg-deep)] rounded-[var(--r-sm)] text-left transition-colors group"
                >
                  {member.avatar_url ? (
                    <Image src={member.avatar_url} alt={member.name} width={28} height={28} className="rounded-full" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-[var(--surface-2)] flex items-center justify-center text-[10px] font-bold text-[var(--text-3)] group-hover:bg-[var(--accent-subtle2)] group-hover:text-[var(--accent)] transition-colors">
                      {member.name[0]}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[var(--text)] truncate">{member.name}</p>
                    <p className="text-[10px] text-[var(--text-4)] truncate">{member.department}</p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-xs text-[var(--text-4)]">
              {query ? 'No members found' : 'Start typing to find members...'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
