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
    tile.connect('unmanaged', () => {
      tile.destroy();
      this.tiles.delete(windowId);
    });
    return tile;
  }

  private getCurrentTile() {
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

  moveRight() {
    const tile = this.getCurrentTile();
    const position = tile?.getPosition();
    if (position === Position.TOP_LEFT) {
      return tile?.move(Position.TOP);
    }
    if (position === Position.TOP) {
      return tile?.move(Position.TOP_RIGHT);
    }
    if (position === Position.BOTTOM_LEFT) {
      return tile?.move(Position.BOTTOM);
    }
    if (position === Position.BOTTOM) {
      return tile?.move(Position.BOTTOM_RIGHT);
    }
    return tile?.move(Position.RIGHT);
  }

  moveLeft() {
    const tile = this.getCurrentTile();
    const position = tile?.getPosition();
    if (position === Position.TOP_RIGHT) {
      return tile?.move(Position.TOP);
    }
    if (position === Position.TOP) {
      return tile?.move(Position.TOP_LEFT);
    }
    if (position === Position.BOTTOM_RIGHT) {
      return tile?.move(Position.BOTTOM);
    }
    if (position === Position.BOTTOM) {
      return tile?.move(Position.BOTTOM_LEFT);
    }
    return tile?.move(Position.LEFT);
  }

  moveUp() {
    const tile = this.getCurrentTile();
    const position = tile?.getPosition();
    if (position === Position.BOTTOM_LEFT) {
      return tile?.move(Position.LEFT);
    }
    if (position === Position.LEFT) {
      return tile?.move(Position.TOP_LEFT);
    }
    if (position === Position.BOTTOM_RIGHT) {
      return tile?.move(Position.RIGHT);
    }
    if (position === Position.RIGHT) {
      return tile?.move(Position.TOP_RIGHT);
    }
    if (position === Position.TOP) {
      return tile?.move(Position.MAXIMIZED);
    }
    return tile?.move(Position.TOP);
  }

  moveDown() {
    const tile = this.getCurrentTile();
    const position = tile?.getPosition();
    if (position === Position.TOP_LEFT) {
      return tile?.move(Position.LEFT);
    }
    if (position === Position.LEFT) {
      return tile?.move(Position.BOTTOM_LEFT);
    }
    if (position === Position.TOP_RIGHT) {
      return tile?.move(Position.RIGHT);
    }
    if (position === Position.RIGHT) {
      return tile?.move(Position.BOTTOM_RIGHT);
    }
    if (position === Position.MAXIMIZED) {
      return tile?.move(Position.TOP);
    }
    return tile?.move(Position.BOTTOM);
  }

  destroy() {
    global.display.disconnect(this.windowCreatedSignal);
    for (const tile of this.tiles.values()) {
      tile.destroy();
    }
    this.tiles.clear();
  }
};
