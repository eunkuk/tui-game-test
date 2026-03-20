import blessed from 'blessed';
import { BaseScreen } from './BaseScreen.ts';
import type { Hero, FloorMap, TileType } from '../models/types.ts';
import { getClassName, getStars } from '../data/heroes.ts';
import { formatBar, randomInt, randomChoice, percentChance, clamp } from '../utils/helpers.ts';
import { createMonsterGroupScaled } from '../engine/monster-factory.ts';
import { createItemCopy, SUPPLY_ITEMS } from '../data/items.ts';
import { applyStress } from '../engine/stress-engine.ts';
import { getDifficulty, getStatMultiplier } from '../data/dungeons.ts';
import { updateFOV, getFOVRadius } from '../engine/map-generator.ts';
import { findNextTarget, computePath } from '../engine/auto-explorer.ts';
import { generateTreasureLoot } from '../engine/loot-generator.ts';
import { showLootPopup } from '../ui/LootPopup.ts';

export class DungeonScreen extends BaseScreen {
  private mapBox!: blessed.Widgets.BoxElement;
  private partyBox!: blessed.Widgets.BoxElement;
  private logBox!: blessed.Widgets.BoxElement;
  private headerBox!: blessed.Widgets.BoxElement;
  private hintBox!: blessed.Widgets.BoxElement;
  private autoTimer: ReturnType<typeof setTimeout> | null = null;
  private speed: 1 | 2 | 3 = 1;
  private destroyed = false;
  private explorationLog: string[] = [];
  private exploring = false;
  private currentPath: [number, number][] = [];
  private paused = false;
  private lootPopup: { destroy: () => void; active: boolean } | null = null;
  private autoMode = true; // true=자동, false=수동

  destroy(): void {
    this.destroyed = true;
    if (this.autoTimer) {
      clearTimeout(this.autoTimer);
      this.autoTimer = null;
    }
    if (this.lootPopup) {
      this.lootPopup.destroy();
      this.lootPopup = null;
    }
    super.destroy();
  }

  render(): void {
    const state = this.store.getState();
    const tower = state.tower;
    if (!tower) return;

    this.speed = state.gameSpeed;
    this.paused = state.paused;

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
    this.updateHeader();

    // Map viewer
    this.mapBox = this.createBox({
      top: 3, left: 0, width: '100%', height: 16,
      tags: true,
      border: { type: 'line' },
      label: ' 지도 ',
      style: { fg: 'white', bg: 'black', border: { fg: 'gray' }, label: { fg: 'gray' } } as any,
    });
    this.renderMap();

    // Party status
    this.partyBox = this.createBox({
      top: 19, left: 0, width: '40%', height: 8,
      tags: true,
      border: { type: 'line' },
      label: ' 파티 ',
      style: { fg: 'white', bg: 'black', border: { fg: 'blue' }, label: { fg: 'cyan' } } as any,
    });
    this.updatePartyStatus();

    // Exploration log
    this.logBox = this.createBox({
      top: 19, left: '40%', width: '60%', height: 8,
      tags: true,
      border: { type: 'line' },
      label: ' 기록 ',
      scrollable: true,
      alwaysScroll: true,
      style: { fg: 'gray', bg: 'black', border: { fg: 'gray' }, label: { fg: 'gray' } } as any,
    });

    // Hint
    this.hintBox = this.createBox({
      bottom: 0, left: 0, width: '100%', height: 1,
      tags: true,
      style: { fg: 'gray', bg: 'black' },
    });
    this.updateHint();

    this.setupKeys();
    this.screen.render();

    // Start exploration
    this.startExploration();
  }

  private updateHint(): void {
    if (this.autoMode) {
      this.hintBox.setContent('{gray-fg}1/2/3:속도  Space:일시정지  Tab:수동모드  Esc:탈출{/gray-fg}');
    } else {
      this.hintBox.setContent('{gray-fg}↑↓←→/WASD:이동  Tab:자동모드  Esc:탈출{/gray-fg}');
    }
  }

  private updateHeader(): void {
    const state = this.store.getState();
    const tower = state.tower;
    if (!tower) return;

    const torchColor = tower.torchLevel > 50 ? 'yellow' : tower.torchLevel > 25 ? '#ff8800' : 'red';
    const torchBar = formatBar(tower.torchLevel, 100, 10);
    const torchWarning = tower.torchLevel <= 25 ? ' {red-fg}[위험!]{/red-fg}' : '';
    const speedBtns = [1, 2, 3].map(s => s === this.speed ? `{yellow-fg}[${s}x]{/yellow-fg}` : `{gray-fg}[${s}x]{/gray-fg}`).join(' ');
    const continuous = state.continuousRun ? '  {yellow-fg}[연속]{/yellow-fg}' : '';
    const diff = getDifficulty(tower.currentFloor);
    const stars = '\u2605'.repeat(diff);
    const pauseLabel = this.paused ? '  {bold}{red-fg}[일시정지]{/red-fg}{/bold}' : '';
    const modeLabel = this.autoMode ? '{cyan-fg}[자동]{/cyan-fg}' : '{yellow-fg}[수동]{/yellow-fg}';

    this.headerBox.setContent(` {bold}{red-fg}어둠의 탑{/red-fg}{/bold} ${tower.currentFloor}층  |  최고 ${state.maxFloorReached}층  |  난이도 {yellow-fg}${stars}{/yellow-fg}  |  횃불 {${torchColor}-fg}${torchBar}{/${torchColor}-fg} ${tower.torchLevel}%${torchWarning}  |  ${speedBtns}  ${modeLabel}${continuous}${pauseLabel}`);
  }

  private renderMap(): void {
    const state = this.store.getState();
    const tower = state.tower;
    if (!tower) return;

    const fm = tower.floorMap;
    const boxWidth = (typeof this.mapBox.width === 'number' ? this.mapBox.width : 80) - 2;
    const boxHeight = (typeof this.mapBox.height === 'number' ? this.mapBox.height : 14) - 2;

    const camX = Math.max(0, Math.min(fm.playerX - Math.floor(boxWidth / 2), fm.width - boxWidth));
    const camY = Math.max(0, Math.min(fm.playerY - Math.floor(boxHeight / 2), fm.height - boxHeight));

    let content = '';
    for (let sy = 0; sy < boxHeight && sy + camY < fm.height; sy++) {
      const y = sy + camY;
      let line = '';
      for (let sx = 0; sx < boxWidth && sx + camX < fm.width; sx++) {
        const x = sx + camX;
        const tile = fm.tiles[y]![x]!;

        if (x === fm.playerX && y === fm.playerY) {
          line += '{bold}{yellow-fg}@{/yellow-fg}{/bold}';
          continue;
        }

        if (!tile.explored) {
          line += '{#333333-fg}\u2591{/#333333-fg}';
          continue;
        }

        if (!tile.visible) {
          line += this.getDimTileChar(tile);
          continue;
        }

        line += this.getTileChar(tile);
      }
      content += line + '\n';
    }

    this.mapBox.setContent(content);
  }

  private getTileChar(tile: { type: TileType; cleared: boolean }): string {
    if (tile.cleared) {
      if (tile.type === 'entrance' || tile.type === 'floor') {
        return '{#555555-fg}.{/#555555-fg}';
      }
      return '{green-fg}\u2713{/green-fg}';
    }

    switch (tile.type) {
      case 'wall': return '{gray-fg}#{/gray-fg}';
      case 'floor': return '{#888888-fg}.{/#888888-fg}';
      case 'entrance': return '{#888888-fg}.{/#888888-fg}';
      case 'exit': return '{bold}{cyan-fg}>{/cyan-fg}{/bold}';
      case 'combat': return '{red-fg}!{/red-fg}';
      case 'treasure': return '{yellow-fg}${/yellow-fg}';
      case 'trap': return '{red-fg}^{/red-fg}';
      case 'curio': return '{magenta-fg}?{/magenta-fg}';
      case 'boss': return '{bold}{red-fg}B{/red-fg}{/bold}';
      default: return '.';
    }
  }

  private getDimTileChar(tile: { type: TileType; cleared: boolean }): string {
    if (tile.cleared) {
      return '{#444444-fg}.{/#444444-fg}';
    }
    switch (tile.type) {
      case 'wall': return '{#444444-fg}#{/#444444-fg}';
      case 'floor': return '{#444444-fg}.{/#444444-fg}';
      case 'entrance': return '{#444444-fg}.{/#444444-fg}';
      case 'exit': return '{#448888-fg}>{/#448888-fg}';
      case 'combat': return '{#884444-fg}!{/#884444-fg}';
      case 'treasure': return '{#888844-fg}${/#888844-fg}';
      case 'trap': return '{#884444-fg}^{/#884444-fg}';
      case 'curio': return '{#664488-fg}?{/#664488-fg}';
      case 'boss': return '{#884444-fg}B{/#884444-fg}';
      default: return '{#444444-fg}.{/#444444-fg}';
    }
  }

  private updatePartyStatus(): void {
    const state = this.store.getState();
    let content = '';
    for (let i = 0; i < 4; i++) {
      const hero = state.party[i];
      if (!hero) continue;
      const starStr = getStars(hero.rarity);
      const hpPct = hero.stats.hp / hero.stats.maxHp;
      const hpColor = hpPct > 0.5 ? 'green' : hpPct > 0.25 ? 'yellow' : 'red';
      const hpBar = formatBar(hero.stats.hp, hero.stats.maxHp, 8);

      const mcTag = hero.isMainCharacter ? '{yellow-fg}[MC]{/yellow-fg}' : '';
      if (hero.stats.hp <= 0) {
        content += `{red-fg}{bold}${hero.name} - 사망{/bold}{/red-fg}\n`;
      } else {
        content += `${mcTag}{yellow-fg}${starStr}{/yellow-fg}{bold}${hero.name}{/bold} {${hpColor}-fg}${hpBar}{/${hpColor}-fg} ${hero.stats.hp}/${hero.stats.maxHp}\n`;
      }
    }
    this.partyBox.setContent(content);
  }

  private updateLog(): void {
    const logs = this.explorationLog.slice(-8);
    this.logBox.setContent(logs.join('\n'));
    (this.logBox as any).setScrollPerc(100);
  }

  private addLog(msg: string): void {
    this.explorationLog.push(msg);
    this.updateLog();
  }

  /** Check if a popup/modal is active — all dungeon keys should be suppressed */
  private isModalActive(): boolean {
    return !!(this.lootPopup && this.lootPopup.active);
  }

  private setupKeys(): void {
    this.screen.key(['1'], () => {
      if (this.isModalActive()) return;
      this.speed = 1;
      this.store.dispatch({ type: 'SET_GAME_SPEED', speed: 1 });
      this.updateHeader();
      this.screen.render();
    });
    this.screen.key(['2'], () => {
      if (this.isModalActive()) return;
      this.speed = 2;
      this.store.dispatch({ type: 'SET_GAME_SPEED', speed: 2 });
      this.updateHeader();
      this.screen.render();
    });
    this.screen.key(['3'], () => {
      if (this.isModalActive()) return;
      this.speed = 3;
      this.store.dispatch({ type: 'SET_GAME_SPEED', speed: 3 });
      this.updateHeader();
      this.screen.render();
    });
    this.screen.key(['space'], () => {
      if (this.isModalActive()) return;
      if (!this.autoMode) return; // 수동모드에선 일시정지 불필요
      this.paused = !this.paused;
      this.store.dispatch({ type: 'TOGGLE_PAUSE' });
      this.updateHeader();
      this.screen.render();
      if (!this.paused && !this.exploring) {
        this.exploring = true;
        this.stepExploration();
      }
    });
    this.screen.key(['escape'], () => {
      if (this.isModalActive()) return;
      this.showRetreatConfirm();
    });

    // Tab: 수동/자동 모드 전환
    this.screen.key(['tab'], () => {
      if (this.isModalActive()) return;
      this.autoMode = !this.autoMode;
      this.updateHeader();
      this.updateHint();
      this.screen.render();

      if (this.autoMode) {
        this.addLog('{cyan-fg}자동 탐험 모드로 전환{/cyan-fg}');
        // Resume auto exploration
        if (!this.exploring && !this.paused) {
          this.currentPath = [];
          this.exploring = true;
          this.stepExploration();
        }
      } else {
        this.addLog('{yellow-fg}수동 이동 모드로 전환 (↑↓←→/WASD){/yellow-fg}');
        // Stop auto exploration
        this.exploring = false;
        if (this.autoTimer) {
          clearTimeout(this.autoTimer);
          this.autoTimer = null;
        }
      }
    });

    // Manual movement keys (WASD + arrow keys)
    this.screen.key(['up', 'w'], () => {
      if (this.isModalActive()) return;
      if (this.autoMode) return;
      this.manualMove(0, -1);
    });
    this.screen.key(['down', 's'], () => {
      if (this.isModalActive()) return;
      if (this.autoMode) return;
      this.manualMove(0, 1);
    });
    this.screen.key(['left', 'a'], () => {
      if (this.isModalActive()) return;
      if (this.autoMode) return;
      this.manualMove(-1, 0);
    });
    this.screen.key(['right', 'd'], () => {
      if (this.isModalActive()) return;
      if (this.autoMode) return;
      this.manualMove(1, 0);
    });
  }

  private manualMove(dx: number, dy: number): void {
    if (this.destroyed) return;

    const state = this.store.getState();
    const tower = state.tower;
    if (!tower) return;

    // Don't allow movement while pending loot
    if (state.pendingLoot) return;

    const fm = tower.floorMap;
    const nx = fm.playerX + dx;
    const ny = fm.playerY + dy;

    // Bounds check
    if (ny < 0 || ny >= fm.height || nx < 0 || nx >= fm.width) return;

    const tile = fm.tiles[ny]![nx]!;
    // Can't walk through walls
    if (tile.type === 'wall') return;

    // Move player
    const newFm = { ...fm };
    newFm.playerX = nx;
    newFm.playerY = ny;

    const radius = getFOVRadius(tower.torchLevel);
    updateFOV(newFm, radius);

    this.store.dispatch({ type: 'UPDATE_FLOOR_MAP', floorMap: newFm });
    this.refreshDisplay();

    // Handle tile event if not cleared
    if (!tile.cleared) {
      const eventTypes = ['combat', 'boss', 'treasure', 'trap', 'curio', 'exit'];
      if (eventTypes.includes(tile.type)) {
        this.handleTileEvent(nx, ny);
      } else {
        // Plain floor/entrance: just clear it
        this.store.dispatch({ type: 'CLEAR_TILE', x: nx, y: ny });
      }
    }

    // Check exit
    if (nx === fm.exitX && ny === fm.exitY && tile.cleared) {
      this.advanceToNextFloor();
    }
  }

  private showRetreatConfirm(): void {
    const confirmBox = blessed.box({
      top: 'center', left: 'center', width: 40, height: 8,
      content: '{bold}{red-fg}정말 탈출하시겠습니까?{/red-fg}{/bold}\n\n탈출하면 탑에서 귀환합니다.\n스트레스가 증가합니다.\n\n{gray-fg}Y: 탈출  N: 취소{/gray-fg}',
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
      this.store.dispatch({ type: 'EXIT_TOWER' });
    });

    (this.screen as any).onceKey(['n', 'escape'], () => {
      cleanup();
      this.screen.render();
    });
  }

  private startExploration(): void {
    if (this.destroyed || this.exploring) return;

    // Check for pending loot first
    const preState = this.store.getState();
    if (preState.pendingLoot) {
      this.showLootDecision();
      return;
    }

    if (!this.autoMode) return; // 수동모드에선 자동 탐험 안 함

    this.exploring = true;

    const state = this.store.getState();
    const tower = state.tower;
    if (!tower) return;

    // Auto use torch if low
    if (tower.torchLevel < 30) {
      const hasTorch = state.inventory.some(i => i.torchAmount && i.consumable);
      if (hasTorch) {
        this.store.dispatch({ type: 'USE_TORCH' });
        this.addLog('횃불 사용! (밝기 +25)');
      }
    }

    this.addLog(`${tower.currentFloor}층 탐험 시작...`);
    this.stepExploration();
  }

  private stepExploration(): void {
    if (this.destroyed || this.paused || !this.autoMode) {
      this.exploring = false;
      return;
    }

    const state = this.store.getState();
    if (state.pendingLoot) {
      this.exploring = false;
      this.showLootDecision();
      return;
    }

    const tower = state.tower;
    if (!tower) return;

    // Safety check
    const aliveHeroes = state.party.filter(h => h !== null && h.stats.hp > 0);
    if (aliveHeroes.length === 0) {
      this.store.dispatch({ type: 'SET_CONTINUOUS_RUN', enabled: false });
      this.store.dispatch({ type: 'NAVIGATE', screen: 'game_over' });
      return;
    }

    const fm = tower.floorMap;

    // Check current tile for events
    const currentTile = fm.tiles[fm.playerY]![fm.playerX]!;
    if (!currentTile.cleared) {
      this.handleTileEvent(fm.playerX, fm.playerY);
      return;
    }

    // Check if on exit and all events are handled
    if (fm.playerX === fm.exitX && fm.playerY === fm.exitY) {
      this.advanceToNextFloor();
      return;
    }

    // Find next target
    const target = findNextTarget(fm);
    if (!target) {
      this.advanceToNextFloor();
      return;
    }

    // Compute path to target
    if (this.currentPath.length === 0) {
      this.currentPath = computePath(fm, target.x, target.y);
    }

    if (this.currentPath.length === 0) {
      this.currentPath = computePath(fm, fm.exitX, fm.exitY);
      if (this.currentPath.length === 0) {
        this.advanceToNextFloor();
        return;
      }
    }

    // Move one step
    const [nextX, nextY] = this.currentPath.shift()!;
    this.autoMovePlayer(nextX, nextY);
  }

  private autoMovePlayer(x: number, y: number): void {
    if (this.destroyed) return;

    const state = this.store.getState();
    const tower = state.tower;
    if (!tower) return;

    const fm = { ...tower.floorMap };
    fm.playerX = x;
    fm.playerY = y;

    const radius = getFOVRadius(tower.torchLevel);
    updateFOV(fm, radius);

    this.store.dispatch({ type: 'UPDATE_FLOOR_MAP', floorMap: fm });

    this.refreshDisplay();

    // Check tile at new position
    const tile = fm.tiles[y]![x]!;
    if (!tile.cleared && tile.type !== 'floor' && tile.type !== 'wall') {
      this.currentPath = [];
      this.autoTimer = setTimeout(() => {
        if (!this.destroyed && !this.paused) {
          this.handleTileEvent(x, y);
        }
      }, Math.floor(500 / this.speed));
      return;
    }

    // Continue moving
    this.autoTimer = setTimeout(() => {
      if (!this.destroyed && !this.paused) {
        this.stepExploration();
      }
    }, Math.floor(100 / this.speed));
  }

  private handleTileEvent(x: number, y: number): void {
    if (this.destroyed) return;

    const state = this.store.getState();
    const tower = state.tower;
    if (!tower) return;

    const tile = tower.floorMap.tiles[y]![x]!;
    const floor = tower.currentFloor;

    switch (tile.type) {
      case 'entrance':
      case 'floor':
        this.store.dispatch({ type: 'CLEAR_TILE', x, y });
        if (this.autoMode) {
          this.autoTimer = setTimeout(() => {
            if (!this.destroyed && !this.paused) this.stepExploration();
          }, Math.floor(100 / this.speed));
        }
        break;

      case 'exit':
        this.store.dispatch({ type: 'CLEAR_TILE', x, y });
        this.addLog('계단 발견! 다음 층으로...');
        this.refreshDisplay();
        this.advanceToNextFloor();
        break;

      case 'combat':
      case 'boss': {
        const roomLabel = tile.type === 'boss' ? `\u2605 보스! \u2605` : '적과 조우!';
        this.addLog(`{red-fg}${roomLabel}{/red-fg}`);
        this.refreshDisplay();

        if (tile.monsterTypes && tile.monsterTypes.length > 0) {
          const statMultiplier = getStatMultiplier(floor);
          const monsters = createMonsterGroupScaled(tile.monsterTypes, statMultiplier);
          const torchLevel = tower.torchLevel;

          let isSurprised = false;
          let enemySurprised = false;

          if (torchLevel < 25) {
            if (percentChance(25)) {
              isSurprised = true;
              this.addLog('{red-fg}기습당했다!{/red-fg}');
            }
          } else if (torchLevel > 75) {
            if (percentChance(15)) {
              enemySurprised = true;
              this.addLog('{green-fg}적을 기습했다!{/green-fg}');
            }
          }

          this.store.dispatch({ type: 'CLEAR_TILE', x, y });
          this.exploring = false;

          this.autoTimer = setTimeout(() => {
            if (!this.destroyed) {
              this.store.dispatch({ type: 'START_COMBAT', monsters, isSurprised, enemySurprised });
            }
          }, Math.floor(1000 / this.speed));
        }
        break;
      }

      case 'treasure': {
        const treasureLoot = generateTreasureLoot(floor);
        this.addLog(`{yellow-fg}보물 발견! 골드 +${treasureLoot.gold}{/yellow-fg}`);
        this.store.dispatch({ type: 'ADD_GOLD', amount: treasureLoot.gold });
        this.store.dispatch({ type: 'CLEAR_TILE', x, y });

        if (treasureLoot.items.length > 0) {
          this.store.dispatch({
            type: 'SET_PENDING_LOOT',
            loot: { items: treasureLoot.items, currentIndex: 0, gold: 0, source: 'treasure' },
          });
          this.refreshDisplay();
          this.exploring = false;
          this.autoTimer = setTimeout(() => {
            if (!this.destroyed) this.showLootDecision();
          }, Math.floor(500 / this.speed));
        } else {
          this.refreshDisplay();
          if (this.autoMode) {
            this.autoTimer = setTimeout(() => {
              if (!this.destroyed && !this.paused) this.stepExploration();
            }, Math.floor(800 / this.speed));
          }
        }
        break;
      }

      case 'trap': {
        const diff = getDifficulty(floor);
        const damage = tile.trapDamage || (randomInt(3, 8) + diff * 2);
        const stressDmg = randomInt(5, 15);
        this.addLog(`{red-fg}함정! 파티 전체 ${damage} 피해!{/red-fg}`);

        const currentState = this.store.getState();
        for (const hero of currentState.party) {
          if (hero && hero.stats.hp > 0) {
            const updated = {
              ...hero,
              stats: {
                ...hero.stats,
                hp: Math.max(1, hero.stats.hp - damage),
                stress: Math.min(200, hero.stats.stress + stressDmg),
              },
            };
            this.store.dispatch({ type: 'UPDATE_PARTY_HERO', hero: updated });
          }
        }
        this.store.dispatch({ type: 'CLEAR_TILE', x, y });
        this.refreshDisplay();
        if (this.autoMode) {
          this.autoTimer = setTimeout(() => {
            if (!this.destroyed && !this.paused) this.stepExploration();
          }, Math.floor(800 / this.speed));
        }
        break;
      }

      case 'curio': {
        this.addLog('{magenta-fg}수상한 물건... 지나침.{/magenta-fg}');
        this.store.dispatch({ type: 'CLEAR_TILE', x, y });
        this.refreshDisplay();
        if (this.autoMode) {
          this.autoTimer = setTimeout(() => {
            if (!this.destroyed && !this.paused) this.stepExploration();
          }, Math.floor(800 / this.speed));
        }
        break;
      }

      default:
        this.store.dispatch({ type: 'CLEAR_TILE', x, y });
        if (this.autoMode) {
          this.autoTimer = setTimeout(() => {
            if (!this.destroyed && !this.paused) this.stepExploration();
          }, Math.floor(100 / this.speed));
        }
        break;
    }
  }

  private showLootDecision(): void {
    if (this.destroyed) return;
    if (this.lootPopup && this.lootPopup.active) return; // already showing

    const state = this.store.getState();
    if (!state.pendingLoot) {
      // No more loot, resume exploration
      if (this.autoMode) {
        this.exploring = true;
        this.stepExploration();
      }
      return;
    }

    const currentItem = state.pendingLoot.items[state.pendingLoot.currentIndex];
    if (!currentItem) {
      this.store.dispatch({ type: 'CLEAR_PENDING_LOOT' });
      if (this.autoMode) {
        this.exploring = true;
        this.stepExploration();
      }
      return;
    }

    this.lootPopup = showLootPopup(
      this.screen,
      currentItem,
      state.party,
      state.inventory.length,
      (decision, heroId) => {
        this.lootPopup = null;
        this.store.dispatch({ type: 'RESOLVE_LOOT_ITEM', decision, heroId });
        this.refreshDisplay();

        // Check if more items
        const newState = this.store.getState();
        if (newState.pendingLoot) {
          this.autoTimer = setTimeout(() => {
            if (!this.destroyed) this.showLootDecision();
          }, 300);
        } else {
          // All loot resolved, resume exploration
          this.autoTimer = setTimeout(() => {
            if (!this.destroyed && !this.paused) {
              if (this.autoMode) {
                this.exploring = true;
                this.stepExploration();
              }
            }
          }, 500);
        }
      },
    );
  }

  private advanceToNextFloor(): void {
    if (this.destroyed) return;

    const state = this.store.getState();
    const tower = state.tower;
    if (!tower) return;

    // Safety check
    const aliveHeroes = state.party.filter(h => h !== null && h.stats.hp > 0);
    if (aliveHeroes.length === 0) {
      this.store.dispatch({ type: 'SET_CONTINUOUS_RUN', enabled: false });
      this.store.dispatch({ type: 'NAVIGATE', screen: 'game_over' });
      return;
    }

    // Check if game won
    if (state.gameWon) {
      this.towerComplete();
      return;
    }

    if (tower.currentFloor >= 100) {
      this.towerComplete();
      return;
    }

    // Auto use torch if low
    if (tower.torchLevel < 30) {
      const hasTorch = state.inventory.some(i => i.torchAmount && i.consumable);
      if (hasTorch) {
        this.store.dispatch({ type: 'USE_TORCH' });
        this.addLog('횃불 사용! (밝기 +25)');
      }
    }

    this.autoTimer = setTimeout(() => {
      if (this.destroyed) return;

      this.store.dispatch({ type: 'ADVANCE_FLOOR' });
      this.currentPath = [];

      // Apply torch-based stress
      const updatedTower = this.store.getState().tower;
      if (updatedTower) {
        const torchLevel = updatedTower.torchLevel;
        let stressGain = 0;

        if (torchLevel <= 0) {
          stressGain = 10;
          this.addLog('{red-fg}완전한 어둠!{/red-fg} 스트레스 +10');
        } else if (torchLevel < 25) {
          stressGain = 5;
          this.addLog('{red-fg}어둠이 짙다...{/red-fg} 스트레스 +5');
        } else if (torchLevel < 50) {
          stressGain = 2;
        }

        if (stressGain > 0) {
          const currentState = this.store.getState();
          for (const hero of currentState.party) {
            if (hero && hero.stats.hp > 0) {
              const result = applyStress(hero, stressGain);
              this.store.dispatch({ type: 'UPDATE_PARTY_HERO', hero: result.hero });
            }
          }
        }

        this.addLog(`${updatedTower.currentFloor}층으로 이동...`);
      }

      this.refreshDisplay();
      if (this.autoMode) {
        this.exploring = true;
        this.stepExploration();
      }
    }, Math.floor(1500 / this.speed));
  }

  private towerComplete(): void {
    if (this.destroyed) return;
    this.exploring = false;

    const state = this.store.getState();

    for (const hero of state.party) {
      if (hero && hero.stats.hp > 0) {
        const updated = {
          ...hero,
          stats: { ...hero.stats, stress: clamp(hero.stats.stress - 10, 0, 200) },
        };
        this.store.dispatch({ type: 'UPDATE_PARTY_HERO', hero: updated });
      }
    }

    const tower = state.tower;
    const floor = tower ? tower.currentFloor : 0;

    if (state.gameWon && floor >= 100) {
      this.addLog('{bold}{yellow-fg}어둠의 탑 정복!! 축하합니다!{/yellow-fg}{/bold}');
    } else {
      this.addLog('{bold}{green-fg}탑 탐험 완료!{/green-fg}{/bold} 스트레스 -10');
    }

    this.store.saveGame();

    if (state.continuousRun && !state.gameWon) {
      this.store.dispatch({ type: 'INCREMENT_RUNS' });

      const partyHeroes = state.party.filter(h => h !== null) as Hero[];
      const anyDead = partyHeroes.some(h => h.stats.hp <= 0);
      const anyLowHp = partyHeroes.some(h => h.stats.hp / h.stats.maxHp < 0.3);

      if (anyDead || anyLowHp) {
        this.addLog('{yellow-fg}파티 상태 위험! 연속 탐험 중지.{/yellow-fg}');
        this.store.dispatch({ type: 'SET_CONTINUOUS_RUN', enabled: false });
        this.returnToTown();
        return;
      }

      const currentState = this.store.getState();
      for (const hero of currentState.party) {
        if (hero && hero.stats.hp > 0) {
          const healAmount = Math.round(hero.stats.maxHp * 0.3);
          const newStress = clamp(hero.stats.stress - 20, 0, 200);
          const updated = {
            ...hero,
            stats: {
              ...hero.stats,
              hp: clamp(hero.stats.hp + healAmount, 0, hero.stats.maxHp),
              stress: newStress,
            },
          };
          this.store.dispatch({ type: 'UPDATE_PARTY_HERO', hero: updated });
        }
      }

      this.addLog('{cyan-fg}파티 회복! (+30% HP, -20 스트레스){/cyan-fg}');
      this.addLog('{yellow-fg}연속 탐험: 다시 입장!{/yellow-fg}');
      this.refreshDisplay();

      this.autoTimer = setTimeout(() => {
        if (this.destroyed) return;
        this.store.dispatch({ type: 'ADVANCE_WEEK' });
        this.store.dispatch({ type: 'ENTER_TOWER' });
      }, Math.floor(2500 / this.speed));
    } else {
      this.returnToTown();
    }
  }

  private returnToTown(): void {
    this.autoTimer = setTimeout(() => {
      if (this.destroyed) return;
      this.store.dispatch({ type: 'ADVANCE_WEEK' });
      this.store.dispatch({ type: 'EXIT_TOWER' });
    }, Math.floor(1500 / this.speed));
  }

  private refreshDisplay(): void {
    if (this.destroyed) return;
    this.updateHeader();
    this.renderMap();
    this.updatePartyStatus();
    this.updateLog();
    this.screen.render();
  }
}
