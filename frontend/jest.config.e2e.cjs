module.exports = {
  transform: {
    '^.+\\.ts?$': ['ts-jest', { tsconfig: 'tests/tsconfig.json' }],
  },
  testEnvironment: 'node',
  testMatch: ['**/tests/features/**/*.e2e.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
};
