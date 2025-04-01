# System Patterns: FireSchema

**Core Architecture:** Command-Line Code Generator

```mermaid
graph LR
    A[User runs `fireschema generate`] --> B{CLI Parser (commander)};
    B -- Config Path --> C[Config Loader];
    C -- Schema Path --> D[Schema Loader];
    D -- Validated Schema --> E[Generator Orchestrator];
    C -- Config Object --> E;
    E -- Target: TS --> F[TypeScript Generator];
    E -- Target: Dart --> G[Dart Generator];
    F -- Schema, Config --> H{EJS Template Engine};
    G -- Schema, Config --> H;
    I[TS Templates] --> H;
    J[Dart Templates] --> H;
    H -- Rendered Code --> K[File System Writer];
    K --> L[Generated TS Files];
    K --> M[Generated Dart Files];
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
   Language-specific templates are stored in `templates/typescript/` and
   `templates/dart/`.
5. **Orchestration:** `src/generator.ts` contains the main `generate` function
   which iterates through the output targets defined in the configuration and
   calls the appropriate language-specific generator function.
6. **Language-Specific Generators:** `src/generators/typescript.ts` and
   `src/generators/dart.ts` contain the logic specific to each language,
   including:
   - Loading the correct templates.
   - Preparing the data object to be passed to EJS.
   - Rendering templates using EJS.
   - Writing the generated files to the specified output directory.
   - **Recursive Structure:** Each generator uses a helper function (e.g.,
     `generateFilesForCollection`) that processes a single collection and calls
     itself recursively for any defined subcollections, ensuring nested
     generation.
7. **Helper Functions:** Utility functions (e.g., naming conventions in
   `src/utils/naming.ts`, type generation helpers within generator files) are
   used to assist template rendering and maintain consistency.
8. **Builder Pattern:** Used for generating type-safe update (`UpdateBuilder`)
   and query (`QueryBuilder`) operations, providing a fluent API for users of
   the generated code.
