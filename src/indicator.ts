import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import Clutter from 'gi://Clutter';
import Gio from 'gi://Gio';
import St from 'gi://St';

export default class Indicator {
  private button: PanelMenu.Button;
  private settings: Gio.Settings;
  private autoTilingChangedId: number;

  constructor(extension: Extension, settings: Gio.Settings) {
    this.settings = settings;

    this.button = new PanelMenu.Button(0.0, extension.metadata.name, true);
    this.button.add_child(new St.Icon({
      icon_name: 'view-grid-symbolic',
      style_class: 'system-status-icon'
    }));
    this.button.connect('event', (_actor, event: Clutter.Event) => {
      const type = event.type();
      if (type !== Clutter.EventType.BUTTON_PRESS && type !== Clutter.EventType.TOUCH_BEGIN) {
        return Clutter.EVENT_PROPAGATE;
      }
      this.settings.set_boolean('auto-tiling', !this.settings.get_boolean('auto-tiling'));
      return Clutter.EVENT_STOP;
    });

    this.autoTilingChangedId = this.settings.connect('changed::auto-tiling', () => this.sync());
    this.sync();

    Main.panel.addToStatusArea(extension.uuid, this.button);
  }

  private sync() {
    if (this.settings.get_boolean('auto-tiling')) {
      this.button.add_style_pseudo_class('checked');
    }
    else {
      this.button.remove_style_pseudo_class('checked');
    }
  }

  destroy() {
    this.settings.disconnect(this.autoTilingChangedId);
    this.button.destroy();
  }
}
