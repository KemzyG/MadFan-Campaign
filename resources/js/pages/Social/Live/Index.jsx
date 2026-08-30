import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import SocialShell from '../../../Layouts/SocialShell';
import KickoffRing from '../../Stage/KickoffRing';
import LiveCreateSheet from './LiveCreateSheet';

function LiveCard({ stage }) {
    return (
        <Link href={`/social/live/${stage.id}`} className="kf-live-card">
            <div className="kf-live-card__thumb">
                <span className="kf-live-card__thumb-icon" aria-hidden>
                    {stage.host?.avatar_emoji || '🎥'}
                </span>
                <span className="kf-live-badge kf-live-card__badge">
                    <span className="kf-live-badge__dot" aria-hidden />
                    Live
                </span>
                <span className="kf-live-card__viewers">{stage.viewer_count} watching</span>
            </div>
            <div className="kf-live-card__meta">
                <span className="kf-live-card__title">{stage.title}</span>
                <span className="kf-live-card__host">
                    <span className="kf-live-card__host-dot" aria-hidden />
                    {stage.host?.name}
                </span>
            </div>
        </Link>
    );
}

export default function Index({ stages, stage_types: stageTypes, max_title_length: maxTitleLength, max_description_length: maxDescriptionLength }) {
    const [createOpen, setCreateOpen] = useState(false);

    return (
        <SocialShell title="Live">
            <Head title="Live · Mad Fan" />

            <div className="kf-live-index">
                <div className="kf-live-index__head">
                    <div>
                        <h1 className="kf-live-index__title">Live Now</h1>
                        <p className="kf-live-index__sub">
                            {stages.length > 0
                                ? `${stages.length} live right now`
                                : 'Nobody is live right now — be the first.'}
                        </p>
                    </div>
                    <button
                        type="button"
                        className="kf-form__btn kf-form__btn--primary"
                        onClick={() => setCreateOpen(true)}
                    >
                        Go Live
                    </button>
                </div>

                {stages.length > 0 ? (
                    <div className="kf-live-index__grid">
                        {stages.map((stage) => (
                            <LiveCard key={stage.id} stage={stage} />
                        ))}
                    </div>
                ) : (
                    <div className="kf-connection-screen kf-connection-screen--inline">
                        <div className="kf-connection-screen__ring" aria-hidden>
                            <KickoffRing state="idle" size={64} />
                        </div>
                        <h2 className="kf-connection-screen__title">Nobody is live right now</h2>
                        <p className="kf-connection-screen__body">Start your own stream and be the first.</p>
                        <div className="kf-connection-screen__actions">
                            <button
                                type="button"
                                className="kf-form__btn kf-form__btn--primary"
                                onClick={() => setCreateOpen(true)}
                            >
                                Go Live
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <LiveCreateSheet
                open={createOpen}
                onClose={() => setCreateOpen(false)}
                stageTypes={stageTypes}
                maxTitleLength={maxTitleLength}
                maxDescriptionLength={maxDescriptionLength}
            />
        </SocialShell>
    );
}
