import { ExtensionPreferences, gettext as _ } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';
import Adw from 'gi://Adw';
import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk';

export default class SmartTilingPreferences extends ExtensionPreferences {
  async fillPreferencesWindow(window: Adw.PreferencesWindow) {
    const settings = this.getSettings();

    const page = new Adw.PreferencesPage({
      title: _('Smart Tiling'),
      icon_name: 'view-grid-symbolic'
    });
    window.add(page);

    const group = new Adw.PreferencesGroup({
      title: _('General Settings'),
      description: _('Configure the general settings for Smart Tiling extension.')
    });
    page.add(group);

    const gapRow = new Adw.SpinRow({
      title: _('Gap Size'),
      subtitle: _('Set the size of the gaps between tiled windows.'),
      adjustment: new Gtk.Adjustment({
        lower: 0,
        upper: 100,
        step_increment: 1
      })
    });
    group.add(gapRow);

    settings.bind('gap-size', gapRow, 'value', Gio.SettingsBindFlags.DEFAULT);
  }
}
