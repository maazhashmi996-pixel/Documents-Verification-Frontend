"use client";
import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { X, Copy, Check, Loader2, Link2Off, Download } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '@/lib/api';

interface Props {
    doc: { _id: string; title: string; status: string } | null;
    onClose: () => void;
}

// Gives the student a public link + QR code for ONE document. Anyone with it can see its status.
export default function ShareModal({ doc, onClose }: Props) {
    const [link, setLink] = useState('');
    const [qr, setQr] = useState('');
    const [busy, setBusy] = useState(true);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!doc) return;
        let alive = true;
        setBusy(true); setLink(''); setQr(''); setCopied(false);
        (async () => {
            try {
                const res = await api.post(`/api/student/document/${doc._id}/share`);
                const url = `${window.location.origin}/verify/${res.data.code}`;
                const img = await QRCode.toDataURL(url, { width: 360, margin: 1, color: { dark: '#0f1b33', light: '#ffffff' } });
                if (alive) { setLink(url); setQr(img); }
            } catch (err: any) {
                toast.error(err.response?.data?.msg || 'Could not create the link.');
                onClose();
            } finally {
                if (alive) setBusy(false);
            }
        })();
        return () => { alive = false; };
    }, [doc, onClose]);

    useEffect(() => {
        if (!doc) return;
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [doc, onClose]);

    if (!doc) return null;

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(link);
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
        } catch {
            toast.error('Copy failed. Select the link and copy it manually.');
        }
    };

    const disable = async () => {
        try {
            await api.delete(`/api/student/document/${doc._id}/share`);
            toast.success('Public link turned off.');
            onClose();
        } catch (err: any) {
            toast.error(err.response?.data?.msg || 'Could not turn the link off.');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 bg-ink/40 backdrop-blur-sm" onClick={onClose}>
            <div onClick={(e) => e.stopPropagation()} className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl max-h-[92vh] overflow-y-auto">
                <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                        <h2 className="font-display text-2xl text-ink">Share verification</h2>
                        <p className="text-sm text-ink-soft mt-1 truncate">{doc.title}</p>
                    </div>
                    <button onClick={onClose} aria-label="Close" className="p-2 -mr-2 -mt-2 rounded-xl text-ink-soft hover:bg-pearl"><X size={20} /></button>
                </div>

                <div className="mt-6 flex justify-center">
                    <div className="h-52 w-52 rounded-2xl border border-line bg-white flex items-center justify-center">
                        {busy ? <Loader2 className="animate-spin text-ink-soft" /> : qr && <img src={qr} alt="QR code for the verification link" className="h-48 w-48" />}
                    </div>
                </div>

                <div className="mt-5 flex gap-2">
                    <input readOnly value={link} aria-label="Verification link" className="min-w-0 flex-1 h-11 bg-pearl border border-line rounded-xl px-3 text-sm text-ink outline-none" onFocus={(e) => e.target.select()} />
                    <button onClick={copy} disabled={!link} className="h-11 px-4 inline-flex items-center gap-2 rounded-xl font-semibold text-white bg-[var(--accent)] hover:brightness-110 disabled:opacity-60">
                        {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? 'Copied' : 'Copy'}
                    </button>
                </div>

                {qr && (
                    <a href={qr} download={`verification-${doc._id}.png`} className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[var(--accent-deep)] hover:underline underline-offset-4">
                        <Download size={16} /> Save QR code as image
                    </a>
                )}

                <p className="mt-5 text-sm text-ink-soft leading-relaxed">
                    Anyone with this link can see the document title, issuer, its current status and your name with most letters hidden. Your email, passport number and the file itself stay private.
                </p>

                <button onClick={disable} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-rose-700 hover:underline underline-offset-4">
                    <Link2Off size={16} /> Turn this link off
                </button>
            </div>
        </div>
    );
}
