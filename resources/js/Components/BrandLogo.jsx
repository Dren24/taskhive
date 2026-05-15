import React from 'react';

export default function BrandLogo({
    className = '',
    subtitle = null,
    iconSize = 'w-12 h-12',
    labelSize = 'text-xl',
    labelClass = 'text-gray-900',
    subtitleClass = 'text-gray-500',
    compact = false,
}) {
    const iconMarginClass = compact ? '' : 'mb-3';

    return (
        <div className={`${compact ? 'flex items-center gap-2' : 'flex flex-col items-center'} ${className}`.trim()}>
            <div
                className={`${iconSize} rounded-2xl flex items-center justify-center ${iconMarginClass}`.trim()}
                style={{ background: 'linear-gradient(135deg,#7c3aed,#9333ea)' }}
            >
                <span className="text-white font-extrabold tracking-tight">TH</span>
            </div>
            {compact
                ? <span className={`${labelSize} font-bold ${labelClass} tracking-tight`.trim()}>TaskHive</span>
                : <h1 className={`${labelSize} font-bold ${labelClass}`.trim()}>TaskHive</h1>
            }
            {!compact && subtitle && <p className={`text-sm ${subtitleClass} mt-1`}>{subtitle}</p>}
        </div>
    );
}
