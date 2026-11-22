module.exports = {
  preset: 'jest-expo',
  testMatch: ['**/__tests__/**/*.test.[jt]s?(x)'],
  moduleDirectories: ['node_modules', '<rootDir>/node_modules/expo/node_modules'],
  modulePathIgnorePatterns: ['<rootDir>/android/', '<rootDir>/ios/'],
  clearMocks: true,
  testTimeout: 20000
};

