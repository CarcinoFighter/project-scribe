"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  Suspense,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "@/lib/useTheme";
import {
  Briefcase,
  CheckCircle2,
  AlertCircle,
  Calendar,
  ChevronRight,
  Plus,
  FileText,
  BookOpen,
  Heart,
  Check,
  Loader2,
  Users,
  ChevronDown,
  ChevronRight as ChevronR,
  Palette,
  Code2,
  Megaphone,
  PenTool,
  ShieldCheck,
  Shield,
  Layers,
  Send,
  Eye,
  Trash2,
  Menu,
  X,
  Layers as LayersIcon,
  Star,
  Zap,
  Globe,
  Camera,
  Music,
  Video,
  Mail,
  Share2,
  BarChart2,
  Cpu,
  Microscope,
  Stethoscope,
  Landmark,
  FlaskConical,
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
  Filter,
  Flag,
  Folder,
  Gift,
  GitBranch,
  Grid,
  Hash,
  Headphones,
  Home,
  Image as LucideImage,
  Inbox,
  Key,
  Layout,
  LifeBuoy,
  Link as LucideLink,
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
  TrendingUp,
  Truck,
  Twitter,
  Type,
  Umbrella,
  Upload,
  User,
  UserCheck,
  UserPlus,
  Volume2,
  Watch,
  Wifi,
  Wind,
  Wrench,
  Youtube,
  ZoomIn,
} from "lucide-react";
import { useUser } from "@/lib/useUser";
import { useNotifications } from "@/lib/useNotifications";
import AccountMenu from "@/components/AccountMenu";
import AssignTaskModal from "@/components/AssignTaskModal";
import Toast from "@/components/Toast";
import CommandPalette from "@/components/CommandPalette";
import TaskSubmissionModal from "@/components/TaskSubmissionModal";
import TaskDetailsModal from "@/components/TaskDetailsModal";
import MultiPersonSelect from "@/components/MultiPersonSelect";
import Header from "@/components/Header";
import MobileNav from "@/components/MobileNav";
import { Notif } from "@/components/NotifPanel";
import { Sidebar } from "@/components/Sidebar";
import { DEPARTMENTS } from "@/config/departments";
import {
  loadSettings,
  saveSettings,
  applySettings,
  type AppSettings,
} from "@/components/SettingsModal";
import { getCachedTasks, setCachedTasks } from "@/lib/tasks-cache";

// Custom SVG icons for departments (where we have them in public/icons)
const DEPT_CUSTOM_ICON: Record<string, string> = {
  Development: "/icons/development.svg",
  "Design Lab": "/icons/design.svg",
  Marketing: "/icons/marketing.svg",
};

interface Assignment {
  id: string;
  title: string;
  description: string;
  status:
    | "todo"
    | "in_progress"
    | "done"
    | "in_review"
    | "ready_for_proofreading"
    | "proofreading"
    | "ready_for_upload";
  priority: "low" | "normal" | "high";
  category: string;
  category_icon?: string;
  department?: string;
  due_date: string;
  document_id?: string;
  created_at: string;
  assignee?: {
    id: string;
    name: string;
    username: string;
    avatar_url: string | null;
    department: string;
  };
  assignees?: {
    id: string;
    name: string;
    username: string;
    avatar_url: string | null;
    department: string;
  }[];
  assigner?: { id: string; name: string; username: string };
  assigned_by?: string;
  proofreader?: {
    id: string;
    name: string;
    username: string;
    avatar_url: string | null;
    department: string;
  };
  document_title?: string;
}

// DEPARTMENTS imported from @/config/departments

const WRITERS_BLOCK_SECTIONS = [
  {
    key: "article",
    label: "Research Articles",
    icon: FileText,
    color: "#3b82f6",
    hasEditor: true,
    table: "cancer_docs",
  },
  {
    key: "blog",
    label: "Blog Posts",
    icon: BookOpen,
    color: "#9875c1",
    hasEditor: true,
    table: "blogs",
  },
  {
    key: "survivor_story",
    label: "Survivors Community",
    icon: Heart,
    color: "#10b981",
    hasEditor: true,
    table: "survivor_stories",
  },
];

const KNOWN_CATEGORIES: Record<
  string,
  { label: string; icon: any; color: string }
> = {
  article: { label: "Research Articles", icon: FileText, color: "#3b82f6" },
  blog: { label: "Blog Posts", icon: BookOpen, color: "#9875c1" },
  survivor_story: { label: "Survivor Stories", icon: Heart, color: "#10b981" },
  awareness_post: {
    label: "Awareness Posts",
    icon: Megaphone,
    color: "#f59e0b",
  },
  task: { label: "Task Assignments", icon: Briefcase, color: "#6b7280" },
};

// Map stored icon names → Lucide components (mirrors ICON_OPTIONS in AssignTaskModal)
const ICON_NAME_MAP: Record<string, any> = {
  Briefcase,
  FileText,
  BookOpen,
  Heart,
  Megaphone,
  Layers: LayersIcon,
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
  ShieldCheck,
  Cpu,
  Microscope,
  Stethoscope,
  Landmark,
  FlaskConical,
  Eye,
  Send,
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
  Filter,
  Flag,
  Folder,
  Gift,
  GitBranch,
  Grid,
  Hash,
  Headphones,
  Home,
  Image: LucideImage,
  Inbox,
  Key,
  Layout,
  LifeBuoy,
  Link: LucideLink,
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
};

function resolveIcon(
  catKey: string,
  sectionTasks: Assignment[],
  defaultFallback?: any,
): any {
  const storedIconName = sectionTasks.find(
    (t) => t.category_icon,
  )?.category_icon;
  if (storedIconName && ICON_NAME_MAP[storedIconName]) {
    return ICON_NAME_MAP[storedIconName];
  }

  if (KNOWN_CATEGORIES[catKey]) {
    return KNOWN_CATEGORIES[catKey].icon;
  }

  if (defaultFallback) {
    return defaultFallback;
  }

  const lower = catKey.toLowerCase();
  if (/feature|product|sprint|ticket/.test(lower)) return Star;
  if (/bug|fix|issue|error/.test(lower)) return Bug;
  if (/design|ui|ux|visual|art/.test(lower)) return Palette;
  if (/dev|code|backend|frontend|api/.test(lower)) return Code2;
  if (/market|campaign|ad|promo|seo/.test(lower)) return Megaphone;
  if (/doc|article|write|blog|content/.test(lower)) return FileText;
  if (/social|share|post|media/.test(lower)) return Share2;
  if (/data|analytic|report|metric|chart/.test(lower)) return BarChart2;
  if (/video|film|record|shoot/.test(lower)) return Video;
  if (/photo|image|camera/.test(lower)) return Camera;
  if (/event|conference|meeting|webinar/.test(lower)) return Calendar;
  if (/research|science|study|lab|medical/.test(lower)) return Microscope;
  if (/health|clinical|patient|therapy/.test(lower)) return Stethoscope;
  if (/infra|server|cloud|deploy|ops/.test(lower)) return Server;
  if (/security|auth|access|permission/.test(lower)) return Shield;
  if (/train|learning|education|course/.test(lower)) return BookOpen;
  if (/lead|manage|strategy|plan/.test(lower)) return Users;
  return LayersIcon;
}

function getDeptHex(deptKey?: string): string {
  const map: Record<string, string> = {
    "Writers' Block": "#f59e0b",
    "Design Lab": "#3b82f6",
    Development: "#10b981",
    Marketing: "#ec4899",
    "Public Relations": "#ec4899",
    Leadership: "#6366f1",
  };
  return map[deptKey || ""] || "#6b7280";
}
function StatusBadge({ status }: { status: string }) {
  const label = status.replace(/_/g, " ");
  return <span className={`db-status ${status}`}>{label}</span>;
}

function PriorityDot({ priority }: { priority: string }) {
  const bg =
    priority === "high"
      ? "var(--red, #b03030)"
      : priority === "normal"
        ? "var(--mid)"
        : "var(--rule)";
  return (
    <div style={{ width: 4, height: 4, background: bg }} title={priority} />
  );
}

function TaskRow({
  task,
  onCompleteClick,
  onDeleteClick,
  completing,
  deleting,
  isAdmin,
  showEditor,
  onInit,
  onTaskClick,
  currentUserId,
}: {
  task: Assignment;
  onCompleteClick: (task: Assignment) => void;
  onDeleteClick?: (task: Assignment) => void;
  completing: string | null;
  deleting?: string | null;
  isAdmin: boolean;
  showEditor: boolean;
  onInit: (id: string) => void;
  onTaskClick: (task: Assignment) => void;
  currentUserId?: string;
}) {
  const router = useRouter();
  const isDone = task.status === "done";

  const handleTitleClick = () => {
    if (showEditor && task.document_id) {
      router.push(
        `/editor?id=${task.document_id}&type=${task.category === "article" ? "cancer_docs" : task.category === "blog" ? "blogs" : "survivor_stories"}`,
      );
    }
  };

  return (
    <div
      className={`db-card flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 px-3 sm:px-4 py-3 border-b border-[var(--border)] last:border-b-0 group ${isDone ? "opacity-55" : ""}`}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div
          className={`w-7 h-7 flex items-center justify-center flex-shrink-0 ${isDone ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"}`}
        >
          {isDone ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
        </div>

        <div
          className="flex-1 min-w-0 cursor-pointer"
          onClick={() => onTaskClick(task)}
        >
          <div className="flex items-center gap-2 flex-wrap">
            <PriorityDot priority={task.priority} />
            {showEditor && task.document_id ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleTitleClick();
                }}
                className={`text-sm font-semibold text-left hover:text-[var(--accent)] transition-colors truncate ${isDone ? "line-through" : ""}`}
              >
                {task.document_title || task.title}
              </button>
            ) : (
              <span
                className={`text-sm font-semibold text-[var(--text)] truncate hover:text-[var(--accent)] transition-colors ${isDone ? "line-through" : ""}`}
              >
                {task.document_title || task.title}
              </span>
            )}
            <StatusBadge status={task.status} />
          </div>
          {task.description && (
            <p className="text-xs text-[var(--text-4)] truncate mt-0.5">
              {task.description}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 pl-10 sm:pl-0">
        <div className="flex items-center gap-3 sm:gap-4">
          {isAdmin && (task.assignees?.length || task.proofreader) && (
            <div className="flex items-center gap-2.5 group/avatars mr-1">
              <div className="flex items-center -space-x-2">
                {/* Regular Assignees */}
                {task.assignees?.slice(0, 3).map((member, idx) => (
                  <div
                    key={member.id}
                    className="db-avatar"
                    style={{ zIndex: 10 - idx }}
                    title={`Writer: ${member.name}`}
                  >
                    {member.avatar_url ? (
                      <img
                        src={member.avatar_url}
                        alt={member.name}
                        width={20}
                        height={20}
                      />
                    ) : (
                      member.name
                        ?.split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()
                    )}
                  </div>
                ))}

                {/* Proofreader Avatar */}
                {task.proofreader && (
                  <div
                    className="db-avatar border-2 border-[var(--accent)]"
                    style={{ zIndex: 5, background: 'var(--accent-sub)' }}
                    title={`Proofreader: ${task.proofreader.name}`}
                  >
                    {task.proofreader.avatar_url ? (
                      <img
                        src={task.proofreader.avatar_url}
                        alt={task.proofreader.name}
                        width={20}
                        height={20}
                      />
                    ) : (
                      <ShieldCheck size={10} className="text-[var(--accent)]" />
                    )}
                  </div>
                )}

                {task.assignees && task.assignees.length > 3 && (
                  <div
                    className="db-avatar"
                    style={{
                      background: "var(--surface-2)",
                      color: "var(--text-4)",
                      zIndex: 1
                    }}
                  >
                    +{task.assignees.length - 3}
                  </div>
                )}
              </div>
              <span className="text-[10px] sm:text-xs text-[var(--text-4)] truncate max-w-[60px] sm:max-w-[100px]">
                {task.proofreader ? (
                  <span className="text-[var(--accent)] font-medium">
                    {task.proofreader.name.split(' ')[0]} (PR)
                  </span>
                ) : task.assignees?.length === 1 ? (
                  task.assignees[0].name
                ) : task.assignees && task.assignees.length > 1 ? (
                  `${task.assignees.length} people`
                ) : (
                  "Unassigned"
                )}
              </span>
            </div>
          )}

          <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-[var(--text-4)] flex-shrink-0">
            <Calendar size={10} />
            {task.due_date
              ? new Date(task.due_date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
              : "—"}
          </div>
        </div>

        <div className="flex items-center gap-1.5 ml-auto sm:ml-0">
          {!isDone && (
            <button
              onClick={() => onCompleteClick(task)}
              disabled={completing === task.id || deleting === task.id}
              className="db-btn px-2.5 py-1"
              style={{
                background: "var(--accent-sub)",
                color: "var(--accent)",
                clipPath: "none",
              }}
            >
              <div className="flex items-center gap-1">
                {completing === task.id ? (
                  <Loader2 size={10} className="animate-spin" />
                ) : (
                  <Check size={10} />
                )}
                <span>{task.category === "task" ? "Submit" : "Done"}</span>
              </div>
            </button>
          )}

          {isAdmin && task.assigned_by === currentUserId && onDeleteClick && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteClick(task);
              }}
              disabled={deleting === task.id || completing === task.id}
              className="db-icon-btn"
              title="Delete task"
            >
              {deleting === task.id ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Trash2 size={13} />
              )}
            </button>
          )}

          {showEditor &&
            !isDone &&
            (task.document_id ? (
              <button onClick={handleTitleClick} className="db-btn px-3 py-1">
                <div className="flex items-center gap-1">
                  <span>Edit</span>
                  <ChevronR size={10} />
                </div>
              </button>
            ) : (
              <button
                onClick={() => onInit(task.id)}
                className="db-ghost"
                title="Create internal document for this assignment"
              >
                Init
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}

function SectionTable({
  section,
  tasks,
  onCompleteClick,
  onDeleteClick,
  completing,
  deleting,
  isAdmin,
  onAssign,
  onToast,
  onInit,
  onTaskClick,
  currentUserId,
}: {
  section: (typeof WRITERS_BLOCK_SECTIONS)[0];
  tasks: Assignment[];
  onCompleteClick: (task: Assignment) => void;
  onDeleteClick?: (task: Assignment) => void;
  completing: string | null;
  deleting?: string | null;
  isAdmin: boolean;
  onAssign: (category: string) => void;
  onToast: (m: string) => void;
  onInit: (id: string) => void;
  onTaskClick: (task: Assignment) => void;
  currentUserId?: string;
}) {
  const [expanded, setExpanded] = useState(true);
  const Icon = section.icon;
  const pending = tasks.filter((t: Assignment) => t.status !== "done");
  const done = tasks.filter((t: Assignment) => t.status === "done");

  return (
    <div className="db-card border border-[var(--border-med)] overflow-hidden mb-4">
      <div
        className="flex items-center gap-3 px-4 py-3 bg-[var(--bg-deep)] cursor-pointer select-none border-b border-[var(--border)]"
        onClick={() => setExpanded((e) => !e)}
      >
        <div
          className="w-7 h-7 flex items-center justify-center flex-shrink-0"
          style={{ background: `${section.color}18` }}
        >
          <Icon size={14} style={{ color: section.color }} />
        </div>
        <span className="text-sm font-bold text-[var(--text)] flex-1">
          {section.label}
        </span>

        {tasks.length > 0 && (
          <span
            className="db-status"
            style={{
              background: `${section.color}18`,
              color: section.color,
              border: "none",
            }}
          >
            {pending.length} PENDING
          </span>
        )}

        {isAdmin && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAssign(section.key);
            }}
            className="db-icon-btn p-1"
            title={`Assign ${section.label}`}
          >
            <Plus size={14} />
          </button>
        )}

        <ChevronDown
          size={14}
          className={`text-[var(--text-4)] transition-transform ${expanded ? "" : "-rotate-90"}`}
        />
      </div>

      {expanded && (
        <div className="anim-fade-in">
          {tasks.length === 0 ? (
            <div className="py-8 text-center text-[var(--text-4)]">
              <Icon
                size={22}
                className="mx-auto mb-2 opacity-30"
                style={{ color: section.color }}
              />
              <p className="text-xs">No assignments yet</p>
              {isAdmin && (
                <button
                  onClick={() => onAssign(section.key)}
                  className="mt-2 text-xs font-semibold text-[var(--accent)] hover:underline flex items-center gap-1 mx-auto"
                >
                  <Plus size={11} /> Assign first task
                </button>
              )}
            </div>
          ) : (
            <>
              {pending.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  onCompleteClick={onCompleteClick}
                  onDeleteClick={onDeleteClick}
                  completing={completing}
                  deleting={deleting}
                  isAdmin={isAdmin}
                  showEditor={section.hasEditor}
                  onInit={onInit}
                  onTaskClick={onTaskClick}
                  currentUserId={currentUserId}
                />
              ))}
              {done.length > 0 && (
                <details className="group/done">
                  <summary className="flex items-center gap-2 px-4 py-2 text-xs text-[var(--text-4)] cursor-pointer hover:bg-[var(--bg-deep)] select-none list-none border-t border-[var(--border)]">
                    <ChevronR
                      size={12}
                      className="group-open/done:rotate-90 transition-transform"
                    />
                    {done.length} completed
                  </summary>
                  {done.map((task) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      onCompleteClick={onCompleteClick}
                      onDeleteClick={onDeleteClick}
                      completing={completing}
                      deleting={deleting}
                      isAdmin={isAdmin}
                      showEditor={section.hasEditor}
                      onInit={onInit}
                      onTaskClick={onTaskClick}
                      currentUserId={currentUserId}
                    />
                  ))}
                </details>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function DepartmentPlaceholder({
  dept,
  onToast,
}: {
  dept: (typeof DEPARTMENTS)[0];
  onToast: (m: string) => void;
}) {
  const Icon = dept.icon;
  return (
    <div className="db-card border border-[var(--border-med)] overflow-hidden mb-4">
      <div className="flex items-center gap-3 px-4 py-3 bg-[var(--bg-deep)] border-b border-[var(--border)]">
        <div
          className="w-7 h-7 flex items-center justify-center flex-shrink-0"
          style={{ background: `${dept.color}18` }}
        >
          <Icon size={14} className={dept.color} />
        </div>
        <span className="text-sm font-bold text-[var(--text)] flex-1">
          {dept.label} BOARD
        </span>
        <button
          onClick={() => onToast("Department tables coming soon")}
          className="db-ghost px-3 py-1.5"
        >
          <Plus size={12} />
          Add Table
        </button>
      </div>
      <div className="py-12 text-center text-[var(--text-4)] border-t border-[var(--rule)]">
        <Icon size={28} className="mx-auto mb-3 opacity-20" />
        <p className="text-xs font-medium italic">
          This department board is currently under construction.
        </p>
      </div>
    </div>
  );
}

export default function WorkPage() {
  const router = useRouter();
  const { user, loading: loadingUser, updateMetadata } = useUser();
  const [myAssignments, setMyAssignments] = useState<Assignment[]>([]);
  const [allAssignments, setAllAssignments] = useState<Assignment[]>([]);
  const [showCmd, setShowCmd] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState<{
    category?: string;
    department?: string;
  } | null>(null);
  const [activeDeptKey, setActiveDeptKey] = useState("Writers' Block");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isDark, toggleTheme } = useTheme();

  const isWritersBlock = activeDeptKey === "Writers' Block";
  const [completing, setCompleting] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [view, setView] = useState<"my" | "admin">("my");
  const [toast, setToast] = useState<string | null>(null);
  const [submittingTask, setSubmittingTask] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [selectedTask, setSelectedTask] = useState<Assignment | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const [counts, setCounts] = useState<{ articles: number; blogs: number }>({
    articles: 0,
    blogs: 0,
  });
  const [starredDocs, setStarredDocs] = useState<any[]>([]);
  const {
    notifications: notifs,
    unreadCount,
    markAllRead: handleMarkAllRead,
    markRead: handleMarkRead,
  } = useNotifications();
  const hasRestored = useRef(false);

  // Leadership is defined as admin access OR explicitly being in the Leadership department
  const isLeadership = !!user?.admin_access || user?.department === "Leadership";
  const pageTitle = "TASKS";

  useEffect(() => {
    if (!loadingUser && user === null) {
      router.push("/login");
    }

    // Restore last config from metadata or local storage (ONLY ONCE)
    if (user && !hasRestored.current) {
      const config = user.metadata?.lastTasksConfig;
      if (config) {
        if (config.dept) setActiveDeptKey(config.dept);
        if (config.view) setView(config.view);
        hasRestored.current = true;
      } else {
        const local = localStorage.getItem("tasks_last_config");
        if (local) {
          try {
            const parsed = JSON.parse(local);
            if (parsed.dept) setActiveDeptKey(parsed.dept);
            if (parsed.view) setView(parsed.view);
          } catch {}
        }
        hasRestored.current = true;
      }
    }
  }, [user, loadingUser, router]);

  // Persist config changes
  useEffect(() => {
    if (!user || !hasRestored.current) return;
    const config = { dept: activeDeptKey, view };
    localStorage.setItem("tasks_last_config", JSON.stringify(config));

    if (isLeadership) {
      const currentMeta = user.metadata || {};
      // Avoid infinite loop by checking if metadata is actually different
      const last = currentMeta.lastTasksConfig;
      if (last?.dept !== activeDeptKey || last?.view !== view) {
        updateMetadata({ ...currentMeta, lastTasksConfig: config });
      }
    }
  }, [activeDeptKey, view, user, isLeadership, updateMetadata]);

  // Apply saved settings on mount (theme, accent colour, fonts, etc.)
  useEffect(() => {
    const s = loadSettings();
    setSettings(s);
    applySettings(s);
  }, []);

  const fetchWork = useCallback(async () => {
    // Only show loader if we don't have cached data
    const cachedMy = getCachedTasks('mine');
    const cachedAll = getCachedTasks('all');
    
    if (cachedMy) setMyAssignments(cachedMy);
    if (cachedAll) setAllAssignments(cachedAll);
    
    if (!cachedMy || (isLeadership && !cachedAll)) {
      setLoading(true);
    }

    try {
      const [myRes, allRes] = await Promise.all([
        fetch("/api/tasks"),
        isLeadership ? fetch("/api/tasks/all") : Promise.resolve(null),
      ]);

      if (myRes.ok) {
        const data = await myRes.json();
        const assignments = data.assignments || [];
        setMyAssignments(assignments);
        setCachedTasks('mine', assignments);
      }
      if (allRes?.ok) {
        const data = await allRes.json();
        const assignments = data.assignments || [];
        setAllAssignments(assignments);
        setCachedTasks('all', assignments);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user?.admin_access, isLeadership]);

  useEffect(() => {
    if (user !== undefined) fetchWork();

    // Only set default if we don't have a persisted state (persisted state handled above)
    if (user?.department && !user.metadata?.lastTasksConfig && !localStorage.getItem("tasks_last_config")) {
      setActiveDeptKey(user.department);
    }
  }, [user, fetchWork]);

  // Safeguard: Lock non-leadership users to their assigned department
  useEffect(() => {
    if (user && !isLeadership && user.department && activeDeptKey !== user.department) {
      setActiveDeptKey(user.department);
    }
  }, [user, isLeadership, activeDeptKey]);

  const handleCompleteClick = (task: Assignment) => {
    if (task.category === "task") {
      setSubmittingTask({ id: task.id, title: task.title });
    } else if (["article", "blog", "survivor_story"].includes(task.category)) {
      // Instead of redirecting, open the details modal to allow workflow actions (e.g. proofreading)
      setSelectedTask(task);
    } else {
      handleComplete(task.id);
    }
  };

  const handleComplete = async (taskId: string) => {
    setCompleting(taskId);
    try {
      const res = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: taskId, status: "done" }),
      });
      if (res.ok) {
        const updater = (prev: Assignment[]) =>
          prev.map((a) =>
            a.id === taskId ? { ...a, status: "done" as const } : a,
          );
        setMyAssignments(updater);
        setAllAssignments(updater);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCompleting(null);
    }
  };

  const handleDelete = async (task: Assignment) => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    setDeleting(task.id);
    try {
      const res = await fetch(`/api/tasks?id=${task.id}`, { method: "DELETE" });
      if (res.ok) {
        setMyAssignments((prev) => prev.filter((a) => a.id !== task.id));
        setAllAssignments((prev) => prev.filter((a) => a.id !== task.id));
        setToast("Task deleted");
      } else {
        const err = await res.json();
        setToast(err.error || "Failed to delete task");
      }
    } catch (err) {
      setToast("Error deleting task");
    } finally {
      setDeleting(null);
    }
  };

  const handleInitDoc = async (assignmentId: string) => {
    try {
      const res = await fetch("/api/tasks/initialize-doc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignmentId }),
      });
      const data = await res.json();
      if (res.ok) {
        setToast("Document initialized successfully");
        fetchWork(); // Refresh list to get the new document_id
      } else {
        setToast(data.error || "Failed to initialize document");
      }
    } catch (err) {
      setToast("An error occurred during initialization");
    } finally {
      // nothing needed
    }
  };

  const isAdmin = !!user?.admin_access;
  const assignments =
    isLeadership && view === "admin" ? allAssignments : myAssignments;

  const handleTaskClick = (task: Assignment) => {
    setSelectedTask(task);
  };

  // Filter tasks for the active department
  const activeDeptTasks = assignments.filter((a) => {
    // 1. Task belongs to this department
    // Treat null/undefined as "Writers' Block" for backward compatibility/editorial content
    const isPrimary = activeDeptKey === "Writers' Block"
      ? (a.department === activeDeptKey || !a.department)
      : a.department === activeDeptKey;

    if (isPrimary) return true;

    // 2. Task is assigned to someone who belongs to this department (Cross-department assignment)
    // This allows people to see tasks assigned to them from other departments on their own board
    const isAssignedToThisDept = a.assignees?.some(m => m.department === activeDeptKey);

    return isAssignedToThisDept;
  });

  const activeDept =
    DEPARTMENTS.find((d) => d.key === activeDeptKey) || DEPARTMENTS[0];

  // Derive existing categories for the active department from ALL assignments (not just filtered view)
  // Use allAssignments so admins see all categories even if not assigned to them
  const deptExistingCategories = React.useMemo((): Array<{
    key: string;
    label: string;
    iconName?: string;
  }> => {
    const source = allAssignments.length > 0 ? allAssignments : myAssignments;
    const deptTasks = source.filter((a) => {
      if (activeDeptKey === "Writers' Block")
        return a.department === activeDeptKey || !a.department;
      return a.department === activeDeptKey;
    });
    const seen: Record<
      string,
      { key: string; label: string; iconName?: string }
    > = {};
    for (const t of deptTasks) {
      if (!seen[t.category]) {
        seen[t.category] = {
          key: t.category,
          label:
            t.category.charAt(0).toUpperCase() +
            t.category.slice(1).replace(/_/g, " "),
          iconName: t.category_icon ?? undefined,
        };
      }
    }
    return Object.values(seen);
  }, [allAssignments, myAssignments, activeDeptKey]);

  useEffect(() => {
    (window as any).openTaskDetails = (task: Assignment) =>
      setSelectedTask(task);

    // Fetch counts for sidebar
    const fetchCounts = async () => {
      try {
        const r = await fetch("/api/documents");
        if (r.ok) {
          const d = await r.json();
          const docs = d.documents || [];
          setCounts({
            articles: docs.filter(
              (doc: any) =>
                doc.type === "cancer_docs" || doc.type === "survivor_stories",
            ).length,
            blogs: docs.filter((doc: any) => doc.type === "blogs").length,
          });
          setStarredDocs(docs.filter((doc: any) => doc.starred));
        }
      } catch {}
    };
    fetchCounts();
  }, []);

  const isFullSidebar = isWritersBlock || activeDeptKey === "Leadership";

  return (
    <div className={`db-root ${isDark ? "dark" : ""}`}>
      {/* == HEADER ========================================================== */}
      <Header
        user={user}
        notifs={notifs}
        unreadCount={unreadCount}
        isDark={isDark}
        onToggleTheme={toggleTheme}
        onOpenCmd={() => setShowCmd(true)}
        onOpenSearch={() => {
          /* Use global search or page search? For now, we'll keep it consistent */
        }}
        onOpenSettings={() => setShowSettings(true)}
        onMarkAllRead={handleMarkAllRead}
        onToast={(m) => setToast(m)}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        breadcrumb={
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-1.5 no-underline">
              <Image src="/logo.svg" alt="Vantage" width={14} height={16} />
              <span className="hidden sm:inline font-bold text-sm tracking-tight text-[var(--ink)]">Vantage</span>
            </Link>
          </div>
        }
        extraMobileContent={
          <div className="space-y-4">
            {isLeadership && (
              <div className="space-y-2">
                <span className="db-cap block">Board Selection</span>
                <div className="grid grid-cols-1 gap-1">
                  {DEPARTMENTS.map((dept) => {
                    const isActive = activeDeptKey === dept.key;
                    return (
                      <button
                        key={dept.key}
                        onClick={() => {
                          setActiveDeptKey(dept.key);
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-left hover:bg-[var(--accent-sub)] ${isActive ? "text-[var(--accent)] bg-[var(--accent-sub)]" : "text-[var(--mid)]"}`}
                      >
                        <dept.icon
                          size={14}
                          className={isActive ? dept.color : "text-current"}
                        />
                        {dept.label.toUpperCase()}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            {isLeadership && (
              <div className="space-y-2">
                <span className="db-cap block">View Perspective</span>
                <div className="flex bg-[var(--accent-sub)] p-0.5 border border-[var(--rule)]">
                  <button
                    onClick={() => {
                      setView("my");
                      setMobileMenuOpen(false);
                    }}
                    className={`flex-1 db-filter-btn px-3 py-2 ${view === "my" ? "active" : ""}`}
                  >
                    My Assignments
                  </button>
                  <button
                    onClick={() => {
                      setView("admin");
                      setMobileMenuOpen(false);
                    }}
                    className={`flex-1 db-filter-btn px-3 py-2 ${view === "admin" ? "active" : ""}`}
                  >
                    Team Board
                  </button>
                </div>
              </div>
            )}
          </div>
        }
      >
        <div className="flex items-center gap-1 ml-2">
          {isLeadership && (
            <div className="relative">
              {/* Department Toggler (Header) */}
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="db-ghost p-0 flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-[var(--mid)] hover:text-[var(--accent)]"
              >
                {activeDeptKey}
                <ChevronDown size={10} strokeWidth={2.5} className={`transition-transform ${isMenuOpen ? "rotate-180" : ""}`} />
              </button>

              {/* Department Menu Dropdown */}
              {isMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-[250]"
                    onClick={() => setIsMenuOpen(false)}
                  />
                  <div
                    className="absolute top-full left-0 mt-3 w-52 bg-[var(--paper)] border border-[var(--rule)] shadow-2xl z-[300] anim-fade-in"
                    style={{ borderTop: "2px solid var(--accent)" }}
                  >
                    <div className="p-2 border-b border-[var(--rule)]">
                      <span className="db-cap">Select Board</span>
                    </div>
                    <div className="p-1">
                      {DEPARTMENTS.map((dept) => {
                        const isActive = activeDeptKey === dept.key;
                        return (
                          <button
                            key={dept.key}
                            onClick={() => {
                              setActiveDeptKey(dept.key);
                              setIsMenuOpen(false);
                            }}
                            className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-[10px] font-bold text-left hover:bg-[var(--accent-sub)] ${isActive ? "text-[var(--accent)] bg-[var(--accent-sub)]" : "text-[var(--mid)]"}`}
                          >
                            <dept.icon
                              size={12}
                              className={isActive ? dept.color : "text-current"}
                            />
                            {dept.label.toUpperCase()}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </Header>

      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        {/* Sidebar */}
        <Sidebar
          activeNav="tasks"
          isFullSidebar={isFullSidebar}
          counts={{
            articles: counts.articles,
            blogs: counts.blogs,
            tasks: (isLeadership && view === "admin"
              ? allAssignments
              : myAssignments
            ).filter((t) => t.status !== "done").length,
          }}
          starredDocs={starredDocs}
          onNavClick={(id) => {
            if (id === "home") router.push("/");
            if (id === "articles") router.push("/");
            if (id === "blogs") router.push("/");
          }}
        />

        {/* -- MAIN ---------------------------------------------------------- */}
        <main className="db-main">
          <div className="max-w-5xl mx-auto">
            {/* Editorial Page Title */}
            <div className="mb-8 anim-fade-in">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-3 border-b-2 border-[var(--ink)]">
                <div>
                  <p className="db-page-sub mb-1">Board · {activeDeptKey}</p>
                  {isLeadership ? (
                    <button 
                      onClick={() => setView(view === "my" ? "admin" : "my")}
                      className="db-page-title group flex items-center gap-3 text-left hover:opacity-80 transition-opacity"
                    >
                      <span>
                        {view === "admin" ? "TEAM" : "MY"} <em>BOARD</em>
                      </span>
                      <ChevronDown size={28} className="text-[var(--accent)] opacity-20 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ) : (
                    <h1 className="db-page-title">
                      ASSIGNMENT <em>BOARD</em>
                    </h1>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--accent-sub)] border border-[var(--rule)]">
                    <span className="db-cap text-[var(--accent)] font-bold">
                      {assignments.length}
                    </span>
                    <span className="db-cap">Total Tasks</span>
                  </div>
                  {isAdmin && (
                    <button
                      onClick={() =>
                        setShowAssignModal({ department: activeDeptKey })
                      }
                      className="db-btn"
                    >
                      <Plus size={12} strokeWidth={2.5} />
                      NEW TASK
                    </button>
                  )}
                </div>
              </div>
              <div className="h-px bg-[var(--rule)] mt-1 opacity-50" />
            </div>

            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-4 text-[var(--text-4)]">
                <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent animate-spin" />
                <span className="db-cap">Loading assignments...</span>
              </div>
            ) : (
              <>
                {/* Specialized Content Section (Writers' Block) */}
                {isWritersBlock ? (
                  <div className="anim-fade-in">
                    <div className="flex items-center justify-between mb-4 mt-8 pb-2 border-b-2 border-[var(--ink)]">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[var(--accent-sub)] flex items-center justify-center">
                          <PenTool size={16} className="text-[var(--accent)]" />
                        </div>
                        <div>
                          <h2 className="db-page-sub font-bold text-[var(--ink)]">
                            Editorial Workflow
                          </h2>
                          <p className="db-cap text-[8px]">
                            Articles, blogs, and community stories
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() =>
                          setShowAssignModal({ department: "Writers' Block" })
                        }
                        className="db-ghost px-3 py-1 text-[10px]"
                      >
                        <Plus size={10} />
                        ADD CATEGORY
                      </button>
                    </div>

                    {(() => {
                      // 1. Get default sections
                      const renderedSections = [...WRITERS_BLOCK_SECTIONS];
                      // 2. Identify all categories + departments present in activeDeptTasks
                      const nativeGroups = activeDeptTasks.filter(a => a.department === "Writers' Block" || !a.department);
                      const foreignGroups = activeDeptTasks.filter(a => a.department !== "Writers' Block" && a.department);

                      // 3. Find unique dynamic categories for Writers' Block (not in standard sections)
                      const dynamicNativeCategories = Array.from(
                        new Set(nativeGroups.map((t) => t.category)),
                      ).filter(
                        (cat) => !renderedSections.some((s) => s.key === cat),
                      );

                      // 4. Create foreign sections grouped by department and category
                      const foreignSections = foreignGroups.reduce((acc, t) => {
                        const dept = t.department!;
                        const key = `${dept}|${t.category}`;
                        if (!acc[key]) acc[key] = {
                          key: t.category,
                          department: dept,
                          label: t.category.charAt(0).toUpperCase() + t.category.slice(1).replace(/_/g, " "),
                          icon: Layers,
                          color: "#6b7280",
                          hasEditor: false,
                          table: null,
                        };
                        return acc;
                      }, {} as Record<string, any>);

                      const allSections = renderedSections;

                      return allSections.map((section: any) => {
                        const isNative = !section.department || section.department === "Writers' Block";
                        const sectionTasks = activeDeptTasks.filter(
                          (a) => a.category === section.key && 
                                (isNative ? (a.department === "Writers' Block" || !a.department) : a.department === section.department)
                        );
                        // Resolve icon prioritizing DB value
                        const resolvedIcon = resolveIcon(
                          section.key,
                          sectionTasks,
                          section.icon,
                        );

                        // If foreign, add department name to label and use that department's color
                        const sectionColor = isNative ? (section.color) : getDeptHex(section.department);
                        const label = isNative ? section.label : `${section.label} (${section.department})`;

                        return (
                          <SectionTable
                            key={isNative ? section.key : `${section.department}-${section.key}`}
                            section={
                              {
                                ...section,
                                label,
                                color: sectionColor,
                                icon: resolvedIcon,
                              } as any
                            }
                            tasks={sectionTasks}
                            onCompleteClick={handleCompleteClick}
                            onDeleteClick={handleDelete}
                            completing={completing}
                            deleting={deleting}
                            isAdmin={isAdmin}
                            onAssign={(category: string) =>
                              setShowAssignModal({
                                category,
                                department: activeDeptKey,
                              })
                            }
                            onToast={(m: string) => setToast(m)}
                            onInit={handleInitDoc}
                            onTaskClick={handleTaskClick}
                            currentUserId={user?.id}
                          />
                        );
                      });
                    })()}
                  </div>
                ) : (
                  <div className="anim-fade-in">
                    <div className="flex items-center justify-between mb-4 mt-8 pb-2 border-b-2 border-[var(--ink)]">
                      <div className="flex items-center gap-3">
                        {DEPT_CUSTOM_ICON[activeDeptKey] ? (
                          <div
                            className={`w-8 h-8 ${activeDept.bg} flex items-center justify-center p-1.5`}
                          >
                            <Image
                              src={DEPT_CUSTOM_ICON[activeDeptKey]}
                              alt={activeDept.label}
                              width={20}
                              height={20}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "contain",
                              }}
                            />
                          </div>
                        ) : (
                          <div
                            className={`w-8 h-8 ${activeDept.bg} flex items-center justify-center`}
                          >
                            <activeDept.icon
                              size={16}
                              className={activeDept.color}
                            />
                          </div>
                        )}
                        <div>
                          <h2 className="db-page-sub font-bold text-[var(--ink)]">
                            {activeDept.label} Board
                          </h2>
                          <p className="db-cap text-[8px]">
                            Active projects and tasks for {activeDept.label}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() =>
                          setShowAssignModal({ department: activeDeptKey })
                        }
                        className={`db-ghost px-3 py-1 text-[10px] ${activeDept.color}`}
                      >
                        <Plus size={10} />
                        ADD CATEGORY
                      </button>
                    </div>

                    {(() => {
                      // Group tasks by category AND department
                      const groups = activeDeptTasks.reduce((acc, t) => {
                        const dept = t.department || "Writers' Block";
                        const key = `${dept}|${t.category}`;
                        if (!acc[key]) acc[key] = {
                          category: t.category,
                          department: dept,
                          tasks: []
                        };
                        acc[key].tasks.push(t);
                        return acc;
                      }, {} as Record<string, { category: string, department: string, tasks: Assignment[] }>);

                      // Ensure "General Tasks" for the active department is ALWAYS present (parity with Writers' Block)
                      const nativeDeptKeyVal = activeDeptKey || "Writers' Block";
                      const nativeTaskKey = `${nativeDeptKeyVal}|task`;
                      if (!groups[nativeTaskKey]) {
                        groups[nativeTaskKey] = {
                          category: "task",
                          department: nativeDeptKeyVal,
                          tasks: []
                        };
                      }

                      const groupList = Object.values(groups);

                      // Sort groups:
                      // 1. Native department groups first
                      // 2. Normal categories sorted alphabetically
                      // 3. 'task' category last
                      // 4. Foreign department groups at the very bottom
                      const sortedGroups = groupList.sort((a, b) => {
                        const aIsNative = a.department === activeDeptKey;
                        const bIsNative = b.department === activeDeptKey;

                        if (aIsNative && !bIsNative) return -1;
                        if (!aIsNative && bIsNative) return 1;

                        if (aIsNative && bIsNative) {
                          if (a.category === "task" && b.category !== "task") return 1;
                          if (a.category !== "task" && b.category === "task") return -1;
                          return a.category.localeCompare(b.category);
                        }

                        // Both foreign: Sort by department first, then category
                        if (a.department !== b.department) return a.department.localeCompare(b.department);
                        return a.category.localeCompare(b.category);
                      });

                      return sortedGroups.map((group) => {
                        const { category: cat, department: dept, tasks: sectionTasks } = group;
                        const isNative = dept === activeDeptKey;
                        const known = KNOWN_CATEGORIES[cat];
                        const deptColor = getDeptHex(dept);
                        const resolvedIcon = resolveIcon(cat, sectionTasks, known?.icon);

                        // If foreign, add department name to label
                        let label = known?.label ||
                          cat.charAt(0).toUpperCase() + cat.slice(1).replace(/_/g, " ");

                        if (!isNative) {
                          label = `${label} (${dept})`;
                        }

                        return (
                          <SectionTable
                            key={`${dept}-${cat}`}
                            section={{
                              key: cat,
                              label,
                              icon: resolvedIcon,
                              color: known?.color || deptColor,
                              hasEditor: ["article", "blog", "survivor_story"].includes(cat),
                              table: "",
                            }}
                            tasks={sectionTasks}
                            onCompleteClick={handleCompleteClick}
                            onDeleteClick={handleDelete}
                            completing={completing}
                            deleting={deleting}
                            isAdmin={isAdmin}
                            onAssign={(category: string) =>
                              setShowAssignModal({
                                category,
                                department: dept,
                              })
                            }
                            onToast={(m: string) => setToast(m)}
                            onInit={handleInitDoc}
                            onTaskClick={handleTaskClick}
                            currentUserId={user?.id}
                          />
                        );
                      });
                    })()}
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {showAssignModal !== null && (
        <AssignTaskModal
          onClose={() => setShowAssignModal(null)}
          onSuccess={() => {
            setShowAssignModal(null);
            fetchWork();
          }}
          defaultCategory={showAssignModal.category as any}
          defaultDepartment={showAssignModal.department}
          existingCategories={deptExistingCategories}
        />
      )}
      {submittingTask !== null && (
        <TaskSubmissionModal
          taskId={submittingTask.id}
          taskTitle={submittingTask.title}
          onClose={() => setSubmittingTask(null)}
          onSuccess={(url) => {
            setSubmittingTask(null);
            fetchWork();
            setToast("Task submitted for review successfully");
          }}
        />
      )}
      {selectedTask && (
        <TaskDetailsModal
          task={selectedTask}
          isAdmin={isAdmin}
          userId={user?.id}
          onClose={() => setSelectedTask(null)}
          onUpdate={fetchWork}
          onOpenSubmission={(id, title) => {
            setSelectedTask(null);
            setSubmittingTask({ id, title });
          }}
        />
      )}

      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}

      <Suspense fallback={null}>
        <MobileNav
          activeNav="tasks"
          pendingTasksCount={
            myAssignments.filter((t) => t.status !== "done").length
          }
          isFullSidebar={isWritersBlock || user?.department === "Leadership"}
        />
      </Suspense>
    </div>
  );
}
