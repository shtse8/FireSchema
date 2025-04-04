# System Patterns: FireSchema (Separate Repos + Submodules)

**Core Architecture:** Command-Line Executor with Internal Adapters, Runtime Packages as Submodules

```mermaid
graph LR
    subgraph FireSchema_Tool [FireSchema Tool (@shtse8/fireschema)]
        style FireSchema_Tool fill:#f9f,stroke:#333,stroke-width:2px
        A[User runs `fireschema generate`] --> B{CLI Parser (commander)};
        B -- Config Path --> C[Config Loader];
        C -- Schema Path --> D[Schema Loader];
        D -- Parsed Schema --> E[Executor (src/generator.ts)];
        C -- Config Object (with target) --> E;
        E -- Target='ts-client' --> AdapterTSClient["TS Client Adapter (src/adapters/typescript-client.ts)"];
        E -- Target='ts-admin' --> AdapterTSAdmin["TS Admin Adapter (src/adapters/typescript-admin.ts)"];
        E -- Target='dart-client' --> AdapterDartClient["Dart Client Adapter (src/adapters/dart-client.ts)"];
        AdapterTSClient -- Loads --> TemplatesTSClient["Templates (src/adapters/typescript-client/templates/)"]
        AdapterTSAdmin -- Loads --> TemplatesTSAdmin["Templates (src/adapters/typescript-admin/templates/)"]
        AdapterDartClient -- Loads --> TemplatesDartClient["Templates (src/adapters/dart-client/templates/)"]
        AdapterTSClient -- Uses --> TemplateEngine[EJS]
        AdapterTSAdmin -- Uses --> TemplateEngine
        AdapterDartClient -- Uses --> TemplateEngine
        TemplateEngine -- Rendered Code --> FileSystemWriter
        F[Submodule Links (.gitmodules)] --> RuntimeTSClientRepoRef["packages/fireschema-ts-client-runtime"];
        F --> RuntimeTSAdminRepoRef["packages/fireschema-ts-admin-runtime"];
        F --> RuntimeDartRepoRef["packages/fireschema_dart_runtime"];
    end

    subgraph User_Project [User Project]
        style User_Project fill:#ccf,stroke:#333,stroke-width:2px
        FileSystemWriter --> GeneratedTS["Generated TS Code (Client or Admin)"];
        FileSystemWriter --> GeneratedDart["Generated Dart Code (Client)"];
        GeneratedTSClient[Generated TS Client Code] -- Depends On --> RuntimeTSClient["@shtse8/fireschema-ts-client-runtime"];
        GeneratedTSAdmin[Generated TS Admin Code] -- Depends On --> RuntimeTSAdmin["@shtse8/fireschema-ts-admin-runtime"];
        GeneratedDart -- Depends On --> RuntimeDart["fireschema_dart_runtime"];
        UserCodeTS[User TS Code] --> GeneratedTS;
        UserCodeDart[User Dart Code] --> GeneratedDart;
        UserInstalls1[User installs] --> RuntimeTSClient;
        UserInstalls1a[User installs] --> RuntimeTSAdmin;
        UserInstalls2[User installs] --> RuntimeDart;
        UserInstalls3[User installs] --> SDK_Firebase["firebase (SDK)"];
        UserInstalls4[User installs] --> SDK_Admin["firebase-admin (SDK)"];
        UserInstalls5[User installs] --> SDK_CloudFirestore["cloud_firestore (SDK)"];
    end

    subgraph Runtime_Libraries [Runtime Libraries (Separate Repositories)]
        style Runtime_Libraries fill:#cfc,stroke:#333,stroke-width:2px
        RuntimeTSClientRepo["Repo: fireschema-ts-client-runtime"] --> RuntimeTSClient;
        RuntimeTSAdminRepo["Repo: fireschema-ts-admin-runtime"] --> RuntimeTSAdmin;
        RuntimeDartRepo["Repo: fireschema-dart-runtime"] --> RuntimeDart;
    end

    subgraph Firebase_SDKs [Firebase SDKs (External)]
         style Firebase_SDKs fill:#ffc,stroke:#333,stroke-width:2px
         SDK_Firebase
         SDK_Admin
         SDK_CloudFirestore
    end
```

**Key Patterns:**

1.  **CLI Application:** Uses `commander` for command definition, argument
    parsing (`-c` for config), and help generation. Entry point is `src/cli.ts`.
2.  **Configuration Loading:** `src/configLoader.ts` reads the specified JSON
    config file, validates the new `target` property for each output, resolves
    relative paths (schema, output directories), and passes the config to the
    Executor.
3.  **Schema Validation & Parsing:** `src/schemaLoader.ts` reads the user's JSON
    schema file, validates it against `src/schema-definition.json` (using `ajv`),
    and transforms it into an internal `ParsedFirestoreSchema` representation.
4.  **Executor / Orchestrator (`src/generator.ts`):**
    - Receives the parsed schema and config.
    - Iterates through the `outputs` array in the config.
    - For each output, it reads the `target` string (e.g., `'typescript-client'`,
      `'dart-client'`).
    - Dynamically imports or calls the corresponding **internal Adapter module**
      (e.g., from `src/adapters/typescript-client.ts`).
    - Invokes a standard function (e.g., `generate`) on the adapter, passing the
      schema, the specific output config (including `target` and `options`), and
      potentially the global config.
    - The Executor itself does **not** contain language-specific logic or
      template rendering code.
5.  **Internal Adapters (`src/adapters/*.ts`):**
    - Modules dedicated to specific generation targets (e.g.,
      `typescript-client`, `typescript-admin`, `dart-client`).
    - Each adapter contains **all** logic required for its target:
      - Loading the necessary EJS templates (from its **own** `templates/`
        subdirectory, e.g., `src/adapters/typescript-client/templates/`).
      - Preparing the data object to be passed to EJS.
      - Rendering templates using EJS.
      - Writing the generated files to the specified output directory.
      - Handling target-specific `options` from the config.
    - Adapters generate code that relies on the appropriate **Runtime Package**.
6.  **Template-Based Code Generation:** Adapters use `ejs` to render templates
    located within their own subdirectories (e.g.,
    `src/adapters/dart-client/templates/`).
7.  **Runtime Libraries (Separate Repositories & Submodules):**
    - Runtime logic (base classes, helpers) for each target platform lives in its **own dedicated Git repository**.
    - These separate repositories are linked back into the main `firestore-odm` repository's `packages/` directory using **Git submodules**.
    - This allows independent versioning and release cycles for each runtime package.
    - **`@shtse8/fireschema-ts-client-runtime` (TypeScript Client):** In `fireschema-ts-client-runtime` repo.
    - **`@shtse8/fireschema-ts-admin-runtime` (TypeScript Admin):** In `fireschema-ts-admin-runtime` repo.
    - **`fireschema_dart_runtime` (Dart Client):** In `fireschema_dart_runtime` repo.
    - **Installation:** Users install the specific runtime package(s) needed for
      their generated code (e.g., `@shtse8/fireschema-ts-client-runtime` if using
      TS Client) along with the corresponding Firebase SDK.
8.  **Helper Functions:** Utility functions (e.g., naming conventions in
    `src/utils/naming.ts`) are used by Adapters.
9.  **CI/CD Publishing (GitHub Actions):**
    - The workflow in the main `firestore-odm` repository focuses on building/testing the CLI tool and documentation. It checks out submodules recursively.
    - **Publishing is handled in separate workflows within each individual runtime package repository.** These workflows trigger on tags specific to that package (e.g., `fireschema_dart_runtime-vX.Y.Z`) and publish only that package to its respective registry (npm or pub.dev).
