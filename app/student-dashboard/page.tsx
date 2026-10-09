"use client";
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    FileUp, LogOut, Loader2, FileText, Search, Share2, Trash2, ExternalLink,
    BadgeCheck, Clock, XCircle, Files, RefreshCw,
} from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { ROLES } from '@/lib/roles';
import Seal from '@/Components/Seal';
import UploadModal from '@/Components/UploadModal';
import ShareModal from '@/Components/ShareModal';

type Status = 'Pending' | 'Verified' | 'Rejected';
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

const role = ROLES.student;
const FILTERS: ('All' | Status)[] = ['All', 'Pending', 'Verified', 'Rejected'];
const BADGE: Record<Status, { cls: string; Icon: typeof Clock }> = {
    Verified: { cls: 'bg-[#e6f3ef] text-[#17554a]', Icon: BadgeCheck },
    Pending: { cls: 'bg-[#fbf3df] text-[#8a6212]', Icon: Clock },
    Rejected: { cls: 'bg-[#fdecef] text-[#b4233c]', Icon: XCircle },
};
const fmt = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

export default function StudentDashboard() {
    const router = useRouter();
    const [docs, setDocs] = useState<Doc[]>([]);
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(true);
    const [uploadOpen, setUploadOpen] = useState(false);
    const [shareDoc, setShareDoc] = useState<Doc | null>(null);
    const [deleteDoc, setDeleteDoc] = useState<Doc | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [query, setQuery] = useState('');
    const [filter, setFilter] = useState<'All' | Status>('All');

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

    const shown = useMemo(() => {
        const q = query.trim().toLowerCase();
        return docs
            .filter((d) => filter === 'All' || d.status === filter)
            .filter((d) => !q || d.title.toLowerCase().includes(q) || d.institute.toLowerCase().includes(q))
            .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    }, [docs, query, filter]);

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

    const vars = { '--accent': role.accent, '--accent-deep': role.accentDeep, '--accent-soft': role.soft } as React.CSSProperties;
    const firstName = name.split(' ')[0];

    return (
        <div style={vars} className="min-h-screen">
            <Toaster position="top-center" />
            <UploadModal isOpen={uploadOpen} onClose={() => setUploadOpen(false)} refreshData={load} />
            <ShareModal doc={shareDoc} onClose={() => setShareDoc(null)} />

            {deleteDoc && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-ink/40 backdrop-blur-sm" onClick={() => !deleting && setDeleteDoc(null)}>
                    <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm bg-white rounded-3xl p-7 shadow-2xl">
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

            {/* Top bar */}
            <header className="bg-white border-b border-line">
                <div className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Seal size={30} color="#b8924a" />
                        <span className="font-display text-lg font-semibold text-ink">Qual Check</span>
                    </div>
                    <button onClick={logout} className="inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-line text-sm font-semibold text-ink-soft hover:text-rose-700 hover:border-rose-200 transition">
                        <LogOut size={16} /> Sign out
                    </button>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-5 sm:px-8 py-8 sm:py-12">
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5">
                    <div>
                        <h1 className="font-display text-3xl sm:text-4xl text-ink">{firstName ? `Welcome back, ${firstName}` : 'Your documents'}</h1>
                        <p className="text-ink-soft mt-2">Upload a document, follow its review and share a verified link.</p>
                    </div>
                    <button onClick={() => setUploadOpen(true)} className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-xl font-semibold text-white bg-[var(--accent)] hover:brightness-110 active:scale-[0.99] transition">
                        <FileUp size={18} /> Upload document
                    </button>
                </div>

                <section className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <Stat label="All documents" value={counts.All} Icon={Files} tone="text-[var(--accent-deep)] bg-[var(--accent-soft)]" />
                    <Stat label="Awaiting review" value={counts.Pending} Icon={Clock} tone="text-[#8a6212] bg-[#fbf3df]" />
                    <Stat label="Verified" value={counts.Verified} Icon={BadgeCheck} tone="text-[#17554a] bg-[#e6f3ef]" />
                    <Stat label="Rejected" value={counts.Rejected} Icon={XCircle} tone="text-[#b4233c] bg-[#fdecef]" />
                </section>

                <section className="mt-8 bg-white border border-line rounded-3xl overflow-hidden shadow-[0_24px_60px_-40px_rgba(15,27,51,0.35)]">
                    <div className="p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center gap-4 border-b border-line">
                        <div className="flex flex-wrap gap-2 lg:flex-1">
                            {FILTERS.map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`h-9 px-4 rounded-full text-sm font-semibold transition ${filter === f ? 'bg-ink text-white' : 'bg-pearl text-ink-soft hover:text-ink'}`}
                                >
                                    {f} <span className="opacity-60 ml-1">{counts[f]}</span>
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="relative flex-1 lg:w-72">
                                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft/60" />
                                <input
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Search title or institute"
                                    aria-label="Search documents"
                                    className="w-full h-10 pl-10 pr-3 bg-white border border-line rounded-xl text-sm text-ink outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent-soft)]"
                                />
                            </div>
                            <button onClick={load} aria-label="Refresh" className="h-10 w-10 inline-flex items-center justify-center rounded-xl border border-line text-ink-soft hover:text-ink">
                                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                            </button>
                        </div>
                    </div>

                    {loading && docs.length === 0 ? (
                        <div className="py-24 flex justify-center"><Loader2 className="animate-spin text-ink-soft" /></div>
                    ) : shown.length === 0 ? (
                        <div className="py-20 px-6 text-center">
                            <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-pearl text-ink-soft"><FileText size={26} /></span>
                            <h3 className="font-display text-xl text-ink mt-5">{docs.length === 0 ? 'No documents yet' : 'Nothing matches'}</h3>
                            <p className="text-ink-soft mt-1">{docs.length === 0 ? 'Upload your first document to start the verification.' : 'Try another filter or search word.'}</p>
                        </div>
                    ) : (
                        <ul className="divide-y divide-line">
                            {shown.map((doc) => {
                                const b = BADGE[doc.status];
                                return (
                                    <li key={doc._id} className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
                                        <div className="flex items-start gap-4 md:flex-1 min-w-0">
                                            <span className="h-11 w-11 shrink-0 rounded-xl bg-[var(--accent-soft)] text-[var(--accent-deep)] inline-flex items-center justify-center"><FileText size={20} /></span>
                                            <div className="min-w-0">
                                                <p className="font-semibold text-ink truncate">{doc.title}</p>
                                                <p className="text-sm text-ink-soft truncate">{doc.institute} · uploaded {fmt(doc.createdAt)}</p>
                                                {doc.remarks && doc.status !== 'Pending' && <p className="text-sm text-ink-soft mt-1.5 italic">&ldquo;{doc.remarks}&rdquo;</p>}
                                            </div>
                                        </div>

                                        <span className={`self-start md:self-auto inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-sm font-semibold ${b.cls}`}>
                                            <b.Icon size={15} /> {doc.status}
                                        </span>

                                        <div className="flex flex-wrap items-center gap-2">
                                            <button onClick={() => setShareDoc(doc)} className="h-9 px-3.5 inline-flex items-center gap-2 rounded-xl text-sm font-semibold text-[var(--accent-deep)] bg-[var(--accent-soft)] hover:brightness-95">
                                                <Share2 size={15} /> Share
                                            </button>
                                            {doc.fileUrl && (
                                                <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="h-9 px-3.5 inline-flex items-center gap-2 rounded-xl text-sm font-semibold text-ink-soft border border-line hover:text-ink">
                                                    <ExternalLink size={15} /> Original
                                                </a>
                                            )}
                                            {doc.verifySlip && (
                                                <a href={doc.verifySlip} target="_blank" rel="noreferrer" className="h-9 px-3.5 inline-flex items-center gap-2 rounded-xl text-sm font-semibold text-[#17554a] border border-[#cfe6df] hover:bg-[#e6f3ef]">
                                                    <BadgeCheck size={15} /> Slip
                                                </a>
                                            )}
                                            <button onClick={() => setDeleteDoc(doc)} aria-label={`Delete ${doc.title}`} className="h-9 w-9 inline-flex items-center justify-center rounded-xl text-ink-soft hover:text-rose-700 hover:bg-rose-50">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </section>
            </main>
        </div>
    );
}

function Stat({ label, value, Icon, tone }: { label: string; value: number; Icon: typeof Clock; tone: string }) {
    return (
        <div className="bg-white border border-line rounded-2xl p-5">
            <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}><Icon size={20} /></span>
            <p className="font-display text-3xl text-ink mt-4">{value}</p>
            <p className="text-sm text-ink-soft mt-0.5">{label}</p>
        </div>
    );
}
