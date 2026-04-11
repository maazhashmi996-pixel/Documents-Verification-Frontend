"use client";
import React, { useState } from 'react';
import { CreditCard, CheckCircle, Send, Copy } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';

export default function PaymentStep({ onComplete }: { onComplete: () => void }) {
    const [tid, setTid] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !tid) return toast.error("TID and Screenshot are required!");

        setLoading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('transactionId', tid);

        try {
            await api.post('/student/submit-payment', formData);
            toast.success("Payment proof submitted successfully!");
            onComplete();
        } catch (err: any) {
            toast.error(err.response?.data?.msg || "Submission failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 space-y-6 animate-in slide-in-from-right duration-500">
            <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-6 rounded-[2rem] text-white shadow-xl relative overflow-hidden">
                <div className="relative z-10">
                    <p className="text-xs font-bold opacity-80 uppercase tracking-widest">JazzCash / Easypaisa</p>
                    <h4 className="text-2xl font-black mt-1">0300-1234567</h4>
                    <p className="text-sm opacity-90">Title: Maaz Hashmi</p>
                </div>
                <CreditCard className="absolute -right-4 -bottom-4 opacity-10" size={100} />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="text-sm font-bold text-slate-700 ml-1">Transaction ID (TID)</label>
                    <input
                        type="text"
                        className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl outline-none focus:border-indigo-500 font-mono"
                        placeholder="11 Digit ID"
                        value={tid}
                        onChange={(e) => setTid(e.target.value)}
                        required
                    />
                </div>

                <div>
                    <label className="text-sm font-bold text-slate-700 ml-1">Upload Screenshot</label>
                    <input
                        type="file"
                        accept="image/*"
                        className="w-full text-sm text-slate-500 file:mr-4 file:py-3 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                        required
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-slate-900 text-white font-bold py-5 rounded-2xl shadow-lg flex items-center justify-center gap-2 hover:bg-black transition-all"
                >
                    {loading ? "Verifying..." : <><Send size={18} /> Confirm Payment</>}
                </button>
            </form>
        </div>
    );
}