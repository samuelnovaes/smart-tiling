import { vi } from 'vitest';
import Mtk from 'gi://Mtk';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import Signals from './signals.js';
import Window, { createWorkspace } from './window.js';

export const SCREEN = { width: 1000, height: 800 };

const RECTS = new Map<Position, [number, number, number, number]>([
  [Position.TOP, [0, 0, 1000, 400]],
  [Position.BOTTOM, [0, 400, 1000, 400]],
  [Position.LEFT, [0, 0, 500, 800]],
  [Position.RIGHT, [500, 0, 500, 800]],
  [Position.TOP_LEFT, [0, 0, 500, 400]],
  [Position.TOP_RIGHT, [500, 0, 500, 400]],
  [Position.BOTTOM_LEFT, [0, 400, 500, 400]],
  [Position.BOTTOM_RIGHT, [500, 400, 500, 400]],
  [Position.MAXIMIZED, [0, 0, 1000, 800]],
  [Position.CENTER, [100, 100, 300, 200]]
]);

class Display extends Signals {
  windows: Window[] = [];

  focus: Window | null = null;

  nMonitors = 2;

  list_all_windows() {
    return [...this.windows];
  }

  get_focus_window() {
    return this.focus;
  }

  get_n_monitors() {
    return this.nMonitors;
  }

  sort_windows_by_stacking(windows: Window[]) {
    return [...windows];
  }
}

export function stubShellGlobals() {
  const display = new Display();
  const workspace = createWorkspace();
  vi.stubGlobal('display', display);
  vi.stubGlobal('workspace_manager', { get_active_workspace: () => workspace });
  vi.mocked(Main.layoutManager.getWorkAreaForMonitor).mockImplementation(monitor => new Mtk.Rectangle({
    x: monitor * SCREEN.width,
    y: 0,
    ...SCREEN
  }));
  return { display, workspace };
}

export function place(window: Window, position: Position) {
  const [x, y, width, height] = RECTS.get(position)!;
  window.rect = new Mtk.Rectangle({ x: x + window.monitor * SCREEN.width, y, width, height });
  return window;
}

export function positionOf(window: Window) {
  const { x, y, width, height } = window.rect;
  for (const [position, rect] of RECTS) {
    if (rect.join() === [x - window.monitor * SCREEN.width, y, width, height].join()) {
      return position;
    }
  }
  return null;
}
