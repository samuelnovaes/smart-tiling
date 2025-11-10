import * as Main from '@girs/gnome-shell/ui/main';
import Meta from '@girs/meta-17';
import Mtk from '@girs/mtk-17';

const cache: Map<number, Mtk.Rectangle> = new Map();

export enum Position {
  TOP = 'top',
  BOTTOM = 'bottom',
  LEFT = 'left',
  RIGHT = 'right',
  TOP_LEFT = 'top-left',
  TOP_RIGHT = 'top-right',
  BOTTOM_LEFT = 'bottom-left',
  BOTTOM_RIGHT = 'bottom-right',
  MAXIMIZED = 'maximized',
  CENTER = 'center'
}

export class Tile {
  private window: Meta.Window;
  private bounds: Mtk.Rectangle;
  private screen: Mtk.Rectangle;
  private id: number;

  constructor() {
    this.window = global.display.get_focus_window();
    this.bounds = this.window.get_frame_rect();
    const monitorIndex = this.window.get_monitor();
    this.screen = Main.layoutManager.getWorkAreaForMonitor(monitorIndex);
    this.window.unmaximize();
    this.id = this.window.get_id();
    if (!cache.has(this.id)) {
      cache.set(this.window.get_id(), this.bounds);
      this.window.connect('unmanaged', () => { cache.delete(this.id); });
      this.window.connect('position-changed', this.onChange.bind(this));
      this.window.connect('size-changed', this.onChange.bind(this));
    }
  }

  private onChange(window: Meta.Window) {
    this.bounds = window.get_frame_rect();
    if (this.position === Position.CENTER) {
      cache.set(this.id, this.bounds);
    }
  }

  get position(): Position | null {
    const top = this.bounds.y <= this.screen.y;
    const bottom = (this.bounds.y + this.bounds.height) >= (this.screen.y + this.screen.height);
    const left = this.bounds.x <= this.screen.x;
    const right = (this.bounds.x + this.bounds.width) >= (this.screen.x + this.screen.width);
    if (top && !bottom && left && right) {
      return Position.TOP;
    }
    if (!top && bottom && left && right) {
      return Position.BOTTOM;
    }
    if (top && bottom && left && !right) {
      return Position.LEFT;
    }
    if (top && bottom && !left && right) {
      return Position.RIGHT;
    }
    if (top && !bottom && left && !right) {
      return Position.TOP_LEFT;
    }
    if (top && !bottom && !left && right) {
      return Position.TOP_RIGHT;
    }
    if (!top && bottom && left && !right) {
      return Position.BOTTOM_LEFT;
    }
    if (!top && bottom && !left && right) {
      return Position.BOTTOM_RIGHT;
    }
    if (top && bottom && left && right) {
      return Position.MAXIMIZED;
    }
    return Position.CENTER;
  }

  move(position: Position) {
    if (position === Position.MAXIMIZED) {
      return this.window.move_resize_frame(
        true,
        this.screen.x,
        this.screen.y,
        this.screen.width,
        this.screen.height
      );
    }

    if (position === Position.TOP) {
      return this.window.move_resize_frame(
        true,
        this.screen.x,
        this.screen.y,
        this.screen.width,
        this.screen.height / 2
      );
    }

    if (position === Position.BOTTOM) {
      return this.window.move_resize_frame(
        true,
        this.screen.x,
        this.screen.y + (this.screen.height / 2),
        this.screen.width,
        this.screen.height / 2
      );
    }

    if (position === Position.LEFT) {
      return this.window.move_resize_frame(
        true,
        this.screen.x,
        this.screen.y,
        this.screen.width / 2,
        this.screen.height
      );
    }

    if (position === Position.RIGHT) {
      return this.window.move_resize_frame(
        true,
        this.screen.x + (this.screen.width / 2),
        this.screen.y,
        this.screen.width / 2,
        this.screen.height
      );
    }

    if (position === Position.TOP_LEFT) {
      return this.window.move_resize_frame(
        true,
        this.screen.x,
        this.screen.y,
        this.screen.width / 2,
        this.screen.height / 2
      );
    }

    if (position === Position.TOP_RIGHT) {
      return this.window.move_resize_frame(
        true,
        this.screen.x + (this.screen.width / 2),
        this.screen.y,
        this.screen.width / 2,
        this.screen.height / 2
      );
    }

    if (position === Position.BOTTOM_LEFT) {
      return this.window.move_resize_frame(
        true,
        this.screen.x,
        this.screen.y + (this.screen.height / 2),
        this.screen.width / 2,
        this.screen.height / 2
      );
    }

    if (position === Position.BOTTOM_RIGHT) {
      return this.window.move_resize_frame(
        true,
        this.screen.x + this.screen.width / 2,
        this.screen.y + this.screen.height / 2,
        this.screen.width / 2,
        this.screen.height / 2
      );
    }

    if (position === Position.CENTER) {
      const cachedBounds = cache.get(this.id);
      if (cachedBounds) {
        return this.window.move_resize_frame(
          true,
          cachedBounds.x,
          cachedBounds.y,
          cachedBounds.width,
          cachedBounds.height
        );
      }
    }
  }
};
