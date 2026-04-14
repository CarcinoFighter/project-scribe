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
      id: 'cancer_docs' as const,
      label: 'Article',
      description: 'Formal articles, research reports, and medical documentation.',
      icon: FileText,
      color: 'var(--accent)',
      num: '01',
      tag: 'Research',
    },
    {
      id: 'blogs' as const,
      label: 'Blog Post',
      description: 'Engaging web content, opinion pieces, and updates.',
      icon: BookOpen,
      color: '#c97a20',
      num: '02',
      tag: 'Editorial',
    },
    {
      id: 'survivor_stories' as const,
      label: 'Survivor Story',
      description: 'Personal narratives, journey highlights, and tributes.',
      icon: Heart,
      color: '#b03030',
      num: '03',
      tag: 'Narrative',
    },
  ];

  return createPortal(
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: 'rgba(14, 12, 16, 0.8)' }}
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-[800px] bg-[var(--paper)] overflow-hidden db-rise-0"
        style={{
          border: '1px solid var(--rule)',
          borderTop: '2px solid var(--accent)',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex flex-col md:flex-row min-h-[480px]">
          {/* Left Panel - Editorial */}
          <div 
            className="md:w-[42%] p-10 flex flex-col justify-between relative"
            style={{ background: 'var(--accent-sub)' }}
          >
            {/* Subtle texture overlay */}
            <div 
              className="absolute inset-0 pointer-events-none opacity-[0.03]"
              style={{
                backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, var(--ink) 2px, var(--ink) 4px)'
              }}
            />

            <div className="relative z-10">
              <div 
                className="w-14 h-14 bg-[var(--paper)] border border-[var(--accent)] flex items-center justify-center mb-8"
              >
                <Image src="/logo.svg" alt="Vantage" width={26} height={32} priority />
              </div>
              
              <h1 
                style={{ 
                  fontFamily: 'var(--ff-display)', 
                  fontSize: '28px', 
                  fontWeight: 700, 
                  lineHeight: 1.05, 
                  letterSpacing: '-0.025em',
                  color: 'var(--ink)',
                  marginBottom: '20px'
                }}
              >
                Welcome to<br />
                <em style={{ color: 'var(--accent)', fontStyle: 'italic' }}>Vantage Editor</em>
                <span style={{ color: 'var(--accent)' }}>.</span>
              </h1>
              
              {/* Triple rule */}
              <div className="flex flex-col gap-[2px] mb-6 w-16">
                <div style={{ height: '1px', background: 'var(--rule)' }} />
                <div style={{ height: '2px', background: 'var(--ink)' }} />
                <div style={{ height: '1px', background: 'var(--rule)' }} />
              </div>
              
              <p 
                style={{ 
                  fontFamily: 'var(--ff-ui)', 
                  fontSize: '13px', 
                  lineHeight: 1.6, 
                  color: 'var(--mid)',
                  letterSpacing: '0.01em'
                }}
              >
                Document the journey with clarity and purpose. Select a format to begin composing your piece.
              </p>
            </div>
            
            <div className="relative z-10 mt-8">
              <div 
                className="h-[1px] w-full mb-4"
                style={{ background: 'var(--rule)' }}
              />
              <div className="flex items-center justify-between">
                <span 
                  className="db-cap"
                  style={{ 
                    fontSize: '9px', 
                    color: 'var(--mid)',
                    letterSpacing: '0.18em'
                  }}
                >
                  Editor Session
                </span>
                <span 
                  className="db-cap"
                  style={{ 
                    fontSize: '9px', 
                    color: 'var(--accent)', 
                    letterSpacing: '0.12em',
                    fontWeight: 600
                  }}
                >
                  READY ✦
                </span>
              </div>
            </div>
          </div>

          {/* Right Panel - Selection */}
          <div className="flex-1 p-10 bg-[var(--paper)] flex flex-col">
            <div className="flex justify-between items-start mb-8">
              <div>
                <span 
                  className="db-cap block mb-2"
                  style={{ fontSize: '8px', letterSpacing: '0.22em', opacity: 0.6 }}
                >
                  New Document
                </span>
                <h2 
                  style={{ 
                    fontFamily: 'var(--ff-display)', 
                    fontSize: '20px', 
                    fontWeight: 700, 
                    color: 'var(--ink)',
                    letterSpacing: '-0.02em'
                  }}
                >
                  Choose Format
                </h2>
              </div>
              <button 
                onClick={onClose}
                className="db-icon-btn"
                style={{ 
                  width: '28px', 
                  height: '28px',
                  border: '1px solid var(--rule)',
                  background: 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={14} strokeWidth={1.8} style={{ color: 'var(--mid)' }} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {options.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => onSelect(opt.id)}
                  className="group relative w-full flex items-center gap-4 p-4 text-left transition-all duration-150"
                  style={{
                    background: 'var(--cream)',
                    border: '1px solid var(--rule)',
                    borderLeft: '2px solid transparent',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderLeftColor = opt.color;
                    e.currentTarget.style.background = 'var(--paper)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderLeftColor = 'transparent';
                    e.currentTarget.style.background = 'var(--cream)';
                  }}
                >
                  {/* Icon */}
                  <div 
                    className="w-10 h-10 flex-shrink-0 flex items-center justify-center border transition-colors duration-150"
                    style={{ 
                      borderColor: 'var(--rule)',
                      background: 'transparent',
                      color: opt.color,
                    }}
                  >
                    <opt.icon size={18} strokeWidth={1.8} />
                  </div>
                  
                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 
                        style={{ 
                          fontFamily: 'var(--ff-display)', 
                          fontSize: '15px', 
                          fontWeight: 700, 
                          color: 'var(--ink)',
                          letterSpacing: '-0.01em'
                        }}
                      >
                        {opt.label}
                      </h3>
                      <span 
                        className="db-cap"
                        style={{ 
                          fontSize: '7px', 
                          padding: '2px 6px',
                          border: '1px solid var(--rule)',
                          color: 'var(--mid)',
                          letterSpacing: '0.14em',
                          opacity: 0,
                          transition: 'opacity 0.15s, border-color 0.15s, color 0.15s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.opacity = '1';
                          e.currentTarget.style.borderColor = opt.color;
                          e.currentTarget.style.color = opt.color;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.opacity = '0';
                          e.currentTarget.style.borderColor = 'var(--rule)';
                          e.currentTarget.style.color = 'var(--mid)';
                        }}
                      >
                        {opt.tag}
                      </span>
                    </div>
                    <p 
                      style={{ 
                        fontSize: '11px', 
                        color: 'var(--mid)', 
                        lineHeight: 1.4,
                        fontFamily: 'var(--ff-ui)',
                        letterSpacing: '0.01em'
                      }}
                    >
                      {opt.description}
                    </p>
                  </div>

                  {/* Num */}
                  <span 
                    style={{ 
                      fontFamily: 'var(--ff-display)',
                      fontStyle: 'italic',
                      fontSize: '11px',
                      color: 'var(--mid)',
                      opacity: 0.25,
                      width: '20px',
                      textAlign: 'right'
                    }}
                  >
                    {opt.num}
                  </span>
                </button>
              ))}
            </div>

            {/* Footer note */}
            <div 
              className="mt-auto pt-6 mt-8"
              style={{ borderTop: '1px solid var(--rule)' }}
            >
              <p 
                style={{ 
                  fontSize: '10px', 
                  color: 'var(--mid)',
                  fontFamily: 'var(--ff-mono)',
                  letterSpacing: '0.06em',
                  textAlign: 'center'
                }}
              >
                You can always change the document type later in the metadata panel.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}