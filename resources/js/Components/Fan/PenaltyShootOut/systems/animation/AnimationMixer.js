import { lerp } from '../../math';

/**
 * @module systems/animation/AnimationMixer
 * Lightweight weight blender for procedural layers (not THREE.AnimationMixer).
 */

/**
 * @param {Array<{ weight: number, value: number }>} layers
 */
export function blendScalar(layers) {
    let sumW = 0;
    let sum = 0;
    for (const layer of layers) {
        sumW += layer.weight;
        sum += layer.value * layer.weight;
    }
    if (sumW <= 0) {
        return 0;
    }

    return sum / sumW;
}

/**
 * @param {number} current
 * @param {number} target
 * @param {number} t
 */
export function blendToward(current, target, t) {
    return lerp(current, target, Math.min(1, Math.max(0, t)));
}
