import { Head, Link, useForm } from '@inertiajs/react';
import { useId } from 'react';
import SocialShell from '../../../Layouts/SocialShell';
import { IconBack, IconBroadcast, IconCamera, IconScreenShare, IconUploadVideo } from '../Stage/StageIcons';

const TYPE_META = {
    creator: { icon: IconCamera, blurb: 'Camera, mic, and live chat' },
    gaming: { icon: IconScreenShare, blurb: 'Your screen, dominant, chat docked beside it' },
    movie: { icon: IconUploadVideo, blurb: 'A video fills the frame, chat tucks away' },
    presenter: { icon: IconScreenShare, blurb: 'Your slides lead, your camera rides along' },
};

/**
 * The "Go Live" form — its own page (not a modal), reached from both
 * /social/live and /social/stage's "Go Live" button. One implementation:
 * submitting here creates a LiveStage and redirects straight into
 * /social/live/{id}'s Creator Studio, same as it always has.
 */
export default function Create({ stage_types: stageTypes, max_title_length: maxTitleLength, max_description_length: maxDescriptionLength }) {
    const labelId = useId();
    const { data, setData, post, processing, errors } = useForm({
        title: '',
        type: stageTypes[0]?.value || 'creator',
        description: '',
        is_public: true,
        allow_comments: true,
        allow_reactions: true,
    });

    const submit = (event) => {
        event.preventDefault();
        post('/social/live');
    };

    return (
        <SocialShell title="Go Live" showTabs={false}>
            <Head title="Go Live · Mad Fan" />

            <div className="kf-live-create">
                <div className="kf-live-create__head">
                    <Link href="/social/live" className="kf-live-create__back" aria-label="Back to Live Now">
                        <IconBack />
                    </Link>
                    <div>
                        <h1 id={labelId} className="kf-live-create__title">
                            Go Live
                        </h1>
                        <p className="kf-live-create__sub">Name your stream and pick who can join in.</p>
                    </div>
                </div>

                <form className="kf-form kf-live-create__form" onSubmit={submit} aria-labelledby={labelId}>
                    <div className="kf-form__group">
                        <span className="kf-form__label">Format</span>
                        <div className="kf-form__radio-grid kf-form__radio-grid--types">
                            {stageTypes.map((type) => {
                                const meta = TYPE_META[type.value] || { icon: IconBroadcast, blurb: null };
                                const Icon = meta.icon;
                                return (
                                    <label key={type.value} className="kf-type-option">
                                        <input
                                            type="radio"
                                            name="type"
                                            value={type.value}
                                            checked={data.type === type.value}
                                            onChange={() => setData('type', type.value)}
                                        />
                                        <span className="kf-type-option__icon" aria-hidden>
                                            <Icon />
                                        </span>
                                        <span className="kf-type-option__label">{type.label}</span>
                                        {meta.blurb ? (
                                            <span className="kf-type-option__blurb">{meta.blurb}</span>
                                        ) : null}
                                    </label>
                                );
                            })}
                        </div>
                    </div>

                    <div className="kf-form__group">
                        <label className="kf-form__label" htmlFor="live-title">
                            Title
                        </label>
                        <input
                            id="live-title"
                            type="text"
                            className="kf-form__input"
                            value={data.title}
                            onChange={(e) => setData('title', e.target.value)}
                            maxLength={maxTitleLength}
                            placeholder="What's happening?"
                            required
                            autoFocus
                        />
                        {errors.title ? <span className="kf-form__hint">{errors.title}</span> : null}
                    </div>

                    <div className="kf-form__group">
                        <label className="kf-form__label" htmlFor="live-description">
                            Description
                        </label>
                        <textarea
                            id="live-description"
                            className="kf-form__textarea"
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                            maxLength={maxDescriptionLength}
                            placeholder="Tell viewers what to expect (optional)"
                        />
                    </div>

                    <div className="kf-form__group">
                        <div className="kf-form__checkbox-wrap">
                            <span className="kf-form__checkbox">
                                <input
                                    type="checkbox"
                                    checked={data.is_public}
                                    onChange={(e) => setData('is_public', e.target.checked)}
                                />
                                <span className="kf-form__checkbox-visual" />
                            </span>
                            <span className="kf-form__checkbox-label">Public — listed on Live Now</span>
                        </div>
                        <div className="kf-form__checkbox-wrap">
                            <span className="kf-form__checkbox">
                                <input
                                    type="checkbox"
                                    checked={data.allow_comments}
                                    onChange={(e) => setData('allow_comments', e.target.checked)}
                                />
                                <span className="kf-form__checkbox-visual" />
                            </span>
                            <span className="kf-form__checkbox-label">Allow comments</span>
                        </div>
                        <div className="kf-form__checkbox-wrap">
                            <span className="kf-form__checkbox">
                                <input
                                    type="checkbox"
                                    checked={data.allow_reactions}
                                    onChange={(e) => setData('allow_reactions', e.target.checked)}
                                />
                                <span className="kf-form__checkbox-visual" />
                            </span>
                            <span className="kf-form__checkbox-label">Allow reactions</span>
                        </div>
                    </div>

                    <div className="kf-form__buttons">
                        <Link href="/social/live" className="kf-form__btn">
                            Cancel
                        </Link>
                        <button type="submit" className="kf-form__btn kf-form__btn--primary" disabled={processing}>
                            {processing ? 'Going live…' : 'Go live'}
                        </button>
                    </div>
                </form>
            </div>
        </SocialShell>
    );
}
