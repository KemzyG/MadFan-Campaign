import { useAnimations, useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { memo, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { clone as skeletonClone } from 'three/addons/utils/SkeletonUtils.js';
import {
    KEEPER_EYE_BONES,
    KEEPER_HEAD_BONES,
    KEEPER_MODEL,
} from '../../../constants/goalkeeperAppearance';
import { useBallStore } from '../../../store/ballStore';
import { useGoalkeeperStore } from '../../../store/goalkeeperStore';
import { poseFromState } from '../../../systems/goalkeeper/GoalkeeperAnimation';
import { fadeToState } from './clipMap';
import { enhanceKeeperMaterials, fitKeeperHeight } from './enhanceMaterials';

/**
 * @module components/Scene/GoalKeeper/AssetKeeper
 * External GLB goalkeeper — SkeletonUtils clone + AnimationMixer.
 *
 * @param {{ url: string }} props
 */

function findBone(root, candidates) {
    let found = null;
    root.traverse((obj) => {
        if (found || !obj.isBone) {
            return;
        }
        if (candidates.some((n) => n === obj.name || obj.name.endsWith(n))) {
            found = obj;
        }
    });

    return found;
}

function AssetKeeperInner({ url }) {
    const root = useRef(null);
    const modelRef = useRef(null);
    const currentAction = useRef(null);
    const lastState = useRef('');
    const breath = useRef(0);
    const look = useRef({ x: 0, y: 0 });
    const fitted = useRef(false);

    // Soldier.glb is not DRACO-compressed; enabling DRACO can stall Suspense on some setups
    const { scene, animations } = useGLTF(url);

    const clone = useMemo(() => {
        const c = skeletonClone(scene);
        c.traverse((obj) => {
            if (obj.isMesh) {
                obj.castShadow = KEEPER_MODEL.castShadow;
                obj.receiveShadow = KEEPER_MODEL.receiveShadow;
                obj.frustumCulled = true;
                obj.visible = true;
            }
        });
        enhanceKeeperMaterials(c);

        return c;
    }, [scene]);

    const { actions, mixer } = useAnimations(animations, modelRef);

    const headBone = useMemo(() => findBone(clone, [...KEEPER_HEAD_BONES]), [clone]);
    const eyeBones = useMemo(
        () => [...KEEPER_EYE_BONES].map((n) => findBone(clone, [n])).filter(Boolean),
        [clone],
    );

    useLayoutEffect(() => {
        if (!modelRef.current || fitted.current) {
            return;
        }
        // Fit after mount so bounding box is valid
        fitKeeperHeight(clone, KEEPER_MODEL.heightMeters);
        fitted.current = true;
    }, [clone]);

    useEffect(() => {
        if (!actions || Object.keys(actions).length === 0) {
            return undefined;
        }
        const state = useGoalkeeperStore.getState().animState;
        currentAction.current = fadeToState(actions, state, null, 0.05);
        lastState.current = state;

        return undefined;
    }, [actions]);

    useFrame((_, dt) => {
        const keeper = useGoalkeeperStore.getState();
        const ball = useBallStore.getState().position;
        if (!root.current) {
            return;
        }

        // drei useAnimations already advances the mixer; avoid double-stepping

        if (actions && keeper.animState !== lastState.current) {
            currentAction.current = fadeToState(actions, keeper.animState, currentAction.current);
            lastState.current = keeper.animState;
        }

        const pose = poseFromState(keeper.animState, keeper.position);
        breath.current += dt;
        const idleLike = ['idle', 'ready', 'tracking', 'predicting'].includes(keeper.animState);
        const breathY = idleLike ? Math.sin(breath.current * 1.8) * 0.01 : 0;
        const shiftX = idleLike ? Math.sin(breath.current * 1.15) * 0.02 : 0;

        root.current.position.set(keeper.position.x + shiftX, keeper.position.y + breathY, keeper.position.z);
        root.current.rotation.set(0, KEEPER_MODEL.yawOffset + pose.yaw, pose.lean * 0.35);
        root.current.visible = true;

        if (headBone && idleLike) {
            const dx = ball.x - keeper.position.x;
            const dy = ball.y - (keeper.position.y + 1.65);
            look.current.y += (THREE.MathUtils.clamp(dx * 0.15, -0.55, 0.55) - look.current.y) * Math.min(1, dt * 4);
            look.current.x += (THREE.MathUtils.clamp(-dy * 0.1, -0.3, 0.25) - look.current.x) * Math.min(1, dt * 4);
            headBone.rotation.y = look.current.y;
            headBone.rotation.x = look.current.x;
            eyeBones.forEach((eye) => {
                eye.rotation.y = look.current.y * 0.35;
                eye.rotation.x = look.current.x * 0.35;
            });
        }

        void mixer;
    });

    return (
        <group ref={root}>
            <group ref={modelRef}>
                <primitive object={clone} />
            </group>
        </group>
    );
}

const AssetKeeper = memo(AssetKeeperInner);
export default AssetKeeper;

// Preload without DRACO — file is standard GLB
useGLTF.preload(KEEPER_MODEL.url);
