<!-- Version: 1.11 | Last Updated: 2025-04-06 | Updated By: Cline -->
# Active Context: FireSchema (C# Runtime v0.1.0 Tagged)

**Current Focus:** C# runtime library features are mostly complete. Integration tests pass. C# CI workflow emulator setup fixed. Version `v0.1.0` has been tagged in the submodule repository to trigger NuGet publishing via GitHub Actions.

**Recent Changes:**

-   **(In Progress) Tag & Trigger C# Runtime Release (v0.1.0):**
    -   Tagged commit `f1430b1` in `packages/fireschema-csharp-runtime` submodule with `v0.1.0`.
    -   Pushed tag `v0.1.0` to submodule remote repository (`shtse8/fireschema-csharp-runtime`).
    -   Pushed main repository commit `455ba1f` (updating submodule reference) to remote.
    -   GitHub Actions workflow in `fireschema-csharp-runtime` repo should now be running to publish to NuGet.
-   **(Completed) Add Type-Safe UpdateBuilder Methods:**
    -   Added `Delete<TField>(Expression<...>)` and `SetServerTimestamp<TField>(Expression<...>)` to `BaseUpdateBuilder.cs`.
    -   Added corresponding integration tests in `IntegrationTests.cs`.
    -   Updated `TestModel.cs` with `OptionalValue` and `CreatedAt` properties.
-   **(Completed) Fix C# CI Workflow Emulator Setup:**
    -   Modified `packages/fireschema-csharp-runtime/.github/workflows/dotnet-ci-cd.yml`.
    -   Replaced direct `gcloud components install` with `google-github-actions/setup-gcloud@v2` action.
    -   Separated emulator start command.
-   **(Completed) Implement C# Query Support:** (Details omitted for brevity)
-   **(Completed) Investigate &amp; Fix C# Test Compilation Errors:** (Details omitted for brevity)
-   **(Previous) Implement C# Client Support (Base):** (Details omitted for brevity)
-   **(Previous) Fix GitHub Pages Deployment.**
-   **(Previous) Improve Documentation with Diagrams.**
-   **(Previous) Verify Runtime CI Status &amp; Fix Dart CI.**
-   **(Previous) Repository Split &amp; Submodule Setup.**

**Next Steps:**

1.  **(Monitor) Verify C# Runtime v0.1.0 NuGet Publication:** Check GitHub Actions status in `shtse8/fireschema-csharp-runtime` repo and NuGet.org.
2.  **(Highest Priority Post-Release) Refine C# Implementation:**
    -   Implement remaining update operations (if any missed).
    -   Add more comprehensive tests for update operations.
    -   Address CS8600 warning in `IntegrationTests.cs` pagination test.
3.  **(Future) Verify `fireschema_dart_runtime` CI.**
4.  **(Future) Implement More Adapters:** `dart-admin-rest`.
5.  **(Future) Generator Enhancements.**
6.  **(Future) Documentation:** Add C# guide.
