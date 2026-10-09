import React from 'react';
import Link from 'next/link';
import { ArrowLeft, GraduationCap, School, ShieldCheck } from 'lucide-react';
import Seal from './Seal';
import { RoleConfig } from '@/lib/roles';

const icons = {
    student: GraduationCap,
    university: School,
    admin: ShieldCheck,
};

export default function AuthLayout({ role, heading, children }: { role: RoleConfig; heading: string; children: React.ReactNode }) {
    const Icon = icons[role.key];
    const vars = {
        '--accent': role.accent,
        '--accent-deep': role.accentDeep,
        '--accent-soft': role.soft,
    } as React.CSSProperties;

    return (
        <main style={vars} className="min-h-screen grid lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
            {/* Brand panel */}
            <aside className="relative hidden lg:flex flex-col justify-between overflow-hidden p-12" style={{ background: role.soft }}>
                <Link href="/" className="inline-flex items-center gap-3 text-ink w-fit">
                    <Seal size={34} color={role.accent} />
                    <span className="font-display text-xl font-semibold">Qual Check</span>
                </Link>

                <div className="relative z-10 max-w-sm">
                    <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm" style={{ color: role.accentDeep }}>
                        <Icon size={26} />
                    </span>
                    <h2 className="font-display text-4xl leading-tight text-ink mt-6">{role.title} portal</h2>
                    <p className="text-ink-soft mt-3 leading-relaxed">{role.blurb}</p>
                </div>

                <Seal size={420} color={role.accent} className="absolute -right-24 -bottom-24 opacity-[0.09]" />
                <p className="relative z-10 text-sm text-ink-soft">Every document is checked before it is marked verified.</p>
            </aside>

            {/* Form panel */}
            <section className="flex items-center justify-center px-5 py-10 sm:px-10 bg-white lg:bg-pearl">
                <div className="w-full max-w-md">
                    <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-ink-soft hover:text-ink mb-8">
                        <ArrowLeft size={16} /> All portals
                    </Link>
                    <div className="bg-white lg:border lg:border-line lg:rounded-3xl lg:p-10 lg:shadow-[0_24px_60px_-30px_rgba(15,27,51,0.25)]">
                        <h1 className="font-display text-3xl text-ink">{heading}</h1>
                        <div className="mt-8">{children}</div>
                    </div>
                </div>
            </section>
        </main>
    );
}
