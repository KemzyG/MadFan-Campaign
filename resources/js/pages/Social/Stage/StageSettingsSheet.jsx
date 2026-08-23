import { useForm } from '@inertiajs/react';
import { useEffect, useId } from 'react';
import { useSocialFlash, withRollbackFlash } from '../optimistic';
import {
    BackgroundPicker,
    FieldGroup,
    SectionLabel,
    SwitchRow,
    TextAreaField,
    TextField,
} from './StageFormFields';
import { IconSettings } from './StageIcons';
import StageSheet from './StageSheet';
import { useStageSession } from './StageSessionContext';

/**
 * Host-only live settings. PATCHes the stage and patches the room immediately for
 * instant feedback; the server's `room.updated` broadcast reconciles everyone
 * else. Reuses the shared form primitives so it matches the create sheet exactly.
 */
export default function StageSettingsSheet({
    open,
    onClose,
    stageBackgrounds = [],
    maxTitleLength = 80,
    maxDescriptionLength = 280,
}) {
    const labelId = useId();
    const { room, patchRoom } = useStageSession();
    const { reportError } = useSocialFlash();
    const stage = room?.stage;
    const stageId = stage?.id;

    const { data, setData, patch, processing, errors } = useForm({
        title: '',
        description: '',
        is_public: true,
        allow_invite: true,
        allow_chat: true,
        allow_speak_requests: true,
        background_key: stageBackgrounds[0]?.key ?? 1,
    });

    // Seed the form from the live stage each time the sheet opens.
    useEffect(() => {
        if (!open || !stage) {
            return;
        }
        setData({
            title: stage.title || '',
            description: stage.description || '',
            is_public: stage.is_public !== false,
            allow_invite: stage.allow_invite !== false,
            allow_chat: stage.allow_chat !== false,
            allow_speak_requests: stage.allow_speak_requests !== false,
            background_key: stage.background_key ?? (stageBackgrounds[0]?.key ?? 1),
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, stage?.id]);

    if (!open || !stage) {
        return null;
    }

    function submit(e) {
        e.preventDefault();
        const title = data.title.trim();
        if (title.length < 3 || processing) {
            return;
        }

        const snapshot = stage;
        const selectedBg = stageBackgrounds.find((bg) => bg.key === data.background_key);

        patchRoom((props) => ({
            ...props,
            stage: props.stage
                ? {
                      ...props.stage,
                      title,
                      description: data.description.trim() || null,
                      is_public: data.is_public,
                      allow_invite: data.allow_invite,
                      allow_chat: data.allow_chat,
                      allow_speak_requests: data.allow_speak_requests,
                      background_key: data.background_key,
                      background_url: selectedBg?.url ?? props.stage.background_url,
                  }
                : props.stage,
        }));

        patch(
            `/social/stage/${stageId}`,
            withRollbackFlash(reportError, {
                preserveScroll: true,
                preserveState: true,
                onError: () => patchRoom((props) => ({ ...props, stage: snapshot })),
                onSuccess: () => onClose(),
            }),
        );
    }

    const titleRemaining = maxTitleLength - data.title.length;
    const descriptionRemaining = maxDescriptionLength - data.description.length;
    const canSave = data.title.trim().length >= 3 && !processing;

    return (
        <StageSheet
            open={open}
            onClose={onClose}
            labelledBy={labelId}
            icon={<IconSettings className="mf-stage-sheet__icon" />}
            eyebrow="Host controls"
            title="Stage settings"
            subtitle="Rename the room or change the rules while you’re live."
            className="mf-sheet--stage-settings"
        >
            <form className="mf-stage-form" onSubmit={submit}>
                <div className="mf-stage-form__scroll">
                    <section className="mf-stage-form__section">
                        <SectionLabel id={`${labelId}-details`}>Stage details</SectionLabel>
                        <FieldGroup>
                            <TextField
                                id={`${labelId}-title`}
                                label="Title"
                                maxLength={maxTitleLength}
                                value={data.title}
                                onChange={(e) => setData('title', e.target.value)}
                                disabled={processing}
                                autoComplete="off"
                                error={errors.title}
                            />
                            <TextAreaField
                                id={`${labelId}-description`}
                                label="Description"
                                optional
                                rows={3}
                                maxLength={maxDescriptionLength}
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
                    <p className="mf-mono mf-text-micro text-[var(--mf-muted)]">
                        {titleRemaining} title · {descriptionRemaining} desc · min 3 chars
                    </p>
                    <button type="submit" className="mf-btn mf-btn--pitch" disabled={!canSave}>
                        {processing ? 'Saving…' : 'Save changes'}
                    </button>
                </div>
            </form>
        </StageSheet>
    );
}
