import type { Monster, MonsterType } from '../models/types.ts';
import { generateId, randomInt } from '../utils/helpers.ts';
import { MONSTER_SKILLS } from '../data/skills.ts';

interface MonsterTemplate {
  name: string;
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
  accuracy: number;
  dodge: number;
  crit: number;
  stressDamage: number;
  isBoss: boolean;
}

const MONSTER_TEMPLATES: Record<MonsterType, MonsterTemplate> = {
  bone_soldier: {
    name: '해골 병사', maxHp: 18, attack: 6, defense: 2, speed: 2,
    accuracy: 80, dodge: 5, crit: 3, stressDamage: 5, isBoss: false,
  },
  bone_archer: {
    name: '해골 궁수', maxHp: 14, attack: 5, defense: 1, speed: 4,
    accuracy: 85, dodge: 10, crit: 6, stressDamage: 5, isBoss: false,
  },
  bone_captain: {
    name: '해골 대장', maxHp: 30, attack: 8, defense: 4, speed: 3,
    accuracy: 85, dodge: 5, crit: 5, stressDamage: 8, isBoss: true,
  },
  cultist_brawler: {
    name: '광신도 투사', maxHp: 20, attack: 7, defense: 2, speed: 3,
    accuracy: 82, dodge: 8, crit: 5, stressDamage: 6, isBoss: false,
  },
  cultist_acolyte: {
    name: '광신도 수습', maxHp: 16, attack: 4, defense: 1, speed: 5,
    accuracy: 85, dodge: 12, crit: 2, stressDamage: 8, isBoss: false,
  },
  madman: {
    name: '광인', maxHp: 12, attack: 5, defense: 0, speed: 6,
    accuracy: 75, dodge: 15, crit: 5, stressDamage: 12, isBoss: false,
  },
  large_carrion_eater: {
    name: '거대 시체 포식자', maxHp: 35, attack: 9, defense: 3, speed: 1,
    accuracy: 80, dodge: 0, crit: 3, stressDamage: 8, isBoss: true,
  },
  necromancer: {
    name: '사령술사', maxHp: 40, attack: 7, defense: 2, speed: 5,
    accuracy: 90, dodge: 10, crit: 4, stressDamage: 15, isBoss: true,
  },
  shadow_lurker: {
    name: '그림자 잠복자', maxHp: 16, attack: 6, defense: 0, speed: 8,
    accuracy: 88, dodge: 25, crit: 8, stressDamage: 6, isBoss: false,
  },
  plague_rat: {
    name: '역병 쥐', maxHp: 10, attack: 3, defense: 0, speed: 5,
    accuracy: 78, dodge: 12, crit: 3, stressDamage: 3, isBoss: false,
  },
  cursed_knight: {
    name: '저주받은 기사', maxHp: 28, attack: 8, defense: 4, speed: 1,
    accuracy: 82, dodge: 3, crit: 4, stressDamage: 8, isBoss: false,
  },
  dark_mage: {
    name: '암흑 마법사', maxHp: 18, attack: 7, defense: 0, speed: 5,
    accuracy: 88, dodge: 10, crit: 4, stressDamage: 10, isBoss: false,
  },
  gargoyle: {
    name: '가고일', maxHp: 25, attack: 6, defense: 5, speed: 2,
    accuracy: 78, dodge: 3, crit: 3, stressDamage: 6, isBoss: false,
  },
  wraith: {
    name: '망령', maxHp: 20, attack: 5, defense: 0, speed: 6,
    accuracy: 90, dodge: 15, crit: 5, stressDamage: 15, isBoss: false,
  },
};

export function createMonster(type: MonsterType, position: number): Monster {
  const template = MONSTER_TEMPLATES[type];
  return {
    id: generateId(),
    name: template.name,
    type,
    stats: {
      maxHp: template.maxHp,
      hp: template.maxHp,
      attack: template.attack,
      defense: template.defense,
      speed: template.speed,
      accuracy: template.accuracy,
      dodge: template.dodge,
      crit: template.crit,
    },
    skills: MONSTER_SKILLS[type].map(s => ({ ...s })),
    position,
    statusEffects: [],
    isBoss: template.isBoss,
    stressDamage: template.stressDamage,
  };
}

export function createMonsterGroup(types: MonsterType[]): Monster[] {
  return types.map((t, i) => createMonster(t, i + 1));
}

export function createMonsterScaled(type: MonsterType, position: number, statMultiplier: number): Monster {
  const monster = createMonster(type, position);
  const m = statMultiplier;
  monster.stats.maxHp = Math.round(monster.stats.maxHp * m);
  monster.stats.hp = monster.stats.maxHp;
  monster.stats.attack = Math.round(monster.stats.attack * m);
  monster.stats.defense = Math.round(monster.stats.defense * m);
  return monster;
}

export function createMonsterGroupScaled(types: MonsterType[], statMultiplier: number): Monster[] {
  return types.map((t, i) => createMonsterScaled(t, i + 1, statMultiplier));
}
