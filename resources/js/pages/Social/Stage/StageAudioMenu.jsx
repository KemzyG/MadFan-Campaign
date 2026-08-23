import { useStageSession } from './StageSessionContext';
import { IconVolume } from './StageIcons';

/**
 * Output controls popover: a single output-volume slider. Persists to
 * localStorage through the session's `audioOutput` store, which the voice hooks
 * read when setting each audio element's volume.
 */
export default function StageAudioMenu() {
    const { audioOutput } = useStageSession();
    const { volume, setVolume } = audioOutput;
    const shownPct = Math.round(volume * 100);

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
                onChange={(e) => setVolume(Number(e.target.value) / 100)}
            />
        </div>
    );
}
