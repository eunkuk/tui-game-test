import type { Item } from '../models/types.ts';
import { randomInt, randomChoice, percentChance } from '../utils/helpers.ts';
import { SUPPLY_ITEMS, POTION_ITEMS, SHOP_WEAPONS, SHOP_ARMOR, SHOP_TRINKETS, createItemCopy } from '../data/items.ts';

// Generate loot for combat victory based on floor number
export function generateCombatLoot(floor: number): { items: Item[]; gold: number } {
  // Gold scales with floor
  let gold = 30 + floor * 8 + randomInt(0, 50);

  const items: Item[] = [];
  const itemRolls = randomInt(1, 3);

  // Floor-based rarity bonus
  let rarityBonus = 0;
  if (floor > 50) rarityBonus = 20;
  else if (floor > 20) rarityBonus = 10;

  const totalBonus = rarityBonus;

  for (let i = 0; i < itemRolls; i++) {
    const roll = randomInt(1, 100);

    if (roll <= 5 + totalBonus) {
      // Rare item
      const pool = [...SHOP_WEAPONS.filter(w => w.rarity === 'rare'), ...SHOP_ARMOR.filter(a => a.rarity === 'rare'), ...SHOP_TRINKETS.filter(t => t.rarity === 'rare')];
      if (pool.length > 0) {
        items.push(createItemCopy(randomChoice(pool)));
      }
    } else if (roll <= 20 + totalBonus) {
      // Uncommon item
      const pool = [...SHOP_WEAPONS.filter(w => w.rarity === 'uncommon'), ...SHOP_ARMOR.filter(a => a.rarity === 'uncommon'), ...SHOP_TRINKETS.filter(t => t.rarity === 'uncommon')];
      if (pool.length > 0) {
        items.push(createItemCopy(randomChoice(pool)));
      }
    } else if (roll <= 50) {
      // Common supply item
      items.push(createItemCopy(randomChoice(SUPPLY_ITEMS)));
    } else if (roll <= 65) {
      // Potion drop (15%)
      items.push(createItemCopy(randomChoice(POTION_ITEMS)));
    }
    // else: no item this roll
  }

  return { items, gold };
}

// Generate boss loot - guaranteed rare+ item, more gold
export function generateBossLoot(floor: number): { items: Item[]; gold: number } {
  const gold = floor * 25 + randomInt(100, 300);
  const items: Item[] = [];

  // Guaranteed rare+ item
  const legendaryPool = SHOP_TRINKETS.filter(t => t.rarity === 'legendary');
  const rarePool = [
    ...SHOP_WEAPONS.filter(w => w.rarity === 'rare'),
    ...SHOP_ARMOR.filter(a => a.rarity === 'rare'),
    ...SHOP_TRINKETS.filter(t => t.rarity === 'rare'),
  ];

  // Higher floors = more legendary chance: base 20% + floor/5
  const legendaryChance = Math.min(50, 20 + Math.floor(floor / 5));
  if (percentChance(legendaryChance) && legendaryPool.length > 0) {
    items.push(createItemCopy(randomChoice(legendaryPool)));
  } else if (rarePool.length > 0) {
    items.push(createItemCopy(randomChoice(rarePool)));
  }

  // Additional 1-2 items (uncommon+)
  const extraRolls = randomInt(1, 2);
  for (let i = 0; i < extraRolls; i++) {
    const roll = randomInt(1, 100);
    if (roll <= 30) {
      if (rarePool.length > 0) items.push(createItemCopy(randomChoice(rarePool)));
    } else if (roll <= 70) {
      const uncommonPool = [
        ...SHOP_WEAPONS.filter(w => w.rarity === 'uncommon'),
        ...SHOP_ARMOR.filter(a => a.rarity === 'uncommon'),
        ...SHOP_TRINKETS.filter(t => t.rarity === 'uncommon'),
      ];
      if (uncommonPool.length > 0) items.push(createItemCopy(randomChoice(uncommonPool)));
    } else {
      // 50% potion, 50% supply
      if (percentChance(50)) {
        items.push(createItemCopy(randomChoice(POTION_ITEMS)));
      } else {
        items.push(createItemCopy(randomChoice(SUPPLY_ITEMS)));
      }
    }
  }

  return { items, gold };
}

// Generate treasure room loot
export function generateTreasureLoot(floor: number): { items: Item[]; gold: number } {
  const gold = 30 + floor * 10 + randomInt(50, 150);

  const items: Item[] = [];
  const itemCount = randomInt(1, 3);

  for (let i = 0; i < itemCount; i++) {
    const roll = randomInt(1, 100);

    if (roll <= 10) {
      const legendaryPool = SHOP_TRINKETS.filter(t => t.rarity === 'legendary');
      const rarePool = [...SHOP_WEAPONS.filter(w => w.rarity === 'rare'), ...SHOP_ARMOR.filter(a => a.rarity === 'rare'), ...SHOP_TRINKETS.filter(t => t.rarity === 'rare')];
      const pool = roll <= 3 && legendaryPool.length > 0 ? legendaryPool : rarePool;
      if (pool.length > 0) {
        items.push(createItemCopy(randomChoice(pool)));
      }
    } else if (roll <= 35) {
      const pool = [...SHOP_WEAPONS.filter(w => w.rarity === 'uncommon'), ...SHOP_ARMOR.filter(a => a.rarity === 'uncommon'), ...SHOP_TRINKETS.filter(t => t.rarity === 'uncommon')];
      if (pool.length > 0) {
        items.push(createItemCopy(randomChoice(pool)));
      }
    } else if (roll <= 60) {
      const pool = [...SHOP_WEAPONS.filter(w => w.rarity === 'common'), ...SHOP_ARMOR.filter(a => a.rarity === 'common')];
      if (pool.length > 0) {
        items.push(createItemCopy(randomChoice(pool)));
      }
    } else if (roll <= 80) {
      // Supply (61-80)
      items.push(createItemCopy(randomChoice(SUPPLY_ITEMS)));
    } else {
      // Potion (81-100)
      items.push(createItemCopy(randomChoice(POTION_ITEMS)));
    }
  }

  return { items, gold };
}

// Generate curio interaction result
export function generateCurioResult(): { items: Item[]; gold: number; damage: number; description: string } {
  const items: Item[] = [];
  let gold = 0;
  let damage = 0;
  let description = '';

  if (percentChance(50)) {
    const outcome = randomInt(1, 3);
    switch (outcome) {
      case 1:
        gold = randomInt(30, 100);
        description = '숨겨진 금화를 발견했습니다!';
        break;
      case 2:
        if (percentChance(50)) {
          items.push(createItemCopy(randomChoice(POTION_ITEMS)));
          description = '물약을 발견했습니다!';
        } else {
          items.push(createItemCopy(randomChoice(SUPPLY_ITEMS)));
          description = '유용한 물품을 발견했습니다!';
        }
        break;
      case 3:
        gold = randomInt(20, 60);
        description = '숨겨진 금화를 발견했습니다!';
        break;
    }
  } else {
    const outcome = randomInt(1, 3);
    switch (outcome) {
      case 1:
        damage = randomInt(5, 12);
        description = '함정이 작동했습니다!';
        break;
      case 2:
        damage = randomInt(3, 8);
        description = '끔찍한 환상을 보았습니다...';
        break;
      case 3:
        damage = randomInt(3, 8);
        description = '저주받은 물건이었습니다!';
        break;
    }
  }

  return { items, gold, damage, description };
}
