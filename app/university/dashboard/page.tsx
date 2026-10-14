"use client";

import React, { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  ArrowRight,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Clock3,
  Download,
  ExternalLink,
  FileCheck2,
  FileClock,
  FileSearch,
  FileText,
  Fingerprint,
  History,
  LayoutDashboard,
  Loader2,
  LockKeyhole,
  LogOut,
  Mail,
  Menu,
  RefreshCw,
  Search,
  School as SchoolIcon,
  Settings2,
  ShieldCheck,
  UsersRound,
  X,
  XCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast, Toaster } from "react-hot-toast";
import api from "@/lib/api";

type Section = "Overview" | "Verify student" | "Lookup history" | "Settings";
type DocumentStatus = "Pending" | "Verified" | "Rejected" | string;

interface UniversityProfile {
  _id?: string;
  name?: string;
  instituteName?: string;
  email?: string;
  phone?: string;
  role?: string;
  isApproved?: boolean;
  isActive?: boolean;
  rejectionRemarks?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

interface StudentDocument {
  _id?: string;
  title?: string;
  name?: string;
  status?: DocumentStatus;
  fileUrl?: string;
  url?: string;
  verifySlip?: string;
  verificationImg?: string;
  adminScreenshot?: string;
  adminSlip?: string;
  remarks?: string;
  comment?: string;
  adminNote?: string;
  createdAt?: string;
  verifiedAt?: string;
}

interface StudentRecord {
  fullName?: string;
  name?: string;
  email?: string;
  passportNumber: string;
  university?: string;
  profileStatus?: string;
  isAuthentic?: boolean;
  isSlipLinked?: boolean;
  documents?: StudentDocument[];
  remarks?: string;
  adminScreenshot?: string;
  verifySlip?: string;
  slipUrl?: string;
}

interface LookupActivity {
  _id: string;
  passportSuffix?: string;
  matched: boolean;
  documentCount?: number;
  verifiedCount?: number;
  pendingCount?: number;
  rejectedCount?: number;
  createdAt: string;
}

interface MonthlyActivity {
  key: string;
  label: string;
  total: number;
  matched: number;
  notFound: number;
}

interface MonthlyDocumentActivity {
  key: string;
  label: string;
  total: number;
  verified: number;
  pending: number;
  rejected: number;
}

interface OverviewData {
  stats: {
    totalLookups: number;
    matchedLookups: number;
    notFoundLookups: number;
    uniqueStudents: number;
    lookupsLast30Days: number;
    totalStudents: number;
    totalUniversities: number;
    approvedUniversities: number;
    totalDocuments: number;
    verifiedDocuments: number;
    pendingDocuments: number;
    rejectedDocuments: number;
  };
  monthlyActivity: MonthlyActivity[];
  platformMonthlyActivity: MonthlyDocumentActivity[];
  recentActivity: LookupActivity[];
}

interface HistoryResponse {
  items: LookupActivity[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface NavItem {
  label: Section;
  icon: LucideIcon;
  hint: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Overview", icon: LayoutDashboard, hint: "Your workspace" },
  { label: "Verify student", icon: FileSearch, hint: "Look up credentials" },
  { label: "Lookup history", icon: History, hint: "Your recent activity" },
  { label: "Settings", icon: Settings2, hint: "Institution & security" },
];

const EMPTY_OVERVIEW: OverviewData = {
  stats: {
    totalLookups: 0, matchedLookups: 0, notFoundLookups: 0, uniqueStudents: 0, lookupsLast30Days: 0,
    totalStudents: 0, totalUniversities: 0, approvedUniversities: 0, totalDocuments: 0,
    verifiedDocuments: 0, pendingDocuments: 0, rejectedDocuments: 0,
  },
  monthlyActivity: [],
  platformMonthlyActivity: [],
  recentActivity: [],
};

function getErrorMessage(error: unknown, fallback: string) {
  const e = error as { response?: { data?: { msg?: string; message?: string } } };
  return e?.response?.data?.msg || e?.response?.data?.message || fallback;
}

function formatNumber(value?: number) {
  return new Intl.NumberFormat("en-PK").format(value ?? 0);
}

function formatDate(value?: string, withTime = false) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", withTime
    ? { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }
    : { day: "2-digit", month: "short", year: "numeric" }
  ).format(date);
}

function getInitials(name?: string) {
  const value = (name || "University").trim();
  return value.split(/\s+/).slice(0, 2).map((part) => part[0] || "").join("").toUpperCase();
}

function normalizeDocumentStatus(status?: string): "verified" | "pending" | "rejected" {
  if (status === "Verified") return "verified";
  if (status === "Rejected") return "rejected";
  return "pending";
}

function safeExternalUrl(url?: string) {
  if (!url) return undefined;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed.href : undefined;
  } catch {
    return undefined;
  }
}

export default function UniversityDashboard() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<Section>("Overview");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [workspaceError, setWorkspaceError] = useState("");
  const [profile, setProfile] = useState<UniversityProfile | null>(null);
  const [overview, setOverview] = useState<OverviewData>(EMPTY_OVERVIEW);
  const [searchQuery, setSearchQuery] = useState("");
  const [student, setStudent] = useState<StudentRecord | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [history, setHistory] = useState<HistoryResponse | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [profileForm, setProfileForm] = useState({ phone: "" });
  const [profileSaving, setProfileSaving] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [passwordSaving, setPasswordSaving] = useState(false);

  const institutionName = profile?.instituteName || profile?.name || "Your university";
  const approvalLabel = profile?.isApproved ? "Approved account" : "Approval pending";

  const loadOverview = useCallback(async () => {
    const response = await api.get("/api/university/overview");
    setOverview({
      stats: { ...EMPTY_OVERVIEW.stats, ...(response.data?.stats || {}) },
      monthlyActivity: Array.isArray(response.data?.monthlyActivity) ? response.data.monthlyActivity : [],
      platformMonthlyActivity: Array.isArray(response.data?.platformMonthlyActivity) ? response.data.platformMonthlyActivity : [],
      recentActivity: Array.isArray(response.data?.recentActivity) ? response.data.recentActivity : [],
    });
  }, []);

  const loadHistory = useCallback(async (page = 1) => {
    setHistoryLoading(true);
    try {
      const response = await api.get(`/api/university/history?page=${page}&limit=20`);
      setHistory(response.data as HistoryResponse);
      setHistoryPage(response.data?.page || page);
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not load lookup history."));
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const loadWorkspace = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setInitialLoading(true);
    setWorkspaceError("");
    try {
      const [profileResponse, overviewResponse] = await Promise.all([
        api.get("/api/university/profile"),
        api.get("/api/university/overview"),
      ]);
      const nextProfile = profileResponse.data as UniversityProfile;
      setProfile(nextProfile);
      setProfileForm({ phone: nextProfile.phone || "" });
      setOverview({
        stats: { ...EMPTY_OVERVIEW.stats, ...(overviewResponse.data?.stats || {}) },
        monthlyActivity: Array.isArray(overviewResponse.data?.monthlyActivity) ? overviewResponse.data.monthlyActivity : [],
        platformMonthlyActivity: Array.isArray(overviewResponse.data?.platformMonthlyActivity) ? overviewResponse.data.platformMonthlyActivity : [],
        recentActivity: Array.isArray(overviewResponse.data?.recentActivity) ? overviewResponse.data.recentActivity : [],
      });
    } catch (error) {
      const message = getErrorMessage(error, "Could not load the university workspace. Please try again.");
      setWorkspaceError(message);
      toast.error(message);
      const typedError = error as { response?: { status?: number } };
      if (typedError.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.replace("/login/university");
      }
    } finally {
      setInitialLoading(false);
      setRefreshing(false);
    }
  }, [router]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    let account: { role?: string } = {};
    try {
      account = JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      account = {};
    }
    if (!token || account.role !== "university") {
      router.replace("/login/university");
      return;
    }
    setAuthReady(true);
  }, [router]);

  useEffect(() => {
    if (authReady) void loadWorkspace();
  }, [authReady, loadWorkspace]);

  useEffect(() => {
    if (activeSection === "Lookup history" && authReady) void loadHistory(1);
  }, [activeSection, authReady, loadHistory]);

  const navigate = useCallback((section: Section) => {
    setActiveSection(section);
    setMobileNavOpen(false);
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    toast.success("You have signed out securely.");
    router.replace("/login/university");
  }, [router]);

  const handleSearch = useCallback(async (event?: FormEvent) => {
    event?.preventDefault();
    const query = searchQuery.trim().toUpperCase();
    if (!query) {
      toast.error("Enter a passport number to search.");
      return;
    }
    setActiveSection("Verify student");
    setStudent(null);
    setSearchLoading(true);
    try {
      const response = await api.post("/api/university/search-student", { passportNumber: query });
      if (response.data?.success && response.data?.data) {
        setStudent(response.data.data as StudentRecord);
        toast.success("Student record retrieved.");
      } else {
        toast.error(response.data?.msg || "No matching student record was found.");
      }
    } catch (error) {
      toast.error(getErrorMessage(error, "The search could not be completed."));
    } finally {
      setSearchLoading(false);
      void loadOverview().catch(() => undefined);
      if (activeSection === "Lookup history") void loadHistory(1);
    }
  }, [activeSection, loadHistory, loadOverview, searchQuery]);

  const handleSaveProfile = useCallback(async (event: FormEvent) => {
    event.preventDefault();
    setProfileSaving(true);
    try {
      const response = await api.patch("/api/university/profile", { phone: profileForm.phone });
      const updated = response.data?.profile as UniversityProfile;
      if (updated) setProfile(updated);
      setProfileForm({ phone: updated?.phone || "" });
      toast.success(response.data?.msg || "Profile saved.");
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not save your profile."));
    } finally {
      setProfileSaving(false);
    }
  }, [profileForm]);

  const handleChangePassword = useCallback(async (event: FormEvent) => {
    event.preventDefault();
    if (passwordForm.newPassword.length < 8) {
      toast.error("Use at least 8 characters for your new password.");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("The new passwords do not match.");
      return;
    }
    setPasswordSaving(true);
    try {
      const response = await api.put("/api/university/settings/password", {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      toast.success(response.data?.msg || "Password updated.");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not update your password."));
    } finally {
      setPasswordSaving(false);
    }
  }, [passwordForm]);

  const exportCurrentHistory = useCallback(() => {
    const rows = history?.items || [];
    if (!rows.length) {
      toast.error("There is no lookup activity on this page to export.");
      return;
    }
    const csvCell = (value: string | number | boolean) => `"${String(value).replace(/"/g, '""')}"`;
    const lines = [
      ["Date", "Passport suffix", "Result", "Documents", "Verified", "Pending", "Rejected"].map(csvCell).join(","),
      ...rows.map((item) => [
        formatDate(item.createdAt, true),
        item.passportSuffix || "",
        item.matched ? "Record found" : "No match",
        item.documentCount || 0,
        item.verifiedCount || 0,
        item.pendingCount || 0,
        item.rejectedCount || 0,
      ].map(csvCell).join(",")),
    ];
    const blob = new Blob([`\uFEFF${lines.join("\r\n")}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `university-lookup-history-page-${historyPage}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, [history, historyPage]);

  if (!authReady || initialLoading) {
    return (
      <div className="uni-loading-screen">
        <Toaster position="top-right" />
        <span className="uni-loading-mark"><ShieldCheck size={25} /></span>
        <Loader2 className="animate-spin" size={20} />
        <p>Preparing your university workspace…</p>
      </div>
    );
  }

  return (
    <div className="uni-portal">
      <Toaster position="top-right" reverseOrder={false} />
      {mobileNavOpen && <button className="uni-mobile-overlay" aria-label="Close navigation" onClick={() => setMobileNavOpen(false)} />}

      <aside className={`uni-sidebar ${mobileNavOpen ? "is-open" : ""}`}>
        <div className="uni-brand">
          <span className="uni-brand-mark"><ShieldCheck size={23} strokeWidth={2.2} /></span>
          <span className="uni-brand-name"><strong>Verification Check</strong><small>UNIVERSITY PORTAL</small></span>
          <button className="uni-mobile-close" onClick={() => setMobileNavOpen(false)} aria-label="Close menu"><X size={18} /></button>
        </div>

        <div className="uni-side-caption"><span className="uni-live-dot" /> UNIVERSITY WORKSPACE</div>
        <nav className="uni-navigation" aria-label="University navigation">
          <p className="uni-nav-label">WORKSPACE</p>
          {NAV_ITEMS.map(({ label, icon: Icon, hint }) => (
            <button key={label} onClick={() => navigate(label)} className={`uni-nav-item ${activeSection === label ? "is-active" : ""}`} aria-current={activeSection === label ? "page" : undefined}>
              <Icon size={18} strokeWidth={1.9} />
              <span><strong>{label}</strong><small>{hint}</small></span>
              {activeSection === label && <ChevronRight size={15} className="uni-nav-chevron" />}
            </button>
          ))}
        </nav>

        <div className="uni-sidebar-note">
          <span className="uni-sidebar-note-icon"><LockKeyhole size={16} /></span>
          <div><strong>Protected workspace</strong><p>Student details are available only to approved university accounts.</p></div>
        </div>

        <div className="uni-sidebar-account">
          <span className="uni-account-avatar">{getInitials(institutionName)}</span>
          <span className="uni-account-name"><strong>{institutionName}</strong><small>{profile?.email || "University account"}</small></span>
          <button onClick={handleLogout} title="Sign out" aria-label="Sign out" className="uni-logout-icon"><LogOut size={16} /></button>
        </div>
      </aside>

      <div className="uni-main">
        <header className="uni-topbar">
          <div className="uni-topbar-leading">
            <button className="uni-mobile-menu" onClick={() => setMobileNavOpen(true)} aria-label="Open navigation"><Menu size={20} /></button>
            <div className="uni-breadcrumb"><span>Workspace</span><ChevronRight size={14} /><strong>{activeSection}</strong></div>
          </div>
          <div className="uni-topbar-actions">
            <span className={`uni-account-status ${profile?.isApproved ? "approved" : "pending"}`}><i />{approvalLabel}</span>
            <button className="uni-refresh-button" onClick={() => void loadWorkspace(true)} disabled={refreshing} aria-label="Refresh dashboard" title="Refresh data"><RefreshCw size={16} className={refreshing ? "animate-spin" : ""} /></button>
            <span className="uni-topbar-avatar">{getInitials(institutionName)}</span>
          </div>
        </header>

        <main className="uni-content">
          {workspaceError && (
            <div className="uni-error-banner"><CircleAlert size={17} /><span>{workspaceError}</span><button onClick={() => void loadWorkspace(true)}>Try again</button></div>
          )}

          {activeSection === "Overview" && (
            <OverviewSection
              profile={profile}
              overview={overview}
              institutionName={institutionName}
              onNavigate={navigate}
              onSearch={handleSearch}
              query={searchQuery}
              setQuery={setSearchQuery}
              searchLoading={searchLoading}
              onOpenHistory={() => navigate("Lookup history")}
            />
          )}

          {activeSection === "Verify student" && (
            <VerificationSection
              query={searchQuery}
              setQuery={setSearchQuery}
              student={student}
              loading={searchLoading}
              onSearch={handleSearch}
              onClear={() => { setStudent(null); setSearchQuery(""); }}
            />
          )}

          {activeSection === "Lookup history" && (
            <HistorySection
              data={history}
              loading={historyLoading}
              page={historyPage}
              onPageChange={loadHistory}
              onExport={exportCurrentHistory}
              onStartSearch={() => navigate("Verify student")}
            />
          )}

          {activeSection === "Settings" && (
            <SettingsSection
              profile={profile}
              form={profileForm}
              setForm={setProfileForm}
              saving={profileSaving}
              onSave={handleSaveProfile}
              passwordForm={passwordForm}
              setPasswordForm={setPasswordForm}
              passwordSaving={passwordSaving}
              onChangePassword={handleChangePassword}
            />
          )}
        </main>

        <footer className="uni-footer"><span>Verification Check <i>·</i> University workspace</span><span><ShieldCheck size={13} /> Your activity is tied to your approved institution account.</span></footer>
      </div>
    </div>
  );
}

function PageHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="uni-page-heading">
      <div><p className="uni-eyebrow">{eyebrow}</p><h1>{title}</h1><p className="uni-page-description">{description}</p></div>
      {action ? <div className="uni-heading-action">{action}</div> : null}
    </div>
  );
}

function OverviewSection({
  profile, overview, institutionName, onNavigate, onSearch, query, setQuery, searchLoading, onOpenHistory,
}: {
  profile: UniversityProfile | null;
  overview: OverviewData;
  institutionName: string;
  onNavigate: (section: Section) => void;
  onSearch: (event?: FormEvent) => void;
  query: string;
  setQuery: (value: string) => void;
  searchLoading: boolean;
  onOpenHistory: () => void;
}) {
  const { stats } = overview;
  const documentTotal = stats.totalDocuments;
  const verifiedPercent = documentTotal > 0 ? Math.round((stats.verifiedDocuments / documentTotal) * 100) : 0;
  const verifiedShare = documentTotal > 0 ? (stats.verifiedDocuments / documentTotal) * 100 : 0;
  const pendingShare = documentTotal > 0 ? ((stats.verifiedDocuments + stats.pendingDocuments) / documentTotal) * 100 : 0;
  const maxMonthly = Math.max(1, ...overview.platformMonthlyActivity.map((item) => item.total));
  const hasRecentDocumentActivity = overview.platformMonthlyActivity.some((item) => item.total > 0);

  return (
    <div className="uni-page-stack fade-up">
      <section className="uni-welcome-panel">
        <div className="uni-welcome-copy">
          <p className="uni-eyebrow uni-eyebrow-light"><span /> UNIVERSITY OVERVIEW</p>
          <h1>Welcome back,<br /><em>{institutionName}</em></h1>
          <p>Review student credentials, confirm document status, and keep your institution&apos;s verification activity organised from one workspace.</p>
          <div className="uni-welcome-actions">
            <button className="uni-button uni-button-light" onClick={() => onNavigate("Verify student")}>Verify a student <ArrowRight size={16} /></button>
            <span className="uni-welcome-joined"><CalendarDays size={14} /> Member since {formatDate(profile?.createdAt)}</span>
          </div>
        </div>
        <div className="uni-welcome-art" aria-hidden="true">
          <div className="uni-art-orbit orbit-one" /><div className="uni-art-orbit orbit-two" />
          <div className="uni-art-card art-card-back"><FileCheck2 size={23} /><span /></div>
          <div className="uni-art-card art-card-front"><ShieldCheck size={46} /><strong>Document<br />verification</strong><small>Secure registry lookup</small></div>
          <div className="uni-art-spark spark-one">✳</div><div className="uni-art-spark spark-two">✦</div>
        </div>
        <div className="uni-welcome-foot"><span><i /> {profile?.isApproved ? "Your institution is approved" : "Approval required"}</span><span>Private institution workspace</span></div>
      </section>

      <div className="uni-metric-grid">
        <MetricCard icon={UsersRound} label="Student accounts" value={stats.totalStudents} footnote="Across the verification registry" tone="blue" />
        <MetricCard icon={SchoolIcon} label="University accounts" value={stats.totalUniversities} footnote={`${formatNumber(stats.approvedUniversities)} approved and active`} tone="teal" />
        <MetricCard icon={FileText} label="Student documents" value={stats.totalDocuments} footnote="Across all student submissions" tone="orange" />
        <MetricCard icon={CheckCircle2} label="Verified documents" value={stats.verifiedDocuments} footnote={`${formatNumber(stats.pendingDocuments)} pending · ${formatNumber(stats.rejectedDocuments)} rejected`} tone="green" />
      </div>

      <div className="uni-overview-grid">
        <section className="uni-panel">
          <div className="uni-panel-heading">
            <div><p className="uni-panel-kicker">REGISTRY ACTIVITY</p><h2>Document activity over time</h2><p className="uni-panel-subtitle">Monthly student document submissions and current review outcomes across the registry.</p></div>
            <span className="uni-panel-icon"><Activity size={18} /></span>
          </div>
          {!hasRecentDocumentActivity ? (
            <div className="uni-chart-empty"><span><Activity size={25} /></span><strong>No document activity to chart yet</strong><p>There are no document submissions in the last six months. The chart will update when recent documents are added.</p><button onClick={() => onNavigate("Verify student")}>Verify a student record <ArrowRight size={14} /></button></div>
          ) : (
            <div className="uni-chart-area">
              <div className="uni-chart-y-labels"><span>{maxMonthly}</span><span>{Math.round(maxMonthly * .66)}</span><span>{Math.round(maxMonthly * .33)}</span><span>0</span></div>
              <div className="uni-chart-plot">
                <div className="uni-chart-gridlines"><i /><i /><i /><i /></div>
                <div className="uni-chart-columns">
                  {overview.platformMonthlyActivity.map((month) => (
                    <div className="uni-chart-column" key={month.key} title={`${month.label}: ${month.total} documents`}>
                      <span className="uni-chart-total">{month.total || ""}</span>
                      <div className="uni-chart-track">
                        <span className="uni-chart-bar-verified" style={{ height: `${(month.verified / maxMonthly) * 100}%` }} />
                        <span className="uni-chart-bar-pending" style={{ height: `${(month.pending / maxMonthly) * 100}%` }} />
                        <span className="uni-chart-bar-rejected" style={{ height: `${(month.rejected / maxMonthly) * 100}%` }} />
                      </div>
                      <span className="uni-chart-month-label">{month.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          <div className="uni-chart-legend"><span><i className="legend-verified" /> Verified</span><span><i className="legend-pending" /> Pending</span><span><i className="legend-rejected" /> Rejected</span><span className="uni-chart-legend-note">Last 6 months</span></div>
        </section>

        <section className="uni-panel uni-outcome-panel">
          <div className="uni-panel-heading">
            <div><p className="uni-panel-kicker">DOCUMENT STATUS</p><h2>Verification outcomes</h2><p className="uni-panel-subtitle">Current document status across all student accounts.</p></div>
            <span className="uni-panel-icon"><Fingerprint size={18} /></span>
          </div>
          <div className="uni-donut-layout">
            <div className="uni-donut" style={{ background: documentTotal ? `conic-gradient(#247f7b 0 ${verifiedShare}%, #ff985c ${verifiedShare}% ${pendingShare}%, #14569a ${pendingShare}% 100%)` : "conic-gradient(#e7eef0 0 100%)" }}>
              <div><strong>{formatNumber(documentTotal)}</strong><span>DOCUMENTS</span></div>
            </div>
            <div className="uni-donut-summary"><strong>{verifiedPercent}%</strong><span>of documents are verified</span><small>Across the current student registry.</small></div>
          </div>
          <div className="uni-outcome-legend">
            <div><span className="uni-legend-mark mark-teal" /><span>Verified</span><strong>{formatNumber(stats.verifiedDocuments)}</strong></div>
            <div><span className="uni-legend-mark mark-orange" /><span>Pending</span><strong>{formatNumber(stats.pendingDocuments)}</strong></div>
            <div><span className="uni-legend-mark mark-blue" /><span>Rejected</span><strong>{formatNumber(stats.rejectedDocuments)}</strong></div>
          </div>
          <div className="uni-privacy-note"><ShieldCheck size={16} /><span>These are aggregate platform totals only. Individual student records require an approved passport lookup, and university directories remain administrator-only.</span></div>
        </section>
      </div>

      <section className="uni-own-activity-strip">
        <div><span>Your lookups</span><strong>{formatNumber(stats.totalLookups)}</strong><small>Since activity tracking began</small></div>
        <div><span>Successful lookups</span><strong>{formatNumber(stats.matchedLookups)}</strong><small>Matched a student record</small></div>
        <div><span>Distinct records matched</span><strong>{formatNumber(stats.uniqueStudents)}</strong><small>Unique student records</small></div>
        <div><span>No match</span><strong>{formatNumber(stats.notFoundLookups)}</strong><small>{formatNumber(stats.lookupsLast30Days)} lookups in the last 30 days</small></div>
      </section>

      <div className="uni-lower-grid">
        <section className="uni-panel">
          <div className="uni-panel-heading">
            <div><p className="uni-panel-kicker">RECENT ACTIVITY</p><h2>Latest student lookups</h2><p className="uni-panel-subtitle">Recent activity recorded against your account.</p></div>
            <button className="uni-text-link" onClick={onOpenHistory}>View history <ArrowRight size={14} /></button>
          </div>
          {overview.recentActivity.length ? (
            <div className="uni-activity-list">
              {overview.recentActivity.slice(0, 5).map((item) => <ActivityRow key={item._id} item={item} compact />)}
            </div>
          ) : (
            <EmptyState icon={History} title="No lookup activity yet" description="Your recent student record searches will appear here after you make a lookup." />
          )}
        </section>

        <section className="uni-quick-panel">
          <div className="uni-quick-icon"><Fingerprint size={23} /></div>
          <p className="uni-panel-kicker">QUICK VERIFICATION</p>
          <h2>Have a passport number?</h2>
          <p>Search the registry to view submitted credentials, status, and available verification evidence.</p>
          <form className="uni-quick-search" onSubmit={onSearch}>
            <label htmlFor="quick-passport">Passport number</label>
            <div><Fingerprint size={17} /><input id="quick-passport" autoComplete="off" value={query} onChange={(event) => setQuery(event.target.value.toUpperCase())} placeholder="Enter passport number" maxLength={40} /><button type="submit" disabled={searchLoading || !query.trim()} aria-label="Search passport">{searchLoading ? <Loader2 size={17} className="animate-spin" /> : <ArrowRight size={17} />}</button></div>
          </form>
          <button className="uni-quick-secondary" onClick={() => onNavigate("Verify student")}>Open verification workspace <ChevronRight size={15} /></button>
        </section>
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, footnote, tone }: { icon: LucideIcon; label: string; value: number; footnote: string; tone: "blue" | "teal" | "orange" | "green" }) {
  return (
    <section className={`uni-metric-card tone-${tone}`}>
      <div className="uni-metric-top"><span>{label}</span><span className="uni-metric-icon"><Icon size={18} /></span></div>
      <strong className="uni-metric-value">{formatNumber(value)}</strong>
      <div className="uni-metric-foot"><span>{footnote}</span><span className="uni-metric-watermark"><Icon size={46} /></span></div>
    </section>
  );
}

function VerificationSection({ query, setQuery, student, loading, onSearch, onClear }: {
  query: string;
  setQuery: (value: string) => void;
  student: StudentRecord | null;
  loading: boolean;
  onSearch: (event?: FormEvent) => void;
  onClear: () => void;
}) {
  const documents = student?.documents || [];
  const documentCounts = documents.reduce((counts, document) => {
    const status = normalizeDocumentStatus(document.status);
    counts[status] += 1;
    return counts;
  }, { verified: 0, pending: 0, rejected: 0 });

  return (
    <div className="uni-page-stack fade-up">
      <PageHeading eyebrow="STUDENT SERVICES" title="Verify a student" description="Search the registry by an exact passport number and review the student record returned by the verification service." />
      <section className="uni-search-panel">
        <div className="uni-search-panel-icon"><FileSearch size={25} /></div>
        <div className="uni-search-panel-copy"><h2>Student record lookup</h2><p>Use the passport number supplied by the student. Lookups are recorded for your institution&apos;s audit history.</p></div>
        <form className="uni-verification-form" onSubmit={onSearch}>
          <label htmlFor="passport-query">Passport number</label>
          <div className="uni-verification-input"><Fingerprint size={20} /><input id="passport-query" value={query} onChange={(event) => setQuery(event.target.value.toUpperCase())} placeholder="e.g. AB1234567" autoComplete="off" maxLength={40} /><button type="submit" disabled={loading || !query.trim()}>{loading ? <><Loader2 size={17} className="animate-spin" /> Searching</> : <><Search size={17} /> Search registry</>}</button></div>
        </form>
        <div className="uni-search-assurance"><ShieldCheck size={15} /><span>Exact-match search · Approved university access · Logged for audit</span></div>
      </section>

      {loading ? (
        <div className="uni-result-loading"><Loader2 className="animate-spin" size={24} /><span>Searching the student registry…</span></div>
      ) : student ? (
        <section className="uni-student-result">
          <div className="uni-student-hero">
            <div className="uni-student-avatar">{getInitials(student.fullName || student.name)}</div>
            <div className="uni-student-heading"><p className="uni-panel-kicker">REGISTRY MATCH</p><h2>{student.fullName || student.name || "Student record"}</h2><div className="uni-student-meta"><span><Fingerprint size={14} /> {student.passportNumber}</span>{student.email && <span><Mail size={14} /> {student.email}</span>}</div></div>
            <span className={`uni-record-status ${student.isAuthentic === false ? "status-rejected" : "status-verified"}`}>{student.isAuthentic === false ? <><CircleAlert size={15} /> Flagged profile</> : <><CheckCircle2 size={15} /> No profile flag found</>}</span>
          </div>

          <div className="uni-student-stats">
            <div><span className="stat-icon blue"><FileText size={17} /></span><span><small>Total documents</small><strong>{formatNumber(documents.length)}</strong></span></div>
            <div><span className="stat-icon teal"><CheckCircle2 size={17} /></span><span><small>Verified</small><strong>{formatNumber(documentCounts.verified)}</strong></span></div>
            <div><span className="stat-icon orange"><Clock3 size={17} /></span><span><small>Pending</small><strong>{formatNumber(documentCounts.pending)}</strong></span></div>
            <div><span className="stat-icon red"><XCircle size={17} /></span><span><small>Rejected</small><strong>{formatNumber(documentCounts.rejected)}</strong></span></div>
          </div>

          <div className="uni-result-section-heading"><div><p className="uni-panel-kicker">SUBMITTED CREDENTIALS</p><h3>Document records</h3></div><button className="uni-button uni-button-outline" onClick={onClear}>New lookup</button></div>
          {documents.length ? (
            <div className="uni-document-grid">
              {documents.map((document, index) => {
                const originalUrl = safeExternalUrl(document.fileUrl || document.url);
                const proofUrl = safeExternalUrl(document.verifySlip || document.verificationImg || document.adminScreenshot || document.adminSlip);
                const status = normalizeDocumentStatus(document.status);
                const title = document.title || document.name || `Document ${index + 1}`;
                return (
                  <article className="uni-document-card" key={document._id || `${title}-${index}`}>
                    <div className="uni-document-top"><span className="uni-file-symbol"><FileText size={20} /></span><StatusPill status={document.status || "Pending"} /></div>
                    <h4>{title}</h4>
                    <p className="uni-document-date">Submitted {formatDate(document.createdAt)}</p>
                    {document.remarks || document.comment || document.adminNote ? <div className={`uni-document-remarks ${status === "rejected" ? "is-rejected" : ""}`}><strong>Authority remarks</strong><p>{document.remarks || document.comment || document.adminNote}</p></div> : <p className="uni-document-no-remarks">No authority remarks recorded for this document.</p>}
                    <div className="uni-document-actions">
                      {originalUrl ? <a href={originalUrl} target="_blank" rel="noopener noreferrer"><EyeIcon /> View original <ExternalLink size={13} /></a> : <span className="is-disabled"><FileText size={14} /> No source file</span>}
                      {proofUrl && <a href={proofUrl} target="_blank" rel="noopener noreferrer"><ShieldCheck size={14} /> Review proof <ExternalLink size={13} /></a>}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <EmptyState icon={FileClock} title="No documents on this record" description="The student record matched, but the registry currently returns no submitted documents." />
          )}
          {student.remarks && <div className="uni-profile-remarks"><ShieldCheck size={17} /><div><strong>Registry note</strong><p>{student.remarks}</p></div></div>}
        </section>
      ) : (
        <div className="uni-verification-placeholder"><div className="uni-placeholder-art"><div><Fingerprint size={44} /></div><span /><span /></div><h2>Start with a student passport number</h2><p>Matched records will show the student&apos;s profile and document statuses here. A search with no matching record is also recorded in your history.</p></div>
      )}
    </div>
  );
}

function HistorySection({ data, loading, page, onPageChange, onExport, onStartSearch }: {
  data: HistoryResponse | null;
  loading: boolean;
  page: number;
  onPageChange: (page: number) => void;
  onExport: () => void;
  onStartSearch: () => void;
}) {
  return (
    <div className="uni-page-stack fade-up">
      <PageHeading eyebrow="AUDIT TRAIL" title="Lookup history" description="Review passport lookups initiated by your institution. The history stores a masked passport suffix and outcome rather than the full passport number." action={<button className="uni-button uni-button-outline" onClick={onExport} disabled={!data?.items?.length}><Download size={15} /> Export current page</button>} />
      <section className="uni-panel uni-history-panel">
        <div className="uni-panel-heading"><div><p className="uni-panel-kicker">RECORDED SEARCHES</p><h2>Recent lookup activity</h2><p className="uni-panel-subtitle">{formatNumber(data?.total || 0)} lookup events recorded for this account.</p></div><span className="uni-panel-icon"><History size={18} /></span></div>
        {loading ? <div className="uni-table-loading"><Loader2 className="animate-spin" size={20} /> Loading activity history…</div> : data?.items?.length ? (
          <>
            <div className="uni-history-table-wrap"><table className="uni-history-table"><thead><tr><th>Lookup date</th><th>Passport suffix</th><th>Result</th><th>Documents at lookup</th><th>Status summary</th></tr></thead><tbody>{data.items.map((item) => (
              <tr key={item._id}>
                <td><span className="uni-history-date">{formatDate(item.createdAt)}</span><small>{formatDate(item.createdAt, true).split(", ").slice(-1)[0]}</small></td>
                <td><span className="uni-masked-passport">•••• {item.passportSuffix || "----"}</span></td>
                <td><span className={`uni-history-result ${item.matched ? "matched" : "not-found"}`}><i />{item.matched ? "Record found" : "No match"}</span></td>
                <td>{item.matched ? formatNumber(item.documentCount || 0) : "—"}</td>
                <td>{item.matched ? <div className="uni-mini-statuses"><span className="verified">{item.verifiedCount || 0} verified</span><span className="pending">{item.pendingCount || 0} pending</span><span className="rejected">{item.rejectedCount || 0} rejected</span></div> : <span className="uni-subtle">No student record matched</span>}</td>
              </tr>
            ))}</tbody></table></div>
            <div className="uni-table-pagination"><span>Showing page {data.page} of {data.totalPages}</span><div><button onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page <= 1 || loading}>Previous</button><button onClick={() => onPageChange(Math.min(data.totalPages, page + 1))} disabled={page >= data.totalPages || loading}>Next <ArrowRight size={13} /></button></div></div>
          </>
        ) : (
          <EmptyState icon={History} title="No search history yet" description="Once you search a student's passport number, the lookup time and result will be available here." action={<button className="uni-button uni-button-primary" onClick={onStartSearch}>Start a lookup <ArrowRight size={15} /></button>} />
        )}
      </section>
      <div className="uni-history-privacy"><LockKeyhole size={16} /><p>History is limited to your university account. It shows only the last four passport characters and document-status counts; it does not provide a way to reopen another student&apos;s record from the audit list.</p></div>
    </div>
  );
}

function SettingsSection({ profile, form, setForm, saving, onSave, passwordForm, setPasswordForm, passwordSaving, onChangePassword }: {
  profile: UniversityProfile | null;
  form: { phone: string };
  setForm: React.Dispatch<React.SetStateAction<{ phone: string }>>;
  saving: boolean;
  onSave: (event: FormEvent) => void;
  passwordForm: { currentPassword: string; newPassword: string; confirmPassword: string };
  setPasswordForm: React.Dispatch<React.SetStateAction<{ currentPassword: string; newPassword: string; confirmPassword: string }>>;
  passwordSaving: boolean;
  onChangePassword: (event: FormEvent) => void;
}) {
  return (
    <div className="uni-page-stack fade-up">
      <PageHeading eyebrow="ACCOUNT PREFERENCES" title="Settings" description="Keep your institution details current and manage the password used to access the verification workspace." />
      <div className="uni-settings-grid">
        <section className="uni-panel uni-settings-panel">
          <div className="uni-settings-heading"><span className="uni-settings-heading-icon"><Building2 size={19} /></span><div><h2>Institution profile</h2><p>These details are associated with your university account.</p></div></div>
          <form className="uni-settings-form" onSubmit={onSave}>
            <label>Approved institution name<input value={profile?.instituteName || profile?.name || ""} readOnly aria-readonly="true" /><small className="uni-field-help">Institution name changes require administrator review to preserve your approval status.</small></label>
            <label>Account email<span className="uni-readonly-field"><Mail size={16} /><input value={profile?.email || ""} readOnly aria-readonly="true" /><small>Verified login</small></span><small className="uni-field-help">For security, the login email cannot be changed from this page.</small></label>
            <label>Contact phone <span className="uni-optional">Optional</span><input type="tel" maxLength={30} value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} placeholder="Institution contact number" /></label>
            <div className="uni-settings-account-meta"><div><span>Account status</span><StatusPill status={profile?.isApproved ? "Approved" : "Pending"} /></div><div><span>Registered on</span><strong>{formatDate(profile?.createdAt)}</strong></div></div>
            <div className="uni-settings-actions"><p>Institution identity is locked after approval; contact details can be updated here.</p><button className="uni-button uni-button-primary" type="submit" disabled={saving}>{saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />} Save profile</button></div>
          </form>
        </section>

        <section className="uni-panel uni-settings-panel">
          <div className="uni-settings-heading"><span className="uni-settings-heading-icon secure"><LockKeyhole size={19} /></span><div><h2>Security</h2><p>Update your password to help protect student information.</p></div></div>
          <form className="uni-settings-form" onSubmit={onChangePassword}>
            <label>Current password<input required type="password" autoComplete="current-password" value={passwordForm.currentPassword} onChange={(event) => setPasswordForm((current) => ({ ...current, currentPassword: event.target.value }))} placeholder="Enter current password" /></label>
            <label>New password<input required minLength={8} maxLength={128} type="password" autoComplete="new-password" value={passwordForm.newPassword} onChange={(event) => setPasswordForm((current) => ({ ...current, newPassword: event.target.value }))} placeholder="At least 8 characters" /><small className="uni-field-help">Use at least 8 characters. Avoid reusing a password from another service.</small></label>
            <label>Confirm new password<input required minLength={8} maxLength={128} type="password" autoComplete="new-password" value={passwordForm.confirmPassword} onChange={(event) => setPasswordForm((current) => ({ ...current, confirmPassword: event.target.value }))} placeholder="Re-enter new password" /></label>
            <div className="uni-security-callout"><ShieldCheck size={17} /><p>Your current password is checked by the server before a new one is saved. Your password is never displayed or returned to the browser.</p></div>
            <div className="uni-settings-actions"><p>Changing your password does not change your account email.</p><button className="uni-button uni-button-primary" type="submit" disabled={passwordSaving}>{passwordSaving ? <Loader2 size={16} className="animate-spin" /> : <LockKeyhole size={16} />} Update password</button></div>
          </form>
        </section>
      </div>
    </div>
  );
}

function ActivityRow({ item, compact = false }: { item: LookupActivity; compact?: boolean }) {
  return (
    <div className={`uni-activity-row ${compact ? "is-compact" : ""}`}>
      <span className={`uni-activity-symbol ${item.matched ? "found" : "missing"}`}>{item.matched ? <CheckCircle2 size={16} /> : <Search size={16} />}</span>
      <div className="uni-activity-main"><strong>Passport ending {item.passportSuffix || "----"}</strong><span>{item.matched ? `${item.documentCount || 0} document${item.documentCount === 1 ? "" : "s"} on record` : "No student record matched"}</span></div>
      <div className="uni-activity-side"><span className={`uni-history-result ${item.matched ? "matched" : "not-found"}`}><i />{item.matched ? "Found" : "No match"}</span><small>{formatDate(item.createdAt, true)}</small></div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const className = normalized === "verified" || normalized === "approved"
    ? "is-verified"
    : normalized === "rejected" || normalized === "inactive"
      ? "is-rejected"
      : "is-pending";
  const Icon = className === "is-verified" ? CheckCircle2 : className === "is-rejected" ? XCircle : Clock3;
  return <span className={`uni-status-pill ${className}`}><Icon size={12} />{status}</span>;
}

function EmptyState({ icon: Icon, title, description, action }: { icon: LucideIcon; title: string; description: string; action?: React.ReactNode }) {
  return <div className="uni-empty-state"><span><Icon size={23} /></span><strong>{title}</strong><p>{description}</p>{action ? <div className="uni-empty-action">{action}</div> : null}</div>;
}

function EyeIcon() {
  return <FileSearch size={14} />;
}
