"use client";
import React, { useState } from 'react';
import { X, Upload, FileText, CheckCircle2 } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

export default function UploadModal({ isOpen, onClose }: Props) {
    const [loading, setLoading] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [title, setTitle] = useState('');
    const [institute, setInstitute] = useState('');

    if (!isOpen) return null;

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return toast.error("Please select a file");

        setLoading(true);
        const formData = new FormData();
        formData.append('document', file);
        formData.append('title', title);
        formData.append('institute', institute);

        try {
            // Backend endpoint jo humne banaya tha
            await api.post('/student/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.success("Document uploaded successfully!");
            onClose();
        } catch (err: any) {
            toast.error(err.response?.data?.msg || "Upload failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h3 className="text-xl font-bold text-slate-900">Upload New Document</h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                        <X size={20} className="text-slate-500" />
                    </button>
                </div>

                <form onSubmit={handleUpload} className="p-8 space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 ml-1">Document Title</label>
                        <input
                            type="text"
                            placeholder="e.g. Matric Certificate"
                            className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all"
                            required
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>

                    {/* Institute Name */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 ml-1">Institute / Board</label>
                        <input
                            type="text"
                            placeholder="e.g. FBISE Islamabad"
                            className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all"
                            required
                            onChange={(e) => setInstitute(e.target.value)}
                        />
                    </div>

                    {/* File Dropzone */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 ml-1">Select File (PDF or Image)</label>
                        <div className={`relative border-2 border-dashed rounded-2xl p-8 transition-all flex flex-col items-center justify-center gap-3 ${file ? 'border-green-400 bg-green-50' : 'border-slate-200 bg-slate-50 hover:border-blue-400'}`}>
                            <input
                                type="file"
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                onChange={(e) => setFile(e.target.files?.[0] || null)}
                                accept=".pdf,.jpg,.jpeg,.png"
                            />
                            {file ? (
                                <>
                                    <CheckCircle2 size={40} className="text-green-500" />
                                    <p className="text-sm font-bold text-green-700">{file.name}</p>
                                    <p className="text-xs text-green-600">Click to change file</p>
                                </>
                            ) : (
                                <>
                                    <Upload size={40} className="text-slate-300" />
                                    <p className="text-sm font-medium text-slate-500">Drag & drop or <span className="text-blue-600 font-bold">browse</span></p>
                                    <p className="text-xs text-slate-400">Supported: JPG, PNG, PDF (Max 5MB)</p>
                                </>
                            )}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-slate-900 hover:bg-black text-white font-bold py-4 rounded-2xl shadow-lg shadow-slate-200 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                    >
                        {loading ? "Uploading..." : "Save Document"}
                    </button>
                </form>
            </div>
        </div>
    );
}