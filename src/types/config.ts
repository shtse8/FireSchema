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

// Define allowed target strings (can be extended)
export type TargetString =
  | 'typescript-client'
  | 'typescript-admin'
  | 'dart-client'
  // Add future targets like 'dart-server-rest', 'csharp-client', etc.
  | string; // Allow custom targets

/**
 * Represents a single output target defined by a target string.
 */
export interface OutputTarget {
  /**
   * Required string identifying the generation target adapter.
   * Examples: 'typescript-client', 'typescript-admin', 'dart-client'.
   * Determines which internal adapter logic is used.
   */
  target: TargetString;
  /** Output directory for the generated code (relative to config file). */
  outputDir: string;
  /** Optional: Info for generating package files (e.g., package.json, pubspec.yaml). */
  package?: PackageInfo;
  /**
   * Optional: Adapter-specific options.
   * The structure depends on the requirements of the specified 'target' adapter.
   * Example for 'typescript-*' targets: { dateTimeType?: 'Timestamp' | 'Date' }
   * Example for 'dart-*' targets: { nullSafety?: boolean }
   */
  options?: Record<string, any>;
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

// Removed TypeScriptOptions and DartOptions interfaces

/**
 * Global options for the generator tool.
 */
export interface GeneratorOptions {
  /** Logging level ('verbose', 'info', 'warn', 'error'). Defaults to 'info'. */
  logLevel?: 'verbose' | 'info' | 'warn' | 'error';
}

// Removed language-specific type guards (isTypeScriptOptions, isDartOptions)