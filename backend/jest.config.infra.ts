import type { Config } from 'jest';

const config: Config = {
  transform: {
    '^.+\\.ts?$': ['ts-jest', { tsconfig: 'tests/tsconfig.json' }],
  },
  testEnvironment: 'node',
  testMatch: ['**/tests/features/**/*.infra.ts', '**/tests/api/**/*.infra.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  moduleNameMapper: {
    '^@dddforum/shared/(.*)$': '<rootDir>/../shared/$1',
  },
  // Infra tests share a real database — run files sequentially to prevent
  // concurrent resetDatabase() calls from truncating each other's data.
  maxWorkers: 1,
};

export default config;
