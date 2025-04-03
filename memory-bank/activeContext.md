# Active Context: FireSchema (Executor + Adapter Refactor Complete)

**Current Focus:** TS Runtime refactoring (Independent Runtimes) complete. Next:
Review/Update tests.

**Recent Changes (Executor + Adapter Refactor):**

- **Configuration:** Updated config format (`src/types/config.ts`,
  `src/configLoader.ts`) to use a single `target` string (e.g.,
  `'typescript-client'`, `'typescript-admin'`, `'dart-client'`) instead of
  separate `language` and `sdk` fields.
- **Core Generator (Executor):** Rewrote `src/generator.ts` to act as an
  orchestrator. It reads the `target` from the config, dynamically loads the
  corresponding internal adapter module (from `src/adapters/`), and calls its
  `generate` function.
- **Adapters (Internal):**
  - Created `src/adapters/` directory.
  - Moved and refactored logic from old `src/generators/` into new adapter files
    (`src/adapters/typescript.ts`, `src/adapters/dart.ts`).
  - Adapters now load their own specific templates from subdirectories (e.g.,
    `src/adapters/typescript-client/templates/`).
- **Templates:** Split TypeScript templates into separate versions for Client
  and Admin, located within their respective adapter directories. Removed
  conditional `sdk` logic from templates. Fixed persistent Dart EJS template
  errors.
- **Runtime Refactor (Independent Runtimes):**
  - Abandoned "Interface Package" approach due to SDK structural differences.
  - Deleted `@shtse8/fireschema-core-types`.
  - Rewrote `@shtse8/fireschema-ts-client-runtime` (using `firebase` v9+
    functions).
  - Rewrote `@shtse8/fireschema-ts-admin-runtime` (using `firebase-admin`
    methods).
  - Updated Adapters and Templates to use new runtimes.
  - Updated `package.json` (direct SDK dependencies) and `tsconfig.json` files.
  - Project successfully builds (`tsc -b`).
- **Testing:**
  - Updated generator tests (`src/__tests__/generator.test.ts`) to use the new
    `target` config format.
  - Updated/added snapshots for TS client, TS admin, and Dart client targets.
  - Fixed import errors in generator tests (`src/__tests__/generator.test.ts`).
  - Created initial unit test files (`baseCollection.test.ts`) for
    `ts-client-runtime` and `ts-admin-runtime`.
  - Created initial integration test files (`client.integration.test.ts`,
    `admin.integration.test.ts`) for `ts-client-runtime` and `ts-admin-runtime`,
    configured for Firestore emulator.

**Next Steps:**

1. **Expand Runtime Tests:** - **(Current Task)**
   - Add comprehensive test cases to unit tests for `ts-client-runtime` and
     `ts-admin-runtime` (covering `BaseCollectionRef`, `BaseQueryBuilder`,
     `BaseUpdateBuilder`).
   - Add comprehensive test cases to integration tests for `ts-client-runtime`
     and `ts-admin-runtime` (covering CRUD, queries, updates, subcollections,
     default values).
   - Snapshot tests (`src/__tests__/generator.test.ts`) are up-to-date.
2. **Run Integration Tests:** Ensure Firestore emulator is running and re-run
   `npx jest`.
3. **(Optional) Address Minor Test Issues:** Investigate the `jest.mock` errors
   reported by `bun test` (but not `npx jest`).
4. **(Future) Implement More Adapters:** Add adapters for new targets (e.g.,
   `dart-server-rest`, `csharp-client`).
5. **(Future) Generator Enhancements:** Add support for more complex schema
   validation rules, improve error reporting.
6. **(Future) Documentation:** Update documentation for the new architecture.
