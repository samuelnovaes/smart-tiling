import { Extension } from '@girs/gnome-shell/extensions/extension';
import * as Main from '@girs/gnome-shell/ui/main';
import Keybindings from './keybinding';

export default class SmartTilingExtension extends Extension {
  private keybindings?: Keybindings;

  handleMoveWindowLeft() {
    Main.notify('LEFT');
  }

  handleMoveWindowRight() {
    Main.notify('RIGHT');
  }
  
  handleMoveWindowUp() {
    Main.notify('UP');
  }

  handleMoveWindowDown() {
    Main.notify('DOWN');
  }

  override enable() {
    const keybindingsSettings = this.getSettings();
    const gnomeKeybindingsSettings = this.getSettings('org.gnome.desktop.wm.keybindings');
    const mutterKeybindingsSettings = this.getSettings('org.gnome.mutter.keybindings');

    gnomeKeybindingsSettings.set_strv('maximize', []);
    gnomeKeybindingsSettings.set_strv('unmaximize', []);
    mutterKeybindingsSettings.set_strv('toggle-tiled-left', []);
    mutterKeybindingsSettings.set_strv('toggle-tiled-right', []);
    
    this.keybindings = new Keybindings(keybindingsSettings);
    
    this.keybindings.add('move-window-right', this.handleMoveWindowRight);
    this.keybindings.add('move-window-left', this.handleMoveWindowLeft);
    this.keybindings.add('move-window-up', this.handleMoveWindowUp);
    this.keybindings.add('move-window-down', this.handleMoveWindowDown);
  }

  override disable() {
    this.keybindings?.destroy();
  }
}
