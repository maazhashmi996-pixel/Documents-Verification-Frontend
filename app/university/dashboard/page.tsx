"use client";
import React, { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import {
    GraduationCap, UserCheck, Clock, Download,
    Search, FileText, LayoutDashboard, Settings, LogOut
} from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';

export default function UniversityDashboard() {
    const [stats, setStats] = useState<any>(null);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchUniData = useCallback(async () => {
        setLoading(true);
        try {
            // Backend par naya route banana parega: /api/university/data
            const res = await api.get(`/university/data?search=${searchQuery}`);
            setStats(res.data.stats);
            setStudents(res.data.students);
        } catch (err) {
            toast.error("Failed to sync University data");
        } finally {
            setLoading(false);
        }
    }, [searchQuery]);

    useEffect(() => {
        const timer = setTimeout(fetchUniData, 400);
        return () => clearTimeout(timer);
    }, [fetchUniData]);

    return (
        <div className="flex min-h-screen bg-[#f0f2f5]">
            <Toaster position="top-right" />

            {/* LEFT SIDEBAR (VIP STYLE) */}
            <aside className="w-72 bg-slate-900 m-4 rounded-[2rem] flex flex-col p-8 text-white shadow-2xl hidden xl:flex">
                <div className="flex items-center gap-3 mb-12">
                    <div className="h-10 w-10 bg-indigo-500 rounded-xl flex items-center justify-center">
                        <GraduationCap size={24} />
                    </div>
                    <h2 className="text-xl font-black tracking-tighter">UNI_PORTAL</h2>
                </div>

                <nav className="space-y-4 flex-1">
                    <NavItem icon={<LayoutDashboard size={20} />} label="Overview" active />
                    <NavItem icon={<UserCheck size={20} />} label="Enrolled Students" />
                    <NavItem icon={<FileText size={20} />} label="Documents" />
                    <NavItem icon={<Settings size={20} />} label="Settings" />
                </nav>

                <button className="flex items-center gap-3 text-slate-400 hover:text-white transition-all font-bold text-sm">
                    <LogOut size={20} /> Logout
                </button>
            </aside>

            <main className="flex-1 p-4 md:p-8 overflow-y-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">University Dashboard</h1>
                        <p className="text-slate-500 font-bold">Welcome back, Managing Director</p>
                    </div>

                    <button className="bg-white border-2 border-slate-200 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all flex items-center gap-2">
                        <Download size={16} /> Export Reports
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <UniStatCard title="Total Enrollments" value={stats?.total || '0'} icon={<UsersIcon />} color="indigo" />
                    <UniStatCard title="Active Students" value={stats?.active || '0'} icon={<CheckIcon />} color="emerald" />
                    <UniStatCard title="Pending Review" value={stats?.pending || '0'} icon={<ClockIcon />} color="amber" />
                </div>

                {/* STUDENT DIRECTORY (FULL WIDTH) */}
                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-8 border-b border-slate-50 flex justify-between items-center">
                        <h3 className="text-xl font-black text-slate-800 italic">Registered Students</h3>
                        <div className="relative w-72">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search students..."
                                className="w-full bg-slate-50 border-none rounded-2xl py-3 pl-12 pr-4 text-sm font-bold focus:ring-2 focus:ring-indigo-500/10 outline-none"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto px-4 pb-4">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-slate-400 text-[10px] uppercase tracking-[0.2em]">
                                    <th className="px-6 py-6 font-black">Student</th>
                                    <th className="px-6 py-6 font-black">Major/Course</th>
                                    <th className="px-6 py-6 font-black text-center">Status</th>
                                    <th className="px-6 py-6 font-black text-right">Documents</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {students.length > 0 ? students.map((s: any) => (
                                    <tr key={s._id} className="hover:bg-slate-50/50 transition-all group">
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="h-12 w-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-lg">
                                                    {s.name[0]}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-black text-slate-800">{s.name}</span>
                                                    <span className="text-xs text-slate-400 font-medium">ID: {s.studentId || 'N/A'}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="font-bold text-slate-600 text-sm">{s.course || 'Under Review'}</span>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <span className="px-4 py-1.5 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                                                Enrolled
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <button className="h-10 w-10 bg-slate-100 hover:bg-slate-900 hover:text-white rounded-xl transition-all inline-flex items-center justify-center">
                                                <FileText size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={4} className="py-20 text-center font-black text-slate-300 uppercase tracking-widest italic">
                                            No Students Linked Yet
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
}

// Sub-components
function NavItem({ icon, label, active = false }: any) {
    return (
        <div className={`flex items-center gap-4 px-6 py-4 rounded-2xl cursor-pointer transition-all ${active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
            {icon}
            <span className="font-bold text-sm">{label}</span>
        </div>
    );
}

function UniStatCard({ title, value, icon, color }: any) {
    const themes: any = {
        indigo: 'text-indigo-600 bg-indigo-100/50',
        emerald: 'text-emerald-600 bg-emerald-100/50',
        amber: 'text-amber-600 bg-amber-100/50',
    };
    return (
        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 flex items-center justify-between group hover:shadow-xl transition-all cursor-default">
            <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{title}</p>
                <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{value}</h3>
            </div>
            <div className={`h-14 w-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 group-hover:rotate-6 ${themes[color]}`}>
                {icon}
            </div>
        </div>
    );
}

// Icons for stats
const UsersIcon = () => <div className="p-2 bg-indigo-600 rounded-lg text-white"><GraduationCap size={20} /></div>;
const CheckIcon = () => <div className="p-2 bg-emerald-600 rounded-lg text-white"><UserCheck size={20} /></div>;
const ClockIcon = () => <div className="p-2 bg-amber-600 rounded-lg text-white"><Clock size={20} /></div>;