# Progress: FireSchema (Pivoting to Executor + Adapter Architecture)

**What Works:**

- **Core Functionality:**
  - CLI tool (`fireschema generate`) executes via Node.js/Bun.
  - Parses and validates configuration (`fireschema.config.json`) and schema
    (`firestore.schema.json`).
  - _Previous architecture_ generated TS/Dart code (models, wrappers) using
    separate runtime libraries.
  - Subcollection generation worked correctly.
- **Runtime Architecture (Previous):**
  - Separate, installable runtime libraries (`@shtse8/fireschema-runtime`,
    `fireschema_dart_runtime`) contained base logic.
  - Monorepo structure with npm workspaces is functional.
- **Build & Development:**
  - Build system using Bun/TSC is functional for the previous architecture.
  - Development tooling standardized on Bun.
- **Testing (Previous Architecture):**
  - Generator snapshot tests (`src/__tests__/generator.test.ts`) pass after
    fixing import issues (`fs`, `path`). Snapshots updated for new runtime
    dependencies.
  - Expanded unit tests for `ts-client-runtime` and `ts-admin-runtime` base
    classes (`baseCollection.test.ts`, `baseQueryBuilder.test.ts`,
    `baseUpdateBuilder.test.ts`).
  - Initial integration test files (`client.integration.test.ts`,
    `admin.integration.test.ts`) created for `ts-client-runtime` and
    `ts-admin-runtime`, configured for Firestore emulator.
  - Dart analysis and TS compilation pass for generated code and runtimes.
- **Publishing & CI/CD:**
  - GitHub Actions workflow is functional for building, testing (with known
    issues), and publishing existing packages (`@shtse8/fireschema`,
    `@shtse8/fireschema-runtime`, `fireschema_dart_runtime`) on version tags.
- **Partial TS Admin Support (Committed but Superseded):**
  - TS Runtime (`@shtse8/fireschema-runtime`) was refactored for dual SDK
    support.
  - Config/Generator/Templates were updated for `sdk` option.
- **Dart EJS Fix:**
  - Resolved persistent EJS parsing error in Dart model template.

**What's Left (New Refactoring Plan):**

1. **Architectural Refactor (Executor + Adapter Pattern):** - **HIGHEST
   PRIORITY**
   - **Phase 1: Update Config & Core Generator:** ✅ **COMPLETED**
     - Modified config (`src/types/config.ts`, `src/configLoader.ts`) to use
       `target` string (e.g., `'typescript-client'`).
     - Rewrote core generator (`src/generator.ts`) as an orchestrator
       loading/calling adapters based on `target`.
   - **Phase 2: Create/Refactor Adapters:** ✅ **COMPLETED**
     - Created `src/adapters/` directory.
     - Moved/Refactored logic into new adapter files (`typescript-client.ts`,
       `typescript-admin.ts`, `dart-client.ts`).
     - Ensured adapters load their own templates and handle target-specific
       logic.
   - **Phase 3: Update/Implement Tests:** ✅ **COMPLETED (Initial Setup &
     Fixes)**
     - Updated `src/__tests__/generator.test.ts` for new config format and fixed
       import errors. Snapshots updated.
     - Created initial unit and integration test files for `ts-client-runtime`
       and `ts-admin-runtime`.
     - **Resolved Jest Transformation Issues:** Switched Jest configuration from
       `ts-jest` to `babel-jest` for both `ts-client-runtime` and
       `ts-admin-runtime` projects, adding necessary Babel dependencies and
       `babel.config.cjs` files to each package. This resolved persistent
       TypeScript syntax parsing errors.
     - **All TS runtime unit and integration tests now pass** when run with
       `npx jest`.
     - ~~**Next:** Expand unit test coverage for TS runtime packages.~~
       **(Done)**
     - **Next:** Expand integration test coverage for TS runtime packages.
     - **Next:** Expand unit/integration test coverage for Dart runtime package.
     - Persistent test environment issues (`jest.mock` errors) remain when using
       `bun test`. (Deferring resolution, using `npx jest` for now).
   - **Phase 4: Update Memory Bank & Documentation:** ✅ **COMPLETED**
     - Updated `activeContext.md`, `progress.md`, `systemPatterns.md`,
       `techContext.md` to reflect the Executor + Adapter architecture and the
       split-template approach.
   - **Phase 5: Refactor TS Runtime (Independent Runtimes):** ✅ **COMPLETED**
     - Abandoned "Interface Package" approach due to SDK structural differences.
     - Deleted `@shtse8/fireschema-core-types`.
     - Rewrote `@shtse8/fireschema-ts-client-runtime` to be fully self-contained
       and use `firebase` v9+ functions.
     - Rewrote `@shtse8/fireschema-ts-admin-runtime` to be fully self-contained
       and use `firebase-admin` methods.
     - Updated `typescript-client` and `typescript-admin` adapters and templates
       to use their respective independent runtimes.
     - Updated `package.json` files for dependencies (using direct SDK
       dependencies, removed peerDependencies for SDKs).
     - Updated `tsconfig.json` files for project references.
     - Successfully built the project (`tsc -b`).
2. **Generator Enhancements (Post-Refactor):**
   - Support more complex validation rules.
   - Improve error handling.
3. **Documentation (Post-Refactor):** ✅ **COMPLETED (Initial VitePress Setup)**
   - Replaced TypeDoc with VitePress.
   - Created initial site structure, config, homepage, and basic guide pages in
     `docs-src/`.
   - Configured GitHub Actions to build and deploy VitePress site to GitHub
     Pages.
   - **Next:** Populate documentation with more detailed content.

**Current Status:**

**Executor + Adapter Refactor Complete (Phases 1-4):** The initial refactor to
the Executor + Adapter pattern, including splitting templates and updating
initial documentation, is complete.

**Decision & Outcome:** Initial plan was to use an "Interface Package", but
further analysis revealed significant structural differences between Client v9+
and Admin SDKs, making shared interfaces impractical. Switched to **fully
independent** TS Client and TS Admin runtime packages.

**Current focus:** Unit test expansion for runtime base classes is complete. The
next step is to expand the **integration test** coverage for the runtime
packages.

**Known Issues:**

- **Test Runner Incompatibility:**
  - (Removed fixed `fs` import issue)
  - `TypeError: jest.mock is not a function` in runtime package tests when run
    via `bun test`. Tests pass when run with `npx jest`. (Deferring resolution,
    using `npx jest`).
- **IDE Analysis Limitation:** Dart analyzer/IDE may show errors in
  `src/__tests__/dart-generated` due to path resolution issues.
- **Test Cleanup Flakiness:** Generator snapshot tests sometimes fail during
  cleanup (`fs.rmSync`) with `EBUSY` error. (Cleanup currently disabled in
  test).
