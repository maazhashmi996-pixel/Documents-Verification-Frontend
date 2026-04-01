"use client";
import React from 'react';
import { CheckCircle, Clock, AlertCircle, FileUp } from 'lucide-react';

export default function StudentDashboard() {
    return (
        <div className="space-y-8">
            {/* Welcome Section */}
            <div>
                <h2 className="text-3xl font-extrabold text-slate-900">Welcome Back, Maaz! 👋</h2>
                <p className="text-slate-500 font-medium mt-1">Here's what's happening with your applications.</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    title="Verification Status"
                    value="Pending"
                    icon={<Clock className="text-amber-500" />}
                    bgColor="bg-amber-50"
                />
                <StatCard
                    title="Documents Uploaded"
                    value="04"
                    icon={<CheckCircle className="text-blue-500" />}
                    bgColor="bg-blue-50"
                />
                <StatCard
                    title="Payment Status"
                    value="Unpaid"
                    icon={<AlertCircle className="text-red-500" />}
                    bgColor="bg-red-50"
                />
            </div>

            {/* Recent Documents Table */}
            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-bold text-slate-900 text-lg">Recent Documents</h3>
                    <button className="bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-black transition-all">
                        <FileUp size={16} />
                        Upload New
                    </button>
                </div>
                <div className="p-6">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-slate-400 text-sm uppercase tracking-wider">
                                <th className="pb-4 font-semibold">Document Name</th>
                                <th className="pb-4 font-semibold">Institute</th>
                                <th className="pb-4 font-semibold">Status</th>
                                <th className="pb-4 font-semibold">Date</th>
                            </tr>
                        </thead>
                        <tbody className="text-slate-600 font-medium">
                            <tr className="border-b border-slate-50">
                                <td className="py-4">Matric Certificate</td>
                                <td className="py-4">FBISE Islamabad</td>
                                <td className="py-4 text-green-600 font-bold">Verified</td>
                                <td className="py-4">Mar 28, 2026</td>
                            </tr>
                            <tr className="border-b border-slate-50">
                                <td className="py-4">Intermediate Marksheet</td>
                                <td className="py-4">BISE Lahore</td>
                                <td className="py-4 text-amber-600 font-bold">In Review</td>
                                <td className="py-4">Mar 30, 2026</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon, bgColor }: any) {
    return (
        <div className="bg-white border border-slate-200 p-6 rounded-3xl flex items-center gap-5 shadow-sm hover:shadow-md transition-all">
            <div className={`${bgColor} h-14 w-14 rounded-2xl flex items-center justify-center`}>
                {icon}
            </div>
            <div>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-tight">{title}</p>
                <p className="text-2xl font-black text-slate-900">{value}</p>
            </div>
        </div>
    );
}