import { vi } from 'vitest';

export const wm = {
  addKeybinding: vi.fn(),
  removeKeybinding: vi.fn()
};

export const panel = {
  addToStatusArea: vi.fn()
};

export const layoutManager = {
  getWorkAreaForMonitor: vi.fn()
};
