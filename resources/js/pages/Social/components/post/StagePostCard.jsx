import { Link } from '@inertiajs/react';
import { IconLive, IconUsers } from './icons';
import AvatarStack from './AvatarStack';

/**
 * Rich feed template for a shared Stage. Live stages get a vivid gradient
 * banner, a LIVE pill, the speaker carousel, and a Join button; ended stages
 * render muted with no Join.
 *
 * @param {{ stage: {
 *   id:number, title:string, status:string, is_live:boolean,
 *   host:{id:number,name:string,avatar_url?:string}|null,
 *   participant_count:number, speaker_count:number, overflow_count:number,
 *   avatars:Array<object>, join_url:string,
 * } }} props
 */
export default function StagePostCard({ stage }) {
    if (!stage) {
        return null;
    }

    const live = Boolean(stage.is_live);
    const listeners = Math.max(0, (stage.participant_count || 0) - (stage.speaker_count || 0));

    return (
        <div className={`mf-stagecard${live ? '' : ' is-ended'}`}>
            <div className="mf-stagecard__glow" aria-hidden />

            <div className="mf-stagecard__body">
                <div className="mf-stagecard__top">
                    <span className={`mf-stagecard__pill${live ? ' is-live' : ''}`}>
                        {live ? (
                            <>
                                <IconLive />
                                LIVE
                            </>
                        ) : (
                            'ENDED'
                        )}
                    </span>
                    <span className="mf-stagecard__count">
                        <IconUsers />
                        {stage.participant_count || 0}
                    </span>
                </div>

                <p className="mf-stagecard__title">{stage.title}</p>

                {stage.host ? (
                    <p className="mf-stagecard__host">
                        Hosted by <span>{stage.host.name}</span>
                        {stage.speaker_count > 0 ? ` · ${stage.speaker_count} on stage` : ''}
                        {listeners > 0 ? ` · ${listeners} listening` : ''}
                    </p>
                ) : null}

                <div className="mf-stagecard__foot">
                    <AvatarStack people={stage.avatars} overflow={stage.overflow_count} />
                    {live ? (
                        <Link href={stage.join_url} className="mf-btn mf-stagecard__join">
                            Join
                        </Link>
                    ) : (
                        <span className="mf-stagecard__ended">Stage ended</span>
                    )}
                </div>
            </div>
        </div>
    );
}
