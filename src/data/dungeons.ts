import type { Room, RoomType, MonsterType } from '../models/types.ts';
import { randomChoice, randomInt } from '../utils/helpers.ts';

const ROOM_DESCRIPTIONS: Record<RoomType, string[]> = {
  entrance: ['탑의 입구다. 차가운 공기가 스며든다.'],
  empty: [
    '텅 빈 방이다. 먼지만이 쌓여있다.',
    '아무것도 없는 복도다.',
    '바닥에 금이 간 돌 타일이 깔려있다.',
    '벽에 정체불명의 낙서가 있다.',
  ],
  combat: [
    '어둠 속에서 움직이는 그림자가 보인다!',
    '적이 기다리고 있었다!',
    '으르렁거리는 소리가 들린다...',
  ],
  treasure: [
    '빛나는 보물 상자가 있다!',
    '바닥에 금화가 흩어져 있다.',
    '오래된 상자 안에 무언가가 있다.',
  ],
  trap: [
    '바닥의 함정판이 삐걱거린다!',
    '천장에서 뭔가 떨어진다!',
    '독침 함정이 발동했다!',
  ],
  curio: [
    '이상한 제단이 있다.',
    '벽에 기묘한 부조가 새겨져 있다.',
    '신비로운 분수대가 있다.',
    '먼지 쌓인 책장이 있다.',
  ],
  boss: ['강력한 적의 기운이 느껴진다...'],
};

export function getStatMultiplier(floor: number): number {
  return 1.0 + (floor - 1) * 0.02;
}

export function getDifficulty(floor: number): number {
  return Math.ceil(floor / 10);
}

export function getMonsterPool(floor: number): MonsterType[] {
  const pool: MonsterType[] = [];

  // floor 1-10
  if (floor >= 1 && floor <= 10) {
    pool.push('bone_soldier', 'plague_rat', 'bone_archer');
  }
  // floor 8-20
  if (floor >= 8 && floor <= 20) {
    pool.push('shadow_lurker', 'cultist_brawler');
  }
  // floor 18-35
  if (floor >= 18 && floor <= 35) {
    pool.push('cultist_acolyte', 'madman', 'cursed_knight');
  }
  // floor 30-55
  if (floor >= 30 && floor <= 55) {
    pool.push('dark_mage', 'gargoyle', 'large_carrion_eater');
  }
  // floor 50-80
  if (floor >= 50 && floor <= 80) {
    pool.push('wraith');
  }
  // floor 70-100
  if (floor >= 70 && floor <= 100) {
    pool.push('bone_soldier', 'bone_archer', 'cultist_brawler', 'cultist_acolyte',
      'madman', 'shadow_lurker', 'plague_rat', 'cursed_knight', 'dark_mage',
      'gargoyle', 'large_carrion_eater', 'wraith', 'necromancer', 'bone_captain');
  }

  // Deduplicate
  return [...new Set(pool)];
}

export function getBossType(floor: number): MonsterType {
  if (floor === 10) return 'bone_captain';
  if (floor === 20) return 'large_carrion_eater';
  if (floor === 30) return 'cursed_knight';
  if (floor === 40) return 'gargoyle';
  if (floor === 50) return 'necromancer';
  if (floor === 60) return 'wraith';
  if (floor >= 70 && floor <= 90) {
    return randomChoice<MonsterType>(['necromancer', 'wraith', 'gargoyle', 'cursed_knight']);
  }
  if (floor === 100) return 'necromancer';
  // Default fallback for non-standard boss floors
  return 'bone_captain';
}

export function getMonsterCount(floor: number, partySize: number = 4): number {
  let base: number;
  if (floor <= 20) base = randomInt(2, 3);
  else if (floor <= 50) base = randomInt(3, 4);
  else base = randomInt(3, 5);
  return Math.max(1, base - (4 - partySize));
}

function generateCombatRoom(floor: number): Room {
  const pool = getMonsterPool(floor);
  const count = getMonsterCount(floor);
  const monsterTypes: MonsterType[] = [];
  for (let i = 0; i < count; i++) {
    monsterTypes.push(randomChoice(pool));
  }
  return {
    id: floor,
    type: 'combat',
    explored: true,
    cleared: false,
    description: randomChoice(ROOM_DESCRIPTIONS.combat),
    monsterTypes,
  };
}

function generateBossRoom(floor: number): Room {
  const bossType = getBossType(floor);
  const pool = getMonsterPool(floor);
  const minionCount = randomInt(1, 2);
  const monsterTypes: MonsterType[] = [bossType];
  for (let i = 0; i < minionCount; i++) {
    monsterTypes.push(randomChoice(pool));
  }
  return {
    id: floor,
    type: 'boss',
    explored: true,
    cleared: false,
    description: randomChoice(ROOM_DESCRIPTIONS.boss),
    monsterTypes,
  };
}

function generateTreasureRoom(floor: number): Room {
  return {
    id: floor,
    type: 'treasure',
    explored: true,
    cleared: false,
    description: randomChoice(ROOM_DESCRIPTIONS.treasure),
  };
}

function generateEmptyRoom(floor: number): Room {
  return {
    id: floor,
    type: 'empty',
    explored: true,
    cleared: false,
    description: randomChoice(ROOM_DESCRIPTIONS.empty),
  };
}

function generateCurioRoom(floor: number): Room {
  return {
    id: floor,
    type: 'curio',
    explored: true,
    cleared: false,
    description: randomChoice(ROOM_DESCRIPTIONS.curio),
  };
}

function generateTrapRoom(floor: number): Room {
  const diff = Math.ceil(floor / 10);
  return {
    id: floor,
    type: 'trap',
    explored: true,
    cleared: false,
    description: randomChoice(ROOM_DESCRIPTIONS.trap),
    trapDamage: randomInt(3, 8) + diff * 2,
  };
}

export function generateFloor(floor: number): Room {
  // Every 10th floor is a boss
  if (floor % 10 === 0) return generateBossRoom(floor);

  // Room type distribution
  const roll = Math.random() * 100;
  if (roll < 50) return generateCombatRoom(floor);      // 50% combat
  if (roll < 65) return generateTreasureRoom(floor);     // 15% treasure
  if (roll < 78) return generateEmptyRoom(floor);        // 13% empty
  if (roll < 88) return generateCurioRoom(floor);        // 10% curio
  return generateTrapRoom(floor);                         // 12% trap
}
