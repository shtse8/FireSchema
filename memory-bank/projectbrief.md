# Project Brief: FireSchema

**Goal:** Create a command-line tool named "FireSchema" that generates
strongly-typed Object Document Mapper (ODM) code for Google Firestore.

**Target Languages:** TypeScript and Dart (initial focus).

**Core Functionality:**

- Define Firestore schema (collections, fields, types, basic relationships)
  using JSON Schema.
- Use a configuration file to specify schema location and output targets
  (language, directory).
- Generate language-specific code including:
  - Typed data models/interfaces.
  - Typed collection reference classes with CRUD operations.
  - Type-safe query builders.
  - Type-safe update builders supporting atomic operations.
  - Core runtime helpers/re-exports.
- The generator tool itself will be built with Node.js/TypeScript for `npx`
  compatibility.

**Primary Objective:** Improve type safety, developer experience, and
cross-platform model consistency when working with Firestore.
