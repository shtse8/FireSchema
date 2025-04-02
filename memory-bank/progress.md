# Progress: FireSchema (Runtime Refactoring In Progress)

**What Works:**

- Core CLI tool (`fireschema generate`) execution via Node.js.
- Parsing and validation of `fireschema.config.json`.
- Parsing and validation of `firestore.schema.json`.
- **Runtime Library Setup:**
  - `@fireschema/ts-runtime` package structure created (`package.json`,
    `tsconfig.json`).
  - `fireschema_dart_runtime` package structure created (`pubspec.yaml`).
  - Base classes (`BaseCollectionRef`, `BaseQueryBuilder`, `BaseUpdateBuilder`)
    created in both runtimes.
  - Dependencies installed for Dart runtime (`dart pub get`).
  - Root `package.json` configured for workspaces, `npm install` run.
- **Generator Refactoring (Code Structure):**
  - TypeScript generator (`typescript.ts`) updated to import from runtime
    (linking pending build).
  - Dart generator (`dart.ts`) updated with placeholder imports for runtime.
  - Core file generation (`core.ts`, `firestore_odm_core.dart`) commented out.
  - Optional package manifest generation updated to include runtime
    dependencies.
- **Template Refactoring (Code Structure):**
  - TypeScript templates (`.ejs`) updated to import/extend runtime base classes.
  - Dart templates (`.dart.ejs`) updated to import/extend runtime base classes.
- Generation of model/type files (`.types.ts`, `_data.dart`) remains functional.
- Subcollection generation logic structure remains in generators.
- Example schema and config files are functional for parsing
  (`examples/firestore-odm.config.json` updated to remove `generateCore`).
- Memory Bank files (`techContext.md`, `systemPatterns.md`, `activeContext.md`)
  updated for new architecture.
- **README.md updated** with new installation/usage instructions reflecting
  runtime packages.
- **Generated code in `generated/` successfully regenerated** using the updated
  example config and runtime-refactored generator (Dart analysis errors
  resolved).
- **Build process refined** in root `package.json` for better reliability
  (clean, build workspaces, build root).
- **Basic test infrastructure set up** for both runtime packages:
  - Jest configured for `@fireschema/ts-runtime`.
  - Dart `test` package confirmed for `fireschema_dart_runtime`.
  - Placeholder tests pass in both packages.
- **Development Tooling Updated:** Switched to Bun for development tasks
  (builds, scripts, installs) for better performance, while maintaining Node.js
  compatibility for published packages.

**What's Left (Next Steps):**

- **Testing (Infrastructure Ready):**
  - Write comprehensive unit tests for runtime library base classes
    (`@fireschema/ts-runtime`, `fireschema_dart_runtime`).
  - Write integration tests for the generated code (using examples or dedicated
    test project, potentially with emulators/fakes).
- **Runtime & Generator Refinements:**
  - Address TODOs within runtime base classes (e.g., `add` method type handling,
    more default types).
  - Refine Dart `fromJson`/`toJson` for complex nested types (maps, arrays of
    references).
  - Improve `AddData`/`UpdateData` type generation (Dart defaults, read-only).
  - Support updating nested map fields via dot notation in TS `UpdateBuilder`.
  - Support more complex validation rules from JSON Schema in the generator.
  - Improve error handling and reporting during generation and in runtimes.
- **Documentation & Publishing:**
  - Add more detailed documentation (advanced usage, schema details).
  - Prepare packages for publishing (consider build steps, versioning).

**Current Status:** The major refactoring to use separate runtime libraries is
structurally complete. Generators and templates have been updated, the build
process works, documentation (`README.md`, Memory Bank) and examples reflect the
new architecture, and generated code (including Dart) passes basic checks.
Development tooling has been switched to Bun for performance. Basic test
infrastructure is set up for both runtime packages. The immediate focus shifts
to implementing comprehensive tests and refining the runtime libraries.

**Known Issues:**

- (Existing) Dart `fromJson`/`toJson` needs better handling for nested
  types/references.
- (Existing) Type safety for `whereIn`, `notIn`, `arrayContainsAny` value
  parameters in Dart query builder could be improved (may be partially addressed
  by runtime).
- (Existing) TypeScript `UpdateBuilder` doesn't easily support updating nested
  map fields via dot notation yet (may need runtime enhancement).
- (No critical unresolved issues blocking next steps; existing items are
  refinement targets)
