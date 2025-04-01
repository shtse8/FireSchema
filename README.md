# FireSchema 🔥📄

FireSchema is a command-line tool that generates strongly-typed Object Document
Mapper (ODM) code for Google Firestore based on a JSON Schema definition. It
aims to improve type safety, developer experience, and collaboration when
working with Firestore, especially in multi-language projects.

Currently supports generating code for:

- TypeScript
- Dart

## Features

- **Schema-Driven:** Define your Firestore collections, fields, and basic types
  using standard JSON Schema.
- **Strongly-Typed:** Generates typed model interfaces/classes, collection
  references, query builders, and update builders.
- **Multi-Language:** Supports TypeScript and Dart code generation from a single
  schema.
- **Core Runtime Included:** Generates necessary base code (helpers, type
  re-exports) directly into your project, avoiding extra dependencies.
- **Basic CRUD & Queries:** Generated code includes methods for document
  manipulation (`add`, `set`, `update`, `delete`, `get`) and querying
  (`where<Field>`, `orderBy`, `limit`, pagination/cursors).
- **Atomic Operations:** Supports Firestore atomic operations like
  `serverTimestamp`, `increment`, `arrayUnion`, `arrayRemove`, `deleteField` via
  type-safe update builders.
- **Subcollection Support:** Generates code for arbitrarily nested
  subcollections.

## Installation

```bash
# Install globally (recommended for CLI usage)
npm install -g .

# Or install as a dev dependency in your project
npm install --save-dev .
```

_(Note: Requires Node.js and npm)_

## Usage

1. **Define your Schema:** Create a `firestore.schema.json` (or any name) file
   defining your Firestore structure according to the JSON Schema format
   outlined below. See `examples/firestore.schema.json` for an example.

2. **Configure Generation:** Create a `fireschema.config.json` (or any name)
   file specifying the path to your schema and the desired output targets
   (language, directory). See `examples/fireschema.config.json` for an example.

3. **Run the Generator:** Execute the `fireschema` command, optionally providing
   the path to your config file.

   ```bash
   # Using default config file name (fireschema.config.json in current dir)
   fireschema generate

   # Specifying a config file path
   fireschema generate -c ./path/to/your/config.json
   ```

4. **Use Generated Code:** Import and use the generated classes (models,
   collection references, query builders, update builders) in your TypeScript or
   Dart project.

## Using the Generated Code

Here's how you might use the code generated by FireSchema in your projects,
assuming you have initialized the Firebase Admin SDK (Node.js/TypeScript) or
`cloud_firestore` (Dart/Flutter).

### TypeScript Example

```typescript
import { cert, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { UsersCollection } from "./generated/firestore-ts/users.collection"; // Adjust path
// Types and FieldValues can often be imported from core.ts
import { increment, serverTimestamp } from "./generated/firestore-ts/core";

// Initialize Firebase Admin (example)
// initializeApp({ credential: cert(serviceAccount) });
const firestore = getFirestore();

// Get a typed collection reference
const usersCollection = new UsersCollection(firestore);

async function runExample() {
  try {
    // Add a new user (only required fields needed if others have defaults)
    const newUserRef = await usersCollection.add({
      displayName: "Alice", // Required
      email: "alice@example.com", // Required
      // createdAt is optional due to defaultValue: serverTimestamp
      // isActive is optional due to defaultValue: true
      age: 30,
      tags: ["beta", "tester"],
      settings: { theme: "dark", notificationsEnabled: false },
    });
    console.log("Added user with ID:", newUserRef.id);

    // Get a user
    const aliceData = await usersCollection.get(newUserRef.id);
    if (aliceData) {
      console.log("Fetched user:", aliceData.displayName, aliceData.email);
    }

    // Update a user using the type-safe UpdateBuilder
    await usersCollection.update(newUserRef.id)
      .incrementAge(1)
      .setLastLoginToServerTimestamp() // Use specific method for server timestamp
      // Note: Updating nested fields like 'settings.theme' directly isn't
      // supported by the builder yet, requires reading the doc first or enhancing the builder.
      .commit();
    console.log("Updated user age and last login via UpdateBuilder.");

    // Query users (Type-safe where methods)
    const activeUsers = await usersCollection.query()
      .whereIsActive("==", true) // Operator restricted based on boolean type
      .whereAge(">=", 30) // Operator restricted based on number type
      .orderBy("displayName")
      .limit(10)
      .get();

    console.log(`Found ${activeUsers.length} active users >= 30:`);
    activeUsers.forEach((user) => console.log("-", user.displayName));

    // Query using array-contains
    const betaTesters = await usersCollection.query()
      .whereTags("array-contains", "beta") // Operator restricted based on array type
      .get();
    console.log(`Found ${betaTesters.length} beta testers.`);

    // Access a subcollection
    const userPosts = usersCollection.posts(newUserRef.id);
    await userPosts.add({ title: "My First Post", content: "Hello world!" });
    console.log("Added post to subcollection.");
  } catch (error) {
    console.error("Error running example:", error);
  }
}

runExample();
```

### Dart Example

```dart
import 'package:cloud_firestore/cloud_firestore.dart';
// Adjust path based on your project structure and outputDir
import 'generated/firestore_dart/users_collection.dart';
import 'generated/firestore_dart/users_data.dart';
// Core file re-exports common types like FieldValue
import 'generated/firestore_dart/firestore_odm_core.dart';

void main() async {
  // Assume Firebase is initialized
  final firestore = FirebaseFirestore.instance;

  // Get a typed collection reference
  final usersCollection = UsersCollection(firestore);
  final String bobId = 'some-bob-id'; // Assume we have an ID

  try {
    // Add a new user (using the generated data class constructor)
    // Only fields required in schema AND without a defaultValue are required here.
    final newUser = UsersData(
      displayName: 'Bob',
      email: 'bob@example.com',
      // createdAt is optional (has serverTimestamp default)
      // isActive is optional (has boolean default)
      age: 42,
      tags: ['alpha'],
      settings: {'theme': 'system'},
    );
    // The add method handles applying serverTimestamp if createdAt is null
    final newUserRef = await usersCollection.add(newUser);
    print('Added user with ID: ${newUserRef.id}');

    // Get a user
    final bobData = await usersCollection.get(newUserRef.id);
    if (bobData != null) {
      print('Fetched user: ${bobData.displayName}, ${bobData.email}');
    }

    // Update a user using the type-safe UpdateBuilder
    await usersCollection.update(newUserRef.id)
      .incrementAge(1)
      // Use the specific method for server timestamp
      .setLastLoginToServerTimestamp()
      // Note: Updating nested fields like 'settings.theme' directly isn't
      // supported by the builder yet.
      .commit();
    print('Updated user age and last login via UpdateBuilder.');

    // Query users (using the generated QueryBuilder with type-safe where methods)
    final activeUsers = await usersCollection.query()
        .whereIsActive(isEqualTo: true) // Named param for operator
        .whereAge(isGreaterThanOrEqualTo: 40) // Named param for operator
        .orderBy('displayName')
        .limit(10)
        .get();

    print('Found ${activeUsers.length} active users >= 40:');
    activeUsers.forEach((user) => print('- ${user.displayName}'));

    // Query using array-contains
    final alphaTesters = await usersCollection.query()
        .whereTags(arrayContains: 'alpha') // Named param for operator
        .get();
    print('Found ${alphaTesters.length} alpha testers.');

    // Pagination / Cursor Example
    final firstPage = await usersCollection.query().orderBy('age').limit(5).get();
    if (firstPage.isNotEmpty) {
        // final lastDocSnapshot = await usersCollection.doc(firstPage.last.id).get(); // Need ID for snapshot
        // final nextPage = await usersCollection.query().orderBy('age').startAfterDocument(lastDocSnapshot).limit(5).get();
        print('Pagination methods (startAt, startAfter, etc.) are available.');
    }

    // Access a subcollection
    final userPosts = usersCollection.posts(newUserRef.id);
    await userPosts.add(PostsData(title: 'My Dart Post', content: 'Hello Dart!'));
    print('Added post to subcollection.');


  } catch (e) {
    print('Error running example: $e');
  }
}
```

## Configuration (`fireschema.config.json`)

```json
{
  "schema": "./path/to/your/firestore.schema.json", // Required: Path to schema file
  "outputs": [ // Required: Array of output targets
    {
      "language": "typescript", // 'typescript' or 'dart'
      "outputDir": "./src/generated/firestore-ts", // Directory for generated TS code
      "options": { // Optional TS options
        "generateCore": true, // Generate core.ts (default: true)
        "dateTimeType": "Timestamp" // 'Timestamp' or 'Date' (default: 'Timestamp')
      }
    },
    {
      "language": "dart",
      "outputDir": "./lib/generated/firestore_dart", // Directory for generated Dart code
      "options": { // Optional Dart options
        "generateCore": true, // Generate firestore_odm_core.dart (default: true)
        "nullSafety": true // Generate null-safe code (default: true)
      }
    }
    // Add more targets as needed
  ],
  "generatorOptions": { // Optional global options
    "logLevel": "info" // 'verbose', 'info', 'warn', 'error' (default: 'info')
  }
}
```

## Schema Definition (`firestore.schema.json`)

FireSchema uses JSON Schema (`draft-07`) to define collections and fields.

- **Root:** Contains `schemaVersion` and `collections`.
- **`collections`:** An object where each key is a collection ID.
  - **Collection Object:** Contains `description` (optional), `fields`
    (required), and `subcollections` (optional).
  - **`fields`:** An object where each key is a field name.
    - **Field Object:** Contains `type` (required), `description` (optional),
      `required` (boolean, optional, default: false), `defaultValue` (optional,
      e.g., `"serverTimestamp"` for type `timestamp`).
      - **`type`:** `string`, `number`, `boolean`, `timestamp`, `geopoint`,
        `reference`, `array`, `map`.
      - If `type` is `reference`, add `referenceTo` (string path to the
        referenced collection).
      - If `type` is `array`, add `items` (another field object defining the
        array element type).
      - If `type` is `map`, add `properties` (object defining the map structure,
        similar to `fields`).
  - **`subcollections`:** Similar structure to the root `collections` object
    (Supports arbitrarily deep nesting).

_(Refer to `src/schema-definition.json` for the formal validation schema and
`examples/firestore.schema.json` for a practical example.)_

## Development

1. Clone the repository.
2. Install dependencies: `npm install`
3. Build the tool: `npm run build`
4. Run locally: `node dist/cli.js generate -c examples/fireschema.config.json`

## TODO / Future Enhancements

- Refine `fromJson`/`toJson` for complex types (nested maps, arrays of
  references, etc.).
- Improve `AddData`/`UpdateData` type generation (automatic omission of
  read-only fields).
- Implement more query methods (`limitToLast`, `startAt`, `endAt`, etc.).
- Support more complex validation rules from JSON Schema.
- Handle subcollection generation.
- Generate `package.json`/`pubspec.yaml` for output directories.
- Add tests.
- Improve error handling and reporting.
