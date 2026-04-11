"use client";
import React, { useState } from 'react';
import { LayoutDashboard, FileText, CreditCard, Settings, LogOut, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
// Note: Ensure your file name is exactly 'Paymentsetup.tsx' or change the path below
import PaymentStep from './PaymentSetup';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('Overview');

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
    };

    // Callback function to handle what happens after payment submission
    const handlePaymentComplete = () => {
        setActiveTab('Overview'); // Redirect to overview after successful payment
    };

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Sidebar - Fixed for desktop */}
            <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col fixed h-full z-20">
                <div className="p-8">
                    <h1 className="text-2xl font-black text-slate-900 italic tracking-tighter">Qual Check</h1>
                </div>

                <nav className="flex-1 px-4 space-y-2">
                    <NavItem
                        icon={<LayoutDashboard size={20} />}
                        label="Overview"
                        active={activeTab === 'Overview'}
                        onClick={() => setActiveTab('Overview')}
                    />
                    <NavItem
                        icon={<CreditCard size={20} />}
                        label="Payments"
                        active={activeTab === 'Payments'}
                        onClick={() => setActiveTab('Payments')}
                    />
                    <NavItem
                        icon={<FileText size={20} />}
                        label="My Documents"
                        active={activeTab === 'Docs'}
                        onClick={() => setActiveTab('Docs')}
                    />
                    <NavItem
                        icon={<Settings size={20} />}
                        label="Settings"
                        active={activeTab === 'Settings'}
                        onClick={() => setActiveTab('Settings')}
                    />
                </nav>

                <div className="p-4 border-t border-slate-100">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-4 py-3 text-slate-400 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all font-bold text-sm"
                    >
                        <LogOut size={20} />
                        Logout System
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col ml-64">
                {/* Top Navbar */}
                <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-10 backdrop-blur-md bg-white/80">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                        Student Portal / {activeTab}
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="text-right">
                            <p className="text-sm font-black text-slate-900 leading-none">Maaz Hashmi</p>
                            <p className="text-[10px] text-green-600 font-black uppercase tracking-tighter mt-1">Verified Student</p>
                        </div>
                        <div className="h-10 w-10 bg-slate-900 rounded-2xl flex items-center justify-center border border-slate-800 shadow-xl shadow-slate-200 transition-transform hover:scale-105">
                            <User className="text-white" size={18} />
                        </div>
                    </div>
                </header>

                <div className="p-8">
                    {/* 1. Overview Tab (Children from page.tsx) */}
                    {activeTab === 'Overview' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {children}
                        </div>
                    )}

                    {/* 2. Payments Tab (Corrected Red Line by passing onComplete) */}
                    {activeTab === 'Payments' && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                            <PaymentStep onComplete={handlePaymentComplete} />
                        </div>
                    )}

                    {/* 3. Placeholder for other tabs */}
                    {activeTab !== 'Overview' && activeTab !== 'Payments' && (
                        <div className="flex flex-col items-center justify-center h-[60vh] text-slate-400">
                            <div className="p-6 bg-white rounded-full shadow-inner mb-4 animate-pulse">
                                <Settings size={40} className="text-slate-200" />
                            </div>
                            <p className="font-black italic uppercase tracking-widest text-xs">
                                Module {activeTab} is under development
                            </p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

// Optimized Sidebar NavItem Component
function NavItem({ icon, label, active = false, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-3 w-full px-4 py-4 rounded-2xl transition-all font-bold text-sm ${active
                ? 'bg-slate-900 text-white shadow-2xl shadow-slate-300 translate-x-2'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
        >
            <span className={`${active ? "text-indigo-400" : "text-slate-400"}`}>{icon}</span>
            {label}
        </button>
    );
}