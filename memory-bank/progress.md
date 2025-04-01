# Progress: FireSchema (Initial Implementation)

**What Works:**

- Core CLI tool (`fireschema generate`) execution via Node.js.
- Parsing and validation of `fireschema.config.json`.
- Parsing and validation of `firestore.schema.json` against the defined
  structure.
- Generation of basic TypeScript ODM code:
  - Model interfaces (`.types.ts`)
  - Collection references (`.collection.ts`) with CRUD, basic default handling.
  - Type-safe query builders (`.query.ts`) with `where<Field>`, `orderBy`,
    `limit`.
  - Type-safe update builders (`.update.ts`) with `set<Field>`, atomic ops
    (`increment`, `arrayUnion/Remove`, `deleteField`, `serverTimestamp`).
  - Core runtime (`core.ts`).
- Generation of basic Dart ODM code:
  - Model classes (`_data.dart`) with `fromJson`/`toJson`/`copyWith`.
  - Collection references (`_collection.dart`) with CRUD via `withConverter`.
  - Type-safe query builders (`_query.dart`) with `where<Field>`, `orderBy`,
    `limit`.
  - Type-safe update builders (`_update.dart`) with `set<Field>`, atomic ops.
  - Core runtime (`firestore_odm_core.dart`).
- Example schema and config files are functional.
- Basic `README.md` and Memory Bank files created.

**What's Left (High Level):**

- Subcollection generation logic.
- More advanced query features (pagination, cursors).
- Refinements to `fromJson`/`toJson` for complex nested types.
- Refinements to `AddData`/`UpdateData` types.
- Generation of package manifest files (`package.json`, `pubspec.yaml`).
- Comprehensive testing (unit, integration).
- Robust error handling and reporting.
- Documentation improvements (advanced usage, schema details).

**Current Status:** Initial functional version complete for both TypeScript and
Dart, addressing core requirements and initial feedback on type safety. Ready
for further refinement or feature additions.

**Known Issues:**

- Dart `fromJson`/`toJson` needs better handling for nested types/references.
- Dart `UpdateBuilder` doesn't automatically handle `serverTimestamp` default
  (requires explicit `set<Field>(FieldValue.serverTimestamp())`).
- TypeScript `UpdateBuilder` doesn't easily support updating nested map fields
  (e.g., `settings.theme`) via dot notation yet.
- Type safety for `whereIn`, `notIn`, `arrayContainsAny` value parameters in
  Dart query builder could be improved (currently uses `List<dynamic>` or
  `List<List<Type>>` in some cases).
