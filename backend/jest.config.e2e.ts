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
};

export default config;
