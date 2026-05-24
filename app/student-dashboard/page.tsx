"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    CheckCircle, Clock, AlertCircle, FileUp, MoreVertical,
    LogOut, Loader2, FileText, ShieldCheck, Zap,
    BookmarkCheck, ExternalLink, Search, Filter
} from 'lucide-react';
import UploadModal from '@/Components/UploadModal';
import api from '@/lib/api';
import { toast, Toaster } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

// --- Types ---
interface Document {
    _id: string;
    title: string;
    institute: string;
    status: 'Pending' | 'Verified' | 'Rejected';
    remarks?: string;
    verifySlip?: string;
    createdAt: string;
}

interface UserData {
    isPaid: boolean;
    isApproved: boolean;
    name: string;
    email?: string;
}

export default function StudentDashboard() {
    const router = useRouter();

    // --- State Management ---
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [documents, setDocuments] = useState<Document[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [userData, setUserData] = useState<UserData>({
        isPaid: true,
        isApproved: false,
        name: "Student",
    });

    // --- Data Fetching ---
    const fetchDashboardData = useCallback(async () => {
        setIsSyncing(true);
        try {
            const res = await api.get('/api/student/dashboard');
            const fetchedDocs = res.data?.documents || [];
            const user = res.data?.user || res.data || {};

            setUserData({
                isPaid: true, // Business Logic Bypass
                isApproved: user.isApproved || false,
                name: user.name || "Maaz",
            });

            setDocuments(fetchedDocs);
        } catch (err: any) {
            console.error("Dashboard Fetch Error:", err);
            const message = err.response?.data?.message || "Failed to sync dashboard stats";
            toast.error(message);
            if (err.response?.status === 401) router.push('/login');
        } finally {
            setIsSyncing(false);
        }
    }, [router]);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    // --- Memoized Calculations ---
    const stats = useMemo(() => ({
        total: documents.length,
        pending: documents.filter(d => d.status === 'Pending').length,
        verified: documents.filter(d => d.status === 'Verified').length,
    }), [documents]);

    const filteredDocs = useMemo(() => {
        return documents.filter(doc =>
            doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            doc.institute.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [documents, searchQuery]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        toast.success("Security session ended");
        router.push('/login');
    };

    return (
        <div className="min-h-screen bg-[#fafbfc] p-4 md:p-8 lg:p-12">
            <Toaster position="top-right" />

            <UploadModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                userStatus={{
                    isPaid: true,
                    isApproved: userData.isApproved,
                    paymentStatus: "Approved"
                }}
                refreshData={fetchDashboardData}
            />

            <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-5 duration-1000">

                {/* --- Top Navigation / Header --- */}
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                        <div className="relative">
                            <div className="h-16 w-16 rounded-2xl bg-slate-900 flex items-center justify-center shadow-2xl shadow-indigo-200 ring-4 ring-white">
                                <span className="text-white text-2xl font-bold">{userData.name.charAt(0)}</span>
                            </div>
                            <div className="absolute -bottom-1 -right-1 h-5 w-5 bg-emerald-500 border-4 border-white rounded-full" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                                Hi, {userData.name}!
                            </h2>
                            <p className="text-slate-500 font-medium flex items-center gap-2 text-sm mt-1">
                                <ShieldCheck size={16} className="text-indigo-500" />
                                Student ID: {userData.isApproved ? 'Verified Account' : 'Verification in Progress'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleLogout}
                            className="p-3.5 rounded-2xl border border-slate-200 bg-white text-slate-600 hover:text-red-600 hover:bg-red-50 transition-all active:scale-95"
                            title="Sign Out"
                        >
                            <LogOut size={20} />
                        </button>

                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="flex-1 md:flex-none bg-slate-900 hover:bg-indigo-600 text-white px-8 py-3.5 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-xl shadow-indigo-100 active:scale-95"
                        >
                            <FileUp size={20} />
                            <span>Upload Document</span>
                        </button>
                    </div>
                </header>

                <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <StatCard
                        title="File Status"
                        value={stats.pending > 0 ? "In Review" : "All Clear"}
                        icon={<Clock size={24} className="text-amber-500" />}
                        bgColor="bg-amber-50"
                        desc={`${stats.pending} pending verification`}
                        accentColor="bg-amber-500"
                    />
                    <StatCard
                        title="Repository"
                        value={stats.total.toString().padStart(2, '0')}
                        icon={<CheckCircle size={24} className="text-indigo-500" />}
                        bgColor="bg-indigo-50"
                        desc={`${stats.verified} documents verified`}
                        accentColor="bg-indigo-500"
                    />
                    <StatCard
                        title="System Access"
                        value="Premium"
                        icon={<BookmarkCheck size={24} className="text-emerald-500" />}
                        bgColor="bg-emerald-50"
                        desc="Cloud sync active"
                        accentColor="bg-emerald-500"
                    />
                </section>

                <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden transition-all hover:shadow-md">
                    {/* Table Toolbar */}
                    <div className="p-6 md:p-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-1 bg-indigo-600 rounded-full" />
                            <h3 className="font-bold text-slate-900 text-xl">Submission History</h3>
                        </div>

                        <div className="relative w-full md:w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search documents..."
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Desktop Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                                <tr className="bg-slate-50/50 text-slate-400 text-[11px] uppercase tracking-[0.1em] font-black">
                                    <th className="px-8 py-5">Document & Source</th>
                                    <th className="px-8 py-5">Current Status</th>
                                    <th className="px-8 py-5">Official Remarks</th>
                                    <th className="px-8 py-5">Verification</th>
                                    <th className="px-8 py-5 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredDocs.length > 0 ? filteredDocs.map((doc) => (
                                    <tr key={doc._id} className="hover:bg-slate-50/80 transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="h-11 w-11 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-white group-hover:text-indigo-600 transition-all border border-transparent group-hover:border-slate-200 shadow-sm">
                                                    <FileText size={22} />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-slate-900 font-bold leading-tight">{doc.title}</span>
                                                    <span className="text-xs text-slate-400 mt-0.5">{doc.institute}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <StatusBadge status={doc.status} />
                                        </td>
                                        <td className="px-8 py-6">
                                            <p className="text-sm text-slate-500 italic max-w-[200px] truncate">
                                                {doc.remarks || "Processing update..."}
                                            </p>
                                        </td>
                                        <td className="px-8 py-6">
                                            {doc.verifySlip ? (
                                                <a
                                                    href={doc.verifySlip}
                                                    target="_blank"
                                                    className="inline-flex items-center gap-2 text-indigo-600 font-bold text-xs hover:underline decoration-2 underline-offset-4"
                                                >
                                                    <ExternalLink size={14} />
                                                    Download Slip
                                                </a>
                                            ) : (
                                                <span className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">Not Issued</span>
                                            )}
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <button className="p-2 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 rounded-lg text-slate-400 hover:text-indigo-600 transition-all">
                                                <MoreVertical size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={5} className="py-32 text-center">
                                            <div className="flex flex-col items-center gap-4 animate-in zoom-in-95 duration-500">
                                                <div className="h-20 w-20 rounded-full bg-slate-50 flex items-center justify-center border border-dashed border-slate-200">
                                                    <AlertCircle size={32} className="text-slate-200" />
                                                </div>
                                                <div className="space-y-1">
                                                    <h4 className="font-bold text-slate-900">No records found</h4>
                                                    <p className="text-slate-400 text-sm">Try adjusting your search or upload a new file.</p>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex justify-between items-center">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Secure Cloud Database • Last Sync: {new Date().toLocaleTimeString()}
                        </p>
                        {isSyncing && <Loader2 size={14} className="animate-spin text-indigo-500" />}
                    </div>
                </div>
            </div>
        </div>
    );
}


function StatusBadge({ status }: { status: Document['status'] }) {
    const config = {
        Verified: "bg-emerald-50 text-emerald-700 border-emerald-100",
        Rejected: "bg-rose-50 text-rose-700 border-rose-100",
        Pending: "bg-amber-50 text-amber-700 border-amber-100"
    };

    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${config[status]}`}>
            <span className={`h-1.5 w-1.5 rounded-full currentColor mb-[1px] ${status === 'Verified' ? 'bg-emerald-500' : status === 'Rejected' ? 'bg-rose-500' : 'bg-amber-500'}`} />
            {status}
        </span>
    );
}

function StatCard({ title, value, icon, bgColor, desc, accentColor }: any) {
    return (
        <div className="bg-white border border-slate-200 p-8 rounded-[2rem] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 group relative overflow-hidden">
            <div className={`absolute top-0 right-0 h-32 w-32 -mr-16 -mt-16 rounded-full ${accentColor} opacity-[0.03] group-hover:scale-110 transition-transform`} />

            <div className="flex justify-between items-start mb-8">
                <div className={`${bgColor} h-14 w-14 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-500`}>
                    {icon}
                </div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">System Protected</div>
            </div>

            <div className="space-y-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{title}</p>
                <h4 className="text-4xl font-black text-slate-900 tracking-tighter">{value}</h4>
                <div className="flex items-center gap-2 pt-3">
                    <Zap size={12} className={`${accentColor.replace('bg-', 'text-')} fill-current`} />
                    <p className="text-xs text-slate-500 font-medium">{desc}</p>
                </div>
            </div>
        </div>
    );
}