import { vi } from 'vitest';

export class ExtensionPreferences {
  getSettings = vi.fn();
}

export const gettext = (text: string) => text;
