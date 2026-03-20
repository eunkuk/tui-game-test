import type { Hero, Monster, Skill, CombatState } from '../models/types.ts';
import { canUseSkill, getValidTargets, getEffectiveStats } from './combat-engine.ts';

/**
 * AI decision-making for auto-battle hero actions.
 * Returns the skill index and target ID for the hero's turn.
 */
export function getHeroAutoAction(
  hero: Hero,
  combat: CombatState,
): { skillIndex: number; targetId: string } | null {
  const usableSkills = hero.skills.filter(s => canUseSkill(hero, s));
  if (usableSkills.length === 0) return null;

  const aliveHeroes = combat.heroes.filter(h => h.stats.hp > 0);
  const aliveMonsters = combat.monsters.filter(m => m.stats.hp > 0);

  // Priority 1: If hero has heal skills and any ally is below 40% HP, heal
  const healSkills = usableSkills.filter(s => s.targetAlly && s.heal);
  if (healSkills.length > 0) {
    const woundedAlly = aliveHeroes
      .filter(h => h.stats.hp / h.stats.maxHp < 0.4 && h.stats.hp > 0)
      .sort((a, b) => (a.stats.hp / a.stats.maxHp) - (b.stats.hp / b.stats.maxHp))[0];

    if (woundedAlly) {
      const healSkill = healSkills[0]!;
      const skillIndex = hero.skills.indexOf(healSkill);
      const validTargets = getValidTargets(healSkill, combat, true);
      if (validTargets.includes(woundedAlly.id)) {
        return { skillIndex, targetId: woundedAlly.id };
      }
    }
  }

  // Priority 2: If hero is a healer (vestal) and any ally HP is below 60%, heal
  if (healSkills.length > 0 && hero.class === 'vestal') {
    const needsHeal = aliveHeroes
      .filter(h => h.stats.hp / h.stats.maxHp < 0.6 && h.stats.hp > 0)
      .sort((a, b) => (a.stats.hp / a.stats.maxHp) - (b.stats.hp / b.stats.maxHp))[0];

    if (needsHeal) {
      const healSkill = healSkills[0]!;
      const skillIndex = hero.skills.indexOf(healSkill);
      const validTargets = getValidTargets(healSkill, combat, true);
      if (validTargets.includes(needsHeal.id)) {
        return { skillIndex, targetId: needsHeal.id };
      }
    }
  }

  // Priority 3: Use stun skill on unstunned enemies (30% of the time for variety)
  if (Math.random() < 0.3) {
    const stunSkills = usableSkills.filter(s =>
      !s.targetAlly && s.effects?.some(e => e.type === 'stun')
    );
    if (stunSkills.length > 0) {
      const stunSkill = stunSkills[0]!;
      const validTargets = getValidTargets(stunSkill, combat, true);
      const unstunnedTargets = validTargets.filter(tid => {
        const m = aliveMonsters.find(mon => mon.id === tid);
        return m && !m.statusEffects.some(e => e.type === 'stun');
      });
      if (unstunnedTargets.length > 0) {
        const skillIndex = hero.skills.indexOf(stunSkill);
        // Target highest HP enemy
        const sorted = unstunnedTargets.map(tid => ({
          id: tid,
          hp: aliveMonsters.find(m => m.id === tid)?.stats.hp ?? 0,
        })).sort((a, b) => b.hp - a.hp);
        return { skillIndex, targetId: sorted[0]!.id };
      }
    }
  }

  // Priority 4: Use best damage skill on lowest HP enemy (or marked enemy)
  const damageSkills = usableSkills.filter(s => !s.targetAlly && (s.damage.max > 0));
  if (damageSkills.length > 0) {
    // Pick highest damage skill
    const bestSkill = [...damageSkills].sort((a, b) =>
      ((b.damage.min + b.damage.max) / 2) - ((a.damage.min + a.damage.max) / 2)
    )[0]!;

    const validTargets = getValidTargets(bestSkill, combat, true);
    if (validTargets.length > 0) {
      const skillIndex = hero.skills.indexOf(bestSkill);

      // Priority: marked targets > lowest HP > random
      const markedTargets = validTargets.filter(tid => {
        const m = aliveMonsters.find(mon => mon.id === tid);
        return m && m.statusEffects.some(e => e.type === 'mark');
      });

      if (markedTargets.length > 0) {
        return { skillIndex, targetId: markedTargets[0]! };
      }

      // Target lowest HP
      const sorted = validTargets.map(tid => ({
        id: tid,
        hp: aliveMonsters.find(m => m.id === tid)?.stats.hp ?? 999,
      })).sort((a, b) => a.hp - b.hp);

      return { skillIndex, targetId: sorted[0]!.id };
    }
  }

  // Priority 4.5: If no damage skill hit, try ANY damage skill (even low damage)
  const anyAttackSkills = usableSkills.filter(s => !s.targetAlly);
  for (const skill of anyAttackSkills) {
    const validTargets = getValidTargets(skill, combat, true);
    if (validTargets.length > 0) {
      const skillIndex = hero.skills.indexOf(skill);
      const sorted = validTargets.map(tid => ({
        id: tid,
        hp: aliveMonsters.find(m => m.id === tid)?.stats.hp ?? 999,
      })).sort((a, b) => a.hp - b.hp);
      return { skillIndex, targetId: sorted[0]!.id };
    }
  }

  // Priority 5: Use buff/heal skill (fallback) — only if the buff isn't already active
  for (const skill of usableSkills) {
    if (!skill.targetAlly) continue;
    // Skip buff skills if the buff is already active on most allies
    if (skill.effects && skill.effects.length > 0) {
      const buffType = skill.effects[0]!.type;
      const alreadyBuffed = aliveHeroes.filter(h =>
        h.statusEffects.some(e => e.type === buffType && e.duration >= 2)
      ).length;
      // Skip if most of the team already has this buff
      if (alreadyBuffed >= Math.ceil(aliveHeroes.length * 0.5)) continue;
    }

    const skillIndex = hero.skills.indexOf(skill);
    const validTargets = getValidTargets(skill, combat, true);
    if (validTargets.length > 0) {
      // For buff skills, pick ally without the buff; for heal, pick most hurt
      if (skill.heal) {
        const mostHurt = validTargets
          .map(tid => ({ id: tid, hp: aliveHeroes.find(h => h.id === tid)?.stats.hp ?? 999 }))
          .sort((a, b) => a.hp - b.hp)[0];
        if (mostHurt) return { skillIndex, targetId: mostHurt.id };
      }
      const selfTarget = validTargets.find(tid => tid === hero.id);
      return { skillIndex, targetId: selfTarget || validTargets[0]! };
    }
  }

  return null;
}

/**
 * Check if auto-mode should pause for safety.
 * Returns a warning message if dangerous, null if safe to continue.
 */
export function checkAutoSafety(heroes: Hero[]): string | null {
  const alive = heroes.filter(h => h.stats.hp > 0);

  // Stop if any hero is dead
  if (alive.length < heroes.length) {
    return '영웅이 사망했습니다! 자동 모드 중지.';
  }

  // Stop if any hero is on Death's Door
  const deathsDoor = alive.find(h => h.isDeathsDoor);
  if (deathsDoor) {
    return `${deathsDoor.name}이(가) 죽음의 문턱! 자동 모드 중지.`;
  }

  // Stop if party average HP is below 25%
  const avgHpPct = alive.reduce((sum, h) => sum + h.stats.hp / h.stats.maxHp, 0) / alive.length;
  if (avgHpPct < 0.25) {
    return '파티 HP 위험! 자동 모드 중지.';
  }


  return null;
}
