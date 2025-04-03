/**
 * Represents the structure of the firestore-odm.config.json file.
 */
export interface FirestoreODMConfig {
  /** Path to the main schema definition file (relative to config file). */
  schema: string;
  /** Array of output targets for code generation. */
  outputs: OutputTarget[];
  /** Global options for the generator tool itself. */
  generatorOptions?: GeneratorOptions;
}

/**
 * Represents a single output target (e.g., TypeScript or Dart).
 */
export interface OutputTarget {
  /** Target language ('typescript' or 'dart'). */
  language: 'typescript' | 'dart';
  /** Output directory for the generated code (relative to config file). */
  outputDir: string;
  /** Optional: Info for generating package files (e.g., package.json, pubspec.yaml). */
  package?: PackageInfo;
  /** Language-specific generation options. */
  options?: TypeScriptOptions | DartOptions; // Use discriminated union based on language? Maybe later.
}

/**
 * Optional package information for generated outputs.
 */
export interface PackageInfo {
  name: string;
  version: string;
  description?: string;
  // Add other relevant fields like author, license etc. if needed later
}

/**
 * Language-specific options for TypeScript generation.
 */
export interface TypeScriptOptions {
  /** Generate the core runtime library. Defaults to true. */
  generateCore?: boolean;
  /** How to represent Firestore Timestamps ('Timestamp' or 'Date'). Defaults to 'Timestamp'. */
  dateTimeType?: 'Timestamp' | 'Date';
  // Add more TS-specific options here later
  /** Target SDK ('client' for firebase, 'admin' for firebase-admin). Defaults to 'client'. */
  sdk?: 'client' | 'admin';
}

/**
 * Language-specific options for Dart generation.
 */
export interface DartOptions {
  /** Generate the core runtime library. Defaults to true. */
  generateCore?: boolean;
  /** Generate null-safe Dart code. Defaults to true. */
  nullSafety?: boolean;
  // Add more Dart-specific options here later
}

/**
 * Global options for the generator tool.
 */
export interface GeneratorOptions {
  /** Logging level ('verbose', 'info', 'warn', 'error'). Defaults to 'info'. */
  logLevel?: 'verbose' | 'info' | 'warn' | 'error';
}

// Helper type guard to check language later if needed for options
export function isTypeScriptOptions(options: any): options is TypeScriptOptions {
    // Basic check, might need refinement
    return options && (options.dateTimeType !== undefined || typeof options.generateCore === 'boolean');
}

export function isDartOptions(options: any): options is DartOptions {
    // Basic check, might need refinement
    return options && (options.nullSafety !== undefined || typeof options.generateCore === 'boolean');
}