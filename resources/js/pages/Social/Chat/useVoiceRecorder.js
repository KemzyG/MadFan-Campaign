import { useCallback, useEffect, useRef, useState } from 'react';

const MAX_VOICE_MS = 120_000;

/**
 * Browser voice-note recorder for chat composer.
 */
export function useVoiceRecorder() {
    const mediaRecorderRef = useRef(null);
    const chunksRef = useRef([]);
    const timerRef = useRef(null);
    const streamRef = useRef(null);

    const [recording, setRecording] = useState(false);
    const [elapsedMs, setElapsedMs] = useState(0);
    const [preview, setPreview] = useState(null);
    const [error, setError] = useState('');

    const cleanupStream = useCallback(() => {
        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
    }, []);

    useEffect(() => () => {
        if (timerRef.current) {
            window.clearInterval(timerRef.current);
        }
        cleanupStream();
        if (preview?.url) {
            URL.revokeObjectURL(preview.url);
        }
    }, [cleanupStream, preview?.url]);

    const clearPreview = useCallback(() => {
        if (preview?.url) {
            URL.revokeObjectURL(preview.url);
        }
        setPreview(null);
        setElapsedMs(0);
        setError('');
    }, [preview?.url]);

    const stopRecording = useCallback(() => {
        if (timerRef.current) {
            window.clearInterval(timerRef.current);
            timerRef.current = null;
        }

        if (mediaRecorderRef.current?.state === 'recording') {
            mediaRecorderRef.current.stop();
        }

        setRecording(false);
    }, []);

    const startRecording = useCallback(async () => {
        if (recording) {
            return;
        }

        setError('');

        if (!navigator.mediaDevices?.getUserMedia) {
            setError('Voice notes are not supported in this browser.');

            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
            chunksRef.current = [];

            const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
                ? 'audio/webm;codecs=opus'
                : MediaRecorder.isTypeSupported('audio/webm')
                    ? 'audio/webm'
                    : '';

            const recorder = mimeType
                ? new MediaRecorder(stream, { mimeType })
                : new MediaRecorder(stream);

            mediaRecorderRef.current = recorder;

            recorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunksRef.current.push(event.data);
                }
            };

            recorder.onstop = () => {
                cleanupStream();

                const blob = new Blob(chunksRef.current, {
                    type: recorder.mimeType || 'audio/webm',
                });

                if (blob.size === 0) {
                    setError('Recording was too short.');

                    return;
                }

                const extension = blob.type.includes('mp4') ? 'm4a' : 'webm';
                const file = new File([blob], `voice-${Date.now()}.${extension}`, {
                    type: blob.type || 'audio/webm',
                });

                setPreview({
                    file,
                    url: URL.createObjectURL(blob),
                    durationMs: elapsedMs,
                });
            };

            recorder.start();
            setRecording(true);
            setElapsedMs(0);

            timerRef.current = window.setInterval(() => {
                setElapsedMs((value) => {
                    const next = value + 200;
                    if (next >= MAX_VOICE_MS) {
                        stopRecording();
                    }

                    return next;
                });
            }, 200);
        } catch {
            cleanupStream();
            setError('Microphone access was denied.');
        }
    }, [cleanupStream, elapsedMs, recording, stopRecording]);

    return {
        recording,
        elapsedMs,
        preview,
        error,
        startRecording,
        stopRecording,
        clearPreview,
    };
}

export function formatVoiceDuration(ms) {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${minutes}:${String(seconds).padStart(2, '0')}`;
}
