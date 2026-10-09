"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { BadgeCheck, Clock, XCircle, Loader2, SearchX, ArrowLeft } from 'lucide-react';
import api from '@/lib/api';
import Seal from '@/Components/Seal';

interface Result {
    holder: string;
    title: string;
    institute: string;
    status: 'Pending' | 'Verified' | 'Rejected';
    remarks: string;
    hasAttestation: boolean;
    submittedAt: string;
    verifiedAt: string | null;
}

const STATUS = {
    Verified: { Icon: BadgeCheck, label: 'Verified document', text: 'This document was checked and verified by Qual Check.', color: '#1e6b5a', soft: '#e6f3ef' },
    Pending: { Icon: Clock, label: 'Verification pending', text: 'This document was submitted but has not been verified yet.', color: '#8a6212', soft: '#fbf3df' },
    Rejected: { Icon: XCircle, label: 'Document rejected', text: 'This document did not pass verification.', color: '#b4233c', soft: '#fdecef' },
} as const;

const fmt = (d?: string | null) => (d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '');

export default function PublicVerifyPage() {
    const { code } = useParams<{ code: string }>();
    const [state, setState] = useState<'loading' | 'ok' | 'missing' | 'error'>('loading');
    const [data, setData] = useState<Result | null>(null);

    useEffect(() => {
        let alive = true;
        api.get(`/api/public/verify/${encodeURIComponent(code)}`)
            .then((res) => { if (alive) { setData(res.data.data); setState('ok'); } })
            .catch((err) => { if (alive) setState(err.response?.status === 404 ? 'missing' : 'error'); });
        return () => { alive = false; };
    }, [code]);

    return (
        <main className="min-h-screen flex flex-col items-center px-5 py-10 sm:py-16 relative overflow-hidden">
            <Seal size={560} color="#b8924a" className="absolute -right-40 -top-32 opacity-[0.06] pointer-events-none" />

            <div className="relative w-full max-w-lg">
                <Link href="/" className="inline-flex items-center gap-3 text-ink mb-8">
                    <Seal size={32} color="#b8924a" />
                    <span className="font-display text-lg font-semibold">Qual Check</span>
                </Link>

                {state === 'loading' && (
                    <div className="bg-white border border-line rounded-3xl p-12 flex justify-center">
                        <Loader2 className="animate-spin text-ink-soft" />
                    </div>
                )}

                {(state === 'missing' || state === 'error') && (
                    <div className="bg-white border border-line rounded-3xl p-8 sm:p-10 shadow-[0_24px_60px_-30px_rgba(15,27,51,0.25)]">
                        <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#fdecef] text-[#b4233c]"><SearchX size={26} /></span>
                        <h1 className="font-display text-3xl text-ink mt-6">
                            {state === 'missing' ? 'Link not recognised' : 'Could not check right now'}
                        </h1>
                        <p className="text-ink-soft mt-3 leading-relaxed">
                            {state === 'missing'
                                ? 'This verification link is not valid, or the document owner turned it off. Ask them for a fresh link.'
                                : 'The verification service did not answer. Please try again in a moment.'}
                        </p>
                        <Link href="/" className="inline-flex items-center gap-2 mt-8 text-sm font-semibold text-ink-soft hover:text-ink">
                            <ArrowLeft size={16} /> Back to Qual Check
                        </Link>
                    </div>
                )}

                {state === 'ok' && data && (() => {
                    const s = STATUS[data.status];
                    return (
                        <div className="bg-white border border-line rounded-3xl overflow-hidden shadow-[0_24px_60px_-30px_rgba(15,27,51,0.25)]">
                            <div className="p-8 sm:p-10" style={{ background: s.soft }}>
                                <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white" style={{ color: s.color }}><s.Icon size={28} /></span>
                                <h1 className="font-display text-3xl mt-6" style={{ color: s.color }}>{s.label}</h1>
                                <p className="text-ink-soft mt-2 leading-relaxed">{s.text}</p>
                            </div>

                            <dl className="p-8 sm:p-10 space-y-5">
                                <Row label="Document" value={data.title} />
                                <Row label="Issued by" value={data.institute} />
                                <Row label="Document holder" value={data.holder} />
                                <Row label="Submitted" value={fmt(data.submittedAt)} />
                                {data.verifiedAt && <Row label={data.status === 'Verified' ? 'Verified on' : 'Reviewed on'} value={fmt(data.verifiedAt)} />}
                                {data.remarks && <Row label="Reviewer remarks" value={data.remarks} />}
                                {data.status === 'Verified' && (
                                    <Row label="Attestation slip" value={data.hasAttestation ? 'Issued and on file' : 'Not attached'} />
                                )}
                            </dl>

                            <p className="px-8 sm:px-10 pb-8 text-xs text-ink-soft leading-relaxed">
                                The holder&apos;s name is partly hidden to protect their privacy. This page always shows the current status.
                            </p>
                        </div>
                    );
                })()}
            </div>
        </main>
    );
}

function Row({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 border-b border-line pb-4 last:border-0 last:pb-0">
            <dt className="text-sm text-ink-soft">{label}</dt>
            <dd className="font-semibold text-ink sm:text-right break-words">{value}</dd>
        </div>
    );
}
