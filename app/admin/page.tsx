"use client";
import React, { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import {
    Users, School, Wallet, Search, Clock,
    CheckCircle2, Trash2, Eye, ShieldCheck,
    LogOut, Bell, CreditCard, XCircle, ExternalLink,
    FileText, Upload, MessageSquare, CheckSquare
} from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function AdminVIPDashboard() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('Overview');
    const [filter, setFilter] = useState('week');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<any>(null);
    const [users, setUsers] = useState<any[]>([]);

    // States for Document Specific Actions
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [remarks, setRemarks] = useState<{ [key: string]: string }>({});
    const [attestFiles, setAttestFiles] = useState<{ [key: string]: File }>({});

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
            toast.error("Server Sync Failed");
        } finally {
            setLoading(false);
        }
    }, [filter, searchQuery]);

    useEffect(() => {
        const timer = setTimeout(fetchAdminData, 400);
        return () => clearTimeout(timer);
    }, [fetchAdminData]);

    const handleDocumentVerify = async (studentId: string, docIndex: number) => {
        const docKey = `${studentId}-${docIndex}`;
        if (!attestFiles[docKey]) return toast.error("Please upload the verification slip first");

        setProcessingId(docKey);
        const formData = new FormData();
        formData.append('attestedDoc', attestFiles[docKey]);
        formData.append('remarks', remarks[docKey] || "Verified and Attested");
        formData.append('docIndex', docIndex.toString());

        try {
            // Updated to use studentId as docId context for the endpoint
            await api.put(`/admin/verify-single-doc/${studentId}`, formData);
            toast.success("Document Verified Successfully!");
            fetchAdminData();
        } catch (err) {
            toast.error("Verification failed for this document");
        } finally {
            setProcessingId(null);
        }
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
                    <button onClick={() => setActiveTab('Overview')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold text-sm transition-all ${activeTab === 'Overview' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:bg-slate-50'}`}>
                        <LayoutDashboard size={20} /> Overview
                    </button>
                    <button onClick={() => setActiveTab('Payments')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold text-sm transition-all ${activeTab === 'Payments' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:bg-slate-50'}`}>
                        <CreditCard size={20} /> Payments
                    </button>
                    <button onClick={() => setActiveTab('Verification')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold text-sm transition-all ${activeTab === 'Verification' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:bg-slate-50'}`}>
                        <FileText size={20} /> Verification
                    </button>
                </nav>

                <div className="p-6">
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-5 py-4 text-rose-500 font-bold text-sm hover:bg-rose-50 rounded-2xl transition-all">
                        <LogOut size={20} /> Logout
                    </button>
                </div>
            </aside>

            {/* MAIN CONTENT */}
            <main className="flex-1 ml-0 lg:ml-72 p-8">
                <Header activeTab={activeTab} />

                {activeTab === 'Overview' && (
                    <div className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <StatCard title="Total Students" value={stats?.totalStudents} icon={<Users size={22} />} color="blue" loading={loading} />
                            <StatCard title="Universities" value={stats?.totalUniversities} icon={<School size={22} />} color="indigo" loading={loading} />
                            <StatCard title="Revenue" value={`PKR ${stats?.totalRevenue?.toLocaleString()}`} icon={<Wallet size={22} />} color="emerald" loading={loading} />
                            <StatCard title="Pending" value={stats?.pendingApprovals} icon={<Clock size={22} />} color="amber" loading={loading} />
                        </div>
                        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
                            <div className="p-8 border-b border-slate-50 flex justify-between items-center">
                                <h3 className="font-black text-slate-800 text-xl tracking-tight">Active Directory</h3>
                                <div className="relative group">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                    <input type="text" placeholder="Search Passport..." className="pl-12 pr-4 py-3 bg-slate-50 rounded-xl text-sm outline-none w-64 md:w-80 font-bold" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                                </div>
                            </div>
                            <UserTable users={users} onAction={() => setActiveTab('Verification')} />
                        </div>
                    </div>
                )}

                {activeTab === 'Verification' && (
                    <div className="animate-in fade-in slide-in-from-bottom-6 duration-500">
                        <div className="grid grid-cols-1 gap-8">
                            {users.filter(u => u.role === 'student').map((student: any) => (
                                <div key={student._id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl p-8">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 border-b border-slate-50 pb-6 gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="h-14 w-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-100">
                                                {student.name ? student.name[0] : 'S'}
                                            </div>
                                            <div>
                                                <h4 className="text-xl font-black text-slate-900 uppercase italic leading-none">{student.name}</h4>
                                                <p className="text-xs font-bold text-slate-400 mt-2">Passport: <span className="text-indigo-600 font-black">{student.passportNumber || 'N/A'}</span></p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <span className="px-4 py-2 bg-slate-50 rounded-xl text-[10px] font-black uppercase text-slate-400 border italic">Database Ref: {student._id.slice(-8)}</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {student.documents && student.documents.length > 0 ? (
                                            student.documents.map((doc: any, idx: number) => {
                                                const docKey = `${student._id}-${idx}`;
                                                const fileUrl = typeof doc === 'string' ? doc : doc.url || doc.fileUrl;
                                                const docTitle = doc.title || `Document ${idx + 1}`;
                                                const docInstitute = doc.institute || "Not Specified";

                                                return (
                                                    <div key={idx} className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 hover:border-indigo-200 transition-all group/card">
                                                        <div className="flex justify-between items-start mb-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm border border-slate-100">
                                                                    <FileText size={20} />
                                                                </div>
                                                                <div>
                                                                    <p className="font-black text-slate-700 text-[11px] uppercase tracking-tight">{docTitle}</p>
                                                                    <p className="text-[9px] font-bold text-slate-400 uppercase">{docInstitute}</p>
                                                                </div>
                                                            </div>
                                                            <button
                                                                onClick={() => window.open(fileUrl, '_blank')}
                                                                className="p-2 bg-white text-indigo-600 rounded-lg shadow-sm border border-slate-100 hover:bg-indigo-600 hover:text-white transition-all"
                                                                title="View Document"
                                                            >
                                                                <Eye size={18} />
                                                            </button>
                                                        </div>

                                                        <div
                                                            onClick={() => window.open(fileUrl, '_blank')}
                                                            className="h-32 w-full bg-white mb-4 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden cursor-pointer hover:border-indigo-300 transition-colors"
                                                        >
                                                            <img
                                                                src={fileUrl}
                                                                alt="doc-preview"
                                                                className="h-full w-full object-contain p-2"
                                                                onError={(e) => (e.currentTarget.src = "https://cdn-icons-png.flaticon.com/512/337/337946.png")}
                                                            />
                                                        </div>

                                                        <div className="space-y-3">
                                                            <textarea
                                                                placeholder="Add private remarks for verification..."
                                                                className="w-full p-4 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 ring-indigo-500/10 resize-none h-20 placeholder:text-slate-300"
                                                                value={remarks[docKey] || ""}
                                                                onChange={(e) => setRemarks({ ...remarks, [docKey]: e.target.value })}
                                                            />

                                                            <div className="flex flex-col gap-2">
                                                                <label className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-dashed border-indigo-200 text-indigo-600 rounded-xl text-[10px] font-black cursor-pointer hover:bg-indigo-50 transition-all overflow-hidden">
                                                                    <Upload size={14} />
                                                                    <span className="truncate">
                                                                        {attestFiles[docKey] ? attestFiles[docKey].name : 'Attach Verification Slip'}
                                                                    </span>
                                                                    <input type="file" className="hidden" onChange={(e) => setAttestFiles({ ...attestFiles, [docKey]: e.target.files![0] })} />
                                                                </label>

                                                                <button
                                                                    disabled={processingId === docKey}
                                                                    onClick={() => handleDocumentVerify(student._id, idx)}
                                                                    className="w-full py-4 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-200"
                                                                >
                                                                    {processingId === docKey ? 'Processing...' : <><CheckSquare size={14} /> Final Approve</>}
                                                                </button>
                                                            </div>

                                                            {(doc.isVerified || doc.status === 'Verified') && (
                                                                <div className="flex items-center justify-center gap-1 mt-2 py-1 bg-emerald-50 rounded-lg">
                                                                    <CheckCircle2 size={12} className="text-emerald-600" />
                                                                    <span className="text-[9px] font-black text-emerald-600 uppercase">Verification Active</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <div className="col-span-1 md:col-span-2 py-16 text-center bg-slate-50/50 rounded-[2rem] border-2 border-dashed border-slate-100">
                                                <div className="flex flex-col items-center gap-3">
                                                    <XCircle size={40} className="text-slate-200" />
                                                    <p className="text-slate-400 font-black text-xs uppercase italic tracking-widest">Awaiting Document Upload</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'Payments' && <PaymentSection users={users} onApprove={fetchAdminData} />}
            </main>
        </div>
    );
}


function Header({ activeTab }: { activeTab: string }) {
    return (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
            <div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">{activeTab}</h1>
                <p className="text-slate-400 font-bold text-xs tracking-[0.3em] uppercase mt-1">Command Center / v2.2</p>
            </div>
            <div className="flex items-center gap-4 bg-white p-2 pr-6 rounded-2xl border border-slate-100 shadow-sm">
                <div className="h-12 w-12 bg-slate-900 rounded-xl flex items-center justify-center text-white font-black">M</div>
                <div className="text-left">
                    <p className="text-sm font-black text-slate-900 leading-none">Admin Maaz</p>
                    <p className="text-[10px] text-indigo-600 font-black uppercase mt-1">Super User</p>
                </div>
                <div className="h-10 w-10 bg-slate-50 rounded-xl flex items-center justify-center ml-4 border border-slate-100">
                    <Bell size={18} className="text-slate-400" />
                </div>
            </div>
        </div>
    );
}

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
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${colors[color]} group-hover:rotate-12 transition-transform shadow-sm border`}>
                    {icon}
                </div>
            </div>
        </div>
    );
}

function UserTable({ users, onAction }: any) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b">
                    <tr>
                        <th className="px-8 py-5">User Profile</th>
                        <th className="px-8 py-5">Passport</th>
                        <th className="px-8 py-5">Verified</th>
                        <th className="px-8 py-5 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                    {users.map((u: any) => (
                        <tr key={u._id} className="hover:bg-slate-50/80 transition-all group">
                            <td className="px-8 py-5">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center font-black text-xs uppercase border border-indigo-100">{u.name ? u.name[0] : 'U'}</div>
                                    <div>
                                        <p className="font-black text-slate-900 text-sm italic uppercase">{u.name}</p>
                                        <p className="text-[10px] text-slate-400 font-bold">{u.email}</p>
                                    </div>
                                </div>
                            </td>
                            <td className="px-8 py-5 font-mono text-xs font-black text-slate-600 tracking-tighter">{u.passportNumber || '---'}</td>
                            <td className="px-8 py-5">
                                <div className="flex items-center gap-2">
                                    <span className="px-3 py-1 bg-slate-100 rounded-full text-[9px] font-black uppercase tracking-tighter text-slate-500">
                                        {u.documents?.length || 0} Files
                                    </span>
                                    {u.isApproved && <CheckCircle2 size={14} className="text-emerald-500" />}
                                </div>
                            </td>
                            <td className="px-8 py-5 text-right">
                                <button onClick={onAction} className="p-2.5 bg-slate-900 text-white rounded-xl hover:bg-indigo-600 transition-all shadow-md active:scale-90">
                                    <Eye size={16} />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function PaymentSection({ users, onApprove }: any) {
    return (
        <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-slate-100">
            <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-black italic uppercase tracking-tight">Financial Clearances</h3>
                <span className="px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase">Real-time Stats</span>
            </div>
            <div className="grid grid-cols-1 gap-4">
                {users.filter((u: any) => u.paymentScreenshot && !u.isPaid).map((student: any) => (
                    <div key={student._id} className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6 hover:border-emerald-200 transition-all">
                        <div className="flex items-center gap-4 w-full md:w-auto">
                            <div className="relative group">
                                <img
                                    src={student.paymentScreenshot}
                                    className="h-20 w-20 rounded-2xl object-cover cursor-pointer border-4 border-white shadow-sm group-hover:scale-105 transition-transform"
                                    onClick={() => window.open(student.paymentScreenshot)}
                                />
                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 rounded-2xl flex items-center justify-center transition-opacity pointer-events-none">
                                    <ExternalLink size={16} className="text-white" />
                                </div>
                            </div>
                            <div>
                                <p className="font-black text-slate-900 uppercase italic">{student.name}</p>
                                <p className="text-[10px] text-slate-400 font-black tracking-widest uppercase mt-1 flex items-center gap-2">
                                    <Clock size={12} className="text-amber-500" /> Verification Pending
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onApprove}
                            className="w-full md:w-auto px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase hover:bg-emerald-700 hover:shadow-lg shadow-emerald-100 transition-all active:scale-95"
                        >
                            Confirm Payment
                        </button>
                    </div>
                ))}
                {users.filter((u: any) => u.paymentScreenshot && !u.isPaid).length === 0 && (
                    <div className="py-20 text-center text-slate-300 font-black uppercase italic tracking-[0.3em]">No pending transactions</div>
                )}
            </div>
        </div>
    );
}

function LayoutDashboard(props: any) {
    return (
        <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1" /><rect width="7" height="5" x="14" y="3" rx="1" /><rect width="7" height="9" x="14" y="12" rx="1" /><rect width="7" height="5" x="3" y="16" rx="1" /></svg>
    );
}