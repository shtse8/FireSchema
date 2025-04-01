# Technical Context: FireSchema

**Core Generator Tool:**

- **Language:** TypeScript
- **Runtime:** Node.js (for CLI execution via `npx`)
- **Key Libraries:**
  - `commander`: CLI argument parsing and command structure.
  - `ajv`: JSON Schema validation for user-provided schema files.
  - `ejs`: Templating engine for code generation.
- **Compilation:** TypeScript compiled to JavaScript (`dist/` directory) using
  `tsc`.

**Schema Definition:**

- **Format:** JSON Schema (Draft 7 recommended).
- **File:** User-defined (e.g., `firestore.schema.json`).
- **Validation:** Validated against `src/schema-definition.json` using `ajv`.

**Configuration:**

- **Format:** JSON.
- **File:** User-defined, specified via `-c` flag (e.g.,
  `fireschema.config.json`).
- **Structure:** Contains `schema` path and an `outputs` array.

**Generated Code Targets:**

1. **TypeScript:**
   - **Dependencies:** Relies on the `firebase` package (specifically
     `firebase/firestore` types and functions) being installed in the user's
     project.
   - **Output Files (per collection):**
     - `[collection].types.ts`: Model interface (`<ModelName>Data`).
     - `[collection].collection.ts`: Collection reference class
       (`<ModelName>Collection`).
     - `[collection].query.ts`: Query builder class (`<ModelName>QueryBuilder`).
     - `[collection].update.ts`: Update builder class
       (`<ModelName>UpdateBuilder`).
   - **Core File:** `core.ts` (re-exports common types/functions).
   - **Naming:** PascalCase for classes, camelCase for filenames (by default).

2. **Dart:**
   - **Dependencies:** Relies on the `cloud_firestore` package being installed
     in the user's Flutter/Dart project.
   - **Output Files (per collection):**
     - `[collection]_data.dart`: Model class (`<ModelName>Data`) with
       `fromJson`/`toJson`/`copyWith`.
     - `[collection]_collection.dart`: Collection reference class
       (`<ModelName>Collection`) using `withConverter`.
     - `[collection]_query.dart`: Query builder class
       (`<ModelName>QueryBuilder`).
     - `[collection]_update.dart`: Update builder class
       (`<ModelName>UpdateBuilder`).
   - **Core File:** `firestore_odm_core.dart` (exports common types/functions).
   - **Naming:** PascalCase for classes, snake_case for filenames.

**Development Environment:**

- Node.js / npm for building and running the generator.
- TypeScript for development.
