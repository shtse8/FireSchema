# Active Context: FireSchema (Runtime Refactoring In Progress)

**Current Focus:** Major refactoring to use separate, installable runtime
libraries (`@fireschema/ts-runtime`, `fireschema_dart_runtime`) instead of
generating all logic directly.

**Recent Changes (Runtime Refactoring):**

- **Phase 1: Setup & Runtime Library Creation**
  - Established package structure and config files (`package.json`,
    `tsconfig.json`, `pubspec.yaml`) for both `@fireschema/ts-runtime` and
    `fireschema_dart_runtime`.
  - Created initial base classes (`BaseCollectionRef`, `BaseQueryBuilder`,
    `BaseUpdateBuilder`) in both runtime packages, extracting common logic from
    old templates.
  - Created main export files (`index.ts`, `fireschema_dart_runtime.dart`) for
    runtime packages.
- **Phase 2: Refactor Generator & Templates**
  - Modified TypeScript generator (`src/generators/typescript.ts`) to prepare
    for runtime integration (imports, passing schema, commenting core
    generation, updating package.json generation).
  - Modified Dart generator (`src/generators/dart.ts`) similarly (placeholder
    imports, commenting core generation, updating pubspec.yaml generation).
  - Updated TypeScript EJS templates (`collectionRef.ejs`, `queryBuilder.ejs`,
    `updateBuilder.ejs`) to import and extend/use base classes from
    `@fireschema/ts-runtime`.
  - Updated Dart EJS templates (`collectionRef.dart.ejs`,
    `queryBuilder.dart.ejs`, `updateBuilder.dart.ejs`) to import and extend/use
    base classes from `fireschema_dart_runtime`.
- **Phase 3: Integration & Documentation**
  - Added `workspaces` configuration to root `package.json`.
  - Ran `npm install` to link TS runtime workspace.
  - Ran `dart pub get` in Dart runtime package to fetch dependencies.
  - Updated `techContext.md` and `systemPatterns.md` in Memory Bank to reflect
    the new architecture.
  - Updated `README.md` with new installation/usage instructions.
  - Updated example config (`examples/firestore-odm.config.json`) to remove
    `generateCore`.
  - Refined root build script (`package.json`) using `rimraf` for reliability.
- **Phase 4: Debugging & Refinement (Current)**
  - Debugged and fixed Dart generator errors related to `fileNameBase` and EJS
    syntax in templates (`collectionRef.dart.ejs`).
  - Debugged and fixed Dart analysis errors in generated code by:
    - Adding `fromFirestore`/`toFirestore` to `model.dart.ejs`.
    - Correcting null safety (`?`) for query parameters in
      `queryBuilder.dart.ejs`.
    - Correcting subcollection factory signature/call in
      `collectionRef.dart.ejs` and `base_collection_ref.dart`.
    - Updating `generated/dart/pubspec.yaml` to use local path dependency for
      runtime.
  - Successfully regenerated example code (`generated/`) without Dart analysis
    errors (except minor warnings/TODOs).
  - Added basic default value handling (string, num, bool) to `applyDefaults` in
    Dart runtime (`base_collection_ref.dart`).
  - Set up basic test infrastructure (Jest for TS runtime, `test` package for
    Dart runtime) with placeholder tests passing.

**Next Steps / Considerations:**

- **Testing:**
  - Write comprehensive unit tests for runtime library base classes
    (`@fireschema/ts-runtime`, `fireschema_dart_runtime`).
  - Add integration tests for the generated code (using the example project or a
    dedicated test project) to verify interaction with runtime libraries and
    Firestore (potentially using emulators or fakes).
- **Runtime Refinements:**
  - Address TODOs within runtime base classes (e.g., `add` method type handling,
    more default types).
  - Refine Dart `fromJson`/`toJson` for complex nested types (maps, arrays of
    references).
  - Improve `AddData`/`UpdateData` type generation (Dart defaults, read-only).
  - Support updating nested map fields via dot notation in TS `UpdateBuilder`.
- **Generator Enhancements:**
  - Support more complex validation rules from JSON Schema.
  - Improve error handling and reporting during generation.
- **Documentation & Publishing:**
  - Add more detailed documentation (advanced usage, schema details).
  - Prepare packages for publishing (consider build steps, versioning).
- **Update `progress.md`** (Will be done after this Memory Bank update).
- **Post-Refactoring:**
  - Refine `fromJson`/`toJson` in Dart models for complex nested types.
  - Improve `AddData`/`UpdateData` type generation further (e.g., Dart defaults,
    read-only flags).
  - Improve error handling in generator and runtimes.
  - Address any remaining TODOs or known issues from `progress.md`.
