"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  CreditCard,
  ExternalLink,
  FileCheck2,
  FileText,
  Filter,
  LayoutDashboard,
  Loader2,
  LogOut,
  Menu,
  RefreshCw,
  Search,
  Settings2,
  ShieldCheck,
  School,
  Trash2,
  Upload,
  UserRound,
  Users,
  WalletCards,
  X,
  XCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast, Toaster } from "react-hot-toast";
import api from "@/lib/api";

type Section = "Overview" | "Universities" | "Students" | "Pending" | "Verified" | "Rejected" | "Payments" | "Settings";
type DocStatus = "Pending" | "Verified" | "Rejected";
type Role = "student" | "university" | "admin";

interface VerificationDocument {
  _id?: string;
  title?: string;
  institute?: string;
  fileUrl?: string;
  url?: string;
  verifySlip?: string;
  verificationImg?: string;
  status?: DocStatus | string;
  remarks?: string;
  createdAt?: string;
  verifiedAt?: string;
}

interface PaymentDetails {
  transactionId?: string;
  proofImage?: string;
  paymentStatus?: "None" | "Pending" | "Approved" | "Rejected" | string;
  submittedAt?: string;
}

interface CrmUser {
  _id: string;
  name: string;
  email: string;
  role: Role | string;
  instituteName?: string;
  phone?: string;
  passportNumber?: string;
  isApproved?: boolean;
  rejectionRemarks?: string | null;
  isActive?: boolean;
  isPaid?: boolean;
  paymentDetails?: PaymentDetails;
  documents?: VerificationDocument[];
  createdAt?: string;
}

interface MonthlyActivity {
  month: string;
  received: number;
  pending: number;
  verified: number;
  rejected: number;
}

interface DashboardStats {
  totalStudents: number;
  totalUniversities: number;
  pendingApprovals: number;
  paidStudents: number;
  paymentPending: number;
  totalDocuments: number;
  pendingDocuments: number;
  verifiedDocuments: number;
  rejectedDocuments: number;
  monthlyActivity: MonthlyActivity[];
}

interface AdminProfile {
  _id?: string;
  name: string;
  email: string;
  phone: string;
  role?: string;
}

interface DocumentRecord {
  student: CrmUser;
  document: VerificationDocument;
  index: number;
}

const NAV_ITEMS: { label: Section; icon: LucideIcon; group: "Workspace" | "Management" | "Account" }[] = [
  { label: "Overview", icon: LayoutDashboard, group: "Workspace" },
  { label: "Universities", icon: School, group: "Management" },
  { label: "Students", icon: Users, group: "Management" },
  { label: "Pending", icon: Clock3, group: "Management" },
  { label: "Verified", icon: CheckCircle2, group: "Management" },
  { label: "Rejected", icon: XCircle, group: "Management" },
  { label: "Payments", icon: WalletCards, group: "Management" },
  { label: "Settings", icon: Settings2, group: "Account" },
];

const PAGE_COPY: Record<Section, { eyebrow: string; title: string; description: string }> = {
  Overview: { eyebrow: "Verification operations", title: "Overview", description: "A live view of student records, university access, and document reviews." },
  Universities: { eyebrow: "Institution directory", title: "Universities", description: "Review registered institutions and manage their access to the verification portal." },
  Students: { eyebrow: "Student directory", title: "Students", description: "Search student accounts, contact details, payment state, and submitted documents." },
  Pending: { eyebrow: "Action required", title: "Pending review", description: "Work through university approval requests and documents awaiting verification." },
  Verified: { eyebrow: "Completed reviews", title: "Verified documents", description: "Browse documents that currently have a verified status in the registry." },
  Rejected: { eyebrow: "Review outcomes", title: "Rejected documents", description: "Review rejected documents and the feedback recorded for each submission." },
  Payments: { eyebrow: "Payment operations", title: "Payments", description: "Review submitted payment proofs and confirm transactions against the actual record." },
  Settings: { eyebrow: "Administrator account", title: "Settings", description: "Update your administrator profile and secure your account credentials." },
};

function getErrorMessage(error: unknown, fallback: string) {
  const e = error as { response?: { data?: { msg?: string; message?: string } } };
  return e?.response?.data?.msg || e?.response?.data?.message || fallback;
}

function formatNumber(value?: number) {
  return new Intl.NumberFormat("en-PK").format(value ?? 0);
}

function formatDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

function getInitials(name?: string) {
  return (name || "Admin").trim().split(/\s+/).slice(0, 2).map((part) => part[0] || "").join("").toUpperCase();
}

function getDocumentRecords(users: CrmUser[]): DocumentRecord[] {
  return users.flatMap((student) => (student.documents || []).map((document, index) => ({ student, document, index })));
}

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Section>("Overview");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [search, setSearch] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [authChecked, setAuthChecked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessageState] = useState("");
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [users, setUsers] = useState<CrmUser[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [remarks, setRemarks] = useState<Record<string, string>>({});
  const [attestationFiles, setAttestationFiles] = useState<Record<string, File>>({});
  const [rejectTarget, setRejectTarget] = useState<CrmUser | null>(null);
  const [universityRejectionRemarks, setUniversityRejectionRemarks] = useState("");
  const [profile, setProfile] = useState<AdminProfile>({ name: "", email: "", phone: "" });
  const [profileSaving, setProfileSaving] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    let account: { role?: string } = {};
    try {
      account = JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      account = {};
    }
    if (!token || account.role !== "admin") {
      router.replace("/login/admin");
      return;
    }
    setAuthChecked(true);
  }, [router]);

  const fetchAdminData = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);
    setErrorMessageState("");
    try {
      const [statsResponse, usersResponse] = await Promise.all([
        api.get("/api/admin/stats"),
        api.get(`/api/admin/students?search=${encodeURIComponent(debouncedSearch)}`),
      ]);
      setStats(statsResponse.data as DashboardStats);
      const payload = usersResponse.data;
      setUsers(Array.isArray(payload) ? payload : Array.isArray(payload?.users) ? payload.users : []);
    } catch (error) {
      const message = getErrorMessage(error, "Could not load administrator data. Check the API connection and try again.");
      setErrorMessageState(message);
      toast.error(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    if (authChecked) void fetchAdminData();
  }, [authChecked, fetchAdminData]);

  useEffect(() => {
    if (!authChecked || activeTab !== "Settings") return;
    let live = true;
    api.get("/api/admin/settings")
      .then((response) => {
        if (!live) return;
        const nextProfile = response.data?.profile;
        if (nextProfile) setProfile({ name: nextProfile.name || "", email: nextProfile.email || "", phone: nextProfile.phone || "", role: nextProfile.role });
      })
      .catch((error) => toast.error(getErrorMessage(error, "Could not load administrator settings.")));
    return () => { live = false; };
  }, [authChecked, activeTab]);

  const students = useMemo(() => users.filter((user) => user.role === "student"), [users]);
  const universities = useMemo(() => users.filter((user) => user.role === "university"), [users]);
  const allDocuments = useMemo(() => getDocumentRecords(students), [students]);
  const pendingDocuments = useMemo(() => allDocuments.filter(({ document }) => !["Verified", "Rejected"].includes(document.status || "Pending")), [allDocuments]);
  const verifiedDocuments = useMemo(() => allDocuments.filter(({ document }) => document.status === "Verified"), [allDocuments]);
  const rejectedDocuments = useMemo(() => allDocuments.filter(({ document }) => document.status === "Rejected"), [allDocuments]);
  const pendingUniversities = useMemo(() => universities.filter((university) => !university.isApproved && !university.rejectionRemarks), [universities]);
  const rejectedUniversities = useMemo(() => universities.filter((university) => !university.isApproved && Boolean(university.rejectionRemarks)), [universities]);
  const displayName = profile.name || (() => {
    try { return JSON.parse(localStorage.getItem("user") || "{}").name || "Administrator"; } catch { return "Administrator"; }
  })();

  const chooseTab = (tab: Section) => {
    setActiveTab(tab);
    setMobileNavOpen(false);
    setSearch("");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.replace("/login/admin");
  };

  const handleToggleStatus = async (user: CrmUser) => {
    setProcessingId(`status-${user._id}`);
    try {
      const response = await api.patch(`/api/admin/user-status/${user._id}`);
      setUsers((previous) => previous.map((entry) => entry._id === user._id ? { ...entry, isActive: response.data?.isActive ?? !entry.isActive } : entry));
      toast.success(response.data?.msg || "Account status updated.");
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not update account status."));
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeleteUser = async (user: CrmUser) => {
    if (!window.confirm(`Delete the account for ${user.name}? This cannot be undone.`)) return;
    setProcessingId(`delete-${user._id}`);
    try {
      await api.delete(`/api/admin/delete-user/${user._id}`);
      setUsers((previous) => previous.filter((entry) => entry._id !== user._id));
      toast.success("Account deleted.");
      void fetchAdminData(true);
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not delete this account."));
    } finally {
      setProcessingId(null);
    }
  };

  const handleApproveUniversity = async (university: CrmUser) => {
    setProcessingId(`approve-${university._id}`);
    try {
      await api.put(`/api/admin/approve/${university._id}`);
      toast.success("University access approved.");
      void fetchAdminData(true);
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not approve the university."));
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectUniversity = async () => {
    if (!rejectTarget) return;
    const note = universityRejectionRemarks.trim();
    if (note.length < 5) return toast.error("Add a clear reason of at least 5 characters.");
    setProcessingId(`reject-university-${rejectTarget._id}`);
    try {
      await api.put(`/api/admin/reject/${rejectTarget._id}`, { remarks: note });
      toast.success("University request rejected with remarks saved.");
      setRejectTarget(null);
      setUniversityRejectionRemarks("");
      void fetchAdminData(true);
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not reject the university."));
    } finally {
      setProcessingId(null);
    }
  };

  const handleDocumentAction = async (record: DocumentRecord, action: "verify" | "reject") => {
    const { student, index } = record;
    const docKey = `${student._id}-${index}`;
    const note = (remarks[docKey] || record.document.remarks || "").trim();
    if (action === "verify" && !attestationFiles[docKey] && !record.document.verifySlip) {
      toast.error("Upload the verification attestation before approving this document.");
      return;
    }
    if (action === "reject" && note.length < 5) {
      toast.error("Add a clear rejection reason of at least 5 characters.");
      return;
    }

    setProcessingId(`${docKey}-${action}`);
    const formData = new FormData();
    if (attestationFiles[docKey]) formData.append("attestedDoc", attestationFiles[docKey]);
    formData.append("remarks", note || "Document verified by administrator.");
    formData.append("docIndex", String(index));
    formData.append("status", action === "verify" ? "Verified" : "Rejected");

    try {
      await api.put(`/api/admin/verify-single-doc/${student._id}/${index}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success(action === "verify" ? "Document verified." : "Document rejected and remarks saved.");
      setAttestationFiles((previous) => { const next = { ...previous }; delete next[docKey]; return next; });
      setRemarks((previous) => { const next = { ...previous }; delete next[docKey]; return next; });
      void fetchAdminData(true);
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not update the document status."));
    } finally {
      setProcessingId(null);
    }
  };

  const handlePaymentApproval = async (student: CrmUser) => {
    setProcessingId(`payment-${student._id}`);
    try {
      await api.put(`/api/admin/update-fee/${student._id}`, { isPaid: true });
      toast.success("Payment confirmed and status synchronized.");
      void fetchAdminData(true);
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not confirm this payment."));
    } finally {
      setProcessingId(null);
    }
  };

  const saveProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setProfileSaving(true);
    try {
      const response = await api.put("/api/admin/settings/profile", { name: profile.name, email: profile.email, phone: profile.phone });
      const updated = response.data?.profile as AdminProfile;
      setProfile(updated);
      try {
        const existing = JSON.parse(localStorage.getItem("user") || "{}");
        localStorage.setItem("user", JSON.stringify({ ...existing, ...updated }));
      } catch { /* The API response is still saved even if local user cache is invalid. */ }
      toast.success(response.data?.msg || "Profile updated.");
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not update your profile."));
    } finally {
      setProfileSaving(false);
    }
  };

  const changePassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (newPassword.length < 10) return toast.error("Use at least 10 characters for the new password.");
    setPasswordSaving(true);
    try {
      const response = await api.put("/api/admin/settings/password", { currentPassword, newPassword });
      toast.success(response.data?.msg || "Password updated.");
      setCurrentPassword("");
      setNewPassword("");
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not update your password."));
    } finally {
      setPasswordSaving(false);
    }
  };

  if (!authChecked) {
    return <div className="admin-loading-screen"><div className="admin-loading-mark"><ShieldCheck size={26} /></div><Loader2 className="animate-spin" size={22} /><span>Securing administrator session…</span></div>;
  }

  const page = PAGE_COPY[activeTab];
  const paymentQueue = students.filter((student) => student.paymentDetails?.proofImage && student.paymentDetails.paymentStatus === "Pending" && !student.isPaid);

  return (
    <div className="admin-shell">
      <Toaster position="top-right" toastOptions={{ duration: 3600, style: { borderRadius: 14, fontFamily: "inherit" } }} />
      <aside className="admin-sidebar">
        <button className="admin-brand" type="button" onClick={() => chooseTab("Overview")} aria-label="Verification Check overview">
          <span className="admin-brand-mark"><ShieldCheck size={23} strokeWidth={2.2} /></span>
          <span className="admin-brand-word"><strong>VERIFICATION</strong><small>CHECK</small></span>
        </button>
        <div className="admin-sidebar-intro"><span>ADMINISTRATION</span><span className="admin-live-dot" /> <span className="admin-live-text">Live registry</span></div>
        <nav className="admin-navigation" aria-label="Administrator navigation">
          {(["Workspace", "Management", "Account"] as const).map((group) => (
            <div className="admin-nav-group" key={group}>
              <p className="admin-nav-label">{group}</p>
              {NAV_ITEMS.filter((item) => item.group === group).map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.label;
                const count = item.label === "Pending" ? (stats?.pendingDocuments || 0) + (stats?.pendingApprovals || 0) : item.label === "Verified" ? stats?.verifiedDocuments : item.label === "Rejected" ? stats?.rejectedDocuments : undefined;
                return (
                  <button key={item.label} type="button" className={`admin-nav-item ${isActive ? "is-active" : ""}`} onClick={() => chooseTab(item.label)} aria-current={isActive ? "page" : undefined}>
                    <Icon size={18} strokeWidth={isActive ? 2.1 : 1.8} />
                    <span>{item.label}</span>
                    {typeof count === "number" && count > 0 && <span className={`admin-nav-count ${isActive ? "active-count" : ""}`}>{count > 99 ? "99+" : count}</span>}
                    {isActive && <ChevronRight className="admin-nav-chevron" size={16} />}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
        <div className="admin-sidebar-bottom">
          <div className="admin-security-card">
            <span className="admin-security-icon"><ShieldCheck size={17} /></span>
            <div><strong>Secure workspace</strong><small>Administrator access</small></div>
            <span className="admin-security-status" aria-label="Protected"><Check size={13} /></span>
          </div>
          <button type="button" className="admin-logout" onClick={handleLogout}><LogOut size={18} /><span>Sign out</span><ArrowRight size={15} className="admin-logout-arrow" /></button>
          <p className="admin-sidebar-footnote">VERIFICATION CHECK <span>·</span> ADMIN PORTAL</p>
        </div>
      </aside>

      <main className="admin-main">
        <div className="admin-mobile-topbar">
          <button className="admin-brand admin-brand-compact" type="button" onClick={() => chooseTab("Overview")}>
            <span className="admin-brand-mark"><ShieldCheck size={21} /></span><span className="admin-brand-word"><strong>VERIFICATION</strong><small>CHECK</small></span>
          </button>
          <button type="button" className="admin-mobile-menu-button" aria-label="Toggle navigation" onClick={() => setMobileNavOpen((value) => !value)}>{mobileNavOpen ? <X size={21} /> : <Menu size={21} />}</button>
        </div>
        {mobileNavOpen && <div className="admin-mobile-nav">{NAV_ITEMS.map((item) => { const Icon = item.icon; return <button type="button" key={item.label} className={activeTab === item.label ? "is-active" : ""} onClick={() => chooseTab(item.label)}><Icon size={17} />{item.label}</button>; })}</div>}

        <header className="admin-topbar">
          <div className="admin-breadcrumb"><span>Workspace</span><ChevronRight size={14} /><strong>{activeTab}</strong></div>
          <div className="admin-topbar-actions">
            <label className="admin-search"><Search size={17} /><input ref={searchInputRef} aria-label="Search students and universities" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search names, email, passport…" /><kbd>⌘ K</kbd></label>
            <button type="button" className="admin-refresh-button" onClick={() => void fetchAdminData(true)} title="Refresh live records" aria-label="Refresh live records"><RefreshCw size={17} className={refreshing ? "animate-spin" : ""} /></button>
            <div className="admin-topbar-divider" />
            <div className="admin-avatar">{getInitials(displayName)}</div>
            <div className="admin-account-copy"><strong>{displayName || "Administrator"}</strong><span>System administrator</span></div>
          </div>
        </header>

        <div className="admin-content">
          <section className="admin-page-heading">
            <div><p className="admin-eyebrow"><span />{page.eyebrow}</p><h1>{page.title}</h1><p className="admin-page-description">{page.description}</p></div>
            <div className="admin-heading-meta"><span className="admin-heading-meta-icon"><Activity size={17} /></span><div><strong>Registry connected</strong><small>Data from your CRM records</small></div></div>
          </section>

          {errorMessage && <div className="admin-error-banner"><AlertTriangleIcon /><div><strong>Unable to refresh every record</strong><span>{errorMessage}</span></div><button type="button" onClick={() => void fetchAdminData(true)}>Try again</button></div>}

          {activeTab === "Overview" && (
            <div className="admin-page-stack">
              <section className="admin-metric-grid">
                <MetricCard title="Total students" value={stats?.totalStudents} icon={Users} accent="blue" loading={loading} caption="Registered student accounts" />
                <MetricCard title="Universities" value={stats?.totalUniversities} icon={School} accent="teal" loading={loading} caption="Institution accounts" />
                <MetricCard title="Pending reviews" value={(stats?.pendingDocuments || 0) + (stats?.pendingApprovals || 0)} icon={Clock3} accent="orange" loading={loading} caption="Documents and university requests" />
                <MetricCard title="Verified documents" value={stats?.verifiedDocuments} icon={FileCheck2} accent="green" loading={loading} caption="Currently marked as verified" />
              </section>

              <section className="admin-overview-grid">
                <div className="admin-panel admin-chart-panel">
                  <div className="admin-panel-heading"><div><p className="admin-panel-kicker">Submission activity</p><h2>Document records</h2><p className="admin-panel-subtitle">Current document statuses grouped by submission month.</p></div><span className="admin-period-pill"><CalendarIcon /> Last 6 months</span></div>
                  <ActivityChart data={stats?.monthlyActivity || []} loading={loading} />
                </div>
                <div className="admin-panel admin-status-panel">
                  <div className="admin-panel-heading"><div><p className="admin-panel-kicker">Verification breakdown</p><h2>Document status</h2><p className="admin-panel-subtitle">All student documents currently in the registry.</p></div><span className="admin-panel-icon"><Filter size={17} /></span></div>
                  <StatusDonut pending={stats?.pendingDocuments || 0} verified={stats?.verifiedDocuments || 0} rejected={stats?.rejectedDocuments || 0} loading={loading} />
                  <div className="admin-status-legend"><StatusLegend color="teal" label="Verified" value={stats?.verifiedDocuments || 0} total={stats?.totalDocuments || 0} /><StatusLegend color="blue" label="Pending" value={stats?.pendingDocuments || 0} total={stats?.totalDocuments || 0} /><StatusLegend color="orange" label="Rejected" value={stats?.rejectedDocuments || 0} total={stats?.totalDocuments || 0} /></div>
                </div>
              </section>

              <section className="admin-lower-grid">
                <div className="admin-panel admin-recent-panel">
                  <div className="admin-panel-heading"><div><p className="admin-panel-kicker">Latest accounts</p><h2>Recent registrations</h2></div><button type="button" className="admin-text-link" onClick={() => chooseTab("Students")}>Open directory <ArrowUpRight size={15} /></button></div>
                  <RecentRegistrations users={users.slice(0, 5)} loading={loading} />
                </div>
                <div className="admin-panel admin-queue-panel">
                  <div className="admin-panel-heading"><div><p className="admin-panel-kicker">Needs attention</p><h2>Review queue</h2></div><span className="admin-queue-total">{formatNumber(pendingDocuments.length + pendingUniversities.length)}</span></div>
                  <div className="admin-queue-summary"><div className="admin-queue-symbol"><FileText size={17} /></div><div><strong>Document reviews</strong><span>{formatNumber(pendingDocuments.length)} awaiting a decision</span></div><button type="button" onClick={() => chooseTab("Pending")} aria-label="Open document review queue"><ArrowRight size={17} /></button></div>
                  <div className="admin-queue-summary"><div className="admin-queue-symbol university"><School size={17} /></div><div><strong>University requests</strong><span>{formatNumber(pendingUniversities.length)} awaiting approval</span></div><button type="button" onClick={() => chooseTab("Universities")} aria-label="Open university requests"><ArrowRight size={17} /></button></div>
                  <div className="admin-queue-foot"><ShieldCheck size={15} /> Decisions are saved to the live registry.</div>
                </div>
              </section>
            </div>
          )}

          {activeTab === "Universities" && (
            <section className="admin-panel admin-directory-panel">
              <SectionToolbar title="Institution directory" subtitle={`${formatNumber(universities.length)} university accounts`} search={search} onSearch={setSearch} searchPlaceholder="Search institutions or email" />
              <UniversityDirectory users={universities} loading={loading} processingId={processingId} onApprove={handleApproveUniversity} onReject={(university) => { setRejectTarget(university); setUniversityRejectionRemarks(""); }} onToggle={handleToggleStatus} onDelete={handleDeleteUser} />
            </section>
          )}

          {activeTab === "Students" && (
            <section className="admin-panel admin-directory-panel">
              <SectionToolbar title="Student directory" subtitle={`${formatNumber(students.length)} registered student accounts`} search={search} onSearch={setSearch} searchPlaceholder="Search name, email, or passport" />
              <StudentDirectory users={students} loading={loading} processingId={processingId} onToggle={handleToggleStatus} onDelete={handleDeleteUser} onReview={() => chooseTab("Pending")} />
            </section>
          )}

          {activeTab === "Pending" && (
            <div className="admin-page-stack">
              <section className="admin-panel admin-pending-university-panel">
                <div className="admin-panel-heading"><div><p className="admin-panel-kicker">Institution access</p><h2>Universities awaiting approval</h2><p className="admin-panel-subtitle">Approving a university allows it to use the student lookup workflow.</p></div><span className="admin-queue-total">{pendingUniversities.length}</span></div>
                {pendingUniversities.length ? <UniversityReviewList users={pendingUniversities} processingId={processingId} onApprove={handleApproveUniversity} onReject={(university) => { setRejectTarget(university); setUniversityRejectionRemarks(""); }} /> : <EmptyState icon={School} title="No university approvals waiting" text="New university registration requests will appear here." />}
              </section>
              <section className="admin-panel admin-documents-panel">
                <div className="admin-panel-heading"><div><p className="admin-panel-kicker">Student records</p><h2>Documents awaiting verification</h2><p className="admin-panel-subtitle">Review the submitted file, record clear remarks, and upload the verification attestation before approval.</p></div><span className="admin-queue-total">{pendingDocuments.length}</span></div>
                {pendingDocuments.length ? <div className="admin-document-grid">{pendingDocuments.map((record) => <DocumentReviewCard key={`${record.student._id}-${record.index}`} record={record} remarks={remarks} setRemarks={setRemarks} attestationFiles={attestationFiles} setAttestationFiles={setAttestationFiles} processingId={processingId} onAction={handleDocumentAction} />)}</div> : <EmptyState icon={FileCheck2} title="The document queue is clear" text="There are no student documents waiting for a decision." />}
              </section>
            </div>
          )}

          {activeTab === "Verified" && <DocumentDirectory title="Verified document records" description="These documents currently have a verified status." records={verifiedDocuments} loading={loading} />}
          {activeTab === "Rejected" && (
            <div className="admin-page-stack">
              <section className="admin-panel admin-documents-panel">
                <div className="admin-panel-heading"><div><p className="admin-panel-kicker">Document outcomes</p><h2>Rejected submissions</h2><p className="admin-panel-subtitle">Rejection remarks remain visible so that decisions can be traced.</p></div><span className="admin-queue-total is-rejected">{rejectedDocuments.length}</span></div>
                {rejectedDocuments.length ? <div className="admin-document-grid">{rejectedDocuments.map((record) => <DocumentReviewCard key={`${record.student._id}-${record.index}`} record={record} remarks={remarks} setRemarks={setRemarks} attestationFiles={attestationFiles} setAttestationFiles={setAttestationFiles} processingId={processingId} onAction={handleDocumentAction} />)}</div> : <EmptyState icon={CheckCircle2} title="No rejected documents" text="Rejected student documents will be listed here." />}
              </section>
              {rejectedUniversities.length > 0 && <section className="admin-panel"><div className="admin-panel-heading"><div><p className="admin-panel-kicker">Institution outcomes</p><h2>Rejected university requests</h2></div><span className="admin-queue-total is-rejected">{rejectedUniversities.length}</span></div><UniversityDirectory users={rejectedUniversities} loading={false} processingId={processingId} onApprove={handleApproveUniversity} onReject={(university) => { setRejectTarget(university); setUniversityRejectionRemarks(university.rejectionRemarks || ""); }} onToggle={handleToggleStatus} onDelete={handleDeleteUser} /></section>}
            </div>
          )}

          {activeTab === "Payments" && (
            <section className="admin-panel admin-payment-panel">
              <div className="admin-panel-heading"><div><p className="admin-panel-kicker">Submitted payment proofs</p><h2>Payment review</h2><p className="admin-panel-subtitle">A transaction is only confirmed when a proof file exists and the backend saves the approved payment status.</p></div><span className="admin-queue-total">{paymentQueue.length}</span></div>
              {paymentQueue.length ? <div className="admin-payment-list">{paymentQueue.map((student) => <PaymentReviewRow key={student._id} student={student} processing={processingId === `payment-${student._id}`} onApprove={() => handlePaymentApproval(student)} />)}</div> : <EmptyState icon={CreditCard} title="No payment proofs awaiting review" text="Submitted payment receipts with a pending status will appear here." />}
              <div className="admin-payment-footer"><div><strong>{formatNumber(stats?.paidStudents || 0)}</strong><span>Accounts with approved payment status</span></div><div><strong>{formatNumber(stats?.paymentPending || 0)}</strong><span>Proofs still awaiting review</span></div></div>
            </section>
          )}

          {activeTab === "Settings" && (
            <div className="admin-settings-grid">
              <section className="admin-panel admin-settings-panel">
                <div className="admin-panel-heading"><div><p className="admin-panel-kicker">Profile details</p><h2>Administrator profile</h2><p className="admin-panel-subtitle">These details are saved to your administrator account.</p></div><span className="admin-panel-icon"><UserRound size={17} /></span></div>
                <form className="admin-form" onSubmit={saveProfile}>
                  <label><span>Full name</span><input value={profile.name} onChange={(event) => setProfile((current) => ({ ...current, name: event.target.value }))} required minLength={2} autoComplete="name" /></label>
                  <label><span>Email address</span><input type="email" value={profile.email} onChange={(event) => setProfile((current) => ({ ...current, email: event.target.value }))} required autoComplete="email" /></label>
                  <label><span>Phone number <em>Optional</em></span><input type="tel" value={profile.phone} onChange={(event) => setProfile((current) => ({ ...current, phone: event.target.value }))} autoComplete="tel" /></label>
                  <div className="admin-form-foot"><span><ShieldCheck size={15} /> Only your administrator account is changed.</span><button type="submit" className="admin-primary-button" disabled={profileSaving}>{profileSaving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} Save profile</button></div>
                </form>
              </section>
              <section className="admin-panel admin-settings-panel">
                <div className="admin-panel-heading"><div><p className="admin-panel-kicker">Account protection</p><h2>Change password</h2><p className="admin-panel-subtitle">Use your current password to confirm this change.</p></div><span className="admin-panel-icon security"><ShieldCheck size={17} /></span></div>
                <form className="admin-form" onSubmit={changePassword}>
                  <label><span>Current password</span><input type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} required autoComplete="current-password" /></label>
                  <label><span>New password</span><input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} minLength={10} required autoComplete="new-password" /><small>Use at least 10 characters.</small></label>
                  <div className="admin-security-note"><ShieldCheck size={18} /><div><strong>Credential verification is enabled</strong><span>The server checks your current password before saving a new password hash.</span></div></div>
                  <div className="admin-form-foot"><span><CheckCircle2 size={15} /> Password is processed by the API.</span><button type="submit" className="admin-primary-button" disabled={passwordSaving}>{passwordSaving ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />} Update password</button></div>
                </form>
              </section>
            </div>
          )}

          <footer className="admin-footer"><span>VERIFICATION CHECK <b>ADMIN PORTAL</b></span><span><span className="admin-live-dot" /> Connected to live CRM data</span></footer>
        </div>
      </main>

      {rejectTarget && <div className="admin-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setRejectTarget(null); }}><section className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="reject-university-title"><div className="admin-modal-icon"><XCircle size={22} /></div><button className="admin-modal-close" type="button" onClick={() => setRejectTarget(null)} aria-label="Close rejection dialog"><X size={18} /></button><p className="admin-panel-kicker">University approval</p><h2 id="reject-university-title">Reject registration request</h2><p className="admin-modal-description">This reason will be saved against {rejectTarget.instituteName || rejectTarget.name} and can be reviewed later.</p><label className="admin-modal-field"><span>Reason for rejection</span><textarea value={universityRejectionRemarks} onChange={(event) => setUniversityRejectionRemarks(event.target.value)} minLength={5} rows={4} placeholder="Explain what needs to be corrected…" autoFocus /></label><div className="admin-modal-actions"><button className="admin-secondary-button" type="button" onClick={() => setRejectTarget(null)}>Cancel</button><button className="admin-danger-button" type="button" disabled={processingId === `reject-university-${rejectTarget._id}`} onClick={() => void handleRejectUniversity()}>{processingId === `reject-university-${rejectTarget._id}` ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />} Reject request</button></div></section></div>}
    </div>
  );
}

function AlertTriangleIcon() {
  return <span className="admin-error-icon"><XCircle size={19} /></span>;
}

function CalendarIcon() {
  return <span className="admin-calendar-icon">6M</span>;
}

function MetricCard({ title, value, icon: Icon, accent, loading, caption }: { title: string; value?: number; icon: LucideIcon; accent: "blue" | "teal" | "orange" | "green"; loading: boolean; caption: string }) {
  return (
    <article className={`admin-metric-card accent-${accent}`}>
      <div className="admin-metric-top"><span>{title}</span><span className="admin-metric-icon"><Icon size={20} strokeWidth={1.9} /></span></div>
      {loading ? <div className="admin-value-skeleton" /> : <strong className="admin-metric-value">{formatNumber(value)}</strong>}
      <div className="admin-metric-bottom"><span>{caption}</span><span className="admin-metric-arrow"><ArrowUpRight size={15} /></span></div>
      <span className="admin-metric-watermark"><Icon size={76} strokeWidth={1.1} /></span>
    </article>
  );
}

function ActivityChart({ data, loading }: { data: MonthlyActivity[]; loading: boolean }) {
  const maxValue = Math.max(1, ...data.map((entry) => Math.max(entry.received, entry.verified, entry.rejected)));
  if (loading) return <div className="admin-chart-skeleton"><span /><span /><span /><span /><span /><span /></div>;
  if (!data.length) return <EmptyState icon={Activity} title="No activity to chart yet" text="Monthly bars will appear after documents are submitted." />;
  return (
    <div className="admin-activity-chart">
      <div className="admin-chart-y-labels"><span>{formatNumber(maxValue)}</span><span>{formatNumber(Math.round(maxValue * .66))}</span><span>{formatNumber(Math.round(maxValue * .33))}</span><span>0</span></div>
      <div className="admin-chart-plot">
        <div className="admin-chart-gridlines"><i /><i /><i /><i /></div>
        <div className="admin-chart-months">{data.map((entry) => (
          <div className="admin-chart-month" key={entry.month}>
            <div className="admin-chart-bars">
              <span className="admin-bar bar-received" style={{ height: `${Math.max(entry.received ? 3 : 0, entry.received / maxValue * 100)}%` }} title={`${entry.month}: ${entry.received} documents submitted`} />
              <span className="admin-bar bar-verified" style={{ height: `${Math.max(entry.verified ? 3 : 0, entry.verified / maxValue * 100)}%` }} title={`${entry.month}: ${entry.verified} currently verified`} />
              <span className="admin-bar bar-rejected" style={{ height: `${Math.max(entry.rejected ? 3 : 0, entry.rejected / maxValue * 100)}%` }} title={`${entry.month}: ${entry.rejected} currently rejected`} />
            </div><span className="admin-chart-month-label">{entry.month}</span>
          </div>
        ))}</div>
      </div>
      <div className="admin-chart-legend"><span><i className="legend-received" />Submitted</span><span><i className="legend-verified" />Verified</span><span><i className="legend-rejected" />Rejected</span></div>
    </div>
  );
}

function StatusDonut({ pending, verified, rejected, loading }: { pending: number; verified: number; rejected: number; loading: boolean }) {
  const total = pending + verified + rejected;
  const circumference = 2 * Math.PI * 43;
  const segments = [
    { value: verified, color: "#3bb7ae" },
    { value: pending, color: "#14569a" },
    { value: rejected, color: "#ff985c" },
  ];
  let offset = 0;
  return (
    <div className="admin-donut-wrap">
      {loading ? <div className="admin-donut-skeleton" /> : <svg className="admin-donut" viewBox="0 0 112 112" role="img" aria-label={`${total} documents: ${verified} verified, ${pending} pending and ${rejected} rejected`}>
        <circle cx="56" cy="56" r="43" fill="none" stroke="#edf2f4" strokeWidth="14" />
        {total > 0 && segments.map((segment) => {
          const dash = segment.value / total * circumference;
          const currentOffset = offset;
          offset += dash;
          return <circle key={segment.color} cx="56" cy="56" r="43" fill="none" stroke={segment.color} strokeWidth="14" strokeLinecap="round" strokeDasharray={`${Math.max(0, dash - 1.5)} ${circumference}`} strokeDashoffset={-currentOffset} transform="rotate(-90 56 56)" />;
        })}
        <text x="56" y="52" textAnchor="middle" className="admin-donut-total">{formatNumber(total)}</text><text x="56" y="67" textAnchor="middle" className="admin-donut-caption">DOCUMENTS</text>
      </svg>}
      <div className="admin-donut-note"><strong>{formatNumber(verified)} verified</strong><span>of {formatNumber(total)} total document records</span></div>
    </div>
  );
}

function StatusLegend({ color, label, value, total }: { color: "teal" | "blue" | "orange"; label: string; value: number; total: number }) {
  const percentage = total > 0 ? Math.round(value / total * 100) : 0;
  return <div className="admin-status-legend-row"><span className={`admin-legend-dot ${color}`} /><span className="admin-status-name">{label}</span><strong>{formatNumber(value)}</strong><span className="admin-status-percent">{percentage}%</span></div>;
}

function RecentRegistrations({ users, loading }: { users: CrmUser[]; loading: boolean }) {
  if (loading) return <div className="admin-list-skeleton"><i /><i /><i /><i /></div>;
  if (!users.length) return <EmptyState icon={Users} title="No registrations found" text="New accounts will appear here once they are registered." />;
  return <div className="admin-recent-list">{users.map((user) => {
    const university = user.role === "university";
    const docCount = user.documents?.length || 0;
    const sublabel = university ? (user.instituteName || "University account") : `${formatNumber(docCount)} document${docCount === 1 ? "" : "s"} submitted`;
    return <div className="admin-recent-row" key={user._id}><div className={`admin-recent-avatar ${university ? "institution" : "student"}`}>{university ? <School size={17} /> : <UserRound size={17} />}</div><div className="admin-recent-person"><strong>{user.name}</strong><span>{sublabel}</span></div><div className="admin-recent-meta"><StatusBadge status={university ? (user.isApproved ? "Approved" : user.rejectionRemarks ? "Rejected" : "Pending") : getAccountDocumentStatus(user)} /><span>{formatDate(user.createdAt)}</span></div></div>;
  })}</div>;
}

function getAccountDocumentStatus(user: CrmUser): DocStatus | "No documents" {
  const docs = user.documents || [];
  if (!docs.length) return "No documents";
  if (docs.some((doc) => !["Verified", "Rejected"].includes(doc.status || "Pending"))) return "Pending";
  if (docs.every((doc) => doc.status === "Verified")) return "Verified";
  if (docs.every((doc) => doc.status === "Rejected")) return "Rejected";
  return "Verified";
}

function StatusBadge({ status }: { status: string }) {
  const variant = status.toLowerCase().replace(/\s+/g, "-");
  const Icon = status === "Verified" || status === "Approved" || status === "Paid" ? CheckCircle2 : status === "Rejected" ? XCircle : status === "Pending" || status === "Review pending" ? Clock3 : Activity;
  return <span className={`admin-status-badge status-${variant}`}><Icon size={12} />{status}</span>;
}

function SectionToolbar({ title, subtitle, search, onSearch, searchPlaceholder }: { title: string; subtitle: string; search: string; onSearch: (value: string) => void; searchPlaceholder: string }) {
  return <div className="admin-directory-toolbar"><div><p className="admin-panel-kicker">Directory</p><h2>{title}</h2><p className="admin-panel-subtitle">{subtitle}</p></div><label className="admin-table-search"><Search size={16} /><input value={search} onChange={(event) => onSearch(event.target.value)} placeholder={searchPlaceholder} /></label></div>;
}

function UniversityDirectory({ users, loading, processingId, onApprove, onReject, onToggle, onDelete }: { users: CrmUser[]; loading: boolean; processingId: string | null; onApprove: (user: CrmUser) => void; onReject: (user: CrmUser) => void; onToggle: (user: CrmUser) => void; onDelete: (user: CrmUser) => void }) {
  if (loading) return <TableLoading />;
  if (!users.length) return <EmptyState icon={School} title="No university records found" text="Registered university accounts will appear here." />;
  return <div className="admin-table-scroll"><table className="admin-table"><thead><tr><th>Institution</th><th>Contact</th><th>Registered</th><th>Approval</th><th>Account access</th><th className="align-right">Actions</th></tr></thead><tbody>{users.map((user) => {
    const isRejected = !user.isApproved && Boolean(user.rejectionRemarks);
    const canReview = !user.isApproved;
    return <tr key={user._id}><td><div className="admin-table-person"><span className="admin-table-avatar institution"><School size={17} /></span><span><strong>{user.instituteName || user.name}</strong><small>{user.name}{user.instituteName && user.name !== user.instituteName ? ` · ${user.name}` : ""}</small></span></div></td><td><div className="admin-table-contact"><strong>{user.email}</strong><small>{user.phone || "Phone not provided"}</small></div></td><td>{formatDate(user.createdAt)}</td><td><StatusBadge status={user.isApproved ? "Approved" : isRejected ? "Rejected" : "Pending"} />{isRejected && <small className="admin-inline-remark" title={user.rejectionRemarks || ""}>{user.rejectionRemarks}</small>}</td><td><button type="button" className={`admin-access-pill ${user.isActive === false ? "inactive" : "active"}`} onClick={() => onToggle(user)} disabled={processingId === `status-${user._id}`}>{processingId === `status-${user._id}` ? <Loader2 size={12} className="animate-spin" /> : <i />}{user.isActive === false ? "Inactive" : "Active"}</button></td><td><div className="admin-row-actions">{canReview && <><button type="button" className="admin-icon-action approve" title="Approve university" aria-label={`Approve ${user.name}`} onClick={() => onApprove(user)} disabled={processingId === `approve-${user._id}`}>{processingId === `approve-${user._id}` ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}</button><button type="button" className="admin-icon-action reject" title="Reject university" aria-label={`Reject ${user.name}`} onClick={() => onReject(user)}><X size={15} /></button></>}<button type="button" className="admin-icon-action neutral" title="Delete university account" aria-label={`Delete ${user.name}`} onClick={() => onDelete(user)}><Trash2 size={15} /></button></div></td></tr>;
  })}</tbody></table></div>;
}

function StudentDirectory({ users, loading, processingId, onToggle, onDelete, onReview }: { users: CrmUser[]; loading: boolean; processingId: string | null; onToggle: (user: CrmUser) => void; onDelete: (user: CrmUser) => void; onReview: (user: CrmUser) => void }) {
  if (loading) return <TableLoading />;
  if (!users.length) return <EmptyState icon={Users} title="No student records found" text="Try another search, or return after students have registered." />;
  return <div className="admin-table-scroll"><table className="admin-table"><thead><tr><th>Student</th><th>Passport / phone</th><th>Documents</th><th>Payment</th><th>Registered</th><th>Account</th><th className="align-right">Actions</th></tr></thead><tbody>{users.map((user) => {
    const docStatus = getAccountDocumentStatus(user);
    const paymentStatus = user.isPaid || user.paymentDetails?.paymentStatus === "Approved" ? "Paid" : user.paymentDetails?.paymentStatus === "Pending" ? "Review pending" : "Not paid";
    return <tr key={user._id}><td><div className="admin-table-person"><span className="admin-table-avatar student">{getInitials(user.name)}</span><span><strong>{user.name}</strong><small>{user.email}</small></span></div></td><td><div className="admin-table-contact"><strong>{user.passportNumber || "—"}</strong><small>{user.phone || "Phone not provided"}</small></div></td><td><div className="admin-document-count"><FileText size={15} /><strong>{user.documents?.length || 0}</strong><StatusBadge status={docStatus} /></div></td><td><StatusBadge status={paymentStatus} /></td><td>{formatDate(user.createdAt)}</td><td><button type="button" className={`admin-access-pill ${user.isActive === false ? "inactive" : "active"}`} onClick={() => onToggle(user)} disabled={processingId === `status-${user._id}`}>{processingId === `status-${user._id}` ? <Loader2 size={12} className="animate-spin" /> : <i />}{user.isActive === false ? "Inactive" : "Active"}</button></td><td><div className="admin-row-actions"><button type="button" className="admin-icon-action view" title="Open document review queue" aria-label={`Review documents for ${user.name}`} onClick={() => onReview(user)}><FileCheck2 size={15} /></button><button type="button" className="admin-icon-action neutral" title="Delete student account" aria-label={`Delete ${user.name}`} onClick={() => onDelete(user)}><Trash2 size={15} /></button></div></td></tr>;
  })}</tbody></table></div>;
}

function UniversityReviewList({ users, processingId, onApprove, onReject }: { users: CrmUser[]; processingId: string | null; onApprove: (user: CrmUser) => void; onReject: (user: CrmUser) => void }) {
  return <div className="admin-university-review-list">{users.map((user) => <article className="admin-university-review-row" key={user._id}><div className="admin-university-review-mark"><School size={20} /></div><div className="admin-university-review-details"><strong>{user.instituteName || user.name}</strong><span>{user.name} · {user.email}</span><small>Registered {formatDate(user.createdAt)}{user.phone ? ` · ${user.phone}` : ""}</small></div><div className="admin-university-review-actions"><button type="button" className="admin-secondary-button" onClick={() => onReject(user)}><X size={15} /> Reject</button><button type="button" className="admin-primary-button" onClick={() => onApprove(user)} disabled={processingId === `approve-${user._id}`}>{processingId === `approve-${user._id}` ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />} Approve institution</button></div></article>)}</div>;
}

function DocumentReviewCard({ record, remarks, setRemarks, attestationFiles, setAttestationFiles, processingId, onAction }: { record: DocumentRecord; remarks: Record<string, string>; setRemarks: React.Dispatch<React.SetStateAction<Record<string, string>>>; attestationFiles: Record<string, File>; setAttestationFiles: React.Dispatch<React.SetStateAction<Record<string, File>>>; processingId: string | null; onAction: (record: DocumentRecord, action: "verify" | "reject") => void }) {
  const { student, document, index } = record;
  const key = `${student._id}-${index}`;
  const fileUrl = document.fileUrl || document.url;
  const activeAction = processingId?.startsWith(`${key}-`) ? processingId.split("-").slice(-1)[0] : null;
  return <article className="admin-document-card">
    <div className="admin-document-card-top"><div className="admin-document-kind"><span className="admin-file-icon"><FileText size={19} /></span><div><strong>{document.title || `Document ${index + 1}`}</strong><span>{document.institute || "Institute not specified"}</span></div></div><StatusBadge status={document.status || "Pending"} /></div>
    <div className="admin-document-student"><span className="admin-document-student-avatar">{getInitials(student.name)}</span><div><strong>{student.name}</strong><span>{student.email}</span><small>{student.passportNumber || "Passport not recorded"} · Submitted {formatDate(document.createdAt)}</small></div></div>
    {fileUrl ? <a href={fileUrl} target="_blank" rel="noreferrer" className="admin-document-file-link"><span><ExternalLink size={16} /></span><span><strong>Open submitted document</strong><small>Opens the stored source file in a new tab</small></span><ArrowUpRight size={17} /></a> : <div className="admin-document-missing"><FileText size={16} /><span>No file URL is stored for this document record.</span></div>}
    {document.remarks && <div className={`admin-existing-remarks ${document.status === "Rejected" ? "rejected" : ""}`}><strong>{document.status === "Rejected" ? "Rejection remarks" : "Previous review note"}</strong><p>{document.remarks}</p></div>}
    <label className="admin-remarks-field"><span>Review remarks <em>{document.status === "Rejected" ? "Required to reject again" : "Required when rejecting"}</em></span><textarea rows={3} value={remarks[key] ?? document.remarks ?? ""} onChange={(event) => setRemarks((previous) => ({ ...previous, [key]: event.target.value }))} placeholder="Record clear, actionable feedback for the student…" /></label>
    <label className={`admin-attestation-upload ${attestationFiles[key] ? "has-file" : ""}`}><Upload size={16} /><span>{attestationFiles[key]?.name || (document.verifySlip ? "Verification attestation already attached" : "Upload verification attestation")}</span><input type="file" accept=".pdf,image/*" onChange={(event) => { const file = event.target.files?.[0]; if (file) setAttestationFiles((previous) => ({ ...previous, [key]: file })); }} /></label>
    <div className="admin-document-actions"><button type="button" className="admin-secondary-button" disabled={Boolean(activeAction)} onClick={() => onAction(record, "reject")}>{activeAction === "reject" ? <Loader2 size={15} className="animate-spin" /> : <XCircle size={15} />} Reject document</button><button type="button" className="admin-primary-button" disabled={Boolean(activeAction)} onClick={() => onAction(record, "verify")}>{activeAction === "verify" ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />} Mark verified</button></div>
  </article>;
}

function DocumentDirectory({ title, description, records, loading }: { title: string; description: string; records: DocumentRecord[]; loading: boolean }) {
  if (loading) return <section className="admin-panel"><TableLoading /></section>;
  return <section className="admin-panel admin-documents-panel"><div className="admin-panel-heading"><div><p className="admin-panel-kicker">Document registry</p><h2>{title}</h2><p className="admin-panel-subtitle">{description}</p></div><span className="admin-queue-total">{records.length}</span></div>{records.length ? <div className="admin-document-table-wrap"><table className="admin-table"><thead><tr><th>Document</th><th>Student</th><th>Submission date</th><th>Status</th><th>Remarks</th><th>Source</th></tr></thead><tbody>{records.map(({ student, document, index }) => <tr key={`${student._id}-${index}`}><td><div className="admin-table-person"><span className="admin-table-avatar document"><FileText size={16} /></span><span><strong>{document.title || `Document ${index + 1}`}</strong><small>{document.institute || "Institute not specified"}</small></span></div></td><td><div className="admin-table-contact"><strong>{student.name}</strong><small>{student.email}</small></div></td><td>{formatDate(document.createdAt)}</td><td><StatusBadge status={document.status || "Pending"} /></td><td><span className="admin-table-remark" title={document.remarks || "No remarks recorded"}>{document.remarks || "No remarks recorded"}</span></td><td>{(document.fileUrl || document.url) ? <a className="admin-open-file" href={document.fileUrl || document.url} target="_blank" rel="noreferrer">Open file <ExternalLink size={13} /></a> : <span className="admin-muted">No file</span>}</td></tr>)}</tbody></table></div> : <EmptyState icon={FileCheck2} title="No records in this status" text="Documents will appear here as the review workflow updates." />}</section>;
}

function PaymentReviewRow({ student, processing, onApprove }: { student: CrmUser; processing: boolean; onApprove: () => void }) {
  const payment = student.paymentDetails;
  return <article className="admin-payment-row"><div className="admin-payment-icon"><CreditCard size={20} /></div><div className="admin-payment-person"><strong>{student.name}</strong><span>{student.email}</span><small>Transaction ID: {payment?.transactionId || "Not provided"}</small></div><div className="admin-payment-proof">{payment?.proofImage ? <a href={payment.proofImage} target="_blank" rel="noreferrer"><FileCheck2 size={16} /><span>View payment proof</span><ExternalLink size={14} /></a> : <span>No payment proof stored</span>}<small>Submitted {formatDate(payment?.submittedAt)}</small></div><StatusBadge status={payment?.paymentStatus || "None"} /><button type="button" className="admin-primary-button" onClick={onApprove} disabled={processing || !payment?.proofImage}>{processing ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />} Confirm payment</button></article>;
}

function EmptyState({ icon: Icon, title, text }: { icon: LucideIcon; title: string; text: string }) {
  return <div className="admin-empty-state"><span><Icon size={23} /></span><strong>{title}</strong><p>{text}</p></div>;
}

function TableLoading() {
  return <div className="admin-table-loading"><Loader2 size={24} className="animate-spin" /><span>Loading live registry records…</span></div>;
}
