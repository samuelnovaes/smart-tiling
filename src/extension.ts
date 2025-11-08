import { Extension } from '@girs/gnome-shell/extensions/extension';
import { Keybindings, Keys } from './keybinding';

export default class SmartTilingExtension extends Extension {
  private keybindings?: Keybindings;

  handleMoveWindowRight() {
    //
  }

  handleMoveWindowLeft() {
    //
  }

  handleMoveWindowUp() {
    //
  }

  handleMoveWindowDown() {
    //
  }

  override enable() {
    this.keybindings = new Keybindings(this.getSettings());
    this.keybindings.add(Keys.MOVE_WINDOW_RIGHT, this.handleMoveWindowRight);
    this.keybindings.add(Keys.MOVE_WINDOW_LEFT, this.handleMoveWindowLeft);
    this.keybindings.add(Keys.MOVE_WINDOW_UP, this.handleMoveWindowUp);
    this.keybindings.add(Keys.MOVE_WINDOW_DOWN, this.handleMoveWindowDown);
  }

  override disable() {
    this.keybindings?.destroy();
  }
}
