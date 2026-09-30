import { beforeEach, describe, expect, it, vi } from 'vitest';
import Adw from 'gi://Adw';
import Gdk from 'gi://Gdk';
import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk';
import SmartTilingPreferences from '../src/prefs.js';
import Settings from './mocks/settings.js';
import type Widget from './mocks/widget.js';

type Row = Widget & { suffixes: Widget[] };
type Dialog = Widget & { controllers: Widget[], responses: Map<string, string>, close: () => void, present: () => void };

describe('SmartTilingPreferences', () => {
  let settings: Settings;
  let window: Widget;
  let groups: Widget[];

  const shortcutRow = (index: number) => groups[1].children[index] as Row;

  const openDialog = (index: number) => {
    shortcutRow(index).emit('activated');
    return Adw.AlertDialog.instances.at(-1) as unknown as Dialog;
  };

  const press = (dialog: Dialog, keyval: number, state = 0) => dialog.controllers[0].emit('key-pressed', keyval, 0, state);

  beforeEach(async () => {
    Adw.AlertDialog.instances = [];
    settings = new Settings({
      'move-window-left': ['<Super>Left'],
      'move-window-right': ['<Super>Right'],
      'move-window-up': ['<Super>Up'],
      'move-window-down': []
    });
    const preferences = new SmartTilingPreferences();
    preferences.getSettings.mockReturnValue(settings);
    window = new Adw.PreferencesWindow() as unknown as Widget;
    await preferences.fillPreferencesWindow(window as never);
    groups = (window.children[0] as Widget).children as Widget[];
  });

  it('binds the general settings', () => {
    const [gapRow, autoTilingRow] = groups[0].children as Widget[];
    expect(gapRow).toBeInstanceOf(Adw.SpinRow);
    expect(autoTilingRow).toBeInstanceOf(Adw.SwitchRow);
    expect(gapRow.props.adjustment).toBeInstanceOf(Gtk.Adjustment);
    expect(settings.bind).toHaveBeenCalledWith('gap-size', gapRow, 'value', Gio.SettingsBindFlags.DEFAULT);
    expect(settings.bind).toHaveBeenCalledWith('auto-tiling', autoTilingRow, 'active', Gio.SettingsBindFlags.DEFAULT);
  });

  it('lists every shortcut with its current accelerator', () => {
    const rows = groups[1].children as Row[];
    expect(rows.map(row => row.props.title))
      .toEqual(['Move Window Left', 'Move Window Right', 'Move Window Up', 'Move Window Down']);
    expect(rows.map(row => row.suffixes[0].props.accelerator))
      .toEqual(['<Super>Left', '<Super>Right', '<Super>Up', '']);
  });

  it('updates labels when shortcuts change', () => {
    settings.set_strv('move-window-left', ['<Ctrl>Left']);
    expect(shortcutRow(0).suffixes[0].props.accelerator).toBe('<Ctrl>Left');
    expect(() => settings.emit('changed', 'gap-size')).not.toThrow();
  });

  it('resets a shortcut to its default', () => {
    settings.set_strv('move-window-right', []);
    shortcutRow(1).suffixes[1].emit('clicked');
    expect(settings.get_strv('move-window-right')).toEqual(['<Super>Right']);
  });

  it('stops listening to settings when the window closes', () => {
    expect(window.emit('close-request')).toBe(Gdk.EVENT_PROPAGATE);
    expect(settings.handlerCount()).toBe(0);
  });

  describe('shortcut dialog', () => {
    let dialog: Dialog;

    beforeEach(() => {
      dialog = openDialog(0);
    });

    it('is presented over the activated row', () => {
      expect(dialog.props.heading).toBe('Move Window Left');
      expect(dialog.responses.get('cancel')).toBe('Cancel');
      expect(dialog.present).toHaveBeenCalledWith(shortcutRow(0));
    });

    it('cancels with Escape', () => {
      expect(press(dialog, Gdk.KEY_Escape, Gdk.ModifierType.LOCK_MASK)).toBe(Gdk.EVENT_STOP);
      expect(dialog.close).toHaveBeenCalled();
      expect(settings.get_strv('move-window-left')).toEqual(['<Super>Left']);
    });

    it('disables the shortcut with Backspace', () => {
      expect(press(dialog, Gdk.KEY_BackSpace)).toBe(Gdk.EVENT_STOP);
      expect(dialog.close).toHaveBeenCalled();
      expect(settings.get_strv('move-window-left')).toEqual([]);
    });

    it('ignores keys without modifiers', () => {
      expect(press(dialog, 65)).toBe(Gdk.EVENT_STOP);
      expect(dialog.close).not.toHaveBeenCalled();
    });

    it('ignores invalid accelerators', () => {
      vi.mocked(Gtk.accelerator_valid).mockReturnValue(false);
      expect(press(dialog, 65, Gdk.ModifierType.CONTROL_MASK)).toBe(Gdk.EVENT_STOP);
      expect(dialog.close).not.toHaveBeenCalled();
    });

    it.each([65, Gdk.KEY_Escape, Gdk.KEY_BackSpace])('saves key %i combined with modifiers', (keyval) => {
      expect(press(dialog, keyval, Gdk.ModifierType.CONTROL_MASK | Gdk.ModifierType.LOCK_MASK)).toBe(Gdk.EVENT_STOP);
      expect(Gtk.accelerator_valid).toHaveBeenCalledWith(keyval, Gdk.ModifierType.CONTROL_MASK);
      expect(settings.get_strv('move-window-left')).toEqual([`<${Gdk.ModifierType.CONTROL_MASK}>${keyval + 32}`]);
      expect(dialog.close).toHaveBeenCalled();
    });
  });
});
