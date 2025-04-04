# Active Context: FireSchema (Repository Split & Submodules)

**Current Focus:** The project structure has been refactored. Runtime packages now reside in separate repositories and are linked back to the main `firestore-odm` repository using Git submodules. The main CI workflow has been updated accordingly.

**Recent Changes:**

-   **(Current) Repository Split, Submodule Setup & Initial Runtime Repo Config:**
    -   Moved `fireschema-ts-client-runtime`, `fireschema-ts-admin-runtime`, and `fireschema_dart_runtime` into their own dedicated GitHub repositories.
    -   Removed the original package directories from the main `firestore-odm` repository.
    -   Added the new repositories back as Git submodules within the `packages/` directory.
    -   Updated the main CI workflow (`.github/workflows/publish.yml`) to checkout submodules recursively and removed publishing steps.
    -   **Created initial CI/CD workflow files (`.github/workflows/publish.yml`) within each runtime submodule directory (`packages/*/`) to handle building, testing, and publishing for each package.**
    -   **Added `.gitignore` files within each runtime submodule directory (`packages/*/`) to exclude build artifacts and dependencies.**
    -   Fixed various CI issues encountered during the main repo refactor (test runner hangs, docs build dead links, Dart package validation errors, npm version conflicts).
    -   Attempted setup of Changesets, then reverted due to complexity and user preference for multi-repo approach.
    -   **Attempted to fix TS runtime publishing workflows (v0.1.0 -> v0.1.6):** Addressed issues with missing lockfiles (`npm ci`), `bun` command usage, missing `tsconfig.json` base, TypeScript target/module resolution, and `process.exit` in tests. Pushed fixes and new tags (`v0.1.4` for client, `v0.1.6` for admin). **Workflows still failed.**
-   **(Previous) Documentation Restructure & Content:**
    -   Restructured VitePress site (`docs-src`) to be runtime-centric (TS Client, TS Admin, Dart Client guides).
    -   Consolidated detailed API usage examples (CRUD, Querying, Streaming, Subcollections, Updates, Transactions) into the main guide page for each runtime.
    -   Added specific SDK/Runtime info and Testing Strategy details to each runtime guide page.
    -   Refined Feature/Roadmap table on `index.md` and `README.md`.
    -   Simplified `README.md` to provide overview and link to full docs.
    -   Removed separate `/api` documentation structure and redundant/obsolete guide files.
    -   Corrected project name references (`FireSchema` vs `firestore-odm`) in VitePress config and README links.
-   **(Previous) Executor + Adapter Refactor:**
    -   Updated config format (`target` string).
    -   Rewrote `src/generator.ts` as orchestrator.
    -   Created internal adapters in `src/adapters/`.
    -   Split templates per target (TS Client/Admin).
    -   Refactored runtimes into independent packages (`ts-client-runtime`, `ts-admin-runtime`), removing core types package.
    -   Updated tests (snapshots, unit, integration) for new structure and expanded coverage.
    -   Switched TS runtime tests to `babel-jest`.
    -   Added/fixed Dart runtime tests (unit with `fake_cloud_firestore`, integration with emulator).
    -   Replaced TypeDoc with VitePress for documentation.


**Next Steps:**

1.  **Investigate and Fix Runtime CI/CD Failures:** Debug the latest failed workflow runs for `fireschema-ts-client-runtime` (v0.1.4), `fireschema-ts-admin-runtime` (v0.1.6), and `fireschema_dart_runtime` (v0.1.0) to achieve successful publishing.

1.  **(Future) Implement More Adapters:** Add adapters for new targets (e.g., `dart-admin-rest`, `csharp-client`).
2.  **(Future) Generator Enhancements:** Add support for more complex schema validation rules, improve error reporting.
3.  **(Future) Documentation:** Continue refining and expanding the VitePress documentation content.
