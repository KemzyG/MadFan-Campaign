// Shared audio-output preferences for Stage voice playback.
//
// Both voice drivers (mesh `useStageVoice.js` and LiveKit `useStageLiveKitVoice.js`)
// used to hardcode `audio.volume = 1` on every remote element. This tiny store lets
// the room's audio menu drive one deafen toggle + one output-volume slider that both
// drivers honour, persisted to localStorage so a refresh keeps the listener's choice.
//
// Deliberately dependency-free: a hand-rolled subscribe/get/set store, no React, so the
// voice hooks (plain JS) and the React components can both read it.

const STORAGE_KEY = 'mf.stage.audioOutput';

const DEFAULT_STATE = { volume: 1, deafened: false };

function clampVolume(value) {
    const num = Number(value);
    if (!Number.isFinite(num)) {
        return 1;
    }

    return Math.min(1, Math.max(0, num));
}

function readStorage() {
    if (typeof window === 'undefined' || !window.localStorage) {
        return { ...DEFAULT_STATE };
    }

    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            return { ...DEFAULT_STATE };
        }

        const parsed = JSON.parse(raw);

        return {
            volume: clampVolume(parsed?.volume ?? DEFAULT_STATE.volume),
            deafened: Boolean(parsed?.deafened),
        };
    } catch {
        return { ...DEFAULT_STATE };
    }
}

let state = readStorage();
const listeners = new Set();

function persist() {
    if (typeof window === 'undefined' || !window.localStorage) {
        return;
    }

    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
        // Private mode / quota — the in-memory store still works this session.
    }
}

function emit() {
    for (const listener of listeners) {
        try {
            listener(state);
        } catch {
            // A throwing subscriber must not break the others.
        }
    }
}

/**
 * The multiplier a voice driver should apply to a remote element's volume.
 * Deafened collapses to silence regardless of the slider.
 */
export function effectiveVolume() {
    return state.deafened ? 0 : state.volume;
}

export function getAudioOutput() {
    return state;
}

export function setVolume(value) {
    const volume = clampVolume(value);
    if (volume === state.volume) {
        return;
    }

    state = { ...state, volume };
    persist();
    emit();
}

export function setDeafened(deafened) {
    const next = Boolean(deafened);
    if (next === state.deafened) {
        return;
    }

    state = { ...state, deafened: next };
    persist();
    emit();
}

export function toggleDeafened() {
    setDeafened(!state.deafened);
}

/**
 * Subscribe to output-pref changes. Returns an unsubscribe fn. The voice drivers use
 * this to re-apply volume to live audio elements the moment the listener drags the slider.
 */
export function subscribeAudioOutput(listener) {
    listeners.add(listener);

    return () => {
        listeners.delete(listener);
    };
}
