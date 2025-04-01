# Active Context: FireSchema (Initial Implementation Complete)

**Current Focus:** Initial core implementation for TypeScript and Dart
generation is complete.

**Recent Changes:**

- Implemented core generator structure (CLI, config/schema loading, EJS
  templating).
- Added generation for TypeScript:
  - Model interfaces (`.types.ts`)
  - Collection references (`.collection.ts`)
  - Type-safe query builders (`.query.ts`)
  - Type-safe update builders (`.update.ts`)
  - Core runtime (`core.ts`)
- Added generation for Dart:
  - Model classes (`_data.dart`)
  - Collection references (`_collection.dart`)
  - Type-safe query builders (`_query.dart`)
  - Type-safe update builders (`_update.dart`)
  - Core runtime (`firestore_odm_core.dart`)
- Addressed feedback regarding type safety for queries and updates in both
  languages.
- Renamed project to "FireSchema".
- Created initial `README.md` with usage instructions and examples.
- Created initial Memory Bank files (`projectbrief`, `productContext`,
  `techContext`, `systemPatterns`).

**Next Steps / Considerations (Based on README TODOs):**

- Refine `fromJson`/`toJson` in Dart models for complex types.
- Improve `AddData`/`UpdateData` type generation (automatic omission of
  read-only fields).
- Implement more query methods (`limitToLast`, `startAt`, `endAt`, etc.) for
  both languages.
- Handle subcollection generation.
- Generate `package.json`/`pubspec.yaml` for output directories.
- Add tests.
- Improve error handling.
