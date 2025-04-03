# Configuration (`fireschema.config.json`)

The FireSchema generator is configured using a JSON file, typically named
`fireschema.config.json`. This file tells the CLI where to find your schema and
how/where to generate the code for different targets.

## Example Configuration

```json
{
    "schema": "./path/to/your/firestore.schema.json", // Required: Path to schema file
    "outputs": [ // Required: Array of output targets
        {
            "target": "typescript-client", // Target identifier (e.g., 'typescript-client', 'typescript-admin', 'dart-client')
            "outputDir": "./src/generated/firestore-ts-client", // Directory for generated code
            "options": { // Optional target-specific options
                "dateTimeType": "Timestamp" // 'Timestamp' or 'Date' (default: 'Timestamp') for TS targets
            },
            "package": { // Optional: Generate package.json
                "name": "my-project-firestore-ts-client",
                "version": "1.0.0"
            }
        },
        {
            "target": "typescript-admin",
            "outputDir": "./src/generated/firestore-ts-admin",
            "options": {
                "dateTimeType": "Timestamp" // 'Timestamp' or 'Date' (default: 'Timestamp')
            }
            // "package": { ... } // Optional package generation
        },
        {
            "target": "dart-client",
            "outputDir": "./lib/generated/firestore_dart",
            "options": { // Optional Dart options
                "nullSafety": true // Generate null-safe code (default: true)
            },
            "package": { // Optional: Generate pubspec.yaml
                "name": "my_project_firestore_dart",
                "version": "1.0.0",
                "description": "Generated Dart ODM"
            }
        }
        // Add more targets as needed
    ],
    "generatorOptions": { // Optional global options
        "logLevel": "info" // 'verbose', 'info', 'warn', 'error' (default: 'info')
    }
}
```

## Configuration Options

- **`schema`** (Required, string):
  - Path to your `firestore.schema.json` file.
  - The path is relative to the location of the `fireschema.config.json` file
    itself.
- **`outputs`** (Required, array):
  - An array of output target objects, allowing you to generate code for
    multiple platforms/SDKs from the same schema.
  - Each object in the array defines one output target:
    - **`target`** (Required, string): Identifies the generation target.
      Determines which adapter and runtime library the generated code will use.
      Supported values:
      - `"typescript-client"`: For TypeScript projects using the Firebase Client
        SDK (`firebase` v9+).
      - `"typescript-admin"`: For TypeScript projects using the Firebase Admin
        SDK (`firebase-admin`).
      - `"dart-client"`: For Dart/Flutter projects using the `cloud_firestore`
        package.
    - **`outputDir`** (Required, string): The directory where the generated code
      for this target will be placed. The path is relative to the location of
      the `fireschema.config.json` file.
    - **`options`** (Optional, object): Language/target-specific generation
      options.
      - **TypeScript Client/Admin Options:**
        - `dateTimeType` (Optional, string, default: `"Timestamp"`): Specifies
          whether to use Firestore `Timestamp` (from `firebase/firestore` or
          `firebase-admin/firestore`) or JavaScript `Date` for timestamp fields
          in generated interfaces/classes. Using `Date` requires manual
          conversion when interacting with Firestore.
      - **Dart Client Options:**
        - `nullSafety` (Optional, boolean, default: `true`): Determines whether
          to generate null-safe Dart code (recommended).
    - **`package`** (Optional, object): If provided, generates a basic package
      manifest file (`package.json` for TS, `pubspec.yaml` for Dart) within the
      `outputDir`. This can be useful if you intend to treat the generated code
      as a separate, importable package.
      - `name` (Required, string): The name for the generated package.
      - `version` (Optional, string, default: `"0.1.0"`): The version for the
        generated package.
      - `description` (Optional, string): A description for the generated
        package.
- **`generatorOptions`** (Optional, object):
  - Global options that affect the generator's behavior.
  - `logLevel` (Optional, string, default: `"info"`): Controls the verbosity of
    console output during generation. Supported values: `"verbose"`, `"info"`,
    `"warn"`, `"error"`.
