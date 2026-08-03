import { AIM, BALL, GOAL, PHYSICS, SHOT } from '../../constants/physics';
import { length } from '../../math';
import { integrateBall } from './BallPhysics';

/**
 * @module systems/ball/BallTrajectory
 *
 * Perfect travel distance: initial velocity is solved so the simulated ball
 * (gravity + drag + magnus) arrives at the aim point on the goal plane.
 *
 * Power only changes flight time (soft loft vs hard strike) — not aim accuracy.
 */

/**
 * @param {{ x: number, y: number }} aim
 */
export function resolveAimTarget(aim) {
    return {
        x: Math.max(-AIM.maxX, Math.min(AIM.maxX, aim.x)),
        y: Math.max(AIM.minY, Math.min(AIM.maxY, aim.y)),
        z: GOAL.z + 0.15,
    };
}

/**
 * @param {number} power
 */
export function flightTimeForPower(power) {
    const p = Math.min(SHOT.powerMax, Math.max(SHOT.powerMin, power));

    return SHOT.maxFlightTime - (SHOT.maxFlightTime - SHOT.minFlightTime) * p;
}

/**
 * Closed-form vacuum ballistic velocity to hit target in time T.
 *
 * @param {{ x: number, y: number, z: number }} start
 * @param {{ x: number, y: number, z: number }} target
 * @param {number} T
 */
export function vacuumBallisticVelocity(start, target, T) {
    const t = Math.max(0.2, T);

    return {
        x: (target.x - start.x) / t,
        y: (target.y - start.y - 0.5 * PHYSICS.gravity * t * t) / t,
        z: (target.z - start.z) / t,
    };
}

/**
 * Simulate until the ball crosses the goal plane; returns interpolated hit.
 *
 * @param {{ x: number, y: number, z: number }} start
 * @param {{ x: number, y: number, z: number }} velocity
 * @param {{ x: number, y: number, z: number }} spin
 * @param {number} planeZ
 */
export function simulateGoalPlaneHit(start, velocity, spin, planeZ = GOAL.z + 0.15) {
    let state = {
        position: { ...start },
        velocity: { ...velocity },
        spin: { ...spin },
        angularVelocity: { ...spin },
        grounded: false,
        inNet: false,
        active: true,
    };

    const dt = 1 / 120;
    const maxTime = 3.5;
    let t = 0;
    let prev = { ...state.position };

    while (t < maxTime) {
        const next = integrateBall(state, dt);
        t += dt;

        if (prev.z > planeZ && next.position.z <= planeZ) {
            const span = prev.z - next.position.z;
            const a = span > 1e-6 ? (prev.z - planeZ) / span : 1;

            return {
                x: prev.x + (next.position.x - prev.x) * a,
                y: prev.y + (next.position.y - prev.y) * a,
                z: planeZ,
                t: t - dt + dt * a,
                grounded: next.grounded,
            };
        }

        prev = { ...next.position };
        state = next;

        if (next.position.z < planeZ - 3 || next.position.y > 14 || Math.abs(next.position.x) > 16) {
            break;
        }
    }

    return {
        x: state.position.x,
        y: state.position.y,
        z: state.position.z,
        t,
        grounded: state.grounded,
    };
}

/**
 * Solve launch velocity so simulated path hits the aim target on the goal plane.
 *
 * @param {{ x: number, y: number }} aim
 * @param {number} power
 * @param {{ x: number, y: number, z: number }} [spin]
 * @returns {{ x: number, y: number, z: number }}
 */
export function createShotVelocity(aim, power, spin = { x: 0, y: 0, z: 0 }) {
    const start = { ...BALL.start };
    const target = resolveAimTarget(aim);
    const T = flightTimeForPower(power);

    let velocity = vacuumBallisticVelocity(start, target, T);

    // Iteratively cancel drag / magnus miss so travel distance matches aim exactly
    for (let i = 0; i < 6; i += 1) {
        const hit = simulateGoalPlaneHit(start, velocity, spin, target.z);
        const travelT = Math.max(0.18, hit.t || T);

        const errX = target.x - hit.x;
        const errY = target.y - hit.y;
        const errZ = target.z - hit.z;

        if (Math.hypot(errX, errY, errZ) < 0.02) {
            break;
        }

        velocity = {
            x: velocity.x + errX / travelT,
            y: velocity.y + errY / travelT,
            z: velocity.z + errZ / travelT,
        };

        // Keep under engine max speed
        const spd = length(velocity);
        if (spd > PHYSICS.maxSpeed) {
            const s = PHYSICS.maxSpeed / spd;
            velocity = { x: velocity.x * s, y: velocity.y * s, z: velocity.z * s };
        }
    }

    return velocity;
}

/**
 * @param {{ x: number, y: number, z: number }} position
 * @param {{ x: number, y: number, z: number }} velocity
 */
export function estimateTimeToGoalPlane(position, velocity) {
    if (velocity.z >= -0.05) {
        return 1.2;
    }
    const dz = GOAL.z - position.z;

    return Math.max(0.05, Math.min(2.5, dz / velocity.z));
}

/**
 * Vacuum prediction (AI heuristic only — real path uses simulateGoalPlaneHit).
 *
 * @param {{ x: number, y: number, z: number }} position
 * @param {{ x: number, y: number, z: number }} velocity
 * @param {number} t
 */
export function predictPosition(position, velocity, t) {
    return {
        x: position.x + velocity.x * t,
        y: Math.max(BALL.radius, position.y + velocity.y * t + 0.5 * PHYSICS.gravity * t * t),
        z: position.z + velocity.z * t,
    };
}

/**
 * @param {{ x: number, y: number, z: number }} velocity
 */
export function speedOf(velocity) {
    return length(velocity);
}
