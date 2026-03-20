import blessed from 'blessed';
import { BaseScreen } from './BaseScreen.ts';
import type { MainCharClass } from '../models/types.ts';
import { MAIN_CHAR_CLASSES, getClassName, BASE_STATS, RECOMMENDED_POSITIONS } from '../data/heroes.ts';
import { HERO_SKILLS } from '../data/skills.ts';

export class CharacterSelectScreen extends BaseScreen {
  render(): void {
    // Background
    this.createBox({
      top: 0, left: 0, width: '100%', height: '100%',
      style: { bg: 'black' },
    });

    // Title
    this.createBox({
      top: 0, left: 'center', width: 40, height: 3,
      content: '{center}{bold}클래스 선택{/bold}{/center}',
      tags: true,
      border: { type: 'line' },
      style: { fg: 'white', bg: 'black', border: { fg: 'red' } },
    });

    // Class list (left side)
    const classList = blessed.list({
      top: 4, left: 2, width: 24, height: MAIN_CHAR_CLASSES.length + 2,
      label: ' 클래스 ',
      border: { type: 'line' },
      tags: true,
      keys: true,
      vi: true,
      mouse: true,
      items: MAIN_CHAR_CLASSES.map(cls => ` ${getClassName(cls)}`),
      style: {
        fg: 'white',
        bg: 'black',
        border: { fg: 'red' },
        selected: { fg: 'black', bg: 'yellow', bold: true },
        item: { fg: 'white' },
      },
    });
    this.addWidget(classList);

    // Preview panel (right side)
    const previewBox = this.createBox({
      top: 4, left: 28, width: 50, height: 20,
      label: ' 상세 정보 ',
      border: { type: 'line' },
      tags: true,
      scrollable: true,
      style: { fg: 'white', bg: 'black', border: { fg: 'red' } },
    });

    // Hint
    this.createBox({
      bottom: 0, left: 'center', width: 50, height: 3,
      content: '{center}Enter: 선택 | Esc: 뒤로{/center}',
      tags: true,
      border: { type: 'line' },
      style: { fg: 'gray', bg: 'black', border: { fg: 'red' } },
    });

    const updatePreview = (index: number) => {
      const cls = MAIN_CHAR_CLASSES[index];
      const stats = BASE_STATS[cls];
      const pos = RECOMMENDED_POSITIONS[cls];
      const skills = HERO_SKILLS[cls];

      let content = `{bold}{yellow-fg}${getClassName(cls)}{/yellow-fg}{/bold}\n\n`;
      content += `{bold}── 기본 스탯 ──{/bold}\n`;
      content += `  HP:   ${stats.maxHp}\n`;
      content += `  공격: ${stats.attack}\n`;
      content += `  방어: ${stats.defense}\n`;
      content += `  속도: ${stats.speed}\n`;
      content += `  명중: ${stats.accuracy}\n`;
      content += `  회피: ${stats.dodge}\n`;
      content += `  치명타: ${stats.crit}\n\n`;
      content += `{bold}── 위치 ──{/bold}\n`;
      content += `  ${pos.label}\n\n`;
      content += `{bold}── 스킬 ──{/bold}\n`;
      for (const skill of skills) {
        content += `  {yellow-fg}${skill.name}{/yellow-fg} - ${skill.description}\n`;
      }

      previewBox.setContent(content);
      this.screen.render();
    };

    // Show first class preview by default
    classList.select(0);
    updatePreview(0);

    classList.on('select item', (_item: blessed.Widgets.BoxElement, index: number) => {
      updatePreview(index);
    });

    classList.on('select', (_item: blessed.Widgets.BoxElement, index: number) => {
      const selectedClass = MAIN_CHAR_CLASSES[index] as MainCharClass;
      this.store.dispatch({ type: 'NEW_GAME', mainCharClass: selectedClass });
    });

    classList.key(['escape'], () => {
      this.store.dispatch({ type: 'NAVIGATE', screen: 'title' });
    });

    classList.focus();
    this.screen.render();
  }
}
