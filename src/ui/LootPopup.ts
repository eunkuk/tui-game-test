import blessed from 'blessed';
import type { Item, Hero, ItemRarity } from '../models/types.ts';
import { getClassName } from '../data/heroes.ts';
import { formatEquipComparison } from '../utils/helpers.ts';

const RARITY_COLORS: Record<ItemRarity, string> = {
  common: 'white',
  uncommon: 'green',
  rare: 'blue',
  legendary: 'yellow',
};

const RARITY_NAMES: Record<ItemRarity, string> = {
  common: '일반',
  uncommon: '고급',
  rare: '희귀',
  legendary: '전설',
};

const TYPE_LABELS: Record<string, string> = {
  weapon: '{red-fg}[무기]{/red-fg}',
  armor: '{blue-fg}[방어]{/blue-fg}',
  trinket: '{magenta-fg}[장신]{/magenta-fg}',
  supply: '{green-fg}[보급]{/green-fg}',
  potion: '{#ff88ff-fg}[물약]{/#ff88ff-fg}',
};

export function showLootPopup(
  screen: blessed.Widgets.Screen,
  item: Item,
  party: (Hero | null)[],
  inventoryCount: number,
  onDecision: (decision: 'equip' | 'store' | 'use' | 'discard', heroId?: string) => void,
): { destroy: () => void; active: boolean } {
  const widgets: blessed.Widgets.BlessedElement[] = [];
  let active = true;
  let resolved = false;

  const isEquipment = item.type === 'weapon' || item.type === 'armor' || item.type === 'trinket';
  const isConsumable = item.consumable === true;
  const inventoryFull = inventoryCount >= 16;

  const rColor = RARITY_COLORS[item.rarity] || 'white';
  const rName = RARITY_NAMES[item.rarity] || '???';
  const typeLabel = TYPE_LABELS[item.type] || '[???]';

  // Build item info text
  let info = `  ${typeLabel} {${rColor}-fg}{bold}${item.name}{/bold}{/${rColor}-fg}  ({${rColor}-fg}${rName}{/${rColor}-fg})\n`;
  info += `  {gray-fg}${item.description}{/gray-fg}\n\n`;

  if (item.modifiers.length > 0) {
    const modText = item.modifiers.map(m => {
      const sign = m.value > 0 ? '+' : '';
      return `${m.stat}: ${sign}${m.value}`;
    }).join('  ');
    info += `  {cyan-fg}${modText}{/cyan-fg}\n`;
  }
  if (item.healAmount) info += `  {green-fg}HP 회복: ${item.healAmount}{/green-fg}\n`;
  if (item.buffEffect) info += `  {yellow-fg}버프: ${item.buffEffect.stat} +${item.buffEffect.value} (${item.buffEffect.duration}턴){/yellow-fg}\n`;
  info += `  {yellow-fg}가치: ${item.value}G{/yellow-fg}\n`;

  info += `\n  ──────────────────────────\n`;

  // Options
  if (isEquipment) {
    info += `  {bold}1{/bold}: 장착 (영웅 선택)\n`;
  } else if (isConsumable) {
    info += `  {bold}1{/bold}: 사용 (영웅 선택)\n`;
  }

  if (inventoryFull) {
    info += `  {gray-fg}2: 보관 (${inventoryCount}/16 가득!){/gray-fg}\n`;
  } else {
    info += `  {bold}2{/bold}: 보관 (${inventoryCount}/16)\n`;
  }
  info += `  {bold}3{/bold}: 버리기\n`;

  const popupHeight = 18;
  const popupWidth = 50;

  const popup = blessed.box({
    top: 'center',
    left: 'center',
    width: popupWidth,
    height: popupHeight,
    label: ` {bold}{yellow-fg}아이템 획득!{/yellow-fg}{/bold} `,
    content: info,
    tags: true,
    border: { type: 'line' },
    style: {
      fg: 'white',
      bg: 'black',
      border: { fg: rColor },
      label: { fg: 'yellow' },
    } as any,
  });
  screen.append(popup);
  widgets.push(popup);
  popup.focus();
  screen.render();

  let heroSelectBox: blessed.Widgets.ListElement | null = null;

  const cleanup = () => {
    active = false;
    if (heroSelectBox) {
      heroSelectBox.destroy();
      heroSelectBox = null;
    }
    for (const w of widgets) {
      w.destroy();
    }
    widgets.length = 0;
  };

  const resolve = (decision: 'equip' | 'store' | 'use' | 'discard', heroId?: string) => {
    if (resolved) return;
    resolved = true;
    screen.removeListener('keypress', handleKey);
    cleanup();
    onDecision(decision, heroId);
  };

  const showHeroSelect = (action: 'equip' | 'use') => {
    const aliveHeroes = party.filter((h): h is Hero => h !== null && h.stats.hp > 0);
    if (aliveHeroes.length === 0) return;

    const heroLabels = aliveHeroes.map(h => {
      if (action === 'equip') {
        let equipped: Item | undefined;
        if (item.type === 'weapon') equipped = h.equipment.weapon;
        else if (item.type === 'armor') equipped = h.equipment.armor;
        else if (item.type === 'trinket') {
          if (!h.equipment.trinket1) equipped = undefined;
          else if (!h.equipment.trinket2) equipped = undefined;
          else equipped = h.equipment.trinket1;
        }
        const currentStr = equipped ? equipped.name : '없음';
        const comparison = formatEquipComparison(item, equipped);
        const compStr = comparison ? ` ${comparison}` : '';
        return `${h.name} (${getClassName(h.class)}) ${currentStr} → ${item.name}${compStr}`;
      } else {
        return `${h.name} (${getClassName(h.class)}) HP ${h.stats.hp}/${h.stats.maxHp}`;
      }
    });

    heroSelectBox = blessed.list({
      top: 'center',
      left: 'center',
      width: 64,
      height: Math.min(aliveHeroes.length + 2, 10),
      label: action === 'equip' ? ' 장착 대상 ' : ' 사용 대상 ',
      items: heroLabels,
      keys: true,
      vi: false,
      mouse: true,
      tags: true,
      border: { type: 'line' },
      style: {
        fg: 'white',
        bg: 'black',
        border: { fg: 'cyan' },
        selected: { fg: 'black', bg: 'cyan', bold: true },
        label: { fg: 'cyan' },
      } as any,
    });
    screen.append(heroSelectBox);
    heroSelectBox.focus();
    screen.render();

    heroSelectBox.on('select', (_el: any, idx: number) => {
      if (idx >= aliveHeroes.length) return;
      const hero = aliveHeroes[idx]!;
      resolve(action, hero.id);
    });

    heroSelectBox.key(['escape'], () => {
      if (heroSelectBox) {
        heroSelectBox.destroy();
        heroSelectBox = null;
        popup.focus();
        screen.render();
      }
    });
  };

  const handleKey = (ch: string, _key: any) => {
    if (resolved) return;
    if (heroSelectBox) return; // hero select is active

    if (ch === '1') {
      if (isEquipment) {
        showHeroSelect('equip');
      } else if (isConsumable) {
        showHeroSelect('use');
      }
    } else if (ch === '2') {
      if (!inventoryFull) {
        resolve('store');
      }
    } else if (ch === '3') {
      resolve('discard');
    }
  };

  screen.on('keypress', handleKey);

  const result = {
    active,
    destroy: () => {
      screen.removeListener('keypress', handleKey);
      cleanup();
    },
  };

  // Use a getter so `active` reflects current state
  Object.defineProperty(result, 'active', {
    get: () => active,
  });

  return result;
}
