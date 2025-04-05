<!-- Version: 1.6 | Last Updated: 2025-04-05 | Updated By: Cline -->
# Active Context: FireSchema (Debugging C# Test Compilation)

**Current Focus:** Resolving compilation errors in the C# Runtime test project (`FireSchema.CS.Runtime.Tests`) related to MSTest types not being found (CS0234, CS0246).

**Recent Changes:**

-   **(Completed) Implement C# Client Support (Base):** Adapter, templates, runtime submodule, runtime base classes, and initial test project setup completed and committed.
-   **(Attempted) Run C# Unit Tests:** Executed `dotnet test` for the C# runtime library.
-   **(Failed) C# Test Compilation:** Build failed repeatedly due to errors indicating MSTest types (`TestClass`, `TestMethod`, `Microsoft.VisualStudio...`) could not be found, despite:
    -   Correct NuGet package references (`Microsoft.NET.Test.Sdk`, `MSTest.TestAdapter`, `MSTest.TestFramework`).
    -   Correct `using` statements in test files.
    -   Correct project references in test `.csproj`.
    -   Correct Solution file (`.sln`) configuration.
    -   Upgrading Target Frameworks to `net6.0`.
    -   Upgrading MSTest NuGet packages.
    -   Disabling ImplicitUsings in test project.
    -   Explicitly marking test project with `<IsTestProject>true`.
    -   Clearing NuGet cache and restoring.
    -   Confirming .NET SDK environment works with a simple, new MSTest project.
-   **(Previous) Fix GitHub Pages Deployment.**
-   **(Previous) Improve Documentation with Diagrams.**
-   **(Previous) Verify Runtime CI Status & Fix Dart CI.**
-   **(Previous) Repository Split & Submodule Setup.**
-   **(Previous) Documentation Restructure & Content.**
-   **(Previous) Executor + Adapter Refactor.**

**Next Steps:**

1.  **(Highest Priority) Investigate & Fix C# Test Compilation Errors:**
    -   Perform deeper research on potential causes for MSTest types not being found in this specific project setup (e.g., conflicts with other dependencies, build target issues, SDK component issues).
    -   Consider alternative testing frameworks (like NUnit or xUnit) if MSTest issues persist.
    -   Try building the test project directly (`dotnet build`) instead of `dotnet test` to isolate build errors.
2.  **(Blocked) Test C# Generation & Runtime:** (Depends on fixing compilation errors)
    -   Add C# target to generator snapshot tests.
    -   Write unit and integration tests for C# runtime.
3.  **(Pending) Refine C# Implementation.**
4.  **(Pending) Setup C# Runtime CI/CD.**
5.  **(Future) Verify `fireschema_dart_runtime` CI.**
6.  **(Future) Implement More Adapters:** `dart-admin-rest`.
7.  **(Future) Generator Enhancements.**
8.  **(Future) Documentation:** Add C# guide.
