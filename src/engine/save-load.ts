import { readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync } from 'fs';
import { join } from 'path';
import type { GameState, PrestigeState } from '../models/types.ts';
import { migrateOldPosition } from '../utils/grid.ts';
import { HERO_SKILLS } from '../data/skills.ts';

const SAVE_DIR = join(process.cwd(), 'saves');
const SAVE_FILE = join(SAVE_DIR, 'save.json');
const PRESTIGE_FILE = join(SAVE_DIR, 'prestige.json');

// Prepare state for serialization by stripping non-serializable properties (functions in event choices)
function serializeState(state: GameState): object {
  const serializable: any = { ...state };

  // Strip event choice action functions - they cannot be serialized
  if (serializable.currentEvent) {
    serializable.currentEvent = {
      ...serializable.currentEvent,
      choices: serializable.currentEvent.choices.map((c: any) => ({
        text: c.text,
        // action is a function, cannot be serialized
      })),
    };
  }

  return serializable;
}

export function saveGame(state: GameState): boolean {
  try {
    if (!existsSync(SAVE_DIR)) {
      mkdirSync(SAVE_DIR, { recursive: true });
    }

    const data = JSON.stringify(serializeState(state), null, 2);
    writeFileSync(SAVE_FILE, data, 'utf-8');
    return true;
  } catch (err) {
    return false;
  }
}

export function loadGame(): GameState | null {
  try {
    if (!existsSync(SAVE_FILE)) return null;

    const data = readFileSync(SAVE_FILE, 'utf-8');
    const parsed = JSON.parse(data) as GameState;

    // Restore defaults for non-serializable fields
    if (parsed.currentEvent) {
      // Re-create empty action stubs for event choices since functions cannot be serialized
      parsed.currentEvent = {
        ...parsed.currentEvent,
        choices: (parsed.currentEvent.choices || []).map(c => ({
          text: c.text,
          action: () => {},
        })),
      };
    }

    // Validate essential fields
    if (
      typeof parsed.screen !== 'string' ||
      !Array.isArray(parsed.roster) ||
      !Array.isArray(parsed.party) ||
      !Array.isArray(parsed.inventory) ||
      typeof parsed.gold !== 'number' ||
      typeof parsed.week !== 'number'
    ) {
      return null;
    }

    // Migration: add defaults for new fields from auto-battle update
    if (parsed.gameSpeed === undefined) (parsed as any).gameSpeed = 1;
    if (parsed.continuousRun === undefined) (parsed as any).continuousRun = false;
    if (parsed.runsCompleted === undefined) (parsed as any).runsCompleted = 0;
    // Remove old autoMode field if present
    if ((parsed as any).autoMode !== undefined) delete (parsed as any).autoMode;

    // Migration: convert old dungeon system to tower system
    if ((parsed as any).dungeon !== undefined) {
      (parsed as any).tower = null;
      delete (parsed as any).dungeon;
    }
    if (parsed.maxFloorReached === undefined) (parsed as any).maxFloorReached = 0;
    if ((parsed as any).tower === undefined) (parsed as any).tower = null;
    // Remove old fields
    if ((parsed as any).completedDungeons !== undefined) delete (parsed as any).completedDungeons;
    if ((parsed as any).lastDungeonId !== undefined) delete (parsed as any).lastDungeonId;

    // Migration: convert rooms[] to floorMap
    if (parsed.tower && (parsed.tower as any).rooms !== undefined && !(parsed.tower as any).floorMap) {
      // Old format with rooms[] - reset tower since we can't migrate mid-run
      (parsed as any).tower = null;
    }
    // Add paused field
    if (parsed.paused === undefined) (parsed as any).paused = false;
    if (parsed.tower && (parsed.tower as any).paused === undefined) {
      (parsed.tower as any).paused = false;
    }

    // Migration: add rarity to heroes that don't have it
    for (const hero of parsed.roster) {
      if ((hero as any).rarity === undefined) (hero as any).rarity = 1;
    }
    for (let i = 0; i < parsed.party.length; i++) {
      const h = parsed.party[i];
      if (h && (h as any).rarity === undefined) (h as any).rarity = 1;
    }

    // Migration: add pendingLoot field
    if ((parsed as any).pendingLoot === undefined) (parsed as any).pendingLoot = null;

    // Migration: add main character fields
    if (parsed.mainCharacterId === undefined) (parsed as any).mainCharacterId = null;
    for (const hero of parsed.roster) {
      if ((hero as any).isMainCharacter === undefined) (hero as any).isMainCharacter = false;
      if ((hero as any).statPoints === undefined) (hero as any).statPoints = 0;
    }
    for (let i = 0; i < parsed.party.length; i++) {
      const h = parsed.party[i];
      if (h) {
        if ((h as any).isMainCharacter === undefined) (h as any).isMainCharacter = false;
        if ((h as any).statPoints === undefined) (h as any).statPoints = 0;
      }
    }

    // Migration: add exp fields to heroes
    for (const hero of parsed.roster) {
      if ((hero as any).exp === undefined) (hero as any).exp = 0;
      if ((hero as any).expToLevel === undefined) (hero as any).expToLevel = (hero.level + 1) * 100;
    }
    for (let i = 0; i < parsed.party.length; i++) {
      const h = parsed.party[i];
      if (h) {
        if ((h as any).exp === undefined) (h as any).exp = 0;
        if ((h as any).expToLevel === undefined) (h as any).expToLevel = (h.level + 1) * 100;
      }
    }

    // Migration: add traits to heroes
    for (const hero of parsed.roster) {
      if ((hero as any).traits === undefined) (hero as any).traits = [];
    }
    for (let i = 0; i < parsed.party.length; i++) {
      const h = parsed.party[i];
      if (h && (h as any).traits === undefined) (h as any).traits = [];
    }

    // Migration: add theme to tower
    if (parsed.tower && (parsed.tower as any).theme === undefined) {
      (parsed.tower as any).theme = 'catacombs';
    }

    // Migration: add playerAngle to floorMap
    if (parsed.tower && parsed.tower.floorMap && (parsed.tower.floorMap as any).playerAngle === undefined) {
      (parsed.tower.floorMap as any).playerAngle = 0;
    }

    // Migration: add prestige
    if ((parsed as any).prestige === undefined) {
      (parsed as any).prestige = loadPrestige();
    }

    // Migration: position number → GridPosition
    for (const hero of parsed.roster) {
      if (typeof (hero as any).position === 'number') {
        (hero as any).position = migrateOldPosition((hero as any).position);
      }
      // Reload skills with new useCols/targetCols format
      if (hero.skills && hero.skills[0] && 'usePositions' in (hero.skills[0] as any)) {
        (hero as any).skills = HERO_SKILLS[hero.class].map((s: any) => ({ ...s }));
      }
    }
    for (let i = 0; i < parsed.party.length; i++) {
      const h = parsed.party[i];
      if (h) {
        if (typeof (h as any).position === 'number') {
          (h as any).position = migrateOldPosition((h as any).position);
        }
        if (h.skills && h.skills[0] && 'usePositions' in (h.skills[0] as any)) {
          (h as any).skills = HERO_SKILLS[h.class].map((s: any) => ({ ...s }));
        }
      }
    }

    // Migration: party 4 → 6 slots
    if (parsed.party.length === 4) {
      parsed.party.push(null, null);
    }

    // Migration: combat monsters position
    if (parsed.combat) {
      for (const m of parsed.combat.monsters) {
        if (typeof (m as any).position === 'number') {
          (m as any).position = migrateOldPosition((m as any).position);
        }
        if ((m as any).size === undefined) (m as any).size = 'small';
      }
      for (const h of parsed.combat.heroes) {
        if (typeof (h as any).position === 'number') {
          (h as any).position = migrateOldPosition((h as any).position);
        }
        if (h.skills && h.skills[0] && 'usePositions' in (h.skills[0] as any)) {
          (h as any).skills = HERO_SKILLS[h.class].map((s: any) => ({ ...s }));
        }
      }
    }

    return parsed;
  } catch (err) {
    return null;
  }
}

export function hasSaveFile(): boolean {
  return existsSync(SAVE_FILE);
}

export function deleteSave(): void {
  try {
    if (existsSync(SAVE_FILE)) {
      unlinkSync(SAVE_FILE);
    }
    // NOTE: prestige.json is NOT deleted — it persists across runs
  } catch (err) {
    // Silently ignore delete errors
  }
}

// === Prestige persistence (separate file) ===
export function savePrestige(prestige: PrestigeState): boolean {
  try {
    if (!existsSync(SAVE_DIR)) {
      mkdirSync(SAVE_DIR, { recursive: true });
    }
    writeFileSync(PRESTIGE_FILE, JSON.stringify(prestige, null, 2), 'utf-8');
    return true;
  } catch {
    return false;
  }
}

export function loadPrestige(): PrestigeState {
  try {
    if (!existsSync(PRESTIGE_FILE)) {
      return { points: 0, totalEarned: 0, purchased: [] };
    }
    const data = readFileSync(PRESTIGE_FILE, 'utf-8');
    const parsed = JSON.parse(data) as PrestigeState;
    if (!Array.isArray(parsed.purchased)) parsed.purchased = [];
    if (typeof parsed.points !== 'number') parsed.points = 0;
    if (typeof parsed.totalEarned !== 'number') parsed.totalEarned = 0;
    return parsed;
  } catch {
    return { points: 0, totalEarned: 0, purchased: [] };
  }
}
