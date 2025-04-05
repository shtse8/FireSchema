<!-- Version: 1.4 | Last Updated: 2025-04-05 | Updated By: Cline -->
# Active Context: FireSchema (Implementing C# Client)

**Current Focus:** Implementing support for generating a C# client library.

**Recent Changes:**

-   **(In Progress) Implement C# Client Support:**
    -   Created C# adapter directory structure (`src/adapters/csharp-client/`).
    -   Updated config loader (`src/configLoader.ts`) to recognize `'csharp-client'` target.
    -   Created placeholder C# adapter logic (`src/adapters/csharp-client/index.ts`).
    -   Updated generator (`src/generator.ts`) to load and execute the C# adapter.
-   **(Completed) Fix GitHub Pages Deployment:**
    -   Corrected `README.md` links and VitePress `base` path to use `/FireSchema/`.
    -   Corrected `publish_dir` in GitHub Actions workflow.
    -   Switched artifact upload/deployment actions to official `actions/upload-pages-artifact` and `actions/deploy-pages`.
    -   Verified deployment is live and correct at `https://shtse8.github.io/FireSchema/`.
-   **(Previous) Improve Documentation with Diagrams:** Added Mermaid diagrams.
-   **(Previous) Verify Runtime CI Status & Fix Dart CI:** Dart CI now runs unit tests only. TS runtimes passed on last tag.
-   **(Previous) Repository Split & Submodule Setup.**
-   **(Previous) Documentation Restructure & Content.**
-   **(Previous) Executor + Adapter Refactor.**

**Next Steps:**

1.  **(High Priority) Implement C# Client Adapter Logic & Templates:**
    -   Define EJS templates for C# models, collection references, query builders, update builders within `src/adapters/csharp-client/templates/`.
    -   Write the core generation logic in `src/adapters/csharp-client/index.ts` to use the templates and schema information.
2.  **(High Priority) Create C# Client Runtime Library:**
    -   Set up a new Git repository (`fireschema-csharp-runtime`).
    -   Implement base classes and helpers using `Google.Cloud.Firestore`.
    -   Configure project for NuGet packaging.
    -   Add the new repository as a submodule under `packages/`.
3.  **(Medium Priority) Add C# Client Tests:**
    -   Extend generator snapshot tests (`src/__tests__/generator.test.ts`) to cover C# output.
    -   Create unit and integration tests within the `fireschema-csharp-runtime` repository.
4.  **(Future) Verify `fireschema_dart_runtime` CI:** Confirm workflow pass on next tag.
5.  **(Future) Implement More Adapters:** `dart-admin-rest`.
6.  **(Future) Generator Enhancements:** Validation, error reporting, plugins.
7.  **(Future) Documentation:** Add C# guide, refine content, add examples, Contributing guide.
