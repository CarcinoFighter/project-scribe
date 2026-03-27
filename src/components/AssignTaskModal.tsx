'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Briefcase,
  FileText,
  BookOpen,
  Heart,
  User,
  Calendar as CalendarIcon,
  AlertTriangle,
  Layers,
  CheckCircle,
  Loader2,
  Megaphone,
  Code2,
  Palette,
  PenTool,
  Users,
  Star,
  Zap,
  Globe,
  Camera,
  Music,
  Video,
  Mail,
  Share2,
  BarChart2,
  Shield,
  Cpu,
  Microscope,
  Stethoscope,
  Landmark,
  FlaskConical,
  // Extra icons
  Activity,
  Airplay,
  Anchor,
  Archive,
  Award,
  Bell,
  Bike,
  Bookmark,
  Box,
  Brain,
  Bug,
  Building,
  Building2,
  Bus,
  Calculator,
  Cast,
  ChevronRight,
  Clipboard,
  Clock,
  Cloud,
  Coffee,
  Columns,
  Compass,
  CreditCard,
  Crop,
  Database,
  Download,
  Edit,
  Eye,
  Filter,
  Flag,
  Folder,
  Gift,
  GitBranch,
  Grid,
  Hash,
  Headphones,
  Home,
  Image,
  Inbox,
  Key,
  Layout,
  LifeBuoy,
  Link,
  List,
  Lock,
  Map,
  MapPin,
  MessageCircle,
  MessageSquare,
  Monitor,
  Moon,
  Package,
  Phone,
  Printer,
  Radio,
  RefreshCw,
  Rss,
  Search,
  Server,
  Settings,
  Slack,
  Sliders,
  Smartphone,
  Speaker,
  Sun,
  Tag,
  Terminal,
  Thermometer,
  ThumbsUp,
  Trash2,
  TrendingUp,
  Truck,
  Twitter,
  Type,
  Umbrella,
  Upload,
  UserCheck,
  UserPlus,
  Volume2,
  Watch,
  Wifi,
  Wind,
  Wrench,
  Youtube,
  ZoomIn,
} from 'lucide-react';
import MultiPersonSelect from './MultiPersonSelect';
import MiniCalendar from './MiniCalendar';
import { DEPARTMENTS } from '@/config/departments';

// Full icon options for custom categories
export const ICON_OPTIONS = [
  // Content & Writing
  { name: 'FileText',      icon: FileText,      group: 'Content' },
  { name: 'BookOpen',      icon: BookOpen,      group: 'Content' },
  { name: 'Edit',          icon: Edit,          group: 'Content' },
  { name: 'PenTool',       icon: PenTool,       group: 'Content' },
  { name: 'Type',          icon: Type,          group: 'Content' },
  { name: 'Clipboard',     icon: Clipboard,     group: 'Content' },
  { name: 'Archive',       icon: Archive,       group: 'Content' },
  { name: 'Bookmark',      icon: Bookmark,      group: 'Content' },
  { name: 'Folder',        icon: Folder,        group: 'Content' },
  { name: 'Hash',          icon: Hash,          group: 'Content' },
  // Communication
  { name: 'Mail',          icon: Mail,          group: 'Communication' },
  { name: 'MessageCircle', icon: MessageCircle, group: 'Communication' },
  { name: 'MessageSquare', icon: MessageSquare, group: 'Communication' },
  { name: 'Phone',         icon: Phone,         group: 'Communication' },
  { name: 'Bell',          icon: Bell,          group: 'Communication' },
  { name: 'Megaphone',     icon: Megaphone,     group: 'Communication' },
  { name: 'Share2',        icon: Share2,        group: 'Communication' },
  { name: 'Send',          icon: ChevronRight,  group: 'Communication' },
  { name: 'Rss',           icon: Rss,           group: 'Communication' },
  { name: 'Radio',         icon: Radio,         group: 'Communication' },
  { name: 'Twitter',       icon: Twitter,       group: 'Communication' },
  { name: 'Slack',         icon: Slack,         group: 'Communication' },
  { name: 'Inbox',         icon: Inbox,         group: 'Communication' },
  // Media
  { name: 'Camera',        icon: Camera,        group: 'Media' },
  { name: 'Video',         icon: Video,         group: 'Media' },
  { name: 'Image',         icon: Image,         group: 'Media' },
  { name: 'Music',         icon: Music,         group: 'Media' },
  { name: 'Headphones',    icon: Headphones,    group: 'Media' },
  { name: 'Speaker',       icon: Speaker,       group: 'Media' },
  { name: 'Volume2',       icon: Volume2,       group: 'Media' },
  { name: 'Youtube',       icon: Youtube,       group: 'Media' },
  { name: 'Airplay',       icon: Airplay,       group: 'Media' },
  { name: 'Cast',          icon: Cast,          group: 'Media' },
  { name: 'Printer',       icon: Printer,       group: 'Media' },
  { name: 'Monitor',       icon: Monitor,       group: 'Media' },
  // Science & Medical
  { name: 'Microscope',    icon: Microscope,    group: 'Science' },
  { name: 'Stethoscope',   icon: Stethoscope,   group: 'Science' },
  { name: 'FlaskConical',  icon: FlaskConical,  group: 'Science' },
  { name: 'Brain',         icon: Brain,         group: 'Science' },
  { name: 'Activity',      icon: Activity,      group: 'Science' },
  { name: 'Thermometer',   icon: Thermometer,   group: 'Science' },
  { name: 'Heart',         icon: Heart,         group: 'Science' },
  { name: 'Wind',          icon: Wind,          group: 'Science' },
  { name: 'Sun',           icon: Sun,           group: 'Science' },
  { name: 'Moon',          icon: Moon,          group: 'Science' },
  // Tech & Dev
  { name: 'Code2',         icon: Code2,         group: 'Tech' },
  { name: 'Terminal',      icon: Terminal,      group: 'Tech' },
  { name: 'Cpu',           icon: Cpu,           group: 'Tech' },
  { name: 'Server',        icon: Server,        group: 'Tech' },
  { name: 'Database',      icon: Database,      group: 'Tech' },
  { name: 'GitBranch',     icon: GitBranch,     group: 'Tech' },
  { name: 'Bug',           icon: Bug,           group: 'Tech' },
  { name: 'Wifi',          icon: Wifi,          group: 'Tech' },
  { name: 'Cloud',         icon: Cloud,         group: 'Tech' },
  { name: 'Smartphone',    icon: Smartphone,    group: 'Tech' },
  { name: 'Monitor',       icon: Monitor,       group: 'Tech' },
  { name: 'Cpu',           icon: Cpu,           group: 'Tech' },
  // Analytics & Business
  { name: 'BarChart2',     icon: BarChart2,     group: 'Analytics' },
  { name: 'TrendingUp',    icon: TrendingUp,    group: 'Analytics' },
  { name: 'PieChart',      icon: Grid,          group: 'Analytics' },
  { name: 'Sliders',       icon: Sliders,       group: 'Analytics' },
  { name: 'Filter',        icon: Filter,        group: 'Analytics' },
  { name: 'Search',        icon: Search,        group: 'Analytics' },
  { name: 'ZoomIn',        icon: ZoomIn,        group: 'Analytics' },
  { name: 'List',          icon: List,          group: 'Analytics' },
  { name: 'Grid',          icon: Grid,          group: 'Analytics' },
  { name: 'Columns',       icon: Columns,       group: 'Analytics' },
  // Design & Art
  { name: 'Palette',       icon: Palette,       group: 'Design' },
  { name: 'Crop',          icon: Crop,          group: 'Design' },
  { name: 'Layers',        icon: Layers,        group: 'Design' },
  { name: 'Layout',        icon: Layout,        group: 'Design' },
  { name: 'Eye',           icon: Eye,           group: 'Design' },
  { name: 'Compass',       icon: Compass,       group: 'Design' },
  // People & Teams
  { name: 'Users',         icon: Users,         group: 'People' },
  { name: 'UserCheck',     icon: UserCheck,     group: 'People' },
  { name: 'UserPlus',      icon: UserPlus,      group: 'People' },
  { name: 'User',          icon: User,          group: 'People' },
  // General
  { name: 'Star',          icon: Star,          group: 'General' },
  { name: 'Zap',           icon: Zap,           group: 'General' },
  { name: 'Globe',         icon: Globe,         group: 'General' },
  { name: 'Briefcase',     icon: Briefcase,     group: 'General' },
  { name: 'Award',         icon: Award,         group: 'General' },
  { name: 'Gift',          icon: Gift,          group: 'General' },
  { name: 'Flag',          icon: Flag,          group: 'General' },
  { name: 'Tag',           icon: Tag,           group: 'General' },
  { name: 'Key',           icon: Key,           group: 'General' },
  { name: 'Lock',          icon: Lock,          group: 'General' },
  { name: 'Shield',        icon: Shield,        group: 'General' },
  { name: 'ThumbsUp',      icon: ThumbsUp,      group: 'General' },
  { name: 'LifeBuoy',      icon: LifeBuoy,      group: 'General' },
  { name: 'Anchor',        icon: Anchor,        group: 'General' },
  { name: 'Map',           icon: Map,           group: 'General' },
  { name: 'MapPin',        icon: MapPin,        group: 'General' },
  { name: 'Home',          icon: Home,          group: 'General' },
  { name: 'Building',      icon: Building,      group: 'General' },
  { name: 'Building2',     icon: Building2,     group: 'General' },
  { name: 'Landmark',      icon: Landmark,      group: 'General' },
  { name: 'Package',       icon: Package,       group: 'General' },
  { name: 'Box',           icon: Box,           group: 'General' },
  { name: 'Coffee',        icon: Coffee,        group: 'General' },
  { name: 'Clock',         icon: Clock,         group: 'General' },
  { name: 'Watch',         icon: Watch,         group: 'General' },
  { name: 'Calendar',      icon: CalendarIcon,  group: 'General' },
  { name: 'CreditCard',    icon: CreditCard,    group: 'General' },
  { name: 'Download',      icon: Download,      group: 'General' },
  { name: 'Upload',        icon: Upload,        group: 'General' },
  { name: 'Link',          icon: Link,          group: 'General' },
  { name: 'Settings',      icon: Settings,      group: 'General' },
  { name: 'Wrench',        icon: Wrench,        group: 'General' },
  { name: 'Calculator',    icon: Calculator,    group: 'General' },
  { name: 'RefreshCw',     icon: RefreshCw,     group: 'General' },
  { name: 'Truck',         icon: Truck,         group: 'General' },
  { name: 'Bus',           icon: Bus,           group: 'General' },
  { name: 'Bike',          icon: Bike,          group: 'General' },
  { name: 'Umbrella',      icon: Umbrella,      group: 'General' },
];

const ICON_GROUPS = Array.from(new Set(ICON_OPTIONS.map(i => i.group)));

interface TeamMember {
  id: string;
  name: string;
  avatar_url: string | null;
  department: string;
}

export interface ExistingCategory {
  key: string;
  label: string;
  iconName?: string;
}

interface AssignTaskModalProps {
  member?: TeamMember | null;
  onClose: () => void;
  onSuccess: () => void;
  defaultCategory?: string;
  defaultDepartment?: string;
  existingCategories?: ExistingCategory[];
}

const PRESET_CATEGORIES = [
  { id: 'task',           label: 'General Task',    icon: Briefcase, color: '#6b7280' },
  { id: 'article',        label: 'Research Article', icon: FileText,  color: '#3b82f6' },
  { id: 'blog',           label: 'Blog Post',        icon: BookOpen,  color: '#9875c1' },
  { id: 'survivor_story', label: 'Survivor Story',   icon: Heart,     color: '#10b981' },
  { id: 'awareness_post', label: 'Awareness Post',   icon: Megaphone, color: '#f59e0b' },
  { id: 'other',          label: 'Other…',           icon: Layers,    color: '#6b7280' },
];

const DEPT_HEX: Record<string, string> = {
  "Writers' Block":  '#f59e0b',
  'Design Lab':      '#3b82f6',
  'Development':     '#10b981',
  'Marketing':       '#ec4899',
  'Public Relations':'#ec4899',
  'Leadership':      '#6366f1',
};

export default function AssignTaskModal({ member, onClose, onSuccess, defaultCategory, defaultDepartment, existingCategories = [] }: AssignTaskModalProps) {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [assigneeIds, setAssigneeIds] = useState<string[]>(member?.id ? [member.id] : []);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>(defaultCategory || 'task');
  const [customCategory, setCustomCategory] = useState('');
  const [customIconName, setCustomIconName] = useState('Briefcase');
  const [department, setDepartment] = useState(defaultDepartment || member?.department || "Writers' Block");
  const [priority, setPriority] = useState<'low' | 'normal' | 'high'>('normal');
  const [dueDate, setDueDate] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [iconSearch, setIconSearch] = useState('');
  const [activeGroup, setActiveGroup] = useState<string | null>(null);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  useEffect(() => {
    if (!member) {
      setLoading(true);
      fetch('/api/team')
        .then(r => r.json())
        .then(() => {})
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [member]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (assigneeIds.length === 0 || !title || !category || !dueDate) {
      setError('Please fill in all required fields');
      return;
    }
    if (category === 'other' && !customCategory.trim()) {
      setError('Please specify a category name');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const finalCategory = category === 'other'
        ? customCategory.trim().toLowerCase().replace(/\s+/g, '_')
        : category;

      const res = await fetch('/api/tasks/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assigned_to: assigneeIds,
          title,
          description,
          category: finalCategory,
          category_icon: category === 'other' ? customIconName : undefined,
          department,
          priority,
          due_date: dueDate,
        }),
      });

      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to assign task');
      }
    } catch (_err) {
      setError('An error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const deptColor = DEPT_HEX[department] || '#6b7280';
  const SelectedCustomIcon = ICON_OPTIONS.find(i => i.name === customIconName)?.icon || Briefcase;

  // Filtered + grouped icon list
  const filteredIcons = ICON_OPTIONS.filter(i => {
    const matchSearch = iconSearch === '' || i.name.toLowerCase().includes(iconSearch.toLowerCase());
    const matchGroup = activeGroup === null || i.group === activeGroup;
    return matchSearch && matchGroup;
  });
  // Deduplicate by name
  const seenNames = new Set<string>();
  const uniqueIcons = filteredIcons.filter(i => {
    if (seenNames.has(i.name)) return false;
    seenNames.add(i.name);
    return true;
  });

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9500] flex items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-xl anim-fade-in">
      <div className="glass-raised w-full max-w-lg rounded-none sm:rounded-[var(--r-xl)] overflow-hidden shadow-2xl anim-slide-down border-[var(--border-strong)] relative h-full sm:h-auto sm:max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-[var(--border-med)] flex items-center justify-between bg-[var(--bg-deep)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[var(--accent-subtle2)] flex items-center justify-center text-[var(--accent)]">
              <Layers size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[var(--text)] tracking-tight">Assign New Work</h2>
              <p className="text-xs text-[var(--text-4)]">Creation &amp; assignment of tasks</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-[var(--text-4)] hover:text-[var(--text)] hover:bg-[var(--bg-deep)] rounded-full transition-all">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-5 flex-1 overflow-y-auto custom-scrollbar">
          {error && (
            <div className="p-3 rounded-[var(--r-md)] bg-red-500/10 border border-red-500/20 text-red-500 text-xs flex items-center gap-2">
              <AlertTriangle size={14} />
              {error}
            </div>
          )}

          {/* Member Selection */}
          {!member && (
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-4)] flex items-center gap-1.5">
                <User size={10} />
                Assign To
              </label>
              <MultiPersonSelect
                selectedIds={assigneeIds}
                onChange={setAssigneeIds}
                maxSelections={(category === 'blog' || category === 'survivor_story') ? 1 : undefined}
                placeholder={(category === 'blog' || category === 'survivor_story') ? 'Assign one person…' : 'Search team members…'}
              />
              {(category === 'blog' || category === 'survivor_story') && assigneeIds.length > 1 && (
                <p className="text-[10px] text-amber-500 font-medium anim-fade-in">
                  Only one person can be assigned to {category === 'blog' ? 'blogs' : 'survivor stories'}.
                </p>
              )}
            </div>
          )}

          {/* Title */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-4)]">Task Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Draft article on immunotherapy advances"
              className="w-full bg-[var(--bg-deep)] border border-[var(--border-med)] rounded-[var(--r-md)] py-2.5 px-3 text-sm text-[var(--text)] focus:outline-none focus:border-[var(--accent)] transition-colors"
            />
          </div>

          {/* Category Selector */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-4)]">Category</label>

            {/* Existing dept categories (non-WB) or WB presets */}
            {(() => {
              const isWB = department === "Writers' Block";

              // For WB: fixed preset list. For others: dynamic existing categories from the dept.
              const displayCats: Array<{ id: string; label: string; iconComponent: any; color: string; isExisting?: boolean }> =
                isWB
                  ? PRESET_CATEGORIES.filter(c => c.id !== 'other').map(c => ({
                      id: c.id,
                      label: c.label,
                      iconComponent: c.icon,
                      color: c.color,
                    }))
                  : existingCategories.map(ec => {
                      const resolved = ICON_OPTIONS.find(i => i.name === (ec.iconName || ''))?.icon || Briefcase;
                      return { id: ec.key, label: ec.label, iconComponent: resolved, color: deptColor, isExisting: true };
                    });

              return (
                <div className="space-y-2">
                  {displayCats.length > 0 && (
                    <>
                      {!isWB && (
                        <p className="text-[10px] text-[var(--text-4)] mb-1">
                          Existing categories in this department:
                        </p>
                      )}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {displayCats.map((cat) => {
                          const Icon = cat.iconComponent;
                          const isActive = category === cat.id;
                          const activeColor = isWB ? cat.color : deptColor;
                          return (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => {
                                setCategory(cat.id);
                                // If it's an existing non-WB category with a stored icon, pre-fill customIconName
                                if (!isWB) {
                                  const ec = existingCategories.find(e => e.key === cat.id);
                                  if (ec?.iconName) setCustomIconName(ec.iconName);
                                }
                              }}
                              className={`flex items-center gap-2 px-3 py-2.5 rounded-[var(--r-md)] text-xs border transition-all ${
                                isActive ? 'font-semibold' : 'bg-transparent border-[var(--border-med)] text-[var(--text-3)] hover:bg-[var(--bg-deep)]'
                              }`}
                              style={isActive ? { background: `${activeColor}18`, borderColor: `${activeColor}40`, color: activeColor } : {}}
                            >
                              <Icon size={13} style={isActive ? { color: activeColor } : {}} />
                              {cat.label}
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}

                  {/* Other… — always shown */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setCategory('other')}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-[var(--r-md)] text-xs border transition-all ${
                        category === 'other' ? 'font-semibold' : 'bg-transparent border-[var(--border-med)] text-[var(--text-3)] hover:bg-[var(--bg-deep)]'
                      }`}
                      style={category === 'other' ? { background: `${deptColor}18`, borderColor: `${deptColor}40`, color: deptColor } : {}}
                    >
                      <Layers size={13} style={category === 'other' ? { color: deptColor } : {}} />
                      {isWB || existingCategories.length === 0 ? 'Other…' : '+ New Category'}
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Custom Category — name + icon picker */}
          {category === 'other' && (
            <div className="space-y-3 anim-fade-up p-3 rounded-[var(--r-md)] border border-[var(--border-med)] bg-[var(--bg-deep)]">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-4)]">Custom Category Details</p>

              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-[var(--text-4)]">Category Name</label>
                <input
                  type="text"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="e.g., UI Design, Sound Editing…"
                  className="w-full bg-[var(--bg)] border border-[var(--border-med)] rounded-[var(--r-md)] py-2 px-3 text-sm text-[var(--text)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                  autoFocus
                />
              </div>

              {/* Icon Selector */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-[var(--text-4)]">Icon</label>
                <button
                  type="button"
                  onClick={() => setShowIconPicker(p => !p)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-[var(--r-md)] border border-[var(--border-med)] bg-[var(--bg)] hover:border-[var(--accent-subtle)] transition-all text-sm w-full"
                >
                  <span className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: `${deptColor}20` }}>
                    <SelectedCustomIcon size={13} style={{ color: deptColor }} />
                  </span>
                  <span className="text-[var(--text-3)] flex-1 text-left">{customIconName}</span>
                  <span className="text-[10px] text-[var(--text-4)]">{showIconPicker ? '▲' : '▼'}</span>
                </button>

                {showIconPicker && (
                  <div className="border border-[var(--border-med)] rounded-[var(--r-md)] bg-[var(--bg)] overflow-hidden anim-scale-up">
                    {/* Search + group tabs */}
                    <div className="p-2 border-b border-[var(--border-med)] space-y-2">
                      <input
                        type="text"
                        value={iconSearch}
                        onChange={e => setIconSearch(e.target.value)}
                        placeholder="Search icons…"
                        className="w-full bg-[var(--bg-deep)] border border-[var(--border-med)] rounded-[var(--r-md)] py-1.5 px-2.5 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                      />
                      <div className="flex gap-1 flex-wrap">
                        <button
                          type="button"
                          onClick={() => setActiveGroup(null)}
                          className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border transition-all ${activeGroup === null ? 'border-[var(--accent-subtle)] text-[var(--accent)] bg-[var(--accent-subtle2)]' : 'border-[var(--border-med)] text-[var(--text-4)] hover:bg-[var(--bg-deep)]'}`}
                        >
                          All
                        </button>
                        {ICON_GROUPS.map(g => (
                          <button
                            key={g}
                            type="button"
                            onClick={() => setActiveGroup(activeGroup === g ? null : g)}
                            className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border transition-all ${activeGroup === g ? 'border-[var(--accent-subtle)] text-[var(--accent)] bg-[var(--accent-subtle2)]' : 'border-[var(--border-med)] text-[var(--text-4)] hover:bg-[var(--bg-deep)]'}`}
                          >
                            {g}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Icon grid */}
                    <div className="grid grid-cols-7 gap-1 p-2 max-h-52 overflow-y-auto custom-scrollbar">
                      {uniqueIcons.map(({ name, icon: Ico }) => (
                        <button
                          key={name}
                          type="button"
                          title={name}
                          onClick={() => { setCustomIconName(name); setShowIconPicker(false); setIconSearch(''); }}
                          className={`w-9 h-9 rounded-[var(--r-md)] flex items-center justify-center transition-all border ${
                            customIconName === name
                              ? 'border-[var(--accent-subtle)]'
                              : 'border-transparent hover:bg-[var(--bg-deep)]'
                          }`}
                          style={customIconName === name ? { background: `${deptColor}20` } : {}}
                        >
                          <Ico size={15} style={{ color: customIconName === name ? deptColor : 'var(--text-3)' }} />
                        </button>
                      ))}
                      {uniqueIcons.length === 0 && (
                        <div className="col-span-7 py-4 text-center text-[10px] text-[var(--text-4)]">No icons match "{iconSearch}"</div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Preview pill */}
              {customCategory && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-[var(--r-md)] text-xs font-semibold border" style={{ background: `${deptColor}12`, borderColor: `${deptColor}30`, color: deptColor }}>
                  <SelectedCustomIcon size={13} />
                  {customCategory}
                </div>
              )}
            </div>
          )}

          {/* Department — always visible */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-4)]">Department</label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full bg-[var(--bg-deep)] border border-[var(--border-med)] rounded-[var(--r-md)] py-2.5 px-3 text-sm text-[var(--text)] focus:outline-none focus:border-[var(--accent)] transition-colors appearance-none cursor-pointer"
            >
              {DEPARTMENTS.map(d => (
                <option key={d.key} value={d.key}>{d.label}</option>
              ))}
            </select>
          </div>

          {/* Date & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2 relative">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-4)] flex items-center gap-1.5">
                <CalendarIcon size={10} />
                Due Date
              </label>
              <button
                type="button"
                onClick={() => setShowCalendar(!showCalendar)}
                className="w-full bg-[var(--bg-deep)] border border-[var(--border-med)] rounded-[var(--r-md)] py-2.5 px-3 text-sm text-[var(--text)] text-left flex items-center justify-between hover:border-[var(--accent-subtle)] transition-colors"
              >
                <span>{dueDate ? new Date(dueDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Select date…'}</span>
                <CalendarIcon size={14} className="text-[var(--text-4)]" />
              </button>
              {showCalendar && (
                <>
                  <div className="fixed inset-0 z-[50]" onClick={() => setShowCalendar(false)} />
                  <div className="absolute top-full left-0 mt-2 z-[60] anim-scale-up">
                    <MiniCalendar value={dueDate} onChange={(date) => { setDueDate(date); setShowCalendar(false); }} />
                  </div>
                </>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-4)] flex items-center gap-1.5">
                <CheckCircle size={10} />
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full bg-[var(--bg-deep)] border border-[var(--border-med)] rounded-[var(--r-md)] py-2.5 px-3 text-sm text-[var(--text)] focus:outline-none focus:border-[var(--accent)] transition-colors appearance-none cursor-pointer"
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-4)]">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Additional details, scope, or context…"
              rows={3}
              className="w-full bg-[var(--bg-deep)] border border-[var(--border-med)] rounded-[var(--r-md)] py-2.5 px-3 text-sm text-[var(--text)] focus:outline-none focus:border-[var(--accent)] transition-colors resize-none"
            />
          </div>
        </form>

        <div className="p-4 sm:p-6 border-t border-[var(--border-med)] bg-[var(--bg-deep)] flex items-center justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-semibold text-[var(--text-3)] hover:text-[var(--text)] transition-colors">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-[var(--accent)] text-white px-6 py-2 rounded-[var(--r-md)] text-sm font-semibold shadow-lg shadow-[var(--accent-glow)] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 flex items-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Assigning…
              </>
            ) : (
              <>
                Assign Task
                <Layers size={16} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
