"use client";
import React, { useState, useEffect } from 'react';
import { X, Upload, CheckCircle2, File as FileIcon, CreditCard, Clock, ArrowRight, Image as ImageIcon, Loader2 } from 'lucide-react';
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
    const [paymentLoading, setPaymentLoading] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [title, setTitle] = useState('');
    const [institute, setInstitute] = useState('');

    // Payment Proof States
    const [tid, setTid] = useState('');
    const [proofImage, setProofImage] = useState<File | null>(null);

    // Modal Steps: 'upload', 'payment', or 'pending'
    const [step, setStep] = useState<'upload' | 'payment' | 'pending'>('upload');

    // Sync status with Backend data
    useEffect(() => {
        if (isOpen) {
            if (userStatus?.isPaid) {
                setStep('upload');
            } else if (userStatus?.paymentStatus === 'Pending') {
                setStep('pending');
            } else if (userStatus?.paymentStatus === 'None' || userStatus?.paymentStatus === 'Rejected') {
                // Agar user ne abhi tak upload hi nahi kiya, toh pehle upload step
                setStep('upload');
            }
        }
    }, [userStatus, isOpen]);

    if (!isOpen) return null;

    // --- STEP 1: DOCUMENT UPLOAD ---
    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return toast.error("Please select a document");

        setLoading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', title);
        formData.append('institute', institute);

        try {
            await api.post('/student/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.success("Document uploaded! Now complete your payment.");
            refreshData();
            setStep('payment'); // Upload ke baad seedha payment par le jao
        } catch (err: any) {
            toast.error(err.response?.data?.msg || "Upload failed.");
        } finally {
            setLoading(false);
        }
    };

    // --- STEP 2: PAYMENT PROOF SUBMIT ---
    const handlePaymentProof = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!proofImage || !tid) return toast.error("Please provide TID and Screenshot");

        setPaymentLoading(true);
        const formData = new FormData();
        formData.append('file', proofImage);
        formData.append('transactionId', tid);

        try {
            await api.post('/student/submit-payment', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.success("Payment submitted for verification!");
            refreshData();
            setStep('pending'); // Payment ke baad pending screen
        } catch (err: any) {
            toast.error(err.response?.data?.msg || "Payment submission failed.");
        } finally {
            setPaymentLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-md p-4">
            <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 border border-slate-100">

                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div>
                        <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                            {step === 'upload' ? 'Upload Credentials' : step === 'payment' ? 'Fee Verification' : 'Status: In Review'}
                        </h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Step {step === 'upload' ? '01' : step === 'payment' ? '02' : '03'} of 03</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                        <X size={20} className="text-slate-500" />
                    </button>
                </div>

                {/* STEP 1: UPLOAD FORM */}
                {step === 'upload' && (
                    <form onSubmit={handleUpload} className="p-8 space-y-5">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-500 uppercase ml-1 tracking-wider">Document Title</label>
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
                            {loading ? <Loader2 className="animate-spin" /> : <>Upload & Continue <ArrowRight size={18} /></>}
                        </button>
                    </form>
                )}

                {/* STEP 2: PAYMENT FORM */}
                {step === 'payment' && (
                    <form onSubmit={handlePaymentProof} className="p-8 space-y-6">
                        <div className="bg-indigo-600 p-6 rounded-[2rem] text-white shadow-xl relative overflow-hidden">
                            <div className="relative z-10">
                                <p className="text-[10px] font-black opacity-70 uppercase tracking-[0.2em]">JazzCash Transfer</p>
                                <h4 className="text-2xl font-black mt-1">0300-1234567</h4>
                                <p className="text-sm font-medium opacity-90 mt-1">Maaz Hashmi</p>
                            </div>
                            <CreditCard className="absolute -right-4 -bottom-4 text-white opacity-10" size={120} />
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-500 uppercase ml-1 tracking-wider">Transaction ID</label>
                                <input
                                    type="text"
                                    placeholder="Enter 11-digit TID"
                                    className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl outline-none focus:border-indigo-500 transition-all font-mono font-bold"
                                    required
                                    value={tid}
                                    onChange={(e) => setTid(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-500 uppercase ml-1 tracking-wider">Payment Screenshot</label>
                                <div className={`relative border-2 border-dashed rounded-[2rem] p-6 transition-all flex flex-col items-center justify-center gap-2 ${proofImage ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200 bg-slate-50 hover:border-indigo-400'}`}>
                                    <input
                                        type="file"
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        accept="image/*"
                                        onChange={(e) => setProofImage(e.target.files?.[0] || null)}
                                    />
                                    <ImageIcon size={24} className={proofImage ? 'text-indigo-600' : 'text-slate-300'} />
                                    <p className="text-xs font-bold text-slate-500 truncate max-w-[200px]">
                                        {proofImage ? proofImage.name : "Upload Receipt Screenshot"}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={paymentLoading}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-5 rounded-[1.5rem] shadow-xl shadow-indigo-100 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                        >
                            {paymentLoading ? <Loader2 className="animate-spin" /> : "Confirm Payment Proof"}
                        </button>
                    </form>
                )}

                {/* STEP 3: PENDING VIEW */}
                {step === 'pending' && (
                    <div className="p-12 text-center space-y-6">
                        <div className="w-24 h-24 bg-amber-50 rounded-full flex items-center justify-center mx-auto shadow-inner">
                            <Clock size={45} className="text-amber-500 animate-pulse" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-2xl font-black text-slate-900">Verifying Payment...</h2>
                            <p className="text-slate-500 font-medium text-sm leading-relaxed">
                                We've received your TID: <span className="font-bold text-slate-900">{tid || "XXXX"}</span>.
                                Our team is checking the records. Usually, this takes 1-2 hours.
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-full bg-slate-100 text-slate-600 font-bold py-4 rounded-2xl hover:bg-slate-200 transition-all active:scale-95"
                        >
                            Got it, I'll wait!
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}