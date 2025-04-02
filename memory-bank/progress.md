# Progress: FireSchema (CI/CD Setup Complete)

**What Works:**

- **Core Functionality:**
  - CLI tool (`fireschema generate`) executes via Node.js/Bun.
  - Parses and validates configuration (`fireschema.config.json`) and schema
    (`firestore.schema.json`).
  - Generates strongly-typed TypeScript and Dart code (models, collection refs,
    query builders, update builders) based on the schema.
  - Subcollection generation works correctly for both languages.
- **Runtime Architecture:**
  - Separate, installable runtime libraries (`@shtse8/fireschema-runtime`,
    `fireschema_dart_runtime`) contain base logic.
  - Generated code correctly imports and extends/uses these runtime libraries.
  - Monorepo structure with npm workspaces is functional.
- **Build & Development:**
  - Refined build system using Bun for development speed and TSC for reliable
    CLI builds.
  - Project builds successfully, including runtime packages and the core tool.
  - Development tooling standardized on Bun, while maintaining Node.js
    compatibility for users.
- **Testing:**
  - **Runtime Unit Tests:** Comprehensive unit tests using Jest (TS) and
    `flutter test` (Dart) cover the base classes in the runtime libraries and
    are passing.
  - **Generator Snapshot Tests:** Snapshot tests using Jest verify the generated
    TypeScript output against stored snapshots and are passing.
  - **Dart Analysis:** Generated Dart code (`generated/dart`) and the Dart
    runtime package pass `dart analyze`.
  - **TypeScript Compilation:** Generated TypeScript code (`generated/ts`) and
    the TS runtime package compile successfully.
- **Documentation & Examples:**
  - Memory Bank files (`activeContext.md`, `techContext.md`,
    `systemPatterns.md`) updated.
  - `README.md` updated with current installation/usage.
  - Runtime package READMEs created (`packages/*/README.md`).
  - Dart runtime LICENSE and CHANGELOG created.
  - Example files (`examples/`) are up-to-date.
- **Publishing & CI/CD:**
  - GitHub Actions workflow (`.github/workflows/publish.yml`) created for
    automated build, test, and publish to npm/pub.dev on version tag push
    (`v*.*.*`).
  - Uses OIDC for secure pub.dev publishing (no token secret needed).
  - Requires `NPM_TOKEN` secret for npm publishing.
  - Initial version (0.1.0) of Dart runtime published manually.
  - CI/CD workflow successfully debugged and used to publish version 0.1.3.

**What's Left (Next Steps):**

- **Runtime Refinements:**
  - Address TODOs within runtime base classes (e.g., `add` method type handling,
    more default types).
  - Refine Dart `fromJson`/`toJson` for complex nested types (maps, arrays of
    references).
  - **Support updating nested map fields via dot notation in TS `UpdateBuilder`.
    (DONE)**
  - Improve `AddData`/`UpdateData` type generation (Dart defaults, read-only).
  - Support updating nested map fields via dot notation in TS `UpdateBuilder`.
- **Generator Enhancements:**
  - Support more complex validation rules from JSON Schema.
  - Improve error handling and reporting during generation.
- **Documentation & Publishing:**
  - Add more detailed documentation (advanced usage, schema details).
  - Prepare packages for publishing (consider build steps, versioning).
    **(DONE)**

**Current Status:**

The major runtime refactoring is **complete**. The core generator functionality
is working with the new architecture based on separate runtime libraries. The
testing strategy has successfully shifted to **unit tests for runtimes** and
**snapshot tests for generator output**. All existing tests are passing, and the
generated code for both TypeScript and Dart is clean and buildable according to
linters and compilers.

**Automated publishing via GitHub Actions is set up and functional.** Packages
(`@shtse8/fireschema`, `@shtse8/fireschema-runtime`, `fireschema_dart_runtime`)
are published to npm and pub.dev when a version tag (e.g., `v0.1.1`) is pushed.

**Known Issues:**

# (Removed - Verified 2025-04-02: Existing logic handles nested maps/objects and arrays of references correctly)

- **(Resolved 2025-04-02)** TypeScript `UpdateBuilder` now supports updating
  nested map fields via dot notation through generated methods (e.g.,
  `setAddressStreet`).
- **IDE Analysis Limitation:** Dart analyzer/IDE may show errors in
  `src/__tests__/dart-generated` due to path resolution issues from that
  specific directory, even though the generated code structure is correct.
- **Test Cleanup Flakiness:** Generator snapshot tests sometimes fail during
  cleanup (`fs.rmSync`) with `EBUSY` error (likely environmental/Windows issue).
