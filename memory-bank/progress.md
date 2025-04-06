<!-- Version: 1.10 | Last Updated: 2025-04-06 | Updated By: Cline -->
# Progress: FireSchema (C# Query Features Tested, CI Fix)

**What Works:**

-   **Core Functionality:** CLI tool (`fireschema generate`) executes, parses config/schema, generates code for TS/Dart targets.
-   **C# Client Adapter Implementation (Basic):** Adapter structure, config loading, templates, generator integration complete.
-   **Repository Structure:** Runtimes (TS, Dart, C#) linked as submodules.
-   **C# Client Runtime Library (Core Features):** Submodule added, project file created, core interface/attributes/converter/base classes implemented (`BaseCollectionRef`, `BaseUpdateBuilder`, `BaseQueryBuilder`). Includes:
    -   CRUD operations (Add, Get, Set, Delete, Update).
    -   Basic Queries (Where, OrderBy, Limit).
    -   **Advanced Queries (WhereIn, WhereNotIn, WhereArrayContainsAny, Pagination - Start/End/After/Before).**
    -   Update Builder operations (Set, Increment, ArrayUnion, ArrayRemove).
-   **Build &amp; Development:** Core CLI builds. Bun used in main repo. .NET SDK functional.
-   **Testing:**
    -   (Excluding C# specific generator tests) Generator snapshot tests pass.
    -   Dart unit tests pass, TS runtime tests pass in CI.
    -   **C# Runtime:** Unit test (`FirestoreDataConverterTests`) and integration tests (`IntegrationTests` for CRUD, Update Ops, Basic Queries, **Advanced Queries, Pagination**) pass against the emulator.
-   **Publishing &amp; CI/CD:** Main repo deploys docs. Runtime publishing in respective repos (TS/Dart). **C# CI workflow emulator setup fixed using `setup-gcloud` action.**
-   **Documentation:** VitePress site deployed.

**What's Left:**

1.  **(Active) Refine C# Implementation:**
    -   Implement remaining/complex update operations in `BaseUpdateBuilder` and add tests.
    -   Add C# output back to generator snapshot tests (`src/__tests__/generator.test.ts`) and update snapshots (once C# generation is stable and fully testable).
    -   Implement C# runtime build/packaging (NuGet) workflow in its repository (build/pack/publish steps).
    -   Address CS8600 warning in `IntegrationTests.cs` pagination test.
2.  **(Future) Verify `fireschema_dart_runtime` CI:** Confirm pass on next tag.
3.  **(Future) Implement More Adapters:** `dart-admin-rest`.
4.  **(Future) Generator Enhancements:** Complex validation, error reporting, plugins.
5.  **(Future) Documentation Content:** Add C# guide.

**Current Status:**

**C# Client Generation Basics Complete.**
**C# Runtime Library Core Features (CRUD, Update, Basic &amp; Advanced Queries) Implemented &amp; Tested via Integration Tests.**
**Original C# Test Compilation Blocker Resolved** (via workaround causing CS0436 warnings).
**C# CI Workflow Emulator Setup Fixed.**
**Next focus:** Refine C# implementation (remaining update ops, tests, CI/CD build/publish steps).

**Known Issues:**

-   **C# Build Warnings (CS0436):** Type conflicts (`TestModel`, `TestCollectionRef`) due to NUnit reference workaround in main library project. **Accepted for now.**
-   **C# Build Warning (CS8600):** Potential null conversion in `IntegrationTests.cs` pagination test. **Low priority.**
-   **Generator Snapshot Test Flakiness (Windows):** Potential timing issues reading files immediately after generation.
-   **Dart Integration Tests in CI:** Consistently fail. **Currently skipped in CI.**
-   **IDE Analysis Limitation:** Dart analyzer/IDE may show errors in `src/__tests__/dart-generated`.\n-   **Test Cleanup Flakiness:** Generator snapshot tests sometimes fail during cleanup (currently disabled).
