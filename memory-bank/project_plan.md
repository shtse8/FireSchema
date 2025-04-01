# Project Plan: FireSchema

This plan outlines the steps to create the Firestore ODM generator tool.

**Assumed Initial Feature Set:**

- **Core CRUD:** `get`, `add`, `set` (with merge options), `update`, `delete`
  (documents).
- **Atomic Operations:** `serverTimestamp` (for creation/update),
  `increment`/`decrement`, `arrayUnion`, `arrayRemove`, `delete` (for removing
  specific fields during updates).
- **Basic Queries:** `where` clauses (supporting operators: `==`, `!=`, `>`,
  `<`, `>=`, `<=`, `in`, `not-in`, `array-contains`, `array-contains-any`),
  `orderBy` (ascending/descending), `limit`.
- **Relationships:** Support for `DocumentReference` types defined in the
  schema.
- **Subcollections:** Access to defined subcollections.

**Generator Tool Technology:**

- TypeScript/Node.js (for `npx` compatibility).

---

**Steps:**

1. **Project Initialization & Setup:**
   - Create main project directory: `fireschema`.
   - Initialize Node.js project: `npm init -y`.
   - Set up TypeScript compilation: Install `typescript`, `@types/node`,
     configure `tsconfig.json`.
   - Create basic directory structure: `src/`, `templates/`, `examples/`.
   - Initialize Git repository: `git init`.
   - Create `.gitignore`.

2. **Core Generator Development (in `src/`):**
   - Schema Parsing & Validation (using `ajv`).
   - Configuration Parsing (`fireschema.config.json`).
   - Code Generation Engine (Templating: EJS/Handlebars/etc.).
   - CLI Interface (`commander`/`yargs`, `generate` command, `npx` support via
     `package.json` `bin`).

3. **TypeScript ODM Generation (`language: "typescript"`):**
   - Templates for models, collection references, query builders, core runtime
     (using `firebase/firestore`).
   - Generation logic.
   - Output `.ts` files and optional `package.json`.

4. **Dart ODM Generation (`language: "dart"`):**
   - Templates for models (`fromJson`/`toJson`/`copyWith`), collection
     references, query builders, core runtime (using `cloud_firestore`).
   - Generation logic.
   - Output `.dart` files and optional `pubspec.yaml`.

5. **Memory Bank & Documentation:**
   - Create `memory-bank/` directory.
   - Draft initial Memory Bank files (`projectbrief.md`, `productContext.md`,
     etc.).
   - Create main `README.md`.
   - Add example schema and config files in `examples/`.

---

**Diagram: High-Level Workflow**

```mermaid
graph TD
    A[User defines firestore.schema.json] --> B{fireschema generate};
    C[User defines fireschema.config.json] --> B;
    B --> D[Generator Core (Node.js/TS)];
    D --> E{Parse & Validate Schema};
    D --> F{Parse & Validate Config};
    E --> G[Generate Code];
    F --> G;
    G -- TypeScript --> H[Generate TS ODM Files];
    G -- Dart --> I[Generate Dart ODM Files];
    H --> J[Output TS Code + Core Runtime];
    I --> K[Output Dart Code + Core Runtime];
    J --> L[User's TS Project];
    K --> M[User's Dart Project];
```
