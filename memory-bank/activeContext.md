<!-- Version: 1.10 | Last Updated: 2025-04-06 | Updated By: Cline -->
# Active Context: FireSchema (C# Query Features Complete, CI Fix)

**Current Focus:** C# runtime library features are mostly complete, including base CRUD, updates, and advanced querying (WhereIn, NotIn, ArrayContainsAny, Pagination). Integration tests pass against the Firestore emulator. The known CS0436 warnings persist due to the NUnit workaround. The C# CI workflow emulator setup has been fixed.

**Recent Changes:**

-   **(Completed) Fix C# CI Workflow Emulator Setup:**
    -   Modified `packages/fireschema-csharp-runtime/.github/workflows/dotnet-ci-cd.yml`.
    -   Replaced direct `gcloud components install` with `google-github-actions/setup-gcloud@v2` action to handle component installation (`beta`, `cloud-firestore-emulator`).
    -   Separated emulator start command into its own step.
-   **(Completed) Implement C# Query Support:**
    -   Implemented `WhereIn`, `WhereNotIn`, `WhereArrayContainsAny` in `BaseQueryBuilder.cs`.
    -   Implemented pagination methods (`StartAt`, `StartAfter`, `EndAt`, `EndBefore`) in `BaseQueryBuilder.cs`.
    -   Added corresponding convenience methods to `BaseCollectionRef.cs`.
    -   Added integration tests for new query operators and pagination in `IntegrationTests.cs`.
    -   Fixed `FromFirestore` accessibility in `FirestoreDataConverter` for test usage.
    -   Added `System.Linq` import to `BaseQueryBuilder.cs`.
    -   Tests pass using `dotnet test`.
-   **(Completed) Investigate &amp; Fix C# Test Compilation Errors:**
    -   Ran `dotnet build` and `dotnet test` directly on the test project.
    -   Builds and tests now pass, indicating the original compilation error is resolved or bypassed.
    -   Added basic integration tests (`IntegrationTests.cs`) using the Firestore emulator.
    -   Implemented `DeleteAsync` in `BaseCollectionRef`.
    -   Implemented `BaseUpdateBuilder` (including type-safe `Set`, `Increment`, `ArrayUnion`, `ArrayRemove`) and `UpdateAsync` in `BaseCollectionRef`.
    -   Refactored `TestModel` into its own file.
    -   Addressed nullability warnings (CS8602) using `!`.\n    -   **Workaround:** Re-added `NUnit` PackageReference to the main `FireSchema.CS.Runtime.csproj` to allow tests to compile/run, accepting resulting CS0436 warnings.
-   **(Previous) Implement C# Client Support (Base):** Adapter, templates, runtime submodule, runtime base classes, and initial test project setup completed and committed.
-   **(Previous) Fix GitHub Pages Deployment.**
-   **(Previous) Improve Documentation with Diagrams.**
-   **(Previous) Verify Runtime CI Status &amp; Fix Dart CI.**
-   **(Previous) Repository Split &amp; Submodule Setup.**

**Next Steps:**

1.  **(Highest Priority) Refine C# Implementation:**
    -   Implement remaining update operations (if any missed, e.g., more complex scenarios) in `BaseUpdateBuilder`.
    -   Add more comprehensive tests for update operations.
    -   Address CS8600 warning in `IntegrationTests.cs` pagination test if deemed necessary.
2.  **(Pending) Setup C# Runtime CI/CD:** Build/test/publish NuGet package workflow in `fireschema-csharp-runtime` repo (Emulator setup part is done, need build/pack/publish steps).
3.  **(Future) Verify `fireschema_dart_runtime` CI.**
4.  **(Future) Implement More Adapters:** `dart-admin-rest`.
5.  **(Future) Generator Enhancements.**
6.  **(Future) Documentation:** Add C# guide.
