# Active Context: FireSchema (Documentation Restructure)

**Current Focus:** Documentation structure and content refinement is complete based on user feedback. Ready for next task or further documentation expansion.

**Recent Changes:**

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
-   **Documentation Restructure & Content:**
    -   Restructured VitePress site (`docs-src`) to be runtime-centric (TS Client, TS Admin, Dart Client guides).
    -   Consolidated detailed API usage examples (CRUD, Querying, Streaming, Subcollections, Updates, Transactions) into the main guide page for each runtime.
    -   Added specific SDK/Runtime info and Testing Strategy details to each runtime guide page.
    -   Refined Feature/Roadmap table on `index.md` and `README.md`.
    -   Simplified `README.md` to provide overview and link to full docs.
    -   Removed separate `/api` documentation structure and redundant/obsolete guide files.
    -   Corrected project name references (`FireSchema` vs `firestore-odm`) in VitePress config and README links.

**Next Steps:**

1.  **(Optional) Address Minor Test Issues:** Investigate the `jest.mock` errors reported by `bun test` (but not `npx jest`).
2.  **(Future) Implement More Adapters:** Add adapters for new targets (e.g., `dart-admin-rest`, `csharp-client`).
3.  **(Future) Generator Enhancements:** Add support for more complex schema validation rules, improve error reporting.
4.  **(Future) Documentation:** Continue refining and expanding the VitePress documentation content (e.g., filling out advanced topics, adding more complex examples).
5.  **Publish Packages:** Prepare for publishing CLI and runtime packages to npm/pub.dev.
