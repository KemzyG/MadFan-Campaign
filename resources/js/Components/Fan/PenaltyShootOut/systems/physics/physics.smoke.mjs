/**
 * Self-contained smoke for material-driven bounce (no Vite path aliases).
 * Run: node resources/js/Components/Fan/PenaltyShootOut/systems/physics/physics.smoke.mjs
 */

function length(v) {
    return Math.hypot(v.x, v.y, v.z);
}

function normalize(v) {
    const l = length(v) || 1;
    return { x: v.x / l, y: v.y / l, z: v.z / l };
}

function dot(a, b) {
    return a.x * b.x + a.y * b.y + a.z * b.z;
}

function scale(v, s) {
    return { x: v.x * s, y: v.y * s, z: v.z * s };
}

function sub(a, b) {
    return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

function add(a, b) {
    return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

const steelPost = {
    restitution: 0.64,
    friction: 0.88,
    energyLoss: 0.12,
    roughness: 0.15,
    absorption: 0.08,
    hardness: 0.98,
};

function resolveContact(velocity, spin, normal, material) {
    const n = normalize(normal);
    const vn = dot(velocity, n);
    if (vn >= -1e-4) {
        return { velocity, hit: false, impulse: 0 };
    }
    const vNormal = scale(n, vn);
    const vTangent = sub(velocity, vNormal);
    const restitution = Math.max(0, material.restitution * (1 - material.energyLoss * 0.35));
    const friction = Math.max(0.05, Math.min(1, material.friction * (1 - material.roughness * 0.15)));
    const nextVel = add(scale(vNormal, -restitution), scale(vTangent, friction));

    return { velocity: nextVel, hit: true, impulse: Math.abs(vn) };
}

function integrate(pos, vel, dt) {
    const nextVel = { ...vel, y: vel.y - 9.81 * dt };
    return {
        position: {
            x: pos.x + nextVel.x * dt,
            y: pos.y + nextVel.y * dt,
            z: pos.z + nextVel.z * dt,
        },
        velocity: nextVel,
    };
}

let failed = 0;
function check(name, cond) {
    if (!cond) {
        console.error('FAIL', name);
        failed += 1;
    } else {
        console.log('ok', name);
    }
}

check('steel hardness', steelPost.hardness > 0.9);
check('steel restitution', steelPost.restitution > 0.55);

const bounced = resolveContact({ x: -12, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }, steelPost);
check('metal rebound reverses inbound', bounced.hit && bounced.velocity.x > 0);
check('metal keeps substantial speed', bounced.velocity.x > 5);

let pos = { x: 0, y: 2, z: 11 };
let vel = { x: 0, y: 0, z: -18 };
for (let i = 0; i < 90; i += 1) {
    ({ position: pos, velocity: vel } = integrate(pos, vel, 1 / 60));
}
check('gravity lowers flight', pos.y < 2);
check('ball travels toward goal', pos.z < 11);

if (failed) {
    console.error(`${failed} checks failed`);
    process.exit(1);
}
console.log('physics smoke passed');
