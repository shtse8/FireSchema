/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  // Specify where tests are located (e.g., in a __tests__ directory under src)
  testMatch: ['<rootDir>/src/**/__tests__/**/*.test.ts'],
  // Add any necessary module mappings if imports fail
  // moduleNameMapper: {
  //   '^@fireschema/ts-runtime$': '<rootDir>/packages/fireschema-ts-runtime/dist/index.js',
  // },
};