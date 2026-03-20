import blessed from 'blessed';
import { BaseScreen } from './BaseScreen.ts';
import type { Item, Hero } from '../models/types.ts';
import { getClassName } from '../data/heroes.ts';
import { formatEquipComparison } from '../utils/helpers.ts';

export class InventoryScreen extends BaseScreen {
  private itemList!: blessed.Widgets.ListElement;
  private detailBox!: blessed.Widgets.BoxElement;
  private actionBox!: blessed.Widgets.BoxElement;
  private heroSelectList: blessed.Widgets.ListElement | null = null;
  private currentItems: Item[] = [];

  render(): void {
    const state = this.store.getState();

    // Background
    this.createBox({
      top: 0, left: 0, width: '100%', height: '100%',
      style: { bg: 'black' },
    });

    // Title bar
    this.createBox({
      top: 0, left: 0, width: '100%', height: 3,
      content: `{bold}{yellow-fg} 인벤토리{/yellow-fg}{/bold}  |  {yellow-fg}골드: ${state.gold}{/yellow-fg}  |  ${state.inventory.length >= 16 ? '{red-fg}' : '{gray-fg}'}아이템: ${state.inventory.length}/16${state.inventory.length >= 16 ? ' [가득!]' : ''}${state.inventory.length >= 16 ? '{/red-fg}' : '{/gray-fg}'}  |  {gray-fg}Esc: 돌아가기{/gray-fg}`,
      tags: true,
      border: { type: 'line' },
      style: { fg: 'white', bg: 'black', border: { fg: 'gray' } },
    });

    // Left panel: Item list
    this.currentItems = [...state.inventory];
    const itemLabels = this.getItemLabels();

    this.itemList = blessed.list({
      top: 3, left: 0, width: '50%', height: '80%',
      label: ' 아이템 목록 ',
      items: itemLabels.length > 0 ? itemLabels : ['{gray-fg}(아이템 없음){/gray-fg}'],
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
    this.addWidget(this.itemList);

    // Right panel: Item detail
    this.detailBox = this.createBox({
      top: 3, left: '50%', width: '50%', height: '50%',
      label: ' 아이템 정보 ',
      tags: true,
      border: { type: 'line' },
      style: { fg: 'white', bg: 'black', border: { fg: 'gray' }, label: { fg: 'gray' } } as any,
      content: '{gray-fg}아이템을 선택하세요.{/gray-fg}',
    });

    // Action hints
    this.actionBox = this.createBox({
      top: '53%', left: '50%', width: '50%', height: '30%',
      label: ' 행동 ',
      tags: true,
      border: { type: 'line' },
      style: { fg: 'white', bg: 'black', border: { fg: 'gray' }, label: { fg: 'gray' } } as any,
      content: '{gray-fg}Enter: 사용/장착\nD: 버리기\nS: 판매\nEsc: 돌아가기{/gray-fg}',
    });

    // Bottom hint
    this.createBox({
      bottom: 0, left: 0, width: '100%', height: 3,
      content: '{gray-fg}↑↓: 선택  Enter: 사용/장착  D: 버리기  S: 판매  Esc: 돌아가기{/gray-fg}',
      tags: true,
      border: { type: 'line' },
      style: { fg: 'gray', bg: 'black', border: { fg: 'gray' } },
      align: 'center',
    });

    // Events
    this.itemList.on('select item', (_el: any, index: number) => {
      this.showItemDetail(index);
    });

    this.itemList.on('select', (_item: any, index: number) => {
      this.handleItemAction(index);
    });

    this.registerKey(['d'], () => {
      const selected = (this.itemList as any).selected as number;
      this.discardItem(selected);
    });

    this.registerKey(['s'], () => {
      const selected = (this.itemList as any).selected as number;
      this.sellItem(selected);
    });

    this.registerKey(['escape'], () => {
      if (this.heroSelectList) {
        this.clearHeroSelect();
        this.itemList.focus();
        this.screen.render();
        return;
      }
      // Go back to previous screen (tower or town)
      const state = this.store.getState();
      if (state.tower) {
        this.store.dispatch({ type: 'NAVIGATE', screen: 'dungeon' });
      } else {
        this.store.dispatch({ type: 'NAVIGATE', screen: 'town' });
      }
    });

    this.itemList.focus();
    this.screen.render();
  }

  private getItemLabels(): string[] {
    const typeLabels: Record<string, string> = {
      supply: '{green-fg}[보급]{/green-fg}',
      weapon: '{red-fg}[무기]{/red-fg}',
      armor: '{blue-fg}[방어]{/blue-fg}',
      trinket: '{magenta-fg}[장신]{/magenta-fg}',
      potion: '{#ff88ff-fg}[물약]{/#ff88ff-fg}',
    };
    const rarityColors: Record<string, string> = {
      common: 'white', uncommon: 'green', rare: 'blue', legendary: 'yellow',
    };

    return this.currentItems.map(item => {
      const type = typeLabels[item.type] || '[???]';
      const rColor = rarityColors[item.rarity] || 'white';
      return `${type} {${rColor}-fg}${item.name}{/${rColor}-fg} (${item.value}G)`;
    });
  }

  private showItemDetail(index: number): void {
    if (index >= this.currentItems.length) return;
    const item = this.currentItems[index]!;

    const rarityNames: Record<string, string> = {
      common: '일반', uncommon: '고급', rare: '희귀', legendary: '전설',
    };
    const typeNames: Record<string, string> = {
      supply: '보급품', weapon: '무기', armor: '방어구', trinket: '장신구', potion: '물약',
    };

    let detail = `{bold}{yellow-fg}${item.name}{/yellow-fg}{/bold}\n`;
    detail += `{gray-fg}${typeNames[item.type] || '???'} | ${rarityNames[item.rarity] || '???'}{/gray-fg}\n\n`;
    detail += `${item.description}\n\n`;
    detail += `{yellow-fg}가치: ${item.value}G{/yellow-fg}\n`;

    if (item.modifiers.length > 0) {
      detail += '\n{cyan-fg}효과:{/cyan-fg}\n';
      for (const mod of item.modifiers) {
        const sign = mod.value > 0 ? '+' : '';
        detail += `  ${mod.stat}: ${sign}${mod.value}\n`;
      }
    }
    if (item.healAmount) detail += `\n{green-fg}HP 회복: ${item.healAmount}{/green-fg}`;
    if (item.buffEffect) detail += `\n{yellow-fg}버프: ${item.buffEffect.stat} +${item.buffEffect.value} (${item.buffEffect.duration}턴){/yellow-fg}`;

    // Action hints based on type
    let actions = '';
    if (item.consumable) {
      actions = '\n\n{green-fg}Enter: 사용{/green-fg}  {red-fg}D: 버리기{/red-fg}';
    } else {
      actions = '\n\n{cyan-fg}Enter: 장착{/cyan-fg}  {yellow-fg}S: 판매{/yellow-fg}  {red-fg}D: 버리기{/red-fg}';
    }

    this.detailBox.setContent(detail);
    this.actionBox.setContent(actions);
    this.screen.render();
  }

  private handleItemAction(index: number): void {
    if (index >= this.currentItems.length) return;
    const item = this.currentItems[index]!;

    if (item.consumable) {
      // Use supply item - need to select hero
      this.showHeroSelect(item, 'use');
    } else if (item.type === 'weapon' || item.type === 'armor' || item.type === 'trinket') {
      // Equip - need to select hero
      this.showHeroSelect(item, 'equip');
    }
  }

  private showHeroSelect(item: Item, action: 'use' | 'equip'): void {
    this.clearHeroSelect();
    const state = this.store.getState();
    const heroes = state.roster.filter(h => h.stats.hp > 0);

    if (heroes.length === 0) {
      this.detailBox.setContent('{red-fg}대상 영웅이 없습니다.{/red-fg}');
      this.screen.render();
      return;
    }

    const heroLabels = heroes.map(h => {
      let extra = '';
      if (action === 'equip') {
        let equipped: Item | undefined;
        if (item.type === 'weapon') equipped = h.equipment.weapon;
        else if (item.type === 'armor') equipped = h.equipment.armor;
        else if (item.type === 'trinket') {
          if (!h.equipment.trinket1) equipped = undefined;
          else if (!h.equipment.trinket2) equipped = undefined;
          else equipped = h.equipment.trinket1;
        }
        const currentStr = equipped ? equipped.name : '빈 슬롯';
        const comparison = formatEquipComparison(item, equipped);
        const compStr = comparison ? ` ${comparison}` : '';
        extra = ` ${currentStr} → ${item.name}${compStr}`;
      } else {
        extra = ` HP ${h.stats.hp}/${h.stats.maxHp}`;
      }
      return `${h.name} (${getClassName(h.class)})${extra}`;
    });

    this.heroSelectList = blessed.list({
      top: 'center', left: 'center', width: 64, height: Math.min(heroLabels.length + 2, 12),
      label: action === 'use' ? ' 대상 선택 ' : ' 장착 대상 선택 ',
      items: heroLabels,
      keys: true, vi: false, mouse: true, tags: true,
      border: { type: 'line' },
      style: {
        fg: 'white', bg: 'black',
        border: { fg: 'cyan' },
        selected: { fg: 'black', bg: 'cyan', bold: true },
        label: { fg: 'cyan' } as any,
      },
    });
    this.addWidget(this.heroSelectList);
    this.heroSelectList.focus();

    this.heroSelectList.on('select', (_el: any, idx: number) => {
      if (idx >= heroes.length) return;
      const hero = heroes[idx]!;

      if (action === 'use') {
        this.store.dispatch({ type: 'USE_ITEM', itemId: item.id, heroId: hero.id });
        this.detailBox.setContent(`{green-fg}${item.name}을(를) ${hero.name}에게 사용했습니다!{/green-fg}`);
      } else {
        this.store.dispatch({ type: 'EQUIP_ITEM', heroId: hero.id, itemId: item.id });
        this.detailBox.setContent(`{green-fg}${item.name}을(를) ${hero.name}에게 장착했습니다!{/green-fg}`);
      }

      this.clearHeroSelect();
      this.refreshItems();
      this.itemList.focus();
      this.screen.render();
    });

    this.heroSelectList.key(['escape'], () => {
      this.clearHeroSelect();
      this.itemList.focus();
      this.screen.render();
    });

    this.screen.render();
  }

  private clearHeroSelect(): void {
    if (this.heroSelectList) {
      this.heroSelectList.destroy();
      const idx = this.widgets.indexOf(this.heroSelectList as any);
      if (idx !== -1) this.widgets.splice(idx, 1);
      this.heroSelectList = null;
    }
  }

  private discardItem(index: number): void {
    if (index >= this.currentItems.length) return;
    const item = this.currentItems[index]!;
    // Remove from inventory by selling at 0
    this.store.dispatch({ type: 'SELL_ITEM', itemId: item.id });
    // Re-add the gold we got from "selling" since we want discard (give 0)
    // Actually SELL_ITEM gives half value. Let's just remove manually.
    // Since we don't have a DISCARD action, use SELL_ITEM which gives half value back.
    this.detailBox.setContent(`{red-fg}${item.name}을(를) 버렸습니다.{/red-fg}\n{gray-fg}(${Math.floor(item.value / 2)}G 회수){/gray-fg}`);
    this.refreshItems();
    this.screen.render();
  }

  private sellItem(index: number): void {
    if (index >= this.currentItems.length) return;
    const item = this.currentItems[index]!;
    const sellValue = Math.floor(item.value / 2);
    this.store.dispatch({ type: 'SELL_ITEM', itemId: item.id });
    this.detailBox.setContent(`{yellow-fg}${item.name}을(를) ${sellValue}G에 판매했습니다!{/yellow-fg}`);
    this.refreshItems();
    this.screen.render();
  }

  private refreshItems(): void {
    const state = this.store.getState();
    this.currentItems = [...state.inventory];
    const labels = this.getItemLabels();
    this.itemList.setItems(labels.length > 0 ? labels as any : ['{gray-fg}(아이템 없음){/gray-fg}'] as any);
  }
}
