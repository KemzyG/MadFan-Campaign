import { BALL } from '../../constants/physics';
import { KEEPER } from '../../constants/goalkeeper';
import { length, normalize, scale } from '../../math';
import { resolveBounce } from './BounceResolver';
import { getSurface } from './SurfaceMaterials';

/**
 * @module systems/ball/GoalkeeperCollision
 * Contact-type deflections: fingertip / palm / catch / punch / body.
 */

/**
 * @param {{ x: number, y: number, z: number }} ballPos
 * @param {{ x: number, y: number, z: number }} keeperPos
 * @param {string} animState
 */
function contactProfile(ballPos, keeperPos, animState) {
    const localX = ballPos.x - keeperPos.x;
    const localY = ballPos.y - (keeperPos.y + 0.95);
    const absX = Math.abs(localX);

    if (animState.includes('high') || localY > 0.55) {
        return absX > 0.45 ? 'fingertip' : 'gloveHard';
    }

    if (animState.includes('low') || localY < -0.35) {
        return absX > 0.4 ? 'body' : 'gloveSoft';
    }

    if (absX < 0.28 && Math.abs(localY) < 0.35) {
        return 'gloveSoft';
    }

    if (absX > 0.55) {
        return 'fingertip';
    }

    return Math.random() > 0.55 ? 'gloveHard' : 'body';
}

/**
 * @param {import('./BallState').BallSnapshot} state
 * @param {{ position: { x: number, y: number, z: number }, animState: string, reacted: boolean }} keeper
 */
export function resolveGoalkeeperCollision(state, keeper) {
    if (!state.active || state.inNet || !keeper?.reacted) {
        return { state, result: null, event: null, impact: null };
    }

    const reach = KEEPER.reachRadius;
    const kx = keeper.position.x;
    const ky = keeper.position.y + 0.95;
    const kz = keeper.position.z;

    const dx = state.position.x - kx;
    const dy = state.position.y - ky;
    const dz = state.position.z - kz;
    const dist = Math.hypot(dx, dy, dz);
    const hitRadius = reach + BALL.radius;

    if (dist > hitRadius || dist < 1e-5) {
        return { state, result: null, event: null, impact: null };
    }

    const approaching = dz < 0.85 && state.velocity.z < 0;
    if (!approaching && dist > reach * 0.85) {
        return { state, result: null, event: null, impact: null };
    }

    const normal = normalize({ x: dx, y: dy, z: Math.max(0.15, dz) });
    const profile = contactProfile(state.position, { x: kx, y: ky, z: kz }, keeper.animState ?? '');
    const material = getSurface(profile);
    const bounced = resolveBounce(state.velocity, normal, material, state.spin);

    const position = {
        x: kx + normal.x * hitRadius,
        y: Math.max(BALL.radius, ky + normal.y * hitRadius * 0.65),
        z: kz + normal.z * hitRadius,
    };

    let velocity = bounced.velocity;
    let spin = bounced.spin;
    let result = null;
    let event = 'save';

    if (profile === 'gloveSoft' && length(state.velocity) < 22) {
        velocity = scale(velocity, 0.08);
        spin = scale(spin, 0.2);
        result = 'save';
        event = 'save';
    } else if (profile === 'fingertip') {
        velocity = {
            x: velocity.x + (Math.random() - 0.5) * 1.5,
            y: Math.max(velocity.y, Math.abs(bounced.impulse) * 0.25),
            z: velocity.z,
        };
        event = 'deflect';
    } else if (profile === 'gloveHard' || profile === 'body') {
        velocity = {
            x: velocity.x * 1.05,
            y: Math.max(0.5, velocity.y + bounced.impulse * 0.12),
            z: Math.max(2.5, Math.abs(velocity.z) * 0.85),
        };
        event = 'deflect';
    }

    return {
        state: {
            ...state,
            position,
            velocity,
            spin,
            deform: Math.min(0.12, bounced.impulse * 0.012),
            active: result !== 'save',
            grounded: position.y <= BALL.radius + 0.02,
        },
        result,
        event,
        impact: {
            x: position.x,
            y: position.y,
            z: position.z,
            speed: bounced.impulse,
            surface: profile,
        },
    };
}
