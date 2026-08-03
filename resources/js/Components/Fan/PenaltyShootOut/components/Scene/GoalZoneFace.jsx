import { Text } from '@react-three/drei';
import { memo, useMemo } from 'react';
import { DoubleSide } from 'three';
import { GOAL } from '../../constants/physics';
import { useSettingsStore } from '../../store/settingsStore';
import {
    CENTER_POINTS,
    CORNER_POINTS,
    ZONE_COLS,
    ZONE_ROWS,
    zoneCellBounds,
    zonePointsGrid,
} from '../../systems/ball/GoalZones';

/**
 * @module components/Scene/GoalZoneFace
 * 3×3 scoring grid drawn on the front face of the goal mouth.
 */
export const GoalZoneFace = memo(function GoalZoneFace() {
    const cornerBonusEnabled = useSettingsStore((s) => s.cornerBonusEnabled);

    const cells = useMemo(() => {
        const grid = zonePointsGrid();
        const list = [];

        for (let row = 0; row < ZONE_ROWS; row += 1) {
            for (let col = 0; col < ZONE_COLS; col += 1) {
                const isCorner = grid[row][col] === CORNER_POINTS;
                const points = cornerBonusEnabled && isCorner ? CORNER_POINTS : CENTER_POINTS;
                list.push({
                    key: `${col}-${row}`,
                    points,
                    isCorner: cornerBonusEnabled && isCorner,
                    ...zoneCellBounds(col, row),
                });
            }
        }

        return list;
    }, [cornerBonusEnabled]);

    const half = GOAL.width / 2;
    const inset = 0.06;

    return (
        <group position={[0, 0, GOAL.z]}>
            <mesh position={[0, GOAL.height / 2, 0.02]}>
                <planeGeometry args={[GOAL.width - inset * 2, GOAL.height - inset * 2]} />
                <meshBasicMaterial color="#e8ff00" transparent opacity={0.04} side={DoubleSide} depthWrite={false} />
            </mesh>

            {[1, 2].map((i) => (
                <mesh key={`v-${i}`} position={[-half + (GOAL.width * i) / ZONE_COLS, GOAL.height / 2, 0.05]}>
                    <boxGeometry args={[0.03, GOAL.height - inset * 2, 0.02]} />
                    <meshBasicMaterial color="#f5f5f0" transparent opacity={0.55} depthWrite={false} />
                </mesh>
            ))}

            {[1, 2].map((i) => (
                <mesh key={`h-${i}`} position={[0, (GOAL.height * i) / ZONE_ROWS, 0.05]}>
                    <boxGeometry args={[GOAL.width - inset * 2, 0.03, 0.02]} />
                    <meshBasicMaterial color="#f5f5f0" transparent opacity={0.55} depthWrite={false} />
                </mesh>
            ))}

            {cells.map((cell) => (
                <group key={cell.key} position={[cell.x, cell.y, cell.z]}>
                    <mesh>
                        <planeGeometry args={[cell.width - 0.08, cell.height - 0.08]} />
                        <meshBasicMaterial
                            color={cell.isCorner ? '#e8ff00' : '#f5f5f0'}
                            transparent
                            opacity={cell.isCorner ? 0.12 : 0.05}
                            side={DoubleSide}
                            depthWrite={false}
                        />
                    </mesh>
                    <Text
                        position={[0, 0, 0.03]}
                        fontSize={cell.isCorner ? 0.38 : 0.28}
                        color={cell.isCorner ? '#e8ff00' : '#d8ddd8'}
                        anchorX="center"
                        anchorY="middle"
                        outlineWidth={0.012}
                        outlineColor="#050a08"
                    >
                        {`+${cell.points}`}
                    </Text>
                </group>
            ))}
        </group>
    );
});
