import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { MATCH_PHASE } from '../constants';
import { updateCameraController } from '../systems/camera/CameraController';
import { GOAL } from '../constants/physics';
import { useBallStore } from '../store/ballStore';
import { useCameraStore } from '../store/cameraStore';
import { useGameStore } from '../store/gameStore';
import { useReplayStore } from '../store/replayStore';

/**
 * @module hooks/useCameraController
 * Applies CameraController output to the R3F camera each frame.
 */

export function useCameraController() {
    const { camera } = useThree();
    const scratch = useRef({
        position: { x: 0, y: 2.2, z: 15.2 },
        lookAt: { x: 0, y: 1.2, z: 7 },
    });
    const lookTarget = useRef(new THREE.Vector3());
    const resultStarted = useRef(0);

    useEffect(() => {
        camera.near = 0.1;
        camera.far = 120;
        camera.updateProjectionMatrix();
    }, [camera]);

    useFrame((_, dt) => {
        const game = useGameStore.getState();
        const cam = useCameraStore.getState();
        const ball = useBallStore.getState();
        const replay = useReplayStore.getState();

        if (game.phase === MATCH_PHASE.result && resultStarted.current === 0) {
            resultStarted.current = performance.now();
        }
        if (game.phase !== MATCH_PHASE.result) {
            resultStarted.current = 0;
        }

        const resultElapsed =
            resultStarted.current > 0
                ? Math.min(1, (performance.now() - resultStarted.current) / 700)
                : 0;

        const out = updateCameraController({
            phase: game.phase,
            lastResult: game.lastResult,
            replayActive: replay.active,
            replayAngle: replay.angle,
            yaw: cam.yaw,
            pitch: cam.pitch,
            shake: cam.shake,
            power: game.power,
            charging: game.charging,
            ball: ball.position,
            velocity: ball.velocity,
            keeper: { x: 0, y: 0, z: GOAL.z },
            timeMs: performance.now(),
            dt: Math.min(dt, 0.033),
            resultElapsed,
            current: scratch.current,
        });

        scratch.current = { position: out.position, lookAt: out.lookAt };
        camera.position.set(out.position.x, out.position.y, out.position.z);
        lookTarget.current.set(out.lookAt.x, out.lookAt.y, out.lookAt.z);
        camera.lookAt(lookTarget.current);

        if (cam.mode !== out.mode) {
            useCameraStore.getState().setMode(out.mode);
        }
        useCameraStore.getState().tickShake(dt);
    });
}
