import React, { useState } from 'react';
import { useDarkMode } from '../../contexts';

interface NdIconProps {
    className?: string;
}

export function NdIcon({ className }: NdIconProps) {
    const { isDarkMode } = useDarkMode();
    const [hovered, setHovered] = useState(false);

    const primary = isDarkMode ? 'white' : '#58b9f7';
    const contrast = isDarkMode ? '#0d1117' : 'white';

    // On hover, the boxes swap: filled becomes outlined and vice versa
    const nFill   = hovered ? 'none'    : primary;
    const nText   = hovered ? primary   : contrast;
    const dFill   = hovered ? primary   : 'none';
    const dText   = hovered ? contrast  : primary;

    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 100 100"
            className={className}
            style={{ cursor: 'pointer', transition: 'transform 0.25s ease', transform: hovered ? 'scale(1.08)' : 'scale(1)' }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            aria-label="Neil Dahlke"
        >
            <style>{`
                .nd-box { transition: fill 0.25s ease; }
                .nd-letter { transition: fill 0.25s ease; }
            `}</style>

            {/* N — filled box by default */}
            <rect className="nd-box" x="6" y="18" width="40" height="64" rx="5"
                fill={nFill} stroke={primary} strokeWidth="3" />
            <text className="nd-letter" x="26" y="64"
                fontFamily="Georgia, 'Times New Roman', serif"
                fontSize="40" fontWeight="bold"
                fill={nText} textAnchor="middle">N</text>

            {/* D — outlined box by default */}
            <rect className="nd-box" x="54" y="18" width="40" height="64" rx="5"
                fill={dFill} stroke={primary} strokeWidth="3" />
            <text className="nd-letter" x="74" y="64"
                fontFamily="Georgia, 'Times New Roman', serif"
                fontSize="40" fontWeight="bold"
                fill={dText} textAnchor="middle">D</text>
        </svg>
    );
}
