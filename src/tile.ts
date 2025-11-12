import * as Main from '@girs/gnome-shell/ui/main';
import Meta from 'gi://Meta';
import Mtk from 'gi://Mtk';
import GLib from 'gi://GLib';

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
  private screen: Mtk.Rectangle;

  constructor() {
    this.window = global.display.get_focus_window();
    const monitorIndex = this.window.get_monitor();
    this.screen = Main.layoutManager.getWorkAreaForMonitor(monitorIndex);
  }

  get position(): Position | null {
    const bounds = this.window.get_frame_rect();
    const top = bounds.y <= this.screen.y;
    const bottom = (bounds.y + bounds.height) >= (this.screen.y + this.screen.height);
    const left = bounds.x <= this.screen.x;
    const right = (bounds.x + bounds.width) >= (this.screen.x + this.screen.width);
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

  private doMove(position: Position) {
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
  }

  move(position: Position) {
    if (this.window.get_maximize_flags() > 0) {
      this.window.unmaximize();
      return GLib.timeout_add(GLib.PRIORITY_DEFAULT, 20, () => {
        this.doMove(position);
        return this.position !== position;
      });
    }
    return this.doMove(position);
  }
};
