import type { Hero, HeroClass, MainCharClass, Item, Screen, CombatState, DungeonEvent, Monster, FloorMap, PendingLoot, PrestigeUpgradeId, GridPosition } from '../models/types.ts';

export type GameAction =
  | { type: 'NAVIGATE'; screen: Screen }
  | { type: 'NEW_GAME'; mainCharClass: MainCharClass }
  | { type: 'RECRUIT_HERO'; heroClass: HeroClass }
  | { type: 'DISMISS_HERO'; heroId: string }
  | { type: 'ADD_TO_PARTY'; heroId: string; slotIndex: number }
  | { type: 'REMOVE_FROM_PARTY'; slotIndex: number }
  | { type: 'SWAP_PARTY_POSITION'; pos1: number; pos2: number }
  | { type: 'BUY_ITEM'; item: Item }
  | { type: 'SELL_ITEM'; itemId: string }
  | { type: 'EQUIP_ITEM'; heroId: string; itemId: string }
  | { type: 'UNEQUIP_ITEM'; heroId: string; slot: 'weapon' | 'armor' | 'trinket1' | 'trinket2' }
  | { type: 'USE_ITEM'; itemId: string; heroId?: string }
  | { type: 'ENTER_TOWER' }
  | { type: 'ADVANCE_FLOOR' }
  | { type: 'EXIT_TOWER' }

  | { type: 'START_COMBAT'; monsters: Monster[]; isSurprised?: boolean; enemySurprised?: boolean }
  | { type: 'SET_COMBAT'; combat: CombatState }
  | { type: 'END_COMBAT_VICTORY'; loot: Item[]; gold: number }
  | { type: 'END_COMBAT_DEFEAT' }
  | { type: 'FLEE_COMBAT' }
  | { type: 'UPDATE_PARTY_HERO'; hero: Hero }
  | { type: 'SET_EVENT'; event: DungeonEvent | null }
  | { type: 'CLEAR_ROOM' }
  | { type: 'ADD_GOLD'; amount: number }
  | { type: 'ADD_LOG'; message: string }
  | { type: 'SET_GAME_WON'; won: boolean }
  | { type: 'LOAD_STATE'; state: GameState }
  | { type: 'LEVEL_UP_HERO'; heroId: string }
  | { type: 'SET_SELECTED_HERO'; heroId: string | null }
  | { type: 'ADVANCE_WEEK' }
  | { type: 'SET_GAME_SPEED'; speed: 1 | 2 | 3 }
  | { type: 'TOGGLE_CONTINUOUS_RUN' }
  | { type: 'INCREMENT_RUNS' }
  | { type: 'SET_CONTINUOUS_RUN'; enabled: boolean }
  | { type: 'TOGGLE_PAUSE' }
  | { type: 'UPDATE_FLOOR_MAP'; floorMap: FloorMap }
  | { type: 'CLEAR_TILE'; x: number; y: number }
  | { type: 'ALLOCATE_STATS'; heroId: string; allocation: Record<string, number> }
  | { type: 'MAIN_CHAR_FLEE' }
  | { type: 'SET_PENDING_LOOT'; loot: PendingLoot }
  | { type: 'RESOLVE_LOOT_ITEM'; decision: 'equip' | 'store' | 'use' | 'discard'; heroId?: string }
  | { type: 'CLEAR_PENDING_LOOT' }
  | { type: 'USE_COMBAT_ITEM'; itemId: string; heroId: string }
  | { type: 'EARN_PRESTIGE'; amount: number }
  | { type: 'BUY_PRESTIGE_UPGRADE'; upgradeId: PrestigeUpgradeId };

// Import GameState at the type level
import type { GameState } from '../models/types.ts';
