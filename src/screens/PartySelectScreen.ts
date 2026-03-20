import blessed from 'blessed';
import { BaseScreen } from './BaseScreen.ts';
import type { Hero, GridPosition } from '../models/types.ts';
import { getClassName, RECOMMENDED_POSITIONS, getStars } from '../data/heroes.ts';
import { formatBar } from '../utils/helpers.ts';
import { getTraitCategoryColor } from '../data/traits.ts';
import { gridPosLabel } from '../utils/grid.ts';

export class PartySelectScreen extends BaseScreen {
  private availableList!: blessed.Widgets.ListElement;
  private partyList!: blessed.Widgets.ListElement;
  private statsBox!: blessed.Widgets.BoxElement;
  private focusedPanel: 'available' | 'party' = 'available';
  private swapMode: boolean = false;
  private swapFirst: number = -1;

  render(): void {
    // Background
    this.createBox({
      top: 0, left: 0, width: '100%', height: '100%',
      style: { bg: 'black' },
    });

    // Title bar
    this.createBox({
      top: 0, left: 0, width: '100%', height: 3,
      content: '{bold}{yellow-fg} 파티 편성{/yellow-fg}{/bold}  |  {gray-fg}←→: 패널 전환  Enter: 선택  S: 교환  Esc: 돌아가기{/gray-fg}',
      tags: true,
      border: { type: 'line' },
      style: { fg: 'white', bg: 'black', border: { fg: 'gray' } },
    });

    // Left panel: Available heroes
    this.availableList = blessed.list({
      top: 3, left: 0, width: '35%', height: '60%',
      label: ' 대기 영웅 ',
      items: [],
      keys: true, vi: false, mouse: true, tags: true,
      border: { type: 'line' },
      scrollable: true,
      style: {
        fg: 'white', bg: 'black',
        border: { fg: 'yellow' },
        selected: { fg: 'black', bg: 'yellow', bold: true },
        label: { fg: 'yellow' } as any,
      },
    });
    this.addWidget(this.availableList);

    // Right panel: Party slots
    this.partyList = blessed.list({
      top: 3, left: '35%', width: '35%', height: '60%',
      label: ' 파티 배치 ',
      items: [],
      keys: true, vi: false, mouse: true, tags: true,
      border: { type: 'line' },
      style: {
        fg: 'white', bg: 'black',
        border: { fg: 'gray' },
        selected: { fg: 'black', bg: 'cyan', bold: true },
        label: { fg: 'cyan' } as any,
      },
    });
    this.addWidget(this.partyList);

    // Stats preview
    this.statsBox = this.createBox({
      top: 3, left: '70%', width: '30%', height: '60%',
      label: ' 영웅 정보 ',
      tags: true,
      border: { type: 'line' },
      style: { fg: 'white', bg: 'black', border: { fg: 'gray' }, label: { fg: 'gray' } } as any,
      content: '{gray-fg}영웅을 선택하세요.{/gray-fg}',
    });

    // Status/hint bar
    this.createBox({
      bottom: 0, left: 0, width: '100%', height: 3,
      content: '{gray-fg}←→: 패널 전환  ↑↓: 선택  Enter: 추가/제거  S: 위치 교환  1-6: 위치 교환  Esc: 마을로{/gray-fg}',
      tags: true,
      border: { type: 'line' },
      style: { fg: 'gray', bg: 'black', border: { fg: 'gray' } },
      align: 'center',
    });

    this.updateLists();
    this.setupKeys();
    this.setFocus('available');
    this.screen.render();
  }

  private getAvailableHeroes(): Hero[] {
    const state = this.store.getState();
    const partyIds = new Set(state.party.filter((h): h is Hero => h !== null).map(h => h.id));
    return state.roster.filter(h => !partyIds.has(h.id));
  }

  private updateLists(): void {
    const available = this.getAvailableHeroes();
    const state = this.store.getState();

    // Update available list
    const availItems = available.map(h => `${getStars(h.rarity)} ${getClassName(h.class)} - ${h.name} (Lv${h.level})`);
    if (availItems.length === 0) availItems.push('{gray-fg}(대기 영웅 없음){/gray-fg}');
    this.availableList.setItems(availItems as any);

    // Update party list
    const partyItems: string[] = [];
    for (let i = 0; i < 6; i++) {
      const hero = state.party[i];
      const col = Math.floor(i / 3) + 1;
      const row = (i % 3) + 1;
      const colLabel = col === 1 ? '전열' : col === 2 ? '중열' : '후열';
      const posTag = `${colLabel}${row}`;
      if (hero) {
        const hpPct = hero.stats.hp / hero.stats.maxHp;
        const hpColor = hpPct > 0.5 ? 'green' : hpPct > 0.25 ? 'yellow' : 'red';
        const mcTag = hero.isMainCharacter ? '[주인공] ' : '';
        partyItems.push(`[${i + 1}] ${posTag} ${mcTag}${getStars(hero.rarity)} ${getClassName(hero.class)} - ${hero.name}`);
      } else {
        partyItems.push(`[${i + 1}] ${posTag} --- 빈 슬롯 ---`);
      }
    }
    this.partyList.setItems(partyItems as any);

    this.screen.render();
  }

  private showHeroStats(hero: Hero | null): void {
    if (!hero) {
      this.statsBox.setContent('{gray-fg}영웅을 선택하세요.{/gray-fg}');
      this.screen.render();
      return;
    }

    const hpBar = formatBar(hero.stats.hp, hero.stats.maxHp, 12);
    const hpColor = hero.stats.hp / hero.stats.maxHp > 0.5 ? 'green' : hero.stats.hp / hero.stats.maxHp > 0.25 ? 'yellow' : 'red';

    const rec = RECOMMENDED_POSITIONS[hero.class];
    const isOptimalPos = rec.cols.includes(hero.position.col);

    let content = `{bold}{yellow-fg}${hero.name}{/yellow-fg}{/bold}\n`;
    content += `{cyan-fg}${getClassName(hero.class)}{/cyan-fg} Lv.${hero.level}\n`;
    content += `{cyan-fg}${rec.label}{/cyan-fg}\n`;
    if (!isOptimalPos) {
      content += `{yellow-fg}! 현재 위치${gridPosLabel(hero.position)}가 비추천!{/yellow-fg}\n`;
    }
    content += `\n`;
    content += `HP  {${hpColor}-fg}${hpBar}{/${hpColor}-fg}\n    ${hero.stats.hp}/${hero.stats.maxHp}\n`;
    const expBar = formatBar(hero.exp, hero.expToLevel, 12);
    content += `EXP {cyan-fg}${expBar}{/cyan-fg}\n    ${hero.exp}/${hero.expToLevel}\n\n`;
    content += `{white-fg}공격:{/white-fg} ${hero.stats.attack}\n`;
    content += `{white-fg}방어:{/white-fg} ${hero.stats.defense}\n`;
    content += `{white-fg}속도:{/white-fg} ${hero.stats.speed}\n`;
    content += `{white-fg}명중:{/white-fg} ${hero.stats.accuracy}\n`;
    content += `{white-fg}회피:{/white-fg} ${hero.stats.dodge}\n`;
    content += `{white-fg}치명:{/white-fg} ${hero.stats.crit}%\n`;

    if (hero.traits && hero.traits.length > 0) {
      content += '\n{yellow-fg}특성:{/yellow-fg}\n';
      for (const trait of hero.traits) {
        const color = getTraitCategoryColor(trait.category);
        content += `  {${color}-fg}${trait.name}{/${color}-fg}\n`;
      }
    }

    if (hero.skills.length > 0) {
      content += '\n{yellow-fg}스킬:{/yellow-fg}\n';
      for (const skill of hero.skills) {
        const canUse = skill.useCols.includes(hero.position.col);
        const skillColor = canUse ? 'white' : 'red';
        const useMark = canUse ? '+' : 'x';
        content += `  {${skillColor}-fg}[${useMark}] ${skill.name}{/${skillColor}-fg}\n`;
      }
    }

    this.statsBox.setContent(content);
    this.screen.render();
  }

  private setFocus(panel: 'available' | 'party'): void {
    this.focusedPanel = panel;
    if (panel === 'available') {
      this.availableList.focus();
      (this.availableList.style.border as any).fg = 'yellow';
      (this.partyList.style.border as any).fg = 'gray';
    } else {
      this.partyList.focus();
      (this.partyList.style.border as any).fg = 'yellow';
      (this.availableList.style.border as any).fg = 'gray';
    }
    this.screen.render();
  }

  private setupKeys(): void {
    // Panel switching
    this.registerKey(['left', 'right'], () => {
      if (this.focusedPanel === 'available') {
        this.setFocus('party');
      } else {
        this.setFocus('available');
      }
    });

    // Available list: select to add
    this.availableList.on('select', (_item: any, index: number) => {
      const available = this.getAvailableHeroes();
      if (index >= available.length) return;
      const hero = available[index]!;

      // Find first empty slot
      const state = this.store.getState();
      const emptySlot = state.party.findIndex(h => h === null);
      if (emptySlot === -1) return;

      this.store.dispatch({ type: 'ADD_TO_PARTY', heroId: hero.id, slotIndex: emptySlot });
      this.updateLists();
    });

    this.availableList.on('select item', (_el: any, index: number) => {
      const available = this.getAvailableHeroes();
      if (index < available.length) {
        this.showHeroStats(available[index]!);
      }
    });

    // Party list: select to remove
    this.partyList.on('select', (_item: any, index: number) => {
      if (this.swapMode) {
        if (this.swapFirst === -1) {
          this.swapFirst = index;
          this.statsBox.setContent('{yellow-fg}교환할 두 번째 위치를 선택하세요...{/yellow-fg}');
          this.screen.render();
        } else {
          this.store.dispatch({ type: 'SWAP_PARTY_POSITION', pos1: this.swapFirst, pos2: index });
          this.swapMode = false;
          this.swapFirst = -1;
          this.updateLists();
        }
        return;
      }

      const state = this.store.getState();
      const hero = state.party[index];
      if (hero) {
        if (hero.id === state.mainCharacterId) {
          this.statsBox.setContent('{red-fg}주인공은 파티에서 제거할 수 없습니다!{/red-fg}');
          this.screen.render();
          return;
        }
        this.store.dispatch({ type: 'REMOVE_FROM_PARTY', slotIndex: index });
        this.updateLists();
      }
    });

    this.partyList.on('select item', (_el: any, index: number) => {
      const state = this.store.getState();
      this.showHeroStats(state.party[index] || null);
    });

    // Quick swap with number keys 1-4
    this.registerKey(['1', '2', '3', '4', '5', '6'], (ch: string) => {
      if (this.focusedPanel !== 'party') return;
      const targetPos = parseInt(ch) - 1;
      if (targetPos < 0 || targetPos >= 6) return;
      const currentPos = (this.partyList as any).selected as number;
      if (targetPos === currentPos) return;
      this.store.dispatch({ type: 'SWAP_PARTY_POSITION', pos1: currentPos, pos2: targetPos });
      this.updateLists();
    });

    // Swap mode
    this.registerKey(['s'], () => {
      if (this.focusedPanel === 'party') {
        this.swapMode = true;
        this.swapFirst = -1;
        this.statsBox.setContent('{yellow-fg}교환할 첫 번째 위치를 선택하세요...{/yellow-fg}\n\n{gray-fg}Esc: 취소{/gray-fg}');
        this.screen.render();
      }
    });

    // Escape
    this.registerKey(['escape'], () => {
      if (this.swapMode) {
        this.swapMode = false;
        this.swapFirst = -1;
        this.statsBox.setContent('{gray-fg}교환 취소{/gray-fg}');
        this.screen.render();
        return;
      }
      this.store.dispatch({ type: 'NAVIGATE', screen: 'town' });
    });
  }
}
