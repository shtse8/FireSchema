<!-- Version: 1.4 | Last Updated: 2025-04-05 | Updated By: Cline -->
# Technical Context: FireSchema (Separate Repos + Submodules)

**Core Generator Tool (`@shtse8/fireschema`):**

- **Language:** TypeScript
- **Runtime:** Node.js (for CLI execution via `npx`)
- **Key Libraries:**
  - `commander`: CLI argument parsing and command structure.
  - `ajv`: JSON Schema validation for user-provided schema files.
  - `ejs`: Templating engine (used _by_ adapters).
- **Compilation:** TypeScript compiled to JavaScript (`dist/` directory).
- **Repository Structure:** Main repository (`firestore-odm`) contains the core CLI tool, documentation, and examples. Runtime packages are included as **Git submodules** in the `packages/` directory, linking to their separate repositories.
- **Core Logic:**
  - `src/cli.ts`: Entry point.
  - `src/configLoader.ts`: Loads and validates `fireschema.config.json`, including the `target` property.
  - `src/schemaLoader.ts`: Loads and validates `firestore.schema.json`.
  - `src/generator.ts` (**Executor**): Orchestrates generation, loads adapters dynamically based on `target`.
  - `src/adapters/`: Contains internal adapter modules (e.g., `typescript-client/index.ts`, `csharp-client/index.ts`). Each adapter loads its own templates from a subdirectory.

**Schema Definition:**

- **Format:** JSON Schema (Draft 7 recommended).
- **File:** User-defined (e.g., `firestore.schema.json`).
- **Validation:** Validated against `src/schema-definition.json` using `ajv`.

**Configuration (`fireschema.config.json`):**

- **Format:** JSON.
- **File:** User-defined, specified via `-c` flag.
- **Structure:**
  - `schema`: Path to the schema file.
  - `outputs`: Array of output target objects.
    - `target`: **Required string** identifying the generation target (e.g., `'typescript-client'`, `'typescript-admin'`, `'dart-client'`, `'csharp-client'`).
    - `outputDir`: Path for generated code.
    - `package`: Optional info for generating `package.json`/`pubspec.yaml`.
    - `options`: Optional object for target-specific settings (e.g., `dateTimeType` for TS, `namespace` for C#).

**Runtime Libraries (Separate Repositories & Submodules):**

- **Purpose:** Contain reusable base classes, generic types, and SDK interaction logic needed by generated code. Installed by the end-user.
- **TypeScript Runtime (Independent Packages):**
  - **`@shtse8/fireschema-ts-client-runtime`:**
    - **Location:** `packages/fireschema-ts-client-runtime` (Submodule linking to `fireschema-ts-client-runtime` repo)
    - **Purpose:** Uses `firebase` (Client) SDK v9+.
    - **Used by:** `typescript-client` adapter.
    - **Published:** npm package.
    - **Dependencies:** `firebase`.
  - **`@shtse8/fireschema-ts-admin-runtime`:**
    - **Location:** `packages/fireschema-ts-admin-runtime` (Submodule linking to `fireschema-ts-admin-runtime` repo)
    - **Purpose:** Uses `firebase-admin` SDK.
    - **Used by:** `typescript-admin` adapter.
    - **Published:** npm package.
    - **Dependencies:** `firebase-admin`.
- **Dart Runtime (`fireschema_dart_runtime`):**
  - **Location:** `packages/fireschema_dart_runtime` (Submodule linking to `fireschema_dart_runtime` repo)
  - **Purpose:** Uses `cloud_firestore`.
  - **Used by:** `dart-client` adapter.
  - **Published:** pub package.
  - **Dependencies:** `cloud_firestore`, `meta`.
- **(Planned) C# Runtime (`FireSchema.CS.Runtime`):**
  - **Location:** (Planned) `packages/fireschema-csharp-runtime` (Submodule linking to planned `fireschema-csharp-runtime` repo)
  - **Purpose:** Will use `Google.Cloud.Firestore` SDK.
  - **Used by:** `csharp-client` adapter.
  - **Published:** (Planned) NuGet package.
  - **Dependencies:** (Planned) `Google.Cloud.Firestore`.

**Generated Code Targets (Examples):**

1.  **Target: `'typescript-client'`**
    - **Adapter:** `src/adapters/typescript-client/index.ts`.
    - **Templates:** `src/adapters/typescript-client/templates/`.
    - **Dependencies (User Project):** `@shtse8/fireschema-ts-client-runtime`, `firebase`.
2.  **Target: `'typescript-admin'`**
    - **Adapter:** `src/adapters/typescript-admin/index.ts`.
    - **Templates:** `src/adapters/typescript-admin/templates/`.
    - **Dependencies (User Project):** `@shtse8/fireschema-ts-admin-runtime`, `firebase-admin`.
3.  **Target: `'dart-client'`**
    - **Adapter:** `src/adapters/dart-client/index.ts`.
    - **Templates:** `src/adapters/dart-client/templates/`.
    - **Dependencies (User Project):** `fireschema_dart_runtime`, `cloud_firestore`.
4.  **Target: `'csharp-client'`**
    - **Adapter:** `src/adapters/csharp-client/index.ts`.
    - **Templates:** `src/adapters/csharp-client/templates/`.
    - **Dependencies (User Project):** (Planned) `FireSchema.CS.Runtime` (NuGet), `Google.Cloud.Firestore`.

**Development Environment:**

- **Primary Tooling:** Bun (`bun`) for development tasks in the main repo. Individual runtime repos might use Bun or npm/dart pub/dotnet CLI.
- **User Compatibility:** Published CLI tool and runtime packages remain compatible with standard Node.js/Dart/Flutter/.NET environments.

**Testing Strategy:**

- **Core Tool (`@shtse8/fireschema`):** Snapshot Tests (`src/__tests__/generator.test.ts`) verify Adapter + Template output.
- **Runtime Packages:** Unit & Integration Tests located **within each runtime package's own repository**.
- **Adapters (`src/adapters/*`):** Primarily tested via core tool's Snapshot Tests.

**Documentation:**

- **Framework:** VitePress (`docs-src/`).
- **Build Output:** Static HTML site (`docs/`).

**Publishing & CI/CD:**

- **Automation:** GitHub Actions workflows.
- **Main Repo:** Builds/tests CLI & docs, deploys docs. **Does NOT publish packages.**
- **Runtime Repos:** Separate workflows trigger on tags **in that repo** to build, test, and publish **only that specific package**.
