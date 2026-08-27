import { useCallback, useState } from 'react';
import { IconClose, IconPause, IconPlay } from './StageIcons';
import { useStageActions } from './useStageActions';

function pad(value) {
    return String(Math.floor(value)).padStart(2, '0');
}

function formatTime(seconds) {
    if (!Number.isFinite(seconds)) {
        return '0:00';
    }
    const mins = Math.floor(seconds / 60);
    return `${mins}:${pad(seconds % 60)}`;
}

/**
 * Host-only floating "presenting" bar. Mounts the actual capture canvas (not
 * a copy of it) as its own preview and drawing surface — pointer events land
 * directly on the same element being streamed, so there's no separate
 * coordinate-mapping step for annotations beyond scaling client pixels to the
 * canvas's own resolution. Playback and drawing need no network sync: viewers
 * are watching this exact canvas live via LiveKit, so whatever renders here
 * is already what they see.
 */
export default function StagePresentationControls() {
    const actions = useStageActions();
    const [drawing, setDrawing] = useState(false);

    const mountCanvas = useCallback(
        (node) => {
            if (!node) {
                return;
            }
            const canvas = actions.getPresentationCanvas?.();
            const existing = node.querySelector('canvas');
            if (existing && existing !== canvas) {
                existing.remove();
            }
            if (canvas && canvas.parentNode !== node) {
                canvas.classList.add('mf-stage-presentation__canvas-el');
                node.appendChild(canvas);
            }
        },
        [actions],
    );

    if (!actions.presenting) {
        return null;
    }

    const state = actions.presentationState || {};

    function pointFromEvent(event) {
        const canvas = actions.getPresentationCanvas?.();
        if (!canvas) {
            return null;
        }
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        return {
            x: (event.clientX - rect.left) * scaleX,
            y: (event.clientY - rect.top) * scaleY,
        };
    }

    function onPointerDown(event) {
        if (!drawing) {
            return;
        }
        event.currentTarget.setPointerCapture(event.pointerId);
        const point = pointFromEvent(event);
        if (point) {
            actions.presentationPointerDown(point.x, point.y);
        }
    }

    function onPointerMove(event) {
        if (!drawing) {
            return;
        }
        const point = pointFromEvent(event);
        if (point) {
            actions.presentationPointerMove(point.x, point.y);
        }
    }

    function toggleDrawing() {
        const next = !drawing;
        setDrawing(next);
        actions.setPresentationDrawing(next);
    }

    return (
        <div className="mf-stage-presentation">
            <div className="mf-stage-presentation__head">
                <span className="mf-stage-presentation__label mf-mono">Presenting</span>
                <button
                    type="button"
                    className="mf-stage-presentation__stop"
                    aria-label="Stop presenting"
                    onClick={actions.stopPresentation}
                >
                    <IconClose />
                </button>
            </div>

            <div
                className={`mf-stage-presentation__stage ${drawing ? 'is-drawing' : ''}`}
                ref={mountCanvas}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
            />

            <div className="mf-stage-presentation__bar">
                <button
                    type="button"
                    className="mf-stage-presentation__btn"
                    aria-label={state.playing ? 'Pause' : 'Play'}
                    onClick={state.playing ? actions.presentationPause : actions.presentationPlay}
                >
                    {state.playing ? <IconPause /> : <IconPlay />}
                </button>

                <span className="mf-stage-presentation__time mf-mono">
                    {formatTime(state.currentTime)} / {formatTime(state.duration)}
                </span>

                <input
                    type="range"
                    className="mf-stage-presentation__seek"
                    min={0}
                    max={Number.isFinite(state.duration) && state.duration > 0 ? state.duration : 0}
                    step={0.1}
                    value={state.currentTime || 0}
                    onChange={(event) => actions.presentationSeek(Number(event.target.value))}
                />

                <button
                    type="button"
                    className={`mf-stage-presentation__btn ${drawing ? 'is-active' : ''}`}
                    aria-pressed={drawing}
                    onClick={toggleDrawing}
                >
                    Draw
                </button>

                <button type="button" className="mf-stage-presentation__btn" onClick={actions.presentationClearDrawing}>
                    Clear
                </button>
            </div>
        </div>
    );
}
