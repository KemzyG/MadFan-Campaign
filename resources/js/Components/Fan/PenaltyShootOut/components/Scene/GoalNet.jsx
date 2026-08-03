import { useFrame } from '@react-three/fiber';
import { memo, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { GOAL } from '../../constants/physics';
import { useNetStore } from '../../store/netStore';
import { useBallStore } from '../../store/ballStore';

/**
 * @module components/Scene/GoalNet
 * Multi-panel deformable net. Vertices spring toward rest; impacts bulge the bag.
 */

function createPanel(width, height, wSeg, hSeg, { x, y, z, rotY = 0, rotX = 0 }) {
    const geo = new THREE.PlaneGeometry(width, height, wSeg, hSeg);
    if (rotY) {
        geo.rotateY(rotY);
    }
    if (rotX) {
        geo.rotateX(rotX);
    }
    geo.translate(x, y, z);

    return geo;
}

function NetPanel({ geometry, restPositions, softNormals = false }) {
    const meshRef = useRef(null);
    const velocities = useRef(new Float32Array(restPositions.length));
    const frameSkip = useRef(0);

    useFrame((_, dt) => {
        const posAttr = meshRef.current?.geometry?.attributes?.position;
        if (!posAttr) {
            return;
        }

        const ball = useBallStore.getState().position;
        const net = useNetStore.getState();
        const quiet = net.ripple < 0.05 && !ball.inNet;

        // When idle, update every other frame — nets don't need 60fps spring solves on phones.
        if (quiet) {
            frameSkip.current = (frameSkip.current + 1) % 2;
            if (frameSkip.current !== 0) {
                return;
            }
        }

        const clampedDt = Math.min(dt, 0.033);
        const arr = posAttr.array;

        for (let i = 0; i < posAttr.count; i += 1) {
            const ix = i * 3;
            const ox = restPositions[ix];
            const oy = restPositions[ix + 1];
            const oz = restPositions[ix + 2];

            const wx = ox;
            const wy = oy;
            const wz = GOAL.z + oz;

            const toImpact = Math.hypot(wx - net.impact.x, wy - net.impact.y, wz - net.impact.z);
            const toBall = Math.hypot(wx - ball.x, wy - ball.y, wz - ball.z);

            const impactFalloff = Math.max(0, 1 - toImpact / 2.4);
            const ballFalloff = Math.max(0, 1 - toBall / 1.1);
            const wave =
                Math.sin(net.age * 22 + ox * 4.2 + oy * 3.1) *
                Math.cos(net.age * 13 + oy * 2.4) *
                net.ripple *
                impactFalloff;

            const bulge =
                impactFalloff * net.ripple * (0.55 + net.impulse * 0.45) +
                ballFalloff * (ball.inNet ? 0.35 : 0.08);

            const targetX = ox + (net.impact.x - ox) * bulge * 0.04;
            const targetY = oy + (net.impact.y - oy) * bulge * 0.03;
            const targetZ = oz - bulge * 0.85 - wave * 0.18;

            const curX = arr[ix];
            const curY = arr[ix + 1];
            const curZ = arr[ix + 2];
            const vx = velocities.current[ix] ?? 0;
            const vy = velocities.current[ix + 1] ?? 0;
            const vz = velocities.current[ix + 2] ?? 0;

            const ax = (targetX - curX) * 70 - vx * 9;
            const ay = (targetY - curY) * 70 - vy * 9;
            const az = (targetZ - curZ) * 70 - vz * 9;

            velocities.current[ix] = vx + ax * clampedDt;
            velocities.current[ix + 1] = vy + ay * clampedDt;
            velocities.current[ix + 2] = vz + az * clampedDt;

            arr[ix] = curX + velocities.current[ix] * clampedDt;
            arr[ix + 1] = curY + velocities.current[ix + 1] * clampedDt;
            arr[ix + 2] = curZ + velocities.current[ix + 2] * clampedDt;

            if (quiet) {
                arr[ix] += (ox - arr[ix]) * Math.min(1, clampedDt * 8);
                arr[ix + 1] += (oy - arr[ix + 1]) * Math.min(1, clampedDt * 8);
                arr[ix + 2] += (oz - arr[ix + 2]) * Math.min(1, clampedDt * 8);
            }
        }

        posAttr.needsUpdate = true;
        // Vertex normals every frame is extremely expensive; wireframe nets barely benefit.
        if (!softNormals && !quiet) {
            meshRef.current.geometry.computeVertexNormals();
        }
    });

    return (
        <mesh ref={meshRef} geometry={geometry} castShadow={false}>
            <meshStandardMaterial
                color="#d8ddd8"
                wireframe
                transparent
                opacity={0.55}
                side={THREE.DoubleSide}
                depthWrite={false}
            />
        </mesh>
    );
}

function useRestData(geometry) {
    return useMemo(() => {
        const geo = geometry;
        const rest = geo.attributes.position.array.slice();

        return { geo, rest };
    }, [geometry]);
}

const NET_SEGS = {
    low: { back: [22, 14], side: [5, 6], top: [8, 4] },
    medium: { back: [30, 18], side: [7, 8], top: [12, 5] },
    high: { back: [36, 22], side: [10, 12], top: [18, 8] },
};

export const GoalNet = memo(function GoalNet({ quality = 'medium' }) {
    const soft = quality !== 'high';
    const segs = NET_SEGS[quality] ?? NET_SEGS.medium;

    const backGeo = useMemo(
        () =>
            createPanel(GOAL.width - 0.12, GOAL.height - 0.08, segs.back[0], segs.back[1], {
                x: 0,
                y: GOAL.height / 2 - 0.04,
                z: -GOAL.depth * 0.82,
            }),
        [quality],
    );
    const leftGeo = useMemo(
        () =>
            createPanel(GOAL.depth * 0.85, GOAL.height - 0.08, segs.side[0], segs.side[1], {
                x: -(GOAL.width / 2 - 0.05),
                y: GOAL.height / 2 - 0.04,
                z: -GOAL.depth * 0.42,
                rotY: Math.PI / 2,
            }),
        [quality],
    );
    const rightGeo = useMemo(
        () =>
            createPanel(GOAL.depth * 0.85, GOAL.height - 0.08, segs.side[0], segs.side[1], {
                x: GOAL.width / 2 - 0.05,
                y: GOAL.height / 2 - 0.04,
                z: -GOAL.depth * 0.42,
                rotY: -Math.PI / 2,
            }),
        [quality],
    );
    const topGeo = useMemo(
        () =>
            createPanel(GOAL.width - 0.12, GOAL.depth * 0.85, segs.top[0], segs.top[1], {
                x: 0,
                y: GOAL.height - 0.05,
                z: -GOAL.depth * 0.42,
                rotX: Math.PI / 2,
            }),
        [quality],
    );

    const back = useRestData(backGeo);
    const left = useRestData(leftGeo);
    const right = useRestData(rightGeo);
    const top = useRestData(topGeo);

    return (
        <group position={[0, 0, GOAL.z]}>
            <NetPanel geometry={back.geo} restPositions={back.rest} softNormals={soft} />
            <NetPanel geometry={left.geo} restPositions={left.rest} softNormals={soft} />
            <NetPanel geometry={right.geo} restPositions={right.rest} softNormals={soft} />
            <NetPanel geometry={top.geo} restPositions={top.rest} softNormals={soft} />
        </group>
    );
});
