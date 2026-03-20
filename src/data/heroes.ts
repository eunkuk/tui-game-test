import type { Hero, HeroClass, HeroStats, HeroRarity, MainCharClass, CompanionClass } from '../models/types.ts';
import { HERO_SKILLS } from './skills.ts';
import { rollTraits } from './traits.ts';
import { generateId, randomInt } from '../utils/helpers.ts';
import { RNG } from 'rot-js';

const RARITY_MULTIPLIER: Record<HeroRarity, number> = { 1: 1.0, 2: 1.15, 3: 1.3 };

export function getStars(rarity: number): string {
  if (rarity === 3) return '\u2605\u2605\u2605';
  if (rarity === 2) return '\u2605\u2605';
  return '\u2605';
}

export function rollRarity(): HeroRarity {
  const roll = Math.random() * 100;
  if (roll < 10) return 3;
  if (roll < 40) return 2;
  return 1;
}

const HERO_NAMES: Record<HeroClass, string[]> = {
  // Main character classes
  warrior: [
    'Aron', 'Bjorn', 'Hector', 'Marcus', 'Leonidas',
    'Sigurd', 'Thorin', 'Ragnar', 'Gideon', 'Victor',
  ],
  rogue: [
    'Shadow', 'Raven', 'Vex', 'Cipher', 'Shade',
    'Phantom', 'Ghost', 'Wraith', 'Nyx', 'Onyx',
  ],
  mage: [
    'Merlin', 'Gandara', 'Azoth', 'Elric', 'Theron',
    'Mordecai', 'Zephyr', 'Arcanus', 'Ignis', 'Voltaire',
  ],
  ranger: [
    'Artemis', 'Robin', 'Hawke', 'Falcone', 'Strider',
    'Arrow', 'Scout', 'Hunter', 'Talon', 'Swift',
  ],
  paladin: [
    'Galahad', 'Percival', 'Lancelot', 'Tristan', 'Arthur',
    'Uther', 'Balin', 'Gawain', 'Mordred', 'Geraint',
  ],
  dark_knight: [
    'Draven', 'Malthus', 'Oberon', 'Thanatos', 'Erebus',
    'Noctis', 'Abaddon', 'Moros', 'Tenebris', 'Umbra',
  ],
  // Companion classes
  crusader: [
    'Reynauld', 'Baldwin', 'Godfrey', 'Tancred', 'Aldric',
    'Cedric', 'Brant', 'Lucian', 'Gareth', 'Roland',
  ],
  highwayman: [
    'Dismas', 'William', 'Cutter', 'Varen', 'Rowan',
    'Fletcher', 'Blythe', 'Corbin', 'Maddox', 'Sterling',
  ],
  plague_doctor: [
    'Paracelsus', 'Isolde', 'Vivienne', 'Ophelia', 'Marguerite',
    'Beatrix', 'Cordelia', 'Lenora', 'Sylvia', 'Helena',
  ],
  vestal: [
    'Junia', 'Agnes', 'Theodora', 'Clarice', 'Emmeline',
    'Rosalind', 'Solange', 'Verena', 'Celestia', 'Miriam',
  ],
};

export const BASE_STATS: Record<HeroClass, HeroStats> = {
  // Main character classes
  warrior: {
    maxHp: 40, hp: 40, attack: 8, defense: 4, speed: 2,
    accuracy: 82, dodge: 5, crit: 4,
  },
  rogue: {
    maxHp: 26, hp: 26, attack: 7, defense: 1, speed: 7,
    accuracy: 88, dodge: 20, crit: 10,
  },
  mage: {
    maxHp: 22, hp: 22, attack: 10, defense: 0, speed: 4,
    accuracy: 92, dodge: 8, crit: 3,
  },
  ranger: {
    maxHp: 28, hp: 28, attack: 7, defense: 1, speed: 5,
    accuracy: 90, dodge: 12, crit: 7,
  },
  paladin: {
    maxHp: 45, hp: 45, attack: 6, defense: 5, speed: 1,
    accuracy: 80, dodge: 3, crit: 2,
  },
  dark_knight: {
    maxHp: 35, hp: 35, attack: 9, defense: 3, speed: 3,
    accuracy: 85, dodge: 5, crit: 5,
  },
  // Companion classes
  crusader: {
    maxHp: 33, hp: 33, attack: 8, defense: 3, speed: 1,
    accuracy: 85, dodge: 5, crit: 3,
  },
  highwayman: {
    maxHp: 26, hp: 26, attack: 7, defense: 1, speed: 5,
    accuracy: 85, dodge: 15, crit: 6,
  },
  plague_doctor: {
    maxHp: 22, hp: 22, attack: 5, defense: 0, speed: 6,
    accuracy: 95, dodge: 10, crit: 2,
  },
  vestal: {
    maxHp: 24, hp: 24, attack: 4, defense: 1, speed: 3,
    accuracy: 90, dodge: 5, crit: 1,
  },
};

let heroNameIndex: Record<HeroClass, number> = {
  warrior: 0, rogue: 0, mage: 0, ranger: 0, paladin: 0, dark_knight: 0,
  crusader: 0, highwayman: 0, plague_doctor: 0, vestal: 0,
};

export function resetHeroNames(): void {
  heroNameIndex = {
    warrior: 0, rogue: 0, mage: 0, ranger: 0, paladin: 0, dark_knight: 0,
    crusader: 0, highwayman: 0, plague_doctor: 0, vestal: 0,
  };
}

export function createHero(heroClass: HeroClass, rarity?: HeroRarity): Hero {
  const names = HERO_NAMES[heroClass];
  const idx = heroNameIndex[heroClass] % names.length;
  heroNameIndex[heroClass]++;
  const base = BASE_STATS[heroClass];
  const r: HeroRarity = rarity ?? rollRarity();
  const mult = RARITY_MULTIPLIER[r];

  return {
    id: generateId(),
    name: names[idx]!,
    class: heroClass,
    level: 0,
    rarity: r,
    stats: {
      maxHp: Math.round(base.maxHp * mult),
      hp: Math.round(base.maxHp * mult),
      attack: Math.round(base.attack * mult),
      defense: Math.round(base.defense * mult),
      speed: Math.round(base.speed * mult),
      accuracy: Math.round(base.accuracy * mult),
      dodge: Math.round(base.dodge * mult),
      crit: Math.round(base.crit * mult),
    },
    skills: HERO_SKILLS[heroClass].map(s => ({ ...s })),
    equipment: {},
    position: { row: 0, col: 0 },
    statusEffects: [],
    isDeathsDoor: false,
    deathsDoorResist: 67,
    isMainCharacter: false,
    statPoints: 0,
    exp: 0,
    expToLevel: 100,
    traits: rollTraits(),
  };
}

export function createMainCharacter(mainClass: MainCharClass): Hero {
  const names = HERO_NAMES[mainClass];
  const idx = heroNameIndex[mainClass] % names.length;
  heroNameIndex[mainClass]++;
  const base = BASE_STATS[mainClass];
  const mult = RARITY_MULTIPLIER[3]; // Always rarity 3

  return {
    id: generateId(),
    name: names[idx]!,
    class: mainClass,
    level: 0,
    rarity: 3,
    stats: {
      maxHp: Math.round(base.maxHp * mult),
      hp: Math.round(base.maxHp * mult),
      attack: Math.round(base.attack * mult),
      defense: Math.round(base.defense * mult),
      speed: Math.round(base.speed * mult),
      accuracy: Math.round(base.accuracy * mult),
      dodge: Math.round(base.dodge * mult),
      crit: Math.round(base.crit * mult),
    },
    skills: HERO_SKILLS[mainClass].map(s => ({ ...s })),
    equipment: {},
    position: { row: 0, col: 0 },
    statusEffects: [],
    isDeathsDoor: false,
    deathsDoorResist: 67,
    isMainCharacter: true,
    statPoints: 0,
    exp: 0,
    expToLevel: 100,
    traits: rollTraits(),
  };
}

export function getClassName(heroClass: HeroClass): string {
  const classNames: Record<HeroClass, string> = {
    warrior: '전사',
    rogue: '도적',
    mage: '마법사',
    ranger: '궁수',
    paladin: '성기사',
    dark_knight: '암흑기사',
    crusader: '십자군',
    highwayman: '노상강도',
    plague_doctor: '역병의사',
    vestal: '성녀',
  };
  return classNames[heroClass];
}

export const CLASS_DESCRIPTIONS: Record<HeroClass, string> = {
  warrior: '전열 탱커/딜러. 높은 HP와 공격력.',
  rogue: '전열 치명타 전문. 높은 속도와 회피.',
  mage: '후열 마법사. 광역 피해와 디버프.',
  ranger: '후열 원거리 딜러. 표적 지정과 높은 명중.',
  paladin: '전열 탱커/힐러. 신성한 치유와 방어.',
  dark_knight: '전열 흡혈 전사. 생명흡수와 저주.',
  crusader: '전열 전사. 강타와 기절, 아군 치유 가능.',
  highwayman: '중열 다목적. 근접/원거리 겸용, 출혈.',
  plague_doctor: '후열 상태이상. 역병/기절, 출혈 치료.',
  vestal: '후열 힐러. 단일/전체 치유, 스트레스 감소.',
};

export const MAIN_CHAR_CLASSES: MainCharClass[] = ['warrior', 'rogue', 'mage', 'ranger', 'paladin', 'dark_knight'];
export const COMPANION_CLASSES: CompanionClass[] = ['crusader', 'highwayman', 'plague_doctor', 'vestal'];
export const HERO_CLASSES: HeroClass[] = [...MAIN_CHAR_CLASSES, ...COMPANION_CLASSES];

export function levelUpHero(hero: Hero): Hero {
  const maxLevel = hero.isMainCharacter ? 10 : 5;
  if (hero.level >= maxLevel) return hero;
  const newLevel = hero.level + 1;

  if (hero.isMainCharacter) {
    // Main character: grant stat points, don't auto-allocate
    return {
      ...hero,
      level: newLevel,
      statPoints: hero.statPoints + 5,
      stats: {
        ...hero.stats,
        hp: hero.stats.maxHp, // heal to full
        },
      exp: 0,
      expToLevel: (newLevel + 1) * 100,
    };
  }

  // Companion: auto stat allocation (existing behavior)
  const hpGain = randomInt(3, 5);
  return {
    ...hero,
    level: newLevel,
    stats: {
      ...hero.stats,
      maxHp: hero.stats.maxHp + hpGain,
      hp: hero.stats.maxHp + hpGain,
      attack: hero.stats.attack + 1,
      speed: hero.stats.speed + (newLevel % 2 === 0 ? 1 : 0),
      accuracy: hero.stats.accuracy + 2,
      dodge: hero.stats.dodge + 1,
    },
    exp: 0,
    expToLevel: (newLevel + 1) * 100,
  };
}

export function applyStatPoints(hero: Hero, allocation: Record<string, number>): Hero {
  const totalPoints = Object.values(allocation).reduce((sum, v) => sum + v, 0);
  if (totalPoints > hero.statPoints) return hero;

  return {
    ...hero,
    statPoints: hero.statPoints - totalPoints,
    stats: {
      ...hero.stats,
      maxHp: hero.stats.maxHp + (allocation['hp'] || 0) * 3,
      hp: hero.stats.hp + (allocation['hp'] || 0) * 3,
      attack: hero.stats.attack + (allocation['attack'] || 0),
      defense: hero.stats.defense + (allocation['defense'] || 0),
      speed: hero.stats.speed + (allocation['speed'] || 0),
      accuracy: hero.stats.accuracy + (allocation['accuracy'] || 0) * 2,
      dodge: hero.stats.dodge + (allocation['dodge'] || 0) * 2,
      crit: hero.stats.crit + (allocation['crit'] || 0),
    },
  };
}

export const RECOMMENDED_POSITIONS: Record<HeroClass, { cols: number[]; label: string }> = {
  warrior: { cols: [1], label: '추천 열: 전열' },
  rogue: { cols: [1, 2], label: '추천 열: 전/중열' },
  mage: { cols: [3], label: '추천 열: 후열' },
  ranger: { cols: [3], label: '추천 열: 후열' },
  paladin: { cols: [1], label: '추천 열: 전열' },
  dark_knight: { cols: [1], label: '추천 열: 전열' },
  crusader: { cols: [1], label: '추천 열: 전열' },
  highwayman: { cols: [2], label: '추천 열: 중열' },
  plague_doctor: { cols: [3], label: '추천 열: 후열' },
  vestal: { cols: [3], label: '추천 열: 후열' },
};
