import blessed from 'blessed';
import { BaseScreen } from './BaseScreen.ts';
import { TITLE_ART } from '../data/ascii-art.ts';

export class TitleScreen extends BaseScreen {
  render(): void {
    // Background
    this.createBox({
      top: 0, left: 0, width: '100%', height: '100%',
      style: { bg: 'black' },
    });

    // Title ASCII art
    const titleText = TITLE_ART.join('\n');
    this.createBox({
      top: 1,
      left: 'center',
      width: 78,
      height: TITLE_ART.length + 2,
      content: titleText,
      tags: true,
      style: { fg: 'red', bg: 'black' },
      align: 'center',
    });

    // Subtitle
    this.createBox({
      top: TITLE_ART.length + 3,
      left: 'center',
      width: 40,
      height: 3,
      content: '{bold}{yellow-fg}어둠의 탑{/yellow-fg}{/bold}\n{gray-fg}어둠 속으로 내려가라... 감히 할 수 있다면.{/gray-fg}',
      tags: true,
      style: { fg: 'white', bg: 'black' },
      align: 'center',
    });

    // Menu
    const hasSave = this.store.hasSaveFile();
    const menuItems = ['새 게임'];
    if (hasSave) {
      menuItems.push('이어하기');
    } else {
      menuItems.push('{gray-fg}이어하기 (저장 없음){/gray-fg}');
    }
    menuItems.push('나가기');

    const menu = blessed.list({
      top: TITLE_ART.length + 7,
      left: 'center',
      width: 30,
      height: menuItems.length + 2,
      items: menuItems,
      keys: true,
      vi: false,
      mouse: true,
      tags: true,
      border: { type: 'line' },
      style: {
        fg: 'white',
        bg: 'black',
        border: { fg: 'gray' },
        selected: { fg: 'black', bg: 'yellow', bold: true },
      },
    });
    this.addWidget(menu);

    // Controls hint
    this.createBox({
      bottom: 1,
      left: 'center',
      width: 40,
      height: 1,
      content: '{gray-fg}   ↑↓: 선택   Enter: 확인{/gray-fg}',
      tags: true,
      style: { fg: 'gray', bg: 'black' },
      align: 'center',
    });

    menu.on('select', (_item: any, index: number) => {
      if (index === 0) {
        // New game -> character select
        this.store.dispatch({ type: 'NAVIGATE', screen: 'character_select' });
      } else if (index === 1) {
        if (hasSave) {
          const loaded = this.store.loadGame();
          if (loaded) {
            this.store.dispatch({ type: 'NAVIGATE', screen: 'town' });
          }
        }
      } else if ((hasSave && index === 2) || (!hasSave && index === 2)) {
        process.exit(0);
      }
    });

    menu.focus();
    this.screen.render();
  }
}
