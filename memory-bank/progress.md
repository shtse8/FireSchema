<!-- Version: 1.19 | Last Updated: 2025-04-06 | Updated By: Cline -->
# Progress: FireSchema (C# Guide Significantly Improved)

**What Works:**

-   **Core Functionality:** CLI tool (`fireschema generate`) executes, parses config/schema, generates code for TS/Dart/C# targets.
-   **C# Client Adapter Implementation (Basic):** Adapter structure, config loading, templates, generator integration complete.
-   **Repository Structure:** Runtimes (TS, Dart, C#) linked as submodules.
-   **C# Client Runtime Library (Core Features):** Submodule added, project file created (targeting `net8.0`, version `0.1.1`), core interface/attributes/converter/base classes implemented. Includes CRUD, basic & advanced queries, update builder operations.
-   **Build & Development:** Core CLI builds. Bun used in main repo. .NET SDK functional.
-   **Testing:**
    -   Generator snapshot tests pass (excluding C# specific tests for now).
    -   Dart unit tests pass, TS runtime tests pass in CI.
    -   **C# Runtime:** Unit & Integration tests pass against the emulator.
-   **Publishing & CI/CD:** Main repo deploys docs. Runtime publishing in respective repos (TS/Dart). C# CI workflow fixed. C# Runtime v0.1.1 tagged for release via CI.
-   **Documentation:** VitePress site deployed. READMEs updated. **C# Client Guide (`docs-src/guide/csharp-client.md`) significantly improved with detailed examples and explanations for core features.**

**What's Left:**

1.  **(Monitor) Verify C# Runtime v0.1.1 NuGet Publication:** Check GitHub Actions status and NuGet.org. (Ongoing)
2.  **(Active) Refine C# Implementation:**
    -   Implement remaining/complex update operations in `BaseUpdateBuilder` and add tests.
    -   Add C# output back to generator snapshot tests (`src/__tests__/generator.test.ts`) and update snapshots.
    -   Address CS8600 warning in `IntegrationTests.cs` pagination test.
3.  **(Future) Review & Refine C# Documentation:** Review the newly written `docs-src/guide/csharp-client.md` for clarity, accuracy, and completeness.
4.  **(Future) Verify `fireschema_dart_runtime` CI:** Confirm pass on next tag.
5.  **(Future) Implement More Adapters:** `dart-admin-rest`.
6.  **(Future) Generator Enhancements:** Complex validation, error reporting, plugins.

**Current Status:**

**C# Client Generation Basics Complete.**
**C# Runtime Library Core Features Implemented & Tested.**
**C# Runtime v0.1.1 Tagged for NuGet Release via CI.**
**Documentation Significantly Improved for C# Support.**
**Next focus:** Monitor NuGet publication, then continue refining C# implementation.

**Known Issues:**

-   **C# Build Warnings (CS0436):** Type conflicts (`TestModel`, `TestCollectionRef`) due to NUnit reference workaround in main library project. **Accepted for now.**
-   **C# Build Warning (CS8600):** Potential null conversion in `IntegrationTests.cs` pagination test. **Low priority.**
-   **Generator Snapshot Test Flakiness (Windows):** Potential timing issues reading files immediately after generation.
-   **Dart Integration Tests in CI:** Consistently fail. **Currently skipped in CI.**
-   **IDE Analysis Limitation:** Dart analyzer/IDE may show errors in `src/__tests__/dart-generated`.
-   **Test Cleanup Flakiness:** Generator snapshot tests sometimes fail during cleanup (currently disabled).
