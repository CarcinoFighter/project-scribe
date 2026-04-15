'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowRight, BookOpen, FileText, Heart, X } from 'lucide-react';

type DocumentType = 'blogs' | 'survivor_stories' | 'cancer_docs';

interface InitialTypeModalProps {
  onSelect: (type: DocumentType) => void;
  onClose: () => void;
}

type Option = {
  id: DocumentType;
  label: string;
  description: string;
  icon: typeof FileText;
  color: string;
};

const OPTIONS: Option[] = [
  {
    id: 'cancer_docs',
    label: 'Article',
    description: 'For research pieces, explainers, and structured long-form writing.',
    icon: FileText,
    color: 'var(--accent)',
  },
  {
    id: 'blogs',
    label: 'Blog Post',
    description: 'For updates, opinion pieces, and web content that needs momentum.',
    icon: BookOpen,
    color: '#cf7a20',
  },
  {
    id: 'survivor_stories',
    label: 'Survivor Story',
    description: 'For personal journeys, reflections, and narrative-driven writing.',
    icon: Heart,
    color: '#be4b68',
  },
];

export default function InitialTypeModal({ onSelect, onClose }: InitialTypeModalProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }

      if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
        event.preventDefault();
        setActiveIndex((current) => (current + 1) % OPTIONS.length);
        return;
      }

      if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
        event.preventDefault();
        setActiveIndex((current) => (current - 1 + OPTIONS.length) % OPTIONS.length);
        return;
      }

      if (event.key === 'Enter') {
        event.preventDefault();
        onSelect(OPTIONS[activeIndex].id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex, onClose, onSelect]);

  return createPortal(
    <div className="db-overlay" onClick={onClose}>
      <div
        className="db-modal db-rise-0"
        style={{
          maxWidth: '640px',
          maxHeight: 'min(88vh, 680px)',
          overflowY: 'auto',
          background: 'var(--paper)',
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <div style={{ padding: '22px 22px 18px', borderBottom: '1px solid var(--rule)' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 16,
            }}
          >
            <div>
              <div
                className="db-cap"
                style={{
                  color: 'var(--accent)',
                  letterSpacing: '0.18em',
                  marginBottom: 6,
                }}
              >
                Document
              </div>
              <h2
                style={{
                  margin: 0,
                  fontFamily: 'var(--ff-display)',
                  fontSize: '28px',
                  fontWeight: 700,
                  lineHeight: 1,
                  letterSpacing: '-0.04em',
                  color: 'var(--ink)',
                }}
              >
                Choose a type
              </h2>
              <p
                style={{
                  margin: '10px 0 0',
                  maxWidth: 460,
                  fontFamily: 'var(--ff-ui)',
                  fontSize: 13,
                  lineHeight: 1.65,
                  color: 'var(--mid)',
                }}
              >
                Pick the kind of document you want to create. You can change it later from the metadata panel.
              </p>
            </div>

            <button
              type="button"
              className="db-icon-btn"
              onClick={onClose}
              aria-label="Close modal"
              style={{ width: 34, height: 34, border: '1px solid var(--rule)' }}
            >
              <X size={15} strokeWidth={1.9} />
            </button>
          </div>
        </div>

        <div style={{ padding: '16px 22px' }}>
          <div style={{ display: 'grid', gap: 12 }}>
            {OPTIONS.map((option, index) => {
              const Icon = option.icon;
              const isActive = index === activeIndex;

              return (
                <button
                  key={option.id}
                  type="button"
                  onMouseEnter={() => setActiveIndex(index)}
                  onFocus={() => setActiveIndex(index)}
                  onClick={() => onSelect(option.id)}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '48px minmax(0, 1fr) auto',
                    alignItems: 'center',
                    gap: 14,
                    width: '100%',
                    padding: '14px',
                    textAlign: 'left',
                    border: isActive ? `1px solid ${option.color}` : '1px solid var(--rule)',
                    background: isActive ? 'var(--cream)' : 'var(--paper)',
                    boxShadow: isActive ? 'var(--sh-xs)' : 'none',
                    transition: 'border-color 0.15s, background 0.15s, box-shadow 0.15s',
                    cursor: 'pointer',
                  }}
                >
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      display: 'grid',
                      placeItems: 'center',
                      border: `1px solid ${isActive ? option.color : 'var(--rule)'}`,
                      color: option.color,
                      background: 'var(--paper)',
                    }}
                  >
                    <Icon size={18} strokeWidth={1.9} />
                  </div>

                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        marginBottom: 4,
                        flexWrap: 'wrap',
                      }}
                    >
                      <h3
                        style={{
                          margin: 0,
                          fontFamily: 'var(--ff-display)',
                          fontSize: 20,
                          fontWeight: 700,
                          lineHeight: 1,
                          letterSpacing: '-0.03em',
                          color: 'var(--ink)',
                        }}
                      >
                        {option.label}
                      </h3>
                      <span
                        className="db-cap"
                        style={{
                          color: option.color,
                          letterSpacing: '0.14em',
                        }}
                      >
                        {String(index + 1).padStart(2, '0')}
                      </span>
                    </div>

                    <p
                      style={{
                        margin: 0,
                        fontFamily: 'var(--ff-ui)',
                        fontSize: 13,
                        lineHeight: 1.6,
                        color: 'var(--text-2)',
                      }}
                    >
                      {option.description}
                    </p>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      color: isActive ? option.color : 'var(--mid)',
                      fontFamily: 'var(--ff-mono)',
                      fontSize: 10,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                    }}
                  >
                    <span>Select</span>
                    <ArrowRight size={14} strokeWidth={1.8} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 14,
            padding: '14px 22px 18px',
            borderTop: '1px solid var(--rule)',
            fontFamily: 'var(--ff-mono)',
            fontSize: 10,
            letterSpacing: '0.08em',
            color: 'var(--mid)',
          }}
        >
          <span>Arrow keys move</span>
          <span>Enter selects</span>
          <span>Esc closes</span>
        </div>
      </div>
    </div>,
    document.body
  );
}

