"use client";

import React, { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import {
    ShieldCheck, SearchCode, LayoutDashboard, Settings,
    LogOut, Eye, Loader2, CheckCircle2, AlertCircle,
    MessageSquare, Calendar, Fingerprint, Image as ImageIcon,
    FileText, User, ChevronRight, XCircle
} from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';

// --- PRODUCTION INTERFACES ---
interface Document {
    title?: string;
    name?: string;
    status?: 'Pending' | 'Verified' | 'Rejected';
    fileUrl?: string;
    url?: string;
    verifySlip?: string;
    verificationImg?: string;
    adminScreenshot?: string;
    adminSlip?: string;
    remarks?: string;
    comment?: string;
    adminNote?: string;
}

interface StudentData {
    fullName?: string;
    name?: string;
    passportNumber: string;
    university?: string;
    isAuthentic?: boolean;
    documents?: Document[];
    remarks?: string;
    adminScreenshot?: string;
    verifySlip?: string;
    slipUrl?: string;
}

export default function UniversityDashboard() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [student, setStudent] = useState<StudentData | null>(null);
    const [loading, setLoading] = useState(false);

    // Optimized Session Management
    const handleLogout = useCallback(() => {
        localStorage.clear();
        toast.success("Security Session Ended");
        setTimeout(() => router.replace('/login'), 500);
    }, [router]);

    // Enhanced Search Logic
    const handlePassportSearch = useCallback(async () => {
        const query = searchQuery.trim().toUpperCase();
        if (!query) {
            toast.error("Please enter a valid passport number");
            return;
        }

        setLoading(true);
        setStudent(null);

        try {
            const res = await api.post(`/university/search-student`, { passportNumber: query });

            if (res.data.success && res.data.data) {
                setStudent(res.data.data);
                toast.success("Identity Records Decrypted");
            } else {
                toast.error(res.data.msg || "No record matching this ID");
            }
        } catch (err: any) {
            const errorMsg = err.response?.data?.msg || "Network Error: Access Denied";
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    }, [searchQuery]);

    const verificationDate = useMemo(() => new Date().toLocaleDateString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric'
    }), []);

    return (
        <div className="flex min-h-screen bg-[#F8FAFC] selection:bg-indigo-100 font-sans antialiased text-slate-900">
            <Toaster position="top-right" reverseOrder={false} />

            <aside className="w-72 bg-[#020617] m-5 rounded-[2.5rem] flex flex-col p-8 text-white shadow-2xl hidden lg:flex border border-white/5 shrink-0 sticky top-5 h-[calc(100vh-40px)]">
                <div className="flex items-center gap-3 mb-12 px-2">
                    <div className="h-11 w-11 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                        <ShieldCheck size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black tracking-tighter italic leading-tight">QUAL_CHECK</h2>
                        <span className="text-[8px] text-indigo-400 font-bold uppercase tracking-[0.2em]">Authority Node</span>
                    </div>
                </div>

                <nav className="space-y-2 flex-1">
                    <NavItem icon={<SearchCode size={18} />} label="Verification" active />
                    <NavItem icon={<LayoutDashboard size={18} />} label="Analytics" />
                    <NavItem icon={<Settings size={18} />} label="System Access" />
                </nav>

                <button
                    onClick={handleLogout}
                    className="group flex items-center gap-3 text-slate-500 hover:text-rose-400 transition-all font-black text-[10px] uppercase tracking-widest px-6 py-4 hover:bg-rose-500/5 rounded-2xl border border-transparent hover:border-rose-500/10"
                >
                    <LogOut size={16} className="group-hover:-translate-x-1 transition-transform" />
                    Terminate Session
                </button>
            </aside>

            {/* MAIN CONTENT */}
            <main className="flex-1 p-6 lg:p-12 overflow-y-auto">
                <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight italic">Terminal Access</h1>
                        <p className="text-indigo-600 font-bold text-[10px] uppercase tracking-[0.3em] mt-1">LHR-NODE-402 // UNIVERSITY AUTH_REQ</p>
                    </div>
                    <div className="bg-emerald-500/10 border border-emerald-500/20 px-5 py-2.5 rounded-full flex items-center gap-3">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span className="text-emerald-700 font-black text-[10px] uppercase tracking-widest">System Online</span>
                    </div>
                </header>

                {/* SEARCH INTERFACE */}
                <div className="max-w-4xl mb-12">
                    <div className="bg-white p-2 rounded-[2rem] shadow-2xl shadow-slate-200/60 border border-slate-100 flex items-center gap-2 group transition-all focus-within:ring-4 focus-within:ring-indigo-500/5">
                        <div className="h-14 w-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                            {loading ? <Loader2 className="animate-spin" size={22} /> : <Fingerprint size={26} />}
                        </div>
                        <input
                            type="text"
                            placeholder="Enter Passport ID (e.g. AB123456)"
                            className="flex-1 bg-transparent border-none outline-none text-lg font-bold text-slate-800 placeholder:text-slate-300 tracking-widest uppercase px-2"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handlePassportSearch()}
                        />
                        <button
                            onClick={handlePassportSearch}
                            disabled={loading || !searchQuery}
                            className="bg-indigo-600 hover:bg-slate-900 text-white px-10 py-4 rounded-[1.4rem] font-black uppercase tracking-widest text-[11px] transition-all disabled:opacity-30 shadow-lg shadow-indigo-200 active:scale-95"
                        >
                            {loading ? 'Decrypting...' : 'Scan Matrix'}
                        </button>
                    </div>
                </div>

                {/* RESULTS AREA */}
                {student ? (
                    <div className="animate-in fade-in slide-in-from-bottom-6 duration-700 space-y-8">

                        {/* PROFILE CARD */}
                        <div className="bg-slate-950 rounded-[3rem] p-10 text-white flex flex-col md:flex-row items-center justify-between border border-white/10 relative overflow-hidden shadow-2xl">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 blur-[100px] -z-0"></div>

                            <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                                <div className="h-24 w-24 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-[2rem] flex items-center justify-center text-4xl font-black rotate-6 shadow-2xl border-4 border-white/10">
                                    {(student.fullName || student.name || '?')[0]}
                                </div>
                                <div className="text-center md:text-left">
                                    <p className="text-indigo-400 font-black text-[10px] uppercase tracking-[0.4em] mb-2">Authenticated Profile</p>
                                    <h2 className="text-4xl font-black italic tracking-tighter uppercase leading-none mb-4">
                                        {student.fullName || student.name}
                                    </h2>
                                    <div className="flex flex-wrap justify-center md:justify-start gap-3">
                                        <div className="bg-white/5 backdrop-blur-md border border-white/10 px-4 py-1.5 rounded-xl text-[10px] font-bold text-slate-300 tracking-widest uppercase flex items-center gap-2">
                                            <User size={12} className="text-indigo-400" /> {student.passportNumber}
                                        </div>
                                        <div className="bg-white/5 backdrop-blur-md border border-white/10 px-4 py-1.5 rounded-xl text-[10px] font-bold text-slate-300 tracking-widest uppercase">
                                            {student.university || 'Global Institute'}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 md:mt-0 relative z-10">
                                <div className={`px-10 py-4 rounded-[1.8rem] border-2 shadow-2xl backdrop-blur-sm ${student.isAuthentic !== false ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-400'}`}>
                                    <p className="text-lg font-black italic uppercase flex items-center gap-3">
                                        {student.isAuthentic !== false ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
                                        {student.isAuthentic !== false ? 'Verified' : 'Flagged'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* CONTENT GRID */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                            {/* DOCUMENTS COLUMN */}
                            <div className="lg:col-span-8 space-y-6">
                                <h3 className="flex items-center gap-3 text-xs font-black uppercase tracking-[0.3em] text-slate-400 px-2">
                                    <FileText size={18} className="text-indigo-600" /> Secure Credentials
                                </h3>

                                {student.documents && student.documents.length > 0 ? (
                                    student.documents.map((doc, i) => {
                                        const adminSlipUrl = doc.verifySlip || doc.verificationImg || doc.adminScreenshot || doc.adminSlip || student.adminScreenshot || student.verifySlip || student.slipUrl;
                                        const isRejected = doc.status === 'Rejected';

                                        return (
                                            <div key={i} className={`bg-white p-8 rounded-[2.5rem] border ${isRejected ? 'border-rose-100 shadow-rose-50' : 'border-slate-100 shadow-sm'} hover:shadow-xl hover:border-indigo-100 transition-all group`}>
                                                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                                                    <div className="flex items-center gap-5">
                                                        <div className={`h-16 w-16 ${isRejected ? 'bg-rose-50 text-rose-300' : 'bg-slate-50 text-slate-300'} rounded-2xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner`}>
                                                            <FileText size={28} />
                                                        </div>
                                                        <div>
                                                            <p className="font-black text-slate-900 text-lg italic uppercase tracking-tight leading-none mb-1">
                                                                {doc.title || doc.name || `Asset-0${i + 1}`}
                                                            </p>
                                                            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${isRejected ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-500'}`}>
                                                                {doc.status || 'System Verified'}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-wrap gap-3">
                                                        {adminSlipUrl && (
                                                            <a href={adminSlipUrl} target="_blank" rel="noopener noreferrer"
                                                                className="flex-1 sm:flex-none h-12 px-6 bg-emerald-500 text-white rounded-xl flex items-center justify-center gap-2 hover:bg-emerald-600 transition-all font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-200">
                                                                <ImageIcon size={16} /> Admin Proof
                                                            </a>
                                                        )}
                                                        <a href={doc.fileUrl || doc.url} target="_blank" rel="noopener noreferrer"
                                                            className="flex-1 sm:flex-none h-12 px-6 bg-slate-900 text-white rounded-xl flex items-center justify-center gap-2 hover:bg-indigo-600 transition-all font-black text-[10px] uppercase tracking-widest shadow-lg shadow-slate-200">
                                                            <Eye size={16} /> View Original
                                                        </a>
                                                    </div>
                                                </div>

                                                <div className="mt-6 pt-6 border-t border-slate-50 flex gap-4 items-start">
                                                    <div className={`mt-1 ${isRejected ? 'bg-rose-50' : 'bg-indigo-50'} p-2 rounded-lg`}>
                                                        {isRejected ? <XCircle size={16} className="text-rose-600" /> : <MessageSquare size={16} className="text-indigo-600" />}
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Authority Remarks:</p>
                                                        <p className={`text-sm font-medium italic leading-relaxed p-4 rounded-2xl border ${isRejected ? 'bg-rose-50/30 border-rose-100 text-rose-700' : 'bg-slate-50/50 border-slate-100 text-slate-600'}`}>
                                                            "{doc.remarks || doc.comment || doc.adminNote || (isRejected ? "The document failed the verification check." : "The digital asset has been successfully cross-referenced with the physical registry.")}"
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="bg-white rounded-[3rem] py-24 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 text-slate-300">
                                        <SearchCode size={48} className="mb-4 opacity-20" />
                                        <p className="font-black text-xs uppercase tracking-[0.3em]">No Document Trace Found</p>
                                    </div>
                                )}
                            </div>

                            {/* SIDE INFO COLUMN */}
                            <div className="lg:col-span-4 space-y-6">
                                <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col sticky top-8">
                                    <div className="flex items-center gap-3 mb-8">
                                        <div className="h-10 w-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                                            <ShieldCheck size={20} />
                                        </div>
                                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 italic">Audit Summary</h3>
                                    </div>

                                    <div className="relative group">
                                        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur opacity-10 group-hover:opacity-20 transition duration-1000"></div>
                                        <div className="relative bg-slate-50 p-6 rounded-2xl border-l-4 border-indigo-600 italic text-slate-700 text-sm leading-relaxed">
                                            "{student.remarks || "Global verification status: ACTIVE. The candidate's credentials have been updated in the decentralized registry."}"
                                        </div>
                                    </div>

                                    <div className="mt-10 space-y-4">
                                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                                            <span className="text-[9px] font-black text-slate-400 uppercase">Ver. Date</span>
                                            <span className="text-[11px] font-bold text-slate-900 flex items-center gap-2">
                                                <Calendar size={14} className="text-indigo-500" /> {verificationDate}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                                            <span className="text-[9px] font-black text-slate-400 uppercase">Node ID</span>
                                            <span className="text-[11px] font-bold text-slate-900 uppercase">SSL-ENCRYPTED</span>
                                        </div>
                                    </div>

                                    <button className="mt-8 w-full py-4 bg-slate-950 text-white rounded-[1.4rem] font-black text-[10px] uppercase tracking-[0.2em] hover:bg-indigo-600 transition-colors shadow-lg active:scale-[0.98]">
                                        Download Audit Log
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* EMPTY STATE */
                    <div className="flex flex-col items-center justify-center py-48 opacity-40 border-4 border-dashed border-slate-100 rounded-[4rem]">
                        <div className="relative mb-6">
                            <SearchCode size={80} className="text-slate-200 animate-pulse" />
                            <div className="absolute inset-0 bg-indigo-500/20 blur-3xl rounded-full"></div>
                        </div>
                        <p className="text-2xl font-black italic uppercase tracking-[0.3em] text-slate-300 text-center">
                            Awaiting Identity Input<br />
                            <span className="text-sm not-italic font-bold tracking-widest opacity-50">System ready for real-time verification</span>
                        </p>
                    </div>
                )}
            </main>
        </div>
    );
}

// NavItem Component - Isolated for cleaner main component
function NavItem({ icon, label, active = false }: { icon: React.ReactNode, label: string, active?: boolean }) {
    return (
        <div className={`flex items-center gap-4 px-6 py-4 rounded-2xl cursor-pointer transition-all duration-300 group ${active
            ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-500/40'
            : 'text-slate-500 hover:bg-white/5 hover:text-white'
            }`}>
            <div className={`${active ? 'scale-110' : 'group-hover:scale-110'} transition-transform`}>
                {icon}
            </div>
            <span className="font-black text-[10px] uppercase tracking-widest">{label}</span>
            {active && <ChevronRight size={14} className="ml-auto opacity-50" />}
        </div>
    );
}