import type { GridPosition, MonsterSize } from '../models/types.ts';

export function isValidGridPos(pos: GridPosition): boolean {
  return pos.row >= 1 && pos.row <= 3 && pos.col >= 1 && pos.col <= 3;
}

export function gridPosEqual(a: GridPosition, b: GridPosition): boolean {
  return a.row === b.row && a.col === b.col;
}

export function isGridCellOccupied(
  units: { position: GridPosition }[],
  pos: GridPosition,
): boolean {
  return units.some(u => gridPosEqual(u.position, pos));
}

export function findEmptyGridCell(
  units: { position: GridPosition }[],
  preferredCols?: number[],
): GridPosition | null {
  const cols = preferredCols || [1, 2, 3];
  // Try preferred cols first, row 2 (center) first
  for (const col of cols) {
    for (const row of [2, 1, 3]) {
      const pos = { row, col };
      if (!isGridCellOccupied(units, pos)) return pos;
    }
  }
  // Try all cells
  for (let col = 1; col <= 3; col++) {
    for (let row = 1; row <= 3; row++) {
      const pos = { row, col };
      if (!isGridCellOccupied(units, pos)) return pos;
    }
  }
  return null;
}

const COL_LABELS = ['', '전', '중', '후'];
const ROW_LABELS = ['', '상', '중', '하'];

export function gridPosLabel(pos: GridPosition): string {
  return `[${COL_LABELS[pos.col]}${ROW_LABELS[pos.row]}]`;
}

export function getOccupiedCells(pos: GridPosition, size: MonsterSize): GridPosition[] {
  const cells: GridPosition[] = [{ ...pos }];
  if (size === 'medium') {
    cells.push({ row: pos.row + 1, col: pos.col });
  } else if (size === 'large') {
    cells.push(
      { row: pos.row + 1, col: pos.col },
      { row: pos.row, col: pos.col + 1 },
      { row: pos.row + 1, col: pos.col + 1 },
    );
  }
  return cells.filter(isValidGridPos);
}

export function migrateOldPosition(pos: any): GridPosition {
  if (typeof pos === 'object' && pos !== null && 'row' in pos && 'col' in pos) {
    return pos as GridPosition;
  }
  if (typeof pos === 'number') {
    if (pos <= 0) return { row: 2, col: 1 };
    const col = pos <= 2 ? 1 : 3;
    return { row: 2, col };
  }
  return { row: 2, col: 1 };
}
