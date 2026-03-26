import { PenTool, Palette, Code2, Megaphone, Users } from 'lucide-react';

export const DEPARTMENTS = [
  { key: "Writers' Block", label: "Writers' Block", icon: PenTool, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  { key: 'Design Lab', label: 'Design Lab', icon: Palette, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  { key: 'Development', label: 'Development', icon: Code2, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  { key: 'Marketing', label: 'Marketing', icon: Megaphone, color: 'text-pink-500', bg: 'bg-pink-500/10', border: 'border-pink-500/20' },
  { key: 'Leadership', label: 'Leadership', icon: Users, color: 'text-indigo-500', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
];

export const getDepartmentByKey = (key: string) => DEPARTMENTS.find(d => d.key === key) || DEPARTMENTS[0];
