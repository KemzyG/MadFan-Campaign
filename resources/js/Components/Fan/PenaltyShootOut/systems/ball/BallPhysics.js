import { BALL, PHYSICS } from '../../constants/physics';
import { add, length, normalize, scale } from '../../math';
import { magnusDeltaVelocity } from './MagnusEffect';
import { getSurface } from './SurfaceMaterials';
import { dampSpin, spinToAngular } from './BallSpin';

/**
 * @module systems/ball/BallPhysics
 * Continuous integration: gravity, quadratic drag, Magnus, bounce, rolling.
 */

/**
 * @param {import('./BallState').BallSnapshot} state
 * @param {number} dt
 * @param {{ surfaceKey?: string, wind?: { x: number, y: number, z: number } }} [env]
 * @returns {import('./BallState').BallSnapshot}
 */
export function integrateBall(state, dt, env = {}) {
    if (!state.active && !state.inNet) {
        return state;
    }

    const surface = getSurface(env.surfaceKey ?? PHYSICS.defaultSurface);
    const wind = env.wind ?? PHYSICS.wind;

    const velocity = { ...state.velocity };
    const position = { ...state.position };
    let spin = { ...state.spin };
    let deform = Math.max(0, (state.deform ?? 0) - PHYSICS.deformationDecay * dt);

    const speed = length(velocity);

    // Quadratic + light linear air resistance — ball never holds constant speed
    if (speed > 1e-4) {
        const dir = normalize(velocity);
        const dragMag = PHYSICS.quadraticDrag * speed * speed + PHYSICS.linearDrag * speed;
        const drag = scale(dir, -dragMag * dt);
        velocity.x += drag.x;
        velocity.y += drag.y;
        velocity.z += drag.z;
    }

    const magnus = magnusDeltaVelocity(spin, velocity, dt);
    velocity.x += magnus.x;
    velocity.y += magnus.y;
    velocity.z += magnus.z;

    // Wind only bites on lofted balls
    if (position.y > BALL.radius + 1.2) {
        velocity.x += wind.x * dt;
        velocity.y += wind.y * dt;
        velocity.z += wind.z * dt;
    }

    velocity.y += PHYSICS.gravity * dt;

    // Angular damping through the air
    spin = dampSpin(spin, Math.max(0, 1 - PHYSICS.angularDamping * dt));

    let capped = length(velocity);
    if (capped > PHYSICS.maxSpeed) {
        const s = PHYSICS.maxSpeed / capped;
        velocity.x *= s;
        velocity.y *= s;
        velocity.z *= s;
        capped = PHYSICS.maxSpeed;
    }

    position.x += velocity.x * dt;
    position.y += velocity.y * dt;
    position.z += velocity.z * dt;

    let grounded = false;
    if (position.y < BALL.radius) {
        const impactY = -velocity.y;
        position.y = BALL.radius;
        grounded = true;

        if (velocity.y < 0) {
            // Bounce with surface restitution, then decay into roll
            velocity.y = -velocity.y * surface.restitution;
            if (Math.abs(velocity.y) < PHYSICS.minBounceSpeed) {
                velocity.y = 0;
            }

            // Horizontal grip + spin bleed on grass
            velocity.x *= surface.friction;
            velocity.z *= surface.friction;
            spin = dampSpin(spin, surface.rolling);

            if (impactY > 6) {
                deform = Math.min(0.12, impactY * 0.008);
            }
        }

        if (velocity.y === 0 || Math.abs(velocity.y) < PHYSICS.minBounceSpeed * 0.5) {
            velocity.y = 0;
            // Rolling resistance (always decaying — never instant stop)
            const rollSpeed = Math.hypot(velocity.x, velocity.z);
            if (rollSpeed > 1e-4) {
                const decel = (1 - surface.rolling) * 9.81 * dt * 1.8;
                const scaleFactor = Math.max(0, 1 - decel / rollSpeed);
                velocity.x *= scaleFactor;
                velocity.z *= scaleFactor;

                // Tiny pitch wobble
                const wobble = PHYSICS.rollWobble * Math.sin(position.x * 7 + position.z * 5);
                velocity.x += wobble * dt * spin.y;
            } else {
                velocity.x = 0;
                velocity.z = 0;
            }
            spin = dampSpin(spin, Math.pow(surface.rolling, dt * 60));
        }
    }

    const angularVelocity = spinToAngular(velocity, spin, BALL.radius);

    return {
        ...state,
        position,
        velocity,
        spin,
        angularVelocity,
        grounded,
        deform,
    };
}

/**
 * Fixed sub-steps for stable simulation across 30–144 FPS.
 *
 * @param {import('./BallState').BallSnapshot} state
 * @param {number} dt
 * @param {number} [maxStep=1/120]
 * @param {object} [env]
 */
export function integrateBallSubsteps(state, dt, maxStep = 1 / 120, env = {}) {
    let remaining = Math.min(dt, 0.05);
    let current = state;
    while (remaining > 0) {
        const step = Math.min(remaining, maxStep);
        current = integrateBall(current, step, env);
        remaining -= step;
    }

    return current;
}

export { scale, add };
