import { isMe, partitionParticipants } from './helpers';
import SpeakerTile from './SpeakerTile';
import { useStageSession } from './StageSessionContext';

/**
 * Responsive grid of on-stage speakers, with an empty state before anyone takes
 * the mic. Active-speaker rings come from the session's `activeSpeakers` set.
 */
export default function SpeakerDeck({ onSelectSpeaker }) {
    const { room, activeSpeakers, peerStates } = useStageSession();

    const participants = room?.participants || [];
    const me = room?.me;
    const { speakers } = partitionParticipants(participants);
    const canManage = me?.role === 'host';
    const max = room?.stage?.max_speakers;

    return (
        <section className="mf-stage-deck" aria-label="On stage">
            <header className="mf-stage-deck__head">
                <p className="mf-stage-deck__label mf-text-caption">On stage</p>
                <span className="mf-stage-deck__count mf-mono">
                    {speakers.length}
                    {max != null ? `/${max}` : ''}
                </span>
            </header>

            {speakers.length === 0 ? (
                <div className="mf-stage-deck__empty">
                    <span className="mf-stage-deck__empty-mark" aria-hidden />
                    <p className="mf-stage-deck__empty-title">No one on the mic yet</p>
                    <p className="mf-text-meta text-[var(--mf-muted)]">
                        When a speaker joins, they’ll show up here.
                    </p>
                </div>
            ) : (
                <div
                    className="mf-stage-deck__grid"
                    style={{ '--mf-stage-speaker-count': speakers.length }}
                >
                    {speakers.map((participant) => {
                        const mine = isMe(participant, me);

                        return (
                            <SpeakerTile
                                key={participant.id}
                                participant={participant}
                                speaking={activeSpeakers.has(Number(participant.user_id))}
                                me={mine}
                                peerState={mine ? null : peerStates.get(Number(participant.user_id)) || null}
                                onSelect={canManage && !mine ? onSelectSpeaker : undefined}
                            />
                        );
                    })}
                </div>
            )}
        </section>
    );
}
