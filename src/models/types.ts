import type { Widgets } from 'blessed';

// === Status Effects ===
export type StatusEffectType = 'bleed' | 'blight' | 'stun' | 'mark' | 'buff_attack' | 'buff_defense' | 'buff_speed' | 'debuff_attack' | 'debuff_defense' | 'debuff_speed';

export interface StatusEffect {
  type: StatusEffectType;
  duration: number;
  value: number;
  source: string;
}

// === Skills ===
export interface SkillEffect {
  type: StatusEffectType;
  chance: number;
  duration: number;
  value: number;
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  usePositions: number[];    // hero must be in one of these positions (1-4)
  targetPositions: number[]; // can target these enemy positions (1-4)
  targetCount: number;       // 1=single, 4=all
  targetAlly: boolean;
  damage: { min: number; max: number };  // multiplier
  accuracy: number;
  crit: number;
  heal?: { min: number; max: number };
  stressHeal?: number;
  selfMove?: number;
  effects?: SkillEffect[];
}

// === Items ===
export type ItemType = 'weapon' | 'armor' | 'trinket' | 'supply' | 'potion';
export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'legendary';

export interface ItemModifier {
  stat: string;
  value: number;
}

export interface Item {
  id: string;
  name: string;
  type: ItemType;
  rarity: ItemRarity;
  description: string;
  modifiers: ItemModifier[];
  value: number;
  consumable?: boolean;
  healAmount?: number;
  stressHealAmount?: number;
  torchAmount?: number;
  buffEffect?: { stat: string; value: number; duration: number };
}

// === Hero Rarity ===
export type HeroRarity = 1 | 2 | 3;

// === Heroes ===
export interface HeroStats {
  maxHp: number;
  hp: number;
  attack: number;
  defense: number;
  speed: number;
  accuracy: number;
  dodge: number;
  crit: number;
  stress: number;
}

export type MainCharClass = 'warrior' | 'rogue' | 'mage' | 'ranger' | 'paladin' | 'dark_knight';
export type CompanionClass = 'crusader' | 'highwayman' | 'plague_doctor' | 'vestal';
export type HeroClass = MainCharClass | CompanionClass;
export type AfflictionType = 'hopeless' | 'fearful' | 'paranoid' | 'selfish' | 'abusive';
export type VirtueType = 'courageous' | 'focused' | 'powerful' | 'stalwart' | 'vigorous';

export interface Hero {
  id: string;
  name: string;
  class: HeroClass;
  level: number;
  stats: HeroStats;
  skills: Skill[];
  equipment: {
    weapon?: Item;
    armor?: Item;
    trinket1?: Item;
    trinket2?: Item;
  };
  position: number;
  statusEffects: StatusEffect[];
  isDeathsDoor: boolean;
  deathsDoorResist: number;
  affliction?: AfflictionType;
  virtue?: VirtueType;
  rarity: HeroRarity;
  isMainCharacter: boolean;
  statPoints: number;
  exp: number;
  expToLevel: number;
}

// === Monsters ===
export type MonsterType = 'bone_soldier' | 'bone_archer' | 'bone_captain' | 'cultist_brawler' | 'cultist_acolyte' | 'madman' | 'large_carrion_eater' | 'necromancer' | 'shadow_lurker' | 'plague_rat' | 'cursed_knight' | 'dark_mage' | 'gargoyle' | 'wraith';

export interface MonsterStats {
  maxHp: number;
  hp: number;
  attack: number;
  defense: number;
  speed: number;
  accuracy: number;
  dodge: number;
  crit: number;
}

export interface Monster {
  id: string;
  name: string;
  type: MonsterType;
  stats: MonsterStats;
  skills: Skill[];
  position: number;
  statusEffects: StatusEffect[];
  isBoss: boolean;
  stressDamage: number;
}

// === Dungeon ===
export type RoomType = 'entrance' | 'empty' | 'combat' | 'treasure' | 'trap' | 'curio' | 'boss';

export interface Room {
  id: number;
  type: RoomType;
  explored: boolean;
  cleared: boolean;
  description: string;
  loot?: Item[];
  trapDamage?: number;
  curioEffect?: string;
  monsterTypes?: MonsterType[];
}

// === 2D Tile Map ===
export type TileType = 'wall' | 'floor' | 'entrance' | 'exit'
  | 'combat' | 'treasure' | 'trap' | 'curio' | 'boss';

export interface Tile {
  type: TileType;
  explored: boolean;
  visible: boolean;
  cleared: boolean;
  monsterTypes?: MonsterType[];
  trapDamage?: number;
}

export interface FloorMap {
  width: number;
  height: number;
  tiles: Tile[][];
  playerX: number;
  playerY: number;
  exitX: number;
  exitY: number;
}

export interface TowerState {
  currentFloor: number;
  maxFloorReached: number;
  torchLevel: number;
  floorMap: FloorMap;
  inProgress: boolean;
  paused: boolean;
}

// === Combat ===
export type CombatPhase = 'animating' | 'enemy_turn' | 'victory' | 'defeat' | 'fled';

export interface TurnOrder {
  id: string;
  isHero: boolean;
  speed: number;
  done: boolean;
}

export interface CombatState {
  phase: CombatPhase;
  heroes: Hero[];
  monsters: Monster[];
  turnOrder: TurnOrder[];
  currentTurnIndex: number;
  round: number;
  log: string[];
  selectedSkillIndex: number;
  isSurprised: boolean;
  enemySurprised: boolean;
}

// === Pending Loot ===
export interface PendingLoot {
  items: Item[];
  currentIndex: number;
  gold: number;
  source: 'combat' | 'treasure' | 'curio';
}

// === Game State ===
export type Screen = 'title' | 'town' | 'party_select' | 'dungeon' | 'combat' | 'inventory' | 'event' | 'game_over' | 'hero_detail' | 'character_select' | 'stat_allocation';

export interface GameState {
  screen: Screen;
  roster: Hero[];
  party: (Hero | null)[];
  inventory: Item[];
  gold: number;
  tower: TowerState | null;
  combat: CombatState | null;
  week: number;
  maxFloorReached: number;
  gameLog: string[];
  currentEvent: DungeonEvent | null;
  gameWon: boolean;
  selectedHeroId: string | null;
  gameSpeed: 1 | 2 | 3;
  continuousRun: boolean;
  runsCompleted: number;
  paused: boolean;
  mainCharacterId: string | null;
  pendingLoot: PendingLoot | null;
}

export interface DungeonEvent {
  title: string;
  description: string;
  choices: EventChoice[];
}

export interface EventChoice {
  text: string;
  action: () => void;
}
