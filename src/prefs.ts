import { ExtensionPreferences, gettext as _ } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';
import Adw from 'gi://Adw';
import Gdk from 'gi://Gdk';
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
        upper: Number.MAX_SAFE_INTEGER,
        step_increment: 1
      })
    });
    group.add(gapRow);

    settings.bind('gap-size', gapRow, 'value', Gio.SettingsBindFlags.DEFAULT);

    const autoTilingRow = new Adw.SwitchRow({
      title: _('Auto Tiling'),
      subtitle: _('Automatically arrange up to four windows per workspace into halves and quarters.')
    });
    group.add(autoTilingRow);

    settings.bind('auto-tiling', autoTilingRow, 'active', Gio.SettingsBindFlags.DEFAULT);

    const shortcutsGroup = new Adw.PreferencesGroup({
      title: _('Keyboard Shortcuts'),
      description: _('Click a shortcut to change it.')
    });
    page.add(shortcutsGroup);

    const shortcuts = new Map([
      ['move-window-left', _('Move Window Left')],
      ['move-window-right', _('Move Window Right')],
      ['move-window-up', _('Move Window Up')],
      ['move-window-down', _('Move Window Down')]
    ]);
    const labels = new Map<string, Adw.ShortcutLabel>();

    for (const [key, title] of shortcuts) {
      const label = new Adw.ShortcutLabel({
        accelerator: settings.get_strv(key).join(' '),
        disabled_text: _('Disabled'),
        valign: Gtk.Align.CENTER
      });
      labels.set(key, label);

      const resetButton = new Gtk.Button({
        icon_name: 'edit-undo-symbolic',
        tooltip_text: _('Reset to Default'),
        valign: Gtk.Align.CENTER,
        css_classes: ['flat']
      });
      resetButton.connect('clicked', () => settings.reset(key));

      const row = new Adw.ActionRow({ title, activatable: true });
      row.add_suffix(label);
      row.add_suffix(resetButton);
      row.connect('activated', () => this.showShortcutDialog(row, settings, key, title));
      shortcutsGroup.add(row);
    }

    const changedId = settings.connect('changed', (_settings, key: string) => {
      labels.get(key)?.set_accelerator(settings.get_strv(key).join(' '));
    });
    window.connect('close-request', () => {
      settings.disconnect(changedId);
      return Gdk.EVENT_PROPAGATE;
    });
  }

  private showShortcutDialog(parent: Gtk.Widget, settings: Gio.Settings, key: string, title: string) {
    const dialog = new Adw.AlertDialog({
      heading: title,
      body: _('Press the new shortcut, Esc to cancel or Backspace to disable it.')
    });
    dialog.add_response('cancel', _('Cancel'));

    const controller = new Gtk.EventControllerKey({
      propagation_phase: Gtk.PropagationPhase.CAPTURE
    });
    controller.connect('key-pressed', (_controller, keyval: number, _keycode: number, state: Gdk.ModifierType) => {
      const mask = state & Gtk.accelerator_get_default_mod_mask() & ~Gdk.ModifierType.LOCK_MASK;
      if (!mask && keyval === Gdk.KEY_Escape) {
        dialog.close();
        return Gdk.EVENT_STOP;
      }
      if (!mask && keyval === Gdk.KEY_BackSpace) {
        settings.set_strv(key, []);
        dialog.close();
        return Gdk.EVENT_STOP;
      }
      if (!mask || !Gtk.accelerator_valid(keyval, mask)) {
        return Gdk.EVENT_STOP;
      }
      settings.set_strv(key, [Gtk.accelerator_name(Gdk.keyval_to_lower(keyval), mask)]);
      dialog.close();
      return Gdk.EVENT_STOP;
    });
    dialog.add_controller(controller);

    dialog.present(parent);
  }
}
