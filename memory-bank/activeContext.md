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
- **Phase 3: Integration & Documentation (Partial)**
  - Added `workspaces` configuration to root `package.json`.
  - Ran `npm install` to link TS runtime workspace.
  - Ran `dart pub get` in Dart runtime package to fetch dependencies.
  - Updated `techContext.md` and `systemPatterns.md` in Memory Bank to reflect
    the new architecture.

**Next Steps / Considerations:**

- **Complete Runtime Refactoring (Current Task):**
  - Update `README.md` with new installation/usage instructions (mentioning
    runtime packages).
  - Update example project(s) to use the new structure.
  - Refine build process (ensure runtimes are built before generator, consider
    publishing setup).
  - Add tests for runtime libraries and update integration tests for generated
    code.
  - Update `progress.md`.
- **Post-Refactoring:**
  - Refine `fromJson`/`toJson` in Dart models for complex nested types.
  - Improve `AddData`/`UpdateData` type generation further (e.g., Dart defaults,
    read-only flags).
  - Improve error handling in generator and runtimes.
  - Address any remaining TODOs or known issues from `progress.md`.
