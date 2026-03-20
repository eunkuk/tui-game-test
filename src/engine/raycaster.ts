import type { Tile, TileType } from '../models/types.ts';

export interface RayHit {
  dist: number;       // 어안 보정된 수직 거리
  tileType: TileType; // 맞은 타일 종류
  side: 0 | 1;        // 0=수직면(NS), 1=수평면(EW)
  tileX: number;
  tileY: number;
}

export interface SpecialMarker {
  column: number;
  tileType: TileType;
  dist: number;
  tileX: number;
  tileY: number;
}

export function castRays(
  tiles: Tile[][], width: number, height: number,
  px: number, py: number, angle: number,
  columns: number, fov: number = Math.PI / 2, maxDist: number = 16,
): RayHit[] {
  const hits: RayHit[] = [];
  const originX = px + 0.5;
  const originY = py + 0.5;

  for (let i = 0; i < columns; i++) {
    const rayAngle = angle - fov / 2 + (i / columns) * fov;
    const hit = castSingleRay(tiles, width, height, originX, originY, rayAngle, maxDist);

    // 어안 보정
    hit.dist *= Math.cos(rayAngle - angle);
    if (hit.dist < 0.1) hit.dist = 0.1;

    hits.push(hit);
  }

  return hits;
}

// 특수 타일(exit, combat 등) 검출 — 레이를 wall 전까지 스캔
export function findSpecialTiles(
  tiles: Tile[][], width: number, height: number,
  px: number, py: number, angle: number,
  columns: number, fov: number = Math.PI / 2, maxDist: number = 16,
): SpecialMarker[] {
  const markers: SpecialMarker[] = [];
  const originX = px + 0.5;
  const originY = py + 0.5;

  for (let i = 0; i < columns; i++) {
    const rayAngle = angle - fov / 2 + (i / columns) * fov;
    const specials = scanSpecialTiles(tiles, width, height, originX, originY, rayAngle, maxDist, angle);
    for (const s of specials) {
      markers.push({ column: i, tileType: s.tileType, dist: s.dist, tileX: s.tileX, tileY: s.tileY });
    }
  }

  return markers;
}

function castSingleRay(
  tiles: Tile[][], width: number, height: number,
  ox: number, oy: number, angle: number, maxDist: number,
): RayHit {
  const dirX = Math.cos(angle);
  const dirY = Math.sin(angle);

  let mapX = Math.floor(ox);
  let mapY = Math.floor(oy);

  const deltaDistX = Math.abs(dirX) < 1e-10 ? 1e10 : Math.abs(1 / dirX);
  const deltaDistY = Math.abs(dirY) < 1e-10 ? 1e10 : Math.abs(1 / dirY);

  let stepX: number, stepY: number;
  let sideDistX: number, sideDistY: number;

  if (dirX < 0) {
    stepX = -1;
    sideDistX = (ox - mapX) * deltaDistX;
  } else {
    stepX = 1;
    sideDistX = (mapX + 1 - ox) * deltaDistX;
  }

  if (dirY < 0) {
    stepY = -1;
    sideDistY = (oy - mapY) * deltaDistY;
  } else {
    stepY = 1;
    sideDistY = (mapY + 1 - oy) * deltaDistY;
  }

  let side: 0 | 1 = 0;
  let dist = 0;

  // DDA loop
  for (let step = 0; step < 64; step++) {
    if (sideDistX < sideDistY) {
      sideDistX += deltaDistX;
      mapX += stepX;
      side = 0;
      dist = sideDistX - deltaDistX;
    } else {
      sideDistY += deltaDistY;
      mapY += stepY;
      side = 1;
      dist = sideDistY - deltaDistY;
    }

    if (dist > maxDist) break;
    if (mapX < 0 || mapX >= width || mapY < 0 || mapY >= height) break;

    const tile = tiles[mapY]![mapX]!;
    if (tile.type === 'wall') {
      return { dist, tileType: 'wall', side, tileX: mapX, tileY: mapY };
    }
  }

  // 벽을 못 맞춤 — 최대 거리 반환
  return { dist: maxDist, tileType: 'wall', side: 0, tileX: mapX, tileY: mapY };
}

function scanSpecialTiles(
  tiles: Tile[][], width: number, height: number,
  ox: number, oy: number, angle: number, maxDist: number, playerAngle: number,
): { tileType: TileType; dist: number; tileX: number; tileY: number }[] {
  const result: { tileType: TileType; dist: number; tileX: number; tileY: number }[] = [];
  const dirX = Math.cos(angle);
  const dirY = Math.sin(angle);

  let mapX = Math.floor(ox);
  let mapY = Math.floor(oy);

  const deltaDistX = Math.abs(dirX) < 1e-10 ? 1e10 : Math.abs(1 / dirX);
  const deltaDistY = Math.abs(dirY) < 1e-10 ? 1e10 : Math.abs(1 / dirY);

  let stepX: number, stepY: number;
  let sideDistX: number, sideDistY: number;

  if (dirX < 0) { stepX = -1; sideDistX = (ox - mapX) * deltaDistX; }
  else { stepX = 1; sideDistX = (mapX + 1 - ox) * deltaDistX; }

  if (dirY < 0) { stepY = -1; sideDistY = (oy - mapY) * deltaDistY; }
  else { stepY = 1; sideDistY = (mapY + 1 - oy) * deltaDistY; }

  const visited = new Set<string>();

  for (let step = 0; step < 64; step++) {
    let dist: number;
    if (sideDistX < sideDistY) {
      sideDistX += deltaDistX;
      mapX += stepX;
      dist = sideDistX - deltaDistX;
    } else {
      sideDistY += deltaDistY;
      mapY += stepY;
      dist = sideDistY - deltaDistY;
    }

    if (dist > maxDist) break;
    if (mapX < 0 || mapX >= width || mapY < 0 || mapY >= height) break;

    const tile = tiles[mapY]![mapX]!;
    if (tile.type === 'wall') break;

    const key = `${mapX},${mapY}`;
    if (visited.has(key)) continue;
    visited.add(key);

    const specialTypes: TileType[] = ['exit', 'combat', 'treasure', 'boss', 'trap', 'curio'];
    if (specialTypes.includes(tile.type) && tile.visible && !tile.cleared) {
      const corrDist = dist * Math.cos(angle - playerAngle);
      result.push({ tileType: tile.type, dist: corrDist < 0.1 ? 0.1 : corrDist, tileX: mapX, tileY: mapY });
    }
  }

  return result;
}
