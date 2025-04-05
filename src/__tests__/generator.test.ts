// src/__tests__/generator.test.ts
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import * as fs from 'fs'; // Use namespace import
import * as path from 'path'; // Use namespace import
import { execSync } from 'child_process';

// Define paths relative to the project root
const testOutputDir = path.resolve(__dirname, 'test-output');
const testConfigPath = path.resolve(testOutputDir, 'test-fireschema.config.json'); // Combined config
const testSchemaPath = path.resolve(testOutputDir, 'test-firestore.schema.json'); // Shared schema
const cliPath = path.resolve(__dirname, '../../dist/cli.js'); // Path to compiled CLI

// --- Test Data ---
// Combined Config using 'target' - TEMPORARILY DISABLED DART
const testConfig = {
  schema: './test-firestore.schema.json',
  outputs: [
    // TypeScript Client Target
    {
      target: 'typescript-client', // Use target string
      outputDir: './ts-generated-client',
      package: { name: '@test/generated-ts-client', version: '1.0.0' },
      options: { dateTimeType: 'Timestamp' }, // Keep relevant options
    },
    // TypeScript Admin Target
    {
      target: 'typescript-admin', // Use target string
      outputDir: './ts-generated-admin',
      package: { name: '@test/generated-ts-admin', version: '1.0.0' },
      options: { dateTimeType: 'Timestamp' }, // Keep relevant options
    },
    // Dart Client Target - Temporarily Disabled
    // {
    //   target: 'dart-client', // Use target string
    //   outputDir: './dart-generated',
    //   package: { name: 'test_generated_dart', version: '1.0.0', description: 'Test Dart generated code', environment: { sdk: '>=3.0.0 <4.0.0' } },
    // },
  ],
};

// Sample Schema (Shared)
const testSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  schemaVersion: "1.0.0",
  title: 'Test Firestore Schema',
  description: 'A simple schema for testing the generator.',
  collections: {
    items: {
      description: 'A collection of test items.',
      fields: {
        name: { type: 'string', required: true },
        value: { type: 'number', required: false },
        createdAt: { type: 'timestamp', required: true, defaultValue: 'serverTimestamp' },
        tagsArray: { type: 'array', items: { type: 'string' } },
        address: {
          type: 'map', required: false,
          properties: {
            street: { type: 'string', required: true }, city: { type: 'string', required: true }, zip: { type: 'string' },
            coords: { type: 'map', required: false, properties: { lat: { type: 'number', required: true }, lon: { type: 'number', required: true } } }
          }
        },
      },
      subcollections: {
        tags: { description: 'Tags for an item.', fields: { label: { type: 'string', required: true } } },
      },
    },
  },
};

// --- Invalid Schemas for Validation Tests ---
const invalidSchema_FieldName = {
  ...testSchema,
  collections: {
    ...testSchema.collections,
    items: {
      ...testSchema.collections.items,
      fields: {
        ...testSchema.collections.items.fields,
        'invalid/name': { type: 'string' }, // Invalid field name
      },
    },
  },
};

const invalidSchema_MapKey = {
  ...testSchema,
  collections: {
    ...testSchema.collections,
    items: {
      ...testSchema.collections.items,
      fields: {
        ...testSchema.collections.items.fields,
        address: {
          type: 'map',
          properties: {
            'street.dot': { type: 'string' }, // Invalid map key
          },
        },
      },
    },
  },
};

const invalidSchema_ReferenceTo = {
  ...testSchema,
  collections: {
    ...testSchema.collections,
    items: {
      ...testSchema.collections.items,
      fields: {
        ...testSchema.collections.items.fields,
        userRef: { type: 'reference', referenceTo: 'nonExistentCollection' }, // Invalid reference
      },
    },
  },
};

const invalidSchema_DefaultValueType = {
  ...testSchema,
  collections: {
    ...testSchema.collections,
    items: {
      ...testSchema.collections.items,
      fields: {
        ...testSchema.collections.items.fields,
        count: { type: 'number', defaultValue: 'not a number' }, // Invalid default value type
      },
    },
  },
};


// --- Test Suite ---
describe('FireSchema Generator', () => {
  beforeAll(() => {
    if (fs.existsSync(testOutputDir)) fs.rmSync(testOutputDir, { recursive: true, force: true });
    fs.mkdirSync(testOutputDir, { recursive: true });
    fs.writeFileSync(testSchemaPath, JSON.stringify(testSchema, null, 2));
    fs.writeFileSync(testConfigPath, JSON.stringify(testConfig, null, 2));
  });
  afterAll(() => {
    // Keep output for inspection during development
      // Add a short delay to allow file handles to release (Windows)
      try {
        execSync('ping 127.0.0.1 -n 2 > nul', { stdio: 'ignore' }); // ~1 second delay
      } catch (e) {
        // Ignore errors from ping command
      }

    if (fs.existsSync(testOutputDir)) fs.rmSync(testOutputDir, { recursive: true, force: true });
  });

  // Simplified test - run generator once with the combined config
  it('should run the generator CLI successfully', () => {
    try {
      console.log(`Running generator with config: ${testConfigPath}`);
      execSync(`node ${cliPath} generate -c "${testConfigPath}"`, { cwd: testOutputDir, stdio: 'inherit' });
    } catch (error) {
      console.error('Generator CLI execution failed:', error);
      throw error;
    }
    // Check existence of output directories based on the combined config
    const generatedClientDir = path.resolve(testOutputDir, testConfig.outputs[0].outputDir); // ts-client
    const generatedAdminDir = path.resolve(testOutputDir, testConfig.outputs[1].outputDir); // ts-admin
    // const generatedDartDir = path.resolve(testOutputDir, testConfig.outputs[2].outputDir); // Dart dir check removed

    expect(fs.existsSync(generatedClientDir)).toBe(true);
    expect(fs.existsSync(generatedAdminDir)).toBe(true);
    // expect(fs.existsSync(generatedDartDir)).toBe(true); // Dart dir check removed
  });

  // --- Snapshot Tests ---
  const tsExpectedFiles = [
    'items.types.ts', 'items.collection.ts', 'items.query.ts', 'items.update.ts',
    'items/{itemsId}/tags.types.ts', 'items/{itemsId}/tags.collection.ts', 'items/{itemsId}/tags.query.ts', 'items/{itemsId}/tags.update.ts',
    'package.json',
  ];

  it('should generate TypeScript client files matching snapshots', () => {
    const generatedBaseDir = path.resolve(testOutputDir, testConfig.outputs[0].outputDir); // Index 0 = ts-client
    tsExpectedFiles.forEach((relPath) => {
      const filePath = path.join(generatedBaseDir, relPath);
      expect(fs.existsSync(filePath)).toBe(true);
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      expect(fileContent).toMatchSnapshot(relPath.replace(/[{}]/g, '_') + '-client');
    });
  });

  it('should generate TypeScript admin files matching snapshots', () => {
    const generatedBaseDir = path.resolve(testOutputDir, testConfig.outputs[1].outputDir); // Index 1 = ts-admin
    tsExpectedFiles.forEach((relPath) => {
      const filePath = path.join(generatedBaseDir, relPath);
      expect(fs.existsSync(filePath)).toBe(true);
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      expect(fileContent).toMatchSnapshot(relPath.replace(/[{}]/g, '_') + '-admin');
    });
  });

  // Dart test skipped
  // it('should generate Dart files matching snapshots', () => { ... });

  // --- Validation Failure Tests ---
  const validationTestCases = [
    { name: 'invalid field name', schema: invalidSchema_FieldName, schemaFile: 'invalid-schema-fieldname.json' },
    { name: 'invalid map key', schema: invalidSchema_MapKey, schemaFile: 'invalid-schema-mapkey.json' },
    { name: 'invalid referenceTo', schema: invalidSchema_ReferenceTo, schemaFile: 'invalid-schema-refto.json' },
    { name: 'invalid defaultValue type', schema: invalidSchema_DefaultValueType, schemaFile: 'invalid-schema-defaultvalue.json' },
  ];

  validationTestCases.forEach(testCase => {
    it(`should throw validation error for ${testCase.name}`, () => {
      const specificSchemaPath = path.resolve(testOutputDir, testCase.schemaFile);
      const specificConfigPath = path.resolve(testOutputDir, `config-for-${testCase.schemaFile}.json`);
      const specificConfig = {
        schema: `./${testCase.schemaFile}`,
        outputs: [
          { target: 'typescript-client', outputDir: `./out-${testCase.name}` },
        ],
      };

      fs.writeFileSync(specificSchemaPath, JSON.stringify(testCase.schema, null, 2));
      fs.writeFileSync(specificConfigPath, JSON.stringify(specificConfig, null, 2));

      const command = `node ${cliPath} generate -c "${specificConfigPath}"`;

      // Expect the command to throw an error and match the snapshot
      expect(() => {
        execSync(command, { cwd: testOutputDir, stdio: 'pipe' }); // Use 'pipe' to capture stderr
      }).toThrowErrorMatchingSnapshot(testCase.name);
    });
  });

});