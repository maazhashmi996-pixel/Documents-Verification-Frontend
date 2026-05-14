"use client";
import React, { useState, useEffect } from 'react';
import { X, Upload, CheckCircle2, File as FileIcon, Clock, ArrowRight, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    userStatus: {
        isPaid: boolean;
        isApproved: boolean;
        paymentStatus: string;
    };
    refreshData: () => void;
}

export default function UploadModal({ isOpen, onClose, userStatus, refreshData }: Props) {
    const [loading, setLoading] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [title, setTitle] = useState('');
    const [institute, setInstitute] = useState('');

    // Modal Steps: Only 'upload' is active now
    const [step, setStep] = useState<'upload'>('upload');

    useEffect(() => {
        if (isOpen) {
            setStep('upload');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    // --- STEP 1: DOCUMENT UPLOAD (Now Free/Instant) ---
    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return toast.error("Please select a document");

        setLoading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', title);
        formData.append('institute', institute);

        try {
            await api.post('/api/student/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            toast.success("Document uploaded successfully for review!");
            refreshData();

            // Temporary: Close modal immediately after success instead of going to payment
            setTimeout(() => {
                onClose();
                setFile(null);
                setTitle('');
                setInstitute('');
            }, 1500);

        } catch (err: any) {
            toast.error(err.response?.data?.msg || "Upload failed.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-md p-4">
            <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 border border-slate-100">

                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div>
                        <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                            Upload Credentials
                        </h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Instant Verification Portal</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                        <X size={20} className="text-slate-500" />
                    </button>
                </div>

                {/* UPLOAD FORM */}
                <form onSubmit={handleUpload} className="p-8 space-y-5">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex justify-between items-center px-1">
                                <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Document Title</label>
                                <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-md">Free Access</span>
                            </div>
                            <input
                                type="text"
                                placeholder="e.g. Matric Certificate"
                                className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl outline-none focus:border-indigo-500 transition-all font-semibold"
                                required
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-500 uppercase ml-1 tracking-wider">Board / Institute</label>
                            <input
                                type="text"
                                placeholder="e.g. BISE Lahore"
                                className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl outline-none focus:border-indigo-500 transition-all font-semibold"
                                required
                                value={institute}
                                onChange={(e) => setInstitute(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-500 uppercase ml-1 tracking-wider">Attachment</label>
                            <div className={`relative border-2 border-dashed rounded-[2rem] p-8 transition-all flex flex-col items-center justify-center gap-3 ${file ? 'border-green-400 bg-green-50' : 'border-slate-200 bg-slate-50 hover:border-indigo-400'}`}>
                                <input
                                    type="file"
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                                />
                                {file ? (
                                    <>
                                        <CheckCircle2 size={32} className="text-green-500" />
                                        <p className="text-sm font-bold text-green-700 truncate max-w-[220px]">{file.name}</p>
                                    </>
                                ) : (
                                    <>
                                        <Upload size={32} className="text-slate-300" />
                                        <p className="text-sm font-bold text-slate-500">Select Document File</p>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-slate-900 hover:bg-black text-white font-bold py-5 rounded-[1.5rem] shadow-xl transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : <>Submit Document <ArrowRight size={18} /></>}
                    </button>
                </form>

                <div className="p-4 bg-slate-50/50 border-t border-slate-100 text-center">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Secure Cloud Encryption Enabled</p>
                </div>
            </div>
        </div>
    );
}