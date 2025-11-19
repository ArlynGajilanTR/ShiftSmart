module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>'],
  testMatch: ['**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/../../$1',
  },
  globalSetup: '<rootDir>/setup.ts',
  globalTeardown: '<rootDir>/setup.ts',
  testTimeout: 30000, // 30 seconds for integration tests
  collectCoverageFrom: [
    '../../lib/ai/**/*.ts',
    '../../app/api/ai/**/*.ts',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
};
