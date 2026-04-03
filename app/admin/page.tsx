"use client";
import React, { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import {
    Users, School, Wallet, Search, Clock,
    CheckCircle2, Trash2, Eye, ShieldCheck,
    ArrowUpRight, LogOut, Bell, Building2, GraduationCap
} from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function AdminVIPDashboard() {
    const router = useRouter();
    const [filter, setFilter] = useState('week');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<any>(null);
    const [users, setUsers] = useState([]); // Changed from students to users for clarity

    const fetchAdminData = useCallback(async () => {
        setLoading(true);
        try {
            // Updated Endpoint: Dono roles ka data fetch hoga
            const [statsRes, usersRes] = await Promise.all([
                api.get(`/admin/stats?period=${filter}`),
                api.get(`/admin/students?search=${searchQuery}`)
            ]);
            setStats(statsRes.data);
            setUsers(usersRes.data);
        } catch (err) {
            toast.error("Sync Failed");
        } finally {
            setLoading(false);
        }
    }, [filter, searchQuery]);

    useEffect(() => {
        const timer = setTimeout(fetchAdminData, 400);
        return () => clearTimeout(timer);
    }, [fetchAdminData]);

    const handleApprove = async (id: string) => {
        try {
            await api.put(`/admin/approve/${id}`);
            toast.success("Approved Successfully!");
            fetchAdminData();
        } catch (err) { toast.error("Approval Failed"); }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure? This will permanently remove the user.")) return;
        try {
            // Path corrected to match backend update: /admin/user/:id
            await api.delete(`/admin/user/${id}`);
            toast.success("User Removed");
            fetchAdminData();
        } catch (err) { toast.error("Delete Failed"); }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        toast.success("Logging out...");
        setTimeout(() => {
            router.push('/login');
        }, 1000);
    };

    return (
        <div className="w-full min-h-screen bg-[#f4f7fe] p-4 md:p-8 font-sans text-slate-900">
            <Toaster position="top-right" />

            {/* FULL WIDTH HEADER */}
            <div className="w-full mb-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="h-14 w-14 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-200">
                        <ShieldCheck className="text-white" size={28} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight italic uppercase">VIP CRM SYSTEM</h1>
                        <p className="text-slate-400 font-bold text-sm tracking-widest uppercase">Central Command Center</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100">
                        {['day', 'week', 'month', 'all'].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${filter === f ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-3">
                        <button className="h-12 w-12 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-all shadow-sm">
                            <Bell size={20} />
                        </button>
                        <button
                            onClick={handleLogout}
                            className="h-12 px-6 bg-rose-50 text-rose-600 border border-rose-100 rounded-2xl flex items-center gap-2 font-black text-xs uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all shadow-sm group"
                        >
                            <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
                            Logout
                        </button>
                    </div>
                </div>
            </div>

            {/* WIDE STATS CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
                <StatCard title="Total Students" value={stats?.totalStudents} icon={<Users size={22} />} color="blue" loading={loading} />
                <StatCard title="Partner Universities" value={stats?.totalUniversities} icon={<School size={22} />} color="indigo" loading={loading} />
                <StatCard title="Total Revenue" value={`PKR ${stats?.totalRevenue?.toLocaleString()}`} icon={<Wallet size={22} />} color="emerald" loading={loading} />
                <StatCard title="Pending Approvals" value={stats?.pendingApprovals} icon={<Clock size={22} />} color="amber" loading={loading} />
            </div>

            {/* FULL SCREEN TABLE CONTAINER */}
            <div className="bg-white border border-slate-100 rounded-[2.5rem] shadow-xl shadow-slate-200/50 overflow-hidden">
                <div className="px-10 py-8 border-b border-slate-50 flex flex-col xl:flex-row justify-between items-center gap-6 bg-gradient-to-r from-white to-slate-50/50">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-1 rounded-full bg-indigo-600" />
                        <div>
                            <h3 className="text-xl font-black text-slate-800 tracking-tight">System User Directory</h3>
                            <p className="text-xs text-slate-400 font-bold uppercase">Students & University Partners</p>
                        </div>
                    </div>

                    <div className="relative w-full xl:w-[450px] group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="Search Name, Email, Passport or Institute..."
                            className="w-full bg-slate-100/50 border border-transparent rounded-2xl py-4 pl-12 pr-4 text-sm outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-200 transition-all font-bold placeholder:text-slate-400"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/30 text-slate-400 text-[11px] uppercase tracking-[0.2em] border-b border-slate-100">
                                <th className="px-10 py-6 font-black">User Profile</th>
                                <th className="px-10 py-6 font-black">Role / Identity</th>
                                <th className="px-10 py-6 font-black">Approval Status</th>
                                <th className="px-10 py-6 font-black text-right">System Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {users.length > 0 ? users.map((u: any) => (
                                <tr key={u._id} className="hover:bg-indigo-50/20 transition-all group">
                                    <td className="px-10 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className={`h-14 w-14 rounded-2xl bg-white border-2 border-slate-100 flex items-center justify-center font-black text-lg transition-all shadow-sm ${u.role === 'university' ? 'group-hover:bg-amber-600 group-hover:text-white' : 'group-hover:bg-indigo-600 group-hover:text-white'}`}>
                                                {u.role === 'university' ? <Building2 size={24} /> : u.name[0]}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-black text-slate-900 text-lg group-hover:text-indigo-600 transition-colors">
                                                    {u.name}
                                                </span>
                                                <span className="text-xs text-slate-400 font-bold tracking-tight">{u.email}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-10 py-6">
                                        <div className="flex flex-col gap-1">
                                            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border w-fit text-[10px] font-black uppercase tracking-wider ${u.role === 'university' ? 'bg-purple-50 text-purple-600 border-purple-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                                                {u.role === 'university' ? <School size={12} /> : <GraduationCap size={12} />}
                                                {u.role}
                                            </div>
                                            <span className="font-mono text-xs font-bold text-slate-500">
                                                {u.role === 'university' ? u.instituteName : u.passportNumber || 'N/A'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-10 py-6">
                                        <div className={`inline-flex items-center gap-2 px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${u.isApproved ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                            <div className={`h-2 w-2 rounded-full ${u.isApproved ? 'bg-emerald-600 animate-pulse' : 'bg-amber-600'}`} />
                                            {u.isApproved ? 'Active' : 'Pending Review'}
                                        </div>
                                    </td>
                                    <td className="px-10 py-6">
                                        <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                            <button className="h-11 w-11 flex items-center justify-center bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-600 rounded-xl transition-all shadow-sm">
                                                <Eye size={18} />
                                            </button>
                                            {!u.isApproved && (
                                                <button onClick={() => handleApprove(u._id)} className="h-11 px-5 flex items-center gap-2 bg-emerald-600 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100">
                                                    <CheckCircle2 size={16} /> Approve
                                                </button>
                                            )}
                                            <button onClick={() => handleDelete(u._id)} className="h-11 w-11 flex items-center justify-center bg-rose-50 text-rose-400 hover:bg-rose-600 hover:text-white rounded-xl transition-all shadow-sm">
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={4} className="py-32 text-center">
                                        <div className="flex flex-col items-center gap-2 text-slate-300">
                                            <Search size={48} className="opacity-20" />
                                            <span className="text-sm font-black uppercase tracking-[0.3em]">No Intelligence Found</span>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon, color, loading }: any) {
    const colors: any = {
        blue: 'text-blue-600 bg-blue-50 border-blue-100 shadow-blue-100',
        indigo: 'text-indigo-600 bg-indigo-50 border-indigo-100 shadow-indigo-100',
        emerald: 'text-emerald-600 bg-emerald-50 border-emerald-100 shadow-emerald-100',
        amber: 'text-amber-600 bg-amber-50 border-amber-100 shadow-amber-100',
    };

    return (
        <div className={`bg-white border-2 border-transparent hover:border-indigo-600 p-8 rounded-[2rem] shadow-xl shadow-slate-200/50 transition-all group relative overflow-hidden flex items-center justify-between`}>
            <div className="relative z-10 space-y-2">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    {title} <ArrowUpRight size={14} className="opacity-0 group-hover:opacity-100 transition-all translate-y-1 group-hover:translate-y-0" />
                </p>
                {loading ? (
                    <div className="h-10 w-24 bg-slate-100 animate-pulse rounded-lg" />
                ) : (
                    <h2 className="text-4xl font-black text-slate-900 tracking-tighter">{value || '0'}</h2>
                )}
            </div>
            <div className={`h-16 w-16 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110 group-hover:rotate-12 shadow-lg ${colors[color]}`}>
                {icon}
            </div>
            <div className={`absolute -right-6 -bottom-6 h-24 w-24 rounded-full opacity-5 group-hover:scale-150 transition-transform ${colors[color].split(' ')[1]}`} />
        </div>
    );
}