import { isMe, partitionParticipants, StageAvatar } from './helpers';
import SpeakerTile from './SpeakerTile';
import { IconMicOff } from './StageIcons';
import { useStageSession } from './StageSessionContext';

/**
 * Streaming-type room layout: the host is the only broadcaster (single-camera/
 * screen-share, like a Twitch/YouTube stream), so their tile fills a large hero
 * area instead of sharing the deck grid with everyone else. Any other on-stage
 * speaker (promoted for voice/chat only in this stage type — see
 * StageVoice::publishSourcesFor) collapses into a small named row beneath the
 * hero rather than a full video tile, since they never carry a video track here.
 */
export default function StageStreamingHero({ onSelectSpeaker }) {
    const { room, activeSpeakers, peerStates, videoTracks } = useStageSession();

    const stage = room?.stage;
    const participants = room?.participants || [];
    const me = room?.me;
    const { speakers } = partitionParticipants(participants);
    const host = speakers.find((p) => p.role === 'host') || null;
    const coSpeakers = speakers.filter((p) => p.role !== 'host');
    const canManage = me?.role === 'host';
    const hostUserId = host ? Number(host.user_id) : null;
    const hostVideo = hostUserId != null
        ? videoTracks.get(`${hostUserId}:screen_share`) || videoTracks.get(`${hostUserId}:camera`) || null
        : null;
    const listenerCount = stage?.listener_count ?? Math.max(0, participants.length - speakers.length);

    return (
        <section className="mf-stage-hero-deck" aria-label="Live stream">
            {host ? (
                <div className="mf-stage-hero-deck__stage">
                    <span className="mf-stage-hero-deck__overlay mf-stage-hero-deck__overlay--top" aria-hidden>
                        <span className="mf-stage-live-chip mf-stage-live-chip--pulse mf-mono">
                            <span className="mf-stage-live-dot" />
                            Live
                        </span>
                        <span className="mf-stage-hero-deck__watching mf-mono">
                            {listenerCount} watching
                        </span>
                    </span>
                    <SpeakerTile
                        participant={host}
                        speaking={activeSpeakers.has(hostUserId)}
                        me={isMe(host, me)}
                        peerState={isMe(host, me) ? null : peerStates.get(hostUserId) || null}
                        videoElement={hostVideo}
                    />
                </div>
            ) : (
                <div className="mf-stage-hero-deck__empty">
                    <p className="mf-stage-deck__empty-title">Stream hasn’t started</p>
                    <p className="mf-text-meta text-[var(--mf-muted)]">
                        Waiting for the host to go live.
                    </p>
                </div>
            )}

            {coSpeakers.length > 0 ? (
                <div className="mf-stage-hero-deck__cospeakers" aria-label="Also on mic">
                    <span className="mf-stage-hero-deck__cospeakers-label mf-text-micro">Also on mic</span>
                    <div className="mf-stage-hero-deck__cospeakers-row">
                        {coSpeakers.map((participant) => {
                            const mine = isMe(participant, me);
                            const clickable = canManage && !mine;
                            const pill = (
                                <>
                                    <StageAvatar user={participant.user} size="sm" />
                                    <span className="mf-stage-hero-deck__coname truncate">
                                        {participant.user?.name || 'Fan'}
                                        {mine ? ' (you)' : ''}
                                    </span>
                                    {participant.is_muted ? (
                                        <IconMicOff className="mf-stage-hero-deck__comic" />
                                    ) : (
                                        <span className="mf-stage-hero-deck__live-dot" aria-hidden />
                                    )}
                                </>
                            );

                            return clickable ? (
                                <button
                                    type="button"
                                    key={participant.id}
                                    className="mf-stage-hero-deck__cochip is-clickable"
                                    onClick={() => onSelectSpeaker?.(participant)}
                                >
                                    {pill}
                                </button>
                            ) : (
                                <span key={participant.id} className="mf-stage-hero-deck__cochip">
                                    {pill}
                                </span>
                            );
                        })}
                    </div>
                </div>
            ) : null}
        </section>
    );
}
