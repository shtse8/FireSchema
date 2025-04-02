/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  testEnvironment: 'node',
  // Use 'projects' for monorepo setup
  projects: [
    // Project for the main generator tests
    {
      displayName: 'generator',
      preset: 'ts-jest',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/src/**/__tests__/**/*.test.ts'],
      // moduleNameMapper might be needed if generator tests import runtime directly
      // moduleNameMapper: {
      //   '^@fireschema/ts-runtime/(.*)$': '<rootDir>/packages/fireschema-ts-runtime/src/$1',
      // },
    },
    // Project for the TypeScript runtime package tests
    {
      displayName: 'ts-runtime',
      preset: 'ts-jest',
      testEnvironment: 'node',
      rootDir: 'packages/fireschema-ts-runtime', // Set rootDir for this project
      testMatch: ['<rootDir>/src/**/__tests__/**/*.test.ts'], // Relative to the package rootDir
      // No moduleNameMapper needed here usually, as imports are within the package
    },
    // Add other projects here if needed (e.g., for Dart runtime if tested via Jest, unlikely)
  ],
};