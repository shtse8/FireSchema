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
-   **Build & Development:**
    -   Build system using Bun/TSC (`tsc -b`) successfully builds the core CLI package (`build:root`).
    -   Development tooling standardized on Bun in the main repo.
-   **Testing:**
    -   Generator snapshot tests (`src/__tests__/generator.test.ts`) pass, verifying generated file structure for all targets.
    -   Runtime package tests (unit & integration) are now located **within their respective repositories** and pass there.
    -   The main repository's CI no longer runs runtime package tests.
-   **Publishing & CI/CD:**
    -   The main repository's GitHub Actions workflow (`.github/workflows/publish.yml`) successfully builds the CLI, checks out submodules, builds the documentation site, and deploys docs to GitHub Pages. It **no longer handles package publishing**.
    -   Publishing for runtime packages will be handled by **separate workflows within each runtime's repository**.
-   **Documentation:**
    -   VitePress site is set up (`docs-src/`).
    -   Configuration (`config.mts`) is updated for runtime-centric navigation and ignores dead links (as a workaround for potential CI issues).
    -   Core guide pages (Introduction, Installation, Schema, Config) are present.
    -   Detailed, consolidated guide pages for each runtime (TS Client, TS Admin, Dart Client) covering setup, CRUD, querying, streaming, subcollections, updates, transactions, and testing strategy are populated.
    -   Dedicated Roadmap page created.
    -   Homepage (`index.md`) and root `README.md` updated with refined feature/roadmap table and links.
    -   Redundant/obsolete documentation files removed.

**What's Left:**

1.  **CI/CD for Runtime Repos:** Set up GitHub Actions workflows in each of the three new runtime repositories (`fireschema-ts-client-runtime`, `fireschema-ts-admin-runtime`, `fireschema_dart_runtime`) to:
    -   Build the package.
    -   Run its specific tests (unit & integration, likely requiring emulator setup).
    -   Publish the package to its registry (npm or pub.dev) when a version tag is pushed **to that specific repository**.
2.  **(Optional) Add `.gitignore` to Runtime Repos:** Add `node_modules/`, `.dart_tool/`, `build/`, etc., to the `.gitignore` files in the respective runtime repositories to avoid committing build artifacts.
3.  **(Future) Implement More Adapters:** `dart-admin-rest`, `csharp-client`.
4.  **(Future) Generator Enhancements:** Complex validation, error reporting, plugins.
5.  **(Future) Documentation Content:** Refine existing content, add more examples.

**Current Status:**

**Repository Refactor Complete:** The project has been successfully restructured. Runtime packages are now independent repositories linked via Git submodules. The main repository focuses on the CLI tool, documentation, and overall project structure. The CI/CD pipeline in the main repo is simplified, and the foundation is laid for independent package releases.

**Next focus:** Setting up the CI/CD workflows in the individual runtime package repositories.

**Known Issues:**

-   **IDE Analysis Limitation:** Dart analyzer/IDE may show errors in `src/__tests__/dart-generated` within the main repo (mitigated by `analysis_options.yaml`).
-   **Test Cleanup Flakiness:** Generator snapshot tests sometimes fail during cleanup (`fs.rmSync`). (Cleanup currently disabled in those tests).
