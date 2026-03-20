import blessed from 'blessed';
import { BaseScreen } from './BaseScreen.ts';
import type { GameStore } from '../state/GameStore.ts';
import type { Hero, HeroClass, Item } from '../models/types.ts';
import { COMPANION_CLASSES, HERO_CLASSES, getClassName, getStars } from '../data/heroes.ts';
import { TOWN_ART } from '../data/ascii-art.ts';
import { SUPPLY_ITEMS, SHOP_WEAPONS, SHOP_ARMOR, SHOP_TRINKETS } from '../data/items.ts';
import { formatBar } from '../utils/helpers.ts';

export class TownScreen extends BaseScreen {
  private infoBox!: blessed.Widgets.BoxElement;
  private mainMenu!: blessed.Widgets.ListElement;
  private subMenu: blessed.Widgets.ListElement | null = null;
  private partyBox!: blessed.Widgets.BoxElement;

  render(): void {
    const state = this.store.getState();

    // Background
    this.createBox({
      top: 0, left: 0, width: '100%', height: '100%',
      style: { bg: 'black' },
    });

    // Collection progress
    const uniqueCollected = new Set(state.roster.map(h => `${h.class}_${h.rarity}`)).size;
    const totalPossible = HERO_CLASSES.length * 3;
    const runsDisplay = state.runsCompleted > 0 ? `  |  {green-fg}완료: ${state.runsCompleted}회{/green-fg}` : '';
    const floorRecord = state.maxFloorReached > 0 ? `  |  {magenta-fg}최고: ${state.maxFloorReached}층{/magenta-fg}` : '';

    // Top bar
    this.createBox({
      top: 0, left: 0, width: '100%', height: 3,
      content: `{bold}{yellow-fg} 마을{/yellow-fg}{/bold}  |  {yellow-fg}골드: ${state.gold}{/yellow-fg}  |  {bold}{cyan-fg}[ ${state.week}주차 ]{/cyan-fg}{/bold}  |  {gray-fg}영웅: ${state.roster.length}명{/gray-fg}  |  수집: ${uniqueCollected}/${totalPossible}${floorRecord}${runsDisplay}`,
      tags: true,
      border: { type: 'line' },
      style: { fg: 'white', bg: 'black', border: { fg: 'gray' } },
    });

    // Left panel: Party roster
    this.partyBox = this.createBox({
      top: 3, left: 0, width: '30%', height: '70%',
      label: ' 현재 파티 ',
      tags: true,
      border: { type: 'line' },
      style: { fg: 'white', bg: 'black', border: { fg: 'blue' }, label: { fg: 'cyan' } } as any,
      scrollable: true,
    });
    this.updatePartyDisplay();

    // Center panel: Main menu
    const menuItems = [
      '동료 모집 (300G)',
      '영웅 도감',
      '파티 편성',
      '장비/인벤토리',
      '상점',
      '탑 도전',
      '저장',
      '타이틀로',
    ];

    this.mainMenu = blessed.list({
      top: 3, left: '30%', width: '40%', height: '70%',
      label: ' 행동 선택 ',
      items: menuItems,
      keys: true,
      vi: false,
      mouse: true,
      tags: true,
      border: { type: 'line' },
      style: {
        fg: 'white', bg: 'black',
        border: { fg: 'yellow' },
        selected: { fg: 'black', bg: 'yellow', bold: true },
        label: { fg: 'yellow' } as any,
      },
    });
    this.addWidget(this.mainMenu);

    // Right panel: Info
    this.infoBox = this.createBox({
      top: 3, left: '70%', width: '30%', height: '70%',
      label: ' 정보 ',
      tags: true,
      border: { type: 'line' },
      style: { fg: 'white', bg: 'black', border: { fg: 'gray' }, label: { fg: 'gray' } } as any,
      content: '{gray-fg}메뉴를 선택하세요.{/gray-fg}',
    });

    // Town art
    this.createBox({
      bottom: 0, left: 0, width: '100%', height: TOWN_ART.length + 2,
      content: TOWN_ART.join('\n'),
      tags: true,
      border: { type: 'line' },
      style: { fg: 'gray', bg: 'black', border: { fg: 'gray' } },
      align: 'center',
    });

    this.mainMenu.on('select item', (_item: any, index: number) => {
      this.updateInfoForIndex(index);
    });

    this.mainMenu.on('select', (_item: any, index: number) => {
      this.handleMenuSelect(index);
    });

    // Inventory shortcut
    this.screen.key(['i'], () => {
      if (this.subMenu) return;
      this.store.dispatch({ type: 'NAVIGATE', screen: 'inventory' });
    });

    this.mainMenu.focus();
    this.screen.render();
  }

  private updatePartyDisplay(): void {
    const state = this.store.getState();
    let content = '';
    for (let i = 0; i < 4; i++) {
      const hero = state.party[i];
      const posLabel = i < 2 ? '{cyan-fg}전열{/cyan-fg}' : '{green-fg}후열{/green-fg}';
      if (hero) {
        const stars = getStars(hero.rarity);
        const hpColor = hero.stats.hp / hero.stats.maxHp > 0.5 ? 'green' : hero.stats.hp / hero.stats.maxHp > 0.25 ? 'yellow' : 'red';
        const hpBar = formatBar(hero.stats.hp, hero.stats.maxHp, 10);
        const stressBar = formatBar(hero.stats.stress, 100, 6);
        const stressColor = hero.stats.stress >= 100 ? 'red' : hero.stats.stress >= 50 ? 'yellow' : 'gray';
        const mcTag = hero.isMainCharacter ? '{bold}{yellow-fg}[주인공]{/yellow-fg}{/bold} ' : '';
        content += `[${i + 1}] ${posLabel} ${mcTag}{yellow-fg}${stars}{/yellow-fg} ${getClassName(hero.class)}\n`;
        content += `  {bold}${hero.name}{/bold} Lv.${hero.level}\n`;
        content += `  HP {${hpColor}-fg}${hpBar}{/${hpColor}-fg} ${hero.stats.hp}/${hero.stats.maxHp}\n`;
        content += `  ST {${stressColor}-fg}${stressBar}{/${stressColor}-fg} ${hero.stats.stress}\n\n`;
      } else {
        content += `[${i + 1}] ${posLabel} {gray-fg}빈 슬롯{/gray-fg}\n\n`;
      }
    }
    this.partyBox.setContent(content);
  }

  private updateInfoForIndex(index: number): void {
    const state = this.store.getState();
    let info = '';
    switch (index) {
      case 0: // Recruit
        info = '{yellow-fg}영웅 모집{/yellow-fg}\n\n비용: 300 골드\n현재 골드: ' + state.gold + '\n\n새로운 영웅을 고용합니다.\n레어리티: \u2605 60% \u2605\u2605 30% \u2605\u2605\u2605 10%';
        break;
      case 1: // Collection
        info = '{yellow-fg}영웅 도감{/yellow-fg}\n\n수집한 영웅 조합을\n확인합니다.';
        break;
      case 2: // Party
        info = '{yellow-fg}파티 편성{/yellow-fg}\n\n파티 구성원을\n배치합니다.\n\n현재 파티원: ' + state.party.filter(h => h !== null).length + '/4';
        break;
      case 3: // Inventory
        info = '{yellow-fg}장비/인벤토리{/yellow-fg}\n\n보유 아이템: ' + state.inventory.length + '개';
        break;
      case 4: // Shop
        info = '{yellow-fg}상점{/yellow-fg}\n\n무기, 방어구, 장신구,\n보급품을 구매합니다.\n\n현재 골드: ' + state.gold;
        break;
      case 5: // Tower
        info = '{yellow-fg}탑 도전{/yellow-fg}\n\n{bold}{red-fg}어둠의 탑{/red-fg}{/bold}\n100층의 탑에 도전합니다.\n\n{magenta-fg}최고 기록: ' + state.maxFloorReached + '층{/magenta-fg}\n\n한번/연속 탐험 선택 가능';
        break;
      case 6: // Save
        info = '{yellow-fg}저장{/yellow-fg}\n\n현재 진행 상황을\n저장합니다.';
        break;
      case 7: // Title
        info = '{yellow-fg}타이틀로{/yellow-fg}\n\n타이틀 화면으로\n돌아갑니다.';
        break;
    }
    this.infoBox.setContent(info);
    this.screen.render();
  }

  private handleMenuSelect(index: number): void {
    switch (index) {
      case 0: this.showRecruitMenu(); break;
      case 1: this.showCollectionView(); break;
      case 2: this.store.dispatch({ type: 'NAVIGATE', screen: 'party_select' }); break;
      case 3: this.showHeroDetailOrInventory(); break;
      case 4: this.showShopMenu(); break;
      case 5: this.showTowerMenu(); break;
      case 6: this.saveGame(); break;
      case 7: this.store.dispatch({ type: 'NAVIGATE', screen: 'title' }); break;
    }
  }

  private clearSubMenu(): void {
    if (this.subMenu) {
      this.subMenu.destroy();
      const idx = this.widgets.indexOf(this.subMenu as any);
      if (idx !== -1) this.widgets.splice(idx, 1);
      this.subMenu = null;
    }
  }

  private showRecruitMenu(): void {
    this.clearSubMenu();
    const state = this.store.getState();
    if (state.gold < 300) {
      this.infoBox.setContent('{red-fg}골드가 부족합니다!{/red-fg}\n\n필요: 300G\n현재: ' + state.gold + 'G');
      this.screen.render();
      return;
    }
    if (state.roster.length >= 12) {
      this.infoBox.setContent('{red-fg}영웅 목록이 가득 찼습니다!{/red-fg}\n\n최대 12명까지 고용 가능.');
      this.screen.render();
      return;
    }

    const items = COMPANION_CLASSES.map(hc => `${getClassName(hc)} (300G)`);
    items.push('돌아가기');

    this.subMenu = blessed.list({
      top: 'center', left: 'center', width: 30, height: items.length + 2,
      label: ' 동료 모집 ',
      items,
      keys: true, vi: false, mouse: true, tags: true,
      border: { type: 'line' },
      style: {
        fg: 'white', bg: 'black',
        border: { fg: 'yellow' },
        selected: { fg: 'black', bg: 'yellow', bold: true },
        label: { fg: 'yellow' } as any,
      },
    });
    this.addWidget(this.subMenu);
    this.subMenu.focus();

    this.subMenu.on('select', (_item: any, idx: number) => {
      if (idx < COMPANION_CLASSES.length) {
        this.store.dispatch({ type: 'RECRUIT_HERO', heroClass: COMPANION_CLASSES[idx]! });
        const newState = this.store.getState();
        const newHero = newState.roster[newState.roster.length - 1];
        if (newHero) {
          const stars = getStars(newHero.rarity);
          const rarityColor = newHero.rarity === 3 ? 'yellow' : newHero.rarity === 2 ? 'cyan' : 'white';
          this.infoBox.setContent(`{${rarityColor}-fg}{bold}${stars} 등장!{/bold}{/${rarityColor}-fg}\n\n${newHero.name} (${getClassName(newHero.class)})\n\n남은 골드: ${newState.gold}`);
        }
        this.updatePartyDisplay();
      }
      this.clearSubMenu();
      this.mainMenu.focus();
      this.screen.render();
    });

    this.subMenu.key(['escape'], () => {
      this.clearSubMenu();
      this.mainMenu.focus();
      this.screen.render();
    });

    this.screen.render();
  }

  private showCollectionView(): void {
    this.clearSubMenu();
    const state = this.store.getState();

    let content = '{bold}{yellow-fg}영웅 도감{/yellow-fg}{/bold}\n\n';

    for (const hc of HERO_CLASSES) {
      content += `{cyan-fg}${getClassName(hc)}{/cyan-fg}\n`;
      for (const rarity of [1, 2, 3] as const) {
        const stars = getStars(rarity);
        const heroes = state.roster.filter(h => h.class === hc && h.rarity === rarity);
        if (heroes.length > 0) {
          const heroNames = heroes.map(h => h.name).join(', ');
          content += `  {yellow-fg}${stars}{/yellow-fg} ${heroNames} (${heroes.length}명)\n`;
        } else {
          content += `  {gray-fg}${stars} ???{/gray-fg}\n`;
        }
      }
      content += '\n';
    }

    const uniqueCollected = new Set(state.roster.map(h => `${h.class}_${h.rarity}`)).size;
    const totalPossible = HERO_CLASSES.length * 3;
    content += `\n{bold}수집 진행: ${uniqueCollected}/${totalPossible}{/bold}`;

    this.infoBox.setContent(content);
    this.screen.render();
  }

  private showHeroDetailOrInventory(): void {
    this.clearSubMenu();

    const items = ['영웅 상세', '인벤토리', '돌아가기'];

    this.subMenu = blessed.list({
      top: 'center', left: 'center', width: 25, height: items.length + 2,
      label: ' 선택 ',
      items,
      keys: true, vi: false, mouse: true, tags: true,
      border: { type: 'line' },
      style: {
        fg: 'white', bg: 'black',
        border: { fg: 'cyan' },
        selected: { fg: 'black', bg: 'cyan', bold: true },
        label: { fg: 'cyan' } as any,
      },
    });
    this.addWidget(this.subMenu);
    this.subMenu.focus();

    this.subMenu.on('select', (_item: any, idx: number) => {
      this.clearSubMenu();
      if (idx === 0) {
        this.showHeroDetailMenu();
      } else if (idx === 1) {
        this.store.dispatch({ type: 'NAVIGATE', screen: 'inventory' });
      } else {
        this.mainMenu.focus();
        this.screen.render();
      }
    });

    this.subMenu.key(['escape'], () => {
      this.clearSubMenu();
      this.mainMenu.focus();
      this.screen.render();
    });

    this.screen.render();
  }

  private showShopMenu(): void {
    this.clearSubMenu();
    const allItems: Item[] = [...SUPPLY_ITEMS, ...SHOP_WEAPONS, ...SHOP_ARMOR, ...SHOP_TRINKETS];
    const itemLabels = allItems.map(item => {
      const typeLabel = item.type === 'supply' ? '[보급]' : item.type === 'weapon' ? '[무기]' : item.type === 'armor' ? '[방어]' : '[장신]';
      return `${typeLabel} ${item.name} - ${item.value}G`;
    });
    itemLabels.push('돌아가기');

    this.subMenu = blessed.list({
      top: 'center', left: 'center', width: 40, height: Math.min(itemLabels.length + 2, 20),
      label: ' 상점 ',
      items: itemLabels,
      keys: true, vi: false, mouse: true, tags: true,
      border: { type: 'line' },
      scrollable: true,
      style: {
        fg: 'white', bg: 'black',
        border: { fg: 'green' },
        selected: { fg: 'black', bg: 'green', bold: true },
        label: { fg: 'green' } as any,
      },
    });
    this.addWidget(this.subMenu);
    this.subMenu.focus();

    this.subMenu.on('select item', (_el: any, idx: number) => {
      if (idx < allItems.length) {
        const item = allItems[idx]!;
        let detail = `{yellow-fg}${item.name}{/yellow-fg}\n\n${item.description}\n\n가격: ${item.value}G\n`;
        if (item.modifiers.length > 0) {
          detail += '\n효과:\n';
          for (const mod of item.modifiers) {
            detail += `  ${mod.stat}: ${mod.value > 0 ? '+' : ''}${mod.value}\n`;
          }
        }
        this.infoBox.setContent(detail);
        this.screen.render();
      }
    });

    this.subMenu.on('select', (_item: any, idx: number) => {
      if (idx < allItems.length) {
        const item = allItems[idx]!;
        const state = this.store.getState();
        if (state.gold >= item.value) {
          this.store.dispatch({ type: 'BUY_ITEM', item });
          this.infoBox.setContent(`{green-fg}${item.name}을(를) 구매했습니다!{/green-fg}\n\n남은 골드: ${this.store.getState().gold}`);
        } else {
          this.infoBox.setContent('{red-fg}골드가 부족합니다!{/red-fg}');
        }
        this.screen.render();
      } else {
        this.clearSubMenu();
        this.mainMenu.focus();
        this.screen.render();
      }
    });

    this.subMenu.key(['escape'], () => {
      this.clearSubMenu();
      this.mainMenu.focus();
      this.screen.render();
    });

    this.screen.render();
  }

  private showTowerMenu(): void {
    this.clearSubMenu();
    const state = this.store.getState();
    const partyCount = state.party.filter(h => h !== null).length;
    if (partyCount === 0) {
      this.infoBox.setContent('{red-fg}파티에 영웅이 없습니다!{/red-fg}\n\n파티 편성에서\n영웅을 배치하세요.');
      this.screen.render();
      return;
    }

    const items = ['한번 도전', '연속 도전 (자동 반복)', '돌아가기'];

    this.subMenu = blessed.list({
      top: 'center', left: 'center', width: 30, height: items.length + 2,
      label: ' 어둠의 탑 ',
      items,
      keys: true, vi: false, mouse: true, tags: true,
      border: { type: 'line' },
      style: {
        fg: 'white', bg: 'black',
        border: { fg: 'red' },
        selected: { fg: 'black', bg: 'red', bold: true },
        label: { fg: 'red' } as any,
      },
    });
    this.addWidget(this.subMenu);
    this.subMenu.focus();

    this.subMenu.on('select item', (_el: any, idx: number) => {
      if (idx === 0) {
        this.infoBox.setContent(`{red-fg}{bold}어둠의 탑{/bold}{/red-fg}\n\n100층의 탑에 도전합니다.\n1층부터 시작합니다.\n\n{magenta-fg}최고 기록: ${state.maxFloorReached}층{/magenta-fg}\n\n10층마다 보스 출현!`);
      } else if (idx === 1) {
        this.infoBox.setContent(`{red-fg}{bold}연속 도전{/bold}{/red-fg}\n\n탑 클리어 후\n자동으로 다시 도전합니다.\n\n파티 회복 후 재입장\nHP 위험시 자동 중지`);
      }
      this.screen.render();
    });

    this.subMenu.on('select', (_item: any, idx: number) => {
      this.clearSubMenu();
      if (idx === 0 || idx === 1) {
        if (idx === 1) {
          this.store.dispatch({ type: 'SET_CONTINUOUS_RUN', enabled: true });
        } else {
          this.store.dispatch({ type: 'SET_CONTINUOUS_RUN', enabled: false });
        }
        this.store.dispatch({ type: 'ENTER_TOWER' });
      } else {
        this.mainMenu.focus();
        this.screen.render();
      }
    });

    this.subMenu.key(['escape'], () => {
      this.clearSubMenu();
      this.mainMenu.focus();
      this.screen.render();
    });

    this.screen.render();
  }

  private showHeroDetailMenu(): void {
    this.clearSubMenu();
    const state = this.store.getState();
    if (state.roster.length === 0) {
      this.infoBox.setContent('{red-fg}영웅이 없습니다!{/red-fg}\n\n영웅을 모집하세요.');
      this.screen.render();
      return;
    }

    const heroLabels = state.roster.map(h => {
      const stars = getStars(h.rarity);
      return `${stars} ${h.name} (${getClassName(h.class)}) Lv.${h.level}`;
    });
    heroLabels.push('돌아가기');

    this.subMenu = blessed.list({
      top: 'center', left: 'center', width: 40, height: Math.min(heroLabels.length + 2, 16),
      label: ' 영웅 선택 ',
      items: heroLabels,
      keys: true, vi: false, mouse: true, tags: true,
      border: { type: 'line' },
      scrollable: true,
      style: {
        fg: 'white', bg: 'black',
        border: { fg: 'cyan' },
        selected: { fg: 'black', bg: 'cyan', bold: true },
        label: { fg: 'cyan' } as any,
      },
    });
    this.addWidget(this.subMenu);
    this.subMenu.focus();

    this.subMenu.on('select', (_item: any, idx: number) => {
      if (idx < state.roster.length) {
        const hero = state.roster[idx]!;
        this.store.dispatch({ type: 'SET_SELECTED_HERO', heroId: hero.id });
        this.store.dispatch({ type: 'NAVIGATE', screen: 'hero_detail' });
      } else {
        this.clearSubMenu();
        this.mainMenu.focus();
        this.screen.render();
      }
    });

    this.subMenu.key(['escape'], () => {
      this.clearSubMenu();
      this.mainMenu.focus();
      this.screen.render();
    });

    this.screen.render();
  }

  private saveGame(): void {
    const success = this.store.saveGame();
    if (success) {
      this.infoBox.setContent('{green-fg}게임이 저장되었습니다!{/green-fg}');
    } else {
      this.infoBox.setContent('{red-fg}저장에 실패했습니다.{/red-fg}');
    }
    this.screen.render();
  }
}
