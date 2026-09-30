import { beforeEach, describe, expect, it } from 'vitest';
import Meta from 'gi://Meta';
import TileManager from '../src/tileManager.js';
import Settings from './mocks/settings.js';
import Window, { type Workspace } from './mocks/window.js';
import { place, positionOf, stubShellGlobals } from './mocks/global.js';

describe('TileManager', () => {
  let display: ReturnType<typeof stubShellGlobals>['display'];
  let workspace: Workspace;
  let settings: Settings;
  let manager: TileManager;

  const start = (autoTiling = true) => {
    settings = new Settings({ 'auto-tiling': autoTiling, 'gap-size': 0 });
    manager = new TileManager(settings as never);
  };

  const existing = (position: Position, monitor = 0) => {
    const window = new Window(workspace);
    window.monitor = monitor;
    display.windows.push(place(window, position));
    return window;
  };

  const open = (window = new Window(workspace)) => {
    display.emit('window-created', window);
    window.emit('shown');
    return window;
  };

  const positions = (...windows: Window[]) => windows.map(positionOf);

  beforeEach(() => {
    ({ display, workspace } = stubShellGlobals());
  });

  describe('keyboard moves', () => {
    const focus = (position: Position) => {
      display.focus = existing(position);
      start(false);
      return display.focus;
    };

    it.each([
      [Position.TOP_LEFT, Position.TOP],
      [Position.TOP, Position.TOP_RIGHT],
      [Position.BOTTOM_LEFT, Position.BOTTOM],
      [Position.BOTTOM, Position.BOTTOM_RIGHT],
      [Position.CENTER, Position.RIGHT]
    ])('moves right from %s to %s', (from, to) => {
      const window = focus(from);
      manager.moveRight();
      expect(positionOf(window)).toBe(to);
    });

    it.each([
      [Position.TOP_RIGHT, Position.TOP],
      [Position.TOP, Position.TOP_LEFT],
      [Position.BOTTOM_RIGHT, Position.BOTTOM],
      [Position.BOTTOM, Position.BOTTOM_LEFT],
      [Position.CENTER, Position.LEFT]
    ])('moves left from %s to %s', (from, to) => {
      const window = focus(from);
      manager.moveLeft();
      expect(positionOf(window)).toBe(to);
    });

    it.each([
      [Position.BOTTOM_LEFT, Position.LEFT],
      [Position.LEFT, Position.TOP_LEFT],
      [Position.BOTTOM_RIGHT, Position.RIGHT],
      [Position.RIGHT, Position.TOP_RIGHT],
      [Position.TOP, Position.MAXIMIZED],
      [Position.CENTER, Position.TOP]
    ])('moves up from %s to %s', (from, to) => {
      const window = focus(from);
      manager.moveUp();
      expect(positionOf(window)).toBe(to);
    });

    it.each([
      [Position.TOP_LEFT, Position.LEFT],
      [Position.LEFT, Position.BOTTOM_LEFT],
      [Position.TOP_RIGHT, Position.RIGHT],
      [Position.RIGHT, Position.BOTTOM_RIGHT],
      [Position.MAXIMIZED, Position.TOP],
      [Position.CENTER, Position.BOTTOM]
    ])('moves down from %s to %s', (from, to) => {
      const window = focus(from);
      manager.moveDown();
      expect(positionOf(window)).toBe(to);
    });

    it('does nothing without a focused window', () => {
      start(false);
      expect(manager.moveRight()).toBeUndefined();
      expect(manager.moveLeft()).toBeUndefined();
      expect(manager.moveUp()).toBeUndefined();
      expect(manager.moveDown()).toBeUndefined();
    });

    it('tiles focused windows unknown to the manager', () => {
      start(false);
      display.focus = place(new Window(workspace), Position.CENTER);
      manager.moveLeft();
      expect(positionOf(display.focus)).toBe(Position.LEFT);
    });
  });

  describe('auto tiling', () => {
    it('maximizes the first window', () => {
      start();
      expect(positions(open())).toEqual([Position.MAXIMIZED]);
    });

    it('only tiles new windows the first time they are shown', () => {
      const old = existing(Position.CENTER);
      start();
      old.emit('shown');
      expect(positionOf(old)).toBe(Position.CENTER);

      const window = open();
      place(window, Position.CENTER);
      window.emit('shown');
      expect(positionOf(window)).toBe(Position.CENTER);
    });

    it('splits the screen as windows are opened', () => {
      start();
      const first = open();
      const second = open();
      expect(positions(first, second)).toEqual([Position.LEFT, Position.RIGHT]);
      const third = open();
      expect(positions(first, second, third)).toEqual([Position.LEFT, Position.TOP_RIGHT, Position.BOTTOM_RIGHT]);
      const fourth = open();
      expect(positions(first, second, third, fourth))
        .toEqual([Position.TOP_LEFT, Position.TOP_RIGHT, Position.BOTTOM_RIGHT, Position.BOTTOM_LEFT]);
      const fifth = open();
      expect(positionOf(fifth)).toBe(Position.CENTER);
    });

    it.each([
      [Position.TOP, [Position.BOTTOM_LEFT, Position.BOTTOM_RIGHT], Position.TOP_LEFT, Position.TOP_RIGHT],
      [Position.BOTTOM, [Position.TOP], Position.BOTTOM_LEFT, Position.BOTTOM_RIGHT]
    ])('splits the %s half', (half, others, kept, added) => {
      const window = existing(half);
      others.forEach(position => existing(position));
      start();
      expect(positions(window, open())).toEqual([kept, added]);
    });

    it('arranges windows into a full layout when the screen is not covered', () => {
      const floating = existing(Position.CENTER);
      start();
      const window = open();
      expect(positions(floating, window).sort()).toEqual([Position.LEFT, Position.RIGHT]);
    });

    it('keeps windows already in place when arranging', () => {
      const left = existing(Position.LEFT);
      start();
      const window = open();
      expect(positions(left, window)).toEqual([Position.LEFT, Position.RIGHT]);
    });

    it('ignores neighbors that are minimized, on other monitors or not tileable', () => {
      existing(Position.CENTER).minimized = true;
      existing(Position.CENTER, 1);
      existing(Position.CENTER).type = Meta.WindowType.DIALOG;
      start();
      expect(positions(open())).toEqual([Position.MAXIMIZED]);
    });

    it.each<[string, (window: Window) => void]>([
      ['auto tiling is disabled', () => settings.set_boolean('auto-tiling', false)],
      ['it is not a normal window', window => window.type = Meta.WindowType.DIALOG],
      ['it is fullscreen', window => window.fullscreen = true],
      ['it skips the taskbar', window => window.skipTaskbar = true],
      ['it is on all workspaces', window => window.onAllWorkspaces = true],
      ['it is transient', window => window.transientFor = new Window()],
      ['it has no workspace', window => window.workspace = null],
      ['it is not resizeable', window => window.resizeable = false]
    ])('does not tile a window when %s', (_reason, configure) => {
      start();
      const window = new Window(workspace);
      configure(window);
      open(window);
      expect(positionOf(window)).toBe(Position.CENTER);
    });

    it('merges the neighbors of a minimized window', () => {
      start();
      const left = open();
      const topRight = open();
      const bottomRight = open();
      left.minimized = true;
      left.emit('notify::minimized');
      expect(positions(topRight, bottomRight)).toEqual([Position.LEFT, Position.RIGHT]);

      topRight.minimized = true;
      topRight.emit('notify::minimized');
      expect(positionOf(bottomRight)).toBe(Position.MAXIMIZED);

      topRight.minimized = false;
      topRight.emit('notify::minimized');
      expect(positions(bottomRight, topRight)).toEqual([Position.LEFT, Position.RIGHT]);
    });

    it('rearranges the neighbors when a merge does not cover the screen', () => {
      const topLeft = existing(Position.TOP_LEFT);
      const bottomLeft = existing(Position.BOTTOM_LEFT);
      start();
      topLeft.minimized = true;
      topLeft.emit('notify::minimized');
      expect(positionOf(bottomLeft)).toBe(Position.MAXIMIZED);
    });

    it('rearranges the neighbors when no merge applies', () => {
      const floating = existing(Position.CENTER);
      const left = existing(Position.LEFT);
      start();
      floating.minimized = true;
      floating.emit('notify::minimized');
      expect(positionOf(left)).toBe(Position.MAXIMIZED);
    });

    it('leaves the neighbors alone when they already cover the screen', () => {
      const floating = existing(Position.CENTER);
      const left = existing(Position.LEFT);
      const right = existing(Position.RIGHT);
      start();
      floating.emit('unmanaging');
      expect(positions(left, right)).toEqual([Position.LEFT, Position.RIGHT]);
    });

    it('does not rearrange when a window that is not tileable is closed', () => {
      const dialog = existing(Position.CENTER);
      const left = existing(Position.LEFT);
      dialog.type = Meta.WindowType.DIALOG;
      start();
      dialog.emit('unmanaging');
      expect(positionOf(left)).toBe(Position.LEFT);
    });

    it('fills the gap left by closed windows', () => {
      start();
      const left = open();
      const right = open();
      right.emit('unmanaging');
      expect(positionOf(left)).toBe(Position.MAXIMIZED);
      left.emit('unmanaging');
      expect(positionOf(left)).toBe(Position.MAXIMIZED);
    });

    it('ignores closed windows that were minimized', () => {
      start();
      const left = open();
      const right = open();
      right.minimized = true;
      right.emit('notify::minimized');
      place(left, Position.LEFT);
      right.emit('unmanaging');
      expect(positionOf(left)).toBe(Position.LEFT);
    });

    it('forgets windows once they are unmanaged', () => {
      start();
      const window = new Window(workspace);
      display.emit('window-created', window);
      window.emit('unmanaged');
      expect(window.handlerCount()).toBe(0);
      window.emit('shown');
      expect(positionOf(window)).toBe(Position.CENTER);
    });

    it('arranges every monitor when auto tiling is enabled', () => {
      const first = existing(Position.CENTER);
      const second = existing(Position.CENTER);
      const other = existing(Position.CENTER, 1);
      const minimized = existing(Position.CENTER);
      const dialog = existing(Position.CENTER);
      minimized.minimized = true;
      dialog.type = Meta.WindowType.DIALOG;
      start(false);

      settings.set_boolean('auto-tiling', true);
      expect(positions(first, second).sort()).toEqual([Position.LEFT, Position.RIGHT]);
      expect(positions(other, minimized, dialog)).toEqual([Position.MAXIMIZED, Position.CENTER, Position.CENTER]);
    });

    it('uses the four-window layout for crowded monitors', () => {
      const windows = [0, 1, 2, 3, 4].map(() => existing(Position.CENTER));
      start(false);
      settings.set_boolean('auto-tiling', true);
      expect(positions(...windows).filter(position => position === Position.CENTER)).toHaveLength(1);
    });

    it('does nothing when auto tiling is disabled', () => {
      const window = existing(Position.CENTER);
      start();
      settings.set_boolean('auto-tiling', false);
      expect(positionOf(window)).toBe(Position.CENTER);
    });
  });

  it('disconnects every signal on destroy', () => {
    const window = existing(Position.CENTER);
    start();
    manager.destroy();
    expect(display.handlerCount()).toBe(0);
    expect(settings.handlerCount()).toBe(0);
    expect(window.handlerCount()).toBe(0);
  });
});
