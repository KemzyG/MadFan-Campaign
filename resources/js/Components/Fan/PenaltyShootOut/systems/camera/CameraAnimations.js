import { CAMERA } from '../../constants/camera';
import { easeOutCubic } from '../../math';

/**
 * @module systems/camera/CameraAnimations
 * Procedural offsets layered on top of follow math.
 */

/**
 * Idle / charge breathing offset (meters).
 *
 * @param {number} timeMs
 * @param {number} intensity 0..1
 */
export function breathOffset(timeMs, intensity = 1) {
    return Math.sin(timeMs * CAMERA.breathFrequency) * CAMERA.breathAmplitude * intensity;
}

/**
 * Goal celebration zoom factor.
 *
 * @param {number} t 0..1
 */
export function goalZoomCurve(t) {
    return 1 + 0.08 * easeOutCubic(t);
}

/**
 * Save zoom toward keeper.
 *
 * @param {number} t 0..1
 */
export function saveZoomCurve(t) {
    return 1 + 0.05 * easeOutCubic(t);
}

/**
 * Screen-space shake sample.
 *
 * @param {number} amount 0..1
 * @param {number} timeMs
 */
export function shakeSample(amount, timeMs) {
    if (amount <= 0) {
        return { x: 0, y: 0 };
    }

    return {
        x: (Math.sin(timeMs * 0.045) * 0.08 + Math.sin(timeMs * 0.11) * 0.04) * amount,
        y: (Math.cos(timeMs * 0.052) * 0.06) * amount,
    };
}
