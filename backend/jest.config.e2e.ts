import type { Config } from 'jest';

const config: Config = {
  transform: {
    '^.+\\.ts?$': ['ts-jest', { tsconfig: 'tests/tsconfig.json' }],
  },
  testEnvironment: 'node',
  testMatch: ['**/tests/features/**/*.e2e.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  moduleNameMapper: {
    '^@dddforum/shared/(.*)$': '<rootDir>/../shared/$1',
  },
  // Remote DB round-trips in staging are slower than the 5 s default.
  testTimeout: 30000,
};

export default config;
