import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import Meta from 'gi://Meta';
import Shell from 'gi://Shell';
import Keybindings from '../src/keybindings.js';
import Settings from './mocks/settings.js';

describe('Keybindings', () => {
  let settings: Settings;
  let keybindings: Keybindings;

  beforeEach(() => {
    settings = new Settings();
    keybindings = new Keybindings(settings as never);
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('adds keybindings and removes them on destroy', () => {
    const handler = vi.fn();
    keybindings.add('move-window-left', handler);
    keybindings.add('move-window-right', handler);
    expect(Main.wm.addKeybinding).toHaveBeenCalledWith(
      'move-window-left',
      settings,
      Meta.KeyBindingFlags.IGNORE_AUTOREPEAT,
      Shell.ActionMode.NORMAL,
      handler
    );

    keybindings.destroy();
    expect(Main.wm.removeKeybinding).toHaveBeenCalledTimes(2);
    expect(Main.wm.removeKeybinding).toHaveBeenCalledWith('move-window-left');
    expect(Main.wm.removeKeybinding).toHaveBeenCalledWith('move-window-right');
  });

  it('logs and skips keybindings that fail to be added', () => {
    vi.mocked(Main.wm.addKeybinding).mockImplementation(() => {
      throw new Error('boom');
    });
    keybindings.add('move-window-up', vi.fn());
    expect(console.error).toHaveBeenCalledWith('Failed to add keybinding for move-window-up: Error: boom');

    keybindings.destroy();
    expect(Main.wm.removeKeybinding).not.toHaveBeenCalled();
  });

  it('logs keybindings that fail to be removed', () => {
    vi.mocked(Main.wm.removeKeybinding).mockImplementation(() => {
      throw new Error('boom');
    });
    keybindings.add('move-window-down', vi.fn());
    keybindings.destroy();
    expect(console.error).toHaveBeenCalledWith('Failed to remove keybinding for move-window-down: Error: boom');
  });
});
