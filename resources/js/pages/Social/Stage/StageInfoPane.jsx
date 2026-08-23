import { useSocialFlash } from '../optimistic';
import { IconLink } from './StageIcons';
import { STAGE_SHORTCUTS } from './useStageShortcuts';
import { useStageSession } from './StageSessionContext';

function RuleRow({ label, on, onText = 'On', offText = 'Off' }) {
    return (
        <li className="mf-stage-info__rule">
            <span className="mf-stage-info__rule-label">{label}</span>
            <span className={`mf-stage-info__rule-value ${on ? 'is-on' : 'is-off'}`}>
                {on ? onText : offText}
            </span>
        </li>
    );
}

/** Voice driver label from the room's voice descriptor. */
function voiceLabel(voice, voiceEnabled) {
    if (!voiceEnabled) {
        return 'Text lobby — voice off';
    }
    switch (voice?.driver) {
        case 'livekit':
            return 'LiveKit (SFU)';
        case 'mesh':
            return 'Peer-to-peer mesh';
        default:
            return 'Voice on';
    }
}

/**
 * Info rail pane: the room's description, house rules, voice driver, keyboard
 * shortcuts and a copy-invite-link action. Read-only for everyone.
 */
export default function StageInfoPane() {
    const { room } = useStageSession();
    const { reportSuccess, reportError } = useSocialFlash();
    const stage = room?.stage;

    if (!stage) {
        return null;
    }

    const voiceEnabled = Boolean(stage.voice_enabled);
    const inviteAllowed = stage.allow_invite !== false;

    function copyLink() {
        if (typeof window === 'undefined') {
            return;
        }
        const url = `${window.location.origin}/social/stage/${stage.id}`;
        const clipboard = window.navigator?.clipboard;
        if (clipboard?.writeText) {
            clipboard.writeText(url).then(
                () => reportSuccess?.('Invite link copied.'),
                () => reportError?.('Could not copy the link.'),
            );
        } else {
            reportError?.('Copying is not available here.');
        }
    }

    return (
        <div className="mf-stage-info" aria-label="Stage information">
            {stage.description ? (
                <section className="mf-stage-info__section">
                    <h3 className="mf-stage-info__title">About</h3>
                    <p className="mf-stage-info__desc">{stage.description}</p>
                </section>
            ) : null}

            <section className="mf-stage-info__section">
                <h3 className="mf-stage-info__title">House rules</h3>
                <ul className="mf-stage-info__rules">
                    <RuleRow label="Voice" on={voiceEnabled} onText={voiceLabel(room?.voice, voiceEnabled)} offText="Text only" />
                    <RuleRow label="Chat" on={stage.allow_chat !== false} />
                    <RuleRow label="Requests to speak" on={stage.allow_speak_requests !== false} onText="Open" offText="Closed" />
                    <RuleRow label="Invites" on={inviteAllowed} onText="Allowed" offText="Off" />
                    <RuleRow label="Visibility" on={stage.is_public !== false} onText="Public" offText="Private" />
                </ul>
                <p className="mf-stage-info__note mf-text-micro text-[var(--mf-muted)]">
                    Up to {stage.max_speakers ?? 8} fans can be on the mic at once.
                </p>
            </section>

            {inviteAllowed ? (
                <section className="mf-stage-info__section">
                    <h3 className="mf-stage-info__title">Invite</h3>
                    <button type="button" className="mf-stage-info__copy" onClick={copyLink}>
                        <IconLink className="mf-stage-info__copy-glyph" />
                        Copy invite link
                    </button>
                </section>
            ) : null}

            <section className="mf-stage-info__section mf-stage-info__section--shortcuts">
                <h3 className="mf-stage-info__title">Keyboard shortcuts</h3>
                <ul className="mf-stage-info__shortcuts">
                    {STAGE_SHORTCUTS.map((shortcut) => (
                        <li key={shortcut.label} className="mf-stage-info__shortcut">
                            <span className="mf-stage-info__shortcut-keys">
                                {shortcut.keys.map((key) => (
                                    <kbd key={key} className="mf-kbd">
                                        {key}
                                    </kbd>
                                ))}
                            </span>
                            <span className="mf-stage-info__shortcut-label">{shortcut.label}</span>
                        </li>
                    ))}
                </ul>
            </section>
        </div>
    );
}
