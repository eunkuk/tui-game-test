import blessed from 'blessed';
import { BaseScreen } from './BaseScreen.ts';
import { SKULL_ART, VICTORY_ART } from '../data/ascii-art.ts';
import { calculatePrestigeGain } from '../data/prestige.ts';
import { savePrestige } from '../engine/save-load.ts';

export class GameOverScreen extends BaseScreen {
  render(): void {
    const state = this.store.getState();
    const isVictory = state.gameWon;

    // Calculate and award prestige
    const bossKills = Math.floor(state.maxFloorReached / 10);
    const prestigeGain = calculatePrestigeGain(state.maxFloorReached, bossKills, state.week);
    if (prestigeGain > 0) {
      this.store.dispatch({ type: 'EARN_PRESTIGE', amount: prestigeGain });
      savePrestige(this.store.getState().prestige);
    }

    // Permadeath: delete save on game over (non-victory)
    if (!isVictory) {
      this.store.deleteSave();
    }

    const bgColor = 'black';
    const fgColor = isVictory ? 'yellow' : 'red';

    // Background
    this.createBox({
      top: 0, left: 0, width: '100%', height: '100%',
      style: { bg: bgColor },
    });

    // ASCII art
    const art = isVictory ? VICTORY_ART : SKULL_ART;
    this.createBox({
      top: 1, left: 'center', width: 40, height: art.length + 2,
      content: art.join('\n'),
      style: { fg: fgColor, bg: bgColor },
      align: 'center',
    });

    // Title
    const title = isVictory ? '승리!' : '주인공이 쓰러졌습니다';
    const subtitle = isVictory
      ? '어둠의 탑을 정복했습니다!'
      : '여정은 여기서 끝납니다... 세이브가 삭제됩니다.';

    this.createBox({
      top: art.length + 3, left: 'center', width: 50, height: 5,
      content: `{bold}{${fgColor}-fg}${title}{/${fgColor}-fg}{/bold}\n\n{gray-fg}${subtitle}{/gray-fg}`,
      tags: true,
      style: { fg: 'white', bg: bgColor },
      align: 'center',
    });

    // Stats summary
    const currentPrestige = this.store.getState().prestige;
    const stats = [
      `{cyan-fg}주차:{/cyan-fg} ${state.week}`,
      `{cyan-fg}최고 층:{/cyan-fg} ${state.maxFloorReached}`,
      `{cyan-fg}연속 완료:{/cyan-fg} ${state.runsCompleted}회`,
      `{cyan-fg}보유 골드:{/cyan-fg} ${state.gold}`,
      `{yellow-fg}획득 명성:{/yellow-fg} +${prestigeGain}`,
      `{yellow-fg}총 명성:{/yellow-fg} ${currentPrestige.points}`,
    ];

    this.createBox({
      top: art.length + 8, left: 'center', width: 40, height: stats.length + 2,
      label: ' 기록 ',
      content: stats.join('\n'),
      tags: true,
      border: { type: 'line' },
      style: { fg: 'white', bg: bgColor, border: { fg: 'gray' }, label: { fg: 'gray' } } as any,
    });

    // Menu - no "continue" option on permadeath
    const menuItems = ['새 게임', '타이틀로', '나가기'];
    const menu = blessed.list({
      top: art.length + stats.length + 11, left: 'center', width: 20, height: menuItems.length + 2,
      items: menuItems,
      keys: true, vi: false, mouse: true, tags: true,
      border: { type: 'line' },
      style: {
        fg: 'white', bg: bgColor,
        border: { fg: fgColor },
        selected: { fg: 'black', bg: fgColor, bold: true },
      },
    });
    this.addWidget(menu);

    menu.on('select', (_item: any, index: number) => {
      if (index === 0) {
        // New game -> character select
        this.store.dispatch({ type: 'NAVIGATE', screen: 'character_select' });
      } else if (index === 1) {
        this.store.dispatch({ type: 'NAVIGATE', screen: 'title' });
      } else {
        process.exit(0);
      }
    });

    menu.focus();
    this.screen.render();
  }
}
