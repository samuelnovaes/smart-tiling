import { beforeEach, describe, expect, it, vi } from 'vitest';
import GLib from 'gi://GLib';
import Tile from '../src/tile.js';
import Window from './mocks/window.js';
import { place, positionOf, stubShellGlobals } from './mocks/global.js';

describe('Tile', () => {
  let window: Window;
  let tile: Tile;

  beforeEach(() => {
    stubShellGlobals();
    window = new Window();
    tile = new Tile(window as never);
    tile.reloadScreen(0);
  });

  it.each([
    Position.TOP,
    Position.BOTTOM,
    Position.LEFT,
    Position.RIGHT,
    Position.TOP_LEFT,
    Position.TOP_RIGHT,
    Position.BOTTOM_LEFT,
    Position.BOTTOM_RIGHT,
    Position.MAXIMIZED,
    Position.CENTER
  ])('detects the %s position', (position) => {
    place(window, position);
    expect(tile.getPosition()).toBe(position);
  });

  it.each([
    Position.TOP,
    Position.BOTTOM,
    Position.LEFT,
    Position.RIGHT,
    Position.TOP_LEFT,
    Position.TOP_RIGHT,
    Position.BOTTOM_LEFT,
    Position.BOTTOM_RIGHT,
    Position.MAXIMIZED
  ])('moves the window to the %s position', (position) => {
    tile.move(position);
    expect(positionOf(window)).toBe(position);
  });

  it('keeps the window in place when moved to the center', () => {
    tile.move(Position.CENTER);
    expect(positionOf(window)).toBe(Position.CENTER);
  });

  it('reserves the gap around the screen and between windows', () => {
    window.monitor = 1;
    tile.reloadScreen(10);
    tile.move(Position.TOP_LEFT);
    expect(window.rect).toMatchObject({ x: 1010, y: 10, width: 485, height: 385 });
    tile.move(Position.BOTTOM_RIGHT);
    expect(window.rect).toMatchObject({ x: 1505, y: 405, width: 485, height: 385 });
    expect(tile.getPosition()).toBe(Position.BOTTOM_RIGHT);
  });

  it('unmaximizes the window and retries the move until it is applied', () => {
    vi.mocked(GLib.timeout_add).mockReturnValue(42);
    window.maximizeFlags = 3;
    tile.move(Position.LEFT);
    expect(window.maximizeFlags).toBe(0);
    expect(GLib.timeout_add).toHaveBeenCalledWith(GLib.PRIORITY_DEFAULT, 20, expect.any(Function));

    const callback = vi.mocked(GLib.timeout_add).mock.calls[0][2];
    const moveResize = vi.spyOn(window, 'move_resize_frame').mockImplementationOnce(() => {});
    expect(callback(null)).toBe(GLib.SOURCE_CONTINUE);
    expect(callback(null)).toBe(GLib.SOURCE_REMOVE);
    expect(moveResize).toHaveBeenCalledTimes(2);
    expect(positionOf(window)).toBe(Position.LEFT);

    tile.destroy();
    expect(GLib.source_remove).not.toHaveBeenCalled();
  });

  it('removes pending timeouts and signals on destroy', () => {
    vi.mocked(GLib.timeout_add).mockReturnValue(7);
    window.maximizeFlags = 1;
    tile.move(Position.RIGHT);
    const callback = vi.fn();
    expect(tile.connect('shown', callback)).toBeGreaterThan(0);
    window.emit('shown');
    expect(callback).toHaveBeenCalledWith(window);

    tile.destroy();
    expect(GLib.source_remove).toHaveBeenCalledWith(7);
    expect(window.handlerCount()).toBe(0);

    tile.destroy();
    expect(GLib.source_remove).toHaveBeenCalledTimes(1);
  });
});
