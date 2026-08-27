/** The pulsing LIVE capsule — see .kf-live-badge in stage-kickoff.css. */
export default function LiveBadge() {
    return (
        <span className="kf-live-badge">
            <span className="kf-live-badge__dot" aria-hidden />
            Live
        </span>
    );
}
