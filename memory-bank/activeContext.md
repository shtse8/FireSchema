<!-- Version: 1.21 | Last Updated: 2025-04-06 | Updated By: Cline -->
# Active Context: FireSchema (C# Guide Significantly Improved)

**Current Focus:** C# runtime library v0.1.1 tagged and (presumably) published. Documentation significantly improved based on user feedback, particularly the C# Client Guide.

**Recent Changes:**

-   **(Completed) Significantly Improve C# Client Guide:**
    -   Rewrote `docs-src/guide/csharp-client.md` based on feedback.
    -   Added detailed sections and examples for Core Concepts, CRUD, Querying, Realtime Updates (Listening), Subcollections, Advanced Updates, Transactions & Batched Writes, and Testing Strategy, mirroring the structure of TS/Dart guides.
-   **(Completed) Update Documentation for C# Support (Initial):**
    -   Updated `packages/fireschema-csharp-runtime/README.md`.
    -   Updated main `README.md`.
    -   Created initial `docs-src/guide/csharp-client.md`.
    -   Updated `docs-src/.vitepress/config.mts`.
    -   Updated `docs-src/index.md`.
-   **(Completed) Fix C# CI Workflow & Release v0.1.1:** (Details omitted - see previous versions)

**Next Steps:**

1.  **(Monitor) Verify C# Runtime v0.1.1 NuGet Publication:** Check GitHub Actions status in `shtse8/fireschema-csharp-runtime` repo and NuGet.org. (Ongoing)
2.  **(Highest Priority Post-Release) Refine C# Implementation:**
    -   Implement remaining update operations (if any missed).
    -   Add more comprehensive tests for update operations.
    -   Address CS8600 warning in `IntegrationTests.cs` pagination test.
    -   Add C# output back to generator snapshot tests (`src/__tests__/generator.test.ts`) and update snapshots.
3.  **(Future) Review & Refine C# Documentation:** Review the newly written `docs-src/guide/csharp-client.md` for clarity, accuracy, and completeness.
4.  **(Future) Verify `fireschema_dart_runtime` CI.**
5.  **(Future) Implement More Adapters:** `dart-admin-rest`.
6.  **(Future) Generator Enhancements.**
