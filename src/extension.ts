import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import Gio from 'gi://Gio';
import Keybindings from './keybindings.js';
import TileManager from './TileManager.js';

export default class SmartTilingExtension extends Extension {
  private keybindings: Keybindings | null = null;
  private settings: Gio.Settings | null = null;
  private gnomeKeybindingsSettings: Gio.Settings | null = null;
  private mutterKeybindingsSettings: Gio.Settings | null = null;
  private tileManager: TileManager | null = null;

  private moveWindowRight() {
    const tile = this.tileManager?.getCurrentTile();
    if (tile?.position === Position.TOP_LEFT) {
      return tile.move(Position.TOP);
    }
    if (tile?.position === Position.TOP) {
      return tile.move(Position.TOP_RIGHT);
    }
    if (tile?.position === Position.BOTTOM_LEFT) {
      return tile.move(Position.BOTTOM);
    }
    if (tile?.position === Position.BOTTOM) {
      return tile.move(Position.BOTTOM_RIGHT);
    }
    return tile?.move(Position.RIGHT);
  }

  private moveWindowLeft() {
    const tile = this.tileManager?.getCurrentTile();
    if (tile?.position === Position.TOP_RIGHT) {
      return tile.move(Position.TOP);
    }
    if (tile?.position === Position.TOP) {
      return tile.move(Position.TOP_LEFT);
    }
    if (tile?.position === Position.BOTTOM_RIGHT) {
      return tile.move(Position.BOTTOM);
    }
    if (tile?.position === Position.BOTTOM) {
      return tile.move(Position.BOTTOM_LEFT);
    }
    return tile?.move(Position.LEFT);
  }

  private moveWindowUp() {
    const tile = this.tileManager?.getCurrentTile();
    if (tile?.position === Position.BOTTOM_LEFT) {
      return tile.move(Position.LEFT);
    }
    if (tile?.position === Position.LEFT) {
      return tile.move(Position.TOP_LEFT);
    }
    if (tile?.position === Position.BOTTOM_RIGHT) {
      return tile.move(Position.RIGHT);
    }
    if (tile?.position === Position.RIGHT) {
      return tile.move(Position.TOP_RIGHT);
    }
    if (tile?.position === Position.TOP) {
      return tile.move(Position.MAXIMIZED);
    }
    return tile?.move(Position.TOP);
  }

  private moveWindowDown() {
    const tile = this.tileManager?.getCurrentTile();
    if (tile?.position === Position.TOP_LEFT) {
      return tile.move(Position.LEFT);
    }
    if (tile?.position === Position.LEFT) {
      return tile.move(Position.BOTTOM_LEFT);
    }
    if (tile?.position === Position.TOP_RIGHT) {
      return tile.move(Position.RIGHT);
    }
    if (tile?.position === Position.RIGHT) {
      return tile.move(Position.BOTTOM_RIGHT);
    }
    if (tile?.position === Position.MAXIMIZED) {
      return tile.move(Position.TOP);
    }
    return tile?.move(Position.BOTTOM);
  }

  override enable() {
    this.gnomeKeybindingsSettings = this.getSettings('org.gnome.desktop.wm.keybindings');
    this.mutterKeybindingsSettings = this.getSettings('org.gnome.mutter.keybindings');
    this.settings = this.getSettings();
    this.tileManager = new TileManager(this.settings);

    this.gnomeKeybindingsSettings.set_strv('maximize', []);
    this.gnomeKeybindingsSettings.set_strv('unmaximize', []);
    this.mutterKeybindingsSettings.set_strv('toggle-tiled-left', []);
    this.mutterKeybindingsSettings.set_strv('toggle-tiled-right', []);

    this.keybindings = new Keybindings(this.settings);

    this.keybindings.add('move-window-right', this.moveWindowRight.bind(this));
    this.keybindings.add('move-window-left', this.moveWindowLeft.bind(this));
    this.keybindings.add('move-window-up', this.moveWindowUp.bind(this));
    this.keybindings.add('move-window-down', this.moveWindowDown.bind(this));
  }

  override disable() {
    this.keybindings?.destroy();
    this.tileManager?.destroy();
    this.gnomeKeybindingsSettings?.reset('maximize');
    this.gnomeKeybindingsSettings?.reset('unmaximize');
    this.mutterKeybindingsSettings?.reset('toggle-tiled-left');
    this.mutterKeybindingsSettings?.reset('toggle-tiled-right');
    this.keybindings = null;
    this.tileManager = null;
    this.gnomeKeybindingsSettings = null;
    this.mutterKeybindingsSettings = null;
    this.settings = null;
  }
}
