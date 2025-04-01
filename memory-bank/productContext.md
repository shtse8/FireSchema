# Product Context: FireSchema

**Problem:**

- Firestore's schemaless nature, while flexible, leads to challenges in
  maintaining data consistency and type safety, especially in larger projects or
  multi-platform applications (e.g., web frontend + mobile app).
- Lack of compile-time checks for field names, types, and query structures
  increases the risk of runtime errors.
- Synchronizing data models across different languages (like TypeScript and
  Dart) manually is error-prone and time-consuming.
- Standard Firestore SDKs require boilerplate code for type conversions
  (`fromJson`/`toJson`) and lack built-in, strongly-typed query and update
  builders tied to a defined schema.

**Solution:** FireSchema acts as a code generation layer on top of Firestore. By
defining the intended schema using JSON Schema, developers can automatically
generate strongly-typed ODM code for their target languages.

**How it Works:**

1. Developers define their Firestore structure in a `firestore.schema.json`
   file.
2. A `fireschema.config.json` file specifies the schema location and desired
   outputs (e.g., TypeScript to `./src/generated`, Dart to `./lib/generated`).
3. Running `fireschema generate` parses the schema and config, then generates
   the corresponding ODM code.
4. Developers use the generated classes (e.g., `UsersCollection`,
   `UsersQueryBuilder`, `UsersUpdateBuilder`) in their application code,
   benefiting from type checking, autocompletion, and reduced boilerplate.

**User Experience Goals:**

- **Simple Configuration:** Easy-to-understand JSON configuration for schema and
  outputs.
- **Standard Schema:** Leverage the familiarity of JSON Schema for definitions.
- **Type Safety:** Provide compile-time safety for model access, queries, and
  updates.
- **Developer Efficiency:** Reduce boilerplate code for data access and
  manipulation.
- **Consistency:** Ensure data models are consistent across different codebases
  (TS/Dart).
- **Minimal Dependencies:** Embed core runtime logic directly into generated
  code to avoid extra package dependencies in user projects.
