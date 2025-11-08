import * as Main from '@girs/gnome-shell/ui/main';
import Gio from '@girs/gio-2.0';
import Meta from '@girs/meta-17';
import Shell from '@girs/shell-17';

export default class Keybindings {
  private bingings: Set<string> = new Set();
  private settings: Gio.Settings;

  constructor(settings: Gio.Settings) {
    this.settings = settings;
  }

  add(key: string, handler: () => void) {
    try {
      Main.wm.addKeybinding(
        key,
        this.settings,
        Meta.KeyBindingFlags.IGNORE_AUTOREPEAT,
        Shell.ActionMode.NORMAL | Shell.ActionMode.OVERVIEW,
        handler
      );
      this.bingings.add(key);
    } catch (error) {
      console.error(`Failed to add keybinding for ${key}: ${error}`);
    }
  }

  destroy() {
    for (const key of this.bingings) {
      try {
        Main.wm.removeKeybinding(key);
      } catch (error) {
        console.error(`Failed to remove keybinding for ${key}: ${error}`);
      }
    }
  }
}
