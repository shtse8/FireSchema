# Introduction

Welcome to FireSchema! 🔥📄

FireSchema is a command-line tool designed to streamline your Firestore
development workflow by generating **strongly-typed** Object Document Mapper
(ODM) code directly from your **JSON Schema** definition. It acts as a bridge
between your defined data structure and your application code, enhancing type
safety and developer productivity.

## The Problem

Working directly with Firestore SDKs often involves dealing with raw
`DocumentData` or `Map<String, dynamic>`. This schemaless approach, while
flexible, can lead to:

- **Runtime Errors:** Typos in field names or incorrect data types are only
  caught at runtime.
- **Inconsistent Data:** Maintaining consistent data structures across different
  platforms (e.g., a web frontend using TypeScript and a mobile app using Dart)
  becomes manual and error-prone.
- **Boilerplate Code:** Writing repetitive code for data conversion
  (`fromJson`/`toJson`) and basic CRUD operations.
- **Lack of Autocompletion:** IDEs cannot provide accurate suggestions for field
  names or query structures without a defined schema.

## The Solution: Schema-First Firestore Development

FireSchema promotes a **schema-first** approach:

1. **Centralize Your Schema:** Define your Firestore collections, fields, types,
   relationships, and even basic validation rules using the well-established
   **JSON Schema** standard in a `firestore.schema.json` file. This file becomes
   the single source of truth for your data structure.
2. **Configure Your Targets:** Specify which languages and SDKs you need code
   for (e.g., TypeScript Client, TypeScript Admin, Dart Client) and where the
   output should go in a `fireschema.config.json` file.
3. **Generate Type-Safe Code:** Run the `fireschema generate` command.
   FireSchema parses your schema and configuration, then generates tailored ODM
   code for each specified target.
4. **Develop with Confidence:** Use the generated components in your application
   code, benefiting from compile-time checks, intelligent autocompletion, and
   significantly reduced boilerplate.

## Core Generated Components

For each collection defined in your schema, FireSchema typically generates:

- **Typed Models/Interfaces:** Language-specific classes or interfaces
  representing your document data (e.g., `User`, `Product`).
- **Typed Collection References:** Classes providing type-safe access to a
  specific Firestore collection (e.g., `UsersCollection`), including methods for
  `add`, `set`, `get`, `delete`.
- **Type-Safe Query Builders:** Classes allowing you to build complex Firestore
  queries with compile-time checks for field names and operators (e.g.,
  `UsersQueryBuilder`).
- **Type-Safe Update Builders:** Classes for constructing atomic update
  operations (e.g., `set`, `increment`, `arrayUnion`) with type safety (e.g.,
  `UsersUpdateBuilder`).

## Key Benefits

- ✅ **Improved Type Safety:** Catch data structure errors during development,
  not in production.
- 🚀 **Enhanced Developer Experience:** Leverage IDE autocompletion and reduce
  manual type casting.
- 🔄 **Cross-Platform Consistency:** Ensure data models align across different
  codebases (TS/Dart).
- ⚡ **Faster Development:** Automate the creation and maintenance of data
  access code.
- 📄 **Living Documentation:** Your JSON Schema serves as clear documentation
  for your database structure.

## Supported Targets

Currently, FireSchema supports generating code for:

- **TypeScript (Client SDK - `firebase` v9+)**
- **TypeScript (Admin SDK - `firebase-admin`)**
- **Dart (Client SDK - `cloud_firestore`)**

Ready to simplify your Firestore workflow? Head over to the
[Getting Started](./getting-started.md) guide!
