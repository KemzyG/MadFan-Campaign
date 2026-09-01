import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

/** Only one voice note plays at a time across the chat thread. */
let activeVoiceStop = null;

function registerVoicePlayback(stop) {
    if (activeVoiceStop && activeVoiceStop !== stop) {
        activeVoiceStop();
    }
    activeVoiceStop = stop;
}

function unregisterVoicePlayback(stop) {
    if (activeVoiceStop === stop) {
        activeVoiceStop = null;
    }
}

function barsForSeed(seed, count = 32) {
    const base = String(seed)
        .split('')
        .reduce((sum, char) => sum + char.charCodeAt(0), 0);

    return Array.from({ length: count }, (_, index) => {
        const raw = ((base * (index + 3) * 9301 + 49297) % 233280) / 233280;

        return 0.22 + raw * 0.78;
    });
}

function formatVoiceDuration(seconds) {
    const total = Math.max(0, Math.floor(seconds));
    const minutes = Math.floor(total / 60);
    const secs = total % 60;

    return `${minutes}:${String(secs).padStart(2, '0')}`;
}

function IconPlay() {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M8 5.14v13.72c0 .79.87 1.27 1.54.84l10.04-6.86a1 1 0 0 0 0-1.68L9.54 4.3A1 1 0 0 0 8 5.14Z" />
        </svg>
    );
}

function IconPause() {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M7 5h3v14H7V5Zm7 0h3v14h-3V5Z" />
        </svg>
    );
}

/**
 * WhatsApp / Telegram style inline voice bubble — play icon + waveform, no native controls.
 *
 * @param {{ src: string, seed?: string|number, isMine?: boolean, durationMs?: number, compact?: boolean }} props
 */
export default function VoiceNotePlayer({ src, seed = src, isMine = false, durationMs = 0, compact = false }) {
    const audioRef = useRef(null);
    const [playing, setPlaying] = useState(false);
    const [duration, setDuration] = useState(Math.max(0, durationMs / 1000));
    const [current, setCurrent] = useState(0);

    const bars = useMemo(() => barsForSeed(seed), [seed]);

    const stopPlayback = useCallback(() => {
        const audio = audioRef.current;
        if (!audio) {
            setPlaying(false);

            return;
        }

        audio.pause();
        setPlaying(false);
    }, []);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) {
            return undefined;
        }

        function onLoaded() {
            if (Number.isFinite(audio.duration) && audio.duration > 0) {
                setDuration(audio.duration);
            }
        }

        function onTimeUpdate() {
            setCurrent(audio.currentTime);
        }

        function onEnded() {
            setPlaying(false);
            setCurrent(0);
            unregisterVoicePlayback(stopPlayback);
        }

        function onPause() {
            if (audio.ended) {
                return;
            }
            setPlaying(false);
            unregisterVoicePlayback(stopPlayback);
        }

        audio.addEventListener('loadedmetadata', onLoaded);
        audio.addEventListener('timeupdate', onTimeUpdate);
        audio.addEventListener('ended', onEnded);
        audio.addEventListener('pause', onPause);

        return () => {
            audio.removeEventListener('loadedmetadata', onLoaded);
            audio.removeEventListener('timeupdate', onTimeUpdate);
            audio.removeEventListener('ended', onEnded);
            audio.removeEventListener('pause', onPause);
            stopPlayback();
            unregisterVoicePlayback(stopPlayback);
        };
    }, [src, stopPlayback]);

    function togglePlay(event) {
        event.preventDefault();
        event.stopPropagation();

        const audio = audioRef.current;
        if (!audio) {
            return;
        }

        if (playing) {
            stopPlayback();
            unregisterVoicePlayback(stopPlayback);

            return;
        }

        registerVoicePlayback(stopPlayback);
        audio.play().then(() => setPlaying(true)).catch(() => {
            setPlaying(false);
            unregisterVoicePlayback(stopPlayback);
        });
    }

    const displaySeconds = playing || current > 0
        ? Math.max(0, (duration || 0) - current)
        : duration || Math.max(0, durationMs / 1000);

    const progress = duration > 0 ? Math.min(1, current / duration) : 0;
    const activeBars = Math.floor(progress * bars.length);

    return (
        <div
            className={[
                'mf-voice-note',
                isMine ? 'is-mine' : 'is-theirs',
                compact ? 'is-compact' : '',
                playing ? 'is-playing' : '',
            ].filter(Boolean).join(' ')}
        >
            <audio ref={audioRef} src={src} preload="metadata" hidden />

            <button
                type="button"
                className="mf-voice-note__play"
                onClick={togglePlay}
                aria-label={playing ? 'Pause voice note' : 'Play voice note'}
            >
                {playing ? <IconPause /> : <IconPlay />}
            </button>

            <div className="mf-voice-note__wave" aria-hidden>
                {bars.map((height, index) => (
                    <span
                        key={index}
                        className={[
                            'mf-voice-note__bar',
                            index < activeBars ? 'is-past' : '',
                            playing && index === activeBars ? 'is-active' : '',
                        ].filter(Boolean).join(' ')}
                        style={{ '--bar-h': String(height) }}
                    />
                ))}
            </div>

            <span className="mf-voice-note__time mf-mono mf-text-micro">
                {formatVoiceDuration(displaySeconds)}
            </span>
        </div>
    );
}

export { formatVoiceDuration as formatVoiceClock };
