import Meta from 'gi://Meta';
import Mtk from 'gi://Mtk';
import Signals from './signals.js';

export interface Workspace {
  windows: Window[]
  list_windows(): Window[]
}

export function createWorkspace(): Workspace {
  return {
    windows: [],
    list_windows() {
      return [...this.windows];
    }
  };
}

let nextId = 1;

export default class Window extends Signals {
  id = nextId++;

  rect = new Mtk.Rectangle({ x: 100, y: 100, width: 300, height: 200 });

  monitor = 0;

  minimized = false;

  resizeable = true;

  maximizeFlags = 0;

  type = Meta.WindowType.NORMAL;

  fullscreen = false;

  skipTaskbar = false;

  onAllWorkspaces = false;

  transientFor: Window | null = null;

  workspace: Workspace | null;

  constructor(workspace: Workspace | null = null) {
    super();
    this.workspace = workspace;
    workspace?.windows.push(this);
  }

  get_id() {
    return this.id;
  }

  get_frame_rect() {
    return this.rect;
  }

  move_resize_frame(_userOp: boolean, x: number, y: number, width: number, height: number) {
    this.rect = new Mtk.Rectangle({ x, y, width, height });
  }

  get_maximize_flags() {
    return this.maximizeFlags;
  }

  unmaximize() {
    this.maximizeFlags = 0;
  }

  get_monitor() {
    return this.monitor;
  }

  get_window_type() {
    return this.type;
  }

  is_fullscreen() {
    return this.fullscreen;
  }

  is_skip_taskbar() {
    return this.skipTaskbar;
  }

  is_on_all_workspaces() {
    return this.onAllWorkspaces;
  }

  get_transient_for() {
    return this.transientFor;
  }

  get_workspace() {
    return this.workspace;
  }
}
