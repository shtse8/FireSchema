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
  - Runtime unit tests passed when run with `npx jest`.
  - Generator snapshot tests passed for TS (client) and Dart after EJS fix. TS
    Admin snapshots were generated.
  - Dart analysis and TS compilation passed for generated code and runtimes.
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
   - **Phase 1: Update Config & Core Generator:**
     - Modify config (`src/types/config.ts`, `src/configLoader.ts`) to use
       `target` string (e.g., `'typescript-client'`).
     - Rewrite core generator (`src/generator.ts`) as an orchestrator
       loading/calling adapters based on `target`.
   - **Phase 2: Create/Refactor Adapters:**
     - Create `src/adapters/` directory.
     - Move/Refactor logic from old `src/generators/` into new adapter files
       (`typescript-client.ts`, `typescript-admin.ts`, `dart-client.ts`).
     - Ensure adapters load their own templates and handle target-specific
       logic.
   - **Phase 3: Update Tests:**
     - Update `src/__tests__/generator.test.ts` for new config format.
     - Verify/Update snapshots.
     - Address persistent test environment issues (`fs` syntax error,
       `jest.mock` errors) - potentially by standardizing on `npx jest`.
   - **Phase 4: Update Memory Bank & Documentation:**
     - Update all relevant `.md` files (`activeContext.md`, `progress.md`,
       `systemPatterns.md`, `techContext.md`) to reflect the new architecture.
2. **Generator Enhancements (Post-Refactor):**
   - Support more complex validation rules.
   - Improve error handling.
3. **Documentation (Post-Refactor):**
   - Add detailed documentation for the new architecture, adapters, and usage.

**Current Status:**

**Pivot:** The project has pivoted to a new **Executor + Adapter** architecture.
Progress on the previous approach (adding TS Admin support via runtime changes)
has been committed but is now superseded by this major refactoring plan. The
**current focus is implementing Phase 1** of the new plan: modifying the
configuration structure and rewriting the core generator (`src/generator.ts`) to
act as an orchestrator that calls internal adapter modules.

**Known Issues:**

- **Test Runner Incompatibility:**
  - `SyntaxError: Unexpected token '*'` related to `fs` import in
    `src/__tests__/generator.test.ts` when run via `bun test`. (Ignored for
    now).
  - `TypeError: jest.mock is not a function` in runtime package tests when run
    via `bun test`. Tests pass when run with `npx jest`. (To be addressed in
    Phase 3).
- **IDE Analysis Limitation:** Dart analyzer/IDE may show errors in
  `src/__tests__/dart-generated` due to path resolution issues.
- **Test Cleanup Flakiness:** Generator snapshot tests sometimes fail during
  cleanup (`fs.rmSync`) with `EBUSY` error. (Cleanup currently disabled in
  test).
