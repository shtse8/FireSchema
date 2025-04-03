/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  testEnvironment: 'node',
  testTimeout: 30000, // Increase timeout globally for integration tests
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
    // Project for the TypeScript Client Runtime package tests
    {
      displayName: 'ts-client-runtime',
      // preset: 'ts-jest', // Removed preset, will rely on transform
      testEnvironment: 'node',
      rootDir: 'packages/fireschema-ts-client-runtime', // Set rootDir for this project
      testMatch: [
        '<rootDir>/src/**/__tests__/**/*.test.ts', // Unit tests
        '<rootDir>/tests/integration/**/*.test.ts' // Integration tests
      ],
      // Explicitly define the transformer
      transform: {
        '^.+\\.(t|j)sx?$': 'babel-jest', // Use babel-jest for ts, tsx, js, jsx
      },
      // testTimeout removed from project level
      // testTimeout removed from project level
    },
    // Project for the TypeScript Admin Runtime package tests
    {
      displayName: 'ts-admin-runtime',
      // preset: 'ts-jest', // Removed preset, will rely on transform
      testEnvironment: 'node',
      rootDir: 'packages/fireschema-ts-admin-runtime', // Set rootDir for this project
      testMatch: [
        '<rootDir>/src/**/__tests__/**/*.test.ts', // Unit tests
        '<rootDir>/tests/integration/**/*.test.ts' // Integration tests
      ],
      transform: {
        '^.+\\.(t|j)sx?$': 'babel-jest', // Use babel-jest for ts, tsx, js, jsx
      },
    },
    // Add other projects here if needed (e.g., for Dart runtime if tested via Jest, unlikely)
  ],
};