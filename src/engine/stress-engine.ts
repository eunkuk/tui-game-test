import type { Hero, AfflictionType, VirtueType } from '../models/types.ts';
import { percentChance, randomChoice, clamp } from '../utils/helpers.ts';

const AFFLICTIONS: AfflictionType[] = ['hopeless', 'fearful', 'paranoid', 'selfish', 'abusive'];
const VIRTUES: VirtueType[] = ['courageous', 'focused', 'powerful', 'stalwart', 'vigorous'];

const AFFLICTION_NAMES: Record<AfflictionType | VirtueType, string> = {
  hopeless: '절망',
  fearful: '공포',
  paranoid: '편집증',
  selfish: '이기심',
  abusive: '학대',
  courageous: '용기',
  focused: '집중',
  powerful: '강인',
  stalwart: '견고',
  vigorous: '활력',
};

export function getAfflictionName(type: AfflictionType | VirtueType): string {
  return AFFLICTION_NAMES[type] ?? type;
}

export function applyStress(hero: Hero, amount: number): { hero: Hero; log: string[] } {
  const log: string[] = [];
  let newStress = clamp(hero.stats.stress + amount, 0, 200);
  let updatedHero: Hero = { ...hero, stats: { ...hero.stats, stress: newStress } };

  if (amount > 0) {
    log.push(`${hero.name}의 스트레스 +${amount} (${newStress})`);
  } else if (amount < 0) {
    log.push(`${hero.name}의 스트레스 ${amount} (${newStress})`);
  }

  // Check affliction threshold at 100
  if (newStress >= 100 && hero.stats.stress < 100 && !hero.affliction && !hero.virtue) {
    const result = checkAffliction(updatedHero);
    updatedHero = result.hero;
    log.push(...result.log);
  }

  // Heart attack at 200
  if (newStress >= 200) {
    log.push(`${hero.name}이(가) 심장마비를 일으켰습니다!`);
    if (updatedHero.isDeathsDoor) {
      // Already on Death's Door - instant death
      updatedHero = { ...updatedHero, stats: { ...updatedHero.stats, hp: 0 } };
      log.push(`${hero.name}이(가) 심장마비로 사망했습니다!`);
    } else {
      // Enter Death's Door
      updatedHero = {
        ...updatedHero,
        stats: { ...updatedHero.stats, hp: 0 },
        isDeathsDoor: true,
      };
      log.push(`${hero.name}이(가) 죽음의 문턱에 섰습니다!`);
    }
  }

  return { hero: updatedHero, log };
}

export function checkAffliction(hero: Hero): { hero: Hero; log: string[] } {
  const log: string[] = [];

  if (percentChance(25)) {
    // Virtue!
    const virtue = randomChoice(VIRTUES);
    log.push(`[미덕] ${hero.name}이(가) ${getAfflictionName(virtue)}의 미덕을 얻었습니다!`);
    return {
      hero: { ...hero, virtue, affliction: undefined },
      log,
    };
  } else {
    // Affliction
    const affliction = randomChoice(AFFLICTIONS);
    log.push(`[고통] ${hero.name}이(가) ${getAfflictionName(affliction)}에 빠졌습니다!`);
    return {
      hero: { ...hero, affliction, virtue: undefined },
      log,
    };
  }
}

export function getAfflictionModifiers(type: AfflictionType): Record<string, number> {
  switch (type) {
    case 'hopeless':
      return { attack: -2, accuracy: -10 };
    case 'fearful':
      return { speed: -2, dodge: -10 };
    case 'paranoid':
      return { dodge: -3 };
    case 'selfish':
      return {};
    case 'abusive':
      return {};
    default:
      return {};
  }
}

export function getVirtueModifiers(type: VirtueType): Record<string, number> {
  switch (type) {
    case 'courageous':
      return { attack: 3, accuracy: 10 };
    case 'focused':
      return { crit: 5, accuracy: 5 };
    case 'powerful':
      return { attack: 4 };
    case 'stalwart':
      return { defense: 3, dodge: 15 };
    case 'vigorous':
      return {};
    default:
      return {};
  }
}

export function processAfflictionBehavior(hero: Hero): { action: string; log: string[] } | null {
  if (!hero.affliction) return null;
  if (!percentChance(33)) return null;

  const log: string[] = [];

  switch (hero.affliction) {
    case 'fearful':
      log.push(`${hero.name}이(가) 공포에 질려 행동하지 못합니다!`);
      return { action: 'skip', log };

    case 'hopeless':
      log.push(`${hero.name}이(가) 절망에 빠져 행동을 거부합니다!`);
      return { action: 'skip', log };

    case 'paranoid':
      log.push(`${hero.name}이(가) 편집증으로 아군을 의심합니다!`);
      return { action: 'attack_random', log };

    case 'selfish':
      log.push(`${hero.name}이(가) 이기적으로 행동합니다!`);
      return { action: 'skip', log };

    case 'abusive':
      log.push(`${hero.name}이(가) 동료들을 모욕합니다! (파티 스트레스 +5)`);
      return { action: 'stress_party', log };

    default:
      return null;
  }
}
