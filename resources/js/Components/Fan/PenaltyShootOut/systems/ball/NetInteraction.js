import { BALL, GOAL, PHYSICS } from '../../constants/physics';
import { length } from '../../math';

/**
 * @module systems/ball/NetInteraction
 * Soft pocket forces once the entire ball has crossed the goal line.
 */

const NET = Object.freeze({
    backDepth: GOAL.depth * 0.82,
    sidePadding: 0.12,
    topPadding: 0.1,
    spring: 95,
    damping: 14,
    tangentialFriction: 0.72,
    settleSpeed: 2.8,
    minPocketTime: 0.08,
    maxPocketTime: 0.45,
});

/**
 * FIFA rule: the whole ball must cross the plane (attacker at +Z).
 *
 * @param {{ x: number, y: number, z: number }} position
 */
export function hasFullyCrossedGoalLine(position) {
    return position.z + BALL.radius <= GOAL.z;
}

/**
 * True when ball center is within the scoring volume past the posts.
 *
 * @param {{ x: number, y: number, z: number }} position
 */
export function isInsideGoalMouth(position) {
    const halfW = GOAL.width / 2;
    const r = BALL.radius;

    return (
        position.z <= GOAL.z + 0.2 &&
        position.z >= GOAL.z - GOAL.depth - 0.25 &&
        Math.abs(position.x) < halfW - r * 0.2 &&
        position.y < GOAL.height - r * 0.15 &&
        position.y > -0.05
    );
}

/**
 * @param {import('./BallState').BallSnapshot} state
 * @param {number} dt
 * @param {number} pocketTime
 */
export function stepNetPocket(state, dt, pocketTime) {
    const halfW = GOAL.width / 2 - BALL.radius - NET.sidePadding;
    const top = GOAL.height - BALL.radius - NET.topPadding;
    const backZ = GOAL.z - NET.backDepth;
    const lineZ = GOAL.z - BALL.radius * 0.15;

    let { x, y, z } = state.position;
    let vx = state.velocity.x;
    let vy = state.velocity.y;
    let vz = state.velocity.z;
    let impact = null;

    const inboundSpeed = Math.max(0, -vz);

    if (x > halfW) {
        x = halfW;
        vx = Math.min(0, vx) * 0.18;
    } else if (x < -halfW) {
        x = -halfW;
        vx = Math.max(0, vx) * 0.18;
    }

    if (y > top) {
        y = top;
        vy = Math.min(0, vy) * 0.22;
    }
    if (y < BALL.radius) {
        y = BALL.radius;
        if (vy < 0) {
            vy = -vy * 0.22;
        }
    }

    if (z > lineZ) {
        z = lineZ;
        vz = Math.min(0, vz) * 0.12;
    }

    const penetration = backZ + BALL.radius - z;
    if (penetration > 0) {
        const speedIn = Math.max(0, -vz);
        // Stretch scales with inbound power — heavy shots dig deeper
        const powerFactor = 1 + Math.min(1.8, inboundSpeed / 18);
        const springF = penetration * NET.spring * powerFactor;
        const dampF = -vz * NET.damping;
        vz += (springF + dampF) * dt;
        z = backZ + BALL.radius - penetration * (0.12 + Math.min(0.25, speedIn * 0.01));

        vx *= NET.tangentialFriction;
        vy *= NET.tangentialFriction;

        if (speedIn > 0.6 || penetration > 0.06) {
            impact = {
                x,
                y,
                z: backZ,
                speed: Math.max(speedIn, length({ x: vx, y: vy, z: vz })),
                surface: 'net',
            };
        }
    }

    // Medium energy loss while tangled in the mesh
    const bagDrag = 1 - Math.min(0.9, PHYSICS.netDamping * 2.6 * dt * 60);
    vx *= bagDrag;
    vy *= bagDrag;
    vz *= bagDrag;

    vy += PHYSICS.gravity * 0.6 * dt;

    x += vx * dt;
    y += vy * dt;
    z += vz * dt;

    const speed = length({ x: vx, y: vy, z: vz });
    const softSettle = pocketTime >= NET.minPocketTime && speed < NET.settleSpeed;
    const settled = softSettle || pocketTime >= NET.maxPocketTime;

    return {
        state: {
            ...state,
            position: { x, y, z },
            velocity: { x: vx, y: vy, z: vz },
            inNet: true,
            active: !settled,
            grounded: y <= BALL.radius + 0.02,
        },
        impact,
        settled,
    };
}

export { NET };
