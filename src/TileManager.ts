import Tile from './tile.js';
import Meta from 'gi://Meta';
import Gio from 'gi://Gio';

export default class TileManager {
  private tiles: Map<number, Tile> = new Map();
  private settings: Gio.Settings;
  private windowCreatedSignal: number;

  constructor(settings: Gio.Settings) {
    this.settings = settings;
    this.windowCreatedSignal = global.display.connect('window-created', (_, window) => {
      if (window.get_window_type() === Meta.WindowType.NORMAL) {
        this.createTileForWindow(window);
      }
    });
  }

  private createTileForWindow(window: Meta.Window) {
    const tile = new Tile(window);
    const windowId = window.get_id();
    this.tiles.set(windowId, tile);
    window.connect('unmanaged', () => {
      tile.destroy();
      this.tiles.delete(windowId);
    });
    return tile;
  }

  getCurrentTile() {
    const window = global.display.get_focus_window();
    if (!window) {
      return null;
    }
    const existingTile = this.tiles.get(window.get_id());
    const tile = existingTile ?? this.createTileForWindow(window);
    const gapSize = this.settings.get_int('gap-size');
    tile.reloadScreen(gapSize);
    return tile;
  }

  destroy() {
    global.display.disconnect(this.windowCreatedSignal);
    for (const tile of this.tiles.values()) {
      tile.destroy();
    }
    this.tiles.clear();
  }
};
