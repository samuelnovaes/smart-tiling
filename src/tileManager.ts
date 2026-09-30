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
    [[Position.TOP_RIGHT, Position.LEFT], [Position.BOTTOM_RIGHT, Position.RIGHT]]
  ]],
  [Position.RIGHT, [
    [[Position.LEFT, Position.MAXIMIZED]],
    [[Position.TOP_LEFT, Position.LEFT], [Position.BOTTOM_LEFT, Position.RIGHT]]
  ]],
  [Position.TOP, [
    [[Position.BOTTOM, Position.MAXIMIZED]],
    [[Position.BOTTOM_LEFT, Position.LEFT], [Position.BOTTOM_RIGHT, Position.RIGHT]]
  ]],
  [Position.BOTTOM, [
    [[Position.TOP, Position.MAXIMIZED]],
    [[Position.TOP_LEFT, Position.LEFT], [Position.TOP_RIGHT, Position.RIGHT]]
  ]],
  [Position.TOP_LEFT, [[[Position.BOTTOM_LEFT, Position.LEFT]]]],
  [Position.TOP_RIGHT, [[[Position.BOTTOM_RIGHT, Position.RIGHT]]]],
  [Position.BOTTOM_LEFT, [[[Position.TOP_LEFT, Position.LEFT]]]],
  [Position.BOTTOM_RIGHT, [[[Position.TOP_RIGHT, Position.RIGHT]]]]
]);

const CELLS = new Map<Position, number>([
  [Position.TOP_LEFT, 0b0001],
  [Position.TOP_RIGHT, 0b0010],
  [Position.BOTTOM_LEFT, 0b0100],
  [Position.BOTTOM_RIGHT, 0b1000],
  [Position.TOP, 0b0011],
  [Position.BOTTOM, 0b1100],
  [Position.LEFT, 0b0101],
  [Position.RIGHT, 0b1010],
  [Position.MAXIMIZED, 0b1111]
]);

const LAYOUTS: Position[][] = [
  [Position.MAXIMIZED],
  [Position.LEFT, Position.RIGHT],
  [Position.LEFT, Position.TOP_RIGHT, Position.BOTTOM_RIGHT],
  [Position.TOP_LEFT, Position.TOP_RIGHT, Position.BOTTOM_RIGHT, Position.BOTTOM_LEFT]
];

export default class TileManager {
  private tiles: Map<number, Tile> = new Map();
  private newWindows: Set<number> = new Set();
  private settings: Gio.Settings;
  private windowCreatedId: number;
  private autoTilingChangedId: number;

  constructor(settings: Gio.Settings) {
    this.settings = settings;
    for (const window of global.display.list_all_windows()) {
      this.createTileForWindow(window);
    }
    this.windowCreatedId = global.display.connect('window-created', (_display, window: Meta.Window) => {
      this.newWindows.add(window.get_id());
      this.createTileForWindow(window);
    });
    this.autoTilingChangedId = this.settings.connect('changed::auto-tiling', () => {
      if (!this.settings.get_boolean('auto-tiling')) {
        return;
      }
      const windows = global.workspace_manager.get_active_workspace().list_windows()
        .filter(window => !window.minimized && this.isAutoTileable(window));
      for (let monitor = 0; monitor < global.display.get_n_monitors(); monitor++) {
        this.arrange(windows.filter(window => window.get_monitor() === monitor));
      }
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
    return window.get_workspace().list_windows().filter(other => other !== window
      && !other.minimized
      && other.get_monitor() === window.get_monitor()
      && this.isAutoTileable(other));
  }

  private getTilesByPosition(windows: Meta.Window[]) {
    const tiles = new Map<Position, Tile>();
    for (const window of windows) {
      const tile = this.getTile(window);
      tiles.set(tile.getPosition(), tile);
    }
    return tiles;
  }

  private covers(positions: Iterable<Position>) {
    let cells = 0;
    for (const position of positions) {
      cells |= CELLS.get(position) ?? 0;
    }
    return cells === CELLS.get(Position.MAXIMIZED);
  }

  private insert(window: Meta.Window) {
    if (!this.isAutoTileable(window)) {
      return;
    }
    const neighborWindows = this.getNeighbors(window);
    const neighbors = this.getTilesByPosition(neighborWindows);
    if (!this.covers(neighbors.keys())) {
      return this.arrange([window, ...neighborWindows]);
    }
    for (const [position, [kept, added]] of SPLITS) {
      const neighbor = neighbors.get(position);
      if (neighbor) {
        neighbor.move(kept);
        return this.getTile(window).move(added);
      }
    }
  }

  private remove(window: Meta.Window) {
    if (!this.isAutoTileable(window)) {
      return;
    }
    const neighborWindows = this.getNeighbors(window);
    const neighbors = this.getTilesByPosition(neighborWindows);
    if (this.covers(neighbors.keys())) {
      return;
    }
    const position = this.getTile(window).getPosition();
    const merge = MERGES.get(position)?.find(candidate => candidate.every(([from]) => neighbors.has(from)));
    if (!merge || !this.covers([position, ...neighbors.keys()])) {
      return this.arrange(neighborWindows);
    }
    for (const [from, to] of merge) {
      neighbors.get(from)?.move(to);
    }
  }

  private arrange(windows: Meta.Window[]) {
    if (windows.length === 0) {
      return;
    }
    const sortedWindows = global.display.sort_windows_by_stacking(windows).reverse();
    const freePositions = new Set(LAYOUTS[Math.min(sortedWindows.length, LAYOUTS.length) - 1]);
    const misplacedWindows = sortedWindows.filter(window => !freePositions.delete(this.getTile(window).getPosition()));
    [...freePositions].forEach((position, index) => this.getTile(misplacedWindows[index]).move(position));
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
    this.settings.disconnect(this.autoTilingChangedId);
    this.newWindows.clear();
    for (const tile of this.tiles.values()) {
      tile.destroy();
    }
    this.tiles.clear();
  }
}
