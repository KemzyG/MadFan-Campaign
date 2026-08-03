import { useFrame } from '@react-three/fiber';
import { memo, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useBallStore } from '../../store/ballStore';
import { MATCH_PHASE } from '../../constants';
import { useGameStore } from '../../store/gameStore';
import { useSettingsStore } from '../../store/settingsStore';
import { idleBallSpin, stepBallRotation } from '../../systems/ball/BallAnimator';
import { wearVisual } from '../../systems/physics/BallWear';

const BALL_RADIUS = 0.22;

/**
 * Classic football black pentagons sit on the 12 icosahedron vertices
 * (centers of the pentagonal panels on a truncated-icosahedron ball).
 *
 * @returns {THREE.Quaternion[]}
 */
function createPentagonOrientations() {
    const phi = (1 + Math.sqrt(5)) / 2;
    const raw = [
        [0, 1, phi],
        [0, -1, phi],
        [0, 1, -phi],
        [0, -1, -phi],
        [1, phi, 0],
        [-1, phi, 0],
        [1, -phi, 0],
        [-1, -phi, 0],
        [phi, 0, 1],
        [-phi, 0, 1],
        [phi, 0, -1],
        [-phi, 0, -1],
    ];

    const up = new THREE.Vector3(0, 1, 0);

    return raw.map(([x, y, z]) => {
        const dir = new THREE.Vector3(x, y, z).normalize();
        return new THREE.Quaternion().setFromUnitVectors(up, dir);
    });
}

/**
 * @module components/Scene/Football
 * White sphere + 12 properly oriented black pentagon caps.
 */
export const Football = memo(function Football() {
    const ref = useRef(null);
    const rotation = useRef({ x: 0, y: 0, z: 0 });
    const quality = useSettingsStore((s) => s.quality);
    const ballDetail = quality === 'high' ? 32 : quality === 'medium' ? 24 : 16;
    const shadows = quality === 'high';

    const whiteMaterial = useMemo(
        () =>
            new THREE.MeshStandardMaterial({
                color: '#f4f4ee',
                roughness: 0.34,
                metalness: 0.06,
            }),
        [],
    );

    const blackMaterial = useMemo(
        () =>
            new THREE.MeshStandardMaterial({
                color: '#101010',
                roughness: 0.58,
                metalness: 0.04,
            }),
        [],
    );

    const patchQuaternions = useMemo(() => createPentagonOrientations(), []);

    useFrame((_, dt) => {
        const ball = useBallStore.getState();
        const phase = useGameStore.getState().phase;
        if (!ref.current) {
            return;
        }
        ref.current.position.set(ball.position.x, ball.position.y, ball.position.z);

        const deform = 1 - Math.min(0.14, ball.deform ?? 0);
        ref.current.scale.set(1 / Math.sqrt(deform), deform, 1 / Math.sqrt(deform));

        if (phase === MATCH_PHASE.flying || ball.active) {
            rotation.current = stepBallRotation(rotation.current, ball.angularVelocity, dt);
        } else if (phase === MATCH_PHASE.aiming || phase === MATCH_PHASE.charging) {
            rotation.current = idleBallSpin(rotation.current, dt);
        }

        ref.current.rotation.set(rotation.current.x, rotation.current.y, rotation.current.z);

        const wear = wearVisual(ball.wear ?? 0);
        whiteMaterial.roughness = 0.34 + wear.roughnessBoost;
        whiteMaterial.color.setRGB(0.956 - wear.colorMix * 0.35, 0.956 - wear.dirtMix * 0.25, 0.933 - wear.dirtMix * 0.4);
    });

    return (
        <group ref={ref} castShadow={shadows}>
            <mesh castShadow={shadows} receiveShadow={shadows} material={whiteMaterial}>
                <sphereGeometry args={[BALL_RADIUS, ballDetail, ballDetail]} />
            </mesh>

            {patchQuaternions.map((quaternion, index) => (
                <mesh
                    key={index}
                    castShadow={shadows}
                    quaternion={quaternion}
                    material={blackMaterial}
                >
                    <sphereGeometry
                        args={[
                            BALL_RADIUS + 0.0012,
                            quality === 'low' ? 12 : 20,
                            quality === 'low' ? 8 : 12,
                            0,
                            Math.PI * 2,
                            0,
                            0.36,
                        ]}
                    />
                </mesh>
            ))}
        </group>
    );
});
