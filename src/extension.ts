import '@girs/gnome-shell/extensions/global';
import Gio from '@girs/gio-2.0';
import { Extension } from '@girs/gnome-shell/extensions/extension';
import Keybindings from './keybinding';
import { Position, Tile } from './tile';

export default class SmartTilingExtension extends Extension {
  private keybindings?: Keybindings;
  private gnomeKeybindingsSettings?: Gio.Settings;
  private mutterKeybindingsSettings?: Gio.Settings;

  private moveWindowRight() {
    const tile = new Tile();
    if (tile.position === Position.TOP_LEFT) {
      return tile.move(Position.TOP);
    }
    if (tile.position === Position.TOP) {
      return tile.move(Position.TOP_RIGHT);
    }
    if (tile.position === Position.BOTTOM_LEFT) {
      return tile.move(Position.BOTTOM);
    }
    if (tile.position === Position.BOTTOM) {
      return tile.move(Position.BOTTOM_RIGHT);
    }
    if (tile.position === Position.LEFT) {
      return tile.move(Position.CENTER);
    }
    if (tile.position === Position.CENTER || tile.position === Position.MAXIMIZED) {
      return tile.move(Position.RIGHT);
    }
  }

  private moveWindowLeft() {
    const tile = new Tile();
    if (tile.position === Position.TOP_RIGHT) {
      return tile.move(Position.TOP);
    }
    if (tile.position === Position.TOP) {
      return tile.move(Position.TOP_LEFT);
    }
    if (tile.position === Position.BOTTOM_RIGHT) {
      return tile.move(Position.BOTTOM);
    }
    if (tile.position === Position.BOTTOM) {
      return tile.move(Position.BOTTOM_LEFT);
    }
    if (tile.position === Position.RIGHT) {
      return tile.move(Position.CENTER);
    }
    if (tile.position === Position.CENTER || tile.position === Position.MAXIMIZED) {
      return tile.move(Position.LEFT);
    }
  }

  private moveWindowUp() {
    const tile = new Tile();
    if (tile.position === Position.BOTTOM_LEFT) {
      return tile.move(Position.LEFT);
    }
    if (tile.position === Position.LEFT) {
      return tile.move(Position.TOP_LEFT);
    }
    if (tile.position === Position.BOTTOM_RIGHT) {
      return tile.move(Position.RIGHT);
    }
    if (tile.position === Position.RIGHT) {
      return tile.move(Position.TOP_RIGHT);
    }
    if (tile.position === Position.TOP) {
      return tile.move(Position.MAXIMIZED);
    }
    if (tile.position === Position.BOTTOM) {
      return tile.move(Position.CENTER);
    }
    if (tile.position === Position.CENTER || tile.position === Position.MAXIMIZED) {
      return tile.move(Position.TOP);
    }
  }

  private moveWindowDown() {
    const tile = new Tile();
    if (tile.position === Position.TOP_LEFT) {
      return tile.move(Position.LEFT);
    }
    if (tile.position === Position.LEFT) {
      return tile.move(Position.BOTTOM_LEFT);
    }
    if (tile.position === Position.TOP_RIGHT) {
      return tile.move(Position.RIGHT);
    }
    if (tile.position === Position.RIGHT) {
      return tile.move(Position.BOTTOM_RIGHT);
    }
    if (tile.position === Position.MAXIMIZED) {
      return tile.move(Position.TOP);
    }
    if (tile.position === Position.TOP) {
      return tile.move(Position.CENTER);
    }
    if (tile.position === Position.CENTER) {
      return tile.move(Position.BOTTOM);
    }
  }

  override enable() {
    this.gnomeKeybindingsSettings = this.getSettings('org.gnome.desktop.wm.keybindings');
    this.mutterKeybindingsSettings = this.getSettings('org.gnome.mutter.keybindings');

    this.gnomeKeybindingsSettings.set_strv('maximize', []);
    this.gnomeKeybindingsSettings.set_strv('unmaximize', []);
    this.mutterKeybindingsSettings.set_strv('toggle-tiled-left', []);
    this.mutterKeybindingsSettings.set_strv('toggle-tiled-right', []);

    this.keybindings = new Keybindings(this.getSettings());

    this.keybindings.add('move-window-right', this.moveWindowRight);
    this.keybindings.add('move-window-left', this.moveWindowLeft);
    this.keybindings.add('move-window-up', this.moveWindowUp);
    this.keybindings.add('move-window-down', this.moveWindowDown);
  }

  override disable() {
    this.keybindings?.destroy();
    this.gnomeKeybindingsSettings?.reset('maximize');
    this.gnomeKeybindingsSettings?.reset('unmaximize');
    this.mutterKeybindingsSettings?.reset('toggle-tiled-left');
    this.mutterKeybindingsSettings?.reset('toggle-tiled-right');
  }
}
