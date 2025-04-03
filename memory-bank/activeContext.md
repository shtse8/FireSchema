# Active Context: FireSchema (Executor + Adapter Refactor Complete)

**Current Focus:** Runtime unit test expansion for base classes is complete.
Next: Expand runtime integration test coverage.

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
  - Expanded unit tests for `ts-client-runtime` and `ts-admin-runtime`:
    - Added tests for `subCollection`, `parentRef` constructor logic, and
      `applyDefaults` in `baseCollection.test.ts` for both runtimes.
    - Created and populated `baseQueryBuilder.test.ts` for both runtimes.
    - Created and populated `baseUpdateBuilder.test.ts` for both runtimes.
    - Made `subCollection` method public in both base collection classes.
  - Created initial integration test files (`client.integration.test.ts`,
    `admin.integration.test.ts`) for `ts-client-runtime` and `ts-admin-runtime`,
    configured for Firestore emulator.
    - Resolved Jest transformation issues by switching to `babel-jest`. All TS
      runtime tests pass with `npx jest`.
- **Documentation:**
  - Replaced TypeDoc setup with VitePress.
  - Created initial VitePress site structure (`docs-src`), configuration
    (`config.mts`), homepage (`index.md`), and basic guide pages.
  - Added npm scripts for VitePress (`docs:dev`, `docs:build`, `docs:preview`).
  - Updated GitHub Actions workflow (`publish.yml`) to build and deploy
    VitePress site to GitHub Pages.

**Next Steps:**

1. **Expand Runtime Tests:**
   - ~~Add comprehensive test cases to unit tests for `ts-client-runtime` and
     `ts-admin-runtime` (covering `BaseCollectionRef`, `BaseQueryBuilder`,
     `BaseUpdateBuilder`).~~ **(Done)**
   - Add comprehensive test cases to integration tests for `ts-client-runtime`
     and `ts-admin-runtime` (covering CRUD, queries, updates, subcollections,
     default values). - **(Next Task)**
2. **Populate VitePress Documentation:** Add more detailed content to the
   VitePress site (`docs-src`), explaining features, API, and advanced usage.
3. **(Optional) Address Minor Test Issues:** Investigate the `jest.mock` errors
   reported by `bun test` (but not `npx jest`).
4. **(Future) Implement More Adapters:** Add adapters for new targets (e.g.,
   `dart-server-rest`, `csharp-client`).
5. **(Future) Generator Enhancements:** Add support for more complex schema
   validation rules, improve error reporting.
6. **(Future) Documentation:** Continue refining and expanding the VitePress
   documentation.
