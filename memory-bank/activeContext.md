<!-- Version: 1.13 | Last Updated: 2025-04-06 | Updated By: Cline -->
# Active Context: FireSchema (C# Runtime v0.1.0 Re-Tagged)

**Current Focus:** C# runtime library features are mostly complete. Integration tests pass. C# CI workflow emulator setup fixed. CI build failure due to .NET version mismatch has been resolved by targeting `net8.0`. Version `v0.1.0` tag has been recreated on the fixed commit (`62205ab`) and pushed to trigger NuGet publishing via GitHub Actions.

**Recent Changes:**

-   **(Completed) Re-Tag & Trigger C# Runtime Release (v0.1.0):**
    -   Deleted old local and remote `v0.1.0` tag (which pointed to pre-fix commit).
    -   Created new `v0.1.0` tag on commit `62205ab` (containing the `net8.0` fix) in `packages/fireschema-csharp-runtime` submodule.
    -   Pushed new tag `v0.1.0` to submodule remote repository (`shtse8/fireschema-csharp-runtime`).
    -   GitHub Actions workflow in `fireschema-csharp-runtime` repo should now be running with the correct code to publish to NuGet.
-   **(Completed) Fix C# CI Build Failure:** Changed target framework from `net9.0` to `net8.0` in `FireSchema.CS.Runtime.csproj` and `FireSchema.CS.Runtime.Tests.csproj` to match CI SDK version (commit `62205ab`).
-   **(Previous - Related to initial tag) Tag & Trigger C# Runtime Release (v0.1.0):**
    -   Tagged commit `f1430b1` in `packages/fireschema-csharp-runtime` submodule with `v0.1.0`.
    -   Pushed tag `v0.1.0` to submodule remote repository (`shtse8/fireschema-csharp-runtime`).
    -   Pushed main repository commit `455ba1f` (updating submodule reference) to remote.
-   **(Completed) Add Type-Safe UpdateBuilder Methods:**
    -   Added `Delete<TField>(Expression<...>)` and `SetServerTimestamp<TField>(Expression<...>)` to `BaseUpdateBuilder.cs`.
    -   Added corresponding integration tests in `IntegrationTests.cs`.
    -   Updated `TestModel.cs` with `OptionalValue` and `CreatedAt` properties.
-   **(Completed) Fix C# CI Workflow Emulator Setup:**
    -   Modified `packages/fireschema-csharp-runtime/.github/workflows/dotnet-ci-cd.yml`.
    -   Replaced direct `gcloud components install` with `google-github-actions/setup-gcloud@v2` action.
    -   Separated emulator start command.
-   **(Completed) Implement C# Query Support:** (Details omitted for brevity)
-   **(Completed) Investigate & Fix C# Test Compilation Errors:** (Details omitted for brevity)
-   **(Previous) Implement C# Client Support (Base):** (Details omitted for brevity)
-   **(Previous) Fix GitHub Pages Deployment.**
-   **(Previous) Improve Documentation with Diagrams.**
-   **(Previous) Verify Runtime CI Status & Fix Dart CI.**
-   **(Previous) Repository Split & Submodule Setup.**

**Next Steps:**

1.  **(Monitor) Verify C# Runtime v0.1.0 NuGet Publication:** Check GitHub Actions status in `shtse8/fireschema-csharp-runtime` repo and NuGet.org. The workflow triggered by the new tag should now succeed.
2.  **(Highest Priority Post-Release) Refine C# Implementation:**
    -   Implement remaining update operations (if any missed).
    -   Add more comprehensive tests for update operations.
    -   Address CS8600 warning in `IntegrationTests.cs` pagination test.
3.  **(Future) Verify `fireschema_dart_runtime` CI.**
4.  **(Future) Implement More Adapters:** `dart-admin-rest`.
5.  **(Future) Generator Enhancements.**
6.  **(Future) Documentation:** Add C# guide.
