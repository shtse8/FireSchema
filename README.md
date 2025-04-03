# FireSchema 🔥📄

[![npm version](https://badge.fury.io/js/%40shtse8%2Ffireschema.svg)](https://badge.fury.io/js/%40shtse8%2Ffireschema)
[![pub version](https://img.shields.io/pub/v/fireschema_dart_runtime.svg)](https://pub.dev/packages/fireschema_dart_runtime)
<!-- Add other badges as needed: license, build status -->

FireSchema is a command-line tool that generates strongly-typed Object Document Mapper (ODM) code for Google Firestore based on a JSON Schema definition. It aims to improve type safety, developer experience, and collaboration when working with Firestore, especially in multi-language projects (TypeScript & Dart).

Stop writing repetitive boilerplate and prevent runtime errors caused by typos or incorrect data structures. Define your schema once and let FireSchema generate type-safe, easy-to-use code for interacting with Firestore.

**➡️ [View the Full Documentation Site for Complete Details](https://shtse8.github.io/FireSchema/)**

## Key Features

-   **🔥 Schema-Driven Generation:** Define your Firestore structure once using JSON Schema.
-   **🔒 Type Safety First:** Catch data errors at compile time. Strongly-typed models, query builders, and update builders.
-   **🎯 Multi-Target Support:** Generate code for TypeScript (Client & Admin SDKs) and Dart (Client SDK).
-   **⚙️ Independent Runtimes:** Lightweight, target-specific runtime libraries provide base functionality.
-   **🚀 Boost Productivity:** Automate boilerplate for CRUD, queries, and atomic operations.
-   **🧩 Extensible Adapters:** Potential to support more languages in the future.

## Feature Status & Roadmap

Here's a snapshot of current support and future plans:

| Target Platform         | Status      | Supported SDK¹                 | Test Coverage²                     | Key Features / Notes                                                                                                                               |
| :---------------------- | :---------- | :----------------------------- | :--------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------- |
| **TypeScript (Client)** | ✅ Supported | `firebase` v9+ (Modular)       | Unit & Integration (Emulator)    | Ideal for Web Apps (React, Vue, etc.) & Node.js clients. Full CRUD, Querying, Streaming, Subcollections, Transactions/Batches.                       |
| **TypeScript (Admin)**  | ✅ Supported | `firebase-admin` (Node.js)     | Unit & Integration (Emulator)    | Ideal for Backends (Node.js, Cloud Functions). Full CRUD, Querying, Subcollections, Transactions/Batches. **No Streaming.**                           |
| **Dart (Client)**       | ✅ Supported | `cloud_firestore` (Flutter)    | Unit (Fake) & Integration (Emulator) | Ideal for Flutter Apps & Dart clients. Full CRUD, Querying, Streaming, Subcollections, Transactions/Batches. Includes `serverTimestamp` handling on `add`. |
| **Dart (Admin/Server)** | ⏳ Planned   | Firestore REST API             | N/A                                | Target: `dart-admin-rest` (tentative). **Addresses lack of official Dart Admin SDK**, enabling type-safe backend Dart Firestore access.             |
| **C# (Client)**         | ⏳ Planned   | Firebase SDK for .NET (TBD)    | N/A                                | Target: `csharp-client` (tentative). For Unity, MAUI, Blazor, etc.                                                                                 |

**Core Features (Supported across all current runtimes):**

-   JSON Schema Definition (`timestamp`, `geopoint`, `reference`, `$ref`, basic validation)
-   Configuration File (`fireschema.config.json`)
-   Code Generation CLI (`fireschema generate`)
-   Type-Safe Data Models (`Data`, `AddData`, Nested Types, Enums)
-   Type-Safe Collection References with CRUD (`get`, `add`, `set`, `delete`)
-   Type-Safe Query Builders (`where[Field]`, `orderBy`, `limit`, Cursors, `in`, `array-contains`, etc.)
-   Type-Safe Update Builders (`set[Field]`, `increment[Field]`, `serverTimestamp`, `updateRaw` for `FieldValue`)
-   Subcollection Accessors

**Notes:**

1.  You must install the specified Firebase SDK alongside the corresponding FireSchema runtime package in your project.
2.  Test coverage indicates that automated tests exist for core runtime functionality. See the full documentation for details.

## Installation

1.  **Install CLI:**
    ```bash
    npm install -g @shtse8/fireschema
    # Or: npm install --save-dev @shtse8/fireschema
    ```
2.  **Install Runtimes & SDKs:** Install the required runtime(s) (`@shtse8/fireschema-ts-client-runtime`, `@shtse8/fireschema-ts-admin-runtime`, `fireschema_dart_runtime`) **AND** the corresponding Firebase SDK (`firebase`, `firebase-admin`, `cloud_firestore`) in your target project(s).

**➡️ See the [Installation Guide](https://shtse8.github.io/FireSchema/guide/installation.html) for full details.**

## Basic Usage Examples

*(Assumes you have defined a `users` collection in `firestore.schema.json` and configured the respective target in `fireschema.config.json`)*

### TypeScript Client (`firebase` v9+)

```typescript
import { firestore } from './_setup'; // Your initialized Firestore instance
import { UsersCollection } from './generated/firestore/users.collection'; // Adjust path
import { UserData, UserAddData } from './generated/firestore/users.types';
import { serverTimestamp } from 'firebase/firestore';

const usersCollection = new UsersCollection(firestore);
const userId = 'user-client-123';

async function clientExample() {
  // Add
  const newUser: UserAddData = { displayName: 'TS Client User', email: 'client@example.com' };
  const newUserRef = await usersCollection.add(newUser);
  console.log('Added:', newUserRef.id);

  // Get
  const fetchedUser = await usersCollection.get(newUserRef.id);
  console.log('Fetched:', fetchedUser?.displayName);

  // Query
  const activeUsers = await usersCollection.query()
    .whereIsActive("==", true) // Assumes isActive field
    .limit(10)
    .getData();
  console.log('Active Users:', activeUsers.length);

  // Update
  await usersCollection.update(newUserRef.id)
    .incrementAge(1) // Assumes age field
    .setLastLogin(serverTimestamp()) // Assumes lastLogin field
    .commit();
  console.log('Updated:', newUserRef.id);
}
```
**➡️ See the full [TypeScript Client Guide](https://shtse8.github.io/FireSchema/guide/typescript-client.html)**

### TypeScript Admin (`firebase-admin`)

```typescript
import { firestore } from './_setup'; // Your initialized Admin Firestore instance
import { UsersCollection } from './generated/firestore-admin/users.collection'; // Adjust path
import { UserData, UserAddData } from './generated/firestore-admin/users.types';
import * as admin from 'firebase-admin';
const { FieldValue } = admin.firestore;

const usersCollection = new UsersCollection(firestore);
const userId = 'user-admin-123';

async function adminExample() {
  // Add
  const newUser: UserAddData = { displayName: 'TS Admin User', email: 'admin@example.com' };
  const newUserRef = await usersCollection.add(newUser);
  console.log('Admin Added:', newUserRef.id);

  // Get
  const fetchedUser = await usersCollection.get(newUserRef.id);
  console.log('Admin Fetched:', fetchedUser?.displayName);

  // Query
  const adminUsers = await usersCollection.query()
    .whereRole("==", "admin") // Assumes role field
    .limit(10)
    .getData();
  console.log('Admin Users:', adminUsers.length);

  // Update
  await usersCollection.update(newUserRef.id)
    .incrementLoginCount(1) // Assumes loginCount field
    .setLastLogin(FieldValue.serverTimestamp()) // Use admin FieldValue
    .commit();
  console.log('Admin Updated:', newUserRef.id);
}
```
**➡️ See the full [TypeScript Admin Guide](https://shtse8.github.io/FireSchema/guide/typescript-admin.html)**

### Dart Client (`cloud_firestore`)

```dart
import 'package:cloud_firestore/cloud_firestore.dart';
import '_setup.dart'; // Your initialized Firestore instance
import 'generated/firestore/users_collection.dart'; // Adjust path
import 'generated/firestore/users_data.dart';

final usersCollection = UsersCollection(firestore: firestore);
final userId = 'user-dart-123';

Future<void> dartExample() async {
  // Add
  final newUser = UsersAddData(displayName: 'Dart User', email: 'dart@example.com', status: UserStatus.active);
  final newUserRef = await usersCollection.add(newUser);
  print('Dart Added: ${newUserRef.id}');

  // Get
  final fetchedUser = await usersCollection.get(newUserRef.id);
  print('Dart Fetched: ${fetchedUser?.displayName}');

  // Query
  final activeUsers = await usersCollection.query()
      .whereIsActive(isEqualTo: true) // Assumes isActive field
      .limit(10)
      .getData();
  print('Dart Active Users: ${activeUsers.length}');

  // Update
  await usersCollection.update(newUserRef.id)
      .incrementAge(1) // Assumes age field
      .setLastLoginToServerTimestamp() // Assumes lastLogin field
      .commit();
  print('Dart Updated: ${newUserRef.id}');
}

```
**➡️ See the full [Dart Client Guide](https://shtse8.github.io/FireSchema/guide/dart-client.html)**

## Full Documentation

For detailed information on schema definition, configuration options, advanced usage (subcollections, transactions, streaming, testing), and the API for each runtime, please visit the **[Full Documentation Site](https://shtse8.github.io/FireSchema/)**.

## Contributing

Contributions are welcome! Please see the contribution guidelines (TODO: Add link) or open an issue to discuss potential changes.
