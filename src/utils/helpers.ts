import { RNG } from 'rot-js';

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function randomInt(min: number, max: number): number {
  return Math.floor(RNG.getUniform() * (max - min + 1)) + min;
}

export function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(RNG.getUniform() * arr.length)]!;
}

export function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(RNG.getUniform() * (i + 1));
    [result[i], result[j]] = [result[j]!, result[i]!];
  }
  return result;
}

export function formatBar(current: number, max: number, width: number, fillChar = '█', emptyChar = '░'): string {
  const ratio = Math.max(0, current) / max;
  const filled = Math.round(ratio * width);
  return fillChar.repeat(filled) + emptyChar.repeat(width - filled);
}

export function padCenter(text: string, width: number): string {
  if (text.length >= width) return text.substring(0, width);
  const left = Math.floor((width - text.length) / 2);
  const right = width - text.length - left;
  return ' '.repeat(left) + text + ' '.repeat(right);
}

export function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.substring(0, maxLen - 2) + '..';
}

export function percentChance(percent: number): boolean {
  return RNG.getUniform() * 100 < percent;
}

const STAT_KOREAN: Record<string, string> = {
  attack: '공', defense: '방', speed: '속', accuracy: '명',
  dodge: '회', crit: '치', maxHp: 'HP',
};

export function formatEquipComparison(newItem: { modifiers: { stat: string; value: number }[] }, equippedItem: { modifiers: { stat: string; value: number }[] } | undefined): string {
  const newMods: Record<string, number> = {};
  const oldMods: Record<string, number> = {};
  for (const m of newItem.modifiers) newMods[m.stat] = (newMods[m.stat] || 0) + m.value;
  if (equippedItem) {
    for (const m of equippedItem.modifiers) oldMods[m.stat] = (oldMods[m.stat] || 0) + m.value;
  }
  const allStats = new Set([...Object.keys(newMods), ...Object.keys(oldMods)]);
  const parts: string[] = [];
  for (const stat of allStats) {
    const diff = (newMods[stat] || 0) - (oldMods[stat] || 0);
    if (diff === 0) continue;
    const label = STAT_KOREAN[stat] || stat;
    if (diff > 0) {
      parts.push(`{green-fg}${label}↑${diff}{/green-fg}`);
    } else {
      parts.push(`{red-fg}${label}↓${Math.abs(diff)}{/red-fg}`);
    }
  }
  return parts.join(' ');
}
