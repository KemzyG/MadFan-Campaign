/**
 * The Kickoff Ring — the "Kickoff" redesign's signature motif, shared by the
 * Reels viewer screen and the Studio host screen (there, squared into
 * viewfinder corner brackets — see .kf-viewfinder in stage-kickoff.css — but
 * this component itself covers every avatar-scale use, a 20px chat thumbnail
 * up to a 160px hero avatar).
 *
 * A circular stroke split into two unequal arcs, echoing a pitch's center
 * circle bisected by the halfway line.
 *
 *  - `state="idle"`   — thin dim ring, nothing moving (default — no one's
 *                       speaking, no hand raised).
 *  - `state="live"`   — the brighter arc rotates like a comet. We don't have
 *                       true per-remote amplitude data (LiveKit's
 *                       ActiveSpeakersChanged is binary), so this is driven
 *                       by plain presence in the session's `activeSpeakers`
 *                       set — a steady comet, not an amplitude wobble.
 *  - `state="raised"` — held pulse, no rotation. "Wants to speak" must never
 *                       look like "is speaking".
 *
 * `register="conversation"` swaps the live color from amber (broadcast —
 * Voice/Streaming) to green (conversation — Video) — pass this for Video-type
 * stages. Leave unset (the default) for Voice/Streaming.
 *
 * `reduced` forces the static, non-animated rendering for
 * prefers-reduced-motion — pass `useReducedMotion()`'s result through rather
 * than re-deriving it in every caller.
 */
export default function KickoffRing({
    state = 'idle',
    register,
    size = 40,
    strokeWidth,
    reduced = false,
    className = '',
}) {
    const sw = strokeWidth ?? Math.max(1.5, size * 0.045);
    const r = size / 2 - sw;
    const c = size / 2;
    const circumference = 2 * Math.PI * r;
    // Halfway-line split: a long arc and a short arc, each separated by a
    // gap — a center circle cut by a line, not a plain uninterrupted ring.
    const longArc = circumference * 0.58;
    const gap = circumference * 0.06;
    const shortArc = circumference * 0.24;
    const dasharray = `${longArc} ${gap} ${shortArc} ${gap}`;

    const classes = [
        'kf-ring',
        `kf-ring--${state}`,
        register === 'conversation' ? 'kf-ring--conversation' : '',
        reduced ? 'kf-ring--reduced' : '',
        className,
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <svg className={classes} width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
            <circle className="kf-ring__base" cx={c} cy={c} r={r} strokeWidth={sw} fill="none" />
            <circle
                className="kf-ring__arc"
                cx={c}
                cy={c}
                r={r}
                strokeWidth={sw}
                fill="none"
                strokeDasharray={dasharray}
            />
        </svg>
    );
}
