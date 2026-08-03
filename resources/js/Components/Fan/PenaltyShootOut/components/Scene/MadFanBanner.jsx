import { Text } from '@react-three/drei';
import { memo } from 'react';
import { GOAL } from '../../constants/physics';

/**
 * @module components/Scene/MadFanBanner
 * Stadium advertising hoarding behind the goal — MADFAN brand face-on to the taker.
 */
export const MadFanBanner = memo(function MadFanBanner() {
    const boardZ = GOAL.z - GOAL.depth - 2.4;
    const width = 16;
    const height = 3.4;

    return (
        <group position={[0, 0, boardZ]}>
            {/* Frame / back panel */}
            <mesh position={[0, height / 2 + 0.15, -0.08]} castShadow receiveShadow>
                <boxGeometry args={[width + 0.35, height + 0.35, 0.18]} />
                <meshStandardMaterial color="#1a1a16" roughness={0.8} metalness={0.15} />
            </mesh>

            {/* Main advertising face */}
            <mesh position={[0, height / 2 + 0.15, 0.02]} castShadow receiveShadow>
                <boxGeometry args={[width, height, 0.12]} />
                <meshStandardMaterial
                    color="#071008"
                    roughness={0.55}
                    metalness={0.08}
                    emissive="#152018"
                    emissiveIntensity={0.25}
                />
            </mesh>

            {/* Flame accent bars */}
            <mesh position={[0, height + 0.08, 0.1]}>
                <boxGeometry args={[width, 0.14, 0.04]} />
                <meshStandardMaterial color="#e8ff00" emissive="#e8ff00" emissiveIntensity={0.55} />
            </mesh>
            <mesh position={[0, 0.22, 0.1]}>
                <boxGeometry args={[width, 0.14, 0.04]} />
                <meshStandardMaterial color="#ffc400" emissive="#ffc400" emissiveIntensity={0.35} />
            </mesh>

            {/* Brand wordmark — faces the penalty spot (+Z) */}
            <Text
                position={[0, height / 2 + 0.28, 0.12]}
                fontSize={1.55}
                letterSpacing={0.22}
                color="#e8ff00"
                anchorX="center"
                anchorY="middle"
                outlineWidth={0.028}
                outlineColor="#030805"
                fillOpacity={1}
            >
                MADFAN
            </Text>

            <Text
                position={[0, height / 2 - 0.85, 0.12]}
                fontSize={0.28}
                letterSpacing={0.35}
                color="#f5f5f0"
                anchorX="center"
                anchorY="middle"
                fillOpacity={0.72}
            >
                FOR THE FANS
            </Text>

            {/* Side wing boards */}
            {[
                { x: -width / 2 - 3.2, rotY: 0.35 },
                { x: width / 2 + 3.2, rotY: -0.35 },
            ].map((side) => (
                <group key={side.x} position={[side.x, 0, 0.4]} rotation={[0, side.rotY, 0]}>
                    <mesh position={[0, 1.35, 0]} castShadow receiveShadow>
                        <boxGeometry args={[5.2, 2.4, 0.12]} />
                        <meshStandardMaterial color="#0a120a" roughness={0.6} emissive="#101808" emissiveIntensity={0.2} />
                    </mesh>
                    <Text
                        position={[0, 1.4, 0.09]}
                        fontSize={0.72}
                        letterSpacing={0.16}
                        color="#e8ff00"
                        anchorX="center"
                        anchorY="middle"
                        outlineWidth={0.015}
                        outlineColor="#030805"
                    >
                        MADFAN
                    </Text>
                </group>
            ))}
        </group>
    );
});
