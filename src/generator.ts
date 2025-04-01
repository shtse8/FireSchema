import fs from 'fs';
import path from 'path';
import { FirestoreODMConfig, OutputTarget } from './types/config';
import { ParsedFirestoreSchema } from './types/schema';

// Placeholder imports for language-specific generators
import { generateTypeScript } from './generators/typescript';
import { generateDart } from './generators/dart';

/**
 * Main function to orchestrate the code generation process.
 * Iterates through output targets and calls the appropriate language generator.
 *
 * @param config The loaded and processed configuration object.
 * @param schema The loaded, validated, and parsed schema object.
 */
export async function generate(config: FirestoreODMConfig, schema: ParsedFirestoreSchema): Promise<void> {
  console.log('\nStarting code generation for all targets...');

  for (const outputTarget of config.outputs) {
    console.log(`\nProcessing target: ${outputTarget.language.toUpperCase()} -> ${outputTarget.outputDir}`);

    // Ensure output directory exists
    try {
      await fs.promises.mkdir(outputTarget.outputDir, { recursive: true });
      console.log(`Ensured output directory exists: ${outputTarget.outputDir}`);
    } catch (error: any) {
      throw new Error(`Failed to create output directory "${outputTarget.outputDir}": ${error.message}`);
    }

    switch (outputTarget.language) {
      case 'typescript':
        await generateTypeScript(outputTarget, schema, config);
        break;
      case 'dart':
        await generateDart(outputTarget, schema, config);
        break;
      default:
        // This should ideally be caught by config validation, but good to have a fallback
        console.warn(`Unsupported language target: ${outputTarget.language}. Skipping.`);
    }
  }

  console.log('\nCode generation process finished for all targets.');
}

// --- Placeholder Language-Specific Generators ---
// These will be moved to separate files later (e.g., src/generators/typescript.ts)

// async function generateTypeScript(target: OutputTarget, schema: ParsedFirestoreSchema, config: FirestoreODMConfig) {
//   console.log(`Generating TypeScript for ${target.outputDir}...`);
//   // 1. Load TS templates from templates/typescript/
//   // 2. Prepare data object for templates (schema, options)
//   // 3. Render templates using EJS
//   // 4. Write rendered files to target.outputDir
//   // 5. Optionally generate package.json
// }

// async function generateDart(target: OutputTarget, schema: ParsedFirestoreSchema, config: FirestoreODMConfig) {
//   console.log(`Generating Dart for ${target.outputDir}...`);
//   // 1. Load Dart templates from templates/dart/
//   // 2. Prepare data object for templates (schema, options)
//   // 3. Render templates using EJS
//   // 4. Write rendered files to target.outputDir
//   // 5. Optionally generate pubspec.yaml
// }