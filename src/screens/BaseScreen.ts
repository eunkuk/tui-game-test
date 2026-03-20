import blessed from 'blessed';
import type { GameStore } from '../state/GameStore.ts';

export abstract class BaseScreen {
  protected screen: blessed.Widgets.Screen;
  protected store: GameStore;
  protected widgets: blessed.Widgets.Node[] = [];

  constructor(screen: blessed.Widgets.Screen, store: GameStore) {
    this.screen = screen;
    this.store = store;
  }

  abstract render(): void;

  protected addWidget(widget: blessed.Widgets.Node): void {
    this.widgets.push(widget);
    this.screen.append(widget);
  }

  protected createBox(options: blessed.Widgets.BoxOptions): blessed.Widgets.BoxElement {
    const box = blessed.box(options);
    this.addWidget(box);
    return box;
  }

  destroy(): void {
    for (const widget of this.widgets) {
      widget.destroy();
    }
    this.widgets = [];
  }

  refresh(): void {
    this.screen.render();
  }
}
