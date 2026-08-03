import { GOAL } from '../../constants/physics';

export function GoalPost() {
    const half = GOAL.width / 2;
    const h = GOAL.height;

    return (
        <group position={[0, 0, GOAL.z]}>
            <mesh position={[-half, h / 2, 0]} castShadow>
                <cylinderGeometry args={[0.07, 0.07, h, 16]} />
                <meshStandardMaterial color="#f5f5f0" metalness={0.35} roughness={0.25} />
            </mesh>
            <mesh position={[half, h / 2, 0]} castShadow>
                <cylinderGeometry args={[0.07, 0.07, h, 16]} />
                <meshStandardMaterial color="#f5f5f0" metalness={0.35} roughness={0.25} />
            </mesh>
            <mesh position={[0, h, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
                <cylinderGeometry args={[0.07, 0.07, GOAL.width + 0.14, 16]} />
                <meshStandardMaterial color="#f5f5f0" metalness={0.35} roughness={0.25} />
            </mesh>
            {/* Back supports */}
            <mesh position={[-half, h / 2, -GOAL.depth]} castShadow>
                <cylinderGeometry args={[0.05, 0.05, h, 12]} />
                <meshStandardMaterial color="#d8d8d0" metalness={0.3} roughness={0.35} />
            </mesh>
            <mesh position={[half, h / 2, -GOAL.depth]} castShadow>
                <cylinderGeometry args={[0.05, 0.05, h, 12]} />
                <meshStandardMaterial color="#d8d8d0" metalness={0.3} roughness={0.35} />
            </mesh>
        </group>
    );
}
