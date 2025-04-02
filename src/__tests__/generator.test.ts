// src/__tests__/generator.test.ts
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process'; // To run the CLI command

// Define paths relative to the project root
const testOutputDir = path.resolve(__dirname, 'test-output');
const testConfigPath = path.resolve(__dirname, 'test-fireschema.config.json');
const testSchemaPath = path.resolve(__dirname, 'test-firestore.schema.json');
const cliPath = path.resolve(__dirname, '../../dist/cli.js'); // Path to compiled CLI

// Sample Config
const testConfig = {
  schema: './test-firestore.schema.json', // Relative to config file location
  outputs: [
    {
      language: 'typescript',
      outputDir: './ts-generated', // Relative to config file location
      package: {
        name: '@test/generated-ts',
        version: '1.0.0',
      },
      options: {
        dateTimeType: 'Timestamp',
      },
    },
    {
      language: 'dart',
      outputDir: './dart-generated', // Relative to config file location
      package: {
        name: 'test_generated_dart',
        version: '1.0.0',
        description: 'Test Dart generated code',
        environment: {
          sdk: '>=3.0.0 <4.0.0',
        },
      },
      options: {
        // Add any Dart-specific options if needed
      },
    },
  ],
};

// Sample Schema
const testSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  schemaVersion: "1.0.0", // Use semantic version format
  title: 'Test Firestore Schema',
  description: 'A simple schema for testing the generator.',
  collections: {
    items: {
      description: 'A collection of test items.',
      fields: {
        name: { type: 'string', required: true },
        value: { type: 'number', required: false },
        createdAt: { type: 'timestamp', required: true, defaultValue: 'serverTimestamp' },
      },
      subcollections: {
        tags: {
          description: 'Tags for an item.',
          fields: {
            label: { type: 'string', required: true },
          },
        },
      },
    },
  },
};

describe('FireSchema Generator', () => {
  // Setup: Create test config and schema files, ensure output dir is clean
  beforeAll(() => {
    fs.mkdirSync(testOutputDir, { recursive: true });
    fs.writeFileSync(testConfigPath, JSON.stringify(testConfig, null, 2));
    fs.writeFileSync(testSchemaPath, JSON.stringify(testSchema, null, 2));
    // Clean previous generated output if it exists
    const generatedTsDir = path.resolve(path.dirname(testConfigPath), testConfig.outputs[0].outputDir);
    if (fs.existsSync(generatedTsDir)) {
      fs.rmSync(generatedTsDir, { recursive: true, force: true });
    }
    const generatedDartDir = path.resolve(path.dirname(testConfigPath), testConfig.outputs[1].outputDir);
     if (fs.existsSync(generatedDartDir)) {
      fs.rmSync(generatedDartDir, { recursive: true, force: true });
    }
  });

  // Teardown: Remove test files and output dir
  afterAll(() => {
    if (fs.existsSync(testOutputDir)) {
      fs.rmSync(testOutputDir, { recursive: true, force: true });
    }
  });

  it('should run the generator CLI successfully', () => {
    // Run the generator CLI command once for all outputs
    try {
      // Execute from the directory containing the config file
      execSync(`node ${cliPath} generate -c "${testConfigPath}"`, {
        cwd: path.dirname(testConfigPath), // Execute where config is located
        stdio: 'inherit', // Show generator output during test run
      });
    } catch (error) {
      console.error('Generator CLI execution failed:', error);
      throw error; // Fail the test if generation fails
    }
    // Basic check: ensure output directories exist
    const generatedTsDir = path.resolve(path.dirname(testConfigPath), testConfig.outputs[0].outputDir);
    const generatedDartDir = path.resolve(path.dirname(testConfigPath), testConfig.outputs[1].outputDir);
    expect(fs.existsSync(generatedTsDir)).toBe(true);
    expect(fs.existsSync(generatedDartDir)).toBe(true);
  });

  it('should generate TypeScript files matching snapshots', () => {

    // Check if files were generated and match snapshots
    // Calculate the expected output dir relative to the config file's location
    const generatedBaseDir = path.resolve(path.dirname(testConfigPath), testConfig.outputs[0].outputDir);
    const expectedFiles = [
      'items.types.ts',
      'items.collection.ts',
      'items.query.ts',
      'items.update.ts',
      'items/{itemsId}/tags.types.ts',
      'items/{itemsId}/tags.collection.ts',
      'items/{itemsId}/tags.query.ts',
      'items/{itemsId}/tags.update.ts',
      'package.json',
      // Add tsconfig.json if the generator creates it
    ];

    expectedFiles.forEach((relPath) => {
      const filePath = path.join(generatedBaseDir, relPath);
      expect(fs.existsSync(filePath)).toBe(true); // Check file existence
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      // Use Jest snapshot testing
      expect(fileContent).toMatchSnapshot(relPath.replace(/[{}]/g, '_')); // Replace {} for valid snapshot names
    });
  });


  it('should generate Dart files matching snapshots', () => {
    // Calculate the expected output dir relative to the config file's location
    const generatedBaseDir = path.resolve(path.dirname(testConfigPath), testConfig.outputs[1].outputDir);
    const expectedFiles = [
      'items_data.dart',
      'items_collection.dart',
      'items_query.dart',
      'items_update.dart',
      'items/tags_data.dart', // Dart uses flat structure for subcollections in output dir
      'items/tags_collection.dart',
      'items/tags_query.dart',
      'items/tags_update.dart',
      'pubspec.yaml',
      // Add other expected Dart files if any (e.g., core file if re-enabled)
    ];

    expectedFiles.forEach((relPath) => {
      const filePath = path.join(generatedBaseDir, relPath);
      expect(fs.existsSync(filePath)).toBe(true); // Check file existence
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      // Use Jest snapshot testing - replace path separators for consistent snapshot names
      const snapshotName = relPath.replace(/[\\/]/g, '_');
      expect(fileContent).toMatchSnapshot(snapshotName);
    });
  });
});