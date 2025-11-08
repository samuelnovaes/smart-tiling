import '@girs/gnome-shell/extensions/global';
import { Extension } from '@girs/gnome-shell/extensions/extension';
import Meta from '@girs/meta-17';
import Keybindings from './keybinding';

export default class SmartTilingExtension extends Extension {
  private keybindings?: Keybindings;

  getWindow() {
    return global.display.get_focus_window();
  }

  getMonitor(window: Meta.Window) {
    const monitorIndex = window.get_monitor();
    return global.display.get_monitor_geometry(monitorIndex);
  }

  handleMoveWindowLeft() {
    const window = this.getWindow();
    const monitor = this.getMonitor(window);
    window.move_resize_frame(
      true,
      monitor.x,
      monitor.y,
      Math.floor(monitor.width / 2),
      monitor.height
    );
  }

  handleMoveWindowRight() {
    const window = this.getWindow();
    const monitor = this.getMonitor(window);
    window.move_resize_frame(
      true,
      monitor.x + Math.floor(monitor.width / 2),
      monitor.y,
      Math.floor(monitor.width / 2),
      monitor.height
    );
  }
  
  handleMoveWindowUp() {
    console.log('AAA');
  }

  handleMoveWindowDown() {
    console.log('BBB');
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
    
    this.keybindings.add('move-window-right', this.handleMoveWindowRight.bind(this));
    this.keybindings.add('move-window-left', this.handleMoveWindowLeft.bind(this));
    this.keybindings.add('move-window-up', this.handleMoveWindowUp.bind(this));
    this.keybindings.add('move-window-down', this.handleMoveWindowDown.bind(this));
  }

  override disable() {
    this.keybindings?.destroy();
  }
}
