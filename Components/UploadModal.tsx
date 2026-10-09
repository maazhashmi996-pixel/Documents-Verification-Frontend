"use client";
import React, { useEffect, useRef, useState } from 'react';
import { X, UploadCloud, FileText, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    refreshData: () => void;
    // kept so older callers still compile
    userStatus?: { isPaid: boolean; isApproved: boolean; paymentStatus: string };
}

const MAX_MB = 10;
const ACCEPT = '.pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx';

export default function UploadModal({ isOpen, onClose, refreshData }: Props) {
    const [loading, setLoading] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [title, setTitle] = useState('');
    const [institute, setInstitute] = useState('');
    const [dragging, setDragging] = useState(false);
    const input = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !loading && onClose();
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [isOpen, loading, onClose]);

    if (!isOpen) return null;

    const pick = (f?: File | null) => {
        if (!f) return;
        if (f.size > MAX_MB * 1024 * 1024) return toast.error(`File is too large (max ${MAX_MB} MB).`);
        setFile(f);
        if (!title) setTitle(f.name.replace(/\.[^.]+$/, ''));
    };

    const reset = () => { setFile(null); setTitle(''); setInstitute(''); };

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return toast.error('Please choose a document first.');
        setLoading(true);
        const fd = new FormData();
        fd.append('file', file);
        fd.append('title', title);
        fd.append('institute', institute);
        try {
            await api.post('/api/student/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            toast.success('Document uploaded. It is now waiting for review.');
            refreshData();
            reset();
            onClose();
        } catch (err: any) {
            toast.error(err.response?.data?.msg || 'Upload failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 bg-ink/40 backdrop-blur-sm" onClick={() => !loading && onClose()}>
            <form
                onSubmit={submit}
                onClick={(e) => e.stopPropagation()}
                className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl max-h-[92vh] overflow-y-auto"
            >
                <div className="flex items-start justify-between">
                    <div>
                        <h2 className="font-display text-2xl text-ink">Upload a document</h2>
                        <p className="text-sm text-ink-soft mt-1">PDF, image, Word or Excel, up to {MAX_MB} MB.</p>
                    </div>
                    <button type="button" onClick={onClose} disabled={loading} aria-label="Close" className="p-2 -mr-2 -mt-2 rounded-xl text-ink-soft hover:bg-pearl"><X size={20} /></button>
                </div>

                <div
                    onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={(e) => { e.preventDefault(); setDragging(false); pick(e.dataTransfer.files?.[0]); }}
                    onClick={() => input.current?.click()}
                    className={`mt-6 cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition ${dragging ? 'border-[var(--accent)] bg-[var(--accent-soft)]' : 'border-line hover:border-[var(--accent)]'}`}
                >
                    <input ref={input} type="file" accept={ACCEPT} className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
                    {file ? (
                        <div className="flex items-center justify-center gap-3 text-ink">
                            <FileText size={22} className="text-[var(--accent)] shrink-0" />
                            <span className="font-semibold truncate max-w-[16rem]">{file.name}</span>
                            <span className="text-xs text-ink-soft shrink-0">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                        </div>
                    ) : (
                        <>
                            <UploadCloud size={30} className="mx-auto text-[var(--accent)]" />
                            <p className="mt-3 font-semibold text-ink">Drop a file here or click to browse</p>
                        </>
                    )}
                </div>

                <div className="mt-5 space-y-4">
                    <label className="block">
                        <span className="block text-sm font-semibold text-ink mb-1.5">Document title</span>
                        <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. BSc Computer Science degree"
                            className="w-full h-12 bg-white border border-line rounded-xl px-4 text-[15px] text-ink outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent-soft)]" />
                    </label>
                    <label className="block">
                        <span className="block text-sm font-semibold text-ink mb-1.5">Issuing institute</span>
                        <input required value={institute} onChange={(e) => setInstitute(e.target.value)} placeholder="Name of the university or board"
                            className="w-full h-12 bg-white border border-line rounded-xl px-4 text-[15px] text-ink outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent-soft)]" />
                    </label>
                </div>

                <button type="submit" disabled={loading || !file} className="mt-6 w-full h-12 inline-flex items-center justify-center gap-2 rounded-xl font-semibold text-white bg-[var(--accent)] hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed transition">
                    {loading ? <Loader2 size={18} className="animate-spin" /> : 'Submit for verification'}
                </button>
            </form>
        </div>
    );
}
