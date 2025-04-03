# Active Context: FireSchema (Executor + Adapter Refactor Complete)

**Current Focus:** Architectural Refactoring to Executor + Adapter Pattern.
**(Completed)**

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
  - Adapters now handle loading their own templates and target-specific logic
    (e.g., the TS adapter determines the `sdk` flag based on the `target`
    string).
- **Runtime Packages:** `@shtse8/fireschema-runtime` (TS) and
  `fireschema_dart_runtime` (Dart) remain separate and contain the base
  logic/types. The TS runtime supports both client and admin SDKs internally.
- **Templates:** Updated TS templates to use the `sdk` flag passed by the
  adapter and import generic types from the runtime. Fixed persistent Dart EJS
  template errors.
- **Testing:**
  - Updated generator tests (`src/__tests__/generator.test.ts`) to use the new
    `target` config format.
  - Updated/added snapshots for TS client, TS admin, and Dart client targets.
  - Refactored runtime unit tests
    (`packages/fireschema-ts-runtime/src/__tests__/`) to align with base class
    changes and use `npx jest` (resolving previous `jest.mock` errors).
  - All tests now pass when run with `npx jest`.

**Next Steps:**

1. **Update Memory Bank:** Update `progress.md`, `systemPatterns.md`,
   `techContext.md`. **(In Progress)**
2. **(Optional) Address Minor Test Issues:** Investigate the `fs` syntax error
   reported by `bun test` (but not `npx jest`).
3. **(Future) Implement More Adapters:** Add adapters for new targets (e.g.,
   `dart-server-rest`, `csharp-client`).
4. **(Future) Generator Enhancements:** Add support for more complex schema
   validation rules, improve error reporting.
5. **(Future) Documentation:** Update documentation for the new architecture.
