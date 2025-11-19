module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>'],
  testMatch: ['**/regression.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/../../$1',
  },
  testTimeout: 60000, // 60 seconds for performance tests
};
