import { useForm } from '@inertiajs/react';
import { useId } from 'react';

/**
 * Stage-format picker + title/description (spec §7). Only `creator` is
 * selectable today — stageTypes comes from the backend's
 * LiveStageTypeConfig::implemented(), so this list grows automatically the
 * moment a new format ships server-side, with zero changes here.
 */
export default function LiveCreateSheet({ open, onClose, stageTypes, maxTitleLength, maxDescriptionLength }) {
    const labelId = useId();
    const { data, setData, post, processing, errors, reset } = useForm({
        title: '',
        type: stageTypes[0]?.value || 'creator',
        description: '',
        is_public: true,
        allow_comments: true,
        allow_reactions: true,
    });

    if (!open) {
        return null;
    }

    const close = () => {
        reset();
        onClose();
    };

    const submit = (event) => {
        event.preventDefault();
        post('/social/live', { onSuccess: close });
    };

    return (
        <div className="kf-sheet-scrim" role="presentation" onClick={close}>
            <div
                className="kf-sheet"
                role="dialog"
                aria-modal="true"
                aria-labelledby={labelId}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="kf-sheet__head">
                    <h2 id={labelId} className="kf-sheet__title">
                        Go Live
                    </h2>
                    <button type="button" className="kf-sheet__close" aria-label="Close" onClick={close}>
                        ×
                    </button>
                </div>

                <form className="kf-form" onSubmit={submit}>
                    <div className="kf-form__group">
                        <span className="kf-form__label">Format</span>
                        <div className="kf-form__radio-grid kf-form__radio-grid--types">
                            {stageTypes.map((type) => (
                                <label key={type.value} className="kf-type-option">
                                    <input
                                        type="radio"
                                        name="type"
                                        value={type.value}
                                        checked={data.type === type.value}
                                        onChange={() => setData('type', type.value)}
                                    />
                                    <span className="kf-type-option__label">{type.label}</span>
                                </label>
                            ))}
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
                        <button type="button" className="kf-form__btn" onClick={close}>
                            Cancel
                        </button>
                        <button type="submit" className="kf-form__btn kf-form__btn--primary" disabled={processing}>
                            {processing ? 'Creating…' : 'Continue'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
