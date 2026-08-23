import { useStageSession } from './StageSessionContext';
import { IconDeafen, IconVolume } from './StageIcons';

/**
 * Output controls popover: a volume slider and a deafen toggle. Both persist to
 * localStorage through the session's `audioOutput` store, which the voice hooks
 * read when setting each audio element's volume.
 */
export default function StageAudioMenu() {
    const { audioOutput } = useStageSession();
    const { volume, deafened, setVolume, toggleDeafened } = audioOutput;
    const shownPct = Math.round((deafened ? 0 : volume) * 100);

    return (
        <div className="mf-stage-audio-menu" role="dialog" aria-label="Audio output">
            <div className="mf-stage-audio-menu__row">
                <span className="mf-stage-audio-menu__label">
                    <IconVolume className="mf-stage-audio-menu__glyph" />
                    Output
                </span>
                <span className="mf-mono mf-text-micro text-[var(--mf-muted)]">{shownPct}%</span>
            </div>
            <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={Math.round(volume * 100)}
                className="mf-stage-audio-menu__slider"
                aria-label="Output volume"
                disabled={deafened}
                onChange={(e) => setVolume(Number(e.target.value) / 100)}
            />
            <button
                type="button"
                className={`mf-stage-audio-menu__deafen ${deafened ? 'is-on' : ''}`.trim()}
                aria-pressed={deafened}
                onClick={toggleDeafened}
            >
                <IconDeafen className="mf-stage-audio-menu__glyph" />
                {deafened ? 'Undeafen' : 'Deafen'}
            </button>
        </div>
    );
}
