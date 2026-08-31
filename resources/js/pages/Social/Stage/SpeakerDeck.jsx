import { isMe, partitionParticipants } from './helpers';
import SeatTile from './SeatTile';
import { useStageSession } from './StageSessionContext';

/**
 * The voice room's on-stage grid: a fixed number of glass seats (the host's
 * chosen `max_speakers`, set when going live), filled by speakers in order.
 * Any seat left empty — nobody took it yet, the host removed someone, a
 * speaker left — shows a "+" a listener can tap to claim it directly, or the
 * host taps to invite a specific listener into it.
 */
export default function SpeakerDeck({ onSelectSpeaker, onClaimSeat, onOpenSeatPicker }) {
    const { room, activeSpeakers } = useStageSession();

    const participants = room?.participants || [];
    const me = room?.me;
    const { speakers } = partitionParticipants(participants);
    const isHost = me?.role === 'host';
    const isListener = me?.role === 'listener';
    const canManage = isHost && room?.stage?.status === 'live';
    const isLive = room?.stage?.status === 'live';
    const seatCount = room?.stage?.max_speakers ?? 8;
    const seats = Array.from({ length: Math.max(seatCount, speakers.length) }, (_, i) => speakers[i] || null);

    return (
        <section className="mf-stage-deck" aria-label="On stage">
            <header className="mf-stage-deck__head">
                <p className="mf-stage-deck__label mf-text-caption">On stage</p>
                <span className="mf-stage-deck__count mf-mono">
                    {speakers.length}/{seatCount}
                </span>
            </header>

            <div className="mf-seat-grid mf-seat-grid--seats">
                {seats.map((participant, index) => {
                    if (!participant) {
                        const claimable = isLive && (isListener || isHost);
                        return (
                            <SeatTile
                                key={`empty-${index}`}
                                onClaim={
                                    claimable
                                        ? () => (isHost ? onOpenSeatPicker?.() : onClaimSeat?.())
                                        : undefined
                                }
                                label={isHost ? 'Invite a fan to this seat' : 'Take this seat'}
                            />
                        );
                    }

                    const mine = isMe(participant, me);
                    const userId = Number(participant.user_id);

                    return (
                        <SeatTile
                            key={participant.id}
                            participant={participant}
                            speaking={activeSpeakers.has(userId)}
                            me={mine}
                            onSelect={canManage && !mine ? onSelectSpeaker : undefined}
                        />
                    );
                })}
            </div>
        </section>
    );
}
