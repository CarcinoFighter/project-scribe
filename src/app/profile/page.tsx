'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  User, 
  Mail, 
  Briefcase, 
  Shield, 
  Camera, 
  Save, 
  ChevronLeft,
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useUser } from '@/lib/useUser';
import { supabase } from '@/lib/supabase';
import { useRef } from 'react';
import ImageCropModal from '@/components/ImageCropModal';

export default function ProfilePage() {
  const { user, loading: userLoading, refreshUser } = useUser();
  const router = useRouter();
  
  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  // Cropping state
  const [showCropModal, setShowCropModal] = useState(false);
  const [tempImage, setTempImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setAvatarUrl(user.avatar_url || '');
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/users/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, avatar_url: avatarUrl }),
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'Profile updated successfully' });
        // Refresh global user state immediately
        await refreshUser();
      } else {
        const data = await res.json();
        setMessage({ type: 'error', text: data.error || 'Failed to update profile' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'An error occurred' });
    } finally {
      setSaving(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate size and type
    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Image size must be less than 2MB' });
      return;
    }

    setUploading(true);
    setMessage(null);

    const reader = new FileReader();
    reader.addEventListener('load', () => {
      setTempImage(reader.result as string);
      setShowCropModal(true);
      setUploading(false);
    });
    reader.readAsDataURL(file);
  };

  const handleCropComplete = async (blob: Blob) => {
    setShowCropModal(false);
    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', blob, 'avatar.jpg');

      const res = await fetch('/api/users/upload-avatar', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Upload failed');
      }

      const data = await res.json();
      setAvatarUrl(data.url);
      setMessage({ type: 'success', text: 'Avatar cropped and uploaded. Remember to save settings.' });
    } catch (err: any) {
      console.error(err);
      setMessage({ type: 'error', text: err.message || 'Error uploading image' });
    } finally {
      setUploading(false);
      setTempImage(null);
    }
  };

  if (userLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--bg-deep)]">
        <Loader2 className="animate-spin text-[var(--accent)]" size={32} />
      </div>
    );
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-[var(--bg-deep)] pb-20">
      {/* Premium Header Background */}
      <div className="h-48 bg-gradient-to-r from-[var(--bg-deepest)] to-[var(--accent-subtle)] border-b border-[var(--border-med)] relative">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-24 relative z-10 pb-8">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-xs font-bold text-white/80 hover:text-white mb-8 transition-colors bg-black/20 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10"
        >
          <ChevronLeft size={14} />
          Back to Dashboard
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Avatar & Summary */}
          <div className="space-y-6">
            <div className="glass-raised grain p-8 rounded-[var(--r-xl)] border border-[var(--border-med)] text-center shadow-xl">
              <div className="relative inline-block mb-6 group">
                {avatarUrl ? (
                  <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-[var(--bg-deep)] shadow-2xl ring-1 ring-[var(--border-strong)] relative group">
                    <Image src={avatarUrl} alt="Profile" width={128} height={128} className="object-cover" />
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      <Camera size={24} className="text-white" />
                    </div>
                  </div>
                ) : (
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--accent-hover)] flex items-center justify-center text-white text-4xl font-bold border-4 border-[var(--bg-deep)] shadow-2xl ring-1 ring-[var(--border-strong)] relative group">
                    {user.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || 'S'}
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-full"
                    >
                      <Camera size={24} className="text-white" />
                    </div>
                  </div>
                )}
                <div className="absolute bottom-1 right-1 bg-[var(--accent)] text-white p-2 rounded-full shadow-lg border-2 border-[var(--bg-deep)]">
                  {uploading ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept="image/*" 
                  className="hidden" 
                />
              </div>

              <h1 className="text-xl font-black text-[var(--text)] tracking-tight mb-1">{user.name}</h1>
              <p className="text-xs text-[var(--text-4)] font-bold uppercase tracking-widest">{user.admin_access ? 'Administrator' : 'Editor'}</p>
              
              <div className="mt-8 pt-6 border-t border-[var(--border-med)] grid grid-cols-2 gap-4">
                <div className="text-left">
                  <p className="text-[10px] font-bold text-[var(--text-4)] uppercase tracking-wider mb-1">Status</p>
                  <p className="text-xs font-black text-emerald-500 flex items-center gap-1">
                    <CheckCircle2 size={12} />
                    Active
                  </p>
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-bold text-[var(--text-4)] uppercase tracking-wider mb-1">Signed In</p>
                  <p className="text-xs font-bold text-[var(--text)]">Today</p>
                </div>
              </div>
            </div>

            {/* Simple Stats or Info */}
            <div className="glass-raised p-6 rounded-[var(--r-lg)] border border-[var(--border-med)] bg-[var(--bg-deepest)]">
              <h3 className="text-xs font-bold text-[var(--text-3)] mb-4 flex items-center gap-2">
                <Shield size={14} className="text-[var(--accent)]" />
                Security & Access
              </h3>
              <ul className="space-y-3">
                <li className="flex items-center justify-between">
                  <span className="text-xs text-[var(--text-4)]">Admin Access</span>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${user.admin_access ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-gray-500/10 text-gray-400 border border-gray-500/20'}`}>
                    {user.admin_access ? 'Enabled' : 'Disabled'}
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* Right Column: Settings Form */}
          <div className="lg:col-span-2 space-y-6 text-white ">
            <div className="glass-raised grain p-8 rounded-[var(--r-xl)] border border-[var(--border-med)] shadow-xl h-full">
              <h2 className="text-lg font-black text-[var(--text)] tracking-tight mb-6">Profile Settings</h2>
              
              {message && (
                <div className={`p-4 rounded-[var(--r-lg)] mb-6 flex items-center gap-3 anim-fade-in ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                  {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                  <p className="text-sm font-semibold">{message.text}</p>
                </div>
              )}

              <form onSubmit={handleSave} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-[var(--text-4)] uppercase tracking-widest flex items-center gap-2">
                      <User size={10} />
                      Display Name
                    </label>
                    <input 
                      type="text" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-[var(--bg-deep)] border border-[var(--border-med)] rounded-[var(--r-md)] py-2.5 px-4 text-sm text-[var(--text)] focus:ring-2 focus:ring-[var(--accent-subtle)] focus:border-[var(--accent)] transition-all outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-[var(--text-4)] uppercase tracking-widest flex items-center gap-2">
                      <Mail size={10} />
                      Email Address
                    </label>
                    <input 
                      type="text" 
                      value={user.email}
                      disabled
                      className="w-full bg-[var(--bg-deepest)] border border-[var(--border-med)] rounded-[var(--r-md)] py-2.5 px-4 text-sm text-[var(--text-4)] cursor-not-allowed opacity-60"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-[var(--text-4)] uppercase tracking-widest flex items-center gap-2">
                    <Camera size={10} />
                    Avatar Settings
                  </label>
                  <div className="flex items-center gap-4">
                    <input 
                      type="text" 
                      value={avatarUrl}
                      onChange={(e) => setAvatarUrl(e.target.value)}
                      placeholder="https://example.com/avatar.jpg"
                      className="flex-1 bg-[var(--bg-deep)] border border-[var(--border-med)] rounded-[var(--r-md)] py-2.5 px-4 text-sm text-[var(--text)] focus:ring-2 focus:ring-[var(--accent-subtle)] focus:border-[var(--accent)] transition-all outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="px-4 py-2.5 bg-[var(--bg-deepest)] border border-[var(--border-med)] rounded-[var(--r-md)] text-xs font-bold text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors flex items-center gap-2 whitespace-nowrap"
                    >
                      {uploading ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
                      Upload File
                    </button>
                  </div>
                  <p className="text-[9px] text-[var(--text-4)] italic mt-1">Upload a file or provide a direct image URL. Max 2MB.</p>
                </div>

                <div className="pt-8 border-t border-[var(--border-med)] flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-[var(--text)]">Save Changes</h4>
                    <p className="text-[10px] text-[var(--text-4)]">Your profile updates are reflected immediately.</p>
                  </div>
                  <button 
                    type="submit"
                    disabled={saving}
                    className="bg-[var(--accent)] text-white px-8 py-2.5 rounded-[var(--r-md)] text-sm font-bold shadow-lg shadow-[var(--accent-glow)] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    Save Settings
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      {/* Image Cropper Modal */}
      {showCropModal && tempImage && (
        <ImageCropModal
          image={tempImage}
          onCrop={handleCropComplete}
          onCancel={() => {
            setShowCropModal(false);
            setTempImage(null);
          }}
        />
      )}
    </div>
  );
}
