import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import Gio from 'gi://Gio';
import Meta from 'gi://Meta';
import Shell from 'gi://Shell';

export default class Keybindings {
  private bindings: Set<string> = new Set();
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
        Shell.ActionMode.NORMAL,
        handler
      );
      this.bindings.add(key);
    }
    catch (error) {
      console.error(`Failed to add keybinding for ${key}: ${error}`);
    }
  }

  destroy() {
    for (const key of this.bindings) {
      try {
        Main.wm.removeKeybinding(key);
      }
      catch (error) {
        console.error(`Failed to remove keybinding for ${key}: ${error}`);
      }
    }
  }
}
