import { create } from 'zustand';
import { CAMERA, CAMERA_MODES, REPLAY_ANGLES } from '../constants/camera';
import { clamp } from '../math';

/**
 * @module store/cameraStore
 * Viewpoint state only — motion lives in CameraController.
 */

export const useCameraStore = create((set, get) => ({
    mode: CAMERA_MODES.idle,
    yaw: CAMERA.defaultYaw,
    pitch: CAMERA.defaultPitch,
    shake: 0,
    zoom: 1,
    replayAngle: REPLAY_ANGLES.behindShooter,
    lookBias: { x: 0, y: 0, z: 0 },

    setMode: (mode) => set({ mode }),

    setOrbitDelta: (dyaw, dpitch) => {
        const { yaw, pitch } = get();
        set({
            yaw: clamp(yaw + dyaw, CAMERA.minYaw, CAMERA.maxYaw),
            pitch: clamp(pitch + dpitch, CAMERA.minPitch, CAMERA.maxPitch),
        });
    },

    resetOrbit: () => set({ yaw: CAMERA.defaultYaw, pitch: CAMERA.defaultPitch }),

    addShake: (amount) => set({ shake: Math.min(1, get().shake + amount) }),

    tickShake: (dt) => {
        const { shake } = get();
        if (shake <= 0) {
            return;
        }
        set({ shake: Math.max(0, shake - CAMERA.shakeDecay * dt * shake) });
    },

    setReplayAngle: (replayAngle) => set({ replayAngle }),

    setLookBias: (lookBias) => set({ lookBias }),
}));
