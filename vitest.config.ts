import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

const mocks = resolve(import.meta.dirname, 'tests/mocks');

export default defineConfig({
  resolve: {
    alias: [
      { find: /^gi:\/\/(\w+)$/, replacement: `${mocks}/gi/$1.ts` },
      { find: 'resource:///org/gnome/shell/extensions/extension.js', replacement: `${mocks}/shell/extension.ts` },
      { find: 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js', replacement: `${mocks}/shell/prefs.ts` },
      { find: /^resource:\/\/\/org\/gnome\/shell\/ui\/(\w+)\.js$/, replacement: `${mocks}/shell/$1.ts` }
    ]
  },
  test: {
    include: ['tests/**/*.test.ts'],
    setupFiles: ['tests/setup.ts'],
    mockReset: true,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.d.ts'],
      thresholds: { 100: true }
    }
  }
});
