import blessed from 'blessed';
import { GameStore } from './state/GameStore.ts';
import { BaseScreen } from './screens/BaseScreen.ts';
import { TitleScreen } from './screens/TitleScreen.ts';
import { TownScreen } from './screens/TownScreen.ts';
import { PartySelectScreen } from './screens/PartySelectScreen.ts';
import { DungeonScreen } from './screens/DungeonScreen.ts';
import { CombatScreen } from './screens/CombatScreen.ts';
import { InventoryScreen } from './screens/InventoryScreen.ts';
import { EventScreen } from './screens/EventScreen.ts';
import { GameOverScreen } from './screens/GameOverScreen.ts';
import { HeroDetailScreen } from './screens/HeroDetailScreen.ts';
import { CharacterSelectScreen } from './screens/CharacterSelectScreen.ts';
import { StatAllocationScreen } from './screens/StatAllocationScreen.ts';
import type { Screen } from './models/types.ts';

export class App {
  private screen: blessed.Widgets.Screen;
  private store: GameStore;
  private currentScreen: BaseScreen | null = null;
  private previousScreen: Screen | null = null;

  constructor() {
    this.screen = blessed.screen({
      smartCSR: true,
      title: 'tui-game',
      fullUnicode: true,
    });

    this.store = new GameStore();

    // Global key: Ctrl+C to quit
    this.screen.key(['C-c'], () => process.exit(0));

    // Listen for state changes to handle screen transitions
    this.store.on('change', (state) => {
      if (state.screen !== this.previousScreen) {
        this.previousScreen = state.screen;
        this.switchScreen(state.screen);
      }
    });
  }

  private switchScreen(screenName: Screen): void {
    if (this.currentScreen) {
      this.currentScreen.destroy();
    }

    switch (screenName) {
      case 'title': this.currentScreen = new TitleScreen(this.screen, this.store); break;
      case 'town': this.currentScreen = new TownScreen(this.screen, this.store); break;
      case 'party_select': this.currentScreen = new PartySelectScreen(this.screen, this.store); break;
      case 'dungeon': this.currentScreen = new DungeonScreen(this.screen, this.store); break;
      case 'combat': this.currentScreen = new CombatScreen(this.screen, this.store); break;
      case 'inventory': this.currentScreen = new InventoryScreen(this.screen, this.store); break;
      case 'event': this.currentScreen = new EventScreen(this.screen, this.store); break;
      case 'game_over': this.currentScreen = new GameOverScreen(this.screen, this.store); break;
      case 'hero_detail': this.currentScreen = new HeroDetailScreen(this.screen, this.store); break;
      case 'character_select': this.currentScreen = new CharacterSelectScreen(this.screen, this.store); break;
      case 'stat_allocation': this.currentScreen = new StatAllocationScreen(this.screen, this.store); break;
    }

    this.currentScreen!.render();
    this.screen.render();
  }

  start(): void {
    this.switchScreen('title');
  }
}
