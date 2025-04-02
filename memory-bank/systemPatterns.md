# System Patterns: FireSchema (Runtime Refactor)

**Core Architecture:** Command-Line Code Generator with Runtime Libraries

```mermaid
graph LR
    subgraph FireSchema Tool (Node.js Monorepo)
        A[User runs `fireschema generate`] --> B{CLI Parser (commander)};
        B -- Config Path --> C[Config Loader];
        C -- Schema Path --> D[Schema Loader];
        D -- Validated Schema --> E[Generator Orchestrator];
        C -- Config Object --> E;
        E -- Target: TS --> F[TS Generator];
        E -- Target: Dart --> G[Dart Generator];
        F -- Schema, Config --> H{EJS Template Engine};
        G -- Schema, Config --> H;
        I[TS Templates (Leaner)] --> H;
        J[Dart Templates (Leaner)] --> H;
        H -- Rendered Code --> K[File System Writer];
    end

    subgraph User Project
        K --> L[Generated TS Files];
        K --> M[Generated Dart Files];
        L -- imports & extends --> TS_RT[@fireschema/ts-runtime];
        M -- imports & extends --> DART_RT[fireschema_dart_runtime];
        UserCodeTS[User TS Code] --> L;
        UserCodeDart[User Dart Code] --> M;
        UserInstalls1[User installs] --> TS_RT;
        UserInstalls2[User installs] --> DART_RT;
    end

    subgraph Runtime Libraries (Published Packages)
        TS_RT
        DART_RT
    end

    style FireSchema Tool fill:#f9f,stroke:#333,stroke-width:2px
    style User Project fill:#ccf,stroke:#333,stroke-width:2px
    style Runtime Libraries fill:#cfc,stroke:#333,stroke-width:2px
```

**Key Patterns:**

1. **CLI Application:** Uses `commander` for command definition, argument
   parsing (`-c` for config), and help generation. Entry point is `src/cli.ts`.
2. **Configuration Loading:** `src/configLoader.ts` reads the specified JSON
   config file, performs basic validation, and resolves relative paths (schema,
   output directories) to absolute paths based on the config file's location.
3. **Schema Validation & Parsing:** `src/schemaLoader.ts` reads the user's JSON
   schema file, validates its structure against a predefined JSON Schema
   (`src/schema-definition.json`) using `ajv`, and transforms the raw JSON into
   an internal `ParsedFirestoreSchema` TypeScript representation.
4. **Template-Based Code Generation:** Uses `ejs` as the templating engine.
   Language-specific templates (`templates/typescript/`, `templates/dart/`) are
   now leaner, focusing on generating the schema-specific parts (model
   interfaces/classes, field-specific builder methods) and importing/extending
   base classes from the runtime libraries.
5. **Orchestration:** `src/generator.ts` contains the main `generate` function
   which iterates through the output targets defined in the configuration and
   calls the appropriate language-specific generator function.
6. **Language-Specific Generators:** `src/generators/typescript.ts` and
   `src/generators/dart.ts` contain the logic specific to each language,
   including:
   - Loading the correct (leaner) templates.
   - Preparing the data object to be passed to EJS (including schema details
     needed by base classes).
   - Rendering templates using EJS.
   - Writing the generated files to the specified output directory.
   - **Recursive Structure:** Each generator uses a helper function (e.g.,
     `generateFilesForCollection`) that processes a single collection and calls
     itself recursively for any defined subcollections, ensuring nested
     generation.
7. **Helper Functions:** Utility functions (e.g., naming conventions in
   `src/utils/naming.ts`, type generation helpers within generator files) are
   used to assist template rendering and maintain consistency.
8. **Builder Pattern (Runtime-Based):** The core logic for update
   (`BaseUpdateBuilder`) and query (`BaseQueryBuilder`) operations resides in
   the runtime libraries. The generated code extends these base builders,
   providing schema-specific, type-safe methods (e.g., `where<FieldName>`,
   `set<FieldName>`) that delegate to the base class's implementation.
9. **Runtime Libraries:** Separate packages (`@fireschema/ts-runtime`,
   `fireschema_dart_runtime`) contain the reusable base classes and logic,
   allowing generated code to be smaller and updates to Firestore interaction
   logic to be centralized.
