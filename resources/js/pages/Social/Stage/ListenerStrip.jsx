import { partitionParticipants, StageAvatar } from './helpers';
import { useStageSession } from './StageSessionContext';

const MAX_SHOWN = 24;

/**
 * Listeners as the same glass seat-grid language as the on-stage deck (just
 * without the empty/claimable state — listener capacity isn't bounded) plus a
 * "+N" overflow tile and a raised-hands shortcut, both jumping to the People
 * pane.
 */
export default function ListenerStrip({ onSeeAll }) {
    const { room } = useStageSession();
    const { listeners, handRaised } = partitionParticipants(room?.participants || []);

    const count = listeners.length;
    const shown = listeners.slice(0, MAX_SHOWN);
    const overflow = count - shown.length;
    const handCount = handRaised.length;

    return (
        <section className="mf-stage-listeners" aria-label="Listening">
            <header className="mf-stage-listeners__head">
                <p className="mf-text-caption text-[var(--mf-muted)]">Listening</p>
                <span className="mf-mono mf-text-micro text-[var(--mf-muted)]">{count}</span>
            </header>

            {count === 0 ? (
                <p className="mf-text-meta text-[var(--mf-muted)]">No listeners yet.</p>
            ) : (
                <div className="mf-seat-grid mf-seat-grid--listeners">
                    {shown.map((participant) => (
                        <button
                            key={participant.id}
                            type="button"
                            className={`mf-seat mf-seat--listener ${participant.speak_requested_at ? 'has-hand' : ''}`.trim()}
                            title={participant.user?.name || 'Fan'}
                            onClick={onSeeAll}
                        >
                            <span className="mf-seat__avatar-wrap">
                                <StageAvatar user={participant.user} size="sm" className="mf-seat__avatar" />
                            </span>
                            <span className="mf-seat__name truncate">{participant.user?.name || 'Fan'}</span>
                        </button>
                    ))}
                    {overflow > 0 ? (
                        <button type="button" className="mf-seat mf-seat--more" onClick={onSeeAll}>
                            +{overflow}
                        </button>
                    ) : null}
                </div>
            )}

            {handCount > 0 ? (
                <button type="button" className="mf-stage-listeners__hands" onClick={onSeeAll}>
                    {handCount} raised {handCount === 1 ? 'hand' : 'hands'} — review
                </button>
            ) : null}
        </section>
    );
}
