import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/*.spec.ts'],
  clearMocks: true,
  setupFiles: ['<rootDir>/test/setup-env.ts'],
};

export default config;
