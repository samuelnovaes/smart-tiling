import { Extension, gettext as _ } from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import Clutter from 'gi://Clutter';
import Gio from 'gi://Gio';
import St from 'gi://St';

export default class Indicator {
  private button: PanelMenu.Button;
  private settings: Gio.Settings;
  private autoTilingItem: PopupMenu.PopupSwitchMenuItem;
  private gapSizeChangedId: number;

  constructor(extension: Extension, settings: Gio.Settings) {
    this.settings = settings;

    this.button = new PanelMenu.Button(0.0, extension.metadata.name);
    this.button.add_child(new St.Icon({
      icon_name: 'view-grid-symbolic',
      style_class: 'system-status-icon'
    }));
    const menu = this.button.menu as PopupMenu.PopupMenu;

    this.autoTilingItem = new PopupMenu.PopupSwitchMenuItem(_('Auto Tiling'), false);
    this.settings.bind('auto-tiling', this.autoTilingItem, 'state', Gio.SettingsBindFlags.DEFAULT);
    menu.addMenuItem(this.autoTilingItem);

    const gapSizeItem = new PopupMenu.PopupBaseMenuItem({ activate: false });
    gapSizeItem.add_child(new St.Label({
      text: _('Gap Size'),
      x_expand: true,
      y_align: Clutter.ActorAlign.CENTER
    }));
    const decreaseButton = new St.Button({
      icon_name: 'list-remove-symbolic',
      style_class: 'icon-button',
      can_focus: true
    });
    decreaseButton.connect('clicked', () => this.changeGapSize(-1));
    gapSizeItem.add_child(decreaseButton);
    const gapSizeLabel = new St.Label({
      text: `${this.settings.get_int('gap-size')}`,
      y_align: Clutter.ActorAlign.CENTER
    });
    gapSizeItem.add_child(gapSizeLabel);
    const increaseButton = new St.Button({
      icon_name: 'list-add-symbolic',
      style_class: 'icon-button',
      can_focus: true
    });
    increaseButton.connect('clicked', () => this.changeGapSize(1));
    gapSizeItem.add_child(increaseButton);
    menu.addMenuItem(gapSizeItem);

    menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
    menu.addAction(_('Preferences'), () => extension.openPreferences());

    this.gapSizeChangedId = this.settings.connect('changed::gap-size', () => {
      gapSizeLabel.text = `${this.settings.get_int('gap-size')}`;
    });

    Main.panel.addToStatusArea(extension.uuid, this.button);
  }

  private changeGapSize(delta: number) {
    this.settings.set_int('gap-size', Math.max(0, this.settings.get_int('gap-size') + delta));
  }

  destroy() {
    this.settings.disconnect(this.gapSizeChangedId);
    Gio.Settings.unbind(this.autoTilingItem, 'state');
    this.button.destroy();
  }
}
