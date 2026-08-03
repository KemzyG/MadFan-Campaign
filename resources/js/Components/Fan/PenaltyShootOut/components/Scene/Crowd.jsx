import { useFrame } from '@react-three/fiber';
import { memo, useMemo, useRef } from 'react';
import { getAnimationManager } from '../../systems/animation/AnimationManager';

/**
 * @module components/Scene/Crowd
 * Instanced crowd bob driven by AnimationManager weights.
 */
export const Crowd = memo(function Crowd() {
    const group = useRef(null);
    const positions = useMemo(() => {
        const pts = [];
        for (let i = 0; i < 40; i += 1) {
            pts.push([-18 + (i % 10) * 4, 3.2 + Math.floor(i / 10) * 1.1, -30 - Math.floor(i / 10) * 0.8]);
        }

        return pts;
    }, []);

    useFrame(({ clock }) => {
        const w = getAnimationManager().weights.crowd;
        if (!group.current) {
            return;
        }
        group.current.children.forEach((child, i) => {
            child.position.y = positions[i][1] + Math.sin(clock.elapsedTime * 3 + i) * 0.08 * w;
        });
    });

    return (
        <group ref={group}>
            {positions.map((p, i) => (
                <mesh key={i} position={p}>
                    <capsuleGeometry args={[0.18, 0.55, 4, 8]} />
                    <meshStandardMaterial color={i % 2 === 0 ? '#e8ff00' : '#ffc400'} roughness={0.7} />
                </mesh>
            ))}
        </group>
    );
});
