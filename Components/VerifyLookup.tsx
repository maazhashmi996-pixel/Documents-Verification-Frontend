"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ScanSearch, ArrowRight } from 'lucide-react';

// Employers / anyone with a shared link or code can check a document without an account.
export default function VerifyLookup() {
    const router = useRouter();
    const [value, setValue] = useState('');

    const go = (e: React.FormEvent) => {
        e.preventDefault();
        const code = value.trim().split('/').filter(Boolean).pop();
        if (code) router.push(`/verify/${encodeURIComponent(code)}`);
    };

    return (
        <form onSubmit={go} className="flex flex-col md:flex-row md:items-center gap-5 bg-white border border-line rounded-3xl p-6 sm:p-8 shadow-[0_24px_60px_-34px_rgba(15,27,51,0.3)]">
            <span className="hidden sm:inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#f8f1e2] text-gold-deep"><ScanSearch size={26} /></span>
            <div className="md:flex-1">
                <h2 className="font-display text-xl text-ink">Checking someone else&apos;s document?</h2>
                <p className="text-sm text-ink-soft mt-1">Paste the verification link or code you were given. No account needed.</p>
            </div>
            <div className="flex gap-3 md:w-[26rem]">
                <input
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="Verification link or code"
                    aria-label="Verification link or code"
                    className="min-w-0 flex-1 h-12 bg-white border border-line rounded-xl px-4 text-[15px] text-ink placeholder:text-ink-soft/40 outline-none focus:border-gold focus:ring-4 focus:ring-[#f8f1e2]"
                />
                <button type="submit" className="h-12 px-5 inline-flex items-center gap-2 rounded-xl font-semibold text-white bg-ink hover:brightness-125 transition">
                    Check <ArrowRight size={18} />
                </button>
            </div>
        </form>
    );
}
