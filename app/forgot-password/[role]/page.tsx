"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { toast, Toaster } from 'react-hot-toast';
import { Mail, Lock, ArrowRight, Loader2, MailCheck } from 'lucide-react';
import api from '@/lib/api';
import { ROLES, isRole } from '@/lib/roles';
import AuthLayout from '@/Components/AuthLayout';
import AuthField from '@/Components/AuthField';
import OtpInput from '@/Components/OtpInput';

export default function ForgotPasswordPage() {
    const params = useParams<{ role: string }>();
    const router = useRouter();
    const valid = isRole(params.role);

    const [step, setStep] = useState<'email' | 'reset'>('email');
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [cooldown, setCooldown] = useState(0);

    useEffect(() => {
        if (!valid) router.replace('/');
    }, [valid, router]);

    useEffect(() => {
        if (cooldown <= 0) return;
        const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
        return () => clearTimeout(t);
    }, [cooldown]);

    if (!isRole(params.role)) return null;
    const role = ROLES[params.role];
    const btn = 'w-full h-12 inline-flex items-center justify-center gap-2 rounded-xl font-semibold text-white transition hover:brightness-110 disabled:opacity-70 disabled:cursor-not-allowed';

    const requestCode = async (e?: React.FormEvent) => {
        e?.preventDefault();
        setLoading(true);
        try {
            const res = await api.post('/api/auth/forgot-password', { email, role: role.key });
            toast.success(res.data.msg);
            setCooldown(res.data.resendAfterSeconds || 60);
            setCode('');
            setStep('reset');
        } catch (err: any) {
            toast.error(err.response?.data?.msg || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const resetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (code.length < 6) return toast.error('Enter all 6 digits.');
        if (password.length < 6) return toast.error('Password must be at least 6 characters.');
        if (password !== confirm) return toast.error('The two passwords do not match.');
        setLoading(true);
        try {
            const res = await api.post('/api/auth/reset-password', { email, role: role.key, otp: code, newPassword: password });
            toast.success(res.data.msg);
            setTimeout(() => router.push(`/login/${role.key}`), 1600);
        } catch (err: any) {
            toast.error(err.response?.data?.msg || 'Could not reset the password.');
            if (err.response?.data?.expired) setStep('email');
            else setCode('');
            setLoading(false);
        }
    };

    return (
        <AuthLayout role={role} heading={step === 'email' ? 'Reset your password' : 'Choose a new password'}>
            <Toaster position="top-center" />

            {step === 'email' ? (
                <form onSubmit={requestCode} className="space-y-5">
                    <p className="text-sm text-ink-soft leading-relaxed">
                        Enter the email of your {role.title.toLowerCase()} account and we will send you a 6-digit code.
                    </p>
                    <AuthField label="Email address" icon={<Mail size={18} />} type="email" value={email} onChange={setEmail} placeholder="name@example.com" autoComplete="email" />
                    <button type="submit" disabled={loading} className={btn} style={{ background: role.solid }}>
                        {loading ? <Loader2 size={18} className="animate-spin" /> : <>Send code <ArrowRight size={18} /></>}
                    </button>
                </form>
            ) : (
                <form onSubmit={resetPassword} className="space-y-5">
                    <div className="flex items-start gap-3 rounded-2xl p-4" style={{ background: role.soft }}>
                        <MailCheck size={20} className="mt-0.5 shrink-0" style={{ color: role.accentDeep }} />
                        <p className="text-sm text-ink leading-relaxed">
                            If an account exists for <span className="font-semibold break-all">{email}</span>, a code is on its way. It is valid for 10 minutes.
                        </p>
                    </div>

                    <OtpInput value={code} onChange={setCode} />

                    <AuthField label="New password" icon={<Lock size={18} />} type="password" value={password} onChange={setPassword} placeholder="At least 6 characters" autoComplete="new-password" />
                    <AuthField label="Confirm new password" icon={<Lock size={18} />} type="password" value={confirm} onChange={setConfirm} placeholder="Repeat the password" autoComplete="new-password" />

                    <button type="submit" disabled={loading || code.length < 6} className={btn} style={{ background: role.solid }}>
                        {loading ? <Loader2 size={18} className="animate-spin" /> : <>Update password <ArrowRight size={18} /></>}
                    </button>

                    <div className="flex items-center justify-between text-sm">
                        <button type="button" onClick={() => setStep('email')} className="font-semibold text-ink-soft hover:text-ink">Change email</button>
                        <button
                            type="button"
                            onClick={() => requestCode()}
                            disabled={cooldown > 0 || loading}
                            className="font-semibold disabled:text-ink-soft/60 disabled:cursor-not-allowed"
                            style={cooldown > 0 ? undefined : { color: role.accentDeep }}
                        >
                            {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
                        </button>
                    </div>
                </form>
            )}

            <p className="mt-8 pt-6 border-t border-line text-sm text-ink-soft">
                Remembered it?{' '}
                <Link href={`/login/${role.key}`} className="font-semibold underline underline-offset-4" style={{ color: role.accentDeep }}>
                    Back to sign in
                </Link>
            </p>
        </AuthLayout>
    );
}
