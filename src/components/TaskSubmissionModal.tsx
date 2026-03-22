'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Upload, Loader2, FileVideo, Image as ImageIcon } from 'lucide-react';

interface TaskSubmissionModalProps {
  taskId: string;
  taskTitle: string;
  onClose: () => void;
  onSuccess: (url: string) => void;
}

export default function TaskSubmissionModal({ taskId, taskTitle, onClose, onSuccess }: TaskSubmissionModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file to upload.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // 1. Upload to Supabase using new endpoint
      const formData = new FormData();
      formData.append('file', file);
      
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) {
        const err = await uploadRes.json();
        throw new Error(err.error || 'Failed to upload media');
      }

      const { url } = await uploadRes.json();

      // 2. Patch the task to in_review status
      const patchRes = await fetch('/api/work', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: taskId, 
          status: 'in_review',
          submission_media_url: url 
        }),
      });

      if (!patchRes.ok) {
        throw new Error('Failed to update task status');
      }

      onSuccess(url);
    } catch (err: any) {
      setError(err.message || 'An error occurred during submission.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9500] flex items-start justify-center p-4 bg-black/80 backdrop-blur-xl anim-fade-in pt-[15vh]">
      <div className="glass-raised w-full max-w-sm rounded-[var(--r-xl)] overflow-hidden shadow-2xl anim-slide-down border-[var(--border-strong)] relative flex flex-col">
        <div className="p-5 border-b border-[var(--border-med)] flex items-center justify-between bg-[var(--bg-deep)]">
          <div>
            <h2 className="text-base font-bold text-[var(--text)] tracking-tight">Submit Task</h2>
            <p className="text-xs text-[var(--text-4)] truncate max-w-[250px]">{taskTitle}</p>
          </div>
          <button onClick={onClose} className="p-2 text-[var(--text-4)] hover:text-[var(--text)] hover:bg-[var(--bg-deep)] rounded-full transition-all">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-[var(--r-md)] bg-red-500/10 border border-red-500/20 text-red-500 text-xs">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-[var(--text-4)] flex items-center gap-1.5">
              Proof of Work
            </label>
            <div className="border-2 border-dashed border-[var(--border-strong)] rounded-[var(--r-lg)] p-6 text-center hover:border-[var(--accent)] hover:bg-[var(--accent-subtle2)] transition-colors relative">
              <input 
                type="file" 
                accept="image/*,video/*" 
                onChange={e => setFile(e.target.files?.[0] || null)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              {file ? (
                <div className="flex flex-col items-center gap-2 text-[var(--text)]">
                  {file.type.startsWith('image/') ? <ImageIcon size={24} className="text-[var(--accent)]" /> : <FileVideo size={24} className="text-[var(--accent)]" />}
                  <span className="text-sm font-semibold truncate max-w-[200px]">{file.name}</span>
                  <span className="text-xs text-[var(--text-4)]">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-[var(--text-4)] mt-2">
                  <Upload size={24} className="mb-2" />
                  <span className="text-sm font-medium">Click or drag media here</span>
                  <span className="text-[10px]">Images & videos allowed</span>
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-[var(--text-3)] hover:text-[var(--text)] transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={submitting || !file}
              className="bg-[var(--accent)] text-white px-6 py-2 rounded-[var(--r-md)] text-sm font-semibold shadow-lg shadow-[var(--accent-glow)] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Uploading...
                </>
              ) : (
                'Submit Task'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
