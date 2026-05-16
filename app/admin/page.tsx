"use client";

import React, { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import {
    Users, School, Wallet, Search, Clock,
    CheckCircle2, Trash2, Eye, ShieldCheck,
    LogOut, Bell, CreditCard, XCircle, ExternalLink,
    FileText, Upload, CheckSquare, Phone,
    UserCheck, LayoutDashboard, Loader2, CreditCard as PassportIcon, AlertCircle
} from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

// --- Interfaces ---
interface Document {
    url?: string;
    fileUrl?: string;
    title?: string;
    institute?: string;
    isVerified?: boolean;
    status?: string;
    remarks?: string;
}

interface User {
    _id: string;
    name: string;
    email: string;
    role: string;
    isApproved?: boolean;
    passportNumber?: string;
    phone?: string;
    isActive?: boolean;
    isPaid?: boolean;
    paymentScreenshot?: string;
    documents?: Document[];
}

interface Stats {
    totalStudents: number;
    totalUniversities: number;
    totalRevenue: number;
    pendingApprovals: number;
}

// --- Custom Hook for Debounce ---
function useDebounce(value: string, delay: number) {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
}

export default function AdminVIPDashboard() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('Overview');
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearch = useDebounce(searchQuery, 500);

    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<Stats | null>(null);
    const [users, setUsers] = useState<User[]>([]);

    const [processingId, setProcessingId] = useState<string | null>(null);
    const [remarks, setRemarks] = useState<{ [key: string]: string }>({});
    const [attestFiles, setAttestFiles] = useState<{ [key: string]: File }>({});

    // --- Data Fetching ---
    const fetchAdminData = useCallback(async () => {
        setLoading(true);
        try {
            const [statsRes, usersRes] = await Promise.all([
                api.get('/api/admin/stats'),
                api.get(`/api/admin/students?search=${debouncedSearch}`)
            ]);
            setStats(statsRes.data);
            setUsers(usersRes.data?.users || usersRes.data || []);
        } catch (err) {
            toast.error("Cloud Sync Interrupted");
        } finally {
            setLoading(false);
        }
    }, [debouncedSearch]);

    useEffect(() => {
        fetchAdminData();
    }, [fetchAdminData]);

    // --- Handlers ---
    const handleApproveUser = async (userId: string) => {
        try {
            await api.put(`/api/admin/approve/${userId}`);
            toast.success("User Access Authorized");
            fetchAdminData();
        } catch (err) {
            toast.error("Approval Protocol Failed");
        }
    };

    const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
        try {
            await api.patch(`/api/admin/user-status/${userId}`);
            toast.success(`User ${currentStatus ? 'Deactivated' : 'Activated'}`);
            setUsers(prev => prev.map(u => u._id === userId ? { ...u, isActive: !currentStatus } : u));
        } catch (err) {
            toast.error("Update Failed");
        }
    };

    const handleDeleteUser = async (userId: string) => {
        if (!window.confirm("CRITICAL: Permanent deletion cannot be reversed. Proceed?")) return;
        try {
            await api.delete(`/api/admin/delete-user/${userId}`);
            toast.success("Identity Purged Successfully");
            setUsers(prev => prev.filter(u => u._id !== userId));
        } catch (err) {
            toast.error("Deletion Failed");
        }
    };

    const handleDeleteDocument = async (studentId: string, docIndex: number) => {
        if (!window.confirm("Delete this document permanently?")) return;
        try {
            await api.delete(`/api/admin/delete-document/${studentId}/${docIndex}`);
            toast.success("Document Removed");
            fetchAdminData();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Document Deletion Failed");
        }
    };

    const handleDocumentAction = async (studentId: string, docIndex: number, action: 'verify' | 'reject') => {
        const docKey = `${studentId}-${docIndex}`;
        const adminRemarks = remarks[docKey];

        if (action === 'verify' && !attestFiles[docKey]) {
            return toast.error("Verification Slip Required for Approval");
        }

        if (action === 'reject' && (!adminRemarks || adminRemarks.length < 5)) {
            return toast.error("Please provide detailed remarks for rejection");
        }

        setProcessingId(`${docKey}-${action}`);
        const formData = new FormData();

        if (attestFiles[docKey]) {
            formData.append('attestedDoc', attestFiles[docKey]);
        }

        formData.append('remarks', adminRemarks || (action === 'verify' ? "Standard VIP Verification" : "Document Rejected by Admin"));
        formData.append('docIndex', docIndex.toString());
        formData.append('status', action === 'verify' ? 'Verified' : 'Rejected');

        try {
            await api.put(`/api/admin/verify-single-doc/${studentId}/${docIndex}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            toast.success(action === 'verify' ? "Document Authenticated" : "Document Rejected & Notified");
            fetchAdminData();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Protocol Error");
        } finally {
            setProcessingId(null);
        }
    };

    const handleConfirmPayment = async (userId: string) => {
        try {
            await api.put(`/api/admin/update-fee/${userId}`, { isPaid: true });
            toast.success("Transaction Verified");
            fetchAdminData();
        } catch (err) {
            toast.error("Payment Confirmation Failed");
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        router.push('/login');
    };

    return (
        <div className="flex min-h-screen bg-[#F8FAFC]">
            <Toaster position="top-right" />
            <aside className="w-72 bg-white border-r border-slate-100 hidden lg:flex flex-col fixed h-full z-20 shadow-sm">
                <div className="p-8 flex items-center gap-3">
                    <div className="h-10 w-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg">
                        <ShieldCheck className="text-white" size={20} />
                    </div>
                    <span className="font-black text-xl tracking-tighter italic text-slate-900">QUAL CHECK</span>
                </div>
                <nav className="flex-1 px-6 space-y-2">
                    <TabButton active={activeTab === 'Overview'} icon={<LayoutDashboard size={18} />} label="Overview" onClick={() => setActiveTab('Overview')} />
                    <TabButton active={activeTab === 'Payments'} icon={<CreditCard size={18} />} label="Payments" onClick={() => setActiveTab('Payments')} />
                    <TabButton active={activeTab === 'Verification'} icon={<FileText size={18} />} label="Verification" onClick={() => setActiveTab('Verification')} />
                </nav>
                <div className="p-6">
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-5 py-4 text-rose-500 font-bold text-sm hover:bg-rose-50 rounded-2xl transition-all">
                        <LogOut size={20} /> Logout
                    </button>
                </div>
            </aside>

            <main className="flex-1 ml-0 lg:ml-72 p-8">
                <Header activeTab={activeTab} />
                {activeTab === 'Overview' && (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <StatCard title="Total Students" value={stats?.totalStudents} icon={<Users size={22} />} color="blue" loading={loading} />
                            <StatCard title="Universities" value={stats?.totalUniversities} icon={<School size={22} />} color="indigo" loading={loading} />
                            <StatCard title="Total Revenue" value={stats?.totalRevenue ? `PKR ${stats.totalRevenue.toLocaleString()}` : 'PKR 0'} icon={<Wallet size={22} />} color="emerald" loading={loading} />
                            <StatCard title="Pending Review" value={stats?.pendingApprovals} icon={<Clock size={22} />} color="amber" loading={loading} />
                        </div>
                        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
                            <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-4">
                                <h3 className="font-black text-slate-800 text-lg uppercase italic">Student Directory</h3>
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                    <input
                                        type="text"
                                        placeholder="Search by name or passport..."
                                        className="pl-12 pr-4 py-3 bg-slate-50 rounded-xl text-sm outline-none w-64 md:w-96 font-medium focus:ring-2 ring-slate-100 transition-all"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                            </div>
                            <UserTable
                                users={users}
                                onAction={() => setActiveTab('Verification')}
                                onToggleStatus={handleToggleStatus}
                                onDeleteUser={handleDeleteUser}
                                onApproveUser={handleApproveUser}
                                loading={loading}
                            />
                        </div>
                    </div>
                )}
                {activeTab === 'Verification' && (
                    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                        {users.filter(u => u.role === 'student').length > 0 ? (
                            users.filter(u => u.role === 'student').map((student) => (
                                <VerificationCard
                                    key={student._id}
                                    student={student}
                                    remarks={remarks}
                                    setRemarks={setRemarks}
                                    attestFiles={attestFiles}
                                    setAttestFiles={setAttestFiles}
                                    processingId={processingId}
                                    handleDocumentAction={handleDocumentAction}
                                    handleToggleStatus={handleToggleStatus}
                                    handleDeleteUser={handleDeleteUser}
                                    handleDeleteDocument={handleDeleteDocument}
                                />
                            ))
                        ) : (
                            <div className="text-center py-20 bg-white rounded-[2.5rem] border border-dashed border-slate-200">
                                <p className="text-slate-400 font-bold italic">No verification tasks found.</p>
                            </div>
                        )}
                    </div>
                )}
                {activeTab === 'Payments' && (
                    <PaymentSection users={users} onApprove={handleConfirmPayment} />
                )}
            </main>
        </div>
    );
}

// --- Sub-Components ---
function TabButton({ active, icon, label, onClick }: any) {
    return (
        <button onClick={onClick} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold text-sm transition-all ${active ? 'bg-slate-900 text-white shadow-xl translate-x-2' : 'text-slate-400 hover:bg-slate-50'}`}>
            {icon} {label}
        </button>
    );
}

function Header({ activeTab }: { activeTab: string }) {
    return (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
            <div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">{activeTab}</h1>
                <p className="text-slate-400 font-bold text-[10px] tracking-[0.4em] uppercase mt-1">Global Verification Network</p>
            </div>
            <div className="flex items-center gap-4 bg-white p-2 pr-6 rounded-2xl border border-slate-100 shadow-sm">
                <div className="h-12 w-12 bg-slate-900 rounded-xl flex items-center justify-center text-white font-black">M</div>
                <div className="text-left">
                    <p className="text-sm font-black text-slate-900">Maaz Hashmi</p>
                    <p className="text-[10px] text-indigo-600 font-black uppercase">Root Administrator</p>
                </div>
                <div className="h-10 w-10 bg-slate-50 rounded-xl flex items-center justify-center ml-4 border border-slate-100 relative">
                    <Bell size={18} className="text-slate-400" />
                    <span className="absolute top-2 right-2 h-2 w-2 bg-rose-500 rounded-full border-2 border-white"></span>
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon, color, loading }: any) {
    const theme: any = {
        blue: 'text-blue-600 bg-blue-50',
        indigo: 'text-indigo-600 bg-indigo-50',
        emerald: 'text-emerald-600 bg-emerald-50',
        amber: 'text-amber-600 bg-amber-50',
    };
    return (
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
                    {loading ? <div className="h-8 w-24 bg-slate-50 animate-pulse rounded-lg" /> : <h2 className="text-3xl font-black text-slate-900">{value ?? 0}</h2>}
                </div>
                <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${theme[color]} group-hover:scale-110 transition-transform`}>
                    {icon}
                </div>
            </div>
        </div>
    );
}

const UserTable = React.memo(({ users, onAction, onToggleStatus, onDeleteUser, onApproveUser, loading }: any) => {
    if (loading) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-slate-300" size={40} /></div>;
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    <tr>
                        <th className="px-8 py-5">Identity & Contact</th>
                        <th className="px-8 py-5">Credential</th>
                        <th className="px-8 py-5">Approval</th>
                        <th className="px-8 py-5">Status</th>
                        <th className="px-8 py-5 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                    {users.map((u: User) => (
                        <tr key={u._id} className="hover:bg-slate-50/50 transition-all">
                            <td className="px-8 py-5">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 bg-slate-100 text-slate-900 rounded-xl flex items-center justify-center font-black text-xs">{u.name ? u.name[0] : 'U'}</div>
                                    <div>
                                        <p className="font-black text-slate-900 text-sm uppercase italic">{u.name}</p>
                                        <p className="text-[10px] text-indigo-600 font-bold flex items-center gap-1">
                                            <Phone size={10} /> {u.phone || 'N/A'}
                                        </p>
                                    </div>
                                </div>
                            </td>
                            <td className="px-8 py-5">
                                <p className="text-[10px] font-black text-slate-600 flex items-center gap-1 uppercase">
                                    <PassportIcon size={12} className="text-slate-400" /> {u.passportNumber || 'No Passport'}
                                </p>
                            </td>
                            <td className="px-8 py-5">
                                {u.isApproved ? (
                                    <span className="flex items-center gap-1.5 text-emerald-600 text-[10px] font-black uppercase">
                                        <UserCheck size={14} /> Approved
                                    </span>
                                ) : (
                                    <button onClick={() => onApproveUser(u._id)} className="flex items-center gap-1.5 bg-amber-50 text-amber-600 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase hover:bg-amber-600 hover:text-white transition-all">
                                        <Clock size={12} /> Approve Now
                                    </button>
                                )}
                            </td>
                            <td className="px-8 py-5">
                                <button onClick={() => onToggleStatus(u._id, u.isActive ?? true)} className={`px-3 py-1 rounded-full text-[9px] font-black uppercase flex items-center gap-1.5 ${u.isActive === false ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-600'}`}>
                                    {u.isActive === false ? <XCircle size={10} /> : <CheckCircle2 size={10} />}
                                    {u.isActive === false ? 'Suspended' : 'Active'}
                                </button>
                            </td>
                            <td className="px-8 py-5 text-right">
                                <div className="flex justify-end gap-2">
                                    <button onClick={onAction} className="p-2.5 bg-slate-900 text-white rounded-xl hover:bg-indigo-600 transition-all shadow-sm"><Eye size={16} /></button>
                                    <button onClick={() => onDeleteUser(u._id)} className="p-2.5 bg-white text-rose-500 border border-slate-100 rounded-xl hover:bg-rose-500 hover:text-white transition-all"><Trash2 size={16} /></button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
});
UserTable.displayName = "UserTable";

const VerificationCard = ({ student, remarks, setRemarks, attestFiles, setAttestFiles, processingId, handleDocumentAction, handleToggleStatus, handleDeleteUser, handleDeleteDocument }: any) => {
    return (
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl p-8 hover:border-indigo-100 transition-colors">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 pb-6 border-b border-slate-50 gap-4">
                <div className="flex items-center gap-5">
                    <div className="h-16 w-16 bg-slate-900 rounded-[1.25rem] flex items-center justify-center text-white font-black text-2xl shadow-xl">{student.name?.[0] || 'S'}</div>
                    <div>
                        <h4 className="text-xl font-black text-slate-900 uppercase italic">{student.name}</h4>
                        <div className="flex flex-wrap gap-4 mt-2">
                            <span className="text-[10px] font-black text-slate-400 uppercase">Passport: <b className="text-slate-900">{student.passportNumber}</b></span>
                            <span className="text-[10px] font-black text-slate-400 uppercase">Mobile: <b className="text-indigo-600">{student.phone || 'N/A'}</b></span>
                            <span className="text-[10px] font-black text-slate-400 uppercase">Docs: <b className="text-slate-900">{student.documents?.length || 0}</b></span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => handleToggleStatus(student._id, student.isActive)} className="px-6 py-3 bg-slate-50 text-slate-600 rounded-2xl text-[10px] font-black uppercase italic hover:bg-slate-100 transition-all">Toggle Access</button>
                    <button onClick={() => handleDeleteUser(student._id)} className="px-6 py-3 bg-rose-50 text-rose-500 rounded-2xl text-[10px] font-black uppercase italic hover:bg-rose-500 hover:text-white transition-all">Delete Account</button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {student.documents?.map((doc: any, idx: number) => {
                    const docKey = `${student._id}-${idx}`;
                    const url = doc.url || doc.fileUrl;
                    const isRejected = doc.status === 'Rejected';
                    const isVerified = doc.status === 'Verified';

                    return (
                        <div key={idx} className={`p-6 rounded-[2rem] border flex flex-col gap-5 relative transition-all ${isRejected ? 'bg-rose-50/30 border-rose-100' : isVerified ? 'bg-emerald-50/30 border-emerald-100' : 'bg-slate-50/50 border-slate-100'}`}>
                            {(isRejected || isVerified) && (
                                <div className={`absolute top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[9px] font-black uppercase z-10 shadow-sm ${isRejected ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'}`}>
                                    {doc.status}
                                </div>
                            )}
                            <button onClick={() => handleDeleteDocument(student._id, idx)} className="absolute top-4 right-4 p-2.5 bg-white text-rose-500 rounded-xl shadow-sm border border-slate-100 hover:bg-rose-500 hover:text-white transition-all z-10" title="Remove Document">
                                <Trash2 size={16} />
                            </button>
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white rounded-lg shadow-sm text-indigo-600"><FileText size={18} /></div>
                                    <span className="font-black text-[11px] text-slate-700 uppercase">{doc.title || `Document ${idx + 1}`}</span>
                                </div>
                                <button onClick={() => window.open(url, '_blank')} className="text-indigo-600 hover:underline font-black text-[10px] uppercase mr-10">View Original</button>
                            </div>
                            <div className="h-48 w-full bg-white rounded-2xl border border-slate-200 overflow-hidden relative group">
                                <img src={url} alt="preview" className="h-full w-full object-contain p-4" />
                                <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                                    <button onClick={() => window.open(url)} className="p-3 bg-white rounded-full text-slate-900 shadow-xl"><ExternalLink size={20} /></button>
                                </div>
                            </div>
                            <textarea
                                placeholder="Admin feedback/remarks (Required for rejection)..."
                                className="w-full p-4 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 ring-indigo-500/10 h-24 outline-none resize-none"
                                value={remarks[docKey] || doc.remarks || ""}
                                onChange={(e) => setRemarks({ ...remarks, [docKey]: e.target.value })}
                            />
                            <div className="flex flex-col gap-2">
                                <label className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border border-dashed border-indigo-200 text-indigo-600 rounded-xl text-[10px] font-black cursor-pointer hover:bg-indigo-50 transition-all">
                                    <Upload size={14} />
                                    <span className="truncate max-w-[150px]">{attestFiles[docKey] ? attestFiles[docKey].name : 'Upload Attestation'}</span>
                                    <input type="file" className="hidden" onChange={(e) => setAttestFiles({ ...attestFiles, [docKey]: e.target.files ? e.target.files[0] : null })} />
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button disabled={processingId?.startsWith(docKey)} onClick={() => handleDocumentAction(student._id, idx, 'verify')} className="py-4 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 disabled:opacity-50 transition-all shadow-lg flex items-center justify-center gap-2">
                                        {processingId === `${docKey}-verify` ? <Loader2 size={14} className="animate-spin" /> : <CheckSquare size={14} />} Verify
                                    </button>
                                    <button disabled={processingId?.startsWith(docKey)} onClick={() => handleDocumentAction(student._id, idx, 'reject')} className="py-4 bg-white text-rose-500 border border-rose-100 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white disabled:opacity-50 transition-all shadow-sm flex items-center justify-center gap-2">
                                        {processingId === `${docKey}-reject` ? <Loader2 size={14} className="animate-spin" /> : <AlertCircle size={14} />} Reject
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const PaymentSection = ({ users, onApprove }: any) => {
    const pending = users.filter((u: any) => u.paymentScreenshot && !u.isPaid);
    return (
        <div className="bg-white rounded-[2.5rem] p-10 shadow-xl border border-slate-100 animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-10">
                <h3 className="text-2xl font-black italic uppercase tracking-tight">Revenue Clearance</h3>
                <div className="h-2 w-24 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 w-2/3"></div>
                </div>
            </div>
            <div className="grid grid-cols-1 gap-6">
                {pending.length > 0 ? pending.map((student: User) => (
                    <div key={student._id} className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6 hover:shadow-lg transition-all">
                        <div className="flex items-center gap-5">
                            <img src={student.paymentScreenshot} className="h-24 w-24 rounded-2xl object-cover cursor-pointer border-4 border-white shadow-md hover:scale-105 transition-transform" onClick={() => window.open(student.paymentScreenshot)} alt="Receipt" />
                            <div>
                                <p className="font-black text-slate-900 text-lg uppercase italic">{student.name}</p>
                                <p className="text-[10px] text-slate-400 font-black tracking-widest uppercase mt-1 flex items-center gap-2">
                                    <Clock size={14} className="text-amber-500" /> Awaiting Confirmation
                                </p>
                            </div>
                        </div>
                        <button onClick={() => onApprove(student._id)} className="w-full md:w-auto px-10 py-5 bg-emerald-600 text-white rounded-[1.25rem] font-black text-xs uppercase hover:bg-emerald-700 shadow-xl shadow-emerald-100 transition-all active:scale-95">
                            Approve Transaction
                        </button>
                    </div>
                )) : (
                    <div className="py-24 text-center">
                        <div className="inline-flex p-6 bg-slate-50 rounded-full mb-4 text-slate-200"><Wallet size={48} /></div>
                        <p className="text-slate-300 font-black uppercase italic tracking-[0.3em]">Vault is balanced / No pending payments</p>
                    </div>
                )}
            </div>
        </div>
    );
};