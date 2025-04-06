<!-- Version: 1.15 | Last Updated: 2025-04-06 | Updated By: Cline -->
# Active Context: FireSchema (C# Runtime v0.1.1 Tagged)

**Current Focus:** C# runtime library features are mostly complete. Integration tests pass. C# CI workflow emulator setup fixed. CI build failures (NETSDK1045, NU5026) resolved. Project version bumped to `0.1.1`. New tag `v0.1.1` created on the latest fixed commit (`2941e10`) and pushed to trigger NuGet publishing via GitHub Actions.

**Recent Changes:**

-   **(Completed) Bump Version & Trigger C# Runtime Release (v0.1.1):**
    -   Updated version in `FireSchema.CS.Runtime.csproj` to `0.1.1` (commit `2941e10`).
    -   Deleted old `v0.1.0` tags (local and remote).
    -   Created new `v0.1.1` tag on commit `2941e10` in `packages/fireschema-csharp-runtime` submodule.
    -   Pushed new tag `v0.1.1` to submodule remote repository (`shtse8/fireschema-csharp-runtime`).
    -   GitHub Actions workflow in `fireschema-csharp-runtime` repo should now be running with the correct code, workflow steps, and version to publish to NuGet.
-   **(Completed) Fix C# CI Pack Failure (NU5026):**
    -   Modified `.github/workflows/dotnet-ci-cd.yml`.
    -   Removed `--no-build` from `dotnet test` step.
    -   Added `--no-build` to `dotnet pack` step (commit `a3587f1`).
-   **(Completed) Fix C# CI Build Failure (NETSDK1045):** Changed target framework from `net9.0` to `net8.0` (commit `62205ab`).
-   **(Previous - Related to initial tag) Tag & Trigger C# Runtime Release (v0.1.0):** (Details omitted - superseded)
-   **(Completed) Add Type-Safe UpdateBuilder Methods:** (Details omitted)
-   **(Completed) Fix C# CI Workflow Emulator Setup:** (Details omitted)
-   **(Completed) Implement C# Query Support:** (Details omitted)
-   **(Completed) Investigate & Fix C# Test Compilation Errors:** (Details omitted)
-   **(Previous) Implement C# Client Support (Base):** (Details omitted)
-   **(Previous) Fix GitHub Pages Deployment.**
-   **(Previous) Improve Documentation with Diagrams.**
-   **(Previous) Verify Runtime CI Status & Fix Dart CI.**
-   **(Previous) Repository Split & Submodule Setup.**

**Next Steps:**

1.  **(Monitor) Verify C# Runtime v0.1.1 NuGet Publication:** Check GitHub Actions status in `shtse8/fireschema-csharp-runtime` repo and NuGet.org. The workflow triggered by the `v0.1.1` tag should now succeed.
2.  **(Highest Priority Post-Release) Refine C# Implementation:**
    -   Implement remaining update operations (if any missed).
    -   Add more comprehensive tests for update operations.
    -   Address CS8600 warning in `IntegrationTests.cs` pagination test.
3.  **(Future) Verify `fireschema_dart_runtime` CI.**
4.  **(Future) Implement More Adapters:** `dart-admin-rest`.
5.  **(Future) Generator Enhancements.**
6.  **(Future) Documentation:** Add C# guide.
