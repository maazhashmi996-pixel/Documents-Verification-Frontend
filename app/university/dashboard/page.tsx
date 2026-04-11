"use client";
import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation'; // Logout redirection ke liye
import api from '@/lib/api';
import {
    GraduationCap, Search, FileText, LayoutDashboard, Settings,
    LogOut, Eye, ShieldCheck, SearchCode, Loader2
} from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';

export default function UniversityDashboard() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [student, setStudent] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    // --- LOGOUT LOGIC ---
    const handleLogout = () => {
        try {
            // Saara sensitive data clear karein
            localStorage.removeItem('token');
            localStorage.removeItem('user');

            toast.success("Security Session Ended");

            // Chootay se delay ke baad redirect (VIP experience)
            setTimeout(() => {
                router.push('/login');
                router.refresh(); // State clear karne ke liye
            }, 800);
        } catch (err) {
            toast.error("Logout failed");
        }
    };

    // --- PASSPORT SEARCH LOGIC ---
    const handlePassportSearch = useCallback(async () => {
        if (!searchQuery.trim()) {
            toast.error("Please enter a valid passport number");
            return;
        }
        setLoading(true);
        try {
            const res = await api.get(`/university/verify-passport?passport=${searchQuery}`);
            if (res.data.success) {
                setStudent(res.data.student);
                toast.success("Identity Decrypted Successfully");
            } else {
                setStudent(null);
                toast.error("No record found in secure database");
            }
        } catch (err) {
            setStudent(null);
            toast.error("Verification server timeout");
        } finally {
            setLoading(false);
        }
    }, [searchQuery]);

    return (
        <div className="flex min-h-screen bg-[#f8fafc] selection:bg-indigo-100">
            <Toaster position="top-right" />

            {/* SIDEBAR */}
            <aside className="w-80 bg-slate-950 m-5 rounded-[2.5rem] flex flex-col p-10 text-white shadow-2xl hidden lg:flex border border-white/5">
                <div className="flex items-center gap-4 mb-16">
                    <div className="h-12 w-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                        <ShieldCheck size={28} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black tracking-tighter italic">QUAL_CHECK</h2>
                        <p className="text-[10px] text-indigo-400 font-bold tracking-[0.3em] uppercase">Auth Terminal</p>
                    </div>
                </div>

                <nav className="space-y-4 flex-1">
                    <NavItem icon={<SearchCode size={20} />} label="Passport Lookup" active />
                    <NavItem icon={<LayoutDashboard size={20} />} label="System Stats" />
                    <NavItem icon={<Settings size={20} />} label="Configurations" />
                </nav>

                {/* LOGOUT BUTTON - FIXED */}
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 text-slate-500 hover:text-rose-400 transition-all font-black text-xs uppercase tracking-widest group px-4 py-2 hover:bg-rose-500/10 rounded-xl"
                >
                    <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
                    Terminate Session
                </button>
            </aside>

            {/* MAIN CONTENT */}
            <main className="flex-1 p-6 lg:p-12 overflow-y-auto">
                <header className="mb-12 flex justify-between items-end">
                    <div>
                        <p className="text-indigo-600 font-black text-xs uppercase tracking-[0.4em] mb-2">Authenticated University Access</p>
                        <h1 className="text-5xl font-black text-slate-900 tracking-tight italic">Secure Verification</h1>
                    </div>

                    <div className="text-right hidden sm:block">
                        <div className="bg-white px-6 py-3 rounded-2xl shadow-sm border border-slate-100">
                            <p className="text-slate-400 font-bold text-[9px] uppercase tracking-widest mb-1">System Health</p>
                            <p className="text-emerald-500 font-black text-xs flex items-center justify-end gap-2">
                                <span className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse"></span> Encrypted & Active
                            </p>
                        </div>
                    </div>
                </header>

                {/* SEARCH BAR */}
                <div className="max-w-4xl mx-auto mb-16">
                    <div className="bg-white p-4 rounded-[2.5rem] shadow-2xl shadow-slate-200 border border-slate-100 flex items-center gap-4 group focus-within:ring-4 focus-within:ring-indigo-500/5 transition-all">
                        <div className="h-16 w-16 bg-slate-50 rounded-[1.8rem] flex items-center justify-center text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                            {loading ? <Loader2 className="animate-spin" size={30} /> : <Search size={30} strokeWidth={3} />}
                        </div>
                        <input
                            type="text"
                            placeholder="Scan Passport Number..."
                            className="flex-1 bg-transparent border-none outline-none text-xl font-black text-slate-800 placeholder:text-slate-200 tracking-widest uppercase"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handlePassportSearch()}
                        />
                        <button
                            onClick={handlePassportSearch}
                            disabled={loading}
                            className="bg-slate-900 hover:bg-indigo-600 text-white px-10 py-5 rounded-[1.8rem] font-black uppercase tracking-widest text-xs transition-all active:scale-95 disabled:opacity-50 shadow-xl shadow-slate-200"
                        >
                            {loading ? 'Processing...' : 'Search Record'}
                        </button>
                    </div>
                </div>

                {/* RESULT SECTION */}
                <div className="max-w-6xl mx-auto">
                    {student ? (
                        <div className="animate-in fade-in slide-in-from-bottom-10 duration-700">
                            {/* STUDENT CARD */}
                            <div className="bg-slate-900 rounded-[3rem] p-10 text-white flex flex-col md:flex-row justify-between items-center gap-8 mb-10 border border-white/5 shadow-2xl shadow-indigo-900/20 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-10">
                                    <GraduationCap size={120} />
                                </div>
                                <div className="flex items-center gap-8 relative z-10">
                                    <div className="h-24 w-24 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-4xl font-black shadow-2xl rotate-3">
                                        {student.name[0]}
                                    </div>
                                    <div>
                                        <h2 className="text-4xl font-black italic tracking-tighter mb-2 uppercase">{student.name}</h2>
                                        <div className="flex gap-4">
                                            <span className="bg-white/10 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
                                                ID: {student._id.slice(-8).toUpperCase()}
                                            </span>
                                            <span className="bg-indigo-500/20 text-indigo-300 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-500/20">
                                                PASSPORT: {student.passportNumber}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-center md:text-right relative z-10">
                                    <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em] mb-1">Status</p>
                                    <div className="px-6 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                                        <h3 className="text-xl font-black text-emerald-400 italic uppercase tracking-tighter">Verified Profile</h3>
                                    </div>
                                </div>
                            </div>

                            {/* DOCS VAULT */}
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-2xl font-black text-slate-800 italic flex items-center gap-3 uppercase tracking-tighter">
                                    <FileText className="text-indigo-600" /> Digital Credentials
                                </h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Found {student.documents?.length || 0} Files</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {student.documents?.map((doc: any, index: number) => (
                                    <div key={index} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center justify-between group hover:shadow-2xl hover:border-indigo-200 transition-all duration-500">
                                        <div className="flex items-center gap-6">
                                            <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
                                                <FileText className="text-slate-300 group-hover:text-indigo-600 transition-colors" size={28} />
                                            </div>
                                            <div>
                                                <p className="font-black text-slate-800 text-lg italic uppercase tracking-tight">{doc.name}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full"></span>
                                                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Admin Approved</p>
                                                </div>
                                            </div>
                                        </div>
                                        <a
                                            href={doc.url}
                                            target="_blank"
                                            className="h-14 w-14 bg-slate-900 text-white rounded-[1.2rem] flex items-center justify-center hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200 hover:-translate-y-1"
                                        >
                                            <Eye size={22} />
                                        </a>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-32 opacity-20 border-4 border-dashed border-slate-200 rounded-[4rem]">
                            <SearchCode size={80} className="mb-6 animate-pulse" />
                            <p className="text-3xl font-black italic uppercase tracking-[0.3em]">Awaiting Authorization</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

// Sub-components
function NavItem({ icon, label, active = false }: any) {
    return (
        <div className={`flex items-center gap-4 px-8 py-5 rounded-[1.8rem] cursor-pointer transition-all ${active ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-500/40' : 'text-slate-500 hover:bg-white/5 hover:text-white'}`}>
            {icon}
            <span className="font-black text-[11px] uppercase tracking-[0.2em]">{label}</span>
        </div>
    );
}