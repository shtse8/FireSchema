<!-- Version: 1.7 | Last Updated: 2025-04-05 | Updated By: Cline -->
# Active Context: FireSchema (C# Test Compilation Blocked)

**Current Focus:** C# base implementation is complete, but further progress (testing, refinement) is blocked by persistent compilation errors in the C# test project (`FireSchema.CS.Runtime.Tests`). The immediate next step is to investigate these errors in a dedicated task.

**Recent Changes:**

-   **(Completed) Implement C# Client Support (Base):** Adapter, templates, runtime submodule, runtime base classes, and initial test project setup completed and committed.
-   **(Attempted & Failed) Run C# Unit Tests:** Executed `dotnet test` repeatedly. Build failed due to errors indicating test framework types (MSTest initially, then NUnit after refactoring) could not be found (CS0234, CS0246).
-   **(Troubleshooting C# Test Compilation):**
    -   Verified/Corrected NuGet package references (`Microsoft.NET.Test.Sdk`, test framework adapters/frameworks).
    -   Verified/Corrected `using` statements.
    -   Verified/Corrected project references and Solution file configuration.
    -   Upgraded Target Frameworks to `net6.0`.
    -   Upgraded test framework NuGet packages.
    -   Disabled ImplicitUsings.
    -   Explicitly marked test project with `<IsTestProject>true`.
    -   Cleared NuGet cache and restoring.
    -   **Confirmed .NET SDK environment works:** Successfully created and tested a simple, new MSTest project outside the current solution.
    -   **Switched Test Framework:** Refactored test project from MSTest to NUnit; the same type/namespace resolution errors occurred for NUnit types.
-   **(Previous) Fix GitHub Pages Deployment.**
-   **(Previous) Improve Documentation with Diagrams.**
-   **(Previous) Verify Runtime CI Status & Fix Dart CI.**
-   **(Previous) Repository Split & Submodule Setup.**
-   **(Previous) Documentation Restructure & Content.**
-   **(Previous) Executor + Adapter Refactor.**

**Next Steps (New Task):**

1.  **(Highest Priority - New Task) Investigate & Fix C# Test Compilation Errors:**
    -   Focus specifically on the `fireschema-csharp-runtime` solution/projects.
    -   Try building the test project directly (`dotnet build ...`) to get more focused build output.
    -   Examine build logs in detail (`/v:diag` or similar).
    -   Investigate potential conflicts between dependencies (e.g., Google.Cloud.Firestore and test framework versions).
    -   Check for any global build configurations or environment variables that might interfere.
    -   Consider creating a minimal reproduction case within the submodule structure.
2.  **(Blocked) Test C# Generation & Runtime.**
3.  **(Pending) Refine C# Implementation.**
4.  **(Pending) Setup C# Runtime CI/CD.**
5.  **(Future) Verify `fireschema_dart_runtime` CI.**
6.  **(Future) Implement More Adapters:** `dart-admin-rest`.
7.  **(Future) Generator Enhancements.**
8.  **(Future) Documentation:** Add C# guide.
