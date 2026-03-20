import type { Hero, Monster, Skill, CombatState, TurnOrder, StatusEffect } from '../models/types.ts';
import { randomInt, percentChance, clamp, randomChoice } from '../utils/helpers.ts';
import { getTraitStatBonuses } from '../data/traits.ts';
import { executeBossPattern } from './boss-patterns.ts';

// ============================================================
// DEEP COPY
// ============================================================
function deepCopyCombat(combat: CombatState): CombatState {
  return {
    ...combat,
    heroes: combat.heroes.map(h => ({
      ...h,
      stats: { ...h.stats },
      statusEffects: h.statusEffects.map(e => ({ ...e })),
      skills: h.skills.map(s => ({ ...s })),
      equipment: { ...h.equipment },
    })),
    monsters: combat.monsters.map(m => ({
      ...m,
      stats: { ...m.stats },
      statusEffects: m.statusEffects.map(e => ({ ...e })),
      skills: m.skills.map(s => ({ ...s })),
    })),
    turnOrder: combat.turnOrder.map(t => ({ ...t })),
    log: [...combat.log],
  };
}

// ============================================================
// TURN ORDER
// ============================================================
export function generateTurnOrder(heroes: Hero[], monsters: Monster[]): TurnOrder[] {
  const entries: TurnOrder[] = [];

  for (const hero of heroes) {
    if (hero.stats.hp > 0 || hero.isDeathsDoor) {
      entries.push({
        id: hero.id,
        isHero: true,
        speed: hero.stats.speed + randomInt(1, 8),
        done: false,
      });
    }
  }

  for (const monster of monsters) {
    if (monster.stats.hp > 0) {
      entries.push({
        id: monster.id,
        isHero: false,
        speed: monster.stats.speed + randomInt(1, 8),
        done: false,
      });
    }
  }

  entries.sort((a, b) => b.speed - a.speed);
  return entries;
}

// ============================================================
// EQUIPMENT STATS
// ============================================================
export function getEffectiveStats(hero: Hero, context?: { isBoss?: boolean }): Hero['stats'] {
  const stats = { ...hero.stats };
  const equipment = [hero.equipment.weapon, hero.equipment.armor, hero.equipment.trinket1, hero.equipment.trinket2];

  for (const item of equipment) {
    if (!item) continue;
    for (const mod of item.modifiers) {
      const key = mod.stat as keyof Hero['stats'];
      if (key in stats && typeof stats[key] === 'number') {
        (stats as any)[key] = (stats as any)[key] + mod.value;
      }
    }
  }

  // Apply trait bonuses
  if (hero.traits && hero.traits.length > 0) {
    const hpPercent = stats.hp / stats.maxHp;
    const bonuses = getTraitStatBonuses(hero.traits, {
      isBoss: context?.isBoss,
      hpPercent,
    });
    stats.attack += bonuses.attack;
    stats.defense += bonuses.defense;
    stats.speed += bonuses.speed;
    stats.accuracy += bonuses.accuracy;
    stats.dodge += bonuses.dodge;
    stats.crit += bonuses.crit;
    if (bonuses.maxHp !== 0) {
      stats.maxHp += bonuses.maxHp;
      if (stats.hp > stats.maxHp) stats.hp = stats.maxHp;
    }
  }

  return stats;
}

// ============================================================
// HIT & DAMAGE CALCULATIONS
// ============================================================
export function calculateHit(attackerAcc: number, skill: Skill, targetDodge: number): boolean {
  const hitChance = attackerAcc + skill.accuracy - targetDodge;
  const roll = randomInt(1, 100);
  return roll <= hitChance;
}

export function calculateDamage(
  attackerAtk: number,
  skill: Skill,
  targetDef: number,
  critBonus: number = 0,
): { damage: number; isCrit: boolean } {
  const multiplier = skill.damage.min + Math.random() * (skill.damage.max - skill.damage.min);
  let baseDamage = Math.round(attackerAtk * multiplier) - targetDef + randomInt(-2, 2);
  baseDamage = Math.max(1, baseDamage);

  const isCrit = percentChance(skill.crit + critBonus);
  if (isCrit) {
    baseDamage = Math.round(baseDamage * 1.5);
  }

  return { damage: baseDamage, isCrit };
}

// ============================================================
// APPLY DAMAGE / HEALING
// ============================================================
export function applyDamageToHero(hero: Hero, damage: number): { hero: Hero; log: string[] } {
  const log: string[] = [];
  let newHp = hero.stats.hp - damage;

  if (newHp <= 0) {
    if (!hero.isDeathsDoor) {
      log.push(`${hero.name}이(가) 죽음의 문턱에 섰습니다!`);
      return {
        hero: { ...hero, stats: { ...hero.stats, hp: 0 }, isDeathsDoor: true },
        log,
      };
    } else {
      const resistChance = hero.deathsDoorResist;
      if (percentChance(resistChance)) {
        log.push(`${hero.name}이(가) 죽음에 저항했습니다! (${resistChance}%)`);
        return {
          hero: {
            ...hero,
            stats: { ...hero.stats, hp: 0 },
            deathsDoorResist: Math.max(0, hero.deathsDoorResist - 17),
          },
          log,
        };
      } else {
        log.push(`${hero.name}이(가) 사망했습니다!`);
        return {
          hero: { ...hero, stats: { ...hero.stats, hp: 0 } },
          log,
        };
      }
    }
  }

  return {
    hero: { ...hero, stats: { ...hero.stats, hp: newHp } },
    log,
  };
}

export function applyDamageToMonster(monster: Monster, damage: number): Monster {
  const newHp = Math.max(0, monster.stats.hp - damage);
  return { ...monster, stats: { ...monster.stats, hp: newHp } };
}

export function applyHealing(hero: Hero, amount: number): Hero {
  const newHp = clamp(hero.stats.hp + amount, 0, hero.stats.maxHp);
  let updatedHero = { ...hero, stats: { ...hero.stats, hp: newHp } };
  if (hero.isDeathsDoor && newHp > 0) {
    updatedHero = { ...updatedHero, isDeathsDoor: false };
  }
  return updatedHero;
}

// ============================================================
// STATUS EFFECTS
// ============================================================
export function processStatusEffects(entity: Hero | Monster): { entity: Hero | Monster; log: string[] } {
  const log: string[] = [];
  let updated = { ...entity, stats: { ...entity.stats }, statusEffects: [...entity.statusEffects] };
  const name = updated.name;

  for (const effect of updated.statusEffects) {
    if (effect.type === 'bleed' && effect.duration > 0) {
      updated.stats.hp = Math.max(0, updated.stats.hp - effect.value);
      log.push(`${name}이(가) 출혈로 ${effect.value} 피해!`);
    }
    if (effect.type === 'blight' && effect.duration > 0) {
      updated.stats.hp = Math.max(0, updated.stats.hp - effect.value);
      log.push(`${name}이(가) 역병으로 ${effect.value} 피해!`);
    }
  }

  return { entity: updated as Hero | Monster, log };
}

export function tickStatusEffects(effects: StatusEffect[]): StatusEffect[] {
  return effects
    .map(e => ({ ...e, duration: e.duration - 1 }))
    .filter(e => e.duration > 0);
}

export function isStunned(effects: StatusEffect[]): boolean {
  return effects.some(e => e.type === 'stun' && e.duration > 0);
}

export function removeStun(effects: StatusEffect[]): StatusEffect[] {
  return effects.filter(e => e.type !== 'stun');
}

// ============================================================
// SKILL VALIDATION
// ============================================================
export function canUseSkill(hero: Hero, skill: Skill): boolean {
  return skill.useCols.includes(hero.position.col);
}

function matchesSkillTarget(skill: Skill, pos: { row: number; col: number }): boolean {
  if (!skill.targetCols.includes(pos.col)) return false;
  if (skill.targetRows && !skill.targetRows.includes(pos.row)) return false;
  return true;
}

export function getValidTargets(skill: Skill, combat: CombatState, isHero: boolean): string[] {
  if (isHero) {
    if (skill.targetAlly) {
      return combat.heroes
        .filter(h => h.stats.hp > 0 || h.isDeathsDoor)
        .filter(h => matchesSkillTarget(skill, h.position))
        .map(h => h.id);
    } else {
      return combat.monsters
        .filter(m => m.stats.hp > 0)
        .filter(m => matchesSkillTarget(skill, m.position))
        .map(m => m.id);
    }
  } else {
    if (skill.targetAlly) {
      return combat.monsters
        .filter(m => m.stats.hp > 0)
        .filter(m => matchesSkillTarget(skill, m.position))
        .map(m => m.id);
    } else {
      return combat.heroes
        .filter(h => h.stats.hp > 0 || h.isDeathsDoor)
        .filter(h => matchesSkillTarget(skill, h.position))
        .map(h => h.id);
    }
  }
}

// ============================================================
// APPLY SKILL EFFECTS
// ============================================================
function applySkillEffects(
  skill: Skill,
  target: Hero | Monster,
  log: string[],
): Hero | Monster {
  if (!skill.effects || skill.effects.length === 0) return target;

  const name = target.name;
  const newEffects = [...target.statusEffects];

  const effectNames: Record<string, string> = {
    bleed: '출혈', blight: '역병', stun: '기절', mark: '표식',
    buff_attack: '공격 강화', buff_defense: '방어 강화', buff_speed: '속도 강화',
    debuff_attack: '공격 약화', debuff_defense: '방어 약화', debuff_speed: '속도 약화',
  };

  for (const effect of skill.effects) {
    if (percentChance(effect.chance)) {
      const existingIdx = newEffects.findIndex(
        e => e.type === effect.type && e.source === skill.name
      );
      const newEffect = {
        type: effect.type,
        duration: effect.duration,
        value: effect.value,
        source: skill.name,
      };
      if (existingIdx !== -1) {
        newEffects[existingIdx] = newEffect; // 갱신 (duration 리셋)
      } else {
        newEffects.push(newEffect);
      }
      log.push(`${name}에게 ${effectNames[effect.type] ?? effect.type} 효과!`);
    }
  }

  return { ...target, statusEffects: newEffects };
}

// ============================================================
// EXECUTE HERO SKILL
// ============================================================
export function executeHeroSkill(
  combat: CombatState,
  heroId: string,
  skillIndex: number,
  targetId: string,
): { combat: CombatState; log: string[] } {
  const log: string[] = [];
  const newCombat = deepCopyCombat(combat);
  const heroes = newCombat.heroes;
  const monsters = newCombat.monsters;

  const heroIdx = heroes.findIndex(h => h.id === heroId);
  if (heroIdx === -1) return { combat, log: ['영웅을 찾을 수 없습니다.'] };

  const hero = heroes[heroIdx]!;
  const skill = hero.skills[skillIndex];
  if (!skill) return { combat, log: ['스킬을 찾을 수 없습니다.'] };

  if (skill.targetAlly) {
    // Healing / buff skill
    const targetIdx = heroes.findIndex(h => h.id === targetId);
    if (targetIdx === -1) return { combat, log: ['대상을 찾을 수 없습니다.'] };
    const target = heroes[targetIdx]!;

    log.push(`${hero.name}이(가) ${skill.name}을(를) ${target.name}에게 사용!`);

    if (skill.heal) {
      const healAmount = randomInt(skill.heal.min, skill.heal.max);
      heroes[targetIdx] = applyHealing(target, healAmount);
      log.push(`{bold}{green-fg}${target.name}이(가) HP ${healAmount} 회복!{/green-fg}{/bold}`);
    }
    if (skill.effects) {
      heroes[targetIdx] = applySkillEffects(skill, heroes[targetIdx]!, log) as Hero;
    }
    // Remove bleed/blight for battlefield medicine type skills
    if (skill.id === 'battlefield_medicine' || skill.id === 'plague_doctor_battlefield_medicine') {
      heroes[targetIdx] = {
        ...heroes[targetIdx]!,
        statusEffects: heroes[targetIdx]!.statusEffects.filter(e => e.type !== 'bleed' && e.type !== 'blight'),
      };
      log.push('출혈/역병 해제!');
    }
  } else {
    // Attack skill - handle multi-target
    const targetIds: string[] = [];
    if (skill.targetCount > 1) {
      const validTargets = getValidTargets(skill, newCombat, true);
      targetIds.push(...validTargets.slice(0, skill.targetCount));
    } else {
      targetIds.push(targetId);
    }

    for (const tid of targetIds) {
      const monsterIdx = monsters.findIndex(m => m.id === tid);
      if (monsterIdx === -1) continue;
      const target = monsters[monsterIdx]!;

      // Use effective stats (including equipment modifiers)
      const effectiveStats = getEffectiveStats(hero);

      log.push(`${hero.name}이(가) ${skill.name}으로 ${target.name}을(를) 공격!`);

      if (!calculateHit(effectiveStats.accuracy, skill, target.stats.dodge)) {
        log.push('빗나감!');
        continue;
      }

      const { damage, isCrit } = calculateDamage(effectiveStats.attack, skill, target.stats.defense, effectiveStats.crit);
      if (isCrit) {
        log.push(`{bold}{yellow-fg}치명타! ${damage} 피해!{/yellow-fg}{/bold}`);
      } else {
        log.push(`{bold}{red-fg}${damage} 피해!{/red-fg}{/bold}`);
      }

      monsters[monsterIdx] = applyDamageToMonster(target, damage);

      if (monsters[monsterIdx]!.stats.hp <= 0) {
        log.push(`${target.name}이(가) 쓰러졌습니다!`);
      }

      if (skill.effects && monsters[monsterIdx]!.stats.hp > 0) {
        monsters[monsterIdx] = applySkillEffects(skill, monsters[monsterIdx]!, log) as Monster;
      }
    }
  }

  // Handle self-move
  if (skill.selfMove && (skill.selfMove.row !== 0 || skill.selfMove.col !== 0)) {
    const currentPos = heroes[heroIdx]!.position;
    const newPos = {
      row: clamp(currentPos.row + skill.selfMove.row, 1, 3),
      col: clamp(currentPos.col + skill.selfMove.col, 1, 3),
    };
    heroes[heroIdx] = { ...heroes[heroIdx]!, position: newPos };
  }

  newCombat.log.push(...log);
  return { combat: newCombat, log };
}

// ============================================================
// ENEMY AI
// ============================================================
export function getEnemyAction(
  monster: Monster,
  heroes: Hero[],
  monsters: Monster[],
): { skill: Skill; targetId: string } | null {
  const aliveHeroes = heroes.filter(h => h.stats.hp > 0 || h.isDeathsDoor);
  if (aliveHeroes.length === 0) return null;

  const availableSkills = monster.skills.filter(s => s.useCols.includes(monster.position.col));
  if (availableSkills.length === 0) return null;

  // Check if any ally monster needs healing
  const allyMonsters = monsters.filter(m => m.stats.hp > 0 && m.id !== monster.id);
  const lowHpAlly = allyMonsters.find(m => m.stats.hp / m.stats.maxHp < 0.3);
  if (lowHpAlly) {
    const healSkill = availableSkills.find(s => s.targetAlly && s.heal);
    if (healSkill) {
      return { skill: healSkill, targetId: lowHpAlly.id };
    }
  }

  // Buff skill: skip if target already has the same buff with duration >= 2
  const buffSkills = availableSkills.filter(s => s.targetAlly && !s.heal && s.effects && s.effects.length > 0);
  if (buffSkills.length > 0) {
    for (const bs of buffSkills) {
      const buffTargets = allyMonsters.filter(m => {
        return !bs.effects!.every(eff =>
          m.statusEffects.some(se => se.type === eff.type && se.duration >= 2)
        );
      });
      // Also check self
      const selfNeedsBuff = !bs.effects!.every(eff =>
        monster.statusEffects.some(se => se.type === eff.type && se.duration >= 2)
      );
      if (selfNeedsBuff && percentChance(30)) {
        return { skill: bs, targetId: monster.id };
      }
      if (buffTargets.length > 0 && percentChance(30)) {
        return { skill: bs, targetId: buffTargets[randomInt(0, buffTargets.length - 1)]!.id };
      }
    }
  }

  // Check for stun skill (40% chance)
  const stunSkill = availableSkills.find(s => s.effects?.some(e => e.type === 'stun'));
  if (stunSkill && percentChance(40)) {
    const dummyCombat: CombatState = {
      phase: 'enemy_turn', heroes, monsters,
      turnOrder: [], currentTurnIndex: 0, round: 0, log: [],
      selectedSkillIndex: 0, isSurprised: false, enemySurprised: false,
    };
    const validTargets = getValidTargets(stunSkill, dummyCombat, false);
    if (validTargets.length > 0) {
      const nonStunned = validTargets.filter(tid => {
        const h = heroes.find(hero => hero.id === tid);
        return h && !isStunned(h.statusEffects);
      });
      const target = nonStunned.length > 0
        ? nonStunned[randomInt(0, nonStunned.length - 1)]!
        : validTargets[randomInt(0, validTargets.length - 1)]!;
      return { skill: stunSkill, targetId: target };
    }
  }

  // Default: damage skill
  const damageSkills = availableSkills.filter(s => !s.targetAlly && (s.damage.min > 0 || s.damage.max > 0));
  const chosenSkill = damageSkills.length > 0
    ? damageSkills[randomInt(0, damageSkills.length - 1)]!
    : availableSkills[randomInt(0, availableSkills.length - 1)]!;

  const dummyCombat: CombatState = {
    phase: 'enemy_turn', heroes, monsters,
    turnOrder: [], currentTurnIndex: 0, round: 0, log: [],
    selectedSkillIndex: 0, isSurprised: false, enemySurprised: false,
  };
  const validTargets = getValidTargets(chosenSkill, dummyCombat, false);
  if (validTargets.length === 0) return null;

  // Priority: marked > lowest HP > random
  const markedTargets = validTargets.filter(tid => {
    const h = heroes.find(hero => hero.id === tid);
    return h && h.statusEffects.some(e => e.type === 'mark');
  });

  let targetId: string;
  if (markedTargets.length > 0) {
    targetId = markedTargets[randomInt(0, markedTargets.length - 1)]!;
  } else {
    const sorted = validTargets
      .map(tid => ({ id: tid, hp: heroes.find(h => h.id === tid)?.stats.hp ?? 999 }))
      .sort((a, b) => a.hp - b.hp);
    if (percentChance(60)) {
      targetId = sorted[0]!.id;
    } else {
      targetId = validTargets[randomInt(0, validTargets.length - 1)]!;
    }
  }

  return { skill: chosenSkill, targetId };
}

// ============================================================
// EXECUTE ENEMY TURN
// ============================================================
export function executeEnemyTurn(combat: CombatState, monsterId: string): { combat: CombatState; log: string[] } {
  const log: string[] = [];
  const newCombat = deepCopyCombat(combat);
  const heroes = newCombat.heroes;
  const monsters = newCombat.monsters;

  const monsterIdx = monsters.findIndex(m => m.id === monsterId);
  if (monsterIdx === -1) return { combat, log: ['몬스터를 찾을 수 없습니다.'] };

  const monster = monsters[monsterIdx]!;

  // Process DOT effects
  const dotResult = processStatusEffects(monster);
  monsters[monsterIdx] = dotResult.entity as Monster;
  log.push(...dotResult.log);

  if (monsters[monsterIdx]!.stats.hp <= 0) {
    log.push(`${monster.name}이(가) 상태이상으로 쓰러졌습니다!`);
    newCombat.log.push(...log);
    return { combat: newCombat, log };
  }

  // Check stun
  if (isStunned(monsters[monsterIdx]!.statusEffects)) {
    log.push(`${monster.name}은(는) 기절 상태입니다!`);
    monsters[monsterIdx] = {
      ...monsters[monsterIdx]!,
      statusEffects: removeStun(monsters[monsterIdx]!.statusEffects),
    };
    newCombat.log.push(...log);
    return { combat: newCombat, log };
  }

  // Tick status effects
  monsters[monsterIdx] = {
    ...monsters[monsterIdx]!,
    statusEffects: tickStatusEffects(monsters[monsterIdx]!.statusEffects),
  };

  // Boss pattern check (before normal AI)
  if (monsters[monsterIdx]!.isBoss) {
    const patternResult = executeBossPattern(newCombat, monsters[monsterIdx]!);
    if (patternResult) {
      log.push(...patternResult.log);
      // Apply pattern changes
      Object.assign(newCombat, patternResult.combat);
      // Refresh references
      newCombat.heroes = patternResult.combat.heroes;
      newCombat.monsters = patternResult.combat.monsters;
      if (patternResult.combat.turnOrder) newCombat.turnOrder = patternResult.combat.turnOrder;
      if (patternResult.skipNormalAction) {
        newCombat.log.push(...log);
        return { combat: newCombat, log };
      }
    }
  }

  // AI choose action
  const action = getEnemyAction(monsters[monsterIdx]!, heroes, monsters);
  if (!action) {
    log.push(`${monster.name}은(는) 행동할 수 없습니다.`);
    newCombat.log.push(...log);
    return { combat: newCombat, log };
  }

  const { skill, targetId } = action;

  if (skill.targetAlly && skill.heal) {
    const allyIdx = monsters.findIndex(m => m.id === targetId);
    if (allyIdx !== -1) {
      const healAmount = randomInt(skill.heal.min, skill.heal.max);
      const ally = monsters[allyIdx]!;
      const newHp = clamp(ally.stats.hp + healAmount, 0, ally.stats.maxHp);
      monsters[allyIdx] = { ...ally, stats: { ...ally.stats, hp: newHp } };
      log.push(`${monster.name}이(가) ${skill.name}으로 ${ally.name}을(를) ${healAmount} 치유!`);
    }
  } else {
    // Attack heroes
    const targetIds: string[] = [];
    if (skill.targetCount > 1) {
      const validTargets = getValidTargets(skill, newCombat, false);
      targetIds.push(...validTargets.slice(0, skill.targetCount));
    } else {
      targetIds.push(targetId);
    }

    for (const tid of targetIds) {
      const heroIdx = heroes.findIndex(h => h.id === tid);
      if (heroIdx === -1) continue;
      const target = heroes[heroIdx]!;

      // Use effective stats for hero defense
      const targetEffStats = getEffectiveStats(target);

      log.push(`${monster.name}이(가) ${skill.name}으로 ${target.name}을(를) 공격!`);

      if (!calculateHit(monster.stats.accuracy, skill, targetEffStats.dodge)) {
        log.push('빗나감!');
        continue;
      }

      const { damage, isCrit } = calculateDamage(monster.stats.attack, skill, targetEffStats.defense);
      if (isCrit) {
        log.push(`{bold}{yellow-fg}치명타! ${damage} 피해!{/yellow-fg}{/bold}`);
      } else {
        log.push(`{bold}{red-fg}${damage} 피해!{/red-fg}{/bold}`);
      }

      const damageResult = applyDamageToHero(target, damage);
      heroes[heroIdx] = damageResult.hero;
      log.push(...damageResult.log);

      // Apply status effects
      if (skill.effects && heroes[heroIdx]!.stats.hp > 0) {
        heroes[heroIdx] = applySkillEffects(skill, heroes[heroIdx]!, log) as Hero;
      }
    }
  }

  newCombat.log.push(...log);
  return { combat: newCombat, log };
}

// ============================================================
// COMBAT END CHECK
// ============================================================
export function checkCombatEnd(combat: CombatState): 'victory' | 'defeat' | 'ongoing' {
  const aliveMonsters = combat.monsters.filter(m => m.stats.hp > 0);
  if (aliveMonsters.length === 0) return 'victory';

  const aliveHeroes = combat.heroes.filter(h => h.stats.hp > 0 || h.isDeathsDoor);
  if (aliveHeroes.length === 0) return 'defeat';

  return 'ongoing';
}
