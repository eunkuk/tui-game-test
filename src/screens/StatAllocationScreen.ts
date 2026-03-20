import blessed from 'blessed';
import { BaseScreen } from './BaseScreen.ts';
import type { Hero } from '../models/types.ts';
import { getClassName, getStars } from '../data/heroes.ts';

interface StatDef {
  key: string;
  label: string;
  perPoint: number;
  unit: string;
}

const STAT_DEFS: StatDef[] = [
  { key: 'hp',      label: 'HP',    perPoint: 3, unit: 'maxHp' },
  { key: 'attack',  label: 'ATK',   perPoint: 1, unit: '공격력' },
  { key: 'defense', label: 'DEF',   perPoint: 1, unit: '방어력' },
  { key: 'speed',   label: 'SPD',   perPoint: 1, unit: '속도' },
  { key: 'accuracy',label: 'ACC',   perPoint: 2, unit: '명중' },
  { key: 'dodge',   label: 'DODGE', perPoint: 2, unit: '회피' },
  { key: 'crit',    label: 'CRIT',  perPoint: 1, unit: '치명타' },
];

export class StatAllocationScreen extends BaseScreen {
  private statList!: blessed.Widgets.ListElement;
  private allocation: Record<string, number> = {};
  private totalPoints: number = 0;

  render(): void {
    const state = this.store.getState();
    const hero = state.roster.find(h => h.id === state.selectedHeroId);
    if (!hero || hero.statPoints <= 0) {
      this.store.dispatch({ type: 'NAVIGATE', screen: 'town' });
      return;
    }

    this.totalPoints = hero.statPoints;
    this.allocation = {
      hp: 0, attack: 0, defense: 0, speed: 0,
      accuracy: 0, dodge: 0, crit: 0,
    };

    this.buildUI(hero);
  }

  private buildUI(hero: Hero): void {
    // Clear existing widgets
    this.destroy();

    const remaining = this.getRemainingPoints();

    // Background
    this.createBox({
      top: 0, left: 0, width: '100%', height: '100%',
      style: { bg: 'black' },
    });

    // Title bar
    this.createBox({
      top: 0, left: 0, width: '100%', height: 3,
      content: `{bold}{yellow-fg} 스탯 배분{/yellow-fg}{/bold}  |  {yellow-fg}${getStars(hero.rarity)}{/yellow-fg} {cyan-fg}${hero.name}{/cyan-fg} - ${getClassName(hero.class)} Lv.${hero.level}  |  남은 포인트: {bold}{${remaining > 0 ? 'yellow' : 'green'}-fg}${remaining}{/${remaining > 0 ? 'yellow' : 'green'}-fg}{/bold}/${this.totalPoints}`,
      tags: true,
      border: { type: 'line' },
      style: { fg: 'white', bg: 'black', border: { fg: 'gray' } },
    });

    // Left panel: Current stats
    const statsContent = this.buildCurrentStatsContent(hero);
    this.createBox({
      top: 3, left: 0, width: '40%', height: '70%',
      label: ' 현재 능력치 ',
      content: statsContent,
      tags: true,
      border: { type: 'line' },
      style: { fg: 'white', bg: 'black', border: { fg: 'cyan' }, label: { fg: 'cyan' } } as any,
    });

    // Right panel: Allocation list
    const statItems = STAT_DEFS.map(sd => {
      const allocated = this.allocation[sd.key];
      const bonus = allocated * sd.perPoint;
      const bar = allocated > 0
        ? `{green-fg}+${bonus}{/green-fg} (${'■'.repeat(allocated)}${'·'.repeat(this.totalPoints - allocated)})`
        : `{gray-fg}+0{/gray-fg} (${'·'.repeat(this.totalPoints)})`;
      return `  ${sd.label.padEnd(6)} [${String(allocated).padStart(2)}] ${bar}  {gray-fg}(+${sd.perPoint}/pt){/gray-fg}`;
    });

    this.statList = blessed.list({
      top: 3, left: '40%', width: '60%', height: '70%',
      label: ' 스탯 배분 ',
      items: statItems,
      keys: true, vi: false, mouse: true, tags: true,
      border: { type: 'line' },
      style: {
        fg: 'white', bg: 'black',
        border: { fg: 'yellow' },
        selected: { fg: 'black', bg: 'yellow', bold: true },
        label: { fg: 'yellow' } as any,
      },
    });
    this.addWidget(this.statList);

    // Help bar at the bottom
    const confirmColor = remaining === 0 ? 'green' : 'gray';
    this.createBox({
      bottom: 0, left: 0, width: '100%', height: 3,
      content: `  {gray-fg}↑↓{/gray-fg} 이동  |  {gray-fg}Enter/→{/gray-fg} 포인트 추가  |  {gray-fg}←/Backspace{/gray-fg} 포인트 제거  |  {${confirmColor}-fg}[C] 확정{/${confirmColor}-fg}  |  {gray-fg}[ESC] 취소{/gray-fg}`,
      tags: true,
      border: { type: 'line' },
      style: { fg: 'white', bg: 'black', border: { fg: 'gray' } },
    });

    // Key bindings
    this.statList.key(['right', 'enter'], () => {
      this.addPoint(hero);
    });

    this.statList.key(['left', 'backspace'], () => {
      this.removePoint(hero);
    });

    this.screen.key(['c', 'C'], () => {
      this.confirmAllocation(hero);
    });

    this.screen.key(['escape'], () => {
      this.store.dispatch({ type: 'NAVIGATE', screen: 'hero_detail' });
    });

    this.statList.focus();
    this.screen.render();
  }

  private buildCurrentStatsContent(hero: Hero): string {
    let content = '';
    content += `\n`;
    content += `  {bold}HP:{/bold}     ${hero.stats.hp} / ${hero.stats.maxHp}`;
    if (this.allocation.hp > 0) content += `  {green-fg}(+${this.allocation.hp * 3}){/green-fg}`;
    content += `\n`;
    content += `  {bold}공격력:{/bold} ${hero.stats.attack}`;
    if (this.allocation.attack > 0) content += `  {green-fg}(+${this.allocation.attack}){/green-fg}`;
    content += `\n`;
    content += `  {bold}방어력:{/bold} ${hero.stats.defense}`;
    if (this.allocation.defense > 0) content += `  {green-fg}(+${this.allocation.defense}){/green-fg}`;
    content += `\n`;
    content += `  {bold}속  도:{/bold} ${hero.stats.speed}`;
    if (this.allocation.speed > 0) content += `  {green-fg}(+${this.allocation.speed}){/green-fg}`;
    content += `\n`;
    content += `  {bold}명  중:{/bold} ${hero.stats.accuracy}`;
    if (this.allocation.accuracy > 0) content += `  {green-fg}(+${this.allocation.accuracy * 2}){/green-fg}`;
    content += `\n`;
    content += `  {bold}회  피:{/bold} ${hero.stats.dodge}`;
    if (this.allocation.dodge > 0) content += `  {green-fg}(+${this.allocation.dodge * 2}){/green-fg}`;
    content += `\n`;
    content += `  {bold}치명타:{/bold} ${hero.stats.crit}%`;
    if (this.allocation.crit > 0) content += `  {green-fg}(+${this.allocation.crit}){/green-fg}`;
    content += `\n`;
    content += `\n`;
    content += `  {yellow-fg}스탯 포인트: ${hero.statPoints}{/yellow-fg}\n`;
    content += `  {gray-fg}레벨업 시 5 포인트 획득{/gray-fg}\n`;
    content += `\n`;
    content += `  {gray-fg}── 포인트 당 효과 ──{/gray-fg}\n`;
    content += `  {gray-fg}HP:    +3 maxHp{/gray-fg}\n`;
    content += `  {gray-fg}ATK:   +1 공격력{/gray-fg}\n`;
    content += `  {gray-fg}DEF:   +1 방어력{/gray-fg}\n`;
    content += `  {gray-fg}SPD:   +1 속도{/gray-fg}\n`;
    content += `  {gray-fg}ACC:   +2 명중{/gray-fg}\n`;
    content += `  {gray-fg}DODGE: +2 회피{/gray-fg}\n`;
    content += `  {gray-fg}CRIT:  +1 치명타{/gray-fg}\n`;
    return content;
  }

  private getRemainingPoints(): number {
    const used = Object.values(this.allocation).reduce((sum, v) => sum + v, 0);
    return this.totalPoints - used;
  }

  private addPoint(hero: Hero): void {
    if (this.getRemainingPoints() <= 0) return;
    const index = (this.statList as any).selected ?? 0;
    const statKey = STAT_DEFS[index].key;
    this.allocation[statKey]++;
    this.buildUI(hero);
    this.statList.select(index);
    this.screen.render();
  }

  private removePoint(hero: Hero): void {
    const index = (this.statList as any).selected ?? 0;
    const statKey = STAT_DEFS[index].key;
    if (this.allocation[statKey] <= 0) return;
    this.allocation[statKey]--;
    this.buildUI(hero);
    this.statList.select(index);
    this.screen.render();
  }

  private confirmAllocation(hero: Hero): void {
    if (this.getRemainingPoints() !== 0) return;
    this.store.dispatch({
      type: 'ALLOCATE_STATS',
      heroId: hero.id,
      allocation: { ...this.allocation },
    } as any);
    this.store.dispatch({ type: 'NAVIGATE', screen: 'town' });
  }
}
