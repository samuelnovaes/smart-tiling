import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import Gio from 'gi://Gio';
import Keybindings from './keybindings.js';
import Tile from './tile.js';

export default class SmartTilingExtension extends Extension {
  private keybindings: Keybindings | null = null;
  private settings: Gio.Settings | null = null;
  private gnomeKeybindingsSettings: Gio.Settings | null = null;
  private mutterKeybindingsSettings: Gio.Settings | null = null;
  private tile: Tile | null = null;

  private moveWindowRight() {
    if (this.tile?.position === Position.TOP_LEFT) {
      return this.tile?.move(Position.TOP);
    }
    if (this.tile?.position === Position.TOP) {
      return this.tile?.move(Position.TOP_RIGHT);
    }
    if (this.tile?.position === Position.BOTTOM_LEFT) {
      return this.tile?.move(Position.BOTTOM);
    }
    if (this.tile?.position === Position.BOTTOM) {
      return this.tile?.move(Position.BOTTOM_RIGHT);
    }
    return this.tile?.move(Position.RIGHT);
  }

  private moveWindowLeft() {
    if (this.tile?.position === Position.TOP_RIGHT) {
      return this.tile?.move(Position.TOP);
    }
    if (this.tile?.position === Position.TOP) {
      return this.tile?.move(Position.TOP_LEFT);
    }
    if (this.tile?.position === Position.BOTTOM_RIGHT) {
      return this.tile?.move(Position.BOTTOM);
    }
    if (this.tile?.position === Position.BOTTOM) {
      return this.tile?.move(Position.BOTTOM_LEFT);
    }
    return this.tile?.move(Position.LEFT);
  }

  private moveWindowUp() {
    if (this.tile?.position === Position.BOTTOM_LEFT) {
      return this.tile?.move(Position.LEFT);
    }
    if (this.tile?.position === Position.LEFT) {
      return this.tile?.move(Position.TOP_LEFT);
    }
    if (this.tile?.position === Position.BOTTOM_RIGHT) {
      return this.tile?.move(Position.RIGHT);
    }
    if (this.tile?.position === Position.RIGHT) {
      return this.tile?.move(Position.TOP_RIGHT);
    }
    if (this.tile?.position === Position.TOP) {
      return this.tile?.move(Position.MAXIMIZED);
    }
    return this.tile?.move(Position.TOP);
  }

  private moveWindowDown() {
    if (this.tile?.position === Position.TOP_LEFT) {
      return this.tile?.move(Position.LEFT);
    }
    if (this.tile?.position === Position.LEFT) {
      return this.tile?.move(Position.BOTTOM_LEFT);
    }
    if (this.tile?.position === Position.TOP_RIGHT) {
      return this.tile?.move(Position.RIGHT);
    }
    if (this.tile?.position === Position.RIGHT) {
      return this.tile?.move(Position.BOTTOM_RIGHT);
    }
    if (this.tile?.position === Position.MAXIMIZED) {
      return this.tile?.move(Position.TOP);
    }
    return this.tile?.move(Position.BOTTOM);
  }

  private handleMove(callback: () => void) {
    return () => {
      this.tile?.destroy();
      this.tile = new Tile(this.settings!);
      callback();
    };
  }

  override enable() {
    this.gnomeKeybindingsSettings = this.getSettings('org.gnome.desktop.wm.keybindings');
    this.mutterKeybindingsSettings = this.getSettings('org.gnome.mutter.keybindings');
    this.settings = this.getSettings();

    this.gnomeKeybindingsSettings.set_strv('maximize', []);
    this.gnomeKeybindingsSettings.set_strv('unmaximize', []);
    this.mutterKeybindingsSettings.set_strv('toggle-tiled-left', []);
    this.mutterKeybindingsSettings.set_strv('toggle-tiled-right', []);

    this.keybindings = new Keybindings(this.settings);

    this.keybindings.add('move-window-right', this.handleMove(this.moveWindowRight.bind(this)));
    this.keybindings.add('move-window-left', this.handleMove(this.moveWindowLeft.bind(this)));
    this.keybindings.add('move-window-up', this.handleMove(this.moveWindowUp.bind(this)));
    this.keybindings.add('move-window-down', this.handleMove(this.moveWindowDown.bind(this)));
  }

  override disable() {
    this.keybindings?.destroy();
    this.tile?.destroy();
    this.gnomeKeybindingsSettings?.reset('maximize');
    this.gnomeKeybindingsSettings?.reset('unmaximize');
    this.mutterKeybindingsSettings?.reset('toggle-tiled-left');
    this.mutterKeybindingsSettings?.reset('toggle-tiled-right');
    this.tile = null;
    this.keybindings = null;
    this.gnomeKeybindingsSettings = null;
    this.mutterKeybindingsSettings = null;
    this.settings = null;
  }
}
