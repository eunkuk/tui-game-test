import type { Item, ItemRarity } from '../models/types.ts';
import { generateId, randomChoice, shuffleArray, randomInt } from '../utils/helpers.ts';

export function createItemCopy(item: Item): Item {
  return { ...item, id: generateId(), modifiers: item.modifiers.map(m => ({ ...m })) };
}

// ============================================================
// SUPPLY ITEMS (consumable)
// ============================================================
export const SUPPLY_ITEMS: Item[] = [
  {
    id: 'torch', name: '횃불', type: 'supply', rarity: 'common',
    description: '어둠을 밝힌다. 횃불 레벨을 25 증가.',
    modifiers: [], value: 75, consumable: true, torchAmount: 25,
  },
  {
    id: 'food', name: '식량', type: 'supply', rarity: 'common',
    description: '배고픔을 해소한다. HP 10 회복.',
    modifiers: [], value: 75, consumable: true, healAmount: 10,
  },
  {
    id: 'bandage', name: '붕대', type: 'supply', rarity: 'common',
    description: '출혈을 치료하고 HP를 약간 회복한다.',
    modifiers: [], value: 100, consumable: true, healAmount: 5,
  },
  {
    id: 'antivenom', name: '해독제', type: 'supply', rarity: 'common',
    description: '역병을 치료하고 HP를 약간 회복한다.',
    modifiers: [], value: 100, consumable: true, healAmount: 5,
  },
  {
    id: 'holy_water', name: '성수', type: 'supply', rarity: 'uncommon',
    description: '스트레스를 줄여준다.',
    modifiers: [], value: 150, consumable: true, stressHealAmount: 10,
  },
  {
    id: 'medicinal_herbs', name: '약초', type: 'supply', rarity: 'uncommon',
    description: 'HP를 크게 회복한다.',
    modifiers: [], value: 200, consumable: true, healAmount: 20,
  },
];

// ============================================================
// POTIONS (consumable)
// ============================================================
export const POTION_ITEMS: Item[] = [
  {
    id: 'hp_potion_s', name: '소형 체력 물약', type: 'potion', rarity: 'common',
    description: '체력을 약간 회복하는 물약.',
    modifiers: [], value: 120, consumable: true, healAmount: 15,
  },
  {
    id: 'hp_potion_l', name: '대형 체력 물약', type: 'potion', rarity: 'uncommon',
    description: '체력을 크게 회복하는 물약.',
    modifiers: [], value: 300, consumable: true, healAmount: 35,
  },
  {
    id: 'stress_potion', name: '진정제', type: 'potion', rarity: 'uncommon',
    description: '마음을 안정시키는 약.',
    modifiers: [], value: 250, consumable: true, stressHealAmount: 20,
  },
  {
    id: 'attack_potion', name: '힘의 물약', type: 'potion', rarity: 'uncommon',
    description: '일시적으로 공격력을 높인다.',
    modifiers: [], value: 280, consumable: true,
    buffEffect: { stat: 'attack', value: 3, duration: 3 },
  },
  {
    id: 'defense_potion', name: '방어의 물약', type: 'potion', rarity: 'uncommon',
    description: '일시적으로 방어력을 높인다.',
    modifiers: [], value: 280, consumable: true,
    buffEffect: { stat: 'defense', value: 3, duration: 3 },
  },
  {
    id: 'speed_potion', name: '신속의 물약', type: 'potion', rarity: 'rare',
    description: '일시적으로 속도를 높인다.',
    modifiers: [], value: 350, consumable: true,
    buffEffect: { stat: 'speed', value: 3, duration: 3 },
  },
  {
    id: 'full_restore', name: '완전 회복약', type: 'potion', rarity: 'rare',
    description: 'HP를 완전히 회복하고 스트레스를 줄인다.',
    modifiers: [], value: 600, consumable: true, healAmount: 999, stressHealAmount: 30,
  },
  {
    id: 'elixir', name: '영웅의 영약', type: 'potion', rarity: 'legendary',
    description: '전설적인 영약. HP 회복과 공격력 강화.',
    modifiers: [], value: 1200, consumable: true, healAmount: 50,
    buffEffect: { stat: 'attack', value: 5, duration: 5 },
  },
];

// ============================================================
// WEAPONS
// ============================================================
export const SHOP_WEAPONS: Item[] = [
  {
    id: 'rusty_sword', name: '녹슨 검', type: 'weapon', rarity: 'common',
    description: '낡은 검. 공격력을 약간 올린다.',
    modifiers: [{ stat: 'attack', value: 1 }], value: 100,
  },
  {
    id: 'iron_blade', name: '철 칼날', type: 'weapon', rarity: 'common',
    description: '무난한 무기.',
    modifiers: [{ stat: 'attack', value: 2 }], value: 200,
  },
  {
    id: 'steel_sword', name: '강철 검', type: 'weapon', rarity: 'uncommon',
    description: '튼튼한 강철 검.',
    modifiers: [{ stat: 'attack', value: 3 }, { stat: 'crit', value: 2 }], value: 400,
  },
  {
    id: 'hunters_pistol', name: '사냥꾼의 권총', type: 'weapon', rarity: 'uncommon',
    description: '정밀한 권총.',
    modifiers: [{ stat: 'attack', value: 4 }, { stat: 'crit', value: 3 }], value: 500,
  },
  {
    id: 'holy_mace', name: '신성한 철퇴', type: 'weapon', rarity: 'rare',
    description: '축복받은 무기.',
    modifiers: [{ stat: 'attack', value: 5 }, { stat: 'accuracy', value: 5 }], value: 800,
  },
  {
    id: 'plague_blade', name: '역병의 칼날', type: 'weapon', rarity: 'rare',
    description: '독이 발린 칼.',
    modifiers: [{ stat: 'attack', value: 6 }, { stat: 'speed', value: 2 }], value: 1000,
  },
];

// ============================================================
// ARMOR
// ============================================================
export const SHOP_ARMOR: Item[] = [
  {
    id: 'padded_vest', name: '누비 조끼', type: 'armor', rarity: 'common',
    description: '기본적인 보호를 제공한다.',
    modifiers: [{ stat: 'defense', value: 1 }], value: 100,
  },
  {
    id: 'leather_armor', name: '가죽 갑옷', type: 'armor', rarity: 'common',
    description: '가벼운 가죽 갑옷.',
    modifiers: [{ stat: 'defense', value: 2 }, { stat: 'dodge', value: 3 }], value: 200,
  },
  {
    id: 'chain_mail', name: '사슬 갑옷', type: 'armor', rarity: 'uncommon',
    description: '튼튼한 사슬 갑옷.',
    modifiers: [{ stat: 'defense', value: 3 }, { stat: 'maxHp', value: 5 }], value: 400,
  },
  {
    id: 'cleric_vestments', name: '성직자 법복', type: 'armor', rarity: 'uncommon',
    description: '축복받은 법복.',
    modifiers: [{ stat: 'defense', value: 2 }, { stat: 'dodge', value: 5 }, { stat: 'maxHp', value: 3 }], value: 500,
  },
  {
    id: 'plate_armor', name: '판금 갑옷', type: 'armor', rarity: 'rare',
    description: '무거운 판금 갑옷.',
    modifiers: [{ stat: 'defense', value: 5 }, { stat: 'maxHp', value: 10 }, { stat: 'speed', value: -2 }], value: 900,
  },
];

// ============================================================
// TRINKETS
// ============================================================
export const SHOP_TRINKETS: Item[] = [
  {
    id: 'sun_ring', name: '태양의 반지', type: 'trinket', rarity: 'uncommon',
    description: '명중과 치명타를 높여준다.',
    modifiers: [{ stat: 'accuracy', value: 10 }, { stat: 'crit', value: 5 }], value: 450,
  },
  {
    id: 'moon_cloak', name: '달빛 망토', type: 'trinket', rarity: 'uncommon',
    description: '회피와 속도를 높여준다.',
    modifiers: [{ stat: 'dodge', value: 10 }, { stat: 'speed', value: 2 }], value: 500,
  },
  {
    id: 'blood_charm', name: '피의 부적', type: 'trinket', rarity: 'rare',
    description: '피의 힘을 빌린다. 공격력은 높지만 회피가 감소한다.',
    modifiers: [{ stat: 'attack', value: 3 }, { stat: 'dodge', value: -5 }], value: 600,
  },
  {
    id: 'holy_relic', name: '신성한 유물', type: 'trinket', rarity: 'rare',
    description: '성녀 전용. 신성한 힘을 증폭시킨다.',
    modifiers: [{ stat: 'accuracy', value: 5 }, { stat: 'speed', value: 1 }, { stat: 'maxHp', value: 5 }], value: 750,
  },
  {
    id: 'warriors_bracer', name: '전사의 팔찌', type: 'trinket', rarity: 'uncommon',
    description: '힘을 증폭시킨다.',
    modifiers: [{ stat: 'attack', value: 2 }, { stat: 'defense', value: 1 }], value: 400,
  },
  {
    id: 'sacred_scroll', name: '신성한 두루마리', type: 'trinket', rarity: 'legendary',
    description: '고대의 성스러운 지식이 담긴 두루마리.',
    modifiers: [{ stat: 'accuracy', value: 10 }, { stat: 'attack', value: 4 }, { stat: 'speed', value: 2 }], value: 1500,
  },
];

// ============================================================
// SHOP HELPER
// ============================================================
export function getShopItems(): Item[] {
  const supplies = SUPPLY_ITEMS.map(item => createItemCopy(item));

  const potions = shuffleArray(POTION_ITEMS).slice(0, 3).map(item => createItemCopy(item));
  const weapons = shuffleArray(SHOP_WEAPONS).slice(0, 3).map(item => createItemCopy(item));
  const armor = shuffleArray(SHOP_ARMOR).slice(0, 2).map(item => createItemCopy(item));
  const trinkets = shuffleArray(SHOP_TRINKETS).slice(0, 2).map(item => createItemCopy(item));

  return [...supplies, ...potions, ...weapons, ...armor, ...trinkets];
}
