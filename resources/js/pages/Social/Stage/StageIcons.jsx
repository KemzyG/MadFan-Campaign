/** Shared inline SVG icons for Stage voice UI (stroke style matches social shell). */

function IconProps({ className = '', ...rest }) {
    return {
        className,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: '2',
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        'aria-hidden': true,
        ...rest,
    };
}

export function IconMic({ className }) {
    return (
        <svg {...IconProps({ className })}>
            <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3Z" />
            <path d="M19 11a7 7 0 0 1-14 0" />
            <path d="M12 18v3" />
        </svg>
    );
}

export function IconMicOff({ className }) {
    return (
        <svg {...IconProps({ className })}>
            <path d="M9 9v3a3 3 0 0 0 5.12 2.12" />
            <path d="M15 9.34V6a3 3 0 0 0-5.94-.6" />
            <path d="M19 11a7 7 0 0 1-7 7" />
            <path d="M12 18v3" />
            <path d="m2 2 20 20" />
        </svg>
    );
}

export function IconChat({ className }) {
    return (
        <svg {...IconProps({ className })}>
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z" />
        </svg>
    );
}

export function IconMinimize({ className }) {
    return (
        <svg {...IconProps({ className })}>
            <path d="M8 3v3a2 2 0 0 1-2 2H3" />
            <path d="M21 8h-3a2 2 0 0 1-2-2V3" />
            <path d="M3 16h3a2 2 0 0 1 2 2v3" />
            <path d="M16 21v-3a2 2 0 0 1 2-2h3" />
        </svg>
    );
}

export function IconLeave({ className }) {
    return (
        <svg {...IconProps({ className })}>
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <path d="m16 17 5-5-5-5" />
            <path d="M21 12H9" />
        </svg>
    );
}

export function IconEnd({ className }) {
    return (
        <svg {...IconProps({ className })}>
            <circle cx="12" cy="12" r="9" />
            <path d="m8 12 8 0" strokeWidth="2.5" />
        </svg>
    );
}

export function IconHand({ className }) {
    return (
        <svg {...IconProps({ className })}>
            <path d="M18 11V6a2 2 0 1 0-4 0" />
            <path d="M14 10V5a2 2 0 1 0-4 0v6" />
            <path d="M10 10V6a2 2 0 1 0-4 0v8a6 6 0 0 0 6 6h2a4 4 0 0 0 4-4v-3a2 2 0 1 0-4 0" />
        </svg>
    );
}

export function IconVoice({ className }) {
    return (
        <svg {...IconProps({ className })}>
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
            <path d="M19 10v1a7 7 0 0 1-14 0v-1" />
            <path d="M12 18v4" />
            <path d="M8 22h8" />
        </svg>
    );
}

export function IconShare({ className }) {
    return (
        <svg {...IconProps({ className })}>
            <path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7" />
            <path d="M16 6l-4-4-4 4" />
            <path d="M12 2v13" />
        </svg>
    );
}

export function IconHost({ className }) {
    return (
        <svg {...IconProps({ className })}>
            <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.604.852.997 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
        </svg>
    );
}

export function IconBan({ className }) {
    return (
        <svg {...IconProps({ className })}>
            <circle cx="12" cy="12" r="9" />
            <path d="m4.9 4.9 14.2 14.2" />
        </svg>
    );
}

export function IconCrown({ className }) {
    return (
        <svg {...IconProps({ className })}>
            <path d="m2 7 4 4 6-6 6 6 4-4v11H2V7Z" />
        </svg>
    );
}

export function IconInvite({ className }) {
    return (
        <svg {...IconProps({ className })}>
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M19 8v6" />
            <path d="M22 11h-6" />
        </svg>
    );
}

export function IconClose({ className }) {
    return (
        <svg {...IconProps({ className })}>
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
        </svg>
    );
}

export function IconLive({ className }) {
    return (
        <svg {...IconProps({ className })}>
            <circle cx="12" cy="12" r="4" fill="currentColor" stroke="none" />
            <path d="M12 2v2" />
            <path d="M12 20v2" />
            <path d="m4.93 4.93 1.41 1.41" />
            <path d="m17.66 17.66 1.41 1.41" />
            <path d="M2 12h2" />
            <path d="M20 12h2" />
            <path d="m6.34 17.66-1.41 1.41" />
            <path d="m19.07 4.93-1.41 1.41" />
        </svg>
    );
}

export function StageIconButton({ label, active = false, danger = false, pitch = false, badge, children, className = '', ...props }) {
    const classes = [
        'mf-stage-icon-btn',
        active ? 'is-active' : '',
        danger ? 'is-danger' : '',
        pitch ? 'is-pitch' : '',
        className,
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <button type="button" className={classes} aria-label={label} title={label} {...props}>
            {children}
            {badge ? (
                <span className="mf-stage-icon-btn__badge mf-mono" aria-hidden>
                    {badge}
                </span>
            ) : null}
        </button>
    );
}
