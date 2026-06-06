module.exports = {
  transform: {
    '^.+\\.ts?$': ['ts-jest', { diagnostics: { ignoreCodes: ['TS151001'] } }],
  },
  testEnvironment: 'node',
  testMatch: ['**/src/tests/e2e/**/*.steps.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
};
