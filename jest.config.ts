import type { Config } from 'jest';

const config: Config = {
  collectCoverageFrom: ['src/**/*.{js,ts}', '!**/*.d.ts', '!**/node_modules/**'],
  testPathIgnorePatterns: ['/node_modules/', '/e2e/', '/__tests__/mocks.ts'],
  verbose: true,
  transform: {
    '^.+\\.ts?$': 'ts-jest',
  },
  transformIgnorePatterns: ['/node_modules/'],
  setupFiles: ['./jest.setup.js'],
  coverageProvider: 'v8',
  setupFilesAfterEnv: ['<rootDir>/src/lib/__mocks__/dbClient.mock.ts'],
};

export default config;
