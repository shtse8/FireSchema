import fs from 'fs';
import path from 'path';
import { FirestoreODMConfig, OutputTarget } from './types/config';
import { ParsedFirestoreSchema } from './types/schema';

// Define the expected interface for an adapter module
interface AdapterModule {
  generate(target: OutputTarget, schema: ParsedFirestoreSchema, config: FirestoreODMConfig): Promise<void>;
}

/**
 * Main function to orchestrate the code generation process.
 * Iterates through output targets, loads the appropriate adapter,
 * and calls its generate function.
 *
 * @param config The loaded and processed configuration object.
 * @param schema The loaded, validated, and parsed schema object.
 */
export async function generate(config: FirestoreODMConfig, schema: ParsedFirestoreSchema): Promise<void> {
  console.log('\nStarting code generation for all targets...');

  for (const outputTarget of config.outputs) {
    console.log(`\nProcessing target: ${outputTarget.target} -> ${outputTarget.outputDir}`);

    // Ensure output directory exists
    try {
      await fs.promises.mkdir(outputTarget.outputDir, { recursive: true });
      console.log(`Ensured output directory exists: ${outputTarget.outputDir}`);
    } catch (error: any) {
      throw new Error(`Failed to create output directory "${outputTarget.outputDir}": ${error.message}`);
    }

    let adapter: AdapterModule | null = null;
    let adapterPath = ''; // For error reporting

    try {
      // Dynamically import the correct adapter based on the target string
      switch (outputTarget.target) {
        case 'typescript-client':
          adapterPath = './adapters/typescript-client'; // Relative path from dist/generator.js
          adapter = await import(adapterPath);
          break;
        case 'typescript-admin':
          adapterPath = './adapters/typescript-admin';
          adapter = await import(adapterPath);
          break;
        case 'dart-client':
          adapterPath = './adapters/dart-client';
          adapter = await import(adapterPath);
          break;
        case 'csharp-client':
          adapterPath = './adapters/csharp-client';
          adapter = await import(adapterPath);
          break;
        // Add cases for future targets here
        // case 'dart-server-rest':
        //   adapterPath = './adapters/dart-server-rest'; // Example
        //   adapter = await import(adapterPath);
        //   break;
        default:
          console.warn(`Unsupported target: ${outputTarget.target}. Skipping.`);
      }

      // Execute the adapter's generate function if found
      if (adapter && typeof adapter.generate === 'function') {
        await adapter.generate(outputTarget, schema, config);
      } else if (outputTarget.target && !adapter) {
          // Log warning only if target was specified but adapter wasn't loaded (e.g., unsupported target)
          console.warn(`No adapter found or loaded for target: ${outputTarget.target}. Skipping.`);
      }
    } catch (error: any) {
        // Log detailed error including which adapter failed
        console.error(`\n--- Error processing target "${outputTarget.target}" ---`);
        if (adapterPath) {
            console.error(`Adapter Path: ${adapterPath}`);
        }
        console.error(`Error Message: ${error.message}`);
        if (error.stack) {
            console.error(`Stack Trace:\n${error.stack}`);
        }
        // Re-throw to halt the entire generation process on adapter error
        throw new Error(`Failed to generate code for target "${outputTarget.target}". See logs for details.`);
    }
  }

  console.log('\nCode generation process finished for all targets.');
}