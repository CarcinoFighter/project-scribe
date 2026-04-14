'use client';

import { createPortal } from 'react-dom';
import Image from 'next/image';
import { FileText, BookOpen, Heart, X } from 'lucide-react';

interface InitialTypeModalProps {
  onSelect: (type: 'blogs' | 'survivor_stories' | 'cancer_docs') => void;
  onClose: () => void;
}

export default function InitialTypeModal({ onSelect, onClose }: InitialTypeModalProps) {
  const options = [
    {
      id: 'cancer_docs',
      label: 'Article',
      description: 'Formal articles, research reports, and medical documentation.',
      icon: FileText,
      color: 'var(--accent)',
    },
    {
      id: 'blogs',
      label: 'Blog Post',
      description: 'Engaging web content, opinion pieces, and updates.',
      icon: BookOpen,
      color: '#e8a870',
    },
    {
      id: 'survivor_stories',
      label: 'Survivor Story',
      description: 'Personal narratives, journey highlights, and tributes.',
      icon: Heart,
      color: '#b03030',
    },
  ] as const;

  const content = (
    <div className="db-overlay" onClick={onClose}>
      <div 
        className="db-modal db-rise-0 !max-w-[800px] !p-0 overflow-hidden" 
        onClick={e => e.stopPropagation()}
      >
        <div className="flex flex-col md:flex-row h-full">
          {/* Welcome Section */}
          <div className="md:w-1/3 bg-[var(--accent-sub)] p-8 flex flex-col justify-between border-b md:border-b-0 md:border-r border-[var(--rule)]">
            <div>
              <div className="w-12 h-12 bg-[var(--paper)] border border-[var(--accent)] flex items-center justify-center mb-6 shadow-sm">
                <Image src="/logo.svg" alt="Vantage" width={24} height={28} style={{ height: 'auto' }} priority />
              </div>
              <h1 className="db-page-title !text-[28px] mb-4">
                Welcome to <em>Vantage Editor</em>
              </h1>
              <p className="text-[13px] leading-relaxed text-[var(--mid)]">
                Our mission is to help you document the journey with clarity and purpose. 
                Whether you are writing a technical article, a personal blog, or a survivor story, 
                we provide the tools to make it shine.
              </p>
            </div>
            
            <div className="mt-8 pt-8 border-t border-[var(--rule)] hidden md:block">
              <span className="db-cap block mb-2 opacity-50">Editor Session</span>
              <span className="db-cap text-[var(--accent)] font-bold">READY TO COMPOSE ✦</span>
            </div>
          </div>

          {/* Selection Section */}
          <div className="flex-1 p-8 bg-[var(--paper)]">
            <div className="flex justify-between items-center mb-8">
              <h2 className="db-cap !text-[10px] !tracking-[0.2em] text-[var(--mid)]">
                CHOOSE YOUR VENTAGE
              </h2>
              <button onClick={onClose} className="db-icon-btn">
                <X size={16} />
              </button>
            </div>

            <div className="grid gap-4">
              {options.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => onSelect(opt.id)}
                  className="group relative flex items-start gap-4 p-5 text-left bg-[var(--cream)] border border-[var(--rule)] transition-all hover:bg-[var(--accent-dim)] hover:border-[var(--accent)]"
                >
                  <div 
                    className="w-12 h-12 flex-shrink-0 flex items-center justify-center border border-[var(--rule)] group-hover:border-transparent transition-colors"
                    style={{ backgroundColor: `${opt.color}15`, color: opt.color }}
                  >
                    <opt.icon size={20} />
                  </div>
                  
                  <div className="flex-1 pr-8">
                    <h3 className="db-page-title !text-[16px] mb-1 group-hover:text-[var(--accent)] transition-colors">
                      {opt.label}
                    </h3>
                    <p className="text-[12px] text-[var(--mid)] leading-normal">
                      {opt.description}
                    </p>
                  </div>

                  <div className="absolute right-5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Image src="/logo.svg" alt="" width={14} height={16} />
                  </div>
                </button>
              ))}
            </div>

            <p className="mt-8 text-[11px] text-[var(--mid)] italic opacity-60 text-center">
              You can always change the document type later in the metadata panel.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
