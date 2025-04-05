# Dart Client Guide

This guide provides a comprehensive overview of using FireSchema with the `dart-client` target, designed for Dart and Flutter applications using the `cloud_firestore` package.

[[toc]]

## Overview & Setup

### Target Audience

Use this target if you are building:

-   Flutter mobile or web applications.
-   Pure Dart applications (e.g., server-side Dart using client-side access, CLI tools) interacting with Firestore via `cloud_firestore`.

### Prerequisites

-   Completion of the [Installation](./installation.md) guide (CLI tool installed).
-   An existing Dart or Flutter project.
-   The `cloud_firestore` package installed: `dart pub add cloud_firestore` (or `flutter pub add cloud_firestore`).
-   The `fireschema_dart_runtime` package installed: `dart pub add fireschema_dart_runtime` (or `flutter pub add fireschema_dart_runtime`).
-   Initialized Firebase app and Firestore instance:

```dart
// Example _setup.dart (or similar init file)
import 'package:firebase_core/firebase_core.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
// Import your generated firebase_options.dart if using FlutterFire CLI
// import 'firebase_options.dart';

late FirebaseFirestore firestore; // Make it accessible

Future<void> initializeFirebase() async {
  // Ensure Flutter bindings if in Flutter app
  // WidgetsFlutterBinding.ensureInitialized();

  // Initialize Firebase
  await Firebase.initializeApp(
    // Use options from firebase_options.dart for Flutter
    // options: DefaultFirebaseOptions.currentPlatform,
    // Or provide options manually for pure Dart
    // options: const FirebaseOptions(apiKey: '...', appId: '...', ...),
  );

  firestore = FirebaseFirestore.instance;

  // Optional: Connect to Firestore Emulator if using
  // firestore.useFirestoreEmulator('127.0.0.1', 8080);
}

// Call initializeFirebase() early in your app startup.
```

### SDK & Runtime

-   **Supported SDK:** `cloud_firestore` (Dart/Flutter Plugin)
-   **Runtime Package:** `fireschema_dart_runtime` (pub.dev)

### Configuration (`fireschema.config.json`)

Ensure your configuration file specifies the `dart-client` target:

```json
{
  "schema": "./firestore.schema.json",
  "outputs": [
    {
      "target": "dart-client",
      "outputDir": "./lib/generated/firestore", // Example output directory
      "options": {
        "nullSafety": true // Default is true
      }
    }
  ]
}
```

### Generation

Run `npx fireschema generate`.

---

## CRUD Operations

Basic Create, Read, Update, and Delete operations.

*(Setup assumed from above)*
```dart
import 'generated/firestore/users_collection.dart'; // Adjust path
import 'generated/firestore/users_data.dart'; // Adjust path
import 'package:cloud_firestore/cloud_firestore.dart';

final usersCollection = UsersCollection(firestore: firestore);
```

### Create (Add)

Use `add()` for new documents with auto-generated IDs. Requires `UserAddData`. Runtime handles `serverTimestamp`.

```dart
Future<DocumentReference<UserData>?> createUser(String displayName, String email) async {
  final newUser = UsersAddData(displayName: displayName, email: email, status: UserStatus.pending);
  try {
    final docRef = await usersCollection.add(newUser);
    print('Dart: User added: ${docRef.id}');
    return docRef;
  } catch (e) { print("Dart: Error adding user: $e"); return null; }
}
// final newUserRef = await createUser('Dart Alice', 'dart.alice@example.com');
```

### Create or Overwrite (Set)

Use `set()` for documents with specific IDs. Requires `UserData` unless merging.

```dart
Future<void> createOrReplaceUser(String userId, UserData data) async {
  try {
    await usersCollection.set(userId, data);
    print('Dart: Document $userId set/replaced.');
  } catch (e) { print('Dart: Error setting document $userId: $e'); }
}
final bobData = UserData(
  id: 'dart-bob-123',
  displayName: 'Dart Bob',
  email: 'dart.bob@example.com',
  isActive: true,
  status: UserStatus.active,
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
);
// await createOrReplaceUser('dart-bob-123', bobData);

// Set with Merge (Upsert) - Use Map or UpdateBuilder is often better
Future<void> upsertUserPartial(String userId, Map<String, dynamic> partialData) async {
   try {
    await usersCollection.set(userId, partialData, SetOptions(merge: true));
    print('Dart: Document $userId upserted (merged).');
  } catch (e) { print('Dart: Error upserting document $userId: $e'); }
}
// await upsertUserPartial('dart-charlie-456', { 'displayName': 'Dart Charlie', 'age': 33 });
```

### Read (Get)

Use `get()` to retrieve a single document by ID. Returns `Future<UserData?>`.

```dart
Future<UserData?> getUser(String userId) async {
  try {
    final userData = await usersCollection.get(userId);
    if (userData != null) { print('Dart: User found: ${userData.displayName}'); return userData; }
    else { print('Dart: User $userId not found.'); return null; }
  } catch (e) { print('Dart: Error getting user $userId: $e'); return null; }
}
// final user = await getUser('dart-alice-abc');
```

### Update

Use `update()` to get an `UpdateBuilder`. Call `.commit()` (`Future<void>`).

```dart
Future<void> updateUserLogin(String userId) async {
  try {
    await usersCollection.update(userId)
      .incrementLoginCount(1) // Generated method
      .setLastLoginToServerTimestamp() // Generated method
      .commit();
    print('Dart: Updated login info for $userId.');
  } catch (e) { print('Dart: Error updating user $userId: $e'); }
}
// await updateUserLogin('dart-bob-123');
```
*(See [Advanced Updates](#advanced-updates) below)*

### Delete

Use `delete()` to remove a document by ID. Returns `Future<void>`.

```dart
Future<void> deleteUser(String userId) async {
  try {
    await usersCollection.delete(userId);
    print('Dart: User $userId deleted successfully.');
  } catch (e) { print('Dart: Error deleting user $userId: $e'); }
}
// await deleteUser('dart-charlie-456');
```

---

## Querying Data

Build and execute queries using the `QueryBuilder`.

*(Setup assumed from above)*

### Filtering (`where[FieldName]`)

Use generated methods with named parameters.

```dart
final activeUserQuery = usersCollection.query()
  .whereIsActive(isEqualTo: true)
  .whereAge(isGreaterThanOrEqualTo: 18);
```

### Ordering (`orderBy`)

```dart
final orderedQuery = usersCollection.query().orderBy('age', descending: true);
```

### Limiting (`limit`, `limitToLast`)

```dart
final limitQuery = usersCollection.query().orderBy('displayName').limit(10);
```

### Pagination (`startAfterDocument`, etc.)

Use cursor methods with `DocumentSnapshot` from `query.get()`.

```dart
DocumentSnapshot? lastDoc;
Future<void> loadMoreUsers() async {
  var queryBuilder = usersCollection.query().orderBy('displayName').limit(10);
  if (lastDoc != null) { queryBuilder = queryBuilder.startAfterDocument(lastDoc!); }
  final snapshot = await queryBuilder.get(); // Use get() for snapshot
  if (snapshot.docs.isNotEmpty) { lastDoc = snapshot.docs.last; }
  else { lastDoc = null; }
  final users = snapshot.docs.map((doc) => UsersData.fromSnapshot(doc)).toList();
  // ... process users ...
}
```

### Executing (`getData`, `get`, `snapshots`)

-   `getData()`: Returns `Future<List<UserData>>`.
-   `get()`: Returns `Future<QuerySnapshot<UserData>>`.
-   `snapshots()`: Returns `Stream<List<UserData>>` (see below).

```dart
final users = await activeUserQuery.getData();
final snapshot = await orderedQuery.limit(5).get();
```

---

## Realtime Updates (Streaming)

Use `snapshots()` on `DocumentReference` or `QueryBuilder`.

*(Setup assumed from above)*
```dart
import 'dart:async'; // For StreamSubscription
```

### Streaming a Single Document

```dart
StreamSubscription<UserData?>? userSubscription;
void listenToUser(String userId) {
  userSubscription?.cancel();
  final userDocRef = usersCollection.docRef(userId); // Typed DocumentReference
  userSubscription = userDocRef.snapshots().listen((DocumentSnapshot<UserData> snapshot) {
    final userData = snapshot.data(); // UserData?
    if (userData != null) { /* Update UI */ } else { /* Handle deletion */ }
  }, onError: (error) { /* Handle error */ });
}
// userSubscription?.cancel(); // To stop
```

### Streaming Query Results

```dart
StreamSubscription<List<UserData>>? activeUsersSubscription;
void listenToActiveUsers() {
  activeUsersSubscription?.cancel();
  activeUsersSubscription = usersCollection.query()
      .whereIsActive(isEqualTo: true)
      .orderBy('displayName')
      .snapshots() // Returns Stream<List<UserData>>
      .listen((List<UserData> activeUsers) {
          // Update UI with list
        }, onError: (error) { /* Handle error */ });
}
// activeUsersSubscription?.cancel(); // To stop
```

---

## Working with Subcollections

Access subcollections via generated methods on the parent `Collection` instance.

*(Setup assumed from above)*
```dart
import 'generated/firestore/users/posts_collection.dart'; // Adjust path
import 'generated/firestore/users/posts_data.dart';
```

```dart
final userId = 'dart-user-123';
final userPostsCollection = usersCollection.posts(userId); // Get subcollection ref

final newPostData = PostsAddData(title: 'My Dart Sub Post', content: '...');
final postRef = await userPostsCollection.add(newPostData);
final posts = await userPostsCollection.query().limit(5).getData();

// Access nested subcollections by chaining
// final commentsCollection = usersCollection.posts(userId).comments(postRef.id);
```

---

## Advanced Updates

Use the `UpdateBuilder` (from `collection.update(id)`) for atomic operations.

*(Setup assumed from above)*

### Generated Helpers

```dart
await usersCollection.update(userId)
  .incrementLoginCount(1)
  .setUpdatedAtToServerTimestamp()
  .commit();
```

### Raw Updates (`updateRaw`)

Use for nested fields (dot notation) and `FieldValue` operations.

```dart
await usersCollection.update(userId)
  .updateRaw({
    'settings.theme': 'nord',
    'profile.visits': FieldValue.increment(1),
    'roles': FieldValue.arrayUnion(['tester']),
    'tempScore': FieldValue.delete(),
  })
  .commit();
```

### Combining Updates

Chain generated methods and `updateRaw` before `commit()`.

```dart
await usersCollection.update(userId)
  .setIsActive(false)
  .updateRaw({ 'tags': FieldValue.arrayUnion(['dart-update']) })
  .commit();
```

---

## Transactions & Batched Writes

Use standard `cloud_firestore` functions (`firestore.runTransaction`, `firestore.batch`) with raw references and converters.

*(Setup assumed from above)*
```dart
import 'generated/firestore/products_collection.dart'; // Example
import 'generated/firestore/products_data.dart'; // Example
```

### Transactions

```dart
await firestore.runTransaction((Transaction transaction) async {
  final userRef = usersCollection.docRef(userId); // Raw ref
  final productRef = productsCollection.docRef(productId); // Raw ref
  final userSnap = await transaction.get(userRef); // Read
  final productSnap = await transaction.get(productRef); // Read
  if (!userSnap.exists || !productSnap.exists) throw Exception("Not found");
  // Use converter inside transaction if needed for logic
  final userData = usersCollection.converter.fromFirestore(userSnap);
  final productData = productsCollection.converter.fromFirestore(productSnap);
  // ... logic ...
  transaction.update(userRef, { 'balance': FieldValue.increment(-cost) }); // Write
  transaction.update(productRef, { 'stock': FieldValue.increment(-qty) }); // Write
});
```

### Batched Writes

```dart
final batch = firestore.batch();
final userRef = usersCollection.docRef(userId);
final newUserRef = usersCollection.docRef();
final newUser = UsersAddData(displayName: 'Batch User', email: 'batch@example.com', status: UserStatus.pending); // Use AddData instance

// Use converter for set with typed data
batch.set(newUserRef, usersCollection.converter.toFirestore(newUser));
batch.update(userRef, { 'profile.lastAction': FieldValue.serverTimestamp() });
batch.delete(usersCollection.docRef('old-user-id'));

await batch.commit();
```
*(Refer to the official cloud_firestore documentation for more complex transaction/batch patterns)*

---

## Testing Strategy

-   **Unit Tests:** Use `fake_cloud_firestore` to mock Firestore behavior in memory for fast testing of base class logic, converters, and application logic using the ODM.
-   **Integration Tests:** Use the **Firestore Emulator** and the `integration_test` package. Connect a real `FirebaseFirestore` instance to the emulator to test generated code against actual Firestore behavior (CRUD, queries, updates, streaming, etc.). This is the primary method used for testing the `fireschema_dart_runtime` package. **Note:** Due to persistent platform channel initialization issues in standard CI environments, these integration tests are currently **skipped** in the package's GitHub Actions workflow and should be run locally.