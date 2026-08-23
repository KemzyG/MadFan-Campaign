import { partitionParticipants, StageAvatar } from './helpers';
import { useStageSession } from './StageSessionContext';

const MAX_SHOWN = 14;

/**
 * Compact listener row under the deck: overflow-aware avatar chips plus a
 * "+N" affordance and a raised-hands shortcut, both jumping to the People pane.
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
                <div className="mf-stage-listeners__row">
                    {shown.map((participant) => (
                        <span
                            key={participant.id}
                            className={`mf-stage-listeners__chip ${participant.speak_requested_at ? 'has-hand' : ''}`.trim()}
                            title={participant.user?.name || 'Fan'}
                        >
                            <StageAvatar user={participant.user} size="sm" />
                        </span>
                    ))}
                    {overflow > 0 ? (
                        <button
                            type="button"
                            className="mf-stage-listeners__more"
                            onClick={onSeeAll}
                        >
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
