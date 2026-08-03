/**
 * @module systems/physics/ImpactEffects
 * Maps material (+ optional collider tags) to audio / camera / haptic hooks.
 */

/**
 * @param {import('./MaterialDatabase').PhysicsMaterial} material
 * @param {number} impulse
 * @param {import('./ObjectRegistry').ColliderDesc} [collider]
 * @returns {{
 *   event: string,
 *   soundId: string,
 *   shake: number,
 *   haptic: number,
 *   particle: string,
 * }}
 */
export function resolveImpactEffects(material, impulse, collider) {
    const force = Math.max(0, impulse);
    const tags = collider?.tags ?? [];

    let event = 'impact';
    let soundId = 'kick';

    if (tags.includes('crossbar')) {
        event = 'crossbar';
        soundId = force > 6 ? 'crossbar' : 'post';
    } else if (tags.includes('post') || tags.includes('metal')) {
        event = tags.includes('post') ? 'post' : 'impact';
        soundId = force > 10 ? 'crossbar' : 'post';
    } else {
        const soundMap = {
            metal: force > 8 ? 'crossbar' : 'post',
            grass: 'kick',
            concrete: 'post',
            board: 'post',
            net: 'net',
            wood: 'post',
            plastic: 'kick',
            fence: 'post',
            glass: 'post',
        };
        const eventMap = {
            metal: force > 10 ? 'crossbar' : 'post',
            grass: 'ground',
            concrete: 'wall',
            board: 'board',
            net: 'netHit',
            wood: 'wall',
            plastic: 'board',
            fence: 'fence',
            glass: 'wall',
        };
        const profile = material.soundProfile;
        event = eventMap[profile] ?? 'impact';
        soundId = soundMap[profile] ?? 'kick';
    }

    const shakeBase = material.hardness * 0.35 + force * 0.03;

    return {
        event,
        soundId,
        shake: Math.min(0.9, shakeBase * (0.5 + material.hardness * 0.5)),
        haptic: Math.min(40, force * (0.8 + material.hardness)),
        particle: material.particleEffect,
    };
}
