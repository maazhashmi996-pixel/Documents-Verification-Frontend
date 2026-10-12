"use client";
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    FileUp, LogOut, Loader2, FileText, Search, Share2, Trash2, ExternalLink,
    BadgeCheck, Clock, XCircle, Files, RefreshCw, LayoutDashboard, Hourglass,
    Menu, X, Sparkles, ChevronRight, ShieldCheck,
} from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import UploadModal from '@/Components/UploadModal';
import ShareModal from '@/Components/ShareModal';

type Status = 'Pending' | 'Verified' | 'Rejected';
type View = 'overview' | 'processing' | 'verified' | 'rejected';
interface Doc {
    _id: string;
    title: string;
    institute: string;
    status: Status;
    remarks?: string;
    fileUrl?: string;
    verifySlip?: string;
    createdAt: string;
}

// "Pending" in the database is shown to students as "Processing" (the admin is reviewing it).
const STATUS_META: Record<Status, { label: string; badge: string; Icon: typeof Clock; color: string }> = {
    Pending: { label: 'Processing', badge: 'bg-orange-50 text-orange-700 ring-1 ring-orange-200', Icon: Hourglass, color: '#ff985c' },
    Verified: { label: 'Verified', badge: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200', Icon: BadgeCheck, color: '#2fae8f' },
    Rejected: { label: 'Rejected', badge: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200', Icon: XCircle, color: '#d9534f' },
};

const NAV: { key: View; label: string; Icon: typeof Clock; status?: Status }[] = [
    { key: 'overview', label: 'Overview', Icon: LayoutDashboard },
    { key: 'processing', label: 'Processing Documents', Icon: Hourglass, status: 'Pending' },
    { key: 'verified', label: 'Verified Documents', Icon: BadgeCheck, status: 'Verified' },
    { key: 'rejected', label: 'Rejected Documents', Icon: XCircle, status: 'Rejected' },
];

const fmt = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

function useCountUp(target: number, duration = 900) {
    const [val, setVal] = useState(0);
    useEffect(() => {
        let raf = 0;
        const start = performance.now();
        const tick = (now: number) => {
            const p = Math.min(1, (now - start) / duration);
            setVal(Math.round(target * (1 - Math.pow(1 - p, 3))));
            if (p < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [target, duration]);
    return val;
}

export default function StudentDashboard() {
    const router = useRouter();
    const [docs, setDocs] = useState<Doc[]>([]);
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<View>('overview');
    const [menuOpen, setMenuOpen] = useState(false);
    const [uploadOpen, setUploadOpen] = useState(false);
    const [shareDoc, setShareDoc] = useState<Doc | null>(null);
    const [deleteDoc, setDeleteDoc] = useState<Doc | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [query, setQuery] = useState('');

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/student/dashboard');
            setDocs(res.data?.documents || []);
            setName(res.data?.name || '');
        } catch (err: any) {
            if (err.response?.status === 401 || err.response?.status === 403) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                router.replace('/login/student');
                return;
            }
            toast.error(err.response?.data?.msg || 'Could not load your documents.');
        } finally {
            setLoading(false);
        }
    }, [router]);

    useEffect(() => { load(); }, [load]);

    const counts = useMemo(() => ({
        All: docs.length,
        Pending: docs.filter((d) => d.status === 'Pending').length,
        Verified: docs.filter((d) => d.status === 'Verified').length,
        Rejected: docs.filter((d) => d.status === 'Rejected').length,
    }), [docs]);

    const sorted = useMemo(() => [...docs].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)), [docs]);

    const activeStatus = NAV.find((n) => n.key === view)?.status;
    const shown = useMemo(() => {
        const q = query.trim().toLowerCase();
        return sorted
            .filter((d) => !activeStatus || d.status === activeStatus)
            .filter((d) => !q || d.title.toLowerCase().includes(q) || d.institute.toLowerCase().includes(q));
    }, [sorted, query, activeStatus]);

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/');
    };

    const confirmDelete = async () => {
        if (!deleteDoc) return;
        setDeleting(true);
        try {
            await api.delete(`/api/student/document/${deleteDoc._id}`);
            toast.success('Document removed.');
            setDocs((d) => d.filter((x) => x._id !== deleteDoc._id));
            setDeleteDoc(null);
        } catch (err: any) {
            toast.error(err.response?.data?.msg || 'Could not delete the document.');
        } finally {
            setDeleting(false);
        }
    };

    const go = (v: View) => { setView(v); setQuery(''); setMenuOpen(false); };

    const vars = { '--accent': '#06498c', '--accent-deep': '#06498c', '--accent-soft': '#e8f1fb' } as React.CSSProperties;
    const firstName = name.split(' ')[0];
    const pageTitle = view === 'overview'
        ? (firstName ? `Welcome back, ${firstName}` : 'Overview')
        : NAV.find((n) => n.key === view)!.label;

    return (
        <div style={vars} className="min-h-screen lg:flex">
            <Toaster position="top-center" />
            <UploadModal isOpen={uploadOpen} onClose={() => setUploadOpen(false)} refreshData={load} />
            <ShareModal doc={shareDoc} onClose={() => setShareDoc(null)} />

            {deleteDoc && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-ink/40 backdrop-blur-sm" onClick={() => !deleting && setDeleteDoc(null)}>
                    <div onClick={(e) => e.stopPropagation()} className="fade-up w-full max-w-sm bg-white rounded-3xl p-7 shadow-2xl">
                        <h2 className="font-display text-xl text-ink">Remove this document?</h2>
                        <p className="text-sm text-ink-soft mt-2 leading-relaxed"><span className="font-semibold text-ink">{deleteDoc.title}</span> and its public link will be deleted. This cannot be undone.</p>
                        <div className="mt-6 flex gap-3">
                            <button onClick={() => setDeleteDoc(null)} disabled={deleting} className="flex-1 h-11 rounded-xl border border-line font-semibold text-ink hover:bg-pearl">Keep it</button>
                            <button onClick={confirmDelete} disabled={deleting} className="flex-1 h-11 rounded-xl font-semibold text-white bg-rose-700 hover:brightness-110 inline-flex items-center justify-center">
                                {deleting ? <Loader2 size={18} className="animate-spin" /> : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Mobile top bar */}
            <header className="lg:hidden sticky top-0 z-40 h-16 px-4 flex items-center justify-between bg-[#051a33] text-white shadow-lg">
                <div className="flex items-center gap-3">
                    <span className="h-9 w-9 rounded-xl bg-[#06498c] inline-flex items-center justify-center"><ShieldCheck size={20} /></span>
                    <span className="leading-tight"><strong className="block text-sm tracking-tight">VERIFICATION</strong><small className="block text-[10px] tracking-[0.25em] text-[#3bb7ae] font-bold">CHECK</small></span>
                </div>
                <button onClick={() => setMenuOpen(true)} aria-label="Open menu" className="h-10 w-10 inline-flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20">
                    <Menu size={20} />
                </button>
            </header>

            {menuOpen && <div className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={() => setMenuOpen(false)} />}

            {/* Sidebar */}
            <aside className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-72 shrink-0 flex flex-col text-white bg-gradient-to-b from-[#051a33] via-[#073a6b] to-[#06294d] border-r border-white/5 transition-transform duration-300 ${menuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
                <div className="h-20 px-6 flex items-center justify-between border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <span className="h-11 w-11 rounded-xl bg-[#06498c] ring-1 ring-[#3bb7ae]/50 shadow-lg shadow-black/20 inline-flex items-center justify-center"><ShieldCheck size={23} strokeWidth={2.2} /></span>
                        <div className="leading-tight">
                            <p className="text-[15px] font-extrabold tracking-tight">VERIFICATION</p>
                            <p className="text-[11px] tracking-[0.28em] font-bold text-[#3bb7ae]">CHECK · STUDENT</p>
                        </div>
                    </div>
                    <button onClick={() => setMenuOpen(false)} aria-label="Close menu" className="lg:hidden h-9 w-9 inline-flex items-center justify-center rounded-lg hover:bg-white/10"><X size={18} /></button>
                </div>

                <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
                    <p className="px-3 mb-2 text-[11px] font-semibold tracking-[0.18em] uppercase text-white/40">Menu</p>
                    {NAV.map(({ key, label, Icon, status }) => {
                        const active = view === key;
                        const count = status ? counts[status] : null;
                        return (
                            <button
                                key={key}
                                onClick={() => go(key)}
                                className={`group relative w-full h-12 px-3 rounded-xl flex items-center gap-3 text-sm font-semibold transition-all ${active ? 'bg-gradient-to-r from-[#3bb7ae]/25 to-transparent text-white' : 'text-white/65 hover:text-white hover:bg-white/5'}`}
                            >
                                {active && <span className="absolute left-0 top-2 bottom-2 w-1 rounded-full bg-[#3bb7ae]" />}
                                <span className={`h-9 w-9 rounded-lg inline-flex items-center justify-center transition ${active ? 'bg-[#3bb7ae] text-[#051a33]' : 'bg-white/5 text-white/70 group-hover:bg-white/10'}`}><Icon size={18} /></span>
                                <span className="flex-1 text-left">{label}</span>
                                {count !== null && (
                                    <span className={`min-w-6 h-6 px-2 rounded-full text-xs inline-flex items-center justify-center ${active ? 'bg-white text-[#051a33]' : 'bg-white/10 text-white/80'}`}>{count}</span>
                                )}
                            </button>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-white/10">
                    <button onClick={() => { setMenuOpen(false); setUploadOpen(true); }} className="w-full h-11 mb-3 rounded-xl inline-flex items-center justify-center gap-2 text-sm font-semibold text-[#051a33] bg-gradient-to-r from-[#5ccfc6] to-[#2f9d96] hover:brightness-105 transition">
                        <FileUp size={17} /> Upload document
                    </button>
                    <button onClick={logout} className="w-full h-11 rounded-xl inline-flex items-center justify-center gap-2 text-sm font-semibold text-white/80 bg-white/5 hover:bg-rose-500/20 hover:text-rose-200 transition">
                        <LogOut size={17} /> Logout
                    </button>
                </div>
            </aside>

            {/* Main */}
            <main className="flex-1 min-w-0 px-5 sm:px-8 lg:px-10 py-8 sm:py-10 dash-bg">
                <div className="max-w-6xl mx-auto">
                    <div className="fade-up flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                        <div>
                            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[#247f7b]">{view === 'overview' ? 'Dashboard' : 'Documents'}</p>
                            <h1 className="font-display text-3xl sm:text-4xl text-ink mt-1">{pageTitle}</h1>
                            <p className="text-ink-soft mt-2">
                                {view === 'overview' && 'A live summary of your documents and where each one stands.'}
                                {view === 'processing' && 'These documents are being reviewed by the admin right now.'}
                                {view === 'verified' && 'Approved documents. Share their public verification link anywhere.'}
                                {view === 'rejected' && 'Rejected documents with the admin remarks, so you can fix and upload again.'}
                            </p>
                        </div>
                        <button onClick={load} className="h-11 px-4 inline-flex items-center justify-center gap-2 rounded-xl bg-white border border-line text-sm font-semibold text-ink-soft hover:text-ink shadow-sm">
                            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
                        </button>
                    </div>

                    {loading && docs.length === 0 ? (
                        <div className="py-32 flex justify-center"><Loader2 className="animate-spin text-ink-soft" size={28} /></div>
                    ) : view === 'overview' ? (
                        <Overview counts={counts} docs={sorted} onGo={go} onUpload={() => setUploadOpen(true)} renderRow={(d) => (
                            <DocRow key={d._id} doc={d} onShare={setShareDoc} onDelete={setDeleteDoc} />
                        )} />
                    ) : (
                        <section className="fade-up mt-8 bg-white border border-line rounded-3xl overflow-hidden shadow-[0_24px_60px_-40px_rgba(15,27,51,0.35)]">
                            <div className="p-5 sm:p-6 flex items-center gap-3 border-b border-line">
                                <div className="relative flex-1 sm:max-w-sm">
                                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft/60" />
                                    <input
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        placeholder="Search title or institute"
                                        aria-label="Search documents"
                                        className="w-full h-10 pl-10 pr-3 bg-white border border-line rounded-xl text-sm text-ink outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent-soft)]"
                                    />
                                </div>
                                <span className="text-sm text-ink-soft ml-auto">{shown.length} document{shown.length === 1 ? '' : 's'}</span>
                            </div>
                            {shown.length === 0 ? (
                                <EmptyState view={view} hasDocs={docs.length > 0} />
                            ) : (
                                <ul className="divide-y divide-line">
                                    {shown.map((d) => <DocRow key={d._id} doc={d} onShare={setShareDoc} onDelete={setDeleteDoc} />)}
                                </ul>
                            )}
                        </section>
                    )}
                </div>
            </main>
        </div>
    );
}

/* ---------------------------------------------------------------- Overview */

function Overview({ counts, docs, onGo, onUpload, renderRow }: {
    counts: { All: number; Pending: number; Verified: number; Rejected: number };
    docs: Doc[];
    onGo: (v: View) => void;
    onUpload: () => void;
    renderRow: (d: Doc) => React.ReactNode;
}) {
    const clear = counts.Pending === 0 && counts.Rejected === 0;
    const recent = docs.slice(0, 5);

    return (
        <>
            {/* Status banner */}
            <div className={`fade-up mt-8 rounded-3xl p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center gap-5 text-white shadow-xl ${clear ? 'bg-gradient-to-r from-[#247f7b] to-[#3bb7ae]' : 'bg-gradient-to-r from-[#051a33] to-[#06498c]'}`}>
                <span className="h-14 w-14 shrink-0 rounded-2xl bg-white/15 ring-1 ring-white/25 inline-flex items-center justify-center float-soft">
                    {clear ? <BadgeCheck size={28} /> : <Sparkles size={28} />}
                </span>
                <div className="flex-1">
                    <h2 className="font-display text-xl sm:text-2xl">
                        {counts.All === 0
                            ? 'No documents yet'
                            : clear ? 'You have no pending documents' : 'Here is what needs your attention'}
                    </h2>
                    <p className="text-white/80 mt-1 text-sm sm:text-base">
                        {counts.All === 0
                            ? 'Upload your first document to start the verification.'
                            : clear
                                ? 'Everything you uploaded has been reviewed and verified. Nothing is waiting.'
                                : `${counts.Pending} document${counts.Pending === 1 ? ' is' : 's are'} being processed${counts.Rejected ? ` and ${counts.Rejected} ${counts.Rejected === 1 ? 'was' : 'were'} rejected` : ''}.`}
                    </p>
                </div>
                {counts.All === 0 && (
                    <button onClick={onUpload} className="h-11 px-5 rounded-xl bg-white text-ink font-semibold text-sm inline-flex items-center justify-center gap-2 hover:bg-white/90"><FileUp size={16} /> Upload</button>
                )}
            </div>

            {/* Summary cards */}
            <section className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard delay={0} label="All documents" value={counts.All} Icon={Files} grad="from-[#06498c] to-[#2f86d4]" />
                <StatCard delay={80} label="Processing" value={counts.Pending} Icon={Hourglass} grad="from-[#f07a35] to-[#ffb07d]" onClick={() => onGo('processing')} />
                <StatCard delay={160} label="Verified" value={counts.Verified} Icon={BadgeCheck} grad="from-[#247f7b] to-[#3bb7ae]" onClick={() => onGo('verified')} />
                <StatCard delay={240} label="Rejected" value={counts.Rejected} Icon={XCircle} grad="from-[#b8283f] to-[#e4566d]" onClick={() => onGo('rejected')} />
            </section>

            {/* Charts */}
            <section className="mt-6 grid grid-cols-1 lg:grid-cols-5 gap-4">
                <div className="fade-up lg:col-span-2 bg-white border border-line rounded-3xl p-6 shadow-[0_24px_60px_-44px_rgba(15,27,51,0.4)]" style={{ animationDelay: '120ms' }}>
                    <h3 className="font-display text-lg text-ink">Status breakdown</h3>
                    <p className="text-sm text-ink-soft">Share of your documents by status</p>
                    <Donut counts={counts} />
                </div>
                <div className="fade-up lg:col-span-3 bg-white border border-line rounded-3xl p-6 shadow-[0_24px_60px_-44px_rgba(15,27,51,0.4)]" style={{ animationDelay: '200ms' }}>
                    <h3 className="font-display text-lg text-ink">Uploads by month</h3>
                    <p className="text-sm text-ink-soft">Last 6 months, split by current status</p>
                    <MonthBars docs={docs} />
                </div>
            </section>

            {/* Recent */}
            <section className="fade-up mt-6 bg-white border border-line rounded-3xl overflow-hidden shadow-[0_24px_60px_-40px_rgba(15,27,51,0.35)]" style={{ animationDelay: '260ms' }}>
                <div className="p-5 sm:p-6 flex items-center justify-between border-b border-line">
                    <h3 className="font-display text-lg text-ink">Recent documents</h3>
                    {docs.length > 5 && <span className="text-sm text-ink-soft inline-flex items-center gap-1">Latest 5 of {docs.length} <ChevronRight size={14} /></span>}
                </div>
                {recent.length === 0 ? <EmptyState view="overview" hasDocs={false} /> : <ul className="divide-y divide-line">{recent.map(renderRow)}</ul>}
            </section>
        </>
    );
}

function StatCard({ label, value, Icon, grad, delay, onClick }: { label: string; value: number; Icon: typeof Clock; grad: string; delay: number; onClick?: () => void }) {
    const n = useCountUp(value);
    const Tag = onClick ? 'button' : 'div';
    return (
        <Tag
            onClick={onClick}
            style={{ animationDelay: `${delay}ms` }}
            className={`fade-up text-left relative overflow-hidden rounded-2xl p-5 text-white bg-gradient-to-br ${grad} shadow-lg transition ${onClick ? 'hover:-translate-y-1 hover:shadow-2xl cursor-pointer' : ''}`}
        >
            <span className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10" />
            <span className="absolute -right-2 -bottom-8 h-20 w-20 rounded-full bg-white/10" />
            <span className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/20"><Icon size={20} /></span>
            <p className="relative font-display text-4xl mt-4 tabular-nums">{n}</p>
            <p className="relative text-sm text-white/85 mt-0.5">{label}</p>
        </Tag>
    );
}

function Donut({ counts }: { counts: { All: number; Pending: number; Verified: number; Rejected: number } }) {
    const [ready, setReady] = useState(false);
    useEffect(() => { const t = setTimeout(() => setReady(true), 80); return () => clearTimeout(t); }, []);
    const R = 62, C = 2 * Math.PI * R;
    const total = counts.All;
    const parts = (['Verified', 'Pending', 'Rejected'] as Status[]).map((s) => ({ s, v: counts[s] }));
    let offset = 0;

    return (
        <div className="mt-4 flex flex-col sm:flex-row lg:flex-col xl:flex-row items-center gap-6">
            <div className="relative h-44 w-44 shrink-0">
                <svg viewBox="0 0 160 160" className="h-full w-full -rotate-90">
                    <circle cx="80" cy="80" r={R} fill="none" stroke="#eef1f7" strokeWidth="16" />
                    {total > 0 && parts.map(({ s, v }) => {
                        if (v === 0) return null;
                        const len = (v / total) * C;
                        const el = (
                            <circle
                                key={s} cx="80" cy="80" r={R} fill="none" stroke={STATUS_META[s].color} strokeWidth="16" strokeLinecap="butt"
                                strokeDasharray={`${ready ? Math.max(0, len - 2) : 0} ${C}`}
                                strokeDashoffset={-offset}
                                style={{ transition: 'stroke-dasharray 1.1s cubic-bezier(0.2,0.7,0.2,1)' }}
                            />
                        );
                        offset += len;
                        return el;
                    })}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-display text-3xl text-ink">{total}</span>
                    <span className="text-xs text-ink-soft uppercase tracking-wider">Total</span>
                </div>
            </div>
            <ul className="w-full space-y-3">
                {parts.map(({ s, v }) => (
                    <li key={s} className="flex items-center gap-3 text-sm">
                        <span className="h-3 w-3 rounded-full" style={{ background: STATUS_META[s].color }} />
                        <span className="text-ink-soft flex-1">{STATUS_META[s].label}</span>
                        <span className="font-semibold text-ink tabular-nums">{v}</span>
                        <span className="w-12 text-right text-ink-soft tabular-nums">{total ? Math.round((v / total) * 100) : 0}%</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

function MonthBars({ docs }: { docs: Doc[] }) {
    const [ready, setReady] = useState(false);
    useEffect(() => { const t = setTimeout(() => setReady(true), 80); return () => clearTimeout(t); }, []);

    const months = useMemo(() => {
        const now = new Date();
        return Array.from({ length: 6 }, (_, i) => {
            const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
            const inMonth = docs.filter((x) => {
                const c = new Date(x.createdAt);
                return c.getFullYear() === d.getFullYear() && c.getMonth() === d.getMonth();
            });
            return {
                label: d.toLocaleDateString('en-GB', { month: 'short' }),
                Pending: inMonth.filter((x) => x.status === 'Pending').length,
                Verified: inMonth.filter((x) => x.status === 'Verified').length,
                Rejected: inMonth.filter((x) => x.status === 'Rejected').length,
                total: inMonth.length,
            };
        });
    }, [docs]);

    const max = Math.max(1, ...months.map((m) => m.total));

    return (
        <div className="mt-5">
            <div className="h-48 flex items-end gap-3 sm:gap-5 border-b border-line">
                {months.map((m, i) => (
                    <div key={i} className="flex-1 h-full flex flex-col items-center justify-end gap-1.5">
                        <span className="text-xs font-semibold text-ink-soft tabular-nums">{m.total || ''}</span>
                        <div
                            className="w-full max-w-12 flex flex-col-reverse rounded-t-lg overflow-hidden bg-pearl"
                            style={{ height: ready ? `${(m.total / max) * 85}%` : '0%', minHeight: m.total ? 6 : 3, transition: `height 0.9s cubic-bezier(0.2,0.7,0.2,1) ${i * 70}ms` }}
                        >
                            {(['Verified', 'Pending', 'Rejected'] as Status[]).map((s) => m[s] > 0 && (
                                <div key={s} style={{ height: `${(m[s] / m.total) * 100}%`, background: STATUS_META[s].color }} title={`${STATUS_META[s].label}: ${m[s]}`} />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
            <div className="flex gap-3 sm:gap-5 mt-2">
                {months.map((m, i) => <span key={i} className="flex-1 text-center text-xs text-ink-soft">{m.label}</span>)}
            </div>
            <div className="mt-4 flex flex-wrap gap-4 text-xs text-ink-soft">
                {(['Verified', 'Pending', 'Rejected'] as Status[]).map((s) => (
                    <span key={s} className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ background: STATUS_META[s].color }} />{STATUS_META[s].label}</span>
                ))}
            </div>
        </div>
    );
}

/* ---------------------------------------------------------------- Shared */

function EmptyState({ view, hasDocs }: { view: View; hasDocs: boolean }) {
    const text: Record<View, [string, string]> = {
        overview: ['No documents yet', 'Upload your first document to start the verification.'],
        processing: ['Nothing is being processed', 'You have no documents waiting for review right now.'],
        verified: ['No verified documents yet', 'Once the admin approves a document it will appear here.'],
        rejected: ['No rejected documents', 'Great news, none of your documents were rejected.'],
    };
    const [title, sub] = hasDocs && view === 'overview' ? ['Nothing matches', 'Try another search word.'] : text[view];
    return (
        <div className="py-20 px-6 text-center">
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-pearl text-ink-soft"><FileText size={26} /></span>
            <h3 className="font-display text-xl text-ink mt-5">{title}</h3>
            <p className="text-ink-soft mt-1">{sub}</p>
        </div>
    );
}

function DocRow({ doc, onShare, onDelete }: { doc: Doc; onShare: (d: Doc) => void; onDelete: (d: Doc) => void }) {
    const b = STATUS_META[doc.status];
    return (
        <li className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center gap-4 md:gap-6 hover:bg-pearl/60 transition">
            <div className="flex items-start gap-4 md:flex-1 min-w-0">
                <span className="h-11 w-11 shrink-0 rounded-xl bg-[var(--accent-soft)] text-[var(--accent-deep)] inline-flex items-center justify-center"><FileText size={20} /></span>
                <div className="min-w-0">
                    <p className="font-semibold text-ink truncate">{doc.title}</p>
                    <p className="text-sm text-ink-soft truncate">{doc.institute} · uploaded {fmt(doc.createdAt)}</p>
                    {doc.remarks && doc.status !== 'Pending' && <p className="text-sm text-ink-soft mt-1.5 italic">&ldquo;{doc.remarks}&rdquo;</p>}
                </div>
            </div>

            <span className={`self-start md:self-auto inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-sm font-semibold ${b.badge}`}>
                <b.Icon size={15} /> {b.label}
            </span>

            <div className="flex flex-wrap items-center gap-2">
                <button onClick={() => onShare(doc)} className="h-9 px-3.5 inline-flex items-center gap-2 rounded-xl text-sm font-semibold text-[var(--accent-deep)] bg-[var(--accent-soft)] hover:brightness-95">
                    <Share2 size={15} /> Share
                </button>
                {doc.fileUrl && (
                    <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="h-9 px-3.5 inline-flex items-center gap-2 rounded-xl text-sm font-semibold text-ink-soft border border-line hover:text-ink">
                        <ExternalLink size={15} /> Original
                    </a>
                )}
                {doc.verifySlip && (
                    <a href={doc.verifySlip} target="_blank" rel="noreferrer" className="h-9 px-3.5 inline-flex items-center gap-2 rounded-xl text-sm font-semibold text-emerald-700 border border-emerald-200 hover:bg-emerald-50">
                        <BadgeCheck size={15} /> Slip
                    </a>
                )}
                <button onClick={() => onDelete(doc)} aria-label={`Delete ${doc.title}`} className="h-9 w-9 inline-flex items-center justify-center rounded-xl text-ink-soft hover:text-rose-700 hover:bg-rose-50">
                    <Trash2 size={16} />
                </button>
            </div>
        </li>
    );
}
