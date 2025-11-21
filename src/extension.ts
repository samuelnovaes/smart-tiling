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
    this.keybindings.add('move-window-right', this.tileManager.moveRight.bind(this.tileManager));
    this.keybindings.add('move-window-left', this.tileManager.moveLeft.bind(this.tileManager));
    this.keybindings.add('move-window-up', this.tileManager.moveUp.bind(this.tileManager));
    this.keybindings.add('move-window-down', this.tileManager.moveDown.bind(this.tileManager));
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
