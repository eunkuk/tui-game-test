import blessed from 'blessed';
import { BaseScreen } from './BaseScreen.ts';
import type { Hero, Monster, CombatState, Item } from '../models/types.ts';
import { getClassName, getStars } from '../data/heroes.ts';
import { formatBar, randomInt, clamp } from '../utils/helpers.ts';
import { applyStress, processAfflictionBehavior } from '../engine/stress-engine.ts';
import {
  generateTurnOrder,
  executeHeroSkill,
  executeEnemyTurn,
  checkCombatEnd,
  isStunned,
  removeStun,
  processStatusEffects,
  tickStatusEffects,
} from '../engine/combat-engine.ts';
import { generateCombatLoot, generateBossLoot } from '../engine/loot-generator.ts';
import { getHeroAutoAction } from '../engine/hero-ai.ts';

export class CombatScreen extends BaseScreen {
  private enemyBox!: blessed.Widgets.BoxElement;
  private allyBox!: blessed.Widgets.BoxElement;
  private logBox!: blessed.Widgets.BoxElement;
  private headerBox!: blessed.Widgets.BoxElement;
  private turnOrderBox!: blessed.Widgets.BoxElement;
  private hintBox!: blessed.Widgets.BoxElement;

  private combat!: CombatState;
  private currentPhase: 'init' | 'animating' | 'enemy_turn' | 'victory' | 'defeat' = 'init';
  private speed: 1 | 2 | 3 = 1;
  private destroyed = false;
  private paused = false;

  destroy(): void {
    this.destroyed = true;
    super.destroy();
  }

  render(): void {
    const state = this.store.getState();
    if (!state.combat) return;

    this.combat = state.combat;
    this.speed = state.gameSpeed;
    this.paused = state.paused;

    // Initialize turn order if empty
    if (this.combat.turnOrder.length === 0) {
      let turnOrder = generateTurnOrder(this.combat.heroes, this.combat.monsters);

      if (this.combat.isSurprised && this.combat.round === 1) {
        const enemies = turnOrder.filter(t => !t.isHero);
        const heroes = turnOrder.filter(t => t.isHero);
        turnOrder = [...enemies, ...heroes];
      } else if (this.combat.enemySurprised && this.combat.round === 1) {
        const heroes = turnOrder.filter(t => t.isHero);
        const enemies = turnOrder.filter(t => !t.isHero);
        turnOrder = [...heroes, ...enemies];
      }

      this.combat = { ...this.combat, turnOrder, currentTurnIndex: 0 };
      this.store.dispatch({ type: 'SET_COMBAT', combat: this.combat });
    }

    // Background
    this.createBox({
      top: 0, left: 0, width: '100%', height: '100%',
      style: { bg: 'black' },
    });

    // Header
    this.headerBox = this.createBox({
      top: 0, left: 0, width: '100%', height: 3,
      tags: true,
      border: { type: 'line' },
      style: { fg: 'white', bg: 'black', border: { fg: 'red' } },
    });

    // Turn order queue
    this.turnOrderBox = this.createBox({
      top: 3, left: 0, width: '100%', height: 3,
      tags: true,
      border: { type: 'line' },
      label: ' \ud589\ub3d9 \uc21c\uc11c ',
      style: { fg: 'white', bg: 'black', border: { fg: 'gray' }, label: { fg: 'gray' } } as any,
    });

    // Enemy panel
    this.enemyBox = this.createBox({
      top: 6, left: 0, width: '100%', height: 7,
      label: ' \uc801 ',
      tags: true,
      border: { type: 'line' },
      style: { fg: 'white', bg: 'black', border: { fg: 'red' }, label: { fg: 'red' } } as any,
    });

    // VS separator
    this.createBox({
      top: 13, left: 0, width: '100%', height: 1,
      tags: true,
      content: '{center}{bold}{yellow-fg}\u2694 VS \u2694{/yellow-fg}{/bold}{/center}',
      style: { fg: 'yellow', bg: 'black' },
      align: 'center',
    });

    // Ally panel
    this.allyBox = this.createBox({
      top: 14, left: 0, width: '100%', height: 8,
      label: ' \uc544\uad70 ',
      tags: true,
      border: { type: 'line' },
      style: { fg: 'white', bg: 'black', border: { fg: 'blue' }, label: { fg: 'cyan' } } as any,
    });

    // Combat log
    this.logBox = this.createBox({
      top: 22, left: 0, width: '100%', height: 6,
      label: ' \uc804\ud22c \uae30\ub85d ',
      tags: true,
      border: { type: 'line' },
      scrollable: true,
      alwaysScroll: true,
      style: { fg: 'gray', bg: 'black', border: { fg: 'gray' }, label: { fg: 'gray' } } as any,
    });

    // Hint
    this.hintBox = this.createBox({
      bottom: 0, left: 0, width: '100%', height: 1,
      tags: true,
      content: '{gray-fg}1/2/3: \uc18d\ub3c4  Space: \uc77c\uc2dc\uc815\uc9c0  P: \ubb3c\uc57d  Esc: \ud3ec\uae30{/gray-fg}',
      style: { fg: 'gray', bg: 'black' },
    });

    this.setupKeys();
    this.updateDisplay();
    this.advanceTurn();
  }

  private updateDisplay(): void {
    if (this.destroyed) return;
    this.updateHeader();
    this.updateTurnOrder();
    this.updateEnemies();
    this.updateAllies();
    this.updateLog();
    this.screen.render();
  }

  private updateHeader(): void {
    const turn = this.combat.turnOrder[this.combat.currentTurnIndex];
    let turnName = '???';
    if (turn) {
      if (turn.isHero) {
        const hero = this.combat.heroes.find(h => h.id === turn.id);
        turnName = hero ? hero.name : '???';
      } else {
        const monster = this.combat.monsters.find(m => m.id === turn.id);
        turnName = monster ? monster.name : '???';
      }
    }
    const speedBtns = [1, 2, 3].map(s => s === this.speed ? `{yellow-fg}[${s}x]{/yellow-fg}` : `{gray-fg}[${s}x]{/gray-fg}`).join(' ');
    const towerState = this.store.getState().tower;
    const floorNum = towerState ? towerState.currentFloor : 0;
    const isBossFloor = floorNum > 0 && floorNum % 10 === 0;
    const floorLabel = floorNum > 0 ? (isBossFloor ? `{bold}{red-fg}\u2605 BOSS \u2605{/red-fg}{/bold} ${floorNum}\uCE35` : `${floorNum}\uCE35`) : '';
    const pauseLabel = this.paused ? '  {bold}{red-fg}[일시정지]{/red-fg}{/bold}' : '';
    this.headerBox.setContent(` {bold}{red-fg}\uC5B4\uB460\uC758 \uD0D1{/red-fg}{/bold} ${floorLabel}  |  {bold}{red-fg}\uB77C\uC6B4\uB4DC ${this.combat.round}{/red-fg}{/bold}  |  ${speedBtns}  |  {yellow-fg}${turnName}\uC758 \uCC28\uB840{/yellow-fg}${pauseLabel}`);
  }

  private updateTurnOrder(): void {
    const currentIdx = this.combat.currentTurnIndex;
    const order = this.combat.turnOrder;
    let content = '';

    const count = Math.min(6, order.length);
    for (let i = 0; i < count; i++) {
      const idx = (currentIdx + i) % order.length;
      if (idx >= order.length) break;
      const entry = order[idx]!;
      let name = '???';
      let color = 'gray';

      if (entry.isHero) {
        const hero = this.combat.heroes.find(h => h.id === entry.id);
        if (hero && hero.stats.hp > 0) {
          name = hero.name;
          color = 'cyan';
        } else continue;
      } else {
        const monster = this.combat.monsters.find(m => m.id === entry.id);
        if (monster && monster.stats.hp > 0) {
          name = monster.name;
          color = 'red';
        } else continue;
      }

      const marker = i === 0 ? '{bold}{yellow-fg}>{/yellow-fg}{/bold}' : ' ';
      content += `${marker}{${color}-fg}${name}{/${color}-fg} `;
    }

    this.turnOrderBox.setContent(content);
  }

  private updateEnemies(): void {
    let content = '';
    for (const monster of this.combat.monsters) {
      if (monster.stats.hp <= 0) continue;
      const hpPct = monster.stats.hp / monster.stats.maxHp;
      const hpColor = hpPct > 0.5 ? 'green' : hpPct > 0.25 ? 'yellow' : 'red';
      const hpBar = formatBar(monster.stats.hp, monster.stats.maxHp, 12);
      const effects = this.formatEffects(monster.statusEffects);
      const boss = monster.isBoss ? '{red-fg}[BOSS]{/red-fg} ' : '';
      content += ` [${monster.position}] ${boss}{bold}${monster.name}{/bold}   HP {${hpColor}-fg}${hpBar}{/${hpColor}-fg} ${monster.stats.hp}/${monster.stats.maxHp}  ${effects}\n`;
    }
    if (!content) content = '{gray-fg}  (\uc801 \uc5c6\uc74c){/gray-fg}';
    this.enemyBox.setContent(content);
  }

  private updateAllies(): void {
    let content = '';
    for (const hero of this.combat.heroes) {
      const isDead = hero.stats.hp <= 0 && !hero.isDeathsDoor;
      if (isDead) {
        content += ` [${hero.position}] {red-fg}{bold}${hero.name} (${getClassName(hero.class)}) - \uc0ac\ub9dd{/bold}{/red-fg}\n`;
        continue;
      }
      const stars = getStars(hero.rarity);
      const hpPct = hero.stats.hp / hero.stats.maxHp;
      const hpColor = hpPct > 0.5 ? 'green' : hpPct > 0.25 ? 'yellow' : 'red';
      const hpBar = formatBar(hero.stats.hp, hero.stats.maxHp, 10);
      const stressColor = hero.stats.stress >= 100 ? 'red' : hero.stats.stress >= 50 ? 'yellow' : 'gray';
      const stressBar = formatBar(hero.stats.stress, 200, 6);
      const effects = this.formatEffects(hero.statusEffects);
      const deathsDoor = hero.isDeathsDoor ? '{red-fg}[\uc8fd\ubb38]{/red-fg} ' : '';
      const affliction = hero.affliction ? `{red-fg}[${hero.affliction}]{/red-fg} ` : '';
      const virtue = hero.virtue ? `{green-fg}[${hero.virtue}]{/green-fg} ` : '';

      const currentTurn = this.combat.turnOrder[this.combat.currentTurnIndex];
      const isCurrentTurn = currentTurn && currentTurn.isHero && currentTurn.id === hero.id;
      const prefix = isCurrentTurn ? '{bold}{yellow-fg}>{/yellow-fg}{/bold}' : ' ';

      const mcTag = hero.isMainCharacter ? '{bold}{yellow-fg}[MC]{/yellow-fg}{/bold} ' : '';
      content += `${prefix}[${hero.position}] ${mcTag}{yellow-fg}${stars}{/yellow-fg} {bold}${hero.name}{/bold} (${getClassName(hero.class)})  HP {${hpColor}-fg}${hpBar}{/${hpColor}-fg} ${hero.stats.hp}/${hero.stats.maxHp}  ST {${stressColor}-fg}${stressBar}{/${stressColor}-fg} ${hero.stats.stress} ${deathsDoor}${affliction}${virtue}${effects}\n`;
    }
    this.allyBox.setContent(content);
  }

  private formatEffects(effects: { type: string; duration: number }[]): string {
    return effects.map(e => {
      const colors: Record<string, string> = {
        bleed: 'red', blight: 'green', stun: 'yellow', mark: 'magenta',
        buff_attack: 'cyan', buff_defense: 'cyan', buff_speed: 'cyan',
        debuff_attack: 'red', debuff_defense: 'red', debuff_speed: 'red',
      };
      const names: Record<string, string> = {
        bleed: '\ucd9c\ud608', blight: '\uc5ed\ubcd1', stun: '\uae30\uc808', mark: '\ud45c\uc2dd',
        buff_attack: '\uacf5\u2191', buff_defense: '\ubc29\u2191', buff_speed: '\uc18d\u2191',
        debuff_attack: '\uacf5\u2193', debuff_defense: '\ubc29\u2193', debuff_speed: '\uc18d\u2193',
      };
      const c = colors[e.type] || 'white';
      const n = names[e.type] || e.type;
      return `{${c}-fg}[${n}]{/${c}-fg}`;
    }).join(' ');
  }

  private updateLog(): void {
    const logs = this.combat.log.slice(-8);
    this.logBox.setContent(logs.join('\n'));
    (this.logBox as any).setScrollPerc(100);
  }

  private setupKeys(): void {
    this.screen.key(['1'], () => {
      if (this.currentPhase === 'victory' || this.currentPhase === 'defeat') return;
      this.speed = 1;
      this.store.dispatch({ type: 'SET_GAME_SPEED', speed: 1 });
      this.updateHeader();
      this.screen.render();
    });

    this.screen.key(['2'], () => {
      if (this.currentPhase === 'victory' || this.currentPhase === 'defeat') return;
      this.speed = 2;
      this.store.dispatch({ type: 'SET_GAME_SPEED', speed: 2 });
      this.updateHeader();
      this.screen.render();
    });

    this.screen.key(['3'], () => {
      if (this.currentPhase === 'victory' || this.currentPhase === 'defeat') return;
      this.speed = 3;
      this.store.dispatch({ type: 'SET_GAME_SPEED', speed: 3 });
      this.updateHeader();
      this.screen.render();
    });

    this.screen.key(['space'], () => {
      if (this.currentPhase === 'victory' || this.currentPhase === 'defeat') return;
      this.paused = !this.paused;
      this.store.dispatch({ type: 'TOGGLE_PAUSE' });
      this.updateHeader();
      this.screen.render();
      if (!this.paused) {
        this.advanceTurn();
      }
    });

    this.screen.key(['escape'], () => {
      if (this.currentPhase === 'victory' || this.currentPhase === 'defeat') return;
      this.showAbandonConfirm();
    });

    this.screen.key(['p'], () => {
      if (this.currentPhase === 'victory' || this.currentPhase === 'defeat') return;
      if (!this.paused) {
        this.paused = true;
        this.store.dispatch({ type: 'TOGGLE_PAUSE' });
        this.updateHeader();
        this.screen.render();
      }
      this.showPotionSelect();
    });
  }

  private showAbandonConfirm(): void {
    const confirmBox = blessed.box({
      top: 'center', left: 'center', width: 40, height: 8,
      content: '{bold}{red-fg}\uc815\ub9d0 \ud3ec\uae30\ud558\uc2dc\uaca0\uc2b5\ub2c8\uae4c?{/red-fg}{/bold}\n\n\ud3ec\uae30\ud558\uba74 \ub358\uc804\uc744 \ud0c8\ucd9c\ud569\ub2c8\ub2e4.\n\uc2a4\ud2b8\ub808\uc2a4\uac00 \uc99d\uac00\ud569\ub2c8\ub2e4.\n\n{gray-fg}Y: \ud3ec\uae30  N: \ucde8\uc18c{/gray-fg}',
      tags: true,
      border: { type: 'line' },
      style: { fg: 'white', bg: 'black', border: { fg: 'red' } },
      align: 'center',
    });
    this.addWidget(confirmBox);
    this.screen.render();

    const cleanup = () => {
      confirmBox.destroy();
      const idx = this.widgets.indexOf(confirmBox);
      if (idx !== -1) this.widgets.splice(idx, 1);
    };

    (this.screen as any).onceKey(['y'], () => {
      cleanup();
      // Apply stress and go back to town
      const state = this.store.getState();
      for (const hero of state.party) {
        if (hero && hero.stats.hp > 0) {
          const updated = {
            ...hero,
            stats: { ...hero.stats, stress: Math.min(200, hero.stats.stress + 15) },
          };
          this.store.dispatch({ type: 'UPDATE_PARTY_HERO', hero: updated });
        }
      }
      this.store.dispatch({ type: 'SET_CONTINUOUS_RUN', enabled: false });
      this.store.dispatch({ type: 'NAVIGATE', screen: 'town' });
    });

    (this.screen as any).onceKey(['n', 'escape'], () => {
      cleanup();
      this.screen.render();
    });
  }

  private executeAutoHeroTurn(): void {
    if (this.destroyed) return;
    const turn = this.combat.turnOrder[this.combat.currentTurnIndex];
    if (!turn || !turn.isHero) return;

    const hero = this.combat.heroes.find(h => h.id === turn.id);
    if (!hero || hero.stats.hp <= 0) return;

    const action = getHeroAutoAction(hero, this.combat);
    if (!action) {
      // No valid action, skip turn
      this.combat.log.push(`${hero.name}: \uc720\ud6a8\ud55c \ud589\ub3d9 \uc5c6\uc74c, \ud134 \ub118\uae40`);
      this.updateDisplay();
      setTimeout(() => {
        if (!this.destroyed) this.nextTurn();
      }, Math.floor(200 / this.speed));
      return;
    }

    this.currentPhase = 'animating';
    setTimeout(() => {
      if (!this.destroyed && !this.paused) this.executeHeroAction(action.skillIndex, action.targetId);
    }, Math.floor(600 / this.speed));
  }

  private checkMainCharFlee(): boolean {
    const state = this.store.getState();
    const mcId = state.mainCharacterId;
    if (!mcId) return false;
    const mc = this.combat.heroes.find(h => h.id === mcId);
    if (!mc || mc.stats.hp <= 0) return false;
    if (mc.stats.hp <= mc.stats.maxHp * 0.05) {
      this.combat.log.push('{bold}{red-fg}주인공의 HP가 위험! 긴급 도주!{/red-fg}{/bold}');
      this.updateDisplay();
      setTimeout(() => {
        if (!this.destroyed) {
          this.store.dispatch({ type: 'MAIN_CHAR_FLEE' });
        }
      }, Math.floor(1500 / this.speed));
      return true;
    }
    return false;
  }

  private checkMainCharDead(): boolean {
    const state = this.store.getState();
    const mcId = state.mainCharacterId;
    if (!mcId) return false;
    const mc = this.combat.heroes.find(h => h.id === mcId);
    if (mc && mc.stats.hp <= 0 && !mc.isDeathsDoor) {
      this.combat.log.push('{bold}{red-fg}주인공이 쓰러졌습니다!{/red-fg}{/bold}');
      this.store.dispatch({ type: 'SET_COMBAT', combat: this.combat });
      this.updateDisplay();
      setTimeout(() => {
        if (!this.destroyed) {
          this.store.dispatch({ type: 'END_COMBAT_DEFEAT' });
        }
      }, Math.floor(2000 / this.speed));
      return true;
    }
    return false;
  }

  private executeHeroAction(skillIndex: number, targetId: string): void {
    if (this.destroyed) return;
    const turn = this.combat.turnOrder[this.combat.currentTurnIndex];
    if (!turn) return;

    // Track monsters before attack to detect kills
    const monsterHpBefore: Record<string, number> = {};
    for (const m of this.combat.monsters) {
      monsterHpBefore[m.id] = m.stats.hp;
    }

    const result = executeHeroSkill(this.combat, turn.id, skillIndex, targetId);
    this.combat = result.combat;

    // Check for kills - hero that dealt killing blow loses 5 stress
    const heroIdx = this.combat.heroes.findIndex(h => h.id === turn.id);
    if (heroIdx !== -1) {
      for (const m of this.combat.monsters) {
        if (monsterHpBefore[m.id]! > 0 && m.stats.hp <= 0) {
          const stressResult = applyStress(this.combat.heroes[heroIdx]!, -5);
          this.combat.heroes[heroIdx] = stressResult.hero;
          this.combat.log.push(`${this.combat.heroes[heroIdx]!.name}\uc774(\uac00) \uc548\ub3c4\ud569\ub2c8\ub2e4. (\uc2a4\ud2b8\ub808\uc2a4 -5)`);
        }
      }
    }

    this.store.dispatch({ type: 'SET_COMBAT', combat: this.combat });
    this.updateDisplay();

    // Check MC flee/death
    if (this.checkMainCharFlee()) return;
    if (this.checkMainCharDead()) return;

    const endState = checkCombatEnd(this.combat);
    if (endState === 'victory') {
      this.handleVictory();
      return;
    }
    if (endState === 'defeat') {
      this.handleDefeat();
      return;
    }

    setTimeout(() => {
      if (!this.destroyed && !this.paused) this.nextTurn();
    }, Math.floor(400 / this.speed));
  }

  private advanceTurn(): void {
    if (this.destroyed) return;

    while (this.combat.currentTurnIndex < this.combat.turnOrder.length) {
      const turn = this.combat.turnOrder[this.combat.currentTurnIndex]!;

      if (turn.isHero) {
        const hero = this.combat.heroes.find(h => h.id === turn.id);
        if (hero && hero.stats.hp > 0) {
          // Process hero DOTs
          const dotResult = processStatusEffects(hero);
          const updatedHero = dotResult.entity as Hero;
          const heroIdx = this.combat.heroes.findIndex(h => h.id === hero.id);
          if (heroIdx !== -1) {
            this.combat.heroes[heroIdx] = updatedHero;
            this.combat.log.push(...dotResult.log);
          }

          if (updatedHero.stats.hp <= 0) {
            this.applyAllyDeathStress(updatedHero.id);
            this.combat.currentTurnIndex++;
            continue;
          }

          // Check stun
          if (isStunned(updatedHero.statusEffects)) {
            this.combat.log.push(`${updatedHero.name}\uc740(\ub294) \uae30\uc808 \uc0c1\ud0dc\uc785\ub2c8\ub2e4!`);
            this.combat.heroes[heroIdx] = {
              ...updatedHero,
              statusEffects: removeStun(updatedHero.statusEffects),
            };
            this.combat.currentTurnIndex++;
            this.updateDisplay();
            continue;
          }

          // Tick effects
          if (heroIdx !== -1) {
            this.combat.heroes[heroIdx] = {
              ...this.combat.heroes[heroIdx]!,
              statusEffects: tickStatusEffects(this.combat.heroes[heroIdx]!.statusEffects),
            };
          }

          // Check affliction behavior
          if (this.combat.heroes[heroIdx]!.affliction) {
            const behavior = processAfflictionBehavior(this.combat.heroes[heroIdx]!);
            if (behavior) {
              this.combat.log.push(...behavior.log);
              if (behavior.action === 'skip') {
                this.combat.currentTurnIndex++;
                this.updateDisplay();
                continue;
              }
              if (behavior.action === 'stress_party') {
                for (let i = 0; i < this.combat.heroes.length; i++) {
                  if (this.combat.heroes[i]!.id !== hero.id && this.combat.heroes[i]!.stats.hp > 0) {
                    const stressResult = applyStress(this.combat.heroes[i]!, 5);
                    this.combat.heroes[i] = stressResult.hero;
                  }
                }
                this.combat.currentTurnIndex++;
                this.updateDisplay();
                continue;
              }
            }
          }

          // Hero's turn - always auto
          this.currentPhase = 'animating';
          this.updateDisplay();
          this.executeAutoHeroTurn();
          return;
        }
      } else {
        const monster = this.combat.monsters.find(m => m.id === turn.id);
        if (monster && monster.stats.hp > 0) {
          this.currentPhase = 'enemy_turn';
          this.updateDisplay();

          setTimeout(() => {
            if (!this.destroyed && !this.paused) this.executeEnemyAction(turn.id);
          }, Math.floor(800 / this.speed));
          return;
        }
      }

      this.combat.currentTurnIndex++;
    }

    // All turns done - new round
    this.newRound();
  }

  private nextTurn(): void {
    if (this.destroyed) return;
    this.combat.currentTurnIndex++;
    this.store.dispatch({ type: 'SET_COMBAT', combat: this.combat });

    const endState = checkCombatEnd(this.combat);
    if (endState === 'victory') {
      this.handleVictory();
      return;
    }
    if (endState === 'defeat') {
      this.handleDefeat();
      return;
    }

    this.advanceTurn();
  }

  private executeEnemyAction(monsterId: string): void {
    if (this.destroyed) return;

    const heroHpBefore: Record<string, number> = {};
    for (const h of this.combat.heroes) {
      heroHpBefore[h.id] = h.stats.hp;
    }

    const result = executeEnemyTurn(this.combat, monsterId);
    this.combat = result.combat;

    // Check for hero deaths
    for (const h of this.combat.heroes) {
      if (heroHpBefore[h.id]! > 0 && h.stats.hp <= 0 && !h.isDeathsDoor) {
        this.applyAllyDeathStress(h.id);
      }
    }

    this.store.dispatch({ type: 'SET_COMBAT', combat: this.combat });
    this.updateDisplay();

    // Check MC flee/death after enemy turn
    if (this.checkMainCharFlee()) return;
    if (this.checkMainCharDead()) return;

    const endState = checkCombatEnd(this.combat);
    if (endState === 'victory') {
      setTimeout(() => { if (!this.destroyed) this.handleVictory(); }, Math.floor(600 / this.speed));
      return;
    }
    if (endState === 'defeat') {
      setTimeout(() => { if (!this.destroyed) this.handleDefeat(); }, Math.floor(600 / this.speed));
      return;
    }

    setTimeout(() => {
      if (!this.destroyed && !this.paused) this.nextTurn();
    }, Math.floor(400 / this.speed));
  }

  private applyAllyDeathStress(deadHeroId: string): void {
    this.combat.log.push('{red-fg}\ub3d9\ub8cc\uc758 \uc8fd\uc74c\uc5d0 \ud30c\ud2f0\uac00 \ub3d9\uc694\ud569\ub2c8\ub2e4! (\uc2a4\ud2b8\ub808\uc2a4 +15){/red-fg}');
    for (let i = 0; i < this.combat.heroes.length; i++) {
      const h = this.combat.heroes[i]!;
      if (h.id !== deadHeroId && h.stats.hp > 0) {
        const stressResult = applyStress(h, 15);
        this.combat.heroes[i] = stressResult.hero;
        this.combat.log.push(...stressResult.log);
      }
    }
  }

  private newRound(): void {
    if (this.destroyed) return;
    this.combat.round++;
    this.combat.log.push(`--- \ub77c\uc6b4\ub4dc ${this.combat.round} ---`);
    this.combat.turnOrder = generateTurnOrder(this.combat.heroes, this.combat.monsters);
    this.combat.currentTurnIndex = 0;
    this.store.dispatch({ type: 'SET_COMBAT', combat: this.combat });
    this.advanceTurn();
  }

  private handleVictory(): void {
    if (this.destroyed) return;
    this.currentPhase = 'victory';
    const state = this.store.getState();
    const tower = state.tower;
    const floor = tower ? tower.currentFloor : 1;
    const torchLevel = tower ? tower.torchLevel : 100;

    const hasBoss = this.combat.monsters.some(m => m.isBoss && m.stats.hp <= 0);
    const loot = hasBoss
      ? generateBossLoot(floor)
      : generateCombatLoot(floor, torchLevel);

    // Calculate EXP for display
    const monsterCount = this.combat.monsters.length;
    const hasBossMonster = this.combat.monsters.some(m => m.isBoss);
    const baseExp = floor * 10 + monsterCount * 15;
    const earnedExp = hasBossMonster ? baseExp * 3 : baseExp;

    this.combat.log.push(hasBoss ? '{bold}{green-fg}\ubcf4\uc2a4 \ucc98\uce58!{/green-fg}{/bold}' : '{green-fg}\uc804\ud22c \uc2b9\ub9ac!{/green-fg}');
    this.combat.log.push(`{bold}{yellow-fg}\uace8\ub4dc +${loot.gold}{/yellow-fg}{/bold}`);
    this.combat.log.push(`{bold}{cyan-fg}경험치 +${earnedExp}{/cyan-fg}{/bold}`);
    for (const item of loot.items) {
      this.combat.log.push(`\ud68d\ub4dd: ${item.name}`);
    }
    this.updateDisplay();

    const titleText = hasBoss ? '{bold}{yellow-fg}\ubcf4\uc2a4 \ucc98\uce58!{/yellow-fg}{/bold}' : '{bold}{green-fg}\uc804\ud22c \uc2b9\ub9ac!{/green-fg}{/bold}';
    const borderColor = hasBoss ? 'yellow' : 'green';
    const victoryBox = blessed.box({
      top: 'center', left: 'center', width: 44, height: 11,
      content: `${titleText}\n\n{bold}{yellow-fg}\uace8\ub4dc +${loot.gold}{/yellow-fg}{/bold}\n{bold}{cyan-fg}경험치 +${earnedExp}{/cyan-fg}{/bold}\n\uc544\uc774\ud15c: ${loot.items.map(i => i.name).join(', ') || '\uc5c6\uc74c'}\n\n{gray-fg}\uc790\ub3d9 \uacc4\uc18d...{/gray-fg}`,
      tags: true,
      border: { type: 'line' },
      style: { fg: 'white', bg: 'black', border: { fg: borderColor } },
      align: 'center',
    });
    this.addWidget(victoryBox);
    this.screen.render();

    // Auto-confirm victory after delay
    setTimeout(() => {
      if (this.currentPhase === 'victory' && !this.destroyed) {
        this.store.dispatch({ type: 'END_COMBAT_VICTORY', loot: loot.items, gold: loot.gold });
      }
    }, Math.floor(2500 / this.speed));
  }

  private showPotionSelect(): void {
    const state = this.store.getState();
    const potions = state.inventory.filter(i => i.consumable === true);

    if (potions.length === 0) {
      const msgBox = blessed.box({
        top: 'center', left: 'center', width: 36, height: 5,
        content: '{yellow-fg}사용 가능한 물약이 없습니다.{/yellow-fg}\n\n{gray-fg}아무 키나 누르세요{/gray-fg}',
        tags: true, border: { type: 'line' },
        style: { fg: 'white', bg: 'black', border: { fg: 'yellow' } },
        align: 'center',
      });
      this.addWidget(msgBox);
      this.screen.render();
      (this.screen as any).onceKey([], () => {
        msgBox.destroy();
        const idx = this.widgets.indexOf(msgBox);
        if (idx !== -1) this.widgets.splice(idx, 1);
        this.screen.render();
      });
      return;
    }

    const potionLabels = potions.map(p => {
      const effects: string[] = [];
      if (p.healAmount) effects.push(`HP+${p.healAmount}`);
      if (p.stressHealAmount) effects.push(`ST-${p.stressHealAmount}`);
      if (p.buffEffect) effects.push(`${p.buffEffect.stat}+${p.buffEffect.value}`);
      return `${p.name} (${effects.join(' ')})`;
    });

    const potionList = blessed.list({
      top: 'center', left: 'center', width: 44, height: Math.min(potions.length + 2, 12),
      label: ' 물약 선택 ',
      items: potionLabels, keys: true, vi: false, mouse: true, tags: true,
      border: { type: 'line' },
      style: {
        fg: 'white', bg: 'black', border: { fg: '#ff88ff' },
        selected: { fg: 'black', bg: '#ff88ff', bold: true },
        label: { fg: '#ff88ff' },
      } as any,
    });
    this.addWidget(potionList);
    potionList.focus();
    this.screen.render();

    const cleanupPotion = () => {
      potionList.destroy();
      const idx = this.widgets.indexOf(potionList as any);
      if (idx !== -1) this.widgets.splice(idx, 1);
    };

    potionList.on('select', (_el: any, idx: number) => {
      if (idx >= potions.length) return;
      cleanupPotion();
      this.showPotionTargetSelect(potions[idx]!);
    });

    potionList.key(['escape'], () => {
      cleanupPotion();
      this.screen.render();
    });
  }

  private showPotionTargetSelect(item: Item): void {
    const aliveHeroes = this.combat.heroes.filter(h => h.stats.hp > 0);
    if (aliveHeroes.length === 0) return;

    const heroLabels = aliveHeroes.map(h =>
      `${h.name} (${getClassName(h.class)}) HP ${h.stats.hp}/${h.stats.maxHp} ST ${h.stats.stress}`
    );

    const heroList = blessed.list({
      top: 'center', left: 'center', width: 50, height: Math.min(aliveHeroes.length + 2, 10),
      label: ` ${item.name} 사용 대상 `,
      items: heroLabels, keys: true, vi: false, mouse: true, tags: true,
      border: { type: 'line' },
      style: {
        fg: 'white', bg: 'black', border: { fg: 'cyan' },
        selected: { fg: 'black', bg: 'cyan', bold: true },
        label: { fg: 'cyan' },
      } as any,
    });
    this.addWidget(heroList);
    heroList.focus();
    this.screen.render();

    const cleanupHero = () => {
      heroList.destroy();
      const idx = this.widgets.indexOf(heroList as any);
      if (idx !== -1) this.widgets.splice(idx, 1);
    };

    heroList.on('select', (_el: any, idx: number) => {
      if (idx >= aliveHeroes.length) return;
      const hero = aliveHeroes[idx]!;
      this.store.dispatch({ type: 'USE_COMBAT_ITEM', itemId: item.id, heroId: hero.id });
      this.combat = this.store.getState().combat!;
      cleanupHero();
      this.updateDisplay();
    });

    heroList.key(['escape'], () => {
      cleanupHero();
      this.showPotionSelect();
    });
  }

  private handleDefeat(): void {
    if (this.destroyed) return;
    this.currentPhase = 'defeat';
    this.combat.log.push('{red-fg}\ud30c\ud2f0\uac00 \uc804\uba78\ud588\uc2b5\ub2c8\ub2e4!{/red-fg}');
    this.updateDisplay();

    const defeatBox = blessed.box({
      top: 'center', left: 'center', width: 40, height: 6,
      content: '{bold}{red-fg}\uc804\uba78!{/red-fg}{/bold}\n\n\ub2f9\uc2e0\uc758 \ud30c\ud2f0\ub294 \uc5b4\ub460\uc5d0 \uc0bc\ucf1c\uc84c\uc2b5\ub2c8\ub2e4...\n\n{gray-fg}\uc790\ub3d9 \uacc4\uc18d...{/gray-fg}',
      tags: true,
      border: { type: 'line' },
      style: { fg: 'white', bg: 'black', border: { fg: 'red' } },
      align: 'center',
    });
    this.addWidget(defeatBox);
    this.screen.render();

    // Auto-confirm defeat
    setTimeout(() => {
      if (this.currentPhase === 'defeat' && !this.destroyed) {
        const state = this.store.getState();
        const allDead = state.roster.every(h => h.stats.hp <= 0);
        if (allDead) {
          this.store.dispatch({ type: 'END_COMBAT_DEFEAT' });
        } else {
          this.store.dispatch({ type: 'SET_CONTINUOUS_RUN', enabled: false });
          this.store.dispatch({ type: 'END_COMBAT_DEFEAT' });
        }
      }
    }, Math.floor(3000 / this.speed));
  }
}
