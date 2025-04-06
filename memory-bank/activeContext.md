<!-- Version: 1.20 | Last Updated: 2025-04-06 | Updated By: Cline -->
# Active Context: FireSchema (C# Runtime Docs Updated)

**Current Focus:** C# runtime library v0.1.1 tagged and (presumably) published. Documentation updated to reflect C# support.

**Recent Changes:**

-   **(Completed) Update Documentation for C# Support:**
    -   Updated `packages/fireschema-csharp-runtime/README.md` with installation and usage examples.
    -   Updated main `README.md` to include C# in supported targets, added NuGet badge, updated feature table, and added C# example.
    -   Created `docs-src/guide/csharp-client.md` with initial guide content.
    -   Updated `docs-src/.vitepress/config.mts` to add C# guide to the sidebar.
    -   Updated `docs-src/index.md` hero tagline, features list, and feature table to reflect C# support.
-   **(Completed) Fix C# CI Workflow & Release v0.1.1:** (Details omitted - see previous versions)

**Next Steps:**

1.  **(Monitor) Verify C# Runtime v0.1.1 NuGet Publication:** Check GitHub Actions status in `shtse8/fireschema-csharp-runtime` repo and NuGet.org. (Ongoing)
2.  **(Highest Priority Post-Release) Refine C# Implementation:**
    -   Implement remaining update operations (if any missed).
    -   Add more comprehensive tests for update operations.
    -   Address CS8600 warning in `IntegrationTests.cs` pagination test.
    -   Add C# output back to generator snapshot tests (`src/__tests__/generator.test.ts`) and update snapshots.
3.  **(Future) Verify `fireschema_dart_runtime` CI.**
4.  **(Future) Implement More Adapters:** `dart-admin-rest`.
5.  **(Future) Generator Enhancements.**
6.  **(Future) Documentation:** Flesh out C# guide (`docs-src/guide/csharp-client.md`).
