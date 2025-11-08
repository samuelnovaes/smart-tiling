import { Extension } from '@girs/gnome-shell/extensions/extension';
import * as Main from '@girs/gnome-shell/ui/main';
import { Keybindings, Keys } from './keybinding';

export default class SmartTilingExtension extends Extension {
  private keybindings?: Keybindings;

  handleMoveWindowRight() {
    Main.notify('Move Window Right triggered');
  }

  handleMoveWindowLeft() {
    Main.notify('Move Window Left triggered');
  }

  handleMoveWindowTop() {
    Main.notify('Move Window Top triggered');
  }

  handleMoveWindowBottom() {
    Main.notify('Move Window Bottom triggered');
  }

  override enable() {
    this.keybindings = new Keybindings(this.getSettings());
    this.keybindings.add(Keys.MOVE_WINDOW_RIGHT, this.handleMoveWindowRight);
    this.keybindings.add(Keys.MOVE_WINDOW_LEFT, this.handleMoveWindowLeft);
    this.keybindings.add(Keys.MOVE_WINDOW_TOP, this.handleMoveWindowTop);
    this.keybindings.add(Keys.MOVE_WINDOW_BOTTOM, this.handleMoveWindowBottom);
  }

  override disable() {
    this.keybindings?.destroy();
  }
}
