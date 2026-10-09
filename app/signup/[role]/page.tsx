"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { toast, Toaster } from 'react-hot-toast';
import { User, Mail, Lock, Phone, Contact2, School, ArrowRight, Loader2, MailCheck } from 'lucide-react';
import api from '@/lib/api';
import { ROLES, isRole } from '@/lib/roles';
import AuthLayout from '@/Components/AuthLayout';
import AuthField from '@/Components/AuthField';
import OtpInput from '@/Components/OtpInput';

export default function RoleSignupPage() {
    const params = useParams<{ role: string }>();
    const router = useRouter();
    const valid = isRole(params.role);

    const [step, setStep] = useState<'form' | 'otp'>('form');
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({ name: '', email: '', phone: '', passportNumber: '', password: '' });
    const [code, setCode] = useState('');
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
    const set = (key: keyof typeof form) => (value: string) => setForm((f) => ({ ...f, [key]: value }));

    // ---------- Step 1: details ----------
    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.post('/api/auth/signup', { ...form, role: role.key });
            if (res.data.requiresOtp) {
                toast.success(res.data.msg);
                setCooldown(res.data.resendAfterSeconds || 60);
                setCode('');
                setStep('otp');
            } else {
                toast.success(res.data.msg);
                setTimeout(() => router.push(`/login/${role.key}`), 2200);
            }
        } catch (err: any) {
            toast.error(err.response?.data?.msg || 'Sign up failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // ---------- Step 2: code ----------
    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        if (code.length < 6) return toast.error('Enter all 6 digits.');
        setLoading(true);
        try {
            const res = await api.post('/api/auth/verify-otp', { email: form.email, otp: code });
            toast.success(res.data.msg);
            setTimeout(() => router.push(`/login/${role.key}`), 1800);
        } catch (err: any) {
            toast.error(err.response?.data?.msg || 'Verification failed.');
            if (err.response?.data?.expired) setStep('form');
            else setCode('');
            setLoading(false);
        }
    };

    const handleResend = async () => {
        try {
            const res = await api.post('/api/auth/resend-otp', { email: form.email });
            toast.success(res.data.msg);
            setCooldown(res.data.resendAfterSeconds || 60);
            setCode('');
        } catch (err: any) {
            toast.error(err.response?.data?.msg || 'Could not resend the code.');
            if (err.response?.data?.expired) setStep('form');
        }
    };

    const submitClass = 'w-full h-12 inline-flex items-center justify-center gap-2 rounded-xl font-semibold text-white transition hover:brightness-110 disabled:opacity-70 disabled:cursor-not-allowed';

    return (
        <AuthLayout role={role} heading={step === 'form' ? `Create ${role.article} ${role.title.toLowerCase()} account` : 'Check your email'}>
            <Toaster position="top-center" />

            {step === 'form' ? (
                <form onSubmit={handleSignup} className="space-y-5">
                    <AuthField
                        label={role.key === 'university' ? 'University name' : 'Full name'}
                        icon={role.key === 'university' ? <School size={18} /> : <User size={18} />}
                        value={form.name} onChange={set('name')}
                        placeholder={role.key === 'university' ? 'Name of your institution' : 'Your full name'}
                        autoComplete="name"
                    />
                    <AuthField label="Email address" icon={<Mail size={18} />} type="email" value={form.email} onChange={set('email')} placeholder="name@example.com" autoComplete="email" />

                    {role.key === 'student' && (
                        <>
                            <AuthField label="Phone number" icon={<Phone size={18} />} type="tel" value={form.phone} onChange={set('phone')} placeholder="+92 300 1234567" autoComplete="tel" />
                            <AuthField label="Passport number" icon={<Contact2 size={18} />} value={form.passportNumber} onChange={set('passportNumber')} placeholder="AB1234567" uppercase />
                        </>
                    )}

                    <AuthField label="Password" icon={<Lock size={18} />} type="password" value={form.password} onChange={set('password')} placeholder="At least 6 characters" autoComplete="new-password" />

                    <p className="text-sm text-ink-soft leading-relaxed">{role.signupNote}</p>

                    <button type="submit" disabled={loading} className={submitClass} style={{ background: role.solid }}>
                        {loading ? <Loader2 size={18} className="animate-spin" /> : (
                            role.key === 'university' ? <>Send for approval <ArrowRight size={18} /></> : <>Email me a code <ArrowRight size={18} /></>
                        )}
                    </button>
                </form>
            ) : (
                <form onSubmit={handleVerify} className="space-y-6">
                    <div className="flex items-start gap-3 rounded-2xl p-4" style={{ background: role.soft }}>
                        <MailCheck size={20} className="mt-0.5 shrink-0" style={{ color: role.accentDeep }} />
                        <p className="text-sm text-ink leading-relaxed">
                            We sent a 6-digit code to <span className="font-semibold break-all">{form.email}</span>. It is valid for 10 minutes.
                        </p>
                    </div>

                    <OtpInput value={code} onChange={setCode} />

                    <button type="submit" disabled={loading || code.length < 6} className={submitClass} style={{ background: role.solid }}>
                        {loading ? <Loader2 size={18} className="animate-spin" /> : <>Verify and create account <ArrowRight size={18} /></>}
                    </button>

                    <div className="flex items-center justify-between text-sm">
                        <button type="button" onClick={() => setStep('form')} className="font-semibold text-ink-soft hover:text-ink">
                            Change email
                        </button>
                        <button
                            type="button"
                            onClick={handleResend}
                            disabled={cooldown > 0}
                            className="font-semibold disabled:text-ink-soft/60 disabled:cursor-not-allowed"
                            style={cooldown > 0 ? undefined : { color: role.accentDeep }}
                        >
                            {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
                        </button>
                    </div>
                </form>
            )}

            <p className="mt-8 pt-6 border-t border-line text-sm text-ink-soft">
                Already have an account?{' '}
                <Link href={`/login/${role.key}`} className="font-semibold underline underline-offset-4" style={{ color: role.accentDeep }}>
                    Sign in
                </Link>
            </p>
        </AuthLayout>
    );
}
