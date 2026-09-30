import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import SmartTilingExtension from '../src/extension.js';
import TileManager from '../src/tileManager.js';
import Settings from './mocks/settings.js';
import { stubShellGlobals } from './mocks/global.js';
import type { Button } from './mocks/shell/panelMenu.js';

describe('SmartTilingExtension', () => {
  let extension: SmartTilingExtension;
  let settings: Record<string, Settings>;

  beforeEach(() => {
    stubShellGlobals();
    settings = {
      'org.gnome.desktop.wm.keybindings': new Settings({ maximize: ['<Super>Up'], unmaximize: ['<Super>Down'] }),
      'org.gnome.mutter.keybindings': new Settings({
        'toggle-tiled-left': ['<Super>Left'],
        'toggle-tiled-right': ['<Super>Right']
      }),
      'org.gnome.shell.extensions.smarttiling': new Settings({ 'auto-tiling': false, 'gap-size': 0 })
    };
    extension = new SmartTilingExtension({ name: 'Smart Tiling', uuid: 'smarttiling@test' } as never);
    extension.getSettings.mockImplementation(
      (schema = 'org.gnome.shell.extensions.smarttiling') => settings[schema] as never
    );
  });

  it('frees the default tiling shortcuts while enabled', () => {
    extension.enable();
    const gnome = settings['org.gnome.desktop.wm.keybindings'];
    const mutter = settings['org.gnome.mutter.keybindings'];
    expect(gnome.get_strv('maximize')).toEqual(['<Ctrl><Super>Up']);
    expect(gnome.get_strv('unmaximize')).toEqual(['<Ctrl><Super>Down']);
    expect(mutter.get_strv('toggle-tiled-left')).toEqual(['<Ctrl><Super>Left']);
    expect(mutter.get_strv('toggle-tiled-right')).toEqual(['<Ctrl><Super>Right']);

    extension.disable();
    expect(gnome.get_strv('maximize')).toEqual(['<Super>Up']);
    expect(gnome.get_strv('unmaximize')).toEqual(['<Super>Down']);
    expect(mutter.get_strv('toggle-tiled-left')).toEqual(['<Super>Left']);
    expect(mutter.get_strv('toggle-tiled-right')).toEqual(['<Super>Right']);
  });

  it.each([
    ['move-window-right', 'moveRight'],
    ['move-window-left', 'moveLeft'],
    ['move-window-up', 'moveUp'],
    ['move-window-down', 'moveDown']
  ] as const)('binds %s to TileManager.%s', (key, method) => {
    const spy = vi.spyOn(TileManager.prototype, method);
    extension.enable();
    const call = vi.mocked(Main.wm.addKeybinding).mock.calls.find(([name]) => name === key)!;
    call[4]();
    expect(spy).toHaveBeenCalledOnce();
  });

  it('adds the indicator and removes everything on disable', () => {
    extension.enable();
    const button = vi.mocked(Main.panel.addToStatusArea).mock.calls[0][1] as unknown as Button;
    const smartTiling = settings['org.gnome.shell.extensions.smarttiling'];
    expect(smartTiling.handlerCount()).toBeGreaterThan(0);

    extension.disable();
    expect(button.destroy).toHaveBeenCalled();
    expect(Main.wm.removeKeybinding).toHaveBeenCalledTimes(4);
    expect(smartTiling.handlerCount()).toBe(0);
    expect(global.display.handlerCount()).toBe(0);
  });

  it('can be disabled without being enabled', () => {
    expect(() => extension.disable()).not.toThrow();
  });
});
