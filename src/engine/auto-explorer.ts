import { Path } from 'rot-js';
import type { FloorMap, Tile, TileType } from '../models/types.ts';

export interface ExplorationTarget {
  x: number;
  y: number;
  type: 'event' | 'unexplored' | 'exit';
}

/**
 * Find the next exploration target based on priority:
 * 1. Visible uncleared event tiles (combat/treasure/trap/curio/boss)
 * 2. Nearest unexplored floor tile
 * 3. Exit (stairs)
 */
export function findNextTarget(floorMap: FloorMap): ExplorationTarget | null {
  const { tiles, playerX, playerY, exitX, exitY, width, height } = floorMap;

  // Priority 1: Visible uncleared event tiles
  const eventTypes: TileType[] = ['combat', 'treasure', 'trap', 'curio', 'boss'];
  let closestEvent: ExplorationTarget | null = null;
  let closestEventDist = Infinity;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const tile = tiles[y]![x]!;
      if (tile.visible && !tile.cleared && eventTypes.includes(tile.type)) {
        const dist = Math.abs(x - playerX) + Math.abs(y - playerY);
        if (dist > 0 && dist < closestEventDist) {
          closestEventDist = dist;
          closestEvent = { x, y, type: 'event' };
        }
      }
    }
  }

  if (closestEvent) return closestEvent;

  // Priority 2: Nearest unexplored reachable floor tile
  // Look for explored tiles adjacent to unexplored areas
  let closestUnexplored: ExplorationTarget | null = null;
  let closestUnexploredDist = Infinity;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const tile = tiles[y]![x]!;
      if (!tile.explored && tile.type !== 'wall') {
        const dist = Math.abs(x - playerX) + Math.abs(y - playerY);
        if (dist > 0 && dist < closestUnexploredDist) {
          closestUnexploredDist = dist;
          closestUnexplored = { x, y, type: 'unexplored' };
        }
      }
    }
  }

  // If no unexplored non-wall tiles, look for floor tiles bordering unexplored walls
  if (!closestUnexplored) {
    const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const tile = tiles[y]![x]!;
        if (tile.explored && tile.type !== 'wall') {
          // Check if any adjacent tile is unexplored
          for (const [dx, dy] of dirs) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              if (!tiles[ny]![nx]!.explored) {
                const dist = Math.abs(x - playerX) + Math.abs(y - playerY);
                if (dist > 0 && dist < closestUnexploredDist) {
                  closestUnexploredDist = dist;
                  closestUnexplored = { x, y, type: 'unexplored' };
                }
              }
            }
          }
        }
      }
    }
  }

  if (closestUnexplored) return closestUnexplored;

  // Priority 3: Go to exit
  if (playerX !== exitX || playerY !== exitY) {
    return { x: exitX, y: exitY, type: 'exit' };
  }

  return null;
}

/**
 * Compute AStar path from player to target
 * Returns array of [x, y] steps (excluding current position)
 */
export function computePath(floorMap: FloorMap, targetX: number, targetY: number): [number, number][] {
  const { tiles, playerX, playerY, width, height } = floorMap;

  const passableCallback = (x: number, y: number): boolean => {
    if (x < 0 || x >= width || y < 0 || y >= height) return false;
    const tile = tiles[y]![x]!;
    return tile.type !== 'wall';
  };

  const astar = new Path.AStar(targetX, targetY, passableCallback, { topology: 4 });
  const path: [number, number][] = [];

  astar.compute(playerX, playerY, (x, y) => {
    path.push([x, y]);
  });

  // Remove current position (first element)
  if (path.length > 0) {
    path.shift();
  }

  return path;
}
