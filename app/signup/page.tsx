"use client";
import React, { useState } from 'react';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import { toast, Toaster } from 'react-hot-toast';
import { User, Mail, Lock, Contact2, ArrowRight } from 'lucide-react';

export default function SignupPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        passportNumber: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/auth/signup', formData);
            toast.success("Signup Successful! Wait for Admin Approval.");
            setTimeout(() => router.push('/login'), 2000);
        } catch (err: any) {
            toast.error(err.response?.data?.msg || "Signup Failed!");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
            <Toaster position="top-center" />

            <div className="max-w-md w-full bg-white border border-slate-200 p-10 rounded-3xl shadow-xl shadow-slate-200/50">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-50 rounded-2xl mb-4">
                        <User className="text-blue-600 h-8 w-8" />
                    </div>
                    <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Create Account</h2>
                    <p className="text-slate-500 mt-2 font-medium">Join Qual Check CRM System</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Name Input */}
                    <div className="space-y-1">
                        <label className="text-sm font-semibold text-slate-700 ml-1">Full Name</label>
                        <div className="relative">
                            <User className="absolute left-3 top-3.5 text-slate-400 h-5 w-5" />
                            <input
                                type="text"
                                placeholder="Maaz Hashmi"
                                required
                                className="w-full bg-slate-50 border border-slate-200 text-slate-900 pl-11 pr-4 py-3.5 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400"
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Email Input */}
                    <div className="space-y-1">
                        <label className="text-sm font-semibold text-slate-700 ml-1">Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3.5 text-slate-400 h-5 w-5" />
                            <input
                                type="email"
                                placeholder="name@example.com"
                                required
                                className="w-full bg-slate-50 border border-slate-200 text-slate-900 pl-11 pr-4 py-3.5 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400"
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Passport Input */}
                    <div className="space-y-1">
                        <label className="text-sm font-semibold text-slate-700 ml-1">Passport Number</label>
                        <div className="relative">
                            <Contact2 className="absolute left-3 top-3.5 text-slate-400 h-5 w-5" />
                            <input
                                type="text"
                                placeholder="ABC123456"
                                className="w-full bg-slate-50 border border-slate-200 text-slate-900 pl-11 pr-4 py-3.5 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400"
                                onChange={(e) => setFormData({ ...formData, passportNumber: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Password Input */}
                    <div className="space-y-1">
                        <label className="text-sm font-semibold text-slate-700 ml-1">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3.5 text-slate-400 h-5 w-5" />
                            <input
                                type="password"
                                placeholder="••••••••"
                                required
                                className="w-full bg-slate-50 border border-slate-200 text-slate-900 pl-11 pr-4 py-3.5 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400"
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-slate-900 hover:bg-black text-white font-bold py-4 rounded-2xl shadow-lg shadow-slate-200 transition-all flex items-center justify-center gap-2 group disabled:opacity-70"
                    >
                        {loading ? 'Processing...' : (
                            <>
                                Register Account
                                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>
                </form>

                <p className="text-center text-slate-500 mt-8 text-sm font-medium">
                    Already have an account? <a href="/login" className="text-blue-600 hover:text-blue-700 font-bold underline underline-offset-4">Sign In</a>
                </p>
            </div>
        </div>
    );
}