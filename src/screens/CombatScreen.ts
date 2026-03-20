import blessed from 'blessed';
import { BaseScreen } from './BaseScreen.ts';
import type { Hero, Monster, CombatState, Item } from '../models/types.ts';
import { getClassName } from '../data/heroes.ts';
import { formatBar, randomInt, clamp } from '../utils/helpers.ts';

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
  private gridBox!: blessed.Widgets.BoxElement;
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

    // === Left column (33%) ===
    // Header
    this.headerBox = this.createBox({
      top: 0, left: 0, width: '33%', height: 3,
      tags: true,
      border: { type: 'line' },
      style: { fg: 'white', bg: 'black', border: { fg: 'red' } },
    });

    // Turn order queue
    this.turnOrderBox = this.createBox({
      top: 3, left: 0, width: '33%', height: 3,
      tags: true,
      border: { type: 'line' },
      label: ' 순서 ',
      style: { fg: 'white', bg: 'black', border: { fg: 'gray' }, label: { fg: 'gray' } } as any,
    });

    // Combat log (fills remaining left column height)
    this.logBox = this.createBox({
      top: 6, left: 0, width: '33%', bottom: 1,
      label: ' 전투 기록 ',
      tags: true,
      border: { type: 'line' },
      scrollable: true,
      alwaysScroll: true,
      style: { fg: 'gray', bg: 'black', border: { fg: 'gray' }, label: { fg: 'gray' } } as any,
    });

    // === Right column (67%) ===
    // Grid visualization area
    this.gridBox = this.createBox({
      top: 0, left: '33%', width: '67%', bottom: 1,
      label: ' 전장 ',
      tags: true,
      border: { type: 'line' },
      style: { fg: 'white', bg: 'black', border: { fg: 'yellow' }, label: { fg: 'yellow' } } as any,
    });

    // === Bottom (100%) ===
    // Hint
    this.hintBox = this.createBox({
      bottom: 0, left: 0, width: '100%', height: 1,
      tags: true,
      content: '{gray-fg}1/2/3:속도  Space:일시정지  P:물약  Esc:포기{/gray-fg}',
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
    this.updateGrid();
    this.updateLog();
    this.screen.render();
  }

  private updateHeader(): void {
    const towerState = this.store.getState().tower;
    const floorNum = towerState ? towerState.currentFloor : 0;
    const isBossFloor = floorNum > 0 && floorNum % 10 === 0;
    const floorLabel = isBossFloor ? `{red-fg}B${floorNum}{/red-fg}` : `${floorNum}F`;
    const speedBtns = [1, 2, 3].map(s => s === this.speed ? `{yellow-fg}[${s}]{/yellow-fg}` : `{gray-fg}[${s}]{/gray-fg}`).join('');
    const pauseLabel = this.paused ? ' {red-fg}⏸{/red-fg}' : '';
    this.headerBox.setContent(` R${this.combat.round} ${floorLabel} ${speedBtns}${pauseLabel}`);
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

  /** Truncate a name to fit in a grid cell (max ~6 display chars) */
  private truncName(name: string, maxWidth: number = 6): string {
    let width = 0;
    let result = '';
    for (const ch of name) {
      const w = ch.charCodeAt(0) > 0x7f ? 2 : 1;
      if (width + w > maxWidth) break;
      width += w;
      result += ch;
    }
    return result;
  }

  /** Build a 3x3 grid string for one side (enemy or ally) */
  private buildGridSide(
    units: Array<{ name: string; hp: number; maxHp: number; pos: { row: number; col: number }; isCurrent: boolean; isDead: boolean; isBoss?: boolean; effects: string }>,
    isEnemy: boolean,
  ): string[] {
    // Grid: 3 cols x 3 rows. For enemies, col order is 후(3) 중(2) 전(1). For allies, col order is 전(1) 중(2) 후(3).
    const colOrder = isEnemy ? [3, 2, 1] : [1, 2, 3];
    const colLabels = isEnemy ? ['후', '중', '전'] : ['전', '중', '후'];
    const CELL_W = 10;

    // Build cell content: 3 lines per row
    const lines: string[] = [];

    // Column headers
    let headerLine = ' ';
    for (let ci = 0; ci < 3; ci++) {
      const label = colLabels[ci]!;
      headerLine += `   ${label}     `;
    }
    lines.push(headerLine);

    // Top border
    let topBorder = ' ';
    for (let ci = 0; ci < 3; ci++) {
      topBorder += '\u250c' + '\u2500'.repeat(CELL_W) + '\u2510';
    }
    lines.push(topBorder);

    for (let row = 1; row <= 3; row++) {
      let nameLine = ' ';
      let hpLine = ' ';
      let bottomBorder = ' ';
      const isLastRow = row === 3;

      for (let ci = 0; ci < 3; ci++) {
        const col = colOrder[ci]!;
        const unit = units.find(u => u.pos.row === row && u.pos.col === col && !u.isDead);

        if (unit) {
          const borderColor = unit.isCurrent ? 'yellow' : isEnemy ? 'red' : 'cyan';
          const nameColor = unit.isBoss ? 'red' : isEnemy ? 'red' : 'cyan';
          const truncated = this.truncName(unit.name, CELL_W);
          // Compute display width of truncated name
          let nameDisplayWidth = 0;
          for (const ch of truncated) {
            nameDisplayWidth += ch.charCodeAt(0) > 0x7f ? 2 : 1;
          }
          const namePad = Math.max(0, CELL_W - nameDisplayWidth);
          nameLine += `{${borderColor}-fg}\u2502{/${borderColor}-fg}{${nameColor}-fg}${truncated}{/${nameColor}-fg}${' '.repeat(namePad)}{${borderColor}-fg}\u2502{/${borderColor}-fg}`;

          // HP bar
          const hpPct = unit.maxHp > 0 ? unit.hp / unit.maxHp : 0;
          const hpColor = hpPct > 0.5 ? 'green' : hpPct > 0.25 ? 'yellow' : 'red';
          const barLen = CELL_W;
          const filled = Math.round(hpPct * barLen);
          const hpBar = `{${hpColor}-fg}${'█'.repeat(filled)}{/${hpColor}-fg}{gray-fg}${'░'.repeat(barLen - filled)}{/gray-fg}`;
          hpLine += `{${borderColor}-fg}\u2502{/${borderColor}-fg}${hpBar}{${borderColor}-fg}\u2502{/${borderColor}-fg}`;
        } else {
          // Empty cell
          nameLine += '{gray-fg}\u2502{/gray-fg}' + ' '.repeat(CELL_W) + '{gray-fg}\u2502{/gray-fg}';
          hpLine += '{gray-fg}\u2502{/gray-fg}' + '{gray-fg}' + '\u2500'.repeat(CELL_W) + '{/gray-fg}' + '{gray-fg}\u2502{/gray-fg}';
        }
      }

      // Bottom border for this row
      for (let ci = 0; ci < 3; ci++) {
        const col = colOrder[ci]!;
        const unit = units.find(u => u.pos.row === row && u.pos.col === col && !u.isDead);
        const borderColor = unit?.isCurrent ? 'yellow' : 'gray';
        if (isLastRow) {
          bottomBorder += `{${borderColor}-fg}\u2514${'─'.repeat(CELL_W)}\u2518{/${borderColor}-fg}`;
        } else {
          bottomBorder += `{${borderColor}-fg}\u251c${'─'.repeat(CELL_W)}\u2524{/${borderColor}-fg}`;
        }
      }

      lines.push(nameLine);
      lines.push(hpLine);
      lines.push(bottomBorder);
    }

    return lines;
  }

  private updateGrid(): void {
    const currentTurn = this.combat.turnOrder[this.combat.currentTurnIndex];

    // Build enemy units
    const enemyUnits = this.combat.monsters.map(m => ({
      name: m.isBoss ? '\u2605' + m.name : m.name,
      hp: m.stats.hp,
      maxHp: m.stats.maxHp,
      pos: m.position,
      isCurrent: !!(currentTurn && !currentTurn.isHero && currentTurn.id === m.id),
      isDead: m.stats.hp <= 0,
      isBoss: m.isBoss,
      effects: this.formatEffects(m.statusEffects),
    }));

    // Build ally units
    const allyUnits = this.combat.heroes.map(h => ({
      name: h.isMainCharacter ? '\u2605' + h.name : h.name,
      hp: h.stats.hp,
      maxHp: h.stats.maxHp,
      pos: h.position,
      isCurrent: !!(currentTurn && currentTurn.isHero && currentTurn.id === h.id),
      isDead: h.stats.hp <= 0 && !h.isDeathsDoor,
      isBoss: false,
      effects: this.formatEffects(h.statusEffects),
    }));

    const enemyGrid = this.buildGridSide(enemyUnits, true);
    const allyGrid = this.buildGridSide(allyUnits, false);

    // Current turn indicator
    let turnLabel = '';
    if (currentTurn) {
      if (currentTurn.isHero) {
        const hero = this.combat.heroes.find(h => h.id === currentTurn.id);
        turnLabel = hero ? `{yellow-fg}> ${hero.name}의 차례{/yellow-fg}` : '';
      } else {
        const monster = this.combat.monsters.find(m => m.id === currentTurn.id);
        turnLabel = monster ? `{red-fg}> ${monster.name}의 차례{/red-fg}` : '';
      }
    }

    // Compose full grid content
    let content = '';
    content += ` {bold}{red-fg}[ 적 진영 ]{/red-fg}{/bold}              {bold}{cyan-fg}[ 아군 진영 ]{/cyan-fg}{/bold}\n`;

    // Merge enemy and ally lines side by side
    const maxLines = Math.max(enemyGrid.length, allyGrid.length);
    for (let i = 0; i < maxLines; i++) {
      const eLine = i < enemyGrid.length ? enemyGrid[i]! : '';
      const aLine = i < allyGrid.length ? allyGrid[i]! : '';
      content += `${eLine}  ${aLine}\n`;
    }

    // Unit details below the grid
    content += '\n';
    content += turnLabel + '\n';

    // Show status effects summary for alive units
    const aliveEnemies = this.combat.monsters.filter(m => m.stats.hp > 0);
    const aliveHeroes = this.combat.heroes.filter(h => h.stats.hp > 0 || h.isDeathsDoor);

    for (const m of aliveEnemies) {
      const effects = this.formatEffects(m.statusEffects);
      const hpPct = m.stats.hp / m.stats.maxHp;
      const hpColor = hpPct > 0.5 ? 'green' : hpPct > 0.25 ? 'yellow' : 'red';
      const boss = m.isBoss ? '{red-fg}[B]{/red-fg}' : '';
      content += ` ${boss}{red-fg}${m.name}{/red-fg} {${hpColor}-fg}${m.stats.hp}/${m.stats.maxHp}{/${hpColor}-fg} ${effects}\n`;
    }
    for (const h of aliveHeroes) {
      const effects = this.formatEffects(h.statusEffects);
      const hpPct = h.stats.hp / h.stats.maxHp;
      const hpColor = hpPct > 0.5 ? 'green' : hpPct > 0.25 ? 'yellow' : 'red';
      const deathsDoor = h.isDeathsDoor ? '{red-fg}[죽문]{/red-fg}' : '';
      const mc = h.isMainCharacter ? '{yellow-fg}[MC]{/yellow-fg}' : '';
      content += ` ${mc}{cyan-fg}${h.name}{/cyan-fg} {${hpColor}-fg}${h.stats.hp}/${h.stats.maxHp}{/${hpColor}-fg} ${deathsDoor}${effects}\n`;
    }

    this.gridBox.setContent(content);
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
    this.registerKey(['1'], () => {
      if (this.currentPhase === 'victory' || this.currentPhase === 'defeat') return;
      this.speed = 1;
      this.store.dispatch({ type: 'SET_GAME_SPEED', speed: 1 });
      this.updateHeader();
      this.screen.render();
    });

    this.registerKey(['2'], () => {
      if (this.currentPhase === 'victory' || this.currentPhase === 'defeat') return;
      this.speed = 2;
      this.store.dispatch({ type: 'SET_GAME_SPEED', speed: 2 });
      this.updateHeader();
      this.screen.render();
    });

    this.registerKey(['3'], () => {
      if (this.currentPhase === 'victory' || this.currentPhase === 'defeat') return;
      this.speed = 3;
      this.store.dispatch({ type: 'SET_GAME_SPEED', speed: 3 });
      this.updateHeader();
      this.screen.render();
    });

    this.registerKey(['space'], () => {
      if (this.currentPhase === 'victory' || this.currentPhase === 'defeat') return;
      this.paused = !this.paused;
      this.store.dispatch({ type: 'TOGGLE_PAUSE' });
      this.updateHeader();
      this.screen.render();
      if (!this.paused) {
        this.advanceTurn();
      }
    });

    this.registerKey(['escape'], () => {
      if (this.currentPhase === 'victory' || this.currentPhase === 'defeat') return;
      this.showAbandonConfirm();
    });

    this.registerKey(['p'], () => {
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
    this.paused = true;

    const confirmBox = blessed.box({
      top: 'center', left: 'center', width: 40, height: 8,
      content: '{bold}{red-fg}정말 포기하시겠습니까?{/red-fg}{/bold}\n\n포기하면 던전을 탈출합니다.\n\n{gray-fg}Y: 포기  N: 취소{/gray-fg}',
      tags: true,
      border: { type: 'line' },
      style: { fg: 'white', bg: 'black', border: { fg: 'red' } },
      align: 'center',
    });
    this.addWidget(confirmBox);
    this.screen.render();

    let handled = false;
    const cleanup = () => {
      if (handled) return;
      handled = true;
      confirmBox.destroy();
      const idx = this.widgets.indexOf(confirmBox);
      if (idx !== -1) this.widgets.splice(idx, 1);
      (this.screen as any).unkey(['y'], yHandler);
      (this.screen as any).unkey(['n', 'escape'], nHandler);
    };

    const yHandler = () => {
      if (handled) return;
      cleanup();
      this.store.dispatch({ type: 'SET_CONTINUOUS_RUN', enabled: false });
      this.store.dispatch({ type: 'NAVIGATE', screen: 'town' });
    };

    const nHandler = () => {
      if (handled) return;
      cleanup();
      this.paused = false;
      this.store.dispatch({ type: 'TOGGLE_PAUSE' }); // unpause
      this.updateHeader();
      this.screen.render();
      this.advanceTurn();
    };

    this.screen.key(['y'], yHandler);
    this.screen.key(['n', 'escape'], nHandler);
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
    const hasBoss = this.combat.monsters.some(m => m.isBoss && m.stats.hp <= 0);
    const loot = hasBoss
      ? generateBossLoot(floor)
      : generateCombatLoot(floor);

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
      `${h.name} (${getClassName(h.class)}) HP ${h.stats.hp}/${h.stats.maxHp}`
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
