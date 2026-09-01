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
    const elapsedMsRef = useRef(0);
    const previewUrlRef = useRef(null);

    const [recording, setRecording] = useState(false);
    const [elapsedMs, setElapsedMs] = useState(0);
    const [preview, setPreview] = useState(null);
    const [error, setError] = useState('');

    const cleanupStream = useCallback(() => {
        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
    }, []);

    const revokePreviewUrl = useCallback(() => {
        if (previewUrlRef.current) {
            URL.revokeObjectURL(previewUrlRef.current);
            previewUrlRef.current = null;
        }
    }, []);

    useEffect(() => () => {
        if (timerRef.current) {
            window.clearInterval(timerRef.current);
        }
        cleanupStream();
        revokePreviewUrl();
    }, [cleanupStream, revokePreviewUrl]);

    const clearPreview = useCallback(() => {
        revokePreviewUrl();
        setPreview(null);
        elapsedMsRef.current = 0;
        setElapsedMs(0);
        setError('');
    }, [revokePreviewUrl]);

    const stopRecording = useCallback(() => {
        if (timerRef.current) {
            window.clearInterval(timerRef.current);
            timerRef.current = null;
        }

        const recorder = mediaRecorderRef.current;
        if (recorder?.state === 'recording') {
            try {
                recorder.requestData();
            } catch {
                // Some browsers throw if no timeslice was configured — safe to ignore.
            }
            recorder.stop();
        }

        setRecording(false);
    }, []);

    const startRecording = useCallback(async () => {
        if (recording) {
            return;
        }

        setError('');
        revokePreviewUrl();
        setPreview(null);

        if (!navigator.mediaDevices?.getUserMedia) {
            setError('Voice notes are not supported in this browser.');

            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
            chunksRef.current = [];
            elapsedMsRef.current = 0;
            setElapsedMs(0);

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

                const url = URL.createObjectURL(blob);
                previewUrlRef.current = url;

                setPreview({
                    file,
                    url,
                    durationMs: elapsedMsRef.current,
                });
            };

            recorder.start(250);
            setRecording(true);

            timerRef.current = window.setInterval(() => {
                elapsedMsRef.current += 200;
                const next = elapsedMsRef.current;

                setElapsedMs(next);

                if (next >= MAX_VOICE_MS) {
                    stopRecording();
                }
            }, 200);
        } catch {
            cleanupStream();
            setError('Microphone access was denied.');
        }
    }, [cleanupStream, recording, revokePreviewUrl, stopRecording]);

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
