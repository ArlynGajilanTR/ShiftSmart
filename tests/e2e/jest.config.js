module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/ai-schedule-generation'],
  testMatch: ['**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/../../$1',
  },
  setupFilesAfterEnv: ['<rootDir>/../helpers/test-config.ts'],
  testTimeout: 120000, // 2 minutes for live AI tests
};
