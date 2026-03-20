import { Map as RotMap, FOV } from 'rot-js';
import type { FloorMap, Tile, TileType, MonsterType } from '../models/types.ts';
import { randomInt, randomChoice, percentChance } from '../utils/helpers.ts';
import { getDifficulty, getMonsterPool, getBossType, getMonsterCount } from '../data/dungeons.ts';

export function generateFloorMap(floor: number): FloorMap {
  const width = randomInt(40, 50);
  const height = randomInt(18, 22);

  // Initialize all tiles as walls
  const tiles: Tile[][] = [];
  for (let y = 0; y < height; y++) {
    tiles[y] = [];
    for (let x = 0; x < width; x++) {
      tiles[y]![x] = {
        type: 'wall',
        explored: false,
        visible: false,
        cleared: false,
      };
    }
  }

  // Use rot-js Digger to carve out rooms and corridors
  const floorTiles: [number, number][] = [];
  const digger = new RotMap.Digger(width, height, {
    roomWidth: [3, 8],
    roomHeight: [3, 6],
    corridorLength: [1, 6],
    dugPercentage: 0.35,
  });

  digger.create((x, y, value) => {
    if (value === 0 && x >= 0 && x < width && y >= 0 && y < height) {
      tiles[y]![x] = {
        type: 'floor',
        explored: false,
        visible: false,
        cleared: false,
      };
      floorTiles.push([x, y]);
    }
  });

  if (floorTiles.length < 20) {
    // Fallback: create a simple corridor map
    const midY = Math.floor(height / 2);
    for (let x = 1; x < width - 1; x++) {
      tiles[midY]![x] = { type: 'floor', explored: false, visible: false, cleared: false };
      floorTiles.push([x, midY]);
      if (percentChance(30)) {
        const dy = randomChoice([-1, 1]);
        if (midY + dy > 0 && midY + dy < height - 1) {
          tiles[midY + dy]![x] = { type: 'floor', explored: false, visible: false, cleared: false };
          floorTiles.push([x, midY + dy]);
        }
      }
    }
  }

  // Pick entrance (first floor tile)
  const entrance = floorTiles[0]!;
  const [entranceX, entranceY] = entrance;
  tiles[entranceY]![entranceX]!.type = 'entrance';
  tiles[entranceY]![entranceX]!.cleared = true;

  // Pick exit (farthest from entrance)
  let maxDist = 0;
  let exitX = entranceX;
  let exitY = entranceY;
  for (const [fx, fy] of floorTiles) {
    const dist = Math.abs(fx - entranceX) + Math.abs(fy - entranceY);
    if (dist > maxDist) {
      maxDist = dist;
      exitX = fx;
      exitY = fy;
    }
  }
  tiles[exitY]![exitX]!.type = 'exit';

  // Collect available floor tiles (excluding entrance and exit)
  const availableFloors = floorTiles.filter(
    ([x, y]) => !(x === entranceX && y === entranceY) && !(x === exitX && y === exitY)
  );

  // Shuffle available floors for random placement
  const shuffled = [...availableFloors];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = randomInt(0, i);
    [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!];
  }

  let placeIdx = 0;

  // Place combat tiles (3-6, scales with floor)
  const combatCount = Math.min(randomInt(3, 6) + Math.floor(floor / 20), shuffled.length - placeIdx - 5);
  const pool = getMonsterPool(floor);
  for (let i = 0; i < combatCount && placeIdx < shuffled.length; i++) {
    const [cx, cy] = shuffled[placeIdx]!;
    placeIdx++;
    const count = getMonsterCount(floor);
    const monsterTypes: MonsterType[] = [];
    for (let j = 0; j < count; j++) {
      monsterTypes.push(randomChoice(pool));
    }
    tiles[cy]![cx] = {
      type: 'combat',
      explored: false,
      visible: false,
      cleared: false,
      monsterTypes,
    };
  }

  // Place treasure tiles (1-2)
  const treasureCount = randomInt(1, 2);
  for (let i = 0; i < treasureCount && placeIdx < shuffled.length; i++) {
    const [tx, ty] = shuffled[placeIdx]!;
    placeIdx++;
    tiles[ty]![tx] = {
      type: 'treasure',
      explored: false,
      visible: false,
      cleared: false,
    };
  }

  // Place trap tiles (1-2)
  const diff = getDifficulty(floor);
  const trapCount = randomInt(1, 2);
  for (let i = 0; i < trapCount && placeIdx < shuffled.length; i++) {
    const [tx, ty] = shuffled[placeIdx]!;
    placeIdx++;
    tiles[ty]![tx] = {
      type: 'trap',
      explored: false,
      visible: false,
      cleared: false,
      trapDamage: randomInt(3, 8) + diff * 2,
    };
  }

  // Place curio tiles (0-1)
  const curioCount = randomInt(0, 1);
  for (let i = 0; i < curioCount && placeIdx < shuffled.length; i++) {
    const [cx, cy] = shuffled[placeIdx]!;
    placeIdx++;
    tiles[cy]![cx] = {
      type: 'curio',
      explored: false,
      visible: false,
      cleared: false,
    };
  }

  // Place boss on boss floors (every 10th) near exit
  if (floor % 10 === 0) {
    // Find a floor tile adjacent to exit
    const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];
    let bossPlaced = false;
    for (const [dx, dy] of dirs) {
      const bx = exitX + dx;
      const by = exitY + dy;
      if (bx >= 0 && bx < width && by >= 0 && by < height) {
        const tile = tiles[by]![bx]!;
        if (tile.type === 'floor') {
          const bossType = getBossType(floor);
          const minionCount = randomInt(1, 2);
          const monsterTypes: MonsterType[] = [bossType];
          for (let i = 0; i < minionCount; i++) {
            monsterTypes.push(randomChoice(pool));
          }
          tiles[by]![bx] = {
            type: 'boss',
            explored: false,
            visible: false,
            cleared: false,
            monsterTypes,
          };
          bossPlaced = true;
          break;
        }
      }
    }
    // If no adjacent floor, place on exit itself before it
    if (!bossPlaced) {
      const bossType = getBossType(floor);
      const minionCount = randomInt(1, 2);
      const monsterTypes: MonsterType[] = [bossType];
      for (let i = 0; i < minionCount; i++) {
        monsterTypes.push(randomChoice(pool));
      }
      // Replace a nearby shuffled tile
      if (placeIdx < shuffled.length) {
        const [bx, by] = shuffled[placeIdx]!;
        placeIdx++;
        tiles[by]![bx] = {
          type: 'boss',
          explored: false,
          visible: false,
          cleared: false,
          monsterTypes,
        };
      }
    }
  }

  // 입구 주변 빈 타일 방향으로 초기 각도 설정
  const dirs = [{dx:1,dy:0,a:0},{dx:0,dy:1,a:Math.PI/2},{dx:-1,dy:0,a:Math.PI},{dx:0,dy:-1,a:-Math.PI/2}];
  let initAngle = 0;
  for (const d of dirs) {
    const nx = entranceX + d.dx, ny = entranceY + d.dy;
    if (nx >= 0 && nx < width && ny >= 0 && ny < height && tiles[ny]![nx]!.type !== 'wall') {
      initAngle = d.a;
      break;
    }
  }

  const floorMap: FloorMap = {
    width,
    height,
    tiles,
    playerX: entranceX,
    playerY: entranceY,
    exitX,
    exitY,
    playerAngle: initAngle,
  };

  // Compute initial FOV
  updateFOV(floorMap, 7);

  return floorMap;
}

export function updateFOV(floorMap: FloorMap, radius: number): void {
  // Reset visibility
  for (let y = 0; y < floorMap.height; y++) {
    for (let x = 0; x < floorMap.width; x++) {
      floorMap.tiles[y]![x]!.visible = false;
    }
  }

  const fov = new FOV.RecursiveShadowcasting((x, y) => {
    if (x < 0 || x >= floorMap.width || y < 0 || y >= floorMap.height) return false;
    return floorMap.tiles[y]![x]!.type !== 'wall';
  });

  fov.compute(floorMap.playerX, floorMap.playerY, radius, (x, y, _r, _vis) => {
    if (x >= 0 && x < floorMap.width && y >= 0 && y < floorMap.height) {
      floorMap.tiles[y]![x]!.visible = true;
      floorMap.tiles[y]![x]!.explored = true;
    }
  });
}

export function getFOVRadius(): number {
  return 7;
}
