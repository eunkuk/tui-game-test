import blessed from 'blessed';
import { BaseScreen } from './BaseScreen.ts';
import type { GameStore } from '../state/GameStore.ts';
import type { Hero } from '../models/types.ts';
import { getClassName, RECOMMENDED_POSITIONS, getStars, CLASS_DESCRIPTIONS } from '../data/heroes.ts';
import { HERO_ART } from '../data/ascii-art.ts';
import { formatBar } from '../utils/helpers.ts';
import { getTraitCategoryColor } from '../data/traits.ts';

export class HeroDetailScreen extends BaseScreen {
  private actionList!: blessed.Widgets.ListElement;

  render(): void {
    const state = this.store.getState();
    const hero = state.roster.find(h => h.id === state.selectedHeroId);
    if (!hero) {
      this.store.dispatch({ type: 'NAVIGATE', screen: 'town' });
      return;
    }

    // Background
    this.createBox({
      top: 0, left: 0, width: '100%', height: '100%',
      style: { bg: 'black' },
    });

    // Title bar
    this.createBox({
      top: 0, left: 0, width: '100%', height: 3,
      content: `{bold}{yellow-fg} 영웅 상세{/yellow-fg}{/bold}  |  {yellow-fg}${getStars(hero.rarity)}{/yellow-fg} {cyan-fg}${hero.name}{/cyan-fg} - ${getClassName(hero.class)} Lv.${hero.level}  |  {yellow-fg}골드: ${state.gold}{/yellow-fg}`,
      tags: true,
      border: { type: 'line' },
      style: { fg: 'white', bg: 'black', border: { fg: 'gray' } },
    });

    // Left panel: ASCII art
    const art = HERO_ART[hero.class];
    const artContent = art.join('\n');
    this.createBox({
      top: 3, left: 0, width: '35%', height: art.length + 4,
      label: ` ${getClassName(hero.class)} `,
      content: `\n${artContent}`,
      tags: true,
      border: { type: 'line' },
      style: { fg: 'yellow', bg: 'black', border: { fg: 'yellow' }, label: { fg: 'yellow' } } as any,
      align: 'center',
    });

    // Left panel bottom: equipment
    const equipContent = this.buildEquipmentContent(hero);
    this.createBox({
      top: art.length + 7, left: 0, width: '35%', height: 10,
      label: ' 장비 ',
      content: equipContent,
      tags: true,
      border: { type: 'line' },
      style: { fg: 'white', bg: 'black', border: { fg: 'gray' }, label: { fg: 'gray' } } as any,
    });

    // Right panel: stats
    const statsContent = this.buildStatsContent(hero);
    this.createBox({
      top: 3, left: '35%', width: '35%', height: '55%',
      label: ' 능력치 ',
      content: statsContent,
      tags: true,
      border: { type: 'line' },
      scrollable: true,
      style: { fg: 'white', bg: 'black', border: { fg: 'cyan' }, label: { fg: 'cyan' } } as any,
    });

    // Skills panel
    const skillsContent = this.buildSkillsContent(hero);
    this.createBox({
      top: 3, left: '70%', width: '30%', height: '55%',
      label: ' 스킬 ',
      content: skillsContent,
      tags: true,
      border: { type: 'line' },
      scrollable: true,
      style: { fg: 'white', bg: 'black', border: { fg: 'magenta' }, label: { fg: 'magenta' } } as any,
    });

    // Bottom: Actions
    const maxLevel = hero.isMainCharacter ? 10 : 5;
    const canLevelUp = hero.level < maxLevel && hero.exp >= hero.expToLevel;
    const levelUpLabel = hero.level >= maxLevel
      ? '레벨업 (최대 레벨)'
      : canLevelUp ? '레벨업 (경험치 충족!)' : `레벨업 (EXP ${hero.exp}/${hero.expToLevel})`;

    const actionItems = [
      levelUpLabel,
      '스킬 확인',
    ];

    // Show stat allocation button for main character with unspent points
    if (hero.isMainCharacter && hero.statPoints > 0) {
      actionItems.push(`스탯 배분 (${hero.statPoints}포인트)`);
    }

    actionItems.push('돌아가기');

    this.actionList = blessed.list({
      bottom: 0, left: 0, width: '100%', height: actionItems.length + 2,
      label: ' 행동 ',
      items: actionItems,
      keys: true, vi: false, mouse: true, tags: true,
      border: { type: 'line' },
      style: {
        fg: 'white', bg: 'black',
        border: { fg: 'yellow' },
        selected: { fg: 'black', bg: 'yellow', bold: true },
        label: { fg: 'yellow' } as any,
      },
    });
    this.addWidget(this.actionList);

    this.actionList.on('select', (_item: any, index: number) => {
      this.handleAction(index, hero);
    });

    this.registerKey(['escape'], () => {
      this.store.dispatch({ type: 'NAVIGATE', screen: 'town' });
    });

    this.actionList.focus();
    this.screen.render();
  }

  private buildStatsContent(hero: Hero): string {
    const hpBar = formatBar(hero.stats.hp, hero.stats.maxHp, 14);
    const hpColor = hero.stats.hp / hero.stats.maxHp > 0.5 ? 'green' : hero.stats.hp / hero.stats.maxHp > 0.25 ? 'yellow' : 'red';

    const rec = RECOMMENDED_POSITIONS[hero.class];
    const posWarning = hero.position.col > 0 && !rec.cols.includes(hero.position.col)
      ? `{yellow-fg}! 현재 열(${hero.position.col})이 비추천{/yellow-fg}`
      : '';

    let content = '';
    const mcTag = hero.isMainCharacter ? '{bold}{yellow-fg}[주인공]{/yellow-fg}{/bold}\n' : '';
    const maxLevel = hero.isMainCharacter ? 10 : 5;
    content += mcTag;
    content += `{gray-fg}${CLASS_DESCRIPTIONS[hero.class]}{/gray-fg}\n`;
    content += `{bold}레어도:{/bold} {yellow-fg}${getStars(hero.rarity)}{/yellow-fg}\n`;
    content += `{bold}레벨:{/bold} ${hero.level}/${maxLevel}\n`;
    if (hero.isMainCharacter && hero.statPoints > 0) {
      content += `{bold}{green-fg}미분배 포인트: ${hero.statPoints}{/green-fg}{/bold}\n`;
    }
    content += `{cyan-fg}${rec.label}{/cyan-fg}\n`;
    if (posWarning) content += `${posWarning}\n`;
    content += `\n`;
    content += `{bold}HP{/bold}  {${hpColor}-fg}${hpBar}{/${hpColor}-fg}\n`;
    content += `     ${hero.stats.hp} / ${hero.stats.maxHp}\n`;
    const expBar = formatBar(hero.exp, hero.expToLevel, 14);
    const canLvUp = hero.exp >= hero.expToLevel && hero.level < maxLevel;
    const expLabel = canLvUp ? ' {green-fg}[레벨업 가능!]{/green-fg}' : '';
    content += `{bold}EXP{/bold} {cyan-fg}${expBar}{/cyan-fg}\n`;
    content += `     ${hero.exp} / ${hero.expToLevel}${expLabel}\n\n`;
    content += `{white-fg}공격력:{/white-fg}  ${hero.stats.attack}\n`;
    content += `{white-fg}방어력:{/white-fg}  ${hero.stats.defense}\n`;
    content += `{white-fg}속  도:{/white-fg}  ${hero.stats.speed}\n`;
    content += `{white-fg}명  중:{/white-fg}  ${hero.stats.accuracy}\n`;
    content += `{white-fg}회  피:{/white-fg}  ${hero.stats.dodge}\n`;
    content += `{white-fg}치명타:{/white-fg}  ${hero.stats.crit}%\n`;

    // Traits
    if (hero.traits && hero.traits.length > 0) {
      content += `\n{bold}특성:{/bold}\n`;
      for (const trait of hero.traits) {
        const color = getTraitCategoryColor(trait.category);
        content += `  {${color}-fg}${trait.name}{/${color}-fg} {gray-fg}${trait.description}{/gray-fg}\n`;
      }
    }

    return content;
  }

  private buildEquipmentContent(hero: Hero): string {
    let content = '';
    content += `{white-fg}무기:{/white-fg} ${hero.equipment.weapon ? `{yellow-fg}${hero.equipment.weapon.name}{/yellow-fg}` : '{gray-fg}없음{/gray-fg}'}\n`;
    content += `{white-fg}방어:{/white-fg} ${hero.equipment.armor ? `{cyan-fg}${hero.equipment.armor.name}{/cyan-fg}` : '{gray-fg}없음{/gray-fg}'}\n`;
    content += `{white-fg}장신1:{/white-fg} ${hero.equipment.trinket1 ? `{magenta-fg}${hero.equipment.trinket1.name}{/magenta-fg}` : '{gray-fg}없음{/gray-fg}'}\n`;
    content += `{white-fg}장신2:{/white-fg} ${hero.equipment.trinket2 ? `{magenta-fg}${hero.equipment.trinket2.name}{/magenta-fg}` : '{gray-fg}없음{/gray-fg}'}\n`;
    return content;
  }

  private buildSkillsContent(hero: Hero): string {
    let content = '';
    for (const skill of hero.skills) {
      const canUseFromPos = hero.position.col > 0 ? skill.useCols.includes(hero.position.col) : true;
      const posColor = canUseFromPos ? 'green' : 'red';
      content += `{bold}{yellow-fg}${skill.name}{/yellow-fg}{/bold}\n`;
      content += `{gray-fg}${skill.description}{/gray-fg}\n`;
      content += `{${posColor}-fg}사용: [${skill.useCols.join(',')}]{/${posColor}-fg}`;
      if (skill.targetAlly) {
        content += ` 대상: 아군\n`;
      } else {
        content += ` 대상: [${skill.targetCols.join(',')}]\n`;
      }
      if (skill.damage.max > 0) {
        content += `DMG: ${skill.damage.min}-${skill.damage.max}x `;
      }
      if (skill.heal) {
        content += `힐: ${skill.heal.min}-${skill.heal.max} `;
      }
      content += `\n\n`;
    }
    return content;
  }

  private handleAction(index: number, hero: Hero): void {
    const state = this.store.getState();
    switch (index) {
      case 0: { // Level up
        const maxLevel = hero.isMainCharacter ? 10 : 5;
        if (hero.level >= maxLevel) return;
        if (hero.exp < hero.expToLevel) return;
        this.store.dispatch({ type: 'LEVEL_UP_HERO', heroId: hero.id });
        // Re-render to show updated stats
        this.destroy();
        this.render();
        break;
      }
      case 1: { // View skills - already shown on right panel
        this.screen.render();
        break;
      }
      default: {
        // Check if this is stat allocation or go back
        if (hero.isMainCharacter && hero.statPoints > 0 && index === 2) {
          // Stat allocation
          this.store.dispatch({ type: 'SET_SELECTED_HERO', heroId: hero.id });
          this.store.dispatch({ type: 'NAVIGATE', screen: 'stat_allocation' });
        } else {
          // Go back
          this.store.dispatch({ type: 'NAVIGATE', screen: 'town' });
        }
        break;
      }
    }
  }
}
