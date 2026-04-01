"use client";
import React, { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import {
    Users, School, Wallet, Search, TrendingUp, Clock, MoreHorizontal, ExternalLink
} from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';

interface Stats {
    totalStudents: number;
    totalUniversities: number;
    totalRevenue: number;
    pendingApprovals: number;
    studentTrend: string;
    revenueTrend: string;
}

export default function AdminVIPDashboard() {
    const [filter, setFilter] = useState('week');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<Stats | null>(null);
    const [students, setStudents] = useState([]);

    // 1. Fetch Dashboard Data (Stats + Students)
    const fetchAdminData = useCallback(async () => {
        setLoading(true);
        try {
            // Hum query params bhej rahe hain filter ke liye (?period=day)
            const [statsRes, studentsRes] = await Promise.all([
                api.get(`/admin/stats?period=${filter}`),
                api.get(`/admin/students?search=${searchQuery}`)
            ]);

            setStats(statsRes.data);
            setStudents(studentsRes.data);
        } catch (err: any) {
            toast.error("Failed to load dashboard data");
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [filter, searchQuery]);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchAdminData();
        }, 500); // Search ke liye delay taake har keypress par request na jaye

        return () => clearTimeout(delayDebounceFn);
    }, [fetchAdminData]);

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Toaster position="top-right" />

            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Executive Overview</h1>
                    <p className="text-slate-500 font-medium mt-1 text-lg">Real-time database analytics.</p>
                </div>

                {/* Time Filters */}
                <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
                    {['day', 'week', 'month', 'all'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-6 py-2.5 rounded-xl text-sm font-bold capitalize transition-all ${filter === f ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {/* VIP Summary Cards (Live Data) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <SummaryCard
                    title="Total Students"
                    value={stats?.totalStudents.toLocaleString() || '0'}
                    icon={<Users className="text-blue-600" />}
                    trend={stats?.studentTrend || '+0%'}
                    color="blue"
                    loading={loading}
                />
                <SummaryCard
                    title="Universities"
                    value={stats?.totalUniversities.toString() || '0'}
                    icon={<School className="text-indigo-600" />}
                    trend="Partners"
                    color="indigo"
                    loading={loading}
                />
                <SummaryCard
                    title="Total Revenue"
                    value={`Rs. ${stats?.totalRevenue.toLocaleString() || '0'}`}
                    icon={<Wallet className="text-emerald-600" />}
                    trend={stats?.revenueTrend || '+0%'}
                    color="emerald"
                    loading={loading}
                />
                <SummaryCard
                    title="Pending Tasks"
                    value={stats?.pendingApprovals.toString() || '0'}
                    icon={<Clock className="text-amber-600" />}
                    trend="Action Required"
                    color="amber"
                    loading={loading}
                />
            </div>

            {/* Table Section */}
            <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden">
                <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Student Directory</h3>

                    <div className="relative w-full md:w-[400px]">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search by Name or Passport..."
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all font-bold placeholder:font-medium"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 text-slate-400 text-xs uppercase tracking-[0.15em]">
                                <th className="px-8 py-6 font-black">Student Details</th>
                                <th className="px-8 py-6 font-black">Passport</th>
                                <th className="px-8 py-6 font-black">University</th>
                                <th className="px-8 py-6 font-black">Status</th>
                                <th className="px-8 py-6 font-black text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {students.length > 0 ? students.map((s: any) => (
                                <tr key={s._id} className="hover:bg-indigo-50/20 transition-colors group">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 rounded-2xl bg-slate-100 group-hover:bg-indigo-600 group-hover:text-white transition-all flex items-center justify-center font-black text-slate-500">
                                                {s.name[0].toUpperCase()}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-black text-slate-900 text-lg tracking-tight">{s.name}</span>
                                                <span className="text-xs text-slate-400 font-bold">{s.email}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className="font-black text-slate-600 bg-slate-100 px-3 py-1 rounded-lg text-sm tracking-widest uppercase">
                                            {s.passportNumber}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 font-bold text-slate-600">{s.university || 'Not Assigned'}</td>
                                    <td className="px-8 py-6">
                                        <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${s.isApproved ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                            }`}>
                                            {s.isApproved ? 'Verified' : 'Pending'}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <button className="h-10 w-10 hover:bg-white hover:shadow-md rounded-xl flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-all ml-auto">
                                            <ExternalLink size={20} />
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center text-slate-400 font-bold italic">
                                        {loading ? "Syncing with database..." : "No records matching your search."}
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

// Reusable Summary Card with Loading State
function SummaryCard({ title, value, icon, trend, color, loading }: any) {
    const colorVariants: any = {
        blue: 'bg-blue-50 text-blue-600',
        indigo: 'bg-indigo-50 text-indigo-600',
        emerald: 'bg-emerald-50 text-emerald-600',
        amber: 'bg-amber-50 text-amber-600',
    };

    return (
        <div className="bg-white border border-slate-200 p-8 rounded-[2.5rem] shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group relative overflow-hidden">
            <div className="flex justify-between items-start mb-6">
                <div className={`h-16 w-16 rounded-[1.5rem] flex items-center justify-center shadow-inner transition-transform group-hover:rotate-12 ${colorVariants[color]}`}>
                    {icon}
                </div>
                {!loading && (
                    <div className="flex items-center gap-1 text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full uppercase tracking-tighter">
                        <TrendingUp size={12} /> {trend}
                    </div>
                )}
            </div>
            {loading ? (
                <div className="h-8 w-24 bg-slate-100 animate-pulse rounded-lg"></div>
            ) : (
                <div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">{title}</p>
                    <h2 className="text-4xl font-black text-slate-900 mt-2 tracking-tighter">{value}</h2>
                </div>
            )}
            {/* Background VIP Pattern */}
            <div className="absolute -right-4 -bottom-4 text-slate-50 opacity-50 group-hover:scale-150 transition-transform">
                {icon}
            </div>
        </div>
    );
}