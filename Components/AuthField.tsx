"use client";
import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface Props {
    label: string;
    icon: React.ReactNode;
    type?: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    autoComplete?: string;
    uppercase?: boolean;
}

export default function AuthField({ label, icon, type = 'text', value, onChange, placeholder, autoComplete, uppercase }: Props) {
    const [show, setShow] = useState(false);
    const isPassword = type === 'password';

    return (
        <label className="block">
            <span className="block text-sm font-semibold text-ink mb-1.5">{label}</span>
            <span className="relative block">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-soft/60 pointer-events-none">{icon}</span>
                <input
                    type={isPassword && show ? 'text' : type}
                    required
                    value={value}
                    autoComplete={autoComplete}
                    placeholder={placeholder}
                    onChange={(e) => onChange(e.target.value)}
                    className={`w-full h-12 bg-white border border-line rounded-xl pl-12 ${isPassword ? 'pr-12' : 'pr-4'} text-[15px] text-ink placeholder:text-ink-soft/40 outline-none transition focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent-soft)] ${uppercase ? 'uppercase placeholder:normal-case' : ''}`}
                />
                {isPassword && (
                    <button
                        type="button"
                        onClick={() => setShow(!show)}
                        aria-label={show ? 'Hide password' : 'Show password'}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-ink-soft/60 hover:text-ink rounded-lg"
                    >
                        {show ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                )}
            </span>
        </label>
    );
}
