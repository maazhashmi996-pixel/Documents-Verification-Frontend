"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { toast, Toaster } from 'react-hot-toast';
import { Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { ROLES, isRole } from '@/lib/roles';
import AuthLayout from '@/Components/AuthLayout';
import AuthField from '@/Components/AuthField';

export default function RoleLoginPage() {
    const params = useParams<{ role: string }>();
    const router = useRouter();
    const valid = isRole(params.role);

    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    useEffect(() => {
        if (!valid) router.replace('/');
    }, [valid, router]);

    if (!isRole(params.role)) return null;
    const role = ROLES[params.role];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.post('/api/auth/login', { email, password, role: role.key });
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            toast.success('Signed in. Opening your dashboard...');
            setTimeout(() => router.push(role.dashboard), 700);
        } catch (err: any) {
            toast.error(err.response?.data?.msg || 'Could not sign in. Check your connection.');
            setLoading(false);
        }
    };

    return (
        <AuthLayout role={role} heading={`Sign in as ${role.title.toLowerCase()}`}>
            <Toaster position="top-center" />
            <form onSubmit={handleSubmit} className="space-y-5">
                <AuthField label="Email address" icon={<Mail size={18} />} type="email" value={email} onChange={setEmail} placeholder="name@example.com" autoComplete="email" />
                <AuthField label="Password" icon={<Lock size={18} />} type="password" value={password} onChange={setPassword} placeholder="Your password" autoComplete="current-password" />

                <div className="flex justify-end -mt-2">
                    <Link href={`/forgot-password/${role.key}`} className="text-sm font-semibold underline underline-offset-4" style={{ color: role.accentDeep }}>
                        Forgot password?
                    </Link>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 inline-flex items-center justify-center gap-2 rounded-xl font-semibold text-white transition hover:brightness-110 disabled:opacity-70 disabled:cursor-not-allowed"
                    style={{ background: role.solid }}
                >
                    {loading ? <Loader2 size={18} className="animate-spin" /> : <>Sign in <ArrowRight size={18} /></>}
                </button>
            </form>

            <p className="mt-8 pt-6 border-t border-line text-sm text-ink-soft">
                New {role.title.toLowerCase()}?{' '}
                <Link href={`/signup/${role.key}`} className="font-semibold underline underline-offset-4" style={{ color: role.accentDeep }}>
                    Create an account
                </Link>
            </p>
        </AuthLayout>
    );
}
