// @ts-check

import globals from "globals";
import eslint from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';

export default [
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.webextensions
      }
    },
  },
  {
    ignores: ['.git/**', '.github/**', 'dist', 'node_modules'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  eslintConfigPrettier,
  {
    rules: {
      '@typescript-eslint/consistent-type-imports': [
        'warn',
        { fixStyle: 'inline-type-imports', disallowTypeAnnotations: false },
      ],
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      "no-unused-vars": "off",
    },
  }
];
