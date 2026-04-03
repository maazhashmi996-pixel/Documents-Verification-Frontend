"use client";
import React, { useState } from 'react';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import { toast, Toaster } from 'react-hot-toast';
import { Mail, Lock, LogIn, ArrowRight, Eye, EyeOff, Loader2 } from 'lucide-react';

export default function LoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false); // Eye button state
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await api.post('/auth/login', formData);

            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.user));

            toast.success("Welcome back! Redirecting...");

            setTimeout(() => {
                if (res.data.user.role === 'admin') {
                    router.push('/admin');
                } else {
                    router.push('/dashboard');
                }
            }, 1000);

        } catch (err: any) {
            const message = err.response?.data?.msg || "Login failed. Check your connection.";
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] px-4 selection:bg-indigo-100 selection:text-indigo-900">
            <Toaster position="top-center" reverseOrder={false} />

            <div className="max-w-md w-full bg-white border border-slate-200 p-8 md:p-10 rounded-[2.5rem] shadow-2xl shadow-slate-200/60 transition-all duration-500">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-50 rounded-3xl mb-6 animate-pulse-slow">
                        <LogIn className="text-indigo-600 h-10 w-10" />
                    </div>
                    <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Welcome Back</h2>
                    <p className="text-slate-500 font-medium tracking-wide">Enter your details to access Qual Check</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Email Input */}
                    <div className="group space-y-1.5">
                        <label className="text-sm font-bold text-slate-700 ml-1 transition-colors group-focus-within:text-indigo-600">
                            Email Address
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5 transition-colors group-focus-within:text-indigo-500" />
                            <input
                                type="email"
                                placeholder="maaz@example.com"
                                required
                                className="w-full bg-slate-50 border-2 border-slate-100 text-slate-900 pl-12 pr-4 py-4 rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400 font-medium"
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Password Input */}
                    <div className="group space-y-1.5">
                        <div className="flex justify-between items-center px-1">
                            <label className="text-sm font-bold text-slate-700 transition-colors group-focus-within:text-indigo-600">
                                Password
                            </label>
                            <a href="#" className="text-xs font-black text-indigo-600 hover:text-indigo-800 transition-colors">
                                Forgot Password?
                            </a>
                        </div>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5 transition-colors group-focus-within:text-indigo-500" />
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                required
                                className="w-full bg-slate-50 border-2 border-slate-100 text-slate-900 pl-12 pr-12 py-4 rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400 font-medium"
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            />
                            {/* Eye Toggle Button */}
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                            >
                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                        </div>
                    </div>

                    {/* Login Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-slate-900 hover:bg-indigo-600 text-white font-bold py-4 rounded-2xl shadow-[0_10px_20px_-10px_rgba(0,0,0,0.3)] hover:shadow-indigo-200 transition-all duration-300 flex items-center justify-center gap-2 group active:scale-[0.98] disabled:opacity-80 disabled:cursor-not-allowed mt-4"
                    >
                        {loading ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                            <>
                                Sign In
                                <ArrowRight className="h-5 w-5 group-hover:translate-x-1.5 transition-transform" />
                            </>
                        )}
                    </button>
                </form>

                {/* Footer Link */}
                <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                    <p className="text-slate-500 text-sm font-medium">
                        Don&apos;t have an account?
                        <a href="/signup" className="ml-1 text-indigo-600 hover:text-indigo-700 font-black decoration-2 underline-offset-4 hover:underline">
                            Create Account
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}