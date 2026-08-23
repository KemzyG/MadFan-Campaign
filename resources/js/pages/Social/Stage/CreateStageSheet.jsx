import { useForm, usePage } from '@inertiajs/react';
import { useId } from 'react';
import { useSocialFlash, withRollbackFlash } from '../optimistic';
import {
    BackgroundPicker,
    FieldGroup,
    SectionLabel,
    SwitchRow,
    TextAreaField,
    TextField,
} from './StageFormFields';
import { IconLive } from './StageIcons';
import StageSheet from './StageSheet';

/**
 * "Go live" sheet. Same optimistic `useForm().optimistic()` submit the modal had,
 * restyled on the shared StageSheet + form primitives with a live backdrop
 * preview. Prepends the new stage to the lobby list, then rolls back on failure.
 */
export default function CreateStageSheet({
    open,
    onClose,
    maxTitleLength = 80,
    maxDescriptionLength = 280,
    stageBackgrounds = [],
}) {
    const labelId = useId();
    const page = usePage();
    const authUser = page.props?.auth?.user;
    const { reportError } = useSocialFlash();
    const defaultBackground = stageBackgrounds[0]?.key ?? 1;

    const { data, setData, post, processing, errors, reset, optimistic } = useForm({
        title: '',
        description: '',
        is_public: true,
        allow_invite: true,
        allow_chat: true,
        allow_speak_requests: true,
        background_key: defaultBackground,
    });

    if (!open) {
        return null;
    }

    function submit(e) {
        e.preventDefault();
        if (data.title.trim().length < 3) {
            return;
        }

        const tempId = `tmp-${Date.now()}`;
        const title = data.title.trim();
        const selectedBackground =
            stageBackgrounds.find((bg) => bg.key === data.background_key) ?? stageBackgrounds[0];

        optimistic((props) => ({
            stages: [
                {
                    id: tempId,
                    title,
                    description: data.description.trim() || null,
                    status: 'live',
                    is_public: data.is_public,
                    allow_invite: data.allow_invite,
                    allow_chat: data.allow_chat,
                    allow_speak_requests: data.allow_speak_requests,
                    background_key: data.background_key,
                    background_url: selectedBackground?.url,
                    voice_enabled: false,
                    started_at: new Date().toISOString(),
                    host: {
                        id: authUser?.id,
                        name: authUser?.name || 'You',
                        handle: authUser?.handle,
                        avatar_url: authUser?.avatar_url,
                        avatar_emoji: authUser?.avatar_emoji,
                    },
                    club: null,
                    speaker_count: 1,
                    listener_count: 0,
                    participant_count: 1,
                    _optimistic: true,
                },
                ...(props.stages || []),
            ],
        })).post(
            '/social/stage',
            withRollbackFlash(reportError, {
                onSuccess: () => {
                    reset();
                    onClose();
                },
            }),
        );
    }

    const titleRemaining = maxTitleLength - data.title.length;
    const descriptionRemaining = maxDescriptionLength - data.description.length;
    const canGoLive = data.title.trim().length >= 3 && !processing;
    const previewBg = stageBackgrounds.find((bg) => bg.key === data.background_key) ?? stageBackgrounds[0];

    return (
        <StageSheet
            open={open}
            onClose={onClose}
            labelledBy={labelId}
            icon={<IconLive className="mf-stage-sheet__icon" />}
            eyebrow="Open the terrace"
            title="Go live"
            subtitle="Name your room and set the terrace rules."
            className="mf-sheet--stage-create"
        >
            <form className="mf-stage-form" onSubmit={submit}>
                <div className="mf-stage-form__scroll">
                    {previewBg ? (
                        <div
                            className="mf-stage-form__preview"
                            style={{ backgroundImage: `url('${previewBg.url}')` }}
                            aria-hidden
                        >
                            <span className="mf-stage-form__preview-chip mf-mono">
                                <span className="mf-stage-live-dot" />
                                Live preview
                            </span>
                            <span className="mf-stage-form__preview-title truncate">
                                {data.title.trim() || 'Your stage title'}
                            </span>
                        </div>
                    ) : null}

                    <section className="mf-stage-form__section">
                        <SectionLabel id={`${labelId}-details`}>Stage details</SectionLabel>
                        <FieldGroup>
                            <TextField
                                id={`${labelId}-title`}
                                label="Title"
                                maxLength={maxTitleLength}
                                placeholder="Match reaction, transfer window, derby debate…"
                                value={data.title}
                                onChange={(e) => setData('title', e.target.value)}
                                disabled={processing}
                                autoComplete="off"
                                autoFocus
                                error={errors.title}
                            />
                            <TextAreaField
                                id={`${labelId}-description`}
                                label="Description"
                                optional
                                rows={3}
                                maxLength={maxDescriptionLength}
                                placeholder="What’s the vibe? Derby prep, transfer rumours, post-match…"
                                value={data.description}
                                onChange={(e) => setData('description', e.target.value)}
                                disabled={processing}
                                error={errors.description}
                            />
                        </FieldGroup>
                    </section>

                    <section className="mf-stage-form__section">
                        <SectionLabel id={`${labelId}-rules`}>Room settings</SectionLabel>
                        <FieldGroup className="mf-stage-form__group--switches">
                            <SwitchRow
                                id={`${labelId}-public`}
                                label="Public stage"
                                hint="Shows in the live lobby for any fan to discover."
                                checked={data.is_public}
                                onChange={(value) => setData('is_public', value)}
                                disabled={processing}
                            />
                            <SwitchRow
                                id={`${labelId}-invite`}
                                label="Fans can invite"
                                hint="Allow sharing the stage link to the terrace feed."
                                checked={data.allow_invite}
                                onChange={(value) => setData('allow_invite', value)}
                                disabled={processing}
                            />
                            <SwitchRow
                                id={`${labelId}-chat`}
                                label="Room chat"
                                hint="Listeners and speakers can post messages."
                                checked={data.allow_chat}
                                onChange={(value) => setData('allow_chat', value)}
                                disabled={processing}
                            />
                            <SwitchRow
                                id={`${labelId}-speak`}
                                label="Speak requests"
                                hint="Listeners can raise a hand to request the mic."
                                checked={data.allow_speak_requests}
                                onChange={(value) => setData('allow_speak_requests', value)}
                                disabled={processing}
                            />
                        </FieldGroup>
                    </section>

                    {stageBackgrounds.length > 0 ? (
                        <section className="mf-stage-form__section">
                            <SectionLabel id={`${labelId}-backdrop`}>Stadium backdrop</SectionLabel>
                            <BackgroundPicker
                                backgrounds={stageBackgrounds}
                                value={data.background_key}
                                onChange={(key) => setData('background_key', key)}
                                disabled={processing}
                                name={`${labelId}-bg`}
                            />
                        </section>
                    ) : null}
                </div>

                <div className="mf-stage-form__foot">
                    {errors.title ? (
                        <p className="mf-field-error">{errors.title}</p>
                    ) : (
                        <p className="mf-mono mf-text-micro text-[var(--mf-muted)]">
                            {titleRemaining} title · {descriptionRemaining} desc · min 3 chars
                        </p>
                    )}
                    <button type="submit" className="mf-btn mf-btn--pitch" disabled={!canGoLive}>
                        {processing ? 'Opening…' : 'Go live'}
                    </button>
                </div>
            </form>
        </StageSheet>
    );
}
