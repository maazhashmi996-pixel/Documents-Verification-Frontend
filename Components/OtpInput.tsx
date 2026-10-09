"use client";
import React, { useEffect, useRef } from 'react';

// Six separate boxes that behave like one field: typing, backspace, arrows and pasting all work.
export default function OtpInput({ value, onChange, autoFocus = true }: { value: string; onChange: (v: string) => void; autoFocus?: boolean }) {
    const refs = useRef<(HTMLInputElement | null)[]>([]);
    const digits = Array.from({ length: 6 }, (_, i) => value[i] || '');

    useEffect(() => {
        if (autoFocus) refs.current[0]?.focus();
    }, [autoFocus]);

    const write = (index: number, chars: string) => {
        const next = [...digits];
        chars.split('').slice(0, 6 - index).forEach((ch, i) => { next[index + i] = ch; });
        onChange(next.join(''));
        refs.current[Math.min(index + chars.length, 5)]?.focus();
    };

    const onKey = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace') {
            e.preventDefault();
            const next = [...digits];
            if (next[index]) next[index] = '';
            else if (index > 0) { next[index - 1] = ''; refs.current[index - 1]?.focus(); }
            onChange(next.join(''));
        } else if (e.key === 'ArrowLeft' && index > 0) refs.current[index - 1]?.focus();
        else if (e.key === 'ArrowRight' && index < 5) refs.current[index + 1]?.focus();
    };

    return (
        <div className="flex justify-between gap-2" role="group" aria-label="Verification code">
            {digits.map((d, i) => (
                <input
                    key={i}
                    ref={(el) => { refs.current[i] = el; }}
                    value={d}
                    inputMode="numeric"
                    autoComplete={i === 0 ? 'one-time-code' : 'off'}
                    aria-label={`Digit ${i + 1}`}
                    onChange={(e) => { const c = e.target.value.replace(/\D/g, ''); if (c) write(i, c); }}
                    onKeyDown={(e) => onKey(i, e)}
                    onFocus={(e) => e.target.select()}
                    className="w-full min-w-0 h-14 text-center text-2xl font-semibold text-ink bg-white border border-line rounded-xl outline-none transition focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent-soft)]"
                />
            ))}
        </div>
    );
}
