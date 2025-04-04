# TypeScript Client Guide

This guide provides a comprehensive overview of using FireSchema with the `typescript-client` target, designed for web frontends or Node.js applications using the Firebase Client SDK (v9+ modular).

[[toc]]

## Overview & Setup

### Target Audience

Use this target if you are building:

-   Web applications (React, Vue, Angular, Svelte, etc.) interacting directly with Firestore.
-   Node.js client applications (e.g., scripts, utilities) using the standard `firebase` package.

### Prerequisites

-   Completion of the [Installation](./installation.md) guide (CLI tool installed).
-   An existing TypeScript project.
-   The `firebase` package (v9+) installed: `npm install firebase`
-   The `@shtse8/fireschema-ts-client-runtime` package installed: `npm install @shtse8/fireschema-ts-client-runtime`
-   Initialized Firebase app and Firestore instance:

```typescript
// Example _setup.ts (or similar init file)
import { initializeApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';

// Replace with your actual Firebase config
const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  // ... other config
};

let firestoreInstance: Firestore;

export function initializeTestEnvironment(): Firestore {
  if (!firestoreInstance) {
      const app: FirebaseApp = initializeApp(firebaseConfig);
      firestoreInstance = getFirestore(app);

      // Optional: Connect to Firestore Emulator if using
      // import { connectFirestoreEmulator } from 'firebase/firestore';
      // connectFirestoreEmulator(firestoreInstance, '127.0.0.1', 8080);
  }
  return firestoreInstance;
}

// Export the initialized instance for use elsewhere
export const firestore = initializeTestEnvironment();
```

### SDK & Runtime

-   **Supported SDK:** `firebase` (v9+ modular JS SDK)
-   **Runtime Package:** `@shtse8/fireschema-ts-client-runtime`

### Configuration (`fireschema.config.json`)

Ensure your configuration file specifies the `typescript-client` target:

```json
{
  "schema": "./firestore.schema.json",
  "outputs": [
    {
      "target": "typescript-client",
      "outputDir": "./src/generated/firestore", // Example output directory
      "options": {
        "dateTimeType": "Timestamp" // Or "Date"
      }
    }
  ]
}
```

### Generation

Run the generator: `npx fireschema generate`

This creates files like `users.collection.ts`, `users.types.ts`, etc., in the output directory.

---

## CRUD Operations

Basic Create, Read, Update, and Delete operations.

*(Setup assumed from above)*
```typescript
import { UsersCollection } from '../generated/firestore/users.collection'; // Adjust path
import { UserData, UserAddData } from '../generated/firestore/users.types'; // Adjust path
import { DocumentReference, Timestamp, SetOptions, serverTimestamp, FieldValue } from 'firebase/firestore';

const usersCollection = new UsersCollection(firestore);
```

### Create (Add)

Use `add()` for new documents with auto-generated IDs. Requires `UserAddData`.

```typescript
async function createUser(displayName: string, email: string): Promise<DocumentReference<UserData> | null> {
  const newUser: UserAddData = { displayName, email }; // Only required fields needed initially
  try {
    const docRef = await usersCollection.add(newUser);
    console.log('User added with ID:', docRef.id);
    return docRef;
  } catch (error) { console.error("Error adding user:", error); return null; }
}
// const newUserRef = await createUser('Alice', 'alice@example.com');
```

### Create or Overwrite (Set)

Use `set()` for documents with specific IDs. Requires `UserData` (full structure) unless merging.

```typescript
async function createOrReplaceUser(userId: string, data: UserData) {
  try {
    await usersCollection.set(userId, data);
    console.log(`Document ${userId} set/replaced.`);
  } catch (error) { console.error(`Error setting document ${userId}:`, error); }
}

const bobData: UserData = {
  id: 'bob-123', // ID is part of type, not stored
  displayName: 'Bob',
  email: 'bob@example.com',
  isActive: true,
  status: 'active', // Assuming UserStatus enum/union type
  createdAt: Timestamp.now(), // Provide values for fields with defaults if not merging
  updatedAt: Timestamp.now(),
};
// await createOrReplaceUser('bob-123', bobData);

// Set with Merge (Upsert)
async function upsertUserPartial(userId: string, partialData: Partial<UserData>) {
   try {
    await usersCollection.set(userId, partialData, { merge: true });
    console.log(`Document ${userId} upserted (merged).`);
  } catch (error) { console.error(`Error upserting document ${userId}:`, error); }
}
// await upsertUserPartial('charlie-456', { displayName: 'Charlie', age: 25 });
```

### Read (Get)

Use `get()` to retrieve a single document by ID.

```typescript
async function getUser(userId: string): Promise<UserData | null> {
  try {
    const userData = await usersCollection.get(userId); // Returns UserData | null
    if (userData) { console.log('User found:', userData.displayName); return userData; }
    else { console.log(`User ${userId} not found.`); return null; }
  } catch (error) { console.error(`Error getting user ${userId}:`, error); return null; }
}
// const user = await getUser('alice-abc');
```

### Update

Use `update()` to get an `UpdateBuilder` for atomic modifications.

```typescript
async function updateUserLogin(userId: string) {
  try {
    await usersCollection.update(userId)
      .incrementLoginCount(1) // Generated method
      .setLastLogin(serverTimestamp()) // Use server timestamp helper
      .commit();
    console.log(`Updated login info for ${userId}.`);
  } catch (error) { console.error(`Error updating user ${userId}:`, error); }
}
// await updateUserLogin('bob-123');
```
*(See [Advanced Updates](#advanced-updates) below for more)*

### Delete

Use `delete()` to remove a document by ID.

```typescript
async function deleteUser(userId: string): Promise<boolean> {
  try {
    await usersCollection.delete(userId);
    console.log(`User ${userId} deleted successfully.`);
    return true;
  } catch (error) { console.error(`Error deleting user ${userId}:`, error); return false; }
}
// await deleteUser('charlie-456');
```

---

## Querying Data

Build and execute queries using the `QueryBuilder`.

*(Setup assumed from above)*
```typescript
import { DocumentSnapshot } from 'firebase/firestore'; // Needed for pagination
```

### Filtering (`where[FieldName]`)

Use generated methods for type-safe filtering.

```typescript
const activeUserQuery = usersCollection.query()
  .whereIsActive("==", true)
  .whereAge(">=", 18);
```

### Ordering (`orderBy`)

Sort results. Requires indexes for complex sorts.

```typescript
const orderedQuery = usersCollection.query()
  .orderBy("address.city", "asc")
  .orderBy("displayName", "desc");
```

### Limiting (`limit`, `limitToLast`)

Restrict the number of results.

```typescript
const limitQuery = usersCollection.query().orderBy("displayName").limit(10);
```

### Pagination (`startAfter`, etc.)

Use cursor methods with `DocumentSnapshot` from `query.get()`.

```typescript
let lastDoc: DocumentSnapshot<UserData> | null = null;
async function loadMoreUsers() {
  let queryBuilder = usersCollection.query().orderBy("displayName").limit(10);
  if (lastDoc) { queryBuilder = queryBuilder.startAfter(lastDoc); }
  const snapshot = await queryBuilder.get(); // Use get() for snapshot
  if (!snapshot.empty) { lastDoc = snapshot.docs[snapshot.docs.length - 1]; }
  else { lastDoc = null; }
  const users = usersCollection.converter.fromFirestoreQuerySnapshot(snapshot);
  // ... process users ...
}
```

### Executing (`getData`, `get`)

-   `getData()`: Returns `Promise<UserData[]>`.
-   `get()`: Returns `Promise<QuerySnapshot<UserData>>` (useful for pagination).

```typescript
const users = await activeUserQuery.getData();
const snapshot = await orderedQuery.limit(5).get();
```

---

## Realtime Updates (Streaming)

Use Firebase `onSnapshot` with references or queries obtained from the generated helpers.

*(Setup assumed from above)*
```typescript
import { onSnapshot, doc, QuerySnapshot, Unsubscribe, FirestoreError } from 'firebase/firestore';
```

### Streaming a Single Document

```typescript
function listenToUser(userId: string): Unsubscribe {
  const userDocRef = usersCollection.docRef(userId); // Typed DocumentReference
  const unsubscribe = onSnapshot(userDocRef, (snapshot: DocumentSnapshot<UserData>) => {
    if (snapshot.exists()) { const userData = snapshot.data(); /* Update UI */ }
    else { /* Handle deletion */ }
  }, (error: FirestoreError) => { /* Handle error */ });
  return unsubscribe;
}
// const stopListening = listenToUser('user-123');
// stopListening(); // To stop
```

### Streaming Query Results

```typescript
function listenToActiveUsers(): Unsubscribe {
  const queryBuilder = usersCollection.query().whereIsActive("==", true).orderBy("displayName");
  const unsubscribe = onSnapshot(queryBuilder.query, (snapshot: QuerySnapshot<UserData>) => {
    const activeUsers = usersCollection.converter.fromFirestoreQuerySnapshot(snapshot);
    // Update UI with activeUsers list
    // snapshot.docChanges() provides granular changes
  }, (error: FirestoreError) => { /* Handle error */ });
  return unsubscribe;
}
// const stopActiveUsersListener = listenToActiveUsers();
// stopActiveUsersListener(); // To stop
```

---

## Working with Subcollections

Access subcollections via generated methods on the parent `Collection` instance.

*(Setup assumed from above)*
```typescript
import { PostsCollection } from '../generated/firestore/users/posts.collection'; // Adjust path
import { PostAddData } from '../generated/firestore/users/posts.types';
```

```typescript
const userId = 'user-123';
const userPostsCollection: PostsCollection = usersCollection.posts(userId); // Get subcollection ref

// Now use userPostsCollection like any other collection
const newPostData: PostAddData = { title: 'Sub Post', content: '...' };
const postRef = await userPostsCollection.add(newPostData);
const post = await userPostsCollection.get(postRef.id);
const posts = await userPostsCollection.query().limit(5).getData();

// Access nested subcollections by chaining
// const commentsCollection = usersCollection.posts(userId).comments(postRef.id);
```

---

## Advanced Updates

Use the `UpdateBuilder` (from `collection.update(id)`) for atomic operations.

*(Setup assumed from above)*
```typescript
import { increment, arrayUnion, arrayRemove, deleteField } from 'firebase/firestore';
```

### Generated Helpers

```typescript
await usersCollection.update(userId)
  .incrementAge(1)
  .setLastLoginToServerTimestamp()
  .commit();
```

### Raw Updates (`updateRaw`)

Use for nested fields (dot notation) and `FieldValue` operations.

```typescript
await usersCollection.update(userId)
  .updateRaw({
    'settings.theme': 'dark',                 // Nested field
    'profile.visits': increment(1),         // Nested increment
    tags: arrayUnion('atomic', 'update'),   // Add array elements
    oldTags: arrayRemove('legacy'),         // Remove array elements
    tempData: deleteField()                 // Delete field
  })
  .commit();
```

### Combining Updates

Chain generated methods and `updateRaw` before `commit()`.

```typescript
await usersCollection.update(userId)
  .setDisplayName('Updated User')
  .updateRaw({ tags: arrayUnion('combined') })
  .commit();
```

---

## Transactions & Batched Writes

Use standard Firebase SDK functions (`runTransaction`, `writeBatch`) with raw references and converters from the generated helpers.

*(Setup assumed from above)*
```typescript
import { runTransaction, writeBatch, Transaction, WriteBatch } from 'firebase/firestore';
import { StatsCollection } from '../generated/firestore/stats.collection'; // Example
```

### Transactions

```typescript
await runTransaction(firestore, async (transaction: Transaction) => {
  const userRef = usersCollection.docRef(userId); // Raw ref
  const userSnap = await transaction.get(userRef); // Read
  if (!userSnap.exists()) throw new Error("User not found");
  const userData = userSnap.data(); // Typed data
  // ... perform logic based on userData ...
  transaction.update(userRef, { points: FieldValue.increment(10) }); // Write
});
```

### Batched Writes

```typescript
const batch: WriteBatch = writeBatch(firestore);
const userRef = usersCollection.docRef(userId);
const newUserRef = usersCollection.docRef(); // New doc ref
const newUser: UserAddData = { /* ... */ };

// Use converter for set with typed data
batch.set(newUserRef, usersCollection.converter.toFirestore(newUser));
batch.update(userRef, { 'profile.lastAction': serverTimestamp() });
batch.delete(usersCollection.docRef('old-user-id'));

await batch.commit();
```
*(See [Advanced Usage Patterns](../advanced-usage.md#transactions-and-batched-writes) for more detailed examples)*

---

## Testing Strategy

-   **Unit Tests:** Use Jest mocks to test application logic that calls generated ODM methods without hitting Firestore.
-   **Integration Tests:** Use the **Firestore Emulator** and Jest. Instantiate generated `Collection` classes with an emulator-connected `Firestore` instance to test real interactions (CRUD, queries, updates, etc.). This is the primary method used for testing the `@shtse8/fireschema-ts-client-runtime` package itself.