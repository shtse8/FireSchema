import fs from 'fs';
import path from 'path';
// Import only base types, removed TypeScriptOptions
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

  // Define known targets (can be expanded)
  const knownTargets = ['typescript-client', 'typescript-admin', 'dart-client'];

  const resolvedOutputs = parsedConfig.outputs.map((output: any): OutputTarget => { // Use any initially for validation
    // Validate target property
    if (!output.target || typeof output.target !== 'string') {
      throw new Error(`Output target must have a valid string "target" property. Found: ${JSON.stringify(output.target)}`);
    }
    // Optional: Validate against known targets if desired, or allow custom strings
    // if (!knownTargets.includes(output.target)) {
    //   console.warn(`Warning: Unknown target "${output.target}". Proceeding, but ensure a corresponding adapter exists.`);
    // }

    // Validate outputDir
    if (!output.outputDir || typeof output.outputDir !== 'string') {
      throw new Error(`Output target for target "${output.target}" must have a valid "outputDir" (string path).`);
    }

    // Validate options (ensure it's an object if present)
    if (output.options && typeof output.options !== 'object') {
        throw new Error(`Output target for target "${output.target}" has invalid "options". Must be an object.`);
    }

    // Validate package info (ensure it's an object if present)
     if (output.package && typeof output.package !== 'object') {
        throw new Error(`Output target for target "${output.target}" has invalid "package". Must be an object.`);
    }
     if (output.package && (!output.package.name || typeof output.package.name !== 'string')) {
         throw new Error(`Output target for target "${output.target}" has invalid "package.name". Must be a string.`);
     }
      if (output.package && (!output.package.version || typeof output.package.version !== 'string')) {
         throw new Error(`Output target for target "${output.target}" has invalid "package.version". Must be a string.`);
     }


    // Return the processed output target, ensuring options is an object
    return {
      target: output.target,
      outputDir: path.resolve(configDir, output.outputDir),
      package: output.package, // Pass through package info
      options: output.options || {}, // Ensure options is always an object
    };
  });

  const finalConfig: FirestoreODMConfig = {
    ...parsedConfig,
    schema: resolvedSchemaPath,
    outputs: resolvedOutputs,
  };

  // --- Post-resolution Validation ---
  if (!fs.existsSync(finalConfig.schema)) {
     throw new Error(`Schema file specified in config not found at resolved path: ${finalConfig.schema}`);
  }


  console.log(`Successfully loaded and validated config from: ${configPath}`);
  // console.log('Resolved config:', JSON.stringify(finalConfig, null, 2)); // For debugging

  return finalConfig;
}