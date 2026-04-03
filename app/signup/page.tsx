"use client";
import React, { useState } from 'react';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import { toast, Toaster } from 'react-hot-toast';
import {
    User, Mail, Lock, Contact2, ArrowRight,
    ShieldCheck, GraduationCap, School, Eye, EyeOff
} from 'lucide-react';

export default function SignupPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [role, setRole] = useState('student');
    const [showPassword, setShowPassword] = useState(false); // Password Toggle State

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        passportNumber: '',
        role: 'student'
    });

    const handleRoleChange = (newRole: string) => {
        setRole(newRole);
        setFormData({ ...formData, role: newRole });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await api.post('/auth/signup', formData);
            toast.success(response.data.msg || "Signup Successful!");
            setTimeout(() => router.push('/login'), 2000);
        } catch (err: any) {
            toast.error(err.response?.data?.msg || "Signup Failed!");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] py-12 px-4">
            <Toaster position="top-center" />

            <div className="max-w-xl w-full bg-white border border-slate-200 p-8 md:p-12 rounded-[2.5rem] shadow-2xl shadow-slate-200/60">

                {/* Header */}
                <div className="text-center mb-10">
                    <h2 className="text-4xl font-black text-slate-900 tracking-tighter mb-2">Create Account</h2>
                    <p className="text-slate-500 font-bold uppercase text-xs tracking-[0.2em]">Select your account type</p>
                </div>

                {/* VIP Role Selector */}
                <div className="grid grid-cols-3 gap-3 mb-10 p-1.5 bg-slate-100 rounded-2xl border border-slate-200">
                    <RoleButton
                        active={role === 'student'}
                        onClick={() => handleRoleChange('student')}
                        icon={<GraduationCap size={18} />}
                        label="Student"
                    />
                    <RoleButton
                        active={role === 'university'}
                        onClick={() => handleRoleChange('university')}
                        icon={<School size={18} />}
                        label="University"
                    />
                    <RoleButton
                        active={role === 'admin'}
                        onClick={() => handleRoleChange('admin')}
                        icon={<ShieldCheck size={18} />}
                        label="Admin"
                    />
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Full Name */}
                    <div className="space-y-1">
                        <label className="text-xs font-black text-slate-400 uppercase ml-1 tracking-widest">Full Name</label>
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
                            <input
                                type="text"
                                placeholder={role === 'university' ? "University Name" : "Maaz Hashmi"}
                                required
                                className="w-full bg-slate-50 border border-slate-200 text-slate-900 pl-12 pr-4 py-4 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-bold"
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Email */}
                    <div className="space-y-1">
                        <label className="text-xs font-black text-slate-400 uppercase ml-1 tracking-widest">Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
                            <input
                                type="email"
                                placeholder="name@example.com"
                                required
                                className="w-full bg-slate-50 border border-slate-200 text-slate-900 pl-12 pr-4 py-4 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-bold"
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Passport Number - Only for Students */}
                    {role === 'student' && (
                        <div className="space-y-1 animate-in slide-in-from-top-2 duration-300">
                            <label className="text-xs font-black text-slate-400 uppercase ml-1 tracking-widest">Passport Number</label>
                            <div className="relative">
                                <Contact2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
                                <input
                                    type="text"
                                    placeholder="ABC123456"
                                    required
                                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 pl-12 pr-4 py-4 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-bold uppercase"
                                    onChange={(e) => setFormData({ ...formData, passportNumber: e.target.value })}
                                />
                            </div>
                        </div>
                    )}

                    {/* Password Input with Toggle */}
                    <div className="space-y-1">
                        <label className="text-xs font-black text-slate-400 uppercase ml-1 tracking-widest">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                required
                                className="w-full bg-slate-50 border border-slate-200 text-slate-900 pl-12 pr-12 py-4 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-bold"
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            />
                            {/* Eye Button */}
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-slate-900 hover:bg-black text-white font-black py-5 rounded-2xl shadow-xl shadow-slate-200 transition-all flex items-center justify-center gap-3 group disabled:opacity-70 mt-4"
                    >
                        {loading ? 'Processing...' : (
                            <>
                                Create {role.charAt(0).toUpperCase() + role.slice(1)} Account
                                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>
                </form>

                <p className="text-center text-slate-400 mt-10 text-sm font-bold">
                    Already have an account? <a href="/login" className="text-blue-600 hover:text-blue-700 underline underline-offset-4 decoration-2">Sign In</a>
                </p>
            </div>
        </div>
    );
}

function RoleButton({ active, onClick, icon, label }: any) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`flex flex-col items-center justify-center gap-2 py-3 rounded-xl transition-all duration-300 ${active
                ? 'bg-white text-blue-600 shadow-md scale-100'
                : 'text-slate-400 hover:text-slate-600 grayscale'
                }`}
        >
            {icon}
            <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
        </button>
    );
}