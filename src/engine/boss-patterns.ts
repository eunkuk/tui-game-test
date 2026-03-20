import type { CombatState, Monster, Hero, StatusEffect, GridPosition } from '../models/types.ts';
import { percentChance, randomInt, randomChoice } from '../utils/helpers.ts';
import { findEmptyGridCell, gridPosEqual } from '../utils/grid.ts';

interface BossPatternResult {
  combat: CombatState;
  log: string[];
  skipNormalAction: boolean;
}

// Track one-time pattern usage per combat (keyed by monster id)
const usedPatterns = new Set<string>();

export function resetBossPatterns(): void {
  usedPatterns.clear();
}

export function executeBossPattern(
  combat: CombatState,
  monster: Monster,
): BossPatternResult | null {
  if (!monster.isBoss) return null;

  switch (monster.type) {
    case 'bone_captain':
      return boneCommanderPattern(combat, monster);
    case 'necromancer':
      return necromancerPattern(combat, monster);
    case 'large_carrion_eater':
      return carrionEaterPattern(combat, monster);
    case 'frost_titan':
      return frostTitanPattern(combat, monster);
    case 'flame_demon':
      return flameDemonPattern(combat, monster);
    case 'void_lord':
      return voidLordPattern(combat, monster);
    default:
      return null;
  }
}

// bone_captain: HP <= 50%, 1 time => all allies +5 attack for 3 turns
function boneCommanderPattern(combat: CombatState, monster: Monster): BossPatternResult | null {
  const key = `bone_captain_${monster.id}`;
  if (usedPatterns.has(key)) return null;
  if (monster.stats.hp / monster.stats.maxHp > 0.5) return null;

  usedPatterns.add(key);
  const log: string[] = [];
  log.push(`{bold}{red-fg}${monster.name}: "최후의 명령!"{/red-fg}{/bold}`);

  const newMonsters = combat.monsters.map(m => {
    if (m.stats.hp <= 0) return m;
    const newEffect: StatusEffect = {
      type: 'buff_attack', duration: 3, value: 5, source: '최후의 명령',
    };
    const newEffects = m.statusEffects.filter(e => !(e.type === 'buff_attack' && e.source === '최후의 명령'));
    newEffects.push(newEffect);
    return { ...m, statusEffects: newEffects };
  });
  log.push('적 전체의 공격력이 상승했다!');

  return {
    combat: { ...combat, monsters: newMonsters },
    log,
    skipNormalAction: true,
  };
}

// necromancer: HP <= 30%, 1 time => summon bone_soldier
function necromancerPattern(combat: CombatState, monster: Monster): BossPatternResult | null {
  const key = `necromancer_${monster.id}`;
  if (usedPatterns.has(key)) return null;
  if (monster.stats.hp / monster.stats.maxHp > 0.3) return null;

  usedPatterns.add(key);
  const log: string[] = [];
  log.push(`{bold}{red-fg}${monster.name}: "죽은 자여, 일어나라!"{/red-fg}{/bold}`);

  // Find empty position on 3x3 grid
  const aliveMonsters = combat.monsters.filter(m => m.stats.hp > 0);
  const summonPos = findEmptyGridCell(aliveMonsters, [1]) || { row: 1, col: 1 };

  const summon: Monster = {
    id: Math.random().toString(36).substring(2, 9),
    name: '소환된 해골 병사',
    type: 'bone_soldier',
    stats: {
      maxHp: Math.round(monster.stats.maxHp * 0.3),
      hp: Math.round(monster.stats.maxHp * 0.3),
      attack: Math.round(monster.stats.attack * 0.7),
      defense: 2,
      speed: 3,
      accuracy: 80,
      dodge: 5,
      crit: 3,
    },
    skills: [{
      id: 'summoned_slash', name: '뼈 칼날', description: '',
      useCols: [1], targetCols: [1],
      targetCount: 1, targetAlly: false,
      damage: { min: 0.9, max: 1.1 }, accuracy: 0, crit: 3,
    }],
    position: summonPos,
    size: 'small',
    statusEffects: [],
    isBoss: false,
  };

  const newMonsters = [...combat.monsters, summon];
  // Add to turn order
  const newTurnOrder = [...combat.turnOrder, {
    id: summon.id, isHero: false,
    speed: summon.stats.speed + randomInt(1, 8), done: false,
  }];

  log.push(`해골 병사가 소환되었다!`);

  return {
    combat: { ...combat, monsters: newMonsters, turnOrder: newTurnOrder },
    log,
    skipNormalAction: true,
  };
}

// large_carrion_eater: every turn, if a kill happened this round => heal 20% HP
function carrionEaterPattern(combat: CombatState, monster: Monster): BossPatternResult | null {
  // Check if any hero died this round (hp <= 0 and not deathsDoor alive)
  const deadHeroes = combat.heroes.filter(h => h.stats.hp <= 0 && !h.isDeathsDoor);
  if (deadHeroes.length === 0) return null;

  const log: string[] = [];
  const healAmount = Math.round(monster.stats.maxHp * 0.2);
  const newHp = Math.min(monster.stats.maxHp, monster.stats.hp + healAmount);

  log.push(`{bold}{red-fg}${monster.name}이(가) 시체를 포식하여 HP ${healAmount} 회복!{/red-fg}{/bold}`);

  const newMonsters = combat.monsters.map(m =>
    m.id === monster.id ? { ...m, stats: { ...m.stats, hp: newHp } } : m
  );

  return {
    combat: { ...combat, monsters: newMonsters },
    log,
    skipNormalAction: false, // still does normal attack
  };
}

// frost_titan: every 3rd round => 30% stun all heroes + speed debuff 2 turns
function frostTitanPattern(combat: CombatState, monster: Monster): BossPatternResult | null {
  if (combat.round % 3 !== 0) return null;
  // Only trigger once per round
  const key = `frost_titan_r${combat.round}_${monster.id}`;
  if (usedPatterns.has(key)) return null;
  usedPatterns.add(key);

  const log: string[] = [];
  log.push(`{bold}{cyan-fg}${monster.name}: "빙결의 파도!"{/cyan-fg}{/bold}`);

  const newHeroes = combat.heroes.map(h => {
    if (h.stats.hp <= 0) return h;
    // Remove existing debuff_speed from this source before adding
    let newEffects = h.statusEffects.filter(e => !(e.type === 'debuff_speed' && e.source === '빙결의 파도'));
    let updated = { ...h, statusEffects: newEffects };

    // 30% stun
    if (percentChance(30)) {
      updated.statusEffects = [...updated.statusEffects, {
        type: 'stun' as const, duration: 1, value: 0, source: '빙결의 파도',
      }];
      log.push(`${h.name}이(가) 빙결되었다!`);
    }
    // speed debuff (갱신)
    updated.statusEffects = [...updated.statusEffects, {
      type: 'debuff_speed' as const, duration: 2, value: -3, source: '빙결의 파도',
    }];
    return updated;
  });

  log.push('아군 전체의 속도가 감소했다!');

  return {
    combat: { ...combat, heroes: newHeroes },
    log,
    skipNormalAction: true,
  };
}

// flame_demon: every turn => random hero bleed(2, 3 turns)
function flameDemonPattern(combat: CombatState, monster: Monster): BossPatternResult | null {
  const log: string[] = [];
  const aliveHeroes = combat.heroes.filter(h => h.stats.hp > 0 || h.isDeathsDoor);
  if (aliveHeroes.length === 0) return null;

  const target = randomChoice(aliveHeroes);
  log.push(`{bold}{red-fg}${monster.name}의 화염이 ${target.name}을(를) 감쌌다!{/red-fg}{/bold}`);

  const newHeroes = combat.heroes.map(h => {
    if (h.id === target.id) {
      // Remove existing bleed from this source, then add fresh
      const filtered = h.statusEffects.filter(e => !(e.type === 'bleed' && e.source === '화염의 쇄도'));
      return {
        ...h,
        statusEffects: [...filtered, {
          type: 'bleed' as const, duration: 3, value: 2, source: '화염의 쇄도',
        }],
      };
    }
    return h;
  });

  log.push(`${target.name}에게 출혈 효과!`);

  return {
    combat: { ...combat, heroes: newHeroes },
    log,
    skipNormalAction: false,
  };
}

// void_lord: HP <= 50%, 1 time => stats x1.5, phase 2
function voidLordPattern(combat: CombatState, monster: Monster): BossPatternResult | null {
  const key = `void_lord_${monster.id}`;
  if (usedPatterns.has(key)) return null;
  if (monster.stats.hp / monster.stats.maxHp > 0.5) return null;

  usedPatterns.add(key);
  const log: string[] = [];
  log.push(`{bold}{magenta-fg}${monster.name}: "공허를 해방한다!"{/magenta-fg}{/bold}`);
  log.push('{bold}{magenta-fg}페이즈 2 돌입!{/magenta-fg}{/bold}');

  const newMonsters = combat.monsters.map(m => {
    if (m.id !== monster.id) return m;
    return {
      ...m,
      name: '공허의 군주 (해방)',
      stats: {
        ...m.stats,
        attack: Math.round(m.stats.attack * 1.5),
        defense: Math.round(m.stats.defense * 1.5),
        speed: Math.round(m.stats.speed * 1.5),
        accuracy: Math.round(m.stats.accuracy * 1.1),
      },
    };
  });

  return {
    combat: { ...combat, monsters: newMonsters },
    log,
    skipNormalAction: true,
  };
}
