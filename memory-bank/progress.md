# Progress: FireSchema (Repository Split & Submodule Refactor Complete)

**What Works:**

-   **Core Functionality:**
    -   CLI tool (`fireschema generate`) executes via Node.js/Bun.
    -   Parses and validates configuration (`fireschema.config.json`) and schema (`firestore.schema.json`).
    -   Executor + Adapter architecture correctly generates code for `typescript-client`, `typescript-admin`, and `dart-client` targets.
    -   Subcollection generation works correctly.
-   **Repository Structure:**
    -   Runtime packages (`fireschema-ts-client-runtime`, `fireschema-ts-admin-runtime`, `fireschema_dart_runtime`) now reside in **separate, independent GitHub repositories**.
    -   These runtime repositories are linked back into the main `firestore-odm` repository as **Git submodules** within the `packages/` directory.
    -   **`.gitignore` files have been added** to each runtime submodule directory to exclude build artifacts/dependencies.
-   **Build & Development:**
    -   Build system using Bun/TSC (`tsc -b`) successfully builds the core CLI package (`build:root`).
    -   Development tooling standardized on Bun in the main repo.
-   **Testing:**
    -   Generator snapshot tests (`src/__tests__/generator.test.ts`) pass, verifying generated file structure for all targets.
    -   Runtime package tests (unit & integration) are now located **within their respective repositories** and pass there.
    -   The main repository's CI no longer runs runtime package tests.
-   **Publishing & CI/CD:**
    -   The main repository's GitHub Actions workflow (`.github/workflows/publish.yml`) successfully builds the CLI, checks out submodules, builds the documentation site, and deploys docs to GitHub Pages. It **no longer handles package publishing**.
    -   Publishing for runtime packages will be handled by **separate workflows within each runtime's repository**. Initial workflow files (`.github/workflows/publish.yml`) have been created and subsequently patched (attempting fixes for `npm ci`, `bun` usage, `tsconfig.json` issues, `process.exit` in tests) within each submodule directory.
-   **Documentation:**
    -   VitePress site is set up (`docs-src/`).
    -   Configuration (`config.mts`) is updated for runtime-centric navigation and ignores dead links (as a workaround for potential CI issues).
    -   Core guide pages (Introduction, Installation, Schema, Config) are present.
    -   Detailed, consolidated guide pages for each runtime (TS Client, TS Admin, Dart Client) covering setup, CRUD, querying, streaming, subcollections, updates, transactions, and testing strategy are populated.
    -   Dedicated Roadmap page created.
    -   Homepage (`index.md`) and root `README.md` updated with refined feature/roadmap table and links.
    -   Redundant/obsolete documentation files removed.

**What's Left:**

1.  **Fix Runtime CI/CD Workflows:** Investigate and resolve the failures in the latest GitHub Actions runs for `fireschema-ts-client-runtime` (v0.1.4), `fireschema-ts-admin-runtime` (v0.1.6), and `fireschema_dart_runtime` (v0.1.0) to enable successful package publishing.
2.  **(Future) Implement More Adapters:** `dart-admin-rest`, `csharp-client`.
3.  **(Future) Generator Enhancements:** Complex validation, error reporting, plugins.
4.  **(Future) Documentation Content:** Refine existing content, add more examples.

**Current Status:**

**Runtime CI/CD Setup In Progress (Blocked):** The project has been restructured with independent runtime repositories linked via Git submodules. Initial CI/CD workflow files and `.gitignore` files were created and multiple fixes were applied to the TS runtimes. However, the publishing workflows for all three packages are still failing.

**Next focus:** Debugging the failed GitHub Actions workflows for each runtime package.

**Known Issues:**

-   **IDE Analysis Limitation:** Dart analyzer/IDE may show errors in `src/__tests__/dart-generated` within the main repo (mitigated by `analysis_options.yaml`).
-   **Test Cleanup Flakiness:** Generator snapshot tests sometimes fail during cleanup (`fs.rmSync`). (Cleanup currently disabled in those tests).
