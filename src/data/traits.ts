import type { Trait, TraitEffect, TraitCategory } from '../models/types.ts';
import { randomInt, randomChoice, shuffleArray } from '../utils/helpers.ts';

export const TRAIT_POOL: Trait[] = [
  // === Positive (8) ===
  {
    id: 'hard_hitter', name: '강타자', description: '공격력이 높다.',
    category: 'positive',
    effects: [{ type: 'stat_bonus', stat: 'attack', value: 2 }],
  },
  {
    id: 'quick_reflexes', name: '빠른 반사신경', description: '속도가 빠르다.',
    category: 'positive',
    effects: [{ type: 'stat_bonus', stat: 'speed', value: 2 }],
  },
  {
    id: 'tough', name: '강인함', description: '체력이 높다.',
    category: 'positive',
    effects: [{ type: 'stat_bonus', stat: 'maxHp', value: 5 }],
  },
  {
    id: 'eagle_eye', name: '매의 눈', description: '명중률이 높다.',
    category: 'positive',
    effects: [{ type: 'stat_bonus', stat: 'accuracy', value: 5 }],
  },
  {
    id: 'nimble', name: '날렵함', description: '회피력이 높다.',
    category: 'positive',
    effects: [{ type: 'stat_bonus', stat: 'dodge', value: 5 }],
  },
  {
    id: 'natural_crit', name: '천생 급소공격자', description: '치명타율이 높다.',
    category: 'positive',
    effects: [{ type: 'crit_bonus', value: 3 }],
  },
  {
    id: 'steady_mind', name: '평정심', description: '스트레스 피해를 덜 받는다.',
    category: 'positive',
    effects: [{ type: 'stress_modifier', value: -20, isPercent: true }],
  },
  {
    id: 'treasure_hunter', name: '보물 사냥꾼', description: '골드 획득이 증가한다.',
    category: 'positive',
    effects: [{ type: 'gold_modifier', value: 20, isPercent: true }],
  },

  // === Negative (6) ===
  {
    id: 'frail', name: '허약함', description: '체력이 낮다.',
    category: 'negative',
    effects: [{ type: 'stat_bonus', stat: 'maxHp', value: -4 }],
  },
  {
    id: 'clumsy', name: '서투름', description: '명중률이 낮다.',
    category: 'negative',
    effects: [{ type: 'stat_bonus', stat: 'accuracy', value: -5 }],
  },
  {
    id: 'slow', name: '굼뜨기', description: '속도가 느리다.',
    category: 'negative',
    effects: [{ type: 'stat_bonus', stat: 'speed', value: -2 }],
  },
  {
    id: 'nervous', name: '신경질적', description: '스트레스 피해를 더 받는다.',
    category: 'negative',
    effects: [{ type: 'stress_modifier', value: 25, isPercent: true }],
  },
  {
    id: 'weak', name: '나약함', description: '공격력이 낮다.',
    category: 'negative',
    effects: [{ type: 'stat_bonus', stat: 'attack', value: -2 }],
  },
  {
    id: 'glass_jaw', name: '유리턱', description: '방어력이 낮다.',
    category: 'negative',
    effects: [{ type: 'stat_bonus', stat: 'defense', value: -2 }],
  },

  // === Neutral (4) ===
  {
    id: 'night_owl', name: '야행성', description: '어둠 속에서 속도가 오른다.',
    category: 'neutral',
    effects: [{ type: 'stat_bonus', stat: 'speed', value: 3, condition: 'low_torch' }],
  },
  {
    id: 'boss_slayer', name: '보스 사냥꾼', description: '보스전에서 공격력이 오른다.',
    category: 'neutral',
    effects: [{ type: 'stat_bonus', stat: 'attack', value: 3, condition: 'boss_fight' }],
  },
  {
    id: 'cornered', name: '궁지의 힘', description: 'HP가 낮을 때 치명타가 오른다.',
    category: 'neutral',
    effects: [{ type: 'crit_bonus', value: 8, condition: 'low_hp' }],
  },
  {
    id: 'panic_strength', name: '공황의 힘', description: '스트레스가 높을 때 공격력이 오른다.',
    category: 'neutral',
    effects: [{ type: 'stat_bonus', stat: 'attack', value: 4, condition: 'high_stress' }],
  },
];

export function rollTraits(): Trait[] {
  const count = randomInt(1, 2);
  const shuffled = shuffleArray([...TRAIT_POOL]);
  // Ensure we don't give two traits of same category if count=2
  const result: Trait[] = [];
  const usedIds = new Set<string>();
  for (const trait of shuffled) {
    if (result.length >= count) break;
    if (usedIds.has(trait.id)) continue;
    usedIds.add(trait.id);
    result.push(trait);
  }
  return result;
}

export interface TraitBonuses {
  attack: number;
  defense: number;
  speed: number;
  accuracy: number;
  dodge: number;
  crit: number;
  maxHp: number;
  stressModifier: number; // percent modifier (e.g., -20 = -20%)
  goldModifier: number;   // percent modifier
}

export function getTraitStatBonuses(
  traits: Trait[],
  context?: { torchLevel?: number; isBoss?: boolean; hpPercent?: number; stress?: number }
): TraitBonuses {
  const bonuses: TraitBonuses = {
    attack: 0, defense: 0, speed: 0, accuracy: 0,
    dodge: 0, crit: 0, maxHp: 0,
    stressModifier: 0, goldModifier: 0,
  };

  for (const trait of traits) {
    for (const effect of trait.effects) {
      // Check condition
      if (effect.condition) {
        if (!context) continue;
        switch (effect.condition) {
          case 'low_torch':
            if ((context.torchLevel ?? 100) >= 25) continue;
            break;
          case 'boss_fight':
            if (!context.isBoss) continue;
            break;
          case 'low_hp':
            if ((context.hpPercent ?? 1) >= 0.3) continue;
            break;
          case 'high_stress':
            if ((context.stress ?? 0) < 50) continue;
            break;
        }
      }

      switch (effect.type) {
        case 'stat_bonus':
          if (effect.stat && effect.stat in bonuses) {
            (bonuses as any)[effect.stat] += effect.value;
          }
          break;
        case 'stress_modifier':
          bonuses.stressModifier += effect.value;
          break;
        case 'gold_modifier':
          bonuses.goldModifier += effect.value;
          break;
        case 'crit_bonus':
          bonuses.crit += effect.value;
          break;
      }
    }
  }

  return bonuses;
}

export function getTraitCategoryColor(category: TraitCategory): string {
  switch (category) {
    case 'positive': return 'green';
    case 'negative': return 'red';
    case 'neutral': return 'yellow';
  }
}
