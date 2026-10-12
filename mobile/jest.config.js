module.exports = {
  preset: 'jest-expo',
  testMatch: ['**/__tests__/**/*.test.[jt]s?(x)'],
  modulePathIgnorePatterns: ['<rootDir>/android/', '<rootDir>/ios/'],
  clearMocks: true,
  testTimeout: 20000
};
