import { BALL, PHYSICS, WORLD } from '../../constants/physics';
import { length, normalize, scale, vec3 } from '../../math';
import { magnusDeltaVelocity } from '../ball/MagnusEffect';
import { dampSpin, spinToAngular } from '../ball/BallSpin';
import {
    hasFullyCrossedGoalLine,
    isInsideGoalMouth,
    stepNetPocket,
} from '../ball/NetInteraction';
import { queryContact } from './CollisionShapes';
import { resolveContact, separateContact } from './CollisionResolver';
import { resolveImpactEffects } from './ImpactEffects';
import { getMaterial, LEGACY_SURFACE_TO_MATERIAL } from './MaterialDatabase';
import { getObjectRegistry } from './ObjectRegistry';
import { registerStadiumColliders } from './stadiumColliders';

/**
 * @module systems/physics/PhysicsEngine
 * Universal ball integrator + collider loop. Object-agnostic.
 */

export class PhysicsEngine {
    /**
     * @param {import('./ObjectRegistry').ObjectRegistry} [registry]
     */
    constructor(registry = getObjectRegistry()) {
        this.registry = registry;
        registerStadiumColliders(this.registry);
    }

    /**
     * Airborne integration only — ground handled via registry colliders.
     *
     * @param {import('../ball/BallState').BallSnapshot} state
     * @param {number} dt
     * @param {{ surfaceKey?: string, wind?: { x: number, y: number, z: number } }} [env]
     */
    integrate(state, dt, env = {}) {
        if (!state.active && !state.inNet) {
            return state;
        }

        const wind = env.wind ?? PHYSICS.wind;
        const velocity = { ...state.velocity };
        const position = { ...state.position };
        let spin = { ...state.spin };
        let deform = Math.max(0, (state.deform ?? 0) - PHYSICS.deformationDecay * dt);

        const speed = length(velocity);
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

        if (position.y > BALL.radius + 1.2) {
            velocity.x += wind.x * dt;
            velocity.y += wind.y * dt;
            velocity.z += wind.z * dt;
        }

        velocity.y += PHYSICS.gravity * dt;
        spin = dampSpin(spin, Math.max(0, 1 - PHYSICS.angularDamping * dt));

        let capped = length(velocity);
        if (capped > PHYSICS.maxSpeed) {
            const s = PHYSICS.maxSpeed / capped;
            velocity.x *= s;
            velocity.y *= s;
            velocity.z *= s;
        }

        position.x += velocity.x * dt;
        position.y += velocity.y * dt;
        position.z += velocity.z * dt;

        return {
            ...state,
            position,
            velocity,
            spin,
            angularVelocity: spinToAngular(velocity, spin, BALL.radius),
            grounded: position.y <= BALL.radius + 0.02,
            deform,
        };
    }

    /**
     * @param {import('../ball/BallState').BallSnapshot} state
     * @param {number} dt
     * @param {object} [env]
     */
    integrateSubsteps(state, dt, env = {}) {
        let remaining = Math.min(dt, 0.05);
        let current = state;
        const maxStep = 1 / 120;
        while (remaining > 0) {
            const step = Math.min(remaining, maxStep);
            current = this.integrate(current, step, env);
            remaining -= step;
        }

        return current;
    }

    /**
     * Rolling + bounce decay once in contact with a ground-tagged surface.
     *
     * @param {import('../ball/BallState').BallSnapshot} state
     * @param {number} dt
     * @param {string} [surfaceKey]
     */
    applyGroundDynamics(state, dt, surfaceKey) {
        const grounded = state.position.y <= BALL.radius + 0.025;
        if (!grounded) {
            return { ...state, grounded: false };
        }

        const material = getMaterial(
            LEGACY_SURFACE_TO_MATERIAL[surfaceKey ?? PHYSICS.defaultSurface] ?? 'grass',
        );

        const position = { ...state.position };
        const velocity = { ...state.velocity };
        let spin = { ...state.spin };

        if (position.y < BALL.radius) {
            position.y = BALL.radius;
        }

        // Soft settle into roll after bounce energy dies
        if (Math.abs(velocity.y) < PHYSICS.minBounceSpeed) {
            velocity.y = 0;
            const rollSpeed = Math.hypot(velocity.x, velocity.z);
            if (rollSpeed > 1e-4) {
                const decel = material.rollingResistance * 9.81 * dt * 1.8;
                const f = Math.max(0, 1 - decel / rollSpeed);
                velocity.x *= f;
                velocity.z *= f;
                // Surface grip bleed
                velocity.x *= 0.985 + material.friction * 0.015;
                velocity.z *= 0.985 + material.friction * 0.015;
            } else {
                velocity.x = 0;
                velocity.z = 0;
            }
            spin = dampSpin(spin, 1 - material.rollingResistance * dt * 8);
        }

        return {
            ...state,
            position,
            velocity,
            spin,
            angularVelocity: spinToAngular(velocity, spin, BALL.radius),
            grounded: true,
        };
    }

    /**
     * Resolve all registered rigid contacts (material-driven).
     *
     * @param {import('../ball/BallState').BallSnapshot} state
     */
    resolveRigidCollisions(state) {
        if (!state.active || state.inNet) {
            return { state, impact: null, event: null, effects: null };
        }

        let position = { ...state.position };
        let velocity = { ...state.velocity };
        let spin = { ...state.spin };
        let deform = state.deform ?? 0;
        /** @type {object|null} */
        let impact = null;
        /** @type {string|null} */
        let event = null;
        /** @type {ReturnType<typeof resolveImpactEffects>|null} */
        let effects = null;

        const colliders = this.registry.list().filter((c) => !c.tags?.includes('trigger'));

        for (let pass = 0; pass < 3; pass += 1) {
            for (const collider of colliders) {
                const contact = queryContact(position, BALL.radius, collider);
                if (!contact) {
                    continue;
                }

                // Leaving the ground — skip plane response
                if (collider.tags?.includes('ground') && velocity.y > 0.12) {
                    continue;
                }

                let resolved = resolveContact(velocity, spin, contact);
                if (!resolved.hit) {
                    continue;
                }

                // Ground: kill tiny bounces into roll
                if (collider.tags?.includes('ground') && Math.abs(resolved.velocity.y) < PHYSICS.minBounceSpeed) {
                    resolved = {
                        ...resolved,
                        velocity: { ...resolved.velocity, y: 0 },
                    };
                }

                position = separateContact(position, contact);
                velocity = resolved.velocity;
                spin = resolved.spin;
                deform = Math.min(
                    0.15,
                    Math.max(deform, resolved.impulse * resolved.material.deformationAmount * 0.15),
                );

                if (resolved.impulse > 0.4) {
                    impact = {
                        x: contact.point.x,
                        y: contact.point.y,
                        z: contact.point.z,
                        speed: resolved.impulse,
                        surface: resolved.material.id,
                        materialId: resolved.material.id,
                    };
                    effects = resolveImpactEffects(resolved.material, resolved.impulse, collider);
                    event = effects.event;
                }
            }
        }

        return {
            state: {
                ...state,
                position,
                velocity,
                spin,
                deform,
                angularVelocity: spinToAngular(velocity, spin, BALL.radius),
                grounded: position.y <= BALL.radius + 0.02,
            },
            impact,
            event,
            effects,
        };
    }

    /**
     * Full frame step including soft net pocket / goal rules.
     *
     * @param {import('../ball/BallState').BallSnapshot} state
     * @param {number} dt
     * @param {{ pocketTime?: number, surfaceKey?: string }} [meta]
     */
    step(state, dt, meta = {}) {
        if (state.inNet) {
            const pocket = stepNetPocket(state, dt, meta.pocketTime ?? 0);

            return {
                state: pocket.state,
                result: pocket.settled ? 'goal' : null,
                event: pocket.impact ? 'netHit' : null,
                impact: pocket.impact,
                enterNet: false,
                effects: pocket.impact
                    ? resolveImpactEffects(getMaterial('goalNet'), pocket.impact.speed)
                    : null,
            };
        }

        const integrated = this.integrateSubsteps(state, dt, { surfaceKey: meta.surfaceKey });
        const rigid = this.resolveRigidCollisions(integrated);
        let next = this.applyGroundDynamics(rigid.state, dt, meta.surfaceKey);
        let event = rigid.event;
        let impact = rigid.impact;
        let effects = rigid.effects;
        let enterNet = false;
        let result = null;

        if (hasFullyCrossedGoalLine(next.position) && isInsideGoalMouth(next.position)) {
            next = { ...next, inNet: true, active: true };
            enterNet = true;
            event = 'netEnter';
        } else if (
            hasFullyCrossedGoalLine(next.position) &&
            !isInsideGoalMouth(next.position) &&
            !event
        ) {
            next = { ...next, active: false };
            result = 'miss';
            event = 'miss';
        }

        if (
            next.active &&
            (next.position.z < WORLD.backWallZ - 2 ||
                Math.abs(next.position.x) > WORLD.outOfBoundsX ||
                next.position.y > WORLD.outOfBoundsY)
        ) {
            next = { ...next, active: false };
            result = 'miss';
            event = event ?? 'miss';
        }

        const speed = length(next.velocity);
        if (
            next.active &&
            next.grounded &&
            speed < WORLD.settleSpeed &&
            next.position.z > WORLD.backWallZ + 8
        ) {
            next = { ...next, velocity: vec3(), active: false };
            result = 'miss';
            event = event ?? 'miss';
        }

        return {
            state: next,
            result,
            event,
            impact,
            enterNet,
            effects,
        };
    }
}

let sharedEngine = null;

export function getPhysicsEngine() {
    if (!sharedEngine) {
        sharedEngine = new PhysicsEngine();
    }

    return sharedEngine;
}

export function resetPhysicsEngine() {
    sharedEngine = new PhysicsEngine();

    return sharedEngine;
}
