import Tile from './tile.js';
import Meta from 'gi://Meta';
import Gio from 'gi://Gio';

const SPLITS = new Map<Position, [Position, Position]>([
  [Position.MAXIMIZED, [Position.LEFT, Position.RIGHT]],
  [Position.RIGHT, [Position.TOP_RIGHT, Position.BOTTOM_RIGHT]],
  [Position.LEFT, [Position.TOP_LEFT, Position.BOTTOM_LEFT]],
  [Position.BOTTOM, [Position.BOTTOM_LEFT, Position.BOTTOM_RIGHT]],
  [Position.TOP, [Position.TOP_LEFT, Position.TOP_RIGHT]]
]);

const MERGES = new Map<Position, [Position, Position][][]>([
  [Position.LEFT, [
    [[Position.RIGHT, Position.MAXIMIZED]],
    [[Position.TOP_RIGHT, Position.TOP], [Position.BOTTOM_RIGHT, Position.BOTTOM]]
  ]],
  [Position.RIGHT, [
    [[Position.LEFT, Position.MAXIMIZED]],
    [[Position.TOP_LEFT, Position.TOP], [Position.BOTTOM_LEFT, Position.BOTTOM]]
  ]],
  [Position.TOP, [
    [[Position.BOTTOM, Position.MAXIMIZED]],
    [[Position.BOTTOM_LEFT, Position.LEFT], [Position.BOTTOM_RIGHT, Position.RIGHT]]
  ]],
  [Position.BOTTOM, [
    [[Position.TOP, Position.MAXIMIZED]],
    [[Position.TOP_LEFT, Position.LEFT], [Position.TOP_RIGHT, Position.RIGHT]]
  ]],
  [Position.TOP_LEFT, [[[Position.BOTTOM_LEFT, Position.LEFT]], [[Position.TOP_RIGHT, Position.TOP]]]],
  [Position.TOP_RIGHT, [[[Position.BOTTOM_RIGHT, Position.RIGHT]], [[Position.TOP_LEFT, Position.TOP]]]],
  [Position.BOTTOM_LEFT, [[[Position.TOP_LEFT, Position.LEFT]], [[Position.BOTTOM_RIGHT, Position.BOTTOM]]]],
  [Position.BOTTOM_RIGHT, [[[Position.TOP_RIGHT, Position.RIGHT]], [[Position.BOTTOM_LEFT, Position.BOTTOM]]]]
]);

export default class TileManager {
  private tiles: Map<number, Tile> = new Map();
  private newWindows: Set<number> = new Set();
  private settings: Gio.Settings;
  private windowCreatedId: number;

  constructor(settings: Gio.Settings) {
    this.settings = settings;
    for (const window of global.display.list_all_windows()) {
      this.createTileForWindow(window);
    }
    this.windowCreatedId = global.display.connect('window-created', (_display, window: Meta.Window) => {
      this.newWindows.add(window.get_id());
      this.createTileForWindow(window);
    });
  }

  private createTileForWindow(window: Meta.Window) {
    const tile = new Tile(window);
    const windowId = window.get_id();
    this.tiles.set(windowId, tile);
    tile.connect('shown', () => {
      if (this.newWindows.delete(windowId)) {
        this.insert(window);
      }
    });
    tile.connect('notify::minimized', () => {
      if (window.minimized) {
        this.remove(window);
      }
      else {
        this.insert(window);
      }
    });
    tile.connect('unmanaging', () => {
      if (!window.minimized) {
        this.remove(window);
      }
    });
    tile.connect('unmanaged', () => {
      tile.destroy();
      this.tiles.delete(windowId);
      this.newWindows.delete(windowId);
    });
    return tile;
  }

  private getTile(window: Meta.Window) {
    const tile = this.tiles.get(window.get_id()) ?? this.createTileForWindow(window);
    tile.reloadScreen(this.settings.get_int('gap-size'));
    return tile;
  }

  private getCurrentTile() {
    const window = global.display.get_focus_window();
    if (!window) {
      return null;
    }
    return this.getTile(window);
  }

  private isAutoTileable(window: Meta.Window) {
    return this.settings.get_boolean('auto-tiling')
      && window.get_window_type() === Meta.WindowType.NORMAL
      && !window.is_fullscreen()
      && !window.is_skip_taskbar()
      && !window.is_on_all_workspaces()
      && !window.get_transient_for()
      && window.get_workspace() !== null
      && window.resizeable;
  }

  private getNeighbors(window: Meta.Window) {
    const neighbors = new Map<Position, Tile>();
    for (const other of window.get_workspace().list_windows()) {
      if (other !== window && !other.minimized && other.get_monitor() === window.get_monitor() && this.isAutoTileable(other)) {
        const tile = this.getTile(other);
        neighbors.set(tile.getPosition(), tile);
      }
    }
    return neighbors;
  }

  private insert(window: Meta.Window) {
    if (!this.isAutoTileable(window)) {
      return;
    }
    const tile = this.getTile(window);
    const neighbors = this.getNeighbors(window);
    if (neighbors.size === 0) {
      return tile.move(Position.MAXIMIZED);
    }
    for (const [position, [kept, added]] of SPLITS) {
      const neighbor = neighbors.get(position);
      if (neighbor) {
        neighbor.move(kept);
        return tile.move(added);
      }
    }
  }

  private remove(window: Meta.Window) {
    if (!this.isAutoTileable(window)) {
      return;
    }
    const neighbors = this.getNeighbors(window);
    const merges = MERGES.get(this.getTile(window).getPosition()) ?? [];
    for (const merge of merges) {
      if (merge.every(([from]) => neighbors.has(from))) {
        for (const [from, to] of merge) {
          neighbors.get(from)?.move(to);
        }
        return;
      }
    }
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
    global.display.disconnect(this.windowCreatedId);
    this.newWindows.clear();
    for (const tile of this.tiles.values()) {
      tile.destroy();
    }
    this.tiles.clear();
  }
}
