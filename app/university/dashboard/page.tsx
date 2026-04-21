"use client";
import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import {
    GraduationCap, Search, FileText, LayoutDashboard, Settings,
    LogOut, Eye, ShieldCheck, SearchCode, Loader2, CheckCircle2, AlertCircle, MessageSquare, Receipt, ExternalLink, Calendar, User, Fingerprint, Image as ImageIcon
} from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';

export default function UniversityDashboard() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [student, setStudent] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        toast.success("Security Session Ended");
        setTimeout(() => router.push('/login'), 800);
    };

    const handlePassportSearch = useCallback(async () => {
        if (!searchQuery.trim()) {
            toast.error("Please enter a valid passport number");
            return;
        }
        setLoading(true);
        try {
            const res = await api.post(`/university/search-student`, { passportNumber: searchQuery.trim() });

            if (res.data.success && res.data.data) {
                // --- DEBUGGING LOGS ---
                console.log("FULL STUDENT DATA:", res.data.data);
                if (res.data.data.documents) {
                    console.log("DOCUMENTS ARRAY:", res.data.data.documents);
                }
                // ----------------------

                setStudent(res.data.data);
                toast.success("Data Decrypted Successfully");
            } else {
                setStudent(null);
                toast.error(res.data.msg || "No record found");
            }
        } catch (err: any) {
            setStudent(null);
            const errorMsg = err.response?.data?.msg || "Student not found or access denied";
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    }, [searchQuery]);

    return (
        <div className="flex min-h-screen bg-[#fcfdfe] selection:bg-indigo-100 font-sans">
            <Toaster position="top-right" />

            {/* SIDEBAR */}
            <aside className="w-72 bg-slate-950 m-5 rounded-[2rem] flex flex-col p-8 text-white shadow-2xl hidden lg:flex border border-white/5">
                <div className="flex items-center gap-3 mb-12">
                    <div className="h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center">
                        <ShieldCheck size={22} />
                    </div>
                    <h2 className="text-lg font-black tracking-tighter italic">QUAL_CHECK</h2>
                </div>
                <nav className="space-y-2 flex-1">
                    <NavItem icon={<SearchCode size={18} />} label="Verification" active />
                    <NavItem icon={<LayoutDashboard size={18} />} label="Analytics" />
                    <NavItem icon={<Settings size={18} />} label="Access Keys" />
                </nav>
                <button onClick={handleLogout} className="flex items-center gap-3 text-slate-500 hover:text-rose-400 transition-all font-black text-[10px] uppercase tracking-widest px-4 py-2 hover:bg-rose-500/5 rounded-xl">
                    <LogOut size={16} /> Terminate
                </button>
            </aside>

            {/* MAIN CONTENT */}
            <main className="flex-1 p-6 lg:p-10 overflow-y-auto">
                <header className="mb-10 flex justify-between items-center">
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight italic">Portal Terminal</h1>
                        <p className="text-indigo-600 font-bold text-[10px] uppercase tracking-[0.3em]">University Authorization Required</p>
                    </div>
                    <div className="bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-full hidden sm:flex items-center gap-2">
                        <span className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse"></span>
                        <span className="text-emerald-600 font-black text-[9px] uppercase tracking-widest">Node: Active</span>
                    </div>
                </header>

                {/* SEARCH BAR */}
                <div className="max-w-5xl mb-12">
                    <div className="bg-white p-3 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 flex items-center gap-3">
                        <div className="h-14 w-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400">
                            {loading ? <Loader2 className="animate-spin" /> : <Fingerprint size={24} />}
                        </div>
                        <input
                            type="text"
                            placeholder="Enter Passport ID..."
                            className="flex-1 bg-transparent border-none outline-none text-lg font-black text-slate-800 placeholder:text-slate-200 tracking-widest uppercase"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handlePassportSearch()}
                        />
                        <button
                            onClick={handlePassportSearch}
                            disabled={loading}
                            className="bg-indigo-600 hover:bg-slate-900 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all disabled:opacity-50"
                        >
                            {loading ? 'Searching...' : 'Scan Database'}
                        </button>
                    </div>
                </div>

                {/* RESULTS GRID */}
                {student ? (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">

                        {/* ROW 1: CORE DATA (NAME & STATUS) */}
                        <div className="grid grid-cols-1 gap-6">
                            <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white flex flex-col md:flex-row items-center justify-between border border-white/5 relative overflow-hidden">
                                <div className="flex items-center gap-6 relative z-10">
                                    <div className="h-20 w-20 bg-indigo-500 rounded-3xl flex items-center justify-center text-3xl font-black rotate-3 shadow-2xl">
                                        {(student.fullName || student.name || 'S')[0]}
                                    </div>
                                    <div>
                                        <p className="text-indigo-400 font-black text-[9px] uppercase tracking-[0.3em] mb-1">Authenticated Student</p>
                                        <h2 className="text-3xl font-black italic tracking-tighter uppercase leading-none">
                                            {student.fullName || student.name}
                                        </h2>
                                        <div className="mt-3 flex gap-3">
                                            <span className="bg-white/5 border border-white/10 px-3 py-1 rounded-lg text-[9px] font-bold text-slate-400 tracking-widest uppercase">ID: {student.passportNumber}</span>
                                            <span className="bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-lg text-[9px] font-bold text-indigo-400 tracking-widest uppercase">{student.university || 'Registered Institute'}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-6 md:mt-0 text-right z-10">
                                    <div className={`px-8 py-3 rounded-2xl border ${student.isAuthentic !== false ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
                                        <p className="text-[16px] font-black italic uppercase flex items-center gap-2">
                                            {student.isAuthentic !== false ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                                            {student.isAuthentic !== false ? 'Identity Verified' : 'Pending Verification'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ROW 2: DOCUMENTS & SYSTEM REMARKS */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2 space-y-4">
                                <div className="flex items-center gap-3 mb-2 px-2">
                                    <FileText className="text-indigo-600" size={20} />
                                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-700">Digital Credentials</h3>
                                </div>
                                {student.documents && student.documents.length > 0 ? (
                                    student.documents.map((doc: any, i: number) => {

                                        // MASTER SLIP RESOLVER: Checks all potential fields in document and student object
                                        const adminSlipUrl =
                                            doc.verifySlip ||
                                            doc.verificationImg ||
                                            doc.adminScreenshot ||
                                            doc.adminSlip ||
                                            student.adminScreenshot ||
                                            student.verifySlip ||
                                            student.slipUrl;

                                        return (
                                            <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:border-indigo-200 transition-all group">
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className="h-14 w-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-all">
                                                            <FileText size={24} />
                                                        </div>
                                                        <div>
                                                            <p className="font-black text-slate-800 text-base italic uppercase tracking-tight">{doc.title || doc.name || `Document ${i + 1}`}</p>
                                                            <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">{doc.status || 'Verified'}</p>
                                                        </div>
                                                    </div>

                                                    <div className="flex gap-2">
                                                        {/* SYNCED ADMIN SLIP LOGIC */}
                                                        {adminSlipUrl ? (
                                                            <a
                                                                href={adminSlipUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="h-11 px-6 bg-emerald-500 text-white rounded-xl flex items-center justify-center gap-2 hover:bg-emerald-600 transition-all font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-200"
                                                            >
                                                                <ImageIcon size={16} /> View Admin Slip
                                                            </a>
                                                        ) : (
                                                            <div className="h-11 px-4 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center text-[9px] font-bold uppercase border border-dashed border-slate-200">
                                                                Slip Not Linked
                                                            </div>
                                                        )}

                                                        {/* MAIN DOCUMENT PREVIEW */}
                                                        <a
                                                            href={doc.fileUrl || doc.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="h-11 px-6 bg-slate-900 text-white rounded-xl flex items-center justify-center gap-2 hover:bg-indigo-600 transition-all font-black text-[10px] uppercase tracking-widest"
                                                        >
                                                            <Eye size={16} /> Preview Doc
                                                        </a>
                                                    </div>
                                                </div>

                                                {/* DOCUMENT REMARKS */}
                                                <div className="mt-4 pt-4 border-t border-slate-50 flex gap-3 items-start">
                                                    <div className="mt-1">
                                                        <MessageSquare size={14} className="text-indigo-400" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[9px] font-black uppercase tracking-[0.1em] text-slate-400 mb-1">Verification Note:</p>
                                                        <p className="text-xs text-slate-500 font-medium italic leading-relaxed">
                                                            {doc.remarks || doc.comment || doc.adminNote || "The document has been verified by the authority and found authentic."}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="bg-slate-50 rounded-3xl py-12 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 text-slate-400 font-bold text-xs uppercase tracking-widest">
                                        No Verified Records Found
                                    </div>
                                )}
                            </div>

                            {/* GLOBAL PROFILE REMARKS */}
                            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col h-fit sticky top-6">
                                <div className="flex items-center gap-3 mb-6">
                                    <ShieldCheck className="text-indigo-600" size={20} />
                                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-700">Audit Summary</h3>
                                </div>
                                <div className="flex-1 bg-slate-50 p-5 rounded-2xl border-l-4 border-indigo-500 italic text-slate-600 text-sm leading-relaxed">
                                    "{student.remarks || "Overall student profile is active in the central registry."}"
                                </div>
                                <div className="mt-6 pt-6 border-t border-slate-100 flex items-center gap-2 text-slate-400">
                                    <Calendar size={14} />
                                    <span className="text-[9px] font-black uppercase tracking-widest">Verification Date: {new Date().toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-40 opacity-20 border-4 border-dashed border-slate-200 rounded-[3rem]">
                        <SearchCode size={60} className="mb-4 animate-pulse" />
                        <p className="text-2xl font-black italic uppercase tracking-[0.2em]">Ready for Decryption</p>
                    </div>
                )}
            </main>
        </div>
    );
}

function NavItem({ icon, label, active = false }: any) {
    return (
        <div className={`flex items-center gap-4 px-6 py-4 rounded-2xl cursor-pointer transition-all ${active ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/20' : 'text-slate-500 hover:bg-white/5 hover:text-white'}`}>
            {icon}
            <span className="font-black text-[10px] uppercase tracking-widest">{label}</span>
        </div>
    );
}