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
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
  prettierConfig,
];
