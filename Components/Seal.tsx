// Engraved-style seal used as the brand mark and as a quiet watermark.
export default function Seal({ size = 40, color = 'currentColor', className = '' }: { size?: number; color?: string; className?: string }) {
    const ticks = Array.from({ length: 36 }, (_, i) => i * 10);
    return (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className={className} aria-hidden="true">
            <circle cx="50" cy="50" r="47" stroke={color} strokeWidth="1.5" />
            <circle cx="50" cy="50" r="40" stroke={color} strokeWidth="0.75" />
            {ticks.map((deg) => (
                <line
                    key={deg}
                    x1="50" y1="5" x2="50" y2={deg % 30 === 0 ? 12 : 9}
                    stroke={color} strokeWidth="1"
                    transform={`rotate(${deg} 50 50)`}
                />
            ))}
            <path d="M33 51.5l11 11 23-25" stroke={color} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}
