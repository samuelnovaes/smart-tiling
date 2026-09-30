import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import { defineConfig } from 'eslint/config';
import { importX } from 'eslint-plugin-import-x';
import stylistic from '@stylistic/eslint-plugin';

export default defineConfig([
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts}'],
    plugins: { js },
    extends: ['js/recommended'],
    languageOptions: { globals: globals.node }
  },
  tseslint.configs.recommended,
  importX.flatConfigs.recommended,
  stylistic.configs.recommended,
  {
    rules: {
      '@stylistic/semi': ['error', 'always'],
      '@stylistic/eol-last': ['error', 'always'],
      '@stylistic/quotes': ['error', 'single'],
      '@stylistic/indent': ['error', 2],
      '@stylistic/no-multiple-empty-lines': ['error', { max: 1 }],
      '@stylistic/no-empty': 'off',
      '@stylistic/comma-dangle': ['error', 'never'],
      '@stylistic/lines-between-class-members': ['error', {
        enforce: [
          { blankLine: 'always', prev: 'method', next: '*' },
          { blankLine: 'always', prev: '*', next: 'method' }
        ]
      }],
      'import-x/newline-after-import': ['error', { count: 1 }],
      'import-x/no-unresolved': 'off'
    }
  },
  {
    files: ['dist/**/*.js'],
    rules: {
      '@stylistic/padding-line-between-statements': ['error',
        { blankLine: 'always', prev: 'multiline-const', next: 'const' },
        { blankLine: 'always', prev: '*', next: 'export' }
      ]
    }
  }
]);
