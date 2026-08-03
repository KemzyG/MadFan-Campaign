import { GOAL } from '../../constants/physics';

/**
 * @module systems/ball/GoalZones
 * Goal mouth scored as a 3×3 grid on the post face:
 *
 *   [+3] [+1] [+3]   top
 *   [+1] [+1] [+1]   mid
 *   [+3] [+1] [+3]   bottom
 *
 * Corners (TL / TR / BL / BR) = +3, everything else = +1.
 */

export const ZONE_COLS = 3;
export const ZONE_ROWS = 3;
export const CORNER_POINTS = 3;
export const CENTER_POINTS = 1;

/**
 * @param {{ x: number, y: number }} position ball at goal / net entry
 * @param {{ cornerBonus?: boolean }} [options]
 * @returns {{ col: number, row: number, points: number, isCorner: boolean }}
 */
export function scoreGoalZone(position, { cornerBonus = true } = {}) {
    const halfW = GOAL.width / 2;
    const x = Math.max(-halfW, Math.min(halfW, position.x));
    const y = Math.max(0, Math.min(GOAL.height, position.y));

    const col = Math.min(ZONE_COLS - 1, Math.max(0, Math.floor(((x + halfW) / GOAL.width) * ZONE_COLS)));
    const row = Math.min(ZONE_ROWS - 1, Math.max(0, Math.floor((y / GOAL.height) * ZONE_ROWS)));
    const isCorner =
        (col === 0 || col === ZONE_COLS - 1) && (row === 0 || row === ZONE_ROWS - 1);
    const points = cornerBonus && isCorner ? CORNER_POINTS : CENTER_POINTS;

    return { col, row, points, isCorner };
}

/**
 * Zone values left→right, bottom→top (row 0 = ground).
 *
 * @returns {number[][]}
 */
export function zonePointsGrid() {
    return [
        [CORNER_POINTS, CENTER_POINTS, CORNER_POINTS], // bottom
        [CENTER_POINTS, CENTER_POINTS, CENTER_POINTS], // mid
        [CORNER_POINTS, CENTER_POINTS, CORNER_POINTS], // top
    ];
}

/**
 * World-space center of a zone cell (local to goal line group at GOAL.z).
 *
 * @param {number} col
 * @param {number} row
 * @returns {{ x: number, y: number, z: number, width: number, height: number }}
 */
export function zoneCellBounds(col, row) {
    const cellW = GOAL.width / ZONE_COLS;
    const cellH = GOAL.height / ZONE_ROWS;
    const halfW = GOAL.width / 2;

    return {
        x: -halfW + cellW * (col + 0.5),
        y: cellH * (row + 0.5),
        z: 0.04,
        width: cellW,
        height: cellH,
    };
}
