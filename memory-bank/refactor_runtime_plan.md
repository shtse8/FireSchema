# Refactoring Plan: FireSchema Runtime Libraries

**Goal:** Modify the code generator to produce leaner code that relies on
external runtime libraries (`@fireschema/ts-runtime` and
`fireschema_dart_runtime`) for common Firestore interaction logic.

**Phase 1: Setup & Runtime Library Creation**

1. **Establish Runtime Packages:**
   - **TypeScript:** Ensure the `packages/fireschema-ts-runtime` directory
     exists and is set up as a proper Node.js package (create `package.json`,
     `tsconfig.json`, `src/` directory).
   - **Dart:** Create a new directory `packages/fireschema_dart_runtime` and set
     it up as a proper Dart package (create `pubspec.yaml`, `lib/` directory).
2. **Identify Common Logic:**
   - Analyze existing templates (`templates/typescript/*.ejs`,
     `templates/dart/*.ejs`) and generator logic (`src/generators/*.ts`).
   - Pinpoint reusable code related to:
     - Base collection operations (CRUD, path handling, `withConverter`).
     - Query building logic (`where`, `orderBy`, `limit`, pagination).
     - Update building logic (field setting, atomic operations like `increment`,
       `arrayUnion`).
     - Core type definitions and helpers.
3. **Implement Runtime Libraries:**
   - **`@fireschema/ts-runtime`:**
     - Create base classes (e.g., `BaseCollectionRef`, `BaseQueryBuilder`,
       `BaseUpdateBuilder`) in `packages/fireschema-ts-runtime/src/`.
     - Implement the common logic identified in step 2 within these base
       classes.
     - Define necessary interfaces/types (e.g., for configuration, field
       definitions).
     - Export all public APIs from
       `packages/fireschema-ts-runtime/src/index.ts`.
   - **`fireschema_dart_runtime`:**
     - Create equivalent base classes or mixins (e.g., `BaseCollectionRef`,
       `BaseQueryBuilder`, `BaseUpdateBuilder`) in
       `packages/fireschema_dart_runtime/lib/`.
     - Implement the common logic, adapting for Dart patterns (e.g.,
       `withConverter`, extension methods).
     - Define necessary types/classes.
     - Export all public APIs from
       `packages/fireschema_dart_runtime/lib/fireschema_dart_runtime.dart`.

**Phase 2: Refactor Generator & Templates**

4. **Modify TypeScript Generator:**
   - Update `src/generators/typescript.ts`.
   - Modify `templates/typescript/*.ejs` templates:
     - Remove the now-duplicated logic.
     - Add imports from `@fireschema/ts-runtime`.
     - Make generated classes (e.g., `UsersCollection`) extend the corresponding
       base classes (e.g., `BaseCollectionRef`).
     - Pass schema-specific details (collection path, field names/types) to the
       base class constructors or methods.
     - Ensure the generated `core.ts` potentially re-exports necessary items
       from the runtime or is simplified.
5. **Modify Dart Generator:**
   - Update `src/generators/dart.ts`.
   - Modify `templates/dart/*.ejs` templates:
     - Remove duplicated logic.
     - Add imports from
       `package:fireschema_dart_runtime/fireschema_dart_runtime.dart`.
     - Make generated classes use/extend/mixin components from the Dart runtime.
     - Pass schema-specific details to runtime components.
     - Simplify `firestore_odm_core.dart`.

**Phase 3: Integration & Documentation**

6. **Update Core Tool & Build:**
   - Adjust the main `package.json` if needed (e.g., workspaces, build scripts).
   - Ensure the runtime packages can be built and potentially published.
7. **Update Documentation & Examples:**
   - Modify `README.md` to instruct users to install the runtime packages
     (`npm install @fireschema/ts-runtime` /
     `dart pub add fireschema_dart_runtime`).
   - Update example projects/code snippets.
   - **Crucially:** Update Memory Bank files (`techContext.md`,
     `systemPatterns.md`, `progress.md`) to reflect the new architecture.
8. **Testing:**
   - Add unit tests for the runtime libraries.
   - Update/add integration tests to verify the generated code works correctly
     with the runtime libraries.

**New Architecture Overview:**

```mermaid
graph LR
    subgraph FireSchema Tool (Node.js)
        A[User runs `fireschema generate`] --> B{CLI Parser};
        B --> C[Config Loader];
        C --> D[Schema Loader];
        D --> E[Generator Orchestrator];
        C --> E;
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
        L -- imports --> TS_RT[@fireschema/ts-runtime];
        M -- imports --> DART_RT[fireschema_dart_runtime];
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
