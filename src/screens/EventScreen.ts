import blessed from 'blessed';
import { BaseScreen } from './BaseScreen.ts';

export class EventScreen extends BaseScreen {
  render(): void {
    const state = this.store.getState();
    const event = state.currentEvent;
    const speed = state.gameSpeed;

    if (!event) {
      this.store.dispatch({ type: 'NAVIGATE', screen: 'dungeon' });
      return;
    }

    // Background
    this.createBox({
      top: 0, left: 0, width: '100%', height: '100%',
      style: { bg: 'black' },
    });

    // Event title
    const titleColor = event.title.includes('\ubcf4\ubb3c') || event.title.includes('\ud589\uc6b4')
      ? 'yellow'
      : event.title.includes('\ud568\uc815') || event.title.includes('\ubd88\uc6b4')
        ? 'red'
        : 'magenta';

    this.createBox({
      top: 2, left: 'center', width: 50, height: 3,
      content: `{bold}{${titleColor}-fg}${event.title}{/${titleColor}-fg}{/bold}`,
      tags: true,
      border: { type: 'line' },
      style: { fg: 'white', bg: 'black', border: { fg: titleColor } },
      align: 'center',
    });

    // Room type icon
    let icon = '';
    if (event.title.includes('\ubcf4\ubb3c')) {
      icon = '   ___\n  /   \\\n |  $  |\n |_____|\n  |   |\n  |___|';
    } else if (event.title.includes('\ud568\uc815')) {
      icon = '  /!\\\n / ! \\\n/  !  \\\n------\n  | |\n  |_|';
    } else {
      icon = '   ?\n  / \\\n |   |\n  \\ /\n   ?\n   .';
    }

    this.createBox({
      top: 5, left: 'center', width: 20, height: 8,
      content: icon,
      style: { fg: titleColor, bg: 'black' },
      align: 'center',
    });

    // Description
    this.createBox({
      top: 13, left: 'center', width: 60, height: 6,
      content: event.description,
      tags: true,
      border: { type: 'line' },
      style: { fg: 'white', bg: 'black', border: { fg: 'gray' } },
      align: 'center',
    });

    // Auto-continue hint
    this.createBox({
      bottom: 1, left: 'center', width: 40, height: 1,
      content: '{gray-fg}\uc790\ub3d9 \uacc4\uc18d...{/gray-fg}',
      tags: true,
      style: { fg: 'gray', bg: 'black' },
      align: 'center',
    });

    this.screen.render();

    // Auto-execute after a brief delay
    setTimeout(() => {
      if (event.choices.length > 0) {
        // For curio events, pick safe option
        const safeChoiceIdx = event.choices.findIndex(c => c.text === '\uc9c0\ub098\uce58\uae30');
        if (safeChoiceIdx !== -1) {
          event.choices[safeChoiceIdx]!.action();
        } else {
          event.choices[0]!.action();
        }
      }
    }, Math.floor(800 / speed));
  }
}
