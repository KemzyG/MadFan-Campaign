import { useEffect, useRef, useState } from 'react';

/**
 * Local-only camera/mic preview for the pre-live studio (spec §8) — plain
 * getUserMedia, no LiveKit involved. There is no room to join yet at this
 * point (see LiveStageService::start — the room is only allocated once the
 * host actually goes live), so this exists purely to let the host confirm
 * "is my camera working" before committing to Start Live.
 */
export function useDevicePreview(enabled) {
    const [videoEl, setVideoEl] = useState(null);
    const [devices, setDevices] = useState({ cameras: [], microphones: [] });
    const [error, setError] = useState(null);
    const streamRef = useRef(null);

    useEffect(() => {
        if (!enabled) {
            return undefined;
        }

        let cancelled = false;

        (async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                if (cancelled) {
                    stream.getTracks().forEach((t) => t.stop());
                    return;
                }
                streamRef.current = stream;
                const el = document.createElement('video');
                el.srcObject = stream;
                el.muted = true;
                el.playsInline = true;
                el.autoplay = true;
                setVideoEl(el);

                const list = await navigator.mediaDevices.enumerateDevices();
                setDevices({
                    cameras: list.filter((d) => d.kind === 'videoinput'),
                    microphones: list.filter((d) => d.kind === 'audioinput'),
                });
            } catch (err) {
                if (!cancelled) {
                    setError(err.message || 'Camera/microphone access was denied.');
                }
            }
        })();

        return () => {
            cancelled = true;
            streamRef.current?.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
            setVideoEl(null);
        };
    }, [enabled]);

    return { videoEl, devices, error };
}
