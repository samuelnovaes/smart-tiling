import * as Main from '@girs/gnome-shell/ui/main';
import Gio from '@girs/gio-2.0';
import Meta from '@girs/meta-17';
import Shell from '@girs/shell-17';

export enum Keys {
  MOVE_WINDOW_RIGHT = 'move-window-right',
  MOVE_WINDOW_LEFT = 'move-window-left',
  MOVE_WINDOW_TOP = 'move-window-top',
  MOVE_WINDOW_BOTTOM = 'move-window-bottom'
}

export class Keybindings {
  private bingings: Set<string> = new Set();
  private settings: Gio.Settings;

  constructor(settings: Gio.Settings) {
    this.settings = settings;
  }

  add(key: Keys, handler: () => void) {
    Main.wm.addKeybinding(
      key,
      this.settings,
      Meta.KeyBindingFlags.NONE,
      Shell.ActionMode.ALL,
      handler
    );
    this.bingings.add(key);
  }

  destroy() {
    for(const key of this.bingings) {
      Main.wm.removeKeybinding(key);
    }
  }
}
