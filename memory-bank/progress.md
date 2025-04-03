# Progress: FireSchema (Documentation Restructure Complete)

**What Works:**

-   **Core Functionality:**
    -   CLI tool (`fireschema generate`) executes via Node.js/Bun.
    -   Parses and validates configuration (`fireschema.config.json`) and schema (`firestore.schema.json`).
    -   Executor + Adapter architecture correctly generates code for `typescript-client`, `typescript-admin`, and `dart-client` targets.
    -   Subcollection generation works correctly.
-   **Runtime Architecture:**
    -   Separate, independent, installable runtime libraries (`@shtse8/fireschema-ts-client-runtime`, `@shtse8/fireschema-ts-admin-runtime`, `fireschema_dart_runtime`) contain base logic for each target.
    -   Monorepo structure with npm workspaces is functional.
-   **Build & Development:**
    -   Build system using Bun/TSC (`tsc -b`) successfully builds all packages.
    -   Development tooling standardized on Bun.
-   **Testing:**
    -   Generator snapshot tests (`src/__tests__/generator.test.ts`) pass, verifying generated file structure for all targets.
    -   TS Client Runtime: Comprehensive unit (Jest) and integration (Jest + Emulator) tests cover core features.
    -   TS Admin Runtime: Comprehensive unit (Jest) and integration (Jest + Emulator) tests cover core features.
    -   Dart Client Runtime: Comprehensive unit (`fake_cloud_firestore`) and integration (Emulator) tests cover core features.
    -   All runtime tests pass when run via `npx jest` (TS) or `dart test` (Dart).
-   **Publishing & CI/CD:**
    -   GitHub Actions workflow is functional for building, testing (using `npx jest`), and publishing existing packages on version tags.
-   **Documentation:**
    -   VitePress site is set up (`docs-src/`).
    -   Configuration (`config.mts`) is updated for runtime-centric navigation.
    -   Core guide pages (Introduction, Installation, Schema, Config) are present.
    -   **NEW:** Detailed, consolidated guide pages for each runtime (TS Client, TS Admin, Dart Client) covering setup, CRUD, querying, streaming, subcollections, updates, transactions, and testing strategy are populated.
    -   **NEW:** Dedicated Roadmap page created.
    -   **NEW:** Homepage (`index.md`) and root `README.md` updated with refined feature/roadmap table and links.
    -   **NEW:** Redundant/obsolete documentation files removed.

**What's Left:**

1.  **(Optional) Address Minor Test Issues:** Investigate `jest.mock` errors with `bun test`. (Deferring).
2.  **(Future) Implement More Adapters:** `dart-admin-rest`, `csharp-client`.
3.  **(Future) Generator Enhancements:** Complex validation, error reporting, plugins.
4.  **(Future) Documentation Content:** Refine existing content, add more examples, potentially fill out "Advanced Topics" further.
5.  **Publish Packages:** Prepare for publishing CLI and runtime packages.

**Current Status:**

**Documentation Restructure & Initial Content Population Complete:** The documentation site now has a runtime-centric structure with detailed guides for each supported target, covering core functionality and testing. The project is well-documented for its current feature set.

**Next focus:** Likely preparing for package publishing or addressing known minor issues/enhancements.

**Known Issues:**

-   **Test Runner Incompatibility:** `jest.mock` errors when using `bun test` (passes with `npx jest`). (Deferring resolution).
-   **IDE Analysis Limitation:** Dart analyzer/IDE may show errors in `src/__tests__/dart-generated`.
-   **Test Cleanup Flakiness:** Generator snapshot tests sometimes fail during cleanup (`fs.rmSync`). (Cleanup currently disabled).
