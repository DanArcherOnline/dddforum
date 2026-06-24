const typescriptEslint = require('@typescript-eslint/eslint-plugin');
const typescriptParser = require('@typescript-eslint/parser');
const prettierConfig = require('eslint-config-prettier');
const jestPlugin = require('eslint-plugin-jest');

module.exports = [
  {
    ignores: ['node_modules/**', 'build/**', 'src/generated/**'],
  },
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: typescriptParser,
    },
    plugins: {
      '@typescript-eslint': typescriptEslint,
      jest: jestPlugin,
    },
    rules: {
      ...typescriptEslint.configs.recommended.rules,
      ...jestPlugin.configs.recommended.rules,
      'jest/no-standalone-expect': ['error', { additionalTestBlockFunctions: ['defineFeature'] }],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['src/shared/testDoubles/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  prettierConfig,
];
