import { Head, Link, useForm } from '@inertiajs/react';
import { useId } from 'react';
import SocialShell from '../../../Layouts/SocialShell';
import { IconBack, IconBroadcast, IconCamera, IconMic, IconScreenShare, IconUploadVideo } from '../Stage/StageIcons';

const TYPE_META = {
    creator: { icon: IconCamera, blurb: 'Camera, mic, and live chat' },
    gaming: { icon: IconScreenShare, blurb: 'Your screen, dominant, chat docked beside it' },
    movie: { icon: IconUploadVideo, blurb: 'A video fills the frame, chat tucks away' },
    presenter: { icon: IconScreenShare, blurb: 'Your slides lead, your camera rides along' },
};

/**
 * One "Go Live" page for both broadcast formats — Camera Live (creates a
 * LiveStage, submits to LiveStageController::store) and Voice Room (creates
 * a Stage, submits to SocialStageController::store). Reached from both
 * /social/live and /social/stage's "Go Live" button; there is no separate
 * voice-room sheet anymore (see the deleted CreateStageSheet.jsx) — picking
 * a format here is what used to be two different entry points.
 */
export default function Create({
    stage_types: stageTypes,
    max_title_length: maxTitleLength,
    max_description_length: maxDescriptionLength,
    stage_max_title_length: stageMaxTitleLength,
    stage_max_description_length: stageMaxDescriptionLength,
    stage_backgrounds: stageBackgrounds = [],
}) {
    const labelId = useId();
    const defaultCreatorType = stageTypes[0]?.value || 'creator';
    const defaultBackground = stageBackgrounds[0]?.key ?? 1;

    const { data, setData, post, processing, errors } = useForm({
        format: 'creator',
        title: '',
        type: defaultCreatorType,
        description: '',
        is_public: true,
        allow_comments: true,
        allow_reactions: true,
        allow_invite: true,
        allow_chat: true,
        allow_speak_requests: true,
        background_key: defaultBackground,
    });

    const isVoice = data.format === 'voice';
    const titleLimit = isVoice ? stageMaxTitleLength : maxTitleLength;
    const descriptionLimit = isVoice ? stageMaxDescriptionLength : maxDescriptionLength;

    const selectFormat = (format) => {
        setData((prev) => ({
            ...prev,
            format,
            type: format === 'voice' ? 'voice' : defaultCreatorType,
        }));
    };

    const submit = (event) => {
        event.preventDefault();
        post(isVoice ? '/social/stage' : '/social/live');
    };

    return (
        <SocialShell title="Go Live" showTabs={false} hideHeader fillViewport>
            <Head title="Go Live · Mad Fan" />

            <div className="kf-live-create">
                <div className="kf-live-create__head">
                    <Link href={isVoice ? '/social/stage' : '/social/live'} className="kf-live-create__back" aria-label="Back">
                        <IconBack />
                    </Link>
                    <div>
                        <h1 id={labelId} className="kf-live-create__title">
                            Go Live
                        </h1>
                        <p className="kf-live-create__sub">Pick a format, name your stream, and choose who can join in.</p>
                    </div>
                </div>

                <form className="kf-form kf-live-create__form" onSubmit={submit} aria-labelledby={labelId}>
                    <div className="kf-form__group">
                        <span className="kf-form__label">Format</span>
                        <div className="kf-form__radio-grid kf-form__radio-grid--types">
                            <label className={`kf-type-option ${!isVoice ? 'is-selected' : ''}`}>
                                <input
                                    type="radio"
                                    name="format"
                                    value="creator"
                                    checked={!isVoice}
                                    onChange={() => selectFormat('creator')}
                                />
                                <span className="kf-type-option__icon" aria-hidden>
                                    <IconCamera />
                                </span>
                                <span className="kf-type-option__label">Camera Live</span>
                                <span className="kf-type-option__blurb">Camera, mic, and live chat</span>
                            </label>
                            <label className={`kf-type-option ${isVoice ? 'is-selected' : ''}`}>
                                <input
                                    type="radio"
                                    name="format"
                                    value="voice"
                                    checked={isVoice}
                                    onChange={() => selectFormat('voice')}
                                />
                                <span className="kf-type-option__icon" aria-hidden>
                                    <IconMic />
                                </span>
                                <span className="kf-type-option__label">Voice Room</span>
                                <span className="kf-type-option__blurb">Audio and chat, no camera</span>
                            </label>
                        </div>
                    </div>

                    {!isVoice && stageTypes.length > 1 ? (
                        <div className="kf-form__group">
                            <span className="kf-form__label">Camera format</span>
                            <div className="kf-form__radio-grid kf-form__radio-grid--types">
                                {stageTypes.map((type) => {
                                    const meta = TYPE_META[type.value] || { icon: IconBroadcast, blurb: null };
                                    const Icon = meta.icon;
                                    return (
                                        <label key={type.value} className={`kf-type-option ${data.type === type.value ? 'is-selected' : ''}`}>
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
                                            {meta.blurb ? <span className="kf-type-option__blurb">{meta.blurb}</span> : null}
                                        </label>
                                    );
                                })}
                            </div>
                        </div>
                    ) : null}

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
                            maxLength={titleLimit}
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
                            maxLength={descriptionLimit}
                            placeholder="Tell viewers what to expect (optional)"
                        />
                    </div>

                    <div className="kf-form__group">
                        <label className="kf-toggle-row">
                            <span>Public — listed on {isVoice ? 'the Stage lobby' : 'Live Now'}</span>
                            <span className="kf-toggle">
                                <input
                                    type="checkbox"
                                    className="kf-toggle__input"
                                    checked={data.is_public}
                                    onChange={(e) => setData('is_public', e.target.checked)}
                                />
                                <span className="kf-toggle__track" aria-hidden />
                            </span>
                        </label>

                        {isVoice ? (
                            <>
                                <label className="kf-toggle-row">
                                    <span>Fans can invite</span>
                                    <span className="kf-toggle">
                                        <input
                                            type="checkbox"
                                            className="kf-toggle__input"
                                            checked={data.allow_invite}
                                            onChange={(e) => setData('allow_invite', e.target.checked)}
                                        />
                                        <span className="kf-toggle__track" aria-hidden />
                                    </span>
                                </label>
                                <label className="kf-toggle-row">
                                    <span>Room chat</span>
                                    <span className="kf-toggle">
                                        <input
                                            type="checkbox"
                                            className="kf-toggle__input"
                                            checked={data.allow_chat}
                                            onChange={(e) => setData('allow_chat', e.target.checked)}
                                        />
                                        <span className="kf-toggle__track" aria-hidden />
                                    </span>
                                </label>
                                <label className="kf-toggle-row">
                                    <span>Speak requests</span>
                                    <span className="kf-toggle">
                                        <input
                                            type="checkbox"
                                            className="kf-toggle__input"
                                            checked={data.allow_speak_requests}
                                            onChange={(e) => setData('allow_speak_requests', e.target.checked)}
                                        />
                                        <span className="kf-toggle__track" aria-hidden />
                                    </span>
                                </label>
                            </>
                        ) : (
                            <>
                                <label className="kf-toggle-row">
                                    <span>Allow comments</span>
                                    <span className="kf-toggle">
                                        <input
                                            type="checkbox"
                                            className="kf-toggle__input"
                                            checked={data.allow_comments}
                                            onChange={(e) => setData('allow_comments', e.target.checked)}
                                        />
                                        <span className="kf-toggle__track" aria-hidden />
                                    </span>
                                </label>
                                <label className="kf-toggle-row">
                                    <span>Allow reactions</span>
                                    <span className="kf-toggle">
                                        <input
                                            type="checkbox"
                                            className="kf-toggle__input"
                                            checked={data.allow_reactions}
                                            onChange={(e) => setData('allow_reactions', e.target.checked)}
                                        />
                                        <span className="kf-toggle__track" aria-hidden />
                                    </span>
                                </label>
                            </>
                        )}
                    </div>

                    {isVoice && stageBackgrounds.length > 0 ? (
                        <div className="kf-form__group">
                            <span className="kf-form__label">Stadium backdrop</span>
                            <div className="kf-form__radio-grid">
                                {stageBackgrounds.map((bg) => (
                                    <label
                                        key={bg.key}
                                        className="kf-form__radio-option"
                                        style={{ backgroundImage: `url('${bg.url}')` }}
                                    >
                                        <input
                                            type="radio"
                                            name="background_key"
                                            value={bg.key}
                                            checked={data.background_key === bg.key}
                                            onChange={() => setData('background_key', bg.key)}
                                        />
                                        <span className="kf-form__radio-check" />
                                    </label>
                                ))}
                            </div>
                        </div>
                    ) : null}

                    <div className="kf-form__buttons">
                        <Link href={isVoice ? '/social/stage' : '/social/live'} className="kf-form__btn">
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
