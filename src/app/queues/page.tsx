"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
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
  ShieldCheck,
  PenTool,
  Eye,
  User,
  Layers,
  ChevronRight as ChevronR,
} from "lucide-react";
import { useUser } from "@/lib/useUser";
import { useNotifications } from "@/lib/useNotifications";
import PageHeader from "@/components/PageHeader";
import Toast from "@/components/Toast";
import MediaViewerModal from "@/components/MediaViewerModal";
import MultiPersonSelect from "@/components/MultiPersonSelect";
import MobileNav from "@/components/MobileNav";
import { Sidebar } from "@/components/Sidebar";
import {
  loadSettings,
  applySettings,
  type AppSettings,
} from "@/components/SettingsModal";

interface ReviewDoc {
  id: string;
  title: string;
  type: "blogs" | "survivor_stories" | "cancer_docs" | "tasks";
  status:
    | "review"
    | "in_review"
    | "ready_for_proofreading"
    | "ready_for_upload";
  updated_at: string;
  author?: { id: string; name: string; avatar_url: string | null };
  submission_media_url?: string;
  assigned_by?: string;
}

function StatusBadge({ status }: { status: string }) {
  const label = status.replace(/_/g, " ");
  return <span className={`db-status ${status}`}>{label}</span>;
}

function ReviewQueue({
  docs,
  onApprove,
  approving,
  isAdmin,
  currentUserId,
  onToast,
  onViewMedia,
}: {
  docs: ReviewDoc[];
  onApprove: (doc: ReviewDoc) => void;
  approving: string | null;
  isAdmin: boolean;
  currentUserId: string;
  onToast: (m: string) => void;
  onViewMedia: (url: string, title: string) => void;
}) {
  const router = useRouter();
  if (docs.length === 0)
    return (
      <div className="mb-12 anim-fade-in p-8 text-center border border-dashed border-[var(--border-med)] bg-[var(--bg-deep)]">
        <ShieldCheck size={32} className="mx-auto mb-3 opacity-20" />
        <p className="text-sm font-medium text-[var(--text-4)] italic">
          No documents currently awaiting review.
        </p>
      </div>
    );

  return (
    <div className="mb-12 anim-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-500/10 flex items-center justify-center">
            <ShieldCheck size={20} className="text-amber-500" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[var(--text)]">
              Review Queue
            </h2>
            <p className="text-xs text-[var(--text-4)] uppercase tracking-widest font-bold">
              Administrator approval required
            </p>
          </div>
        </div>
        <span className="db-status review px-3 py-1 text-[10px] font-black">
          {docs.length} PENDING
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {docs.map((doc) => {
          const isAuthor = doc.author?.id === currentUserId;
          const isSelfAssignedTask =
            doc.type === "tasks" &&
            doc.assigned_by === currentUserId &&
            isAuthor;
          const cannotApprove = isAuthor && !isSelfAssignedTask;

          const Icon =
            doc.type === "blogs"
              ? BookOpen
              : doc.type === "survivor_stories"
                ? Heart
                : doc.type === "tasks"
                  ? Briefcase
                  : FileText;
          const color =
            doc.type === "blogs"
              ? "text-[#9875c1]"
              : doc.type === "survivor_stories"
                ? "text-[#10b981]"
                : doc.type === "tasks"
                  ? "text-amber-500"
                  : "text-[#3b82f6]";
          const bg =
            doc.type === "blogs"
              ? "bg-[#9875c118]"
              : doc.type === "survivor_stories"
                ? "bg-[#10b98118]"
                : doc.type === "tasks"
                  ? "bg-amber-500/10"
                  : "bg-[#3b82f618]";

          return (
            <div
              key={doc.id}
              className="db-card p-5 border border-[var(--border-med)] flex flex-col gap-4 group"
            >
              <div className="flex items-start justify-between gap-3">
                <div
                  className={`w-9 h-9 flex items-center justify-center flex-shrink-0 ${bg}`}
                >
                  <Icon size={18} className={color} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4
                    className="text-sm font-bold text-[var(--text)] mb-0.5 truncate group-hover:text-[var(--accent)] cursor-pointer"
                    onClick={() => {
                      if (doc.type === "tasks" && doc.submission_media_url) {
                        onViewMedia(doc.submission_media_url, doc.title);
                      } else if (doc.type !== "tasks") {
                        router.push(`/editor?id=${doc.id}&type=${doc.type}`);
                      }
                    }}
                  >
                    {doc.title}
                  </h4>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-[var(--text-4)] font-bold uppercase tracking-tight">
                      {doc.type.replace("_", " ")}
                    </span>
                    <span className="text-[10px] text-[var(--text-4)] opacity-50">
                      •
                    </span>
                    <span className="text-[10px] text-[var(--text-4)] font-medium">
                      {new Date(doc.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 px-3 py-2 bg-[var(--bg-deep)] border border-[var(--border-med)]">
                {doc.author?.avatar_url ? (
                  <img
                    src={doc.author.avatar_url}
                    alt={doc.author.name || ""}
                    className="w-[20px] h-[20px] rounded-full object-cover"
                  />
                ) : (
                  <div className="w-[20px] h-[20px] bg-[var(--accent-subtle)] flex items-center justify-center text-[8px] font-bold text-[var(--accent)] rounded-full">
                    {doc.author?.name?.[0] || "U"}
                  </div>
                )}
                <span className="text-[10px] text-[var(--text-3)] font-black uppercase tracking-tighter">
                  By {doc.author?.name || "Unknown"}
                </span>
              </div>

              <div className="flex items-center gap-2 mt-auto pt-2">
                <button
                  onClick={() => {
                    if (doc.type === "tasks" && doc.submission_media_url) {
                      onViewMedia(doc.submission_media_url, doc.title);
                    } else if (doc.type !== "tasks") {
                      router.push(`/editor?id=${doc.id}&type=${doc.type}`);
                    }
                  }}
                  disabled={doc.type === "tasks" && !doc.submission_media_url}
                  className="flex-1 db-ghost py-2"
                >
                  <div className="flex items-center gap-1.5 justify-center">
                    <Eye size={12} />
                    View
                  </div>
                </button>
                <button
                  onClick={() => onApprove(doc)}
                  disabled={approving === doc.id || cannotApprove}
                  title={
                    cannotApprove
                      ? "You cannot approve your own work"
                      : "Approve and Publish"
                  }
                  className={`flex-1 db-btn py-2 bg-green-500/10 hover:bg-green-500 text-green-500 hover:text-white border border-green-500/20 ${cannotApprove ? "opacity-30 grayscale cursor-not-allowed" : ""}`}
                  style={{ clipPath: "none" }}
                >
                  <div className="flex items-center gap-1.5 justify-center">
                    {approving === doc.id ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <ShieldCheck size={12} />
                    )}
                    Approve
                  </div>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ProofreaderQueue({
  docs,
  currentUserId,
  onToast,
}: {
  docs: ReviewDoc[];
  currentUserId: string;
  onToast: (m: string) => void;
}) {
  const router = useRouter();
  if (docs.length === 0)
    return (
      <div className="mb-12 anim-fade-in p-8 text-center border border-dashed border-[var(--border-med)] bg-[var(--bg-deep)]">
        <PenTool size={32} className="mx-auto mb-3 opacity-20" />
        <p className="text-sm font-medium text-[var(--text-4)] italic">
          No articles currently assigned for proofreading.
        </p>
      </div>
    );

  return (
    <div className="mb-12 anim-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-500/10 flex items-center justify-center">
            <PenTool size={20} className="text-purple-500" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[var(--text)]">
              Proofreading Queue
            </h2>
            <p className="text-xs text-[var(--text-4)] uppercase tracking-widest font-bold">
              Assigned editorial reviews
            </p>
          </div>
        </div>
        <span className="db-status proof px-3 py-1 text-[10px] font-black">
          {docs.length} ASSIGNED
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {docs.map((doc) => {
          const Icon =
            doc.type === "blogs"
              ? BookOpen
              : doc.type === "survivor_stories"
                ? Heart
                : FileText;
          const color =
            doc.type === "blogs"
              ? "text-[#9875c1]"
              : doc.type === "survivor_stories"
                ? "text-[#10b981]"
                : "text-[#3b82f6]";
          const bg =
            doc.type === "blogs"
              ? "bg-[#9875c118]"
              : doc.type === "survivor_stories"
                ? "bg-[#10b98118]"
                : "bg-[#3b82f618]";

          return (
            <div
              key={doc.id}
              className="db-card p-5 border border-[var(--border-med)] flex flex-col gap-4 group"
            >
              <div className="flex items-start justify-between gap-3">
                <div
                  className={`w-9 h-9 flex items-center justify-center flex-shrink-0 ${bg}`}
                >
                  <Icon size={18} className={color} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4
                    className="text-sm font-bold text-[var(--text)] mb-0.5 truncate group-hover:text-[var(--accent)] cursor-pointer"
                    onClick={() => {
                      router.push(`/editor?id=${doc.id}&type=${doc.type}`);
                    }}
                  >
                    {doc.title}
                  </h4>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-[var(--text-4)] font-bold uppercase tracking-tight">
                      {doc.type.replace("_", " ")}
                    </span>
                    <span className="text-[10px] text-[var(--text-4)] opacity-50">
                      •
                    </span>
                    <span className="text-[10px] text-[var(--text-4)] font-medium">
                      By {doc.author?.name || "Unknown"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-auto pt-2">
                <button
                  onClick={() =>
                    router.push(`/editor?id=${doc.id}&type=${doc.type}`)
                  }
                  className="flex-1 db-btn py-2 bg-purple-500/10 hover:bg-purple-500 text-purple-500 hover:text-white border border-purple-500/20"
                  style={{ clipPath: "none" }}
                >
                  <div className="flex items-center gap-1.5 justify-center">
                    <PenTool size={12} />
                    Start Proofreading
                  </div>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AssignmentQueue({
  docs,
  onAssign,
  assigning,
  isAdmin,
  onToast,
}: {
  docs: ReviewDoc[];
  onAssign: (docId: string, type: string, proofreaderId: string) => void;
  assigning: string | null;
  isAdmin: boolean;
  onToast: (m: string) => void;
}) {
  if (docs.length === 0)
    return (
      <div className="mb-12 anim-fade-in p-8 text-center border border-dashed border-[var(--border-med)] bg-[var(--bg-deep)]">
        <User size={32} className="mx-auto mb-3 opacity-20" />
        <p className="text-sm font-medium text-[var(--text-4)] italic">
          No articles currently awaiting proofreader assignment.
        </p>
      </div>
    );

  return (
    <div className="mb-12 anim-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-500/10 flex items-center justify-center">
            <User size={20} className="text-indigo-500" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[var(--text)]">
              Assignment Queue
            </h2>
            <p className="text-xs text-[var(--text-4)] uppercase tracking-widest font-bold">
              Awaiting proofreader dispatch
            </p>
          </div>
        </div>
        <span className="db-status todo px-3 py-1 text-[10px] font-black">
          {docs.length} AWAITING
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {docs.map((doc) => {
          const Icon =
            doc.type === "blogs"
              ? BookOpen
              : doc.type === "survivor_stories"
                ? Heart
                : FileText;
          const color =
            doc.type === "blogs"
              ? "text-[#9875c1]"
              : doc.type === "survivor_stories"
                ? "text-[#10b981]"
                : "text-[#3b82f6]";
          const bg =
            doc.type === "blogs"
              ? "bg-[#9875c118]"
              : doc.type === "survivor_stories"
                ? "bg-[#10b98118]"
                : "bg-[#3b82f618]";

          return (
            <div
              key={doc.id}
              className="db-card p-5 border border-[var(--border-med)] flex flex-col gap-4 group"
            >
              <div className="flex items-start justify-between gap-3">
                <div
                  className={`w-9 h-9 flex items-center justify-center flex-shrink-0 ${bg}`}
                >
                  <Icon size={18} className={color} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-[var(--text)] mb-0.5 truncate group-hover:text-[var(--accent)]">
                    {doc.title}
                  </h4>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-[var(--text-4)] font-bold uppercase tracking-tight">
                      {doc.type.replace("_", " ")}
                    </span>
                    <span className="text-[10px] text-[var(--text-4)] opacity-50">
                      •
                    </span>
                    <span className="text-[10px] text-[var(--text-4)] font-medium">
                      By {doc.author?.name || "Unknown"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2.5 mt-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-4)] opacity-60">
                  Dispatch Proofreader
                </p>
                <MultiPersonSelect
                  selectedIds={[]}
                  onChange={(ids) =>
                    ids[0] && onAssign(doc.id, doc.type as string, ids[0])
                  }
                  maxSelections={1}
                  placeholder="Select member..."
                />
              </div>

              {assigning === doc.id && (
                <div className="flex items-center justify-center gap-2 py-1 text-[10px] text-[var(--accent)] font-bold animate-pulse">
                  <Loader2 size={10} className="animate-spin" />
                  Assigning...
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function QueuesPage() {
  const router = useRouter();
  const { user, loading: loadingUser } = useUser();
  const [reviewDocs, setReviewDocs] = useState<ReviewDoc[]>([]);
  const [proofreaderDocs, setProofreaderDocs] = useState<ReviewDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<string | null>(null);
  const [activeDeptKey, setActiveDeptKey] = useState("Leadership");
  const { isDark, toggleTheme } = useTheme();
  const [toast, setToast] = useState<string | null>(null);
  const [viewingMedia, setViewingMedia] = useState<{
    url: string;
    title: string;
  } | null>(null);
  const [assigningProofreader, setAssigningProofreader] = useState<
    string | null
  >(null);
  const [counts, setCounts] = useState<{ articles: number; blogs: number }>({
    articles: 0,
    blogs: 0,
  });
  const [starredDocs, setStarredDocs] = useState<any[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const {
    notifications: notifs,
    unreadCount,
    markAllRead: handleMarkAllRead,
  } = useNotifications();

  const fetchWork = useCallback(async () => {
    setLoading(true);
    try {
      if (user?.admin_access) {
        const reviewRes = await fetch("/api/tasks/review-queue");
        if (reviewRes.ok) {
          const data = await reviewRes.json();
          setReviewDocs(data.documents || []);
        }
      }

      // Always check for proofreader assignments for anyone
      const proofreaderRes = await fetch("/api/tasks/proofreader-queue");
      if (proofreaderRes.ok) {
        const data = await proofreaderRes.json();
        setProofreaderDocs(data.documents || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user?.admin_access]);

  useEffect(() => {
    if (!loadingUser && user === null) {
      router.push("/login");
    }
  }, [user, loadingUser, router]);

  useEffect(() => {
    const s = loadSettings();
    applySettings(s);
    if (user !== undefined) fetchWork();

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
  }, [user, fetchWork]);

  const handleApprove = async (doc: ReviewDoc) => {
    setApproving(doc.id);
    try {
      let res;
      if (doc.type === "tasks") {
        res = await fetch("/api/tasks/tasks/approve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: doc.id, status: "done" }),
        });
      } else {
        res = await fetch("/api/editor/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: doc.id,
            title: doc.title,
            slug:
              (doc as any).slug || doc.title.toLowerCase().replace(/\s+/g, "-"),
            content: (doc as any).content || "",
            contentType: doc.type,
            status: "published",
            author_id: doc.author?.id,
          }),
        });
      }

      if (res.ok) {
        setToast(
          doc.type === "tasks"
            ? "Task approved and published"
            : "Document approved and published",
        );
        setReviewDocs((prev) => prev.filter((d) => d.id !== doc.id));
      } else {
        const data = await res.json();
        setToast(data.error || "Failed to approve");
      }
    } catch (err) {
      setToast("An error occurred during approval");
    } finally {
      setApproving(null);
    }
  };

  const handleAssignProofreader = async (
    docId: string,
    type: string,
    proofreaderId: string,
  ) => {
    setAssigningProofreader(docId);
    try {
      const res = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: docId,
          status: "proofreading",
          proofreader_id: proofreaderId,
          type: type,
        }),
      });

      if (res.ok) {
        await fetch("/api/tasks/comments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            taskId: docId,
            content: "Proofreader assigned via queues dashboard.",
            type: "status_change",
          }),
        });

        setToast("Proofreader assigned successfully");
        setReviewDocs((prev) =>
          prev.map((d) =>
            d.id === docId ? { ...d, status: "proofreading" as any } : d,
          ),
        );
        fetchWork();
      } else {
        const data = await res.json();
        setToast(data.error || "Failed to assign proofreader");
      }
    } catch (err) {
      setToast("An error occurred");
    } finally {
      setAssigningProofreader(null);
    }
  };

  const isAdmin = !!user?.admin_access;

  return (
    <div className={`db-root ${isDark ? "dark" : ""}`}>
      {/* ── HEADER — using PageHeader component ─────────────────────────────── */}
      <PageHeader
        pageTitle="Queues"
        hideSearch={true}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        <Sidebar
          activeNav="queues"
          isFullSidebar={true}
          counts={{
            articles: counts.articles,
            blogs: counts.blogs,
            tasks: 0, // Not relevant for this page's indicator
          }}
          starredDocs={starredDocs}
          onNavClick={(id) => {
            if (id === "home") router.push("/");
            if (id === "articles") router.push("/");
            if (id === "blogs") router.push("/");
          }}
        />

        <main className="db-main pb-24 sm:pb-8">
          <div className="max-w-6xl mx-auto">
            <div className="mb-10 anim-fade-in">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b-2 border-[var(--ink)]">
                <div>
                  <p className="db-page-sub mb-1">
                    Administrative · Control Center
                  </p>
                  <h1 className="db-page-title text-3xl font-black italic">
                    EDITORIAL <em>QUEUES</em>
                  </h1>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--accent-sub)] border border-[var(--rule)]">
                    <span className="db-cap text-[var(--accent)] font-black">
                      {reviewDocs.length + proofreaderDocs.length}
                    </span>
                    <span className="db-cap font-bold">Items Flagged</span>
                  </div>
                </div>
              </div>
              <div className="h-px bg-[var(--rule)] mt-1 opacity-50" />
            </div>

            {loading ? (
              <div className="py-24 flex flex-col items-center justify-center gap-5 text-[var(--text-4)]">
                <div className="w-10 h-10 border-2 border-[var(--accent)] border-t-transparent animate-spin" />
                <span className="db-cap font-bold tracking-widest">
                  Hydrating Queues...
                </span>
              </div>
            ) : (
              <div className="space-y-4">
                {isAdmin && (
                  <>
                    <AssignmentQueue
                      docs={reviewDocs.filter(
                        (d) => d.status === "ready_for_proofreading",
                      )}
                      onAssign={handleAssignProofreader}
                      assigning={assigningProofreader}
                      isAdmin={isAdmin}
                      onToast={setToast}
                    />
                    <ReviewQueue
                      docs={reviewDocs.filter(
                        (d) => d.status !== "ready_for_proofreading",
                      )}
                      onApprove={handleApprove}
                      approving={approving}
                      isAdmin={isAdmin}
                      currentUserId={user?.id || ""}
                      onToast={setToast}
                      onViewMedia={(url, title) =>
                        setViewingMedia({ url, title })
                      }
                    />
                  </>
                )}

                <ProofreaderQueue
                  docs={proofreaderDocs}
                  currentUserId={user?.id || ""}
                  onToast={setToast}
                />
              </div>
            )}
          </div>
        </main>
      </div>

      {viewingMedia !== null && (
        <MediaViewerModal
          url={viewingMedia.url}
          title={viewingMedia.title}
          onClose={() => setViewingMedia(null)}
        />
      )}

      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}

      <Suspense fallback={null}>
        <MobileNav
          activeNav="queues"
          pendingTasksCount={0}
          isFullSidebar={true}
        />
      </Suspense>
    </div>
  );
}