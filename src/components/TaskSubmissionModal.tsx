'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Upload, Loader2, FileVideo, Image as ImageIcon } from 'lucide-react';
import { apiFetch } from '@/lib/api';

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
      
      const uploadRes = await apiFetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) {
        const err = await uploadRes.json();
        throw new Error(err.error || 'Failed to upload media');
      }

      const { url } = await uploadRes.json();

      // 2. Patch the task to in_review status
      const patchRes = await apiFetch('/api/tasks', {
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
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred during submission.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9800] flex items-center justify-center p-4 bg-black/80 anim-fade-in">
      <div className="w-full max-w-sm bg-[var(--paper)] border border-[var(--rule)] border-t-[3px] border-t-[var(--accent)] shadow-[20px_20px_0px_rgba(0,0,0,0.3)] anim-slide-down relative flex flex-col">
        <div className="p-5 border-b border-[var(--rule)] flex items-center justify-between bg-[var(--tape-bg)]">
          <div>
            <h2 className="db-display" style={{ fontSize: 18, margin: 0 }}>Submit Task</h2>
            <p className="db-cap" style={{ marginTop: 2, color: 'var(--mid)' }}>{taskTitle}</p>
          </div>
          <button onClick={onClose} className="p-2 text-[var(--mid)] hover:text-[var(--ink)] border border-transparent hover:border-[var(--rule)] transition-all">
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-mono uppercase tracking-wide">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <label className="db-cap flex items-center gap-1.5">
              Proof of Work
            </label>
            <div className="border border-dashed border-[var(--rule)] bg-[var(--bg-alt)] p-6 text-center hover:border-[var(--accent)] hover:bg-[var(--accent-sub)] transition-colors relative">
              <input 
                type="file" 
                accept="image/*,video/*" 
                onChange={e => setFile(e.target.files?.[0] || null)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              {file ? (
                <div className="flex flex-col items-center gap-2 text-[var(--ink)]">
                  {file.type.startsWith('image/') ? <ImageIcon size={20} strokeWidth={1.5} className="text-[var(--accent)]" /> : <FileVideo size={20} strokeWidth={1.5} className="text-[var(--accent)]" />}
                  <span className="text-xs font-bold truncate max-w-[200px]">{file.name}</span>
                  <span className="db-cap">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-[var(--mid)] mt-2">
                  <Upload size={20} strokeWidth={1.5} className="mb-2" />
                  <span className="text-xs font-medium">CLICK OR DRAG MEDIA HERE</span>
                  <span className="db-cap">IMAGES & VIDEOS ALLOWED</span>
                </div>
              )}
            </div>
          </div>

          <hr className="db-hr" style={{ margin: '24px 0 16px' }} />

          <div className="flex items-center justify-end gap-3">
            <button 
              type="button" 
              onClick={onClose}
              className="db-ghost"
            >
              CANCEL
            </button>
            <button 
              type="submit"
              disabled={submitting || !file}
              className="db-btn"
            >
              <span>
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 size={12} className="animate-spin" />
                    UPLOADING
                  </span>
                ) : (
                  'SUBMIT TASK'
                )}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
