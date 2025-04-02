# Technical Context: FireSchema (Runtime Refactor)

**Core Generator Tool:**

- **Language:** TypeScript
- **Runtime:** Node.js (for CLI execution via `npx`)
- **Key Libraries:**
  - `commander`: CLI argument parsing and command structure.
  - `ajv`: JSON Schema validation for user-provided schema files.
  - `ejs`: Templating engine for code generation.
- **Compilation:** TypeScript compiled to JavaScript (`dist/` directory) using
  `tsc`.
- **Monorepo Structure:** Uses npm workspaces to manage the core tool and
  runtime packages (`packages/*`).

**Schema Definition:**

- **Format:** JSON Schema (Draft 7 recommended).
- **File:** User-defined (e.g., `firestore.schema.json`).
- **Validation:** Validated against `src/schema-definition.json` using `ajv`.

**Configuration:**

- **Format:** JSON.
- **File:** User-defined, specified via `-c` flag (e.g.,
  `fireschema.config.json`).
- **Structure:** Contains `schema` path and an `outputs` array.

**Runtime Libraries:**

- **Purpose:** Contain the common, reusable logic for interacting with Firestore
  (base classes for collection references, query builders, update builders).
  Generated code imports and extends/uses these base classes.
- **TypeScript Runtime (`@fireschema/ts-runtime`):**
  - Located in `packages/fireschema-ts-runtime`.
  - Provides `BaseCollectionRef`, `BaseQueryBuilder`, `BaseUpdateBuilder`.
  - Published as an npm package.
  - **Peer Dependency:** `firebase` (^9.0.0 || ^10.0.0 || ^11.0.0).
- **Dart Runtime (`fireschema_dart_runtime`):**
  - Located in `packages/fireschema_dart_runtime`.
  - Provides equivalent base classes/mixins for Dart.
  - Published as a pub package.
  - **Dependency:** `cloud_firestore`, `meta`.

**Generated Code Targets:**

1. **TypeScript:**
   - **Dependencies:** Relies on the `firebase` package AND the
     `@fireschema/ts-runtime` package being installed in the user's project.
   - **Output Files (per collection):**
     - `[collection].types.ts`: Model interface (`<ModelName>Data`).
     - `[collection].collection.ts`: Collection reference class
       (`<ModelName>Collection`) extending `BaseCollectionRef`.
     - `[collection].query.ts`: Query builder class (`<ModelName>QueryBuilder`)
       extending `BaseQueryBuilder`.
     - `[collection].update.ts`: Update builder class
       (`<ModelName>UpdateBuilder`) extending `BaseUpdateBuilder`.
   - **Core File:** No longer generated (`core.ts` removed). Runtime logic is in
     `@fireschema/ts-runtime`.
   - **Naming:** PascalCase for classes, camelCase for filenames (by default).
   - **Subcollections:** Generated in nested directories reflecting the path
     (e.g., `users/{userId}/posts.collection.ts`). Parent collection class
     includes accessor methods using runtime helpers.

2. **Dart:**
   - **Dependencies:** Relies on the `cloud_firestore` package AND the
     `fireschema_dart_runtime` package being installed in the user's
     Flutter/Dart project.
   - **Output Files (per collection):**
     - `[collection]_data.dart`: Model class (`<ModelName>Data`) with
       `fromJson`/`toJson`/`copyWith`.
     - `[collection]_collection.dart`: Collection reference class
       (`<ModelName>Collection`) extending `BaseCollectionRef`.
     - `[collection]_query.dart`: Query builder class
       (`<ModelName>QueryBuilder`) extending `BaseQueryBuilder`.
     - `[collection]_update.dart`: Update builder class
       (`<ModelName>UpdateBuilder`) extending `BaseUpdateBuilder`.
   - **Core File:** No longer generated (`firestore_odm_core.dart` removed).
     Runtime logic is in `fireschema_dart_runtime`.
   - **Naming:** PascalCase for classes, snake_case for filenames.
   - **Subcollections:** Generated in nested directories (e.g.,
     `users/posts_collection.dart`). Parent collection class includes accessor
     methods using runtime helpers.

**Development Environment:**

- Node.js / npm (with workspaces) for building and running the generator and
  runtime packages.
- TypeScript for core tool and TS runtime development.
- Dart SDK for Dart runtime development.
