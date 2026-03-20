import type { Monster, MonsterType, MonsterStats } from '../models/types.ts';
import { MONSTER_SKILLS } from './skills.ts';
import { generateId, randomChoice, randomInt, shuffleArray } from '../utils/helpers.ts';

// ============================================================
// MONSTER TEMPLATES
// ============================================================
interface MonsterTemplate {
  type: MonsterType;
  name: string;
  stats: MonsterStats;
  isBoss: boolean;
  stressDamage: number;
  preferredPositions: number[];
}

const MONSTER_TEMPLATES: Record<MonsterType, MonsterTemplate> = {
  bone_soldier: {
    type: 'bone_soldier',
    name: '해골 병사',
    stats: {
      maxHp: 18, hp: 18,
      attack: 6, defense: 2,
      speed: 2, accuracy: 80,
      dodge: 5, crit: 3,
    },
    isBoss: false,
    stressDamage: 5,
    preferredPositions: [1, 2],
  },
  bone_archer: {
    type: 'bone_archer',
    name: '해골 궁수',
    stats: {
      maxHp: 14, hp: 14,
      attack: 5, defense: 0,
      speed: 5, accuracy: 85,
      dodge: 10, crit: 6,
    },
    isBoss: false,
    stressDamage: 4,
    preferredPositions: [3, 4],
  },
  bone_captain: {
    type: 'bone_captain',
    name: '해골 대장',
    stats: {
      maxHp: 45, hp: 45,
      attack: 9, defense: 4,
      speed: 3, accuracy: 85,
      dodge: 10, crit: 5,
    },
    isBoss: true,
    stressDamage: 10,
    preferredPositions: [1, 2],
  },
  cultist_brawler: {
    type: 'cultist_brawler',
    name: '광신도 싸움꾼',
    stats: {
      maxHp: 20, hp: 20,
      attack: 7, defense: 1,
      speed: 3, accuracy: 82,
      dodge: 8, crit: 5,
    },
    isBoss: false,
    stressDamage: 6,
    preferredPositions: [1, 2],
  },
  cultist_acolyte: {
    type: 'cultist_acolyte',
    name: '광신도 시종',
    stats: {
      maxHp: 15, hp: 15,
      attack: 3, defense: 0,
      speed: 4, accuracy: 88,
      dodge: 12, crit: 2,
    },
    isBoss: false,
    stressDamage: 4,
    preferredPositions: [3, 4],
  },
  madman: {
    type: 'madman',
    name: '광인',
    stats: {
      maxHp: 12, hp: 12,
      attack: 4, defense: 0,
      speed: 7, accuracy: 75,
      dodge: 20, crit: 5,
    },
    isBoss: false,
    stressDamage: 15,
    preferredPositions: [2, 3],
  },
  large_carrion_eater: {
    type: 'large_carrion_eater',
    name: '거대 부식자',
    stats: {
      maxHp: 30, hp: 30,
      attack: 5, defense: 2,
      speed: 1, accuracy: 78,
      dodge: 0, crit: 3,
    },
    isBoss: false,
    stressDamage: 8,
    preferredPositions: [1, 2],
  },
  necromancer: {
    type: 'necromancer',
    name: '강령술사',
    stats: {
      maxHp: 35, hp: 35,
      attack: 6, defense: 1,
      speed: 6, accuracy: 90,
      dodge: 15, crit: 5,
    },
    isBoss: true,
    stressDamage: 12,
    preferredPositions: [3, 4],
  },
  shadow_lurker: {
    type: 'shadow_lurker',
    name: '그림자 잠복자',
    stats: {
      maxHp: 16, hp: 16,
      attack: 6, defense: 0,
      speed: 8, accuracy: 88,
      dodge: 25, crit: 8,
    },
    isBoss: false,
    stressDamage: 6,
    preferredPositions: [1, 2, 3],
  },
  plague_rat: {
    type: 'plague_rat',
    name: '역병 쥐',
    stats: {
      maxHp: 10, hp: 10,
      attack: 3, defense: 0,
      speed: 5, accuracy: 78,
      dodge: 12, crit: 3,
    },
    isBoss: false,
    stressDamage: 3,
    preferredPositions: [1, 2],
  },
  cursed_knight: {
    type: 'cursed_knight',
    name: '저주받은 기사',
    stats: {
      maxHp: 28, hp: 28,
      attack: 8, defense: 4,
      speed: 1, accuracy: 82,
      dodge: 3, crit: 4,
    },
    isBoss: false,
    stressDamage: 8,
    preferredPositions: [1, 2],
  },
  dark_mage: {
    type: 'dark_mage',
    name: '암흑 마법사',
    stats: {
      maxHp: 18, hp: 18,
      attack: 7, defense: 0,
      speed: 5, accuracy: 88,
      dodge: 10, crit: 4,
    },
    isBoss: false,
    stressDamage: 10,
    preferredPositions: [3, 4],
  },
  gargoyle: {
    type: 'gargoyle',
    name: '가고일',
    stats: {
      maxHp: 25, hp: 25,
      attack: 6, defense: 5,
      speed: 2, accuracy: 78,
      dodge: 3, crit: 3,
    },
    isBoss: false,
    stressDamage: 6,
    preferredPositions: [1, 2],
  },
  wraith: {
    type: 'wraith',
    name: '망령',
    stats: {
      maxHp: 20, hp: 20,
      attack: 5, defense: 0,
      speed: 6, accuracy: 90,
      dodge: 15, crit: 5,
    },
    isBoss: false,
    stressDamage: 15,
    preferredPositions: [2, 3],
  },
};

// ============================================================
// FACTORY FUNCTIONS
// ============================================================
export function createMonster(type: MonsterType): Monster {
  const template = MONSTER_TEMPLATES[type];
  return {
    id: generateId(),
    name: template.name,
    type: template.type,
    stats: { ...template.stats },
    skills: MONSTER_SKILLS[type].map(s => ({ ...s })),
    position: 0,
    statusEffects: [],
    isBoss: template.isBoss,
    stressDamage: template.stressDamage,
  };
}

const REGULAR_FRONT: MonsterType[] = ['bone_soldier', 'cultist_brawler', 'large_carrion_eater'];
const REGULAR_BACK: MonsterType[] = ['bone_archer', 'cultist_acolyte', 'madman'];

export function createEncounter(difficulty: number, isBoss: boolean): Monster[] {
  const monsters: Monster[] = [];

  if (isBoss) {
    // Boss encounter: 1 boss + 1-2 minions
    const bossType: MonsterType = difficulty >= 3 ? 'necromancer' : 'bone_captain';
    const boss = createMonster(bossType);
    boss.position = MONSTER_TEMPLATES[bossType].preferredPositions[0]!;

    const minionCount = randomInt(1, 2);
    const minions: Monster[] = [];
    for (let i = 0; i < minionCount; i++) {
      const type = i === 0
        ? randomChoice(REGULAR_FRONT)
        : randomChoice(REGULAR_BACK);
      const m = createMonster(type);
      minions.push(m);
    }

    // Assign positions: boss gets preferred, minions fill remaining
    if (bossType === 'necromancer') {
      boss.position = 4;
      minions.forEach((m, i) => { m.position = i + 1; });
    } else {
      boss.position = 1;
      minions.forEach((m, i) => { m.position = i + 2; });
    }

    monsters.push(boss, ...minions);
  } else {
    // Regular encounter: 2-4 monsters
    const count = Math.min(2 + Math.floor(difficulty / 2), 4);

    // Fill front positions, then back
    const frontCount = Math.min(Math.ceil(count / 2), 2);
    const backCount = count - frontCount;

    for (let i = 0; i < frontCount; i++) {
      const type = randomChoice(REGULAR_FRONT);
      const m = createMonster(type);
      m.position = i + 1;
      monsters.push(m);
    }
    for (let i = 0; i < backCount; i++) {
      const type = randomChoice(REGULAR_BACK);
      const m = createMonster(type);
      m.position = frontCount + i + 1;
      monsters.push(m);
    }
  }

  // Scale stats by difficulty
  if (difficulty > 1) {
    const scale = 1 + (difficulty - 1) * 0.15;
    for (const m of monsters) {
      if (!m.isBoss) {
        m.stats.maxHp = Math.round(m.stats.maxHp * scale);
        m.stats.hp = m.stats.maxHp;
        m.stats.attack = Math.round(m.stats.attack * scale);
      }
    }
  }

  return monsters;
}

export function getMonsterName(type: MonsterType): string {
  return MONSTER_TEMPLATES[type].name;
}
