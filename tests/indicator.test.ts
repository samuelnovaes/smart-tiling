import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import Clutter from 'gi://Clutter';
import Indicator from '../src/indicator.js';
import Settings from './mocks/settings.js';
import type { Button } from './mocks/shell/panelMenu.js';

const event = (type: number) => ({ type: () => type });

describe('Indicator', () => {
  let settings: Settings;
  let indicator: Indicator;
  let button: Button;

  beforeEach(() => {
    settings = new Settings({ 'auto-tiling': true });
    indicator = new Indicator(new Extension({ name: 'Smart Tiling', uuid: 'smarttiling@test' } as never) as never, settings as never);
    button = vi.mocked(Main.panel.addToStatusArea).mock.calls[0][1] as unknown as Button;
  });

  it('adds a button with an icon to the top bar', () => {
    expect(Main.panel.addToStatusArea).toHaveBeenCalledWith('smarttiling@test', button);
    expect(button.args).toEqual([0.0, 'Smart Tiling', true]);
    expect(button.add_child).toHaveBeenCalledWith(expect.objectContaining({
      props: { icon_name: 'view-grid-symbolic', style_class: 'system-status-icon' }
    }));
  });

  it('reflects the auto tiling setting', () => {
    expect(button.pseudoClasses.has('checked')).toBe(true);
    settings.set_boolean('auto-tiling', false);
    expect(button.pseudoClasses.has('checked')).toBe(false);
  });

  it.each([Clutter.EventType.BUTTON_PRESS, Clutter.EventType.TOUCH_BEGIN])('toggles auto tiling on event %i', (type) => {
    expect(button.emit('event', event(type))).toBe(Clutter.EVENT_STOP);
    expect(settings.get_boolean('auto-tiling')).toBe(false);
    expect(button.emit('event', event(type))).toBe(Clutter.EVENT_STOP);
    expect(settings.get_boolean('auto-tiling')).toBe(true);
  });

  it('propagates other events', () => {
    expect(button.emit('event', event(Clutter.EventType.MOTION))).toBe(Clutter.EVENT_PROPAGATE);
    expect(settings.get_boolean('auto-tiling')).toBe(true);
  });

  it('disconnects from settings and destroys the button', () => {
    indicator.destroy();
    expect(settings.handlerCount()).toBe(0);
    expect(button.destroy).toHaveBeenCalled();
  });
});
