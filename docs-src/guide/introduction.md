# Introduction

Welcome to FireSchema! 🔥📄

FireSchema is a command-line tool designed to streamline your Firestore
development workflow by generating **strongly-typed** Object Document Mapper
(ODM) code directly from your JSON Schema definition.

**The Problem:** Working directly with Firestore SDKs often involves dealing
with `DocumentData` or `Map<String, dynamic>`, leading to potential runtime
errors due to typos or incorrect data types. Keeping data structures consistent
across different platforms (like a web frontend and a mobile app) can also be
challenging.

**The Solution:** FireSchema addresses these issues by:

1. **Centralizing your schema:** Define your collections, fields, types, and
   even basic validation rules in a standard `firestore.schema.json` file.
2. **Generating type-safe code:** Run the `fireschema generate` command to
   produce code for your chosen targets (TypeScript Client, TypeScript Admin,
   Dart Client).
3. **Providing typed access:** Use the generated collection references, query
   builders, and update builders that understand your data structure, enabling
   compile-time checks and autocompletion in your IDE.

**Key Benefits:**

- **Improved Type Safety:** Catch errors early during development.
- **Enhanced Developer Experience:** Benefit from autocompletion and reduced
  boilerplate.
- **Cross-Platform Consistency:** Ensure your data structures align across
  different codebases.
- **Faster Development:** Automate the creation of data access code.

Currently, FireSchema supports generating code for:

- **TypeScript (Client SDK - `firebase` v9+)**
- **TypeScript (Admin SDK - `firebase-admin`)**
- **Dart (Client SDK - `cloud_firestore`)**

Ready to get started? Head over to the [Getting Started](./getting-started.md)
guide!
