# System Patterns: FireSchema (Executor + Adapter Refactor)

**Core Architecture:** Command-Line Executor with Internal Adapters

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
        AdapterTSClient -- Loads --> TemplatesTS[Templates (templates/typescript/)]
        AdapterTSAdmin -- Loads --> TemplatesTS
        AdapterDartClient -- Loads --> TemplatesDart[Templates (templates/dart/)]
        AdapterTSClient -- Uses --> TemplateEngine[EJS]
        AdapterTSAdmin -- Uses --> TemplateEngine
        AdapterDartClient -- Uses --> TemplateEngine
        TemplateEngine -- Rendered Code --> FileSystemWriter
    end

    subgraph User_Project [User Project]
        style User_Project fill:#ccf,stroke:#333,stroke-width:2px
        FileSystemWriter --> GeneratedTS["Generated TS Code (Client or Admin)"];
        FileSystemWriter --> GeneratedDart["Generated Dart Code (Client)"];
        GeneratedTS -- Depends On --> RuntimeTS["@shtse8/fireschema-runtime"];
        GeneratedDart -- Depends On --> RuntimeDart["fireschema_dart_runtime"];
        UserCodeTS[User TS Code] --> GeneratedTS;
        UserCodeDart[User Dart Code] --> GeneratedDart;
        UserInstalls1[User installs] --> RuntimeTS;
        UserInstalls2[User installs] --> RuntimeDart;
        UserInstalls3[User installs] --> SDK_Firebase["firebase (SDK)"];
        UserInstalls4[User installs] --> SDK_Admin["firebase-admin (SDK)"];
        UserInstalls5[User installs] --> SDK_CloudFirestore["cloud_firestore (SDK)"];
    end

    subgraph Runtime_Libraries [Runtime Libraries (Published Packages)]
        style Runtime_Libraries fill:#cfc,stroke:#333,stroke-width:2px
        RuntimeTS
        RuntimeDart
    end

    subgraph Firebase_SDKs [Firebase SDKs (External)]
         style Firebase_SDKs fill:#ffc,stroke:#333,stroke-width:2px
         SDK_Firebase
         SDK_Admin
         SDK_CloudFirestore
    end
```

**Key Patterns:**

1. **CLI Application:** Uses `commander` for command definition, argument
   parsing (`-c` for config), and help generation. Entry point is `src/cli.ts`.
2. **Configuration Loading:** `src/configLoader.ts` reads the specified JSON
   config file, validates the new `target` property for each output, resolves
   relative paths (schema, output directories), and passes the config to the
   Executor.
3. **Schema Validation & Parsing:** `src/schemaLoader.ts` reads the user's JSON
   schema file, validates it against `src/schema-definition.json` (using `ajv`),
   and transforms it into an internal `ParsedFirestoreSchema` representation.
4. **Executor / Orchestrator (`src/generator.ts`):**
   - Receives the parsed schema and config.
   - Iterates through the `outputs` array in the config.
   - For each output, it reads the `target` string (e.g., `'typescript-client'`,
     `'dart-client'`).
   - Dynamically imports or calls the corresponding **internal Adapter module**
     (e.g., from `src/adapters/typescript-client.ts` or a unified
     `src/adapters/typescript.ts` that handles different targets).
   - Invokes a standard function (e.g., `generate`) on the adapter, passing the
     schema, the specific output config (including `target` and `options`), and
     potentially the global config.
   - The Executor itself does **not** contain language-specific logic or
     template rendering code.
5. **Internal Adapters (`src/adapters/*.ts`):**
   - Modules dedicated to specific generation targets (e.g.,
     `typescript-client`, `typescript-admin`, `dart-client`).
   - Each adapter contains **all** logic required for its target:
     - Loading the necessary EJS templates (from the main `templates/`
       directory).
     - Preparing the data object to be passed to EJS, including any
       target-specific flags (like an internal `sdk` flag for TS adapters).
     - Rendering templates using EJS.
     - Writing the generated files to the specified output directory.
     - Handling target-specific `options` from the config.
   - Adapters generate code that relies on the appropriate **Runtime Package**.
6. **Template-Based Code Generation:** Adapters use `ejs` to render templates
   located in the main `templates/` directory (organized by language).
7. **Runtime Libraries (Separate Packages):**
   - `@shtse8/fireschema-runtime`: Contains reusable TypeScript base classes and
     generic types. It handles the differences between `firebase` (client) and
     `firebase-admin` (server) SDKs internally. Generated TypeScript code
     depends on this.
   - `fireschema_dart_runtime`: Contains reusable Dart base classes/mixins.
     Generated Dart code depends on this.
   - These packages are installed by the end-user alongside the relevant
     Firebase SDK (`firebase`, `firebase-admin`, `cloud_firestore`).
8. **Helper Functions:** Utility functions (e.g., naming conventions in
   `src/utils/naming.ts`) are used by Adapters.
9. **CI/CD Publishing (GitHub Actions):** Workflow remains largely the same,
   publishing the core tool (`@shtse8/fireschema`) and the runtime packages.
   Adapters are part of the core tool, not published separately.
