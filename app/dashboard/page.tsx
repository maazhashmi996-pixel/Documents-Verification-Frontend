"use client";
import React, { useState, useEffect } from 'react';
import { CheckCircle, Clock, AlertCircle, FileUp, MoreVertical } from 'lucide-react';
import UploadModal from '@/Components/UploadModal';
import api from '@/lib/api';

// Types for better TS support
interface Document {
    _id: string;
    title: string;
    institute: string;
    status: string;
    createdAt: string;
}

export default function StudentDashboard() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [documents, setDocuments] = useState<Document[]>([]);
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        verified: 0,
        isPaid: false
    });

    // Backend se data lane ka function
    const fetchDashboardData = async () => {
        try {
            const res = await api.get('/student/dashboard'); // Backend route check karein
            setDocuments(res.data.documents);
            setStats({
                total: res.data.documents.length,
                pending: res.data.documents.filter((d: any) => d.status === 'Pending').length,
                verified: res.data.documents.filter((d: any) => d.status === 'Verified').length,
                isPaid: res.data.user.isPaid
            });
        } catch (err) {
            console.error("Data fetch error", err);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Upload Modal Component */}
            <UploadModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    fetchDashboardData(); // Close hone par list refresh karein
                }}
            />

            {/* Welcome Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                        Welcome Back, Maaz! 👋
                    </h2>
                    <p className="text-slate-500 font-medium mt-1">
                        Manage your documents and track verification status.
                    </p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-slate-900 hover:bg-black text-white px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-slate-200 active:scale-95"
                >
                    <FileUp size={20} />
                    Upload New Document
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    title="Verification Status"
                    value={stats.pending > 0 ? "Pending" : "Cleared"}
                    icon={<Clock className="text-amber-500" />}
                    bgColor="bg-amber-50"
                    desc={`${stats.pending} files in review`}
                />
                <StatCard
                    title="Total Uploaded"
                    value={stats.total.toString().padStart(2, '0')}
                    icon={<CheckCircle className="text-blue-500" />}
                    bgColor="bg-blue-50"
                    desc={`${stats.verified} verified successfully`}
                />
                <StatCard
                    title="Payment Status"
                    value={stats.isPaid ? "Paid" : "Unpaid"}
                    icon={<AlertCircle className={stats.isPaid ? "text-green-500" : "text-red-500"} />}
                    bgColor={stats.isPaid ? "bg-green-50" : "bg-red-50"}
                    desc={stats.isPaid ? "Full access granted" : "Pending fee clearance"}
                />
            </div>

            {/* Recent Documents Table */}
            <div className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm">
                <div className="p-8 border-b border-slate-100">
                    <h3 className="font-bold text-slate-900 text-xl tracking-tight">Recent Documents</h3>
                </div>
                <div className="p-0 overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 text-slate-400 text-xs uppercase tracking-[0.1em]">
                                <th className="px-8 py-4 font-bold">Document Name</th>
                                <th className="px-8 py-4 font-bold">Institute</th>
                                <th className="px-8 py-4 font-bold">Status</th>
                                <th className="px-8 py-4 font-bold text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="text-slate-600 font-medium">
                            {documents.length > 0 ? documents.map((doc) => (
                                <tr key={doc._id} className="border-b border-slate-50 hover:bg-slate-50/30 transition-colors">
                                    <td className="px-8 py-5 text-slate-900 font-bold">{doc.title}</td>
                                    <td className="px-8 py-5">{doc.institute}</td>
                                    <td className="px-8 py-5">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${doc.status === 'Verified' ? 'bg-green-100 text-green-700' :
                                            doc.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                                                'bg-amber-100 text-amber-700'
                                            }`}>
                                            {doc.status}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <button className="text-slate-400 hover:text-slate-900 transition-colors">
                                            <MoreVertical size={18} />
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={4} className="px-8 py-10 text-center text-slate-400 italic">
                                        No documents found. Start by uploading one.
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

// Reusable StatCard Component
function StatCard({ title, value, icon, bgColor, desc }: any) {
    return (
        <div className="bg-white border border-slate-200 p-7 rounded-[2rem] flex flex-col gap-4 shadow-sm hover:shadow-md transition-all group">
            <div className="flex justify-between items-start">
                <div className={`${bgColor} h-14 w-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110`}>
                    {icon}
                </div>
                <div className="text-[10px] font-bold text-slate-300 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded-md">
                    Stats 2026
                </div>
            </div>
            <div>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-tight">{title}</p>
                <p className="text-3xl font-black text-slate-900 mt-1">{value}</p>
                <p className="text-xs text-slate-400 mt-2 font-medium">{desc}</p>
            </div>
        </div>
    );
}