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
  Users,
  Mail,
  Shield,
  Search,
  Github,
  Linkedin,
  Plus,
  Sun,
  Moon,
  Settings,
  Bell,
  ChevronDown,
  Check,
  Menu,
  X,
} from "lucide-react";
import { useUser } from "@/lib/useUser";
import { createPortal } from "react-dom";
import PageHeader from "@/components/PageHeader";
import AccountMenu from "@/components/AccountMenu";
import MobileNav from "@/components/MobileNav";
import { Sidebar } from "@/components/Sidebar";
import { Notif } from "@/components/NotifPanel";
import AssignTaskModal from "@/components/AssignTaskModal";
import Toast from "@/components/Toast";
import SettingsModal, {
  loadSettings,
  saveSettings,
  applySettings,
  type AppSettings,
} from "@/components/SettingsModal";
import { ApplicationsDashboard } from "@/components/ApplicationsDashboard";
import InviteUserModal from "../../components/InviteUserModal";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  username: string;
  avatar_url: string | null;
  position: string;
  department: string;
  is_active: boolean;
  admin_access: boolean;
}

const DEPARTMENTS = [
  "Leadership",
  "Writers' Block",
  "Public Relations",
  "Design Lab",
  "Development",
  "Other",
];

const DEPT_NUM: Record<string, string> = {
  Leadership: "01",
  "Writers' Block": "02",
  "Public Relations": "03",
  "Design Lab": "04",
  Development: "05",
  Other: "06",
};

const TAPE_ITEMS = [
  "THE CARCINO FOUNDATION",
  "TEAM",
  "LEADERSHIP",
  "WRITERS",
  "DESIGN",
  "DEVELOPMENT",
  "PR",
  "RESEARCH",
];

export default function TeamPage() {
  const router = useRouter();
  const { user: currentUser, loading: userLoading } = useUser();
  const { isDark, toggleTheme } = useTheme();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());

  const [filter, setFilter] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      return params.get("filter") || "all";
    }
    return "all";
  });
  const [search, setSearch] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState<TeamMember | null>(
    null,
  );
  const [showInviteModal, setShowInviteModal] = useState(false);

  const [toast, setToast] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [counts, setCounts] = useState<{
    articles: number;
    blogs: number;
    tasks: number;
  }>({ articles: 0, blogs: 0, tasks: 0 });
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const unreadCount = notifs.filter((n) => !n.read).length;

  const handleMarkAllRead = useCallback(() => {
    setNotifs((ns) => ns.map((n) => ({ ...n, read: true })));
    setToast("All notifications read");
  }, []);

  useEffect(() => {
    if (!userLoading && !currentUser) router.push("/login");
  }, [currentUser, userLoading, router]);

  useEffect(() => {
    const s = loadSettings();
    setSettings(s);
    applySettings(s);
  }, []);

  useEffect(() => {
    if (filter) {
      const url = new URL(window.location.href);
      url.searchParams.set("filter", filter);
      window.history.replaceState({}, "", url.toString());
    }
  }, [filter]);

  useEffect(() => {
    (async () => {
      try {
        const [teamRes, docsRes, tasksRes] = await Promise.all([
          fetch("/api/team"),
          fetch("/api/documents"),
          fetch("/api/tasks"),
        ]);

        if (teamRes.ok) {
          const data = await teamRes.json();
          setMembers(data.users);
        }

        if (docsRes.ok) {
          const data = await docsRes.json();
          const docs = data.documents || [];
          setCounts((c) => ({
            ...c,
            articles: docs.filter(
              (d: any) =>
                d.type === "cancer_docs" || d.type === "survivor_stories",
            ).length,
            blogs: docs.filter((d: any) => d.type === "blogs").length,
          }));
        }

        if (tasksRes.ok) {
          const data = await tasksRes.json();
          setCounts((c) => ({
            ...c,
            tasks: (data.assignments || []).filter(
              (t: any) => t.status !== "done",
            ).length,
          }));
        }
      } catch {
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filteredMembers = members.filter((m) => {
    let ok = true;
    if (filter === "admin") ok = m.admin_access;
    else if (filter !== "all") ok = m.department === filter;
    const q = search.toLowerCase();
    return (
      ok &&
      (!q ||
        m.name.toLowerCase().includes(q) ||
        m.email?.toLowerCase().includes(q) ||
        m.username.toLowerCase().includes(q) ||
        m.department?.toLowerCase().includes(q))
    );
  });

  const groupedMembers = DEPARTMENTS.reduce<Record<string, TeamMember[]>>(
    (acc, dept) => {
      const list = filteredMembers.filter((m) => {
        const d = m.department || "Other";
        if (dept === "Other") return !DEPARTMENTS.slice(0, -1).includes(d);
        return d === dept;
      });
      if (list.length > 0) acc[dept] = list;
      return acc;
    },
    {},
  );

  const totalShown = Object.values(groupedMembers).flat().length;

  return (
    <div className={`db-root${isDark ? " dark" : ""}`}>
      {/* ── HEADER — using PageHeader component ─────────────────────────────── */}
      <PageHeader
        pageTitle="Team"
        hideSearch={true}
        user={currentUser}
        isDark={isDark}
        onToggleTheme={toggleTheme}
        onOpenSettings={() => setShowSettings(true)}
        notifs={notifs}
        unreadCount={unreadCount}
        onMarkAllRead={handleMarkAllRead}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      >
        {/* Custom search input for Team page */}
        <div
          className="hidden md:flex"
          style={{
            position: "relative",
            flex: 1,
            maxWidth: 320,
            alignItems: "center",
          }}
        >
          <Search
            size={11}
            style={{
              position: "absolute",
              left: 10,
              color: "var(--mid)",
              pointerEvents: "none",
            }}
          />
          <input
            type="text"
            placeholder="Search name, email, dept…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              background: "transparent",
              border: "1px solid var(--rule)",
              padding: "5px 10px 5px 28px",
              fontFamily: "var(--ff-mono)",
              fontSize: 10,
              letterSpacing: "0.04em",
              color: "var(--ink)",
              outline: "none",
              transition: "border-color 0.15s",
            }}
            onFocus={(e) =>
              (e.currentTarget.style.borderColor = "var(--accent)")
            }
            onBlur={(e) => (e.currentTarget.style.borderColor = "var(--rule)")}
          />
        </div>
      </PageHeader>

      {/* Mobile menu panel */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-[42px] bg-[var(--paper)] border-b border-[var(--rule)] z-40 p-4 space-y-4 max-h-[calc(100vh-42px)] overflow-y-auto anim-fade-in">
          <div className="space-y-4">
            <div className="space-y-2">
              <span className="db-cap block">Search Team</span>
              <div className="relative flex items-center">
                <Search
                  size={12}
                  style={{
                    position: "absolute",
                    left: 10,
                    color: "var(--mid)",
                    pointerEvents: "none",
                  }}
                />
                <input
                  type="text"
                  placeholder="name, email, dept…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="db-inp w-full"
                  style={{ paddingLeft: 30, fontSize: 11 }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 border-t border-[var(--rule)] pt-4">
              <button
                className="db-ghost justify-center text-xs py-2"
                onClick={() => {
                  toggleTheme();
                }}
              >
                {isDark ? (
                  <Sun size={14} className="mr-2" />
                ) : (
                  <Moon size={14} className="mr-2" />
                )}
                {isDark ? "Light" : "Dark"}
              </button>
              <button
                className="db-ghost justify-center text-xs py-2"
                onClick={() => {
                  setShowSettings(true);
                  setMobileMenuOpen(false);
                }}
              >
                <Settings size={14} className="mr-2" /> Settings
              </button>
              <button
                className="db-ghost justify-center text-xs py-2"
                onClick={() => {
                  setMobileMenuOpen(false);
                }}
              >
                <Bell size={14} className="mr-2" /> Notifs
              </button>
              {unreadCount > 0 && (
                <button
                  className="db-ghost justify-center text-xs py-2"
                  onClick={() => {
                    handleMarkAllRead();
                    setMobileMenuOpen(false);
                  }}
                >
                  <Check size={14} className="mr-2" /> Clear All
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      {/* ── END HEADER ──────────────────────────────────────────────────────── */}

      {/* Body */}
      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        <Sidebar
          activeNav="team"
          counts={counts}
          isFullSidebar={
            currentUser?.department === "Leadership" ||
            currentUser?.department === "Writers' Block"
          }
        >
          <div className="db-sidebar-rule" />
          <div className="db-sidebar-label">Team Filters</div>

          {[
            { key: "all", label: `All Members` },
            { key: "admin", label: "Admins" },
          ].map((f) => (
            <button
              key={f.key}
              className={`db-nav-item${filter === f.key ? " active" : ""}`}
              onClick={() => setFilter(f.key)}
            >
              <span className="db-nav-num">
                {f.key === "all" ? "—" : <Shield size={9} />}
              </span>
              <span style={{ flex: 1 }}>{f.label}</span>
            </button>
          ))}

          {currentUser?.department === "Leadership" && (
            <>
              <div className="db-sidebar-rule" />
              <div className="db-sidebar-label">Recruitment</div>
              <button
                className={`db-nav-item${filter === "applications" ? " active" : ""}`}
                onClick={() => setFilter("applications")}
              >
                <span className="db-nav-num">00</span>
                <span style={{ flex: 1 }}>Applications</span>
              </button>
            </>
          )}

          <div className="db-sidebar-rule" />
          <div className="db-sidebar-label">Departments</div>

          {DEPARTMENTS.filter((d) => d !== "Other").map((dept) => {
            const count = members.filter((m) => m.department === dept).length;
            return (
              <button
                key={dept}
                className={`db-nav-item${filter === dept ? " active" : ""}`}
                onClick={() => setFilter(dept)}
              >
                <span
                  className="db-nav-num"
                  style={{
                    fontStyle: "italic",
                    fontFamily: "var(--ff-display)",
                  }}
                >
                  {DEPT_NUM[dept]}
                </span>
                <span style={{ flex: 1 }}>{dept}</span>
                {count > 0 && (
                  <span
                    style={{
                      fontFamily: "var(--ff-mono)",
                      fontSize: 8,
                      background:
                        filter === dept ? "var(--accent)" : "var(--accent-dim)",
                      color: filter === dept ? "var(--paper)" : "var(--mid)",
                      padding: "1px 5px",
                      letterSpacing: "0.08em",
                    }}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </Sidebar>

        {/* Main */}
        <main className="db-main">
          {/* Page title */}
          <div className="db-rise-0" style={{ marginBottom: 6 }}>
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <div>
                <h1 className="db-page-title">
                  {filter === "applications" ? "Applications" : "Team"}
                  <em>.</em>
                </h1>
                <p className="db-page-sub" style={{ marginTop: 6 }}>
                  {filter === "applications"
                    ? "Global Recruitment Bureau — Internship Responses"
                    : `${totalShown} member${totalShown !== 1 ? "s" : ""} — The Carcino Foundation`}
                </p>
              </div>
              {currentUser?.department === "Leadership" && (
                <button
                  className="db-btn"
                  onClick={() => setShowInviteModal(true)}
                >
                  <Plus size={10} strokeWidth={2.2} />
                  <span className="hidden sm:inline">Invite</span>
                </button>
              )}
            </div>
          </div>
          <hr className="db-triple-rule" />

          {/* Filter bar */}
          <div
            className="db-filter-bar db-rise-1"
            style={{
              display: "flex",
              overflowX: "auto",
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              WebkitOverflowScrolling: "touch",
              gap: 0,
              flexWrap: "nowrap",
              border: "1px solid var(--rule)",
            }}
          >
            {[
              { k: "all", l: `All (${members.length})` },
              { k: "admin", l: "Admins" },
              ...(currentUser?.department === "Leadership"
                ? [{ k: "applications", l: "Applications" }]
                : []),
              ...DEPARTMENTS.filter((d) => d !== "Other").map((d) => ({
                k: d,
                l: d,
              })),
            ].map((f) => (
              <button
                key={f.k}
                className={`db-filter-btn${filter === f.k ? " active" : ""}`}
                onClick={() => setFilter(f.k)}
                style={{
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                  borderRight: "1px solid var(--rule)",
                  borderBottom: "none",
                }}
              >
                {f.l}
              </button>
            ))}
          </div>

          {/* Members */}
          {loading ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 0,
                border: "1px solid var(--rule)",
                borderBottom: "none",
              }}
            >
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    height: 64,
                    borderBottom: "1px solid var(--rule)",
                    background:
                      i % 2 === 0 ? "transparent" : "var(--accent-sub)",
                    opacity: 0.5,
                  }}
                />
              ))}
            </div>
          ) : filter === "applications" ? (
            <ApplicationsDashboard />
          ) : totalShown === 0 ? (
            <div
              style={{
                padding: "48px 0",
                textAlign: "center",
                border: "1px solid var(--rule)",
              }}
            >
              <Users
                size={28}
                style={{ color: "var(--mid)", margin: "0 auto 12px" }}
              />
              <p
                style={{
                  fontFamily: "var(--ff-mono)",
                  fontSize: 10,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "var(--mid)",
                }}
              >
                No members found
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
              {Object.entries(groupedMembers).map(([dept, deptMembers], si) => (
                <section
                  key={dept}
                  className="db-rise-1"
                  style={{ animationDelay: `${si * 0.06}s` }}
                >
                  {/* Dept header */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 16,
                      marginBottom: 14,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--ff-display)",
                        fontStyle: "italic",
                        fontSize: 11,
                        color: "var(--accent)",
                        width: 22,
                        flexShrink: 0,
                      }}
                    >
                      {DEPT_NUM[dept] || String(si + 1).padStart(2, "0")}
                    </span>
                    <span
                      className="db-cap"
                      style={{
                        color: "var(--ink)",
                        letterSpacing: "0.2em",
                        fontSize: 9,
                      }}
                    >
                      {dept}
                    </span>
                    <div
                      style={{ flex: 1, height: 1, background: "var(--rule)" }}
                    />
                    <span
                      style={{
                        fontFamily: "var(--ff-mono)",
                        fontSize: 8,
                        fontWeight: 700,
                        letterSpacing: "0.12em",
                        background: "var(--accent)",
                        color: "var(--paper)",
                        padding: "1px 7px",
                      }}
                    >
                      {deptMembers.length}
                    </span>
                  </div>

                  {/* Members list */}
                  <div
                    style={{
                      border: "1px solid var(--rule)",
                      borderBottom: "none",
                    }}
                  >
                    {deptMembers.map((member) => (
                      <div
                        key={member.id}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          padding: "14px 18px",
                          borderBottom: "1px solid var(--rule)",
                          transition: "background 0.12s",
                          background: "transparent",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background =
                            "var(--accent-sub)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "transparent")
                        }
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: 12,
                            marginBottom: 12,
                          }}
                        >
                          <div style={{ position: "relative", flexShrink: 0 }}>
                            <div
                              style={{
                                width: 40,
                                height: 40,
                                overflow: "hidden",
                                border: "1px solid var(--rule)",
                              }}
                            >
                              {member.avatar_url ? (
                                <Image
                                  src={member.avatar_url}
                                  alt={member.name}
                                  width={40}
                                  height={40}
                                  style={{
                                    objectFit: "cover",
                                    width: "100%",
                                    height: "100%",
                                  }}
                                />
                              ) : (
                                <div
                                  style={{
                                    width: "100%",
                                    height: "100%",
                                    background: "var(--accent-dim)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontFamily: "var(--ff-display)",
                                    fontWeight: 700,
                                    fontSize: 14,
                                    color: "var(--accent)",
                                  }}
                                >
                                  {member.name
                                    ?.split(" ")
                                    .map((n) => n[0])
                                    .join("")
                                    .slice(0, 2) || "?"}
                                </div>
                              )}
                            </div>
                            {member.admin_access && (
                              <div
                                style={{
                                  position: "absolute",
                                  bottom: -3,
                                  right: -3,
                                  background: "var(--accent)",
                                  width: 14,
                                  height: 14,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                                title="Admin"
                              >
                                <Shield
                                  size={8}
                                  style={{ color: "var(--paper)" }}
                                />
                              </div>
                            )}
                          </div>

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                marginBottom: 3,
                                flexWrap: "wrap",
                              }}
                            >
                              <span
                                style={{
                                  fontFamily: "var(--ff-display)",
                                  fontSize: 13.5,
                                  fontWeight: 700,
                                  letterSpacing: "-0.01em",
                                  color: "var(--ink)",
                                }}
                              >
                                {member.name}
                              </span>
                              {member.admin_access && (
                                <span
                                  className="db-status"
                                  style={{
                                    color: "var(--accent)",
                                    background: "var(--accent-sub)",
                                    border: "1px solid var(--accent)",
                                    fontSize: 7,
                                    letterSpacing: "0.14em",
                                    padding: "1px 5px",
                                  }}
                                >
                                  Admin
                                </span>
                              )}
                              <span
                                style={{
                                  width: 4,
                                  height: 4,
                                  background: member.is_active
                                    ? "#3e9a5e"
                                    : "var(--mid)",
                                  flexShrink: 0,
                                }}
                                title={member.is_active ? "Active" : "Inactive"}
                              />
                            </div>
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 4,
                              }}
                            >
                              <span
                                style={{
                                  fontFamily: "var(--ff-mono)",
                                  fontSize: 9.5,
                                  color: "var(--mid)",
                                  letterSpacing: "0.04em",
                                }}
                              >
                                {member.position || "Contributor"}
                              </span>
                              <span
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 4,
                                  fontFamily: "var(--ff-mono)",
                                  fontSize: 9,
                                  color: "var(--mid)",
                                }}
                              >
                                <Mail size={9} strokeWidth={1.6} />
                                {member.email ||
                                  `${member.username}@carcino.work`}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            paddingTop: 12,
                            borderTop: "1px solid var(--rule)",
                            marginTop: "auto",
                          }}
                        >
                          <a
                            href={`https://github.com/${member.username}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="db-ghost"
                            style={{
                              padding: "6px 10px",
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                            }}
                            title="GitHub"
                          >
                            <Github size={12} strokeWidth={1.8} />
                            <span style={{ fontSize: 9 }}>GitHub</span>
                          </a>
                          <a
                            href={`https://linkedin.com/in/${member.username}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="db-ghost"
                            style={{
                              padding: "6px 10px",
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                            }}
                            title="LinkedIn"
                          >
                            <Linkedin size={12} strokeWidth={1.8} />
                            <span style={{ fontSize: 9 }}>LinkedIn</span>
                          </a>
                          {currentUser?.admin_access && (
                            <button
                              className="db-btn"
                              style={{
                                padding: "6px 12px",
                                fontSize: 8,
                                marginLeft: "auto",
                              }}
                              onClick={() => setShowAssignModal(member)}
                            >
                              <Plus size={9} />
                              <span>Assign</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </main>
      </div>

      <Suspense fallback={null}>
        <MobileNav
          activeNav="team"
          pendingTasksCount={counts.tasks}
          isFullSidebar={
            currentUser?.department === "Leadership" ||
            currentUser?.department === "Writers' Block"
          }
        />
      </Suspense>

      {/* Overlays */}
      {showSettings && (
        <SettingsModal
          settings={settings}
          onClose={() => setShowSettings(false)}
          onChange={(next) => {
            setSettings(next);
            saveSettings(next);
            applySettings(next);
          }}
        />
      )}
      {showAssignModal && (
        <AssignTaskModal
          member={showAssignModal}
          onClose={() => setShowAssignModal(null)}
          onSuccess={() => {
            setShowAssignModal(null);
            setToast("Task assigned successfully");
          }}
        />
      )}
      {showInviteModal && (
        <InviteUserModal
          onClose={() => setShowInviteModal(false)}
          onSuccess={(u: TeamMember) => {
            setShowInviteModal(false);
            setToast(`User ${u.name} invited successfully`);
            setMembers((prev) =>
              [...prev, u].sort((a, b) => a.name.localeCompare(b.name)),
            );
          }}
        />
      )}

      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </div>
  );
}