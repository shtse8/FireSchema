<!-- Version: 1.6 | Last Updated: 2025-04-05 | Updated By: Cline -->
# Progress: FireSchema (C# Base Done, Testing Blocked)

**What Works:**

-   **Core Functionality:** CLI tool (`fireschema generate`) executes, parses config/schema, generates code for TS/Dart targets.
-   **C# Client Adapter Implementation (Basic):** Adapter structure, config loading, templates (model, collectionRef, queryBuilder, updateBuilder), and generator integration complete.
-   **Repository Structure:** Runtimes (TS, Dart, C#) linked as submodules.
-   **C# Client Runtime Library (Base):** Submodule added, project file created, core interface/attributes/converter/base classes implemented.
-   **Build & Development:** Core CLI builds. Bun used in main repo. .NET SDK installed.
-   **Testing:** (Excluding C#) Generator snapshot tests pass, Dart unit tests pass, TS runtime tests pass in CI.
-   **Publishing & CI/CD:** Main repo deploys docs. Runtime publishing in respective repos (TS/Dart).
-   **Documentation:** VitePress site deployed.

**What's Left:**

1.  **(Blocked) Test C# Implementation:**
    -   **Resolve C# Test Compilation Errors:** Investigate why MSTest types (`TestClass`, `TestMethod`) are not found despite NuGet references.
    -   Add C# output to generator snapshot tests (`src/__tests__/generator.test.ts`) and update snapshots.
    -   Implement unit and integration tests within the `fireschema-csharp-runtime` repository.
2.  **(Pending) Refine C# Implementation:**
    -   Refine generated C# code based on test results (once tests run).
    -   Implement missing methods/features in C# runtime base classes.
    -   Implement C# runtime build/packaging (NuGet) workflow in its repository.
3.  **(Future) Verify `fireschema_dart_runtime` CI:** Confirm pass on next tag.
4.  **(Future) Implement More Adapters:** `dart-admin-rest`.
5.  **(Future) Generator Enhancements:** Complex validation, error reporting, plugins.
6.  **(Future) Documentation Content:** Add C# guide.

**Current Status:**

**C# Client Generation Basics Complete.**
**C# Runtime Library Basics Complete.**
**C# Runtime Testing Blocked:** Unable to compile C# unit tests due to errors finding MSTest types (CS0234, CS0246), despite correct project references and using statements. Further investigation needed.
**Next focus:** Resolving the C# test compilation errors.

**Known Issues:**

-   **C# Test Compilation Errors:** MSTest types not found during compilation (CS0234, CS0246).
-   **Dart Integration Tests in CI:** Consistently fail. **Currently skipped in CI.**
-   **IDE Analysis Limitation:** Dart analyzer/IDE may show errors in `src/__tests__/dart-generated`.
-   **Test Cleanup Flakiness:** Generator snapshot tests sometimes fail during cleanup (currently disabled).
