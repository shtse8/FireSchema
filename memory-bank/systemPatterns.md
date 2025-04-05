<!-- Version: 1.5 | Last Updated: 2025-04-05 | Updated By: Cline -->
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
        E -- Target='ts-client' --> AdapterTSClient["TS Client Adapter (src/adapters/typescript-client)"];
        E -- Target='ts-admin' --> AdapterTSAdmin["TS Admin Adapter (src/adapters/typescript-admin)"];
        E -- Target='dart-client' --> AdapterDartClient["Dart Client Adapter (src/adapters/dart-client)"];
        E -- Target='csharp-client' --> AdapterCSClient["C# Client Adapter (src/adapters/csharp-client)"];
        AdapterTSClient -- Loads --> TemplatesTSClient["Templates (./templates/)"]
        AdapterTSAdmin -- Loads --> TemplatesTSAdmin["Templates (./templates/)"]
        AdapterDartClient -- Loads --> TemplatesDartClient["Templates (./templates/)"]
        AdapterCSClient -- Loads --> TemplatesCSClient["Templates (./templates/)"]
        AdapterTSClient -- Uses --> TemplateEngine[EJS]
        AdapterTSAdmin -- Uses --> TemplateEngine
        AdapterDartClient -- Uses --> TemplateEngine
        AdapterCSClient -- Uses --> TemplateEngine
        TemplateEngine -- Rendered Code --> FileSystemWriter
        F[Submodule Links (.gitmodules)] --> RuntimeTSClientRepoRef["packages/fireschema-ts-client-runtime"];
        F --> RuntimeTSAdminRepoRef["packages/fireschema-ts-admin-runtime"];
        F --> RuntimeDartRepoRef["packages/fireschema_dart_runtime"];
        F --> RuntimeCSRepoRef["packages/fireschema-csharp-runtime"]; // Updated: No longer planned
    end

    subgraph User_Project [User Project]
        style User_Project fill:#ccf,stroke:#333,stroke-width:2px
        FileSystemWriter --> GeneratedTS["Generated TS Code (Client or Admin)"];
        FileSystemWriter --> GeneratedDart["Generated Dart Code (Client)"];
        FileSystemWriter --> GeneratedCS["Generated C# Code (Client)"];
        GeneratedTSClient[Generated TS Client Code] -- Depends On --> RuntimeTSClient["@shtse8/fireschema-ts-client-runtime"];
        GeneratedTSAdmin[Generated TS Admin Code] -- Depends On --> RuntimeTSAdmin["@shtse8/fireschema-ts-admin-runtime"];
        GeneratedDart -- Depends On --> RuntimeDart["fireschema_dart_runtime"];
        GeneratedCS -- Depends On --> RuntimeCS["FireSchema.CS.Runtime"]; // Updated: No longer planned
        UserCodeTS[User TS Code] --> GeneratedTS;
        UserCodeDart[User Dart Code] --> GeneratedDart;
        UserCodeCS[User C# Code] --> GeneratedCS;
        UserInstalls1[User installs] --> RuntimeTSClient;
        UserInstalls1a[User installs] --> RuntimeTSAdmin;
        UserInstalls2[User installs] --> RuntimeDart;
        UserInstalls2a[User installs] --> RuntimeCS;
        UserInstalls3[User installs] --> SDK_Firebase["firebase (SDK)"];
        UserInstalls4[User installs] --> SDK_Admin["firebase-admin (SDK)"];
        UserInstalls5[User installs] --> SDK_CloudFirestore["cloud_firestore (SDK)"];
        UserInstalls6[User installs] --> SDK_GoogleFirestore["Google.Cloud.Firestore (SDK)"];
    end

    subgraph Runtime_Libraries [Runtime Libraries (Separate Repositories)]
        style Runtime_Libraries fill:#cfc,stroke:#333,stroke-width:2px
        RuntimeTSClientRepo["Repo: fireschema-ts-client-runtime"] --> RuntimeTSClient;
        RuntimeTSAdminRepo["Repo: fireschema-ts-admin-runtime"] --> RuntimeTSAdmin;
        RuntimeDartRepo["Repo: fireschema-dart-runtime"] --> RuntimeDart;
        RuntimeCSRepo["Repo: fireschema-csharp-runtime"] --> RuntimeCS; // Updated: No longer planned
    end

    subgraph Firebase_SDKs [Firebase SDKs (External)]
         style Firebase_SDKs fill:#ffc,stroke:#333,stroke-width:2px
         SDK_Firebase
         SDK_Admin
         SDK_CloudFirestore
         SDK_GoogleFirestore
    end
```

**Key Patterns:**

1.  **CLI Application:** Uses `commander`. Entry point `src/cli.ts`.
2.  **Configuration Loading:** `src/configLoader.ts` validates `target`, resolves paths.
3.  **Schema Validation & Parsing:** `src/schemaLoader.ts` uses `ajv`.
4.  **Executor / Orchestrator (`src/generator.ts`):** Iterates outputs, dynamically imports internal Adapter modules based on `target`.
5.  **Internal Adapters (`src/adapters/*.ts`):** Target-specific logic, loads own EJS templates, writes files, relies on corresponding Runtime Package.
6.  **Template-Based Code Generation:** Adapters use `ejs`.
7.  **Runtime Libraries (Separate Repositories & Submodules):**
    *   Runtime logic lives in dedicated Git repositories, linked via Git submodules in `packages/`.
    *   Allows independent versioning.
    *   **`@shtse8/fireschema-ts-client-runtime`**
    *   **`@shtse8/fireschema-ts-admin-runtime`**
    *   **`fireschema_dart_runtime`**
    *   **`FireSchema.CS.Runtime`** (In `fireschema-csharp-runtime` repo, added as submodule)
    *   **Installation:** Users install needed runtime package(s) + corresponding SDK.
8.  **Helper Functions:** Utilities used by Adapters.
9.  **CI/CD Publishing (GitHub Actions):** Main repo builds CLI/docs. Runtime publishing handled in individual runtime repos.
