import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import Gio from 'gi://Gio';
import Keybindings from './keybindings.js';
import Tile from './tile.js';
import GLib from 'gi://GLib';

export default class SmartTilingExtension extends Extension {
  private keybindings: Keybindings | null = null;
  private gnomeKeybindingsSettings: Gio.Settings | null = null;
  private mutterKeybindingsSettings: Gio.Settings | null = null;
  private timeouts: Set<number> = new Set();

  private moveWindowRight() {
    const tile = new Tile();
    if (tile.position === Position.TOP_LEFT) {
      return tile.move(Position.TOP, this.timeouts);
    }
    if (tile.position === Position.TOP) {
      return tile.move(Position.TOP_RIGHT, this.timeouts);
    }
    if (tile.position === Position.BOTTOM_LEFT) {
      return tile.move(Position.BOTTOM, this.timeouts);
    }
    if (tile.position === Position.BOTTOM) {
      return tile.move(Position.BOTTOM_RIGHT, this.timeouts);
    }
    return tile.move(Position.RIGHT, this.timeouts);
  }

  private moveWindowLeft() {
    const tile = new Tile();
    if (tile.position === Position.TOP_RIGHT) {
      return tile.move(Position.TOP, this.timeouts);
    }
    if (tile.position === Position.TOP) {
      return tile.move(Position.TOP_LEFT, this.timeouts);
    }
    if (tile.position === Position.BOTTOM_RIGHT) {
      return tile.move(Position.BOTTOM, this.timeouts);
    }
    if (tile.position === Position.BOTTOM) {
      return tile.move(Position.BOTTOM_LEFT, this.timeouts);
    }
    return tile.move(Position.LEFT, this.timeouts);
  }

  private moveWindowUp() {
    const tile = new Tile();
    if (tile.position === Position.BOTTOM_LEFT) {
      return tile.move(Position.LEFT, this.timeouts);
    }
    if (tile.position === Position.LEFT) {
      return tile.move(Position.TOP_LEFT, this.timeouts);
    }
    if (tile.position === Position.BOTTOM_RIGHT) {
      return tile.move(Position.RIGHT, this.timeouts);
    }
    if (tile.position === Position.RIGHT) {
      return tile.move(Position.TOP_RIGHT, this.timeouts);
    }
    if (tile.position === Position.TOP) {
      return tile.move(Position.MAXIMIZED, this.timeouts);
    }
    return tile.move(Position.TOP, this.timeouts);
  }

  private moveWindowDown() {
    const tile = new Tile();
    if (tile.position === Position.TOP_LEFT) {
      return tile.move(Position.LEFT, this.timeouts);
    }
    if (tile.position === Position.LEFT) {
      return tile.move(Position.BOTTOM_LEFT, this.timeouts);
    }
    if (tile.position === Position.TOP_RIGHT) {
      return tile.move(Position.RIGHT, this.timeouts);
    }
    if (tile.position === Position.RIGHT) {
      return tile.move(Position.BOTTOM_RIGHT, this.timeouts);
    }
    if (tile.position === Position.MAXIMIZED) {
      return tile.move(Position.TOP, this.timeouts);
    }
    return tile.move(Position.BOTTOM, this.timeouts);
  }

  override enable() {
    this.gnomeKeybindingsSettings = this.getSettings('org.gnome.desktop.wm.keybindings');
    this.mutterKeybindingsSettings = this.getSettings('org.gnome.mutter.keybindings');

    this.gnomeKeybindingsSettings.set_strv('maximize', []);
    this.gnomeKeybindingsSettings.set_strv('unmaximize', []);
    this.mutterKeybindingsSettings.set_strv('toggle-tiled-left', []);
    this.mutterKeybindingsSettings.set_strv('toggle-tiled-right', []);

    this.keybindings = new Keybindings(this.getSettings());

    this.keybindings.add('move-window-right', this.moveWindowRight.bind(this));
    this.keybindings.add('move-window-left', this.moveWindowLeft.bind(this));
    this.keybindings.add('move-window-up', this.moveWindowUp.bind(this));
    this.keybindings.add('move-window-down', this.moveWindowDown.bind(this));
  }

  override disable() {
    this.keybindings?.destroy();
    this.gnomeKeybindingsSettings?.reset('maximize');
    this.gnomeKeybindingsSettings?.reset('unmaximize');
    this.mutterKeybindingsSettings?.reset('toggle-tiled-left');
    this.mutterKeybindingsSettings?.reset('toggle-tiled-right');
    this.keybindings = null;
    this.gnomeKeybindingsSettings = null;
    this.mutterKeybindingsSettings = null;
    for (const timeoutId of this.timeouts) {
      GLib.source_remove(timeoutId);
    }
    this.timeouts.clear();
  }
}
