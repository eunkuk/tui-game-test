import type { PrestigeUpgrade, PrestigeUpgradeId, PrestigeState } from '../models/types.ts';

export const PRESTIGE_UPGRADES: PrestigeUpgrade[] = [
  { id: 'start_gold_100', name: '시작 골드 +100', description: '새 게임 시 골드 600으로 시작', cost: 50 },
  { id: 'start_gold_200', name: '시작 골드 +200', description: '새 게임 시 골드 800으로 시작 (중첩)', cost: 100, requires: 'start_gold_100' },
  { id: 'recruit_discount_50', name: '모집 할인 I', description: '영웅 모집 비용 250G', cost: 80 },
  { id: 'recruit_discount_100', name: '모집 할인 II', description: '영웅 모집 비용 150G (중첩)', cost: 150, requires: 'recruit_discount_50' },
  { id: 'start_potions', name: '시작 물약', description: '치유 물약 2개 지급', cost: 60 },
  { id: 'exp_bonus_10', name: '경험치 +10%', description: '전투 경험치 x1.1', cost: 100 },
  { id: 'exp_bonus_20', name: '경험치 +20%', description: '전투 경험치 x1.2 (중첩)', cost: 200, requires: 'exp_bonus_10' },
  { id: 'max_roster_14', name: '대기소 확장', description: '최대 영웅 12→14명', cost: 150 },
];

export function calculatePrestigeGain(maxFloor: number, bossKills: number, week: number): number {
  return maxFloor * 2 + bossKills * 10 + week;
}

export function hasPrestigeUpgrade(prestige: PrestigeState, upgradeId: PrestigeUpgradeId): boolean {
  return prestige.purchased.includes(upgradeId);
}

export function getRecruitCost(prestige: PrestigeState): number {
  if (hasPrestigeUpgrade(prestige, 'recruit_discount_100')) return 150;
  if (hasPrestigeUpgrade(prestige, 'recruit_discount_50')) return 250;
  return 300;
}

export function getStartGold(prestige: PrestigeState): number {
  let gold = 500;
  if (hasPrestigeUpgrade(prestige, 'start_gold_100')) gold += 100;
  if (hasPrestigeUpgrade(prestige, 'start_gold_200')) gold += 200;
  return gold;
}

export function getMaxRoster(prestige: PrestigeState): number {
  return hasPrestigeUpgrade(prestige, 'max_roster_14') ? 14 : 12;
}

export function canBuyUpgrade(prestige: PrestigeState, upgrade: PrestigeUpgrade): boolean {
  if (prestige.purchased.includes(upgrade.id)) return false;
  if (prestige.points < upgrade.cost) return false;
  if (upgrade.requires && !prestige.purchased.includes(upgrade.requires)) return false;
  return true;
}
