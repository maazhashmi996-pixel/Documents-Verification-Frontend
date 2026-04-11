"use client";
import React, { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import {
    Users, School, Wallet, Search, Clock,
    CheckCircle2, Trash2, Eye, ShieldCheck,
    ArrowUpRight, LogOut, Bell, Building2, GraduationCap,
    CreditCard, XCircle, ExternalLink
} from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function AdminVIPDashboard() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('Overview'); // Tabs: Overview, Payments
    const [filter, setFilter] = useState('week');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<any>(null);
    const [users, setUsers] = useState<any[]>([]);

    const fetchAdminData = useCallback(async () => {
        setLoading(true);
        try {
            const [statsRes, usersRes] = await Promise.all([
                api.get(`/admin/stats?period=${filter}`),
                api.get(`/admin/students?search=${searchQuery}`)
            ]);
            setStats(statsRes.data);
            const userData = usersRes.data?.users || usersRes.data || [];
            setUsers(userData);
        } catch (err) {
            console.error("Fetch Error:", err);
            toast.error("Sync Failed with Server");
        } finally {
            setLoading(false);
        }
    }, [filter, searchQuery]);

    useEffect(() => {
        const timer = setTimeout(fetchAdminData, 400);
        return () => clearTimeout(timer);
    }, [fetchAdminData]);

    const handleApprovePayment = async (id: string) => {
        try {
            await api.put(`/admin/approve-payment/${id}`);
            toast.success("Payment Verified & Student Approved!");
            fetchAdminData();
        } catch (err) { toast.error("Verification Failed"); }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        router.push('/login');
    };

    return (
        <div className="flex min-h-screen bg-[#f4f7fe]">
            <Toaster position="top-right" />

            {/* SIDEBAR */}
            <aside className="w-72 bg-white border-r border-slate-100 hidden lg:flex flex-col fixed h-full z-20">
                <div className="p-8 flex items-center gap-3">
                    <div className="h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100">
                        <ShieldCheck className="text-white" size={20} />
                    </div>
                    <span className="font-black text-xl tracking-tighter italic">QUAL CHECK</span>
                </div>

                <nav className="flex-1 px-6 space-y-3">
                    <button
                        onClick={() => setActiveTab('Overview')}
                        className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold text-sm transition-all ${activeTab === 'Overview' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:bg-slate-50'}`}
                    >
                        <LayoutDashboard size={20} /> Overview
                    </button>
                    <button
                        onClick={() => setActiveTab('Payments')}
                        className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold text-sm transition-all ${activeTab === 'Payments' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:bg-slate-50'}`}
                    >
                        <CreditCard size={20} /> Payment Requests
                    </button>
                </nav>

                <div className="p-6">
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-5 py-4 text-rose-500 font-bold text-sm hover:bg-rose-50 rounded-2xl transition-all">
                        <LogOut size={20} /> Logout System
                    </button>
                </div>
            </aside>

            {/* MAIN CONTENT */}
            <main className="flex-1 ml-72 p-8">

                {/* HEADER */}
                <div className="flex justify-between items-center mb-10">
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">{activeTab}</h1>
                        <p className="text-slate-400 font-bold text-xs tracking-[0.3em] uppercase mt-1">Command Center / v2.0</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-sm font-black text-slate-900 leading-none">Admin Maaz</p>
                            <p className="text-[10px] text-indigo-600 font-black uppercase mt-1">Super User</p>
                        </div>
                        <div className="h-12 w-12 bg-white rounded-2xl border border-slate-200 flex items-center justify-center shadow-sm">
                            <Users size={20} />
                        </div>
                    </div>
                </div>

                {activeTab === 'Overview' ? (
                    <>
                        {/* STATS SECTION */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                            <StatCard title="Total Students" value={stats?.totalStudents} icon={<Users size={22} />} color="blue" loading={loading} />
                            <StatCard title="Universities" value={stats?.totalUniversities} icon={<School size={22} />} color="indigo" loading={loading} />
                            <StatCard title="Revenue" value={`PKR ${stats?.totalRevenue?.toLocaleString()}`} icon={<Wallet size={22} />} color="emerald" loading={loading} />
                            <StatCard title="Pending" value={stats?.pendingApprovals} icon={<Clock size={22} />} color="amber" loading={loading} />
                        </div>

                        {/* SEARCH & DIRECTORY */}
                        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
                            <div className="p-8 border-b border-slate-50 flex justify-between items-center">
                                <h3 className="font-black text-slate-800 text-xl tracking-tight">Active Directory</h3>
                                <div className="relative group">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500" size={18} />
                                    <input
                                        type="text"
                                        placeholder="Fast search..."
                                        className="pl-12 pr-4 py-3 bg-slate-50 rounded-xl text-sm outline-none focus:ring-2 ring-indigo-500/10 w-80 font-bold"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                            </div>
                            <UserTable users={users} onApprove={() => { }} onDelete={() => { }} />
                        </div>
                    </>
                ) : (
                    /* PAYMENT VERIFICATION SECTION */
                    <div className="animate-in fade-in slide-in-from-bottom-6 duration-500">
                        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl p-8">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="h-10 w-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                                    <Clock size={20} />
                                </div>
                                <h3 className="text-xl font-black text-slate-800 tracking-tight">Pending Payment Approvals</h3>
                            </div>

                            <div className="grid grid-cols-1 gap-6">
                                {users.filter(u => !u.isApproved && u.paymentScreenshot).length > 0 ? (
                                    users.filter(u => !u.isApproved && u.paymentScreenshot).map((student: any) => (
                                        <div key={student._id} className="flex items-center justify-between p-6 bg-slate-50 rounded-[2rem] border border-slate-100 hover:border-indigo-300 transition-all group">
                                            <div className="flex items-center gap-6">
                                                <div className="h-24 w-32 rounded-2xl overflow-hidden border-4 border-white shadow-md relative group/img">
                                                    <img
                                                        src={student.paymentScreenshot}
                                                        alt="Slip"
                                                        className="h-full w-full object-cover grayscale group-hover/img:grayscale-0 transition-all cursor-zoom-in"
                                                        onClick={() => window.open(student.paymentScreenshot, '_blank')}
                                                    />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-all pointer-events-none">
                                                        <ExternalLink className="text-white" size={20} />
                                                    </div>
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-slate-900 text-lg uppercase italic">{student.name}</h4>
                                                    <p className="text-xs font-bold text-slate-400 mb-2">{student.email}</p>
                                                    <div className="flex gap-2">
                                                        <span className="px-3 py-1 bg-white border rounded-lg text-[10px] font-black uppercase tracking-widest text-indigo-600">
                                                            ID: {student._id.slice(-6)}
                                                        </span>
                                                        <span className="px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg text-[10px] font-black uppercase tracking-widest">
                                                            Slip Attached
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex gap-3">
                                                <button
                                                    onClick={() => handleApprovePayment(student._id)}
                                                    className="px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-emerald-100 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                                                >
                                                    <CheckCircle2 size={18} /> Verify & Approve
                                                </button>
                                                <button className="h-14 w-14 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all">
                                                    <XCircle size={20} />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-20 text-center text-slate-300 font-black uppercase tracking-[0.3em] italic">
                                        No pending payment slips found
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

// --- SUB COMPONENTS ---

function StatCard({ title, value, icon, color, loading }: any) {
    const colors: any = {
        blue: 'text-blue-600 bg-blue-50 border-blue-100',
        indigo: 'text-indigo-600 bg-indigo-50 border-indigo-100',
        emerald: 'text-emerald-600 bg-emerald-50 border-emerald-100',
        amber: 'text-amber-600 bg-amber-50 border-amber-100',
    };
    return (
        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/40 relative overflow-hidden group">
            <div className="flex justify-between items-start relative z-10">
                <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
                    {loading ? <div className="h-8 w-20 bg-slate-100 animate-pulse rounded" /> : <h2 className="text-3xl font-black text-slate-900">{value || 0}</h2>}
                </div>
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${colors[color]} group-hover:rotate-12 transition-transform`}>
                    {icon}
                </div>
            </div>
            <div className={`absolute -right-4 -bottom-4 h-24 w-24 rounded-full opacity-[0.03] ${colors[color].split(' ')[1]}`} />
        </div>
    );
}

function UserTable({ users, onApprove, onDelete }: any) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b">
                    <tr>
                        <th className="px-8 py-5">User Info</th>
                        <th className="px-8 py-5">Role</th>
                        <th className="px-8 py-5">Status</th>
                        <th className="px-8 py-5 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                    {users.map((u: any) => (
                        <tr key={u._id} className="hover:bg-slate-50/80 transition-all group">
                            <td className="px-8 py-5">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center font-black text-xs uppercase">
                                        {u.name ? u.name[0] : 'U'}
                                    </div>
                                    <div>
                                        <p className="font-black text-slate-900 text-sm">{u.name || u.instituteName}</p>
                                        <p className="text-[10px] text-slate-400 font-bold">{u.email}</p>
                                    </div>
                                </div>
                            </td>
                            <td className="px-8 py-5">
                                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${u.role === 'university' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                                    {u.role}
                                </span>
                            </td>
                            <td className="px-8 py-5">
                                <div className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${u.isApproved ? 'text-emerald-600' : 'text-amber-600'}`}>
                                    <div className={`h-1.5 w-1.5 rounded-full ${u.isApproved ? 'bg-emerald-600' : 'bg-amber-600 animate-pulse'}`} />
                                    {u.isApproved ? 'Verified' : 'Pending'}
                                </div>
                            </td>
                            <td className="px-8 py-5 text-right">
                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                    <button className="p-2 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-all text-slate-400 hover:text-indigo-600"><Eye size={16} /></button>
                                    <button className="p-2 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-600 transition-all"><Trash2 size={16} /></button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// Minimal placeholder for Lucide-React LayoutDashboard icon used in Sidebar
function LayoutDashboard(props: any) {
    return (
        <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1" /><rect width="7" height="5" x="14" y="3" rx="1" /><rect width="7" height="9" x="14" y="12" rx="1" /><rect width="7" height="5" x="3" y="16" rx="1" /></svg>
    )
}