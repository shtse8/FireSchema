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
- **Runtime Libraries:** Generated code relies on lightweight runtime packages
  (`@fireschema/ts-runtime`, `fireschema_dart_runtime`) containing common logic,
  keeping generated code lean.
- **Basic CRUD & Queries:** Generated code includes methods for document
  manipulation (`add`, `set`, `update`, `delete`, `get`) and querying
  (`where<Field>`, `orderBy`, `limit`, pagination/cursors) via runtime base
  classes.
- **Atomic Operations:** Supports Firestore atomic operations like
  `serverTimestamp`, `increment`, `arrayUnion`, `arrayRemove`, `deleteField` via
  type-safe update builders extending runtime base classes.
- **Subcollection Support:** Generates code for arbitrarily nested
  subcollections.

## Installation

1. **Install FireSchema CLI:**

   ```bash
   # Install globally (recommended for CLI usage)
   npm install -g . # For local dev build | Or: npm install -g fireschema (once published)

   # Or install as a dev dependency in your project
   npm install --save-dev . # For local dev build | Or: npm install --save-dev fireschema (once published)
   ```

   _(Note: Requires Node.js and npm)_

2. **Install Runtime Libraries in Your Project:**

   The generated code requires corresponding runtime libraries. Install the
   one(s) you need in the project where you'll use the generated code:

   **For TypeScript:**

   ```bash
   npm install @fireschema/ts-runtime # Or yarn add / pnpm add
   # Also ensure you have firebase installed:
   npm install firebase
   ```

   **For Dart/Flutter:**

   ```bash
   dart pub add fireschema_dart_runtime
   # Or for Flutter:
   flutter pub add fireschema_dart_runtime
   # Also ensure you have cloud_firestore installed:
   flutter pub add cloud_firestore
   ```

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
   Dart project. Make sure you've installed the necessary runtime library (see
   Installation).

## Schema Details (`firestore.schema.json`)

FireSchema uses JSON Schema (`draft-07`) to define collections and fields.
Here's a breakdown of supported properties within the `fields` object:

- **`type`** (Required): Defines the data type. Supported values:
  - `string`: Generates `string` (TS) / `String` (Dart).
  - `number`: Generates `number` (TS) / `num` (Dart).
  - `boolean`: Generates `boolean` (TS) / `bool` (Dart).
  - `timestamp`: Generates `Timestamp` (TS, from `firebase/firestore`) /
    `Timestamp` (Dart, from `cloud_firestore`).
  - `geopoint`: Generates `GeoPoint` (TS, from `firebase/firestore`) /
    `GeoPoint` (Dart, from `cloud_firestore`).
  - `reference`: Generates `DocumentReference<ReferencedData>` (TS) /
    `DocumentReference<Map<String, dynamic>>` (Dart). Requires `referenceTo`.
  - `array`: Generates `ItemType[]` (TS) / `List<ItemType>` (Dart). Requires
    `items`.
  - `map`: Generates an inline object type `{...}` (TS) / `Map<String, dynamic>`
    (Dart). Can use `properties`.
- **`description`** (Optional): A string description, included as TSDoc/DartDoc.
- **`required`** (Optional, boolean, default: `false`): If `true`, the field is
  non-nullable in generated types and checked in Dart `fromJson`.
- **`defaultValue`** (Optional): A literal value (string, number, boolean,
  array, object) or the special string `"serverTimestamp"` (for `timestamp`
  type). Applied by the Dart runtime's `add()` method if the field is omitted.
- **`referenceTo`** (Required if `type` is `reference`): String path to the
  referenced collection (e.g., `"users"`). Used for typed `DocumentReference` in
  TS.
- **`items`** (Required if `type` is `array`): Another field definition object
  describing the elements within the array.
- **`properties`** (Optional if `type` is `map`): An object where keys are
  property names and values are field definition objects, defining a structured
  map. Generates nested classes/interfaces.
- **`minLength`** (Optional, number, for `string` type): Minimum string length.
  Generates Dart `assert`.
- **`maxLength`** (Optional, number, for `string` type): Maximum string length.
  Generates Dart `assert`.
- **`pattern`** (Optional, string, for `string` type): A valid JavaScript/Dart
  regex pattern string (remember to escape backslashes in JSON). Generates Dart
  `assert`.
- **`minimum`** (Optional, number, for `number` type): Minimum numeric value
  (inclusive). Generates Dart `assert` and TS TSDoc.
- **`maximum`** (Optional, number, for `number` type): Maximum numeric value
  (inclusive). Generates Dart `assert` and TS TSDoc.
- **`x-read-only`** (Optional, boolean, default: `false`): Custom property. If
  `true`, the field is excluded from generated Dart `AddData` classes and
  `set<FieldName>` methods in Dart `UpdateBuilder`.

_(Refer to `src/schema-definition.json` for the formal validation schema and
`examples/firestore.schema.json` for a practical example.)_

## Using the Generated Code

Here's how you might use the code generated by FireSchema in your projects,
assuming you have initialized the Firebase Admin SDK (Node.js/TypeScript) or
`cloud_firestore` (Dart/Flutter) and installed the required runtime libraries.

### TypeScript Example

```typescript
import { cert, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
// Import generated collection class
import { UsersCollection } from "./generated/firestore-ts/users.collection";
// Firestore FieldValue types might still be needed directly
import { increment, serverTimestamp } from "firebase/firestore";

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
      // createdAt is optional due to defaultValue: serverTimestamp (handled by runtime)
      // isActive is optional due to defaultValue: true (handled by runtime if configured)
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
      .incrementAge(1) // Generated method uses runtime logic
      .setLastLoginToServerTimestamp() // Generated method uses runtime logic
      // Note: Updating nested fields like 'settings.theme' directly isn't
      // supported by the builder yet, requires reading the doc first or enhancing the builder/runtime.
      .commit(); // commit() is inherited from runtime
    console.log("Updated user age and last login via UpdateBuilder.");

    // Query users (Type-safe where methods)
    const activeUsers = await usersCollection.query() // query() inherited/implemented
      .whereIsActive("==", true) // Generated method uses runtime logic
      .whereAge(">=", 30) // Generated method uses runtime logic
      .orderBy("displayName") // Inherited from runtime
      .limit(10) // Inherited from runtime
      .getData(); // getData() inherited from runtime

    console.log(`Found ${activeUsers.length} active users >= 30:`);
    activeUsers.forEach((user) => console.log("-", user.displayName));

    // Query using array-contains
    const betaTesters = await usersCollection.query()
      .whereTags("array-contains", "beta") // Generated method uses runtime logic
      .getData();
    console.log(`Found ${betaTesters.length} beta testers.`);

    // Access a subcollection
    const userPosts = usersCollection.posts(newUserRef.id); // Generated accessor uses runtime helper
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
// Import generated collection class and data class
import 'generated/firestore_dart/users_collection.dart';
import 'generated/firestore_dart/users_data.dart';
// Subcollection imports if needed
import 'generated/firestore_dart/users/posts_collection.dart';
import 'generated/firestore_dart/users/posts_data.dart';
// FieldValue might still be needed directly
// import 'package:cloud_firestore/cloud_firestore.dart' show FieldValue;

void main() async {
  // Assume Firebase is initialized
  final firestore = FirebaseFirestore.instance;

  // Get a typed collection reference
  final usersCollection = UsersCollection(firestore: firestore); // Use named param
  final String bobId = 'some-bob-id'; // Assume we have an ID

  try {
    // Add a new user (using the generated data class constructor)
    // Only fields required in schema AND without a defaultValue are required here.
    final newUser = UsersData(
      displayName: 'Bob',
      email: 'bob@example.com',
      // createdAt is optional (has serverTimestamp default, handled by runtime)
      // isActive is optional (has boolean default, handled by runtime if configured)
      age: 42,
      tags: ['alpha'],
      settings: {'theme': 'system'},
    );
    // The add method handles applying serverTimestamp if createdAt is null (via runtime)
    final newUserRef = await usersCollection.add(newUser.toMap()); // Pass Map to runtime add for now
    print('Added user with ID: ${newUserRef.id}');

    // Get a user
    final bobData = await usersCollection.get(newUserRef.id); // get() inherited
    if (bobData != null) {
      print('Fetched user: ${bobData.displayName}, ${bobData.email}');
    }

    // Update a user using the type-safe UpdateBuilder
    await usersCollection.update(newUserRef.id) // update() inherited/implemented
      .incrementAge(1) // Generated method uses runtime logic
      .setLastLoginToServerTimestamp() // Generated method uses runtime logic
      // Note: Updating nested fields like 'settings.theme' directly isn't
      // supported by the builder yet.
      .commit(); // commit() inherited from runtime
    print('Updated user age and last login via UpdateBuilder.');

    // Query users (using the generated QueryBuilder with type-safe where methods)
    final activeUsers = await usersCollection.query() // query() inherited/implemented
        .whereIsActive(isEqualTo: true) // Generated method uses runtime logic
        .whereAge(isGreaterThanOrEqualTo: 40) // Generated method uses runtime logic
        .orderBy('displayName') // Inherited from runtime
        .limit(10) // Inherited from runtime
        .getData(); // getData() inherited from runtime

    print('Found ${activeUsers.length} active users >= 40:');
    activeUsers.forEach((user) => print('- ${user.displayName}'));

    // Query using array-contains
    final alphaTesters = await usersCollection.query()
        .whereTags(arrayContains: 'alpha') // Generated method uses runtime logic
        .getData();
    print('Found ${alphaTesters.length} alpha testers.');

    // Pagination / Cursor Example (Methods inherited from runtime)
    final firstPageSnap = await usersCollection.query().orderBy('age').limit(5).get();
    if (firstPageSnap.docs.isNotEmpty) {
        final lastDocSnapshot = firstPageSnap.docs.last;
        final nextPageData = await usersCollection.query().orderBy('age').startAfterDocument(lastDocSnapshot).limit(5).getData();
        print('Pagination methods (startAt, startAfter, etc.) are available via runtime.');
    }

    // Access a subcollection
    final userPosts = usersCollection.posts(newUserRef.id); // Generated accessor uses runtime helper
    await userPosts.add({'title': 'My Dart Post', 'content': 'Hello Dart!'}); // Pass Map for now
    print('Added post to subcollection.');


  } catch (e) {
    print('Error running example: $e');
  }
}
```

## Advanced Usage

### Subcollections

Generated collection classes include helper methods to access defined
subcollections.

**TypeScript:**

```typescript
// Assuming usersCollection and newUserRef from previous example

// Get a reference to the 'posts' subcollection for a specific user
const userPostsCollection = usersCollection.posts(newUserRef.id);

// Add a document to the subcollection
const newPostRef = await userPostsCollection.add({
  title: "Subcollection Post",
  content: "Content here...",
  publishedAt: Timestamp.now(), // Use Timestamp from firebase/firestore
});
console.log(`Added post ${newPostRef.id} to user ${newUserRef.id}`);

// Query the subcollection
const userPosts = await userPostsCollection.query()
  .whereTitle("==", "Subcollection Post")
  .getData();
console.log(`Found ${userPosts.length} post(s) in subcollection.`);
```

**Dart:**

```dart
// Assuming usersCollection and newUserRef from previous example

// Get a reference to the 'posts' subcollection for a specific user
final userPostsCollection = usersCollection.posts(newUserRef.id);

// Add a document to the subcollection
final newPostRef = await userPostsCollection.add(PostsAddData(
  title: 'Subcollection Post',
  content: 'Content here...',
  publishedAt: Timestamp.now(), // Use Timestamp from cloud_firestore
));
print('Added post ${newPostRef.id} to user ${newUserRef.id}');

// Query the subcollection
final userPosts = await userPostsCollection.query()
    .whereTitle(isEqualTo: 'Subcollection Post')
    .getData();
print('Found ${userPosts.length} post(s) in subcollection.');
```

### References (`DocumentReference`)

Fields defined with `type: "reference"` and `referenceTo: "otherCollection"` are
generated as `DocumentReference` types.

**TypeScript:**

```typescript
import { AddressesCollection } from "./generated/firestore-ts/addresses.collection";

// Assuming usersCollection, newUserRef, and firestore from previous examples
const addressesCollection = new AddressesCollection(firestore);

// Create an address document
const newAddressRef = await addressesCollection.add({
  street: "123 Main St",
  city: "Anytown",
  zip: "12345",
});

// Update the user document to include the reference
await usersCollection.update(newUserRef.id)
  .setPrimaryAddressRef(newAddressRef) // Pass the DocumentReference
  .commit();

// Fetch the user and access the reference
const updatedUserData = await usersCollection.get(newUserRef.id);
if (updatedUserData?.primaryAddressRef) {
  console.log(
    "User's primary address path:",
    updatedUserData.primaryAddressRef.path,
  );
  // To get the actual address data, you need to fetch it separately:
  // const addressSnap = await updatedUserData.primaryAddressRef.get();
  // const addressData = addressSnap.data(); // Note: This won't be typed automatically by default
}
```

**Dart:**

```dart
import 'generated/firestore_dart/addresses_collection.dart';
import 'generated/firestore_dart/addresses_data.dart';

// Assuming usersCollection, newUserRef, and firestore from previous examples
final addressesCollection = AddressesCollection(firestore: firestore);

// Create an address document
final newAddressRef = await addressesCollection.add(AddressesAddData(
  street: '123 Main St',
  city: 'Anytown',
  zip: '12345',
));

// Update the user document to include the reference
// Note: Dart DocumentReference isn't generic in the same way as TS,
// so we pass the raw reference.
await usersCollection.update(newUserRef.id)
  .setPrimaryAddressRef(newAddressRef) // Pass the DocumentReference
  .commit();

// Fetch the user and access the reference
final updatedUserData = await usersCollection.get(newUserRef.id);
if (updatedUserData?.primaryAddressRef != null) {
  print('User\'s primary address path: ${updatedUserData!.primaryAddressRef!.path}');
  // To get the actual address data, you need to fetch it separately:
  // final addressSnap = await updatedUserData.primaryAddressRef!.get();
  // final addressData = addressSnap.data(); // This will be Map<String, dynamic>
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
        // "generateCore": false, // No longer applicable
        "dateTimeType": "Timestamp" // 'Timestamp' or 'Date' (default: 'Timestamp')
      },
      "package": { // Optional: Generate package.json
        "name": "my-project-firestore-ts",
        "version": "1.0.0"
      }
    },
    {
      "language": "dart",
      "outputDir": "./lib/generated/firestore_dart", // Directory for generated Dart code
      "options": { // Optional Dart options
        // "generateCore": false, // No longer applicable
        "nullSafety": true // Generate null-safe code (default: true)
      },
      "package": { // Optional: Generate pubspec.yaml
        "name": "my_project_firestore_dart",
        "version": "1.0.0",
        "description": "Generated Dart ODM"
      }
    }
    // Add more targets as needed
  ],
  "generatorOptions": { // Optional global options
    "logLevel": "info" // 'verbose', 'info', 'warn', 'error' (default: 'info')
  }
}
```

### Configuration Options

- **`schema`** (Required, string): Path to your `firestore.schema.json` file,
  relative to the config file's location.
- **`outputs`** (Required, array): An array of output target objects.
  - **`language`** (Required, string): Target language (`"typescript"` or
    `"dart"`).
  - **`outputDir`** (Required, string): Output directory for the generated code,
    relative to the config file's location.
  - **`options`** (Optional, object): Language-specific options.
    - **TypeScript Options:**
      - `dateTimeType` (Optional, string, default: `"Timestamp"`): Specifies
        whether to use `Timestamp` (from `firebase/firestore`) or JavaScript
        `Date` for timestamp fields. Using `Date` requires manual handling
        during Firestore operations.
    - **Dart Options:**
      - `nullSafety` (Optional, boolean, default: `true`): Whether to generate
        null-safe Dart code.
  - **`package`** (Optional, object): If provided, generates a basic
    `package.json` (for TS) or `pubspec.yaml` (for Dart) in the `outputDir`.
    - `name` (Required, string): The package name.
    - `version` (Optional, string, default: `"0.1.0"`): The package version.
    - `description` (Optional, string): The package description.
- **`generatorOptions`** (Optional, object): Global options for the generator.
  - `logLevel` (Optional, string, default: `"info"`): Controls the verbosity of
    console output (`"verbose"`, `"info"`, `"warn"`, `"error"`).

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

## Limitations

- **Dart `pattern` Validation:** Generating constructor `assert` statements for
  the `pattern` validation rule in Dart is currently blocked due to EJS template
  compilation issues when using `RegExp`.
- **JSON Schema Support:** While basic types, `required`, `defaultValue`,
  string/number validation rules (`minLength`, `maxLength`, `pattern`,
  `minimum`, `maximum`), `items`, `properties`, and `referenceTo` are supported,
  many other JSON Schema validation keywords (e.g., `enum`, `format`,
  `multipleOf`, `exclusiveMinimum`, `uniqueItems`) are not currently used for
  code generation or runtime validation.
- **TypeScript Validation:** Validation rules (`minLength`, etc.) are currently
  only added as TSDoc comments in TypeScript, not enforced at runtime by the
  generated code.
- **Nested Map Updates:** The generated `UpdateBuilder` classes do not currently
  support updating fields within nested maps using dot notation (e.g.,
  `settings.theme`). Updates to nested maps require setting the entire map field
  or using raw Firestore update calls.

## Development

1. Clone the repository.
2. Install dependencies: `npm install` (uses workspaces)
3. Fetch Dart runtime dependencies:
   `cd packages/fireschema_dart_runtime && dart pub get && cd ../..`
4. Build the tool & TS runtime: `npm run build --workspaces` (or configure root
   build script)
5. Run locally: `node dist/cli.js generate -c examples/fireschema.config.json`

## TODO / Future Enhancements

- **Complete Runtime Refactor:**
  - Test generated code thoroughly with runtime libraries.
  - Refine build/linking process for monorepo.
  - Consider publishing runtime packages.
  - Address TODOs in runtime base classes.
- Refine `fromJson`/`toJson` for complex types (nested maps, arrays of
  references, etc.).
- Improve `AddData`/`UpdateData` type generation (automatic omission of
  read-only fields, better Dart handling).
- Support updating nested map fields via dot notation in UpdateBuilders.
- Support more complex validation rules from JSON Schema.
- Add comprehensive tests (unit tests for runtimes, integration tests).
- Improve error handling and reporting.
