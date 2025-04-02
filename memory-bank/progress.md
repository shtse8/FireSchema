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

**What's Left (High Level):**

- **Refactor to Runtime Libraries (In Progress):**
  - Build/Link runtime packages correctly within the monorepo (Build process
    improved, linking seems okay via `npm install`).
  - Write unit tests for runtime libraries (infrastructure ready).
  - Write integration tests for generated code (infrastructure ready).
  - ~~Update `README.md` and examples.~~ (Done)
  - Refine runtime base class implementations (e.g., Dart `add` method, schema
    passing).
  - Address TODOs within runtime base classes.
- Refinements to Dart `fromJson`/`toJson` for complex nested types.
- Refinements to `AddData`/`UpdateData` types (especially Dart
  defaults/read-only).
- Comprehensive testing (Unit tests for runtimes - infrastructure ready;
  Integration tests - infrastructure ready).
- Robust error handling and reporting.
- Documentation improvements (advanced usage, schema details).

**Current Status:** The core code structure for the runtime libraries and the
updated generators/templates is in place. The build process has been refined,
documentation (`README.md`) and examples (`examples/`) have been updated, and
the generator successfully produces code using the runtime approach, and the
generated Dart code passes static analysis. Basic test infrastructure is now in
place for the runtime libraries. The next steps involve writing actual unit and
integration tests, and addressing further runtime refinements (like TODOs).

**Known Issues:**

- (Existing) Dart `fromJson`/`toJson` needs better handling for nested
  types/references.
- (Existing) Type safety for `whereIn`, `notIn`, `arrayContainsAny` value
  parameters in Dart query builder could be improved (may be partially addressed
  by runtime).
- (Existing) TypeScript `UpdateBuilder` doesn't easily support updating nested
  map fields via dot notation yet (may need runtime enhancement).
- ~~(Resolved) Build process for monorepo (linking TS runtime, building
  runtimes) needs implementation/verification.~~ (Build script improved, seems
  functional).
- ~~(Resolved) Dart runtime dependency errors persist...~~ (Generator errors
  fixed, runtime dependency itself is handled by user install).
- ~~(Resolved) Null safety issues identified in existing generated Dart query
  code...~~ (Fixed by making parameters nullable in template).
