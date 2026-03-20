import type { RayHit, SpecialMarker } from './raycaster.ts';
import type { DungeonTheme } from '../models/types.ts';
import type { ThemeConfig } from '../data/themes.ts';
import { getThemeConfig } from '../data/themes.ts';

/* ── 색상 유틸리티 ─────────────────────────────── */

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function rgb(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  const toHex = (v: number) => clamp(v).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function lerpColor(
  r1: number, g1: number, b1: number,
  r2: number, g2: number, b2: number,
  t: number,
): string {
  return rgb(lerp(r1, r2, t), lerp(g1, g2, t), lerp(b1, b2, t));
}

/* ── 벽 팔레트 ─────────────────────────────────── */

interface WallPalette {
  nearR: number; nearG: number; nearB: number;
  farR: number;  farG: number;  farB: number;
}

function getWallPalette(tc: ThemeConfig): WallPalette {
  const hex = tc.wallColor;
  const nearR = parseInt(hex.slice(1, 3), 16);
  const nearG = parseInt(hex.slice(3, 5), 16);
  const nearB = parseInt(hex.slice(5, 7), 16);
  return {
    nearR, nearG, nearB,
    farR: 0x30, farG: 0x28, farB: 0x28,
  };
}

/* ── 벽 색상 계산 ──────────────────────────────── */

function getWallColor(dist: number, side: 0 | 1, pal: WallPalette): string {
  const maxDist = 18;
  const t = Math.min(dist / maxDist, 1);
  let r = lerp(pal.nearR, pal.farR, t);
  let g = lerp(pal.nearG, pal.farG, t);
  let b = lerp(pal.nearB, pal.farB, t);
  if (side === 1) {
    r *= 0.75;
    g *= 0.75;
    b *= 0.75;
  }
  return rgb(r, g, b);
}

/* ── 특수 타일 아이콘 ──────────────────────────── */

function getSpecialIcon(tileType: string): string {
  switch (tileType) {
    case 'exit':     return '{#00ffff-fg}▶{/#00ffff-fg}';
    case 'combat':   return '{#ff3300-fg}‼{/#ff3300-fg}';
    case 'treasure': return '{#ffcc00-fg}◆{/#ffcc00-fg}';
    case 'boss':     return '{#ff0033-fg}●{/#ff0033-fg}';
    case 'trap':     return '{#ff6600-fg}▲{/#ff6600-fg}';
    case 'curio':    return '{#cc44ff-fg}◇{/#cc44ff-fg}';
    default:         return ' ';
  }
}

/* ── 메인 렌더 ─────────────────────────────────── */

export function renderFPS(
  hits: RayHit[],
  specials: SpecialMarker[],
  viewWidth: number,
  viewHeight: number,
  theme: DungeonTheme,
): string {
  const tc = getThemeConfig(theme);
  const pal = getWallPalette(tc);
  const lines: string[] = [];

  // 특수 마커를 컬럼별로 인덱싱 (가장 가까운 것만)
  const specialByCol = new Map<number, SpecialMarker>();
  for (const s of specials) {
    const existing = specialByCol.get(s.column);
    if (!existing || s.dist < existing.dist) {
      specialByCol.set(s.column, s);
    }
  }

  // 천장 그래디언트 색상 (꼭대기 → 벽 경계)
  // top: #1a1a3e → bottom: #5a6a9a (더 밝게)
  const ceilTopR = 0x1a, ceilTopG = 0x1a, ceilTopB = 0x3e;
  const ceilBotR = 0x5a, ceilBotG = 0x6a, ceilBotB = 0x9a;

  // 바닥 그래디언트 색상 (벽 경계 → 맨 아래)
  // top: #6a5a40 → bottom: #cc bb88 (훨씬 밝게)
  const floorTopR = 0x6a, floorTopG = 0x5a, floorTopB = 0x40;
  const floorBotR = 0xcc, floorBotG = 0xbb, floorBotB = 0x88;

  for (let row = 0; row < viewHeight; row++) {
    let line = '';
    for (let col = 0; col < viewWidth; col++) {
      const hit = hits[col];
      if (!hit) { line += ' '; continue; }

      const wallH = Math.floor(viewHeight / hit.dist);
      const wallTop = Math.floor((viewHeight - wallH) / 2);
      const wallBot = wallTop + wallH;

      if (row < wallTop) {
        // 천장
        const maxCeil = Math.max(wallTop, 1);
        const t = row / maxCeil;
        const c = lerpColor(ceilTopR, ceilTopG, ceilTopB, ceilBotR, ceilBotG, ceilBotB, t);
        line += `{${c}-fg}\u2588{/${c}-fg}`;
      } else if (row >= wallBot) {
        // 바닥 (체크보드 패턴)
        const floorRows = viewHeight - wallBot;
        const maxFloor = Math.max(floorRows, 1);
        const t = (row - wallBot) / maxFloor;
        let fR = lerp(floorTopR, floorBotR, t);
        let fG = lerp(floorTopG, floorBotG, t);
        let fB = lerp(floorTopB, floorBotB, t);
        // 체크보드: (col + row) % 2 에 따라 밝기 변화
        if ((col + row) % 2 === 0) {
          fR *= 1.15; fG *= 1.15; fB *= 1.15;
        } else {
          fR *= 0.85; fG *= 0.85; fB *= 0.85;
        }
        const c = rgb(fR, fG, fB);
        line += `{${c}-fg}\u2588{/${c}-fg}`;
      } else {
        // 벽
        const wallMid = Math.floor((wallTop + wallBot) / 2);
        const special = specialByCol.get(col);
        if (special && row === wallMid && special.dist < hit.dist) {
          line += getSpecialIcon(special.tileType);
        } else {
          const c = getWallColor(hit.dist, hit.side, pal);
          line += `{${c}-fg}\u2588{/${c}-fg}`;
        }
      }
    }
    lines.push(line);
  }

  return lines.join('\n');
}
