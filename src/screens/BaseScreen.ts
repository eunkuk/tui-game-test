import blessed from 'blessed';
import type { GameStore } from '../state/GameStore.ts';

export abstract class BaseScreen {
  protected screen: blessed.Widgets.Screen;
  protected store: GameStore;
  protected widgets: blessed.Widgets.Node[] = [];
  protected keyHandlers: Array<{ keys: string[]; handler: (...args: any[]) => void }> = [];

  constructor(screen: blessed.Widgets.Screen, store: GameStore) {
    this.screen = screen;
    this.store = store;
  }

  protected registerKey(keys: string[], handler: (...args: any[]) => void): void {
    this.screen.key(keys, handler);
    this.keyHandlers.push({ keys, handler });
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
    for (const { keys, handler } of this.keyHandlers) {
      (this.screen as any).unkey(keys, handler);
    }
    this.keyHandlers = [];
    for (const widget of this.widgets) {
      widget.destroy();
    }
    this.widgets = [];
  }

  refresh(): void {
    this.screen.render();
  }
}
