import { useMemo } from 'react';
import * as THREE from 'three';

export function Grass() {
    const material = useMemo(() => {
        const mat = new THREE.MeshStandardMaterial({
            color: '#0d3a18',
            roughness: 0.92,
            metalness: 0.02,
        });
        return mat;
    }, []);

    return (
        <group>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow material={material}>
                <planeGeometry args={[60, 80]} />
            </mesh>
            {/* Penalty box */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, -12]}>
                <planeGeometry args={[16.5, 0.08]} />
                <meshBasicMaterial color="#e8efe8" transparent opacity={0.55} />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-8.25, 0.015, -8]}>
                <planeGeometry args={[0.08, 8.1]} />
                <meshBasicMaterial color="#e8efe8" transparent opacity={0.55} />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[8.25, 0.015, -8]}>
                <planeGeometry args={[0.08, 8.1]} />
                <meshBasicMaterial color="#e8efe8" transparent opacity={0.55} />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, -4]}>
                <planeGeometry args={[16.5, 0.08]} />
                <meshBasicMaterial color="#e8efe8" transparent opacity={0.55} />
            </mesh>
            {/* Penalty spot */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 11]}>
                <circleGeometry args={[0.12, 24]} />
                <meshBasicMaterial color="#f5f5f0" />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.018, 11]}>
                <ringGeometry args={[9.05, 9.2, 64]} />
                <meshBasicMaterial color="#e8efe8" transparent opacity={0.35} />
            </mesh>
        </group>
    );
}
