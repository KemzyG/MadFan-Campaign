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

export function IconVoiceWave({ className }) {
    return (
        <svg {...IconProps({ className })}>
            <path d="M4 12v1.5" />
            <path d="M8 9v7.5" />
            <path d="M12 5.5v13" />
            <path d="M16 9v7.5" />
            <path d="M20 12v1.5" />
        </svg>
    );
}

export function IconBroadcast({ className }) {
    return (
        <svg {...IconProps({ className })}>
            <circle cx="12" cy="13" r="2.1" fill="currentColor" stroke="none" />
            <path d="M8.3 16.7a5.2 5.2 0 0 1 0-7.4" />
            <path d="M15.7 9.3a5.2 5.2 0 0 1 0 7.4" />
            <path d="M5.3 19.7a9.6 9.6 0 0 1 0-13.4" />
            <path d="M18.7 6.3a9.6 9.6 0 0 1 0 13.4" />
        </svg>
    );
}

export function IconCamera({ className }) {
    return (
        <svg {...IconProps({ className })}>
            <rect x="3" y="6.5" width="13" height="11" rx="2.2" />
            <path d="m16 10.2 4.2-2.6a.7.7 0 0 1 1.05.6v7.6a.7.7 0 0 1-1.05.6L16 13.8" />
        </svg>
    );
}

export function IconCameraOff({ className }) {
    return (
        <svg {...IconProps({ className })}>
            <path d="M10.5 6.5H14a2.2 2.2 0 0 1 2.2 2.2v.9" />
            <path d="M16 13.8v1.5A2.2 2.2 0 0 1 13.8 17.5H5.2A2.2 2.2 0 0 1 3 15.3v-6.6a2.2 2.2 0 0 1 1.9-2.18" />
            <path d="m16 10.2 4.2-2.6a.7.7 0 0 1 1.05.6v7.6a.7.7 0 0 1-1.05.6L16 13.8" />
            <path d="m2 2 20 20" />
        </svg>
    );
}

export function IconPlay({ className }) {
    return (
        <svg {...IconProps({ className })}>
            <path d="M7 5.3v13.4a1 1 0 0 0 1.53.85l10.6-6.7a1 1 0 0 0 0-1.7L8.53 4.45A1 1 0 0 0 7 5.3Z" fill="currentColor" stroke="none" />
        </svg>
    );
}

export function IconPause({ className }) {
    return (
        <svg {...IconProps({ className })}>
            <rect x="6.5" y="5" width="4" height="14" rx="1" fill="currentColor" stroke="none" />
            <rect x="13.5" y="5" width="4" height="14" rx="1" fill="currentColor" stroke="none" />
        </svg>
    );
}

export function IconUploadVideo({ className }) {
    return (
        <svg {...IconProps({ className })}>
            <rect x="2.5" y="5.5" width="13" height="13" rx="2.5" />
            <path d="m15.5 10.5 5-3v9l-5-3" />
            <path d="M9 8.5v5" />
            <path d="m6.7 10.8 2.3-2.3 2.3 2.3" />
        </svg>
    );
}

export function IconScreenShare({ className }) {
    return (
        <svg {...IconProps({ className })}>
            <rect x="2.5" y="4.5" width="19" height="13" rx="2" />
            <path d="M9 21h6" />
            <path d="M12 17v4" />
            <path d="M12 8v5.5" />
            <path d="m9.2 10.8 2.8-2.8 2.8 2.8" />
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

export function IconPin({ className, active = false }) {
    return (
        <svg {...IconProps({ className })}>
            <path
                d="M12 17v5"
            />
            <path
                d="M9 3h6l-1 6 3 3v1H7v-1l3-3-1-6Z"
                fill={active ? 'currentColor' : 'none'}
            />
        </svg>
    );
}

export function IconVolume({ className }) {
    return (
        <svg {...IconProps({ className })}>
            <path d="M11 5 6 9H2v6h4l5 4V5Z" />
            <path d="M15.5 8.5a5 5 0 0 1 0 7" />
            <path d="M18.5 6a9 9 0 0 1 0 12" />
        </svg>
    );
}

export function IconReaction({ className }) {
    return (
        <svg {...IconProps({ className })}>
            <circle cx="12" cy="12" r="9" />
            <path d="M8.5 14a4 4 0 0 0 7 0" />
            <path d="M9 9h.01" />
            <path d="M15 9h.01" />
        </svg>
    );
}

export function IconSettings({ className }) {
    return (
        <svg {...IconProps({ className })}>
            <path d="M4 6h10" />
            <path d="M18 6h2" />
            <circle cx="16" cy="6" r="2" />
            <path d="M4 12h2" />
            <path d="M10 12h10" />
            <circle cx="8" cy="12" r="2" />
            <path d="M4 18h10" />
            <path d="M18 18h2" />
            <circle cx="16" cy="18" r="2" />
        </svg>
    );
}

export function IconSort({ className }) {
    return (
        <svg {...IconProps({ className })}>
            <path d="M7 4v16" />
            <path d="m3 8 4-4 4 4" />
            <path d="M17 20V4" />
            <path d="m21 16-4 4-4-4" />
        </svg>
    );
}

export function IconSearch({ className }) {
    return (
        <svg {...IconProps({ className })}>
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
        </svg>
    );
}

export function IconFilter({ className }) {
    return (
        <svg {...IconProps({ className })}>
            <path d="M3 5h18l-7 8v6l-4 2v-8L3 5Z" />
        </svg>
    );
}

export function IconDismissHand({ className }) {
    return (
        <svg {...IconProps({ className })}>
            <path d="M18 11V6a2 2 0 1 0-4 0" />
            <path d="M14 10V5a2 2 0 1 0-4 0v6" />
            <path d="M10 10V6a2 2 0 1 0-4 0v8a6 6 0 0 0 6 6h2a4 4 0 0 0 4-4v-3a2 2 0 1 0-4 0" />
            <path d="m2 2 20 20" />
        </svg>
    );
}

export function IconLink({ className }) {
    return (
        <svg {...IconProps({ className })}>
            <path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1.5 1.5" />
            <path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1.5-1.5" />
        </svg>
    );
}

export function IconDemote({ className }) {
    return (
        <svg {...IconProps({ className })}>
            <path d="M12 5v14" />
            <path d="m19 12-7 7-7-7" />
        </svg>
    );
}

export function IconPromote({ className }) {
    return (
        <svg {...IconProps({ className })}>
            <path d="M12 19V5" />
            <path d="m5 12 7-7 7 7" />
        </svg>
    );
}

export function IconKeyboard({ className }) {
    return (
        <svg {...IconProps({ className })}>
            <rect x="2" y="6" width="20" height="12" rx="2" />
            <path d="M6 10h.01" />
            <path d="M10 10h.01" />
            <path d="M14 10h.01" />
            <path d="M18 10h.01" />
            <path d="M7 14h10" />
        </svg>
    );
}

export function IconInfo({ className }) {
    return (
        <svg {...IconProps({ className })}>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
        </svg>
    );
}

export function IconUsers({ className }) {
    return (
        <svg {...IconProps({ className })}>
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    );
}

export function IconSend({ className }) {
    return (
        <svg {...IconProps({ className })}>
            <path d="m22 2-7 20-4-9-9-4Z" />
            <path d="M22 2 11 13" />
        </svg>
    );
}

export function IconBack({ className }) {
    return (
        <svg {...IconProps({ className })}>
            <path d="M19 12H5" />
            <path d="m12 19-7-7 7-7" />
        </svg>
    );
}

export function IconEye({ className }) {
    return (
        <svg {...IconProps({ className })}>
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    );
}

export function IconHeart({ className }) {
    return (
        <svg {...IconProps({ className })}>
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z" />
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
