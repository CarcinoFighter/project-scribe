'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ExternalLink } from 'lucide-react';

interface MediaViewerModalProps {
  url: string;
  title: string;
  onClose: () => void;
}

export default function MediaViewerModal({ url, title, onClose }: MediaViewerModalProps) {
  const [mounted, setMounted] = useState(false);
  const isVideo = url.match(/\.(mp4|webm|ogg)$/i);

  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9500] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl anim-fade-in">
      <div className="w-full max-w-5xl rounded-[var(--r-xl)] overflow-hidden shadow-2xl anim-slide-down relative flex flex-col items-center">
        
        {/* Top Bar overlay */}
        <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/60 to-transparent flex items-center justify-between z-10 text-white">
          <h2 className="text-sm font-bold truncate max-w-[70%]">{title}</h2>
          <div className="flex items-center gap-2">
            <a 
              href={url} 
              target="_blank" 
              rel="noreferrer"
              className="p-2 text-white/70 hover:text-white rounded-full bg-black/20 hover:bg-black/40 transition-all"
            >
              <ExternalLink size={18} />
            </a>
            <button 
              onClick={onClose} 
              className="p-2 text-white/70 hover:text-white rounded-full bg-black/20 hover:bg-black/40 transition-all"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Media Frame */}
        <div className="w-full max-h-[85vh] flex items-center justify-center p-4 min-h-[50vh]">
          {isVideo ? (
            <video 
              src={url} 
              controls 
              autoPlay 
              className="max-w-full max-h-[80vh] rounded-[var(--r-md)] shadow-lg"
            />
          ) : (
            <img 
              src={url} 
              alt={title} 
              className="max-w-full max-h-[80vh] rounded-[var(--r-md)] object-contain shadow-lg"
            />
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
