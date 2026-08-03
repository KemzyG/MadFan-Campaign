import { Instances, Instance, Text } from '@react-three/drei';
import { useMemo } from 'react';

export function Stadium() {
    const seats = useMemo(() => {
        const next = [];
        for (let row = 0; row < 8; row += 1) {
            for (let i = 0; i < 28; i += 1) {
                next.push({
                    key: `b-${row}-${i}`,
                    position: [-20 + i * 1.45, 2.2 + row * 0.85, -28 - row * 1.1],
                });
                next.push({
                    key: `l-${row}-${i}`,
                    position: [-24 - row * 1.1, 2.2 + row * 0.85, -20 + i * 1.35],
                });
                next.push({
                    key: `r-${row}-${i}`,
                    position: [24 + row * 1.1, 2.2 + row * 0.85, -20 + i * 1.35],
                });
            }
        }

        return next;
    }, []);

    return (
        <group>
            {/* Stands shells */}
            <mesh position={[0, 4, -34]} castShadow receiveShadow>
                <boxGeometry args={[52, 10, 6]} />
                <meshStandardMaterial color="#121812" roughness={0.85} />
            </mesh>
            <mesh position={[-28, 4, -8]} castShadow receiveShadow>
                <boxGeometry args={[6, 10, 48]} />
                <meshStandardMaterial color="#121812" roughness={0.85} />
            </mesh>
            <mesh position={[28, 4, -8]} castShadow receiveShadow>
                <boxGeometry args={[6, 10, 48]} />
                <meshStandardMaterial color="#121812" roughness={0.85} />
            </mesh>

            {/* Floodlight poles */}
            {[
                [-18, 14],
                [18, 14],
                [-18, -6],
                [18, -6],
            ].map(([x, z], idx) => (
                <group key={idx} position={[x, 0, z]}>
                    <mesh position={[0, 7, 0]}>
                        <cylinderGeometry args={[0.18, 0.25, 14, 8]} />
                        <meshStandardMaterial color="#2a2a2a" metalness={0.6} roughness={0.4} />
                    </mesh>
                    <mesh position={[0, 14.2, 0]}>
                        <boxGeometry args={[2.4, 0.4, 1.2]} />
                        <meshStandardMaterial color="#111" />
                    </mesh>
                    <pointLight position={[0, 14, 0]} intensity={2.2} distance={40} color="#fff5d6" />
                </group>
            ))}

            {/* Pitch-side MADFAN hoarding */}
            <mesh position={[0, 0.75, -22.2]} castShadow receiveShadow>
                <boxGeometry args={[32, 1.35, 0.22]} />
                <meshStandardMaterial color="#050a08" roughness={0.55} metalness={0.1} />
            </mesh>
            <mesh position={[0, 1.38, -22.05]}>
                <boxGeometry args={[32, 0.08, 0.04]} />
                <meshStandardMaterial color="#e8ff00" emissive="#e8ff00" emissiveIntensity={0.45} />
            </mesh>
            {[-10.5, -3.5, 3.5, 10.5].map((x) => (
                <Text
                    key={x}
                    position={[x, 0.78, -22.05]}
                    fontSize={0.55}
                    letterSpacing={0.14}
                    color="#e8ff00"
                    anchorX="center"
                    anchorY="middle"
                    outlineWidth={0.012}
                    outlineColor="#030805"
                >
                    MADFAN
                </Text>
            ))}

            <Instances limit={seats.length}>
                <boxGeometry args={[0.9, 0.35, 0.7]} />
                <meshStandardMaterial color="#1b2a1b" />
                {seats.map((seat, index) => (
                    <Instance
                        key={seat.key}
                        position={seat.position}
                        color={index % 3 === 0 ? '#e8ff00' : index % 3 === 1 ? '#ffc400' : '#2a3d2a'}
                    />
                ))}
            </Instances>
        </group>
    );
}
