import fs from 'fs';
import path from 'path';
import { FirestoreODMConfig, OutputTarget } from './types/config';

/**
 * Loads, parses, and validates the Firestore ODM configuration file.
 * Resolves relative paths within the config to absolute paths.
 *
 * @param configPath Absolute path to the configuration file.
 * @returns The validated and processed configuration object.
 * @throws Error if the config file is not found, invalid JSON, or fails basic validation.
 */
export function loadConfig(configPath: string): FirestoreODMConfig {
  if (!fs.existsSync(configPath)) {
    throw new Error(`Configuration file not found at: ${configPath}`);
  }

  let configContent: string;
  try {
    configContent = fs.readFileSync(configPath, 'utf-8');
  } catch (error: any) {
    throw new Error(`Failed to read configuration file: ${error.message}`);
  }

  let parsedConfig: any;
  try {
    parsedConfig = JSON.parse(configContent);
  } catch (error: any) {
    throw new Error(`Failed to parse configuration file as JSON: ${error.message}`);
  }

  // --- Basic Validation ---
  if (!parsedConfig.schema || typeof parsedConfig.schema !== 'string') {
    throw new Error('Configuration must include a valid "schema" property (string path).');
  }
  if (!Array.isArray(parsedConfig.outputs) || parsedConfig.outputs.length === 0) {
    throw new Error('Configuration must include a non-empty "outputs" array.');
  }

  // TODO: Add more robust validation using JSON schema (e.g., with ajv)

  const configDir = path.dirname(configPath);

  // Resolve paths relative to the config file location
  const resolvedSchemaPath = path.resolve(configDir, parsedConfig.schema);

  const resolvedOutputs = parsedConfig.outputs.map((output: OutputTarget) => {
    if (!output.language || !['typescript', 'dart'].includes(output.language)) {
      throw new Error(`Output target must have a valid "language" ('typescript' or 'dart'). Found: ${output.language}`);
    }
    if (!output.outputDir || typeof output.outputDir !== 'string') {
      throw new Error(`Output target for language "${output.language}" must have a valid "outputDir" (string path).`);
    }
    return {
      ...output,
      outputDir: path.resolve(configDir, output.outputDir),
    };
  });

  const finalConfig: FirestoreODMConfig = {
    ...parsedConfig,
    schema: resolvedSchemaPath,
    outputs: resolvedOutputs,
  };

  // --- Post-resolution Validation ---
  if (!fs.existsSync(finalConfig.schema)) {
     console.warn(`Warning: Schema file specified in config not found at resolved path: ${finalConfig.schema}. Generation might fail.`);
     // Decide if this should be a hard error or just a warning
     // throw new Error(`Schema file specified in config not found at resolved path: ${finalConfig.schema}`);
  }


  console.log(`Successfully loaded and validated config from: ${configPath}`);
  // console.log('Resolved config:', JSON.stringify(finalConfig, null, 2)); // For debugging

  return finalConfig;
}