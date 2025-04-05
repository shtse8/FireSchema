# TypeScript Admin Guide

This guide provides a comprehensive overview of using FireSchema with the `typescript-admin` target, designed for Node.js backend environments using the Firebase Admin SDK.

[[toc]]

## Overview & Setup

### Target Audience

Use this target if you are building:

-   Node.js backend services (e.g., Express, Cloud Functions, NestJS) that need privileged access to Firestore.
-   Admin dashboards or tools running in a trusted server environment.

### Prerequisites

-   Completion of the [Installation](./installation.md) guide (CLI tool installed).
-   An existing Node.js TypeScript project.
-   The `firebase-admin` package installed: `npm install firebase-admin`
-   The `@shtse8/fireschema-ts-admin-runtime` package installed: `npm install @shtse8/fireschema-ts-admin-runtime`
-   Initialized Firebase Admin app and Firestore instance:

```typescript
// Example _setup.ts (or similar init file)
import * as admin from 'firebase-admin';

let firestoreInstance: admin.firestore.Firestore;

export function initializeAdminEnvironment(): admin.firestore.Firestore {
    if (!firestoreInstance) {
        // Initialize Firebase Admin SDK (use appropriate credentials)
        // Option 1: Application Default Credentials (ADC)
        admin.initializeApp();
        // Option 2: Service Account Key File
        // import serviceAccount from './path/to/your/serviceAccountKey.json';
        // admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

        firestoreInstance = admin.firestore();

        // Optional: Connect to Firestore Emulator if using
        // firestoreInstance.settings({ host: "127.0.0.1:8080", ssl: false });
    }
    return firestoreInstance;
}

// Export the initialized instance
export const firestore = initializeAdminEnvironment();

```

### SDK & Runtime

-   **Supported SDK:** `firebase-admin` (Node.js SDK)
-   **Runtime Package:** `@shtse8/fireschema-ts-admin-runtime`

### Configuration (`fireschema.config.json`)

Ensure your configuration file specifies the `typescript-admin` target:

```json
{
  "schema": "./firestore.schema.json",
  "outputs": [
    {
      "target": "typescript-admin",
      "outputDir": "./src/generated/firestore-admin", // Example
      "options": { "dateTimeType": "Timestamp" } // Or "Date"
    }
  ]
}
```

### Generation

Run `npx fireschema generate`.

---

## CRUD Operations

Basic Create, Read, Update, and Delete operations using the Admin SDK.

*(Setup assumed from above)*
```typescript
import { UsersCollection } from '../generated/firestore-admin/users.collection'; // Adjust path
import { UserData, UserAddData } from '../generated/firestore-admin/users.types'; // Adjust path
import * as admin from 'firebase-admin';
import { DocumentReference, WriteResult } from 'firebase-admin/firestore';
const { FieldValue, Timestamp } = admin.firestore; // Destructure

const usersCollection = new UsersCollection(firestore);
```

### Create (Add)

Use `add()` for new documents with auto-generated IDs. Requires `UserAddData`.

```typescript
async function createUser(displayName: string, email: string): Promise<DocumentReference<UserData> | null> {
  const newUser: UserAddData = { displayName, email };
  try {
    const docRef = await usersCollection.add(newUser);
    console.log('Admin: User added:', docRef.id);
    return docRef;
  } catch (error) { console.error("Admin: Error adding user:", error); return null; }
}
// const newUserRef = await createUser('Admin Alice', 'admin.alice@example.com');
```

### Create or Overwrite (Set)

Use `set()` for documents with specific IDs. Requires `UserData` unless merging. Returns `Promise<WriteResult>`.

```typescript
async function createOrReplaceUser(userId: string, data: UserData): Promise<WriteResult | null> {
  try {
    const writeResult = await usersCollection.set(userId, data);
    console.log(`Admin: Doc ${userId} set at ${writeResult.writeTime.toDate()}.`);
    return writeResult;
  } catch (error) { console.error(`Admin: Error setting doc ${userId}:`, error); return null; }
}
const bobData: UserData = {
  id: 'admin-bob-123',
  displayName: 'Admin Bob',
  email: 'admin.bob@example.com',
  isActive: true,
  status: 'active', // Assuming type exists
  createdAt: Timestamp.now(), // Use admin Timestamp
  updatedAt: Timestamp.now(),
};
// await createOrReplaceUser('admin-bob-123', bobData);

// Set with Merge (Upsert)
async function upsertUserPartial(userId: string, partialData: Partial<UserData>): Promise<WriteResult | null> {
   try {
    const writeResult = await usersCollection.set(userId, partialData, { merge: true });
    console.log(`Admin: Doc ${userId} upserted at ${writeResult.writeTime.toDate()}.`);
    return writeResult;
  } catch (error) { console.error(`Admin: Error upserting doc ${userId}:`, error); return null; }
}
// await upsertUserPartial('admin-charlie-456', { displayName: 'Admin Charlie', age: 30 });
```

### Read (Get)

Use `get()` to retrieve a single document by ID. Returns `Promise<UserData | null>`.

```typescript
async function getUser(userId: string): Promise<UserData | null> {
  try {
    const userData = await usersCollection.get(userId);
    if (userData) { console.log('Admin: User found:', userData.displayName); return userData; }
    else { console.log(`Admin: User ${userId} not found.`); return null; }
  } catch (error) { console.error(`Admin: Error getting user ${userId}:`, error); return null; }
}
// const user = await getUser('admin-alice-abc');
```

### Update

Use `update()` to get an `AdminUpdateBuilder`. Call `.commit()` to execute (`Promise<WriteResult>`).

```typescript
async function updateUserLogin(userId: string): Promise<WriteResult | null> {
  try {
    const writeResult = await usersCollection.update(userId)
      .incrementLoginCount(1) // Assumes field exists
      .setLastLogin(FieldValue.serverTimestamp()) // Use admin FieldValue
      .commit();
    console.log(`Admin: Updated login for ${userId} at ${writeResult.writeTime.toDate()}.`);
    return writeResult;
  } catch (error) { console.error(`Admin: Error updating user ${userId}:`, error); return null; }
}
// await updateUserLogin('admin-bob-123');
```
*(See [Advanced Updates](#advanced-updates) below)*

### Delete

Use `delete()` to remove a document by ID. Returns `Promise<WriteResult>`.

```typescript
async function deleteUser(userId: string): Promise<WriteResult | null> {
  try {
    const writeResult = await usersCollection.delete(userId);
    console.log(`Admin: User ${userId} deleted at ${writeResult.writeTime.toDate()}.`);
    return writeResult;
  } catch (error) { console.error(`Admin: Error deleting user ${userId}:`, error); return null; }
}
// await deleteUser('admin-charlie-456');
```

---

## Querying Data

Build and execute queries using the `AdminQueryBuilder`.

*(Setup assumed from above)*
```typescript
import { QuerySnapshot, DocumentSnapshot } from 'firebase-admin/firestore';
```

### Filtering (`where[FieldName]`)

Use generated methods for type-safe filtering.

```typescript
const adminQuery = usersCollection.query()
  .whereIsActive("==", true) // Assumes 'isActive' field
  .whereRole("==", "admin");   // Assumes 'role' field
```

### Ordering (`orderBy`)

Sort results. Requires indexes for complex sorts.

```typescript
const orderedQuery = usersCollection.query().orderBy("email", "desc");
```

### Limiting (`limit`, `limitToLast`)

Restrict the number of results.

```typescript
const limitQuery = usersCollection.query().orderBy("email").limit(100);
```

### Pagination (`startAfter`, etc.)

Use `admin.firestore.DocumentSnapshot` from `query.get()`.

```typescript
let lastAdminDoc: DocumentSnapshot<UserData> | null = null;
async function loadMoreAdminUsers() {
  let queryBuilder = usersCollection.query().orderBy("email").limit(50);
  if (lastAdminDoc) { queryBuilder = queryBuilder.startAfter(lastAdminDoc); }
  const snapshot = await queryBuilder.get(); // Use get() for snapshot
  if (!snapshot.empty) { lastAdminDoc = snapshot.docs[snapshot.docs.length - 1]; }
  else { lastAdminDoc = null; }
  const users = usersCollection.converter.fromFirestoreQuerySnapshot(snapshot);
  // ... process users ...
}
```

### Executing (`getData`, `get`)

-   `getData()`: Returns `Promise<UserData[]>`.
-   `get()`: Returns `Promise<QuerySnapshot<UserData>>`.

```typescript
const admins = await adminQuery.getData();
const snapshot = await orderedQuery.limit(10).get();
```

### Streaming / Realtime Updates

The Firebase Admin SDK **does not support** real-time listeners (`onSnapshot`).

---

## Working with Subcollections

Access subcollections via generated methods on the parent `Collection` instance.

*(Setup assumed from above)*
```typescript
import { PostsCollection } from '../generated/firestore-admin/users/posts.collection'; // Adjust path
import { PostAddData } from '../generated/firestore-admin/users/posts.types';
```

```typescript
const userId = 'admin-user-123';
const userPostsCollection: PostsCollection = usersCollection.posts(userId); // Get subcollection ref

const newPostData: PostAddData = { title: 'Admin Post', content: '...' };
const postRef = await userPostsCollection.add(newPostData);
const posts = await userPostsCollection.query().limit(5).getData();
```

---

## Advanced Updates

Use the `AdminUpdateBuilder` (from `collection.update(id)`) for atomic operations.

*(Setup assumed from above)*

### Generated Helpers

```typescript
await usersCollection.update(userId)
  .incrementLoginCount(1) // Assumes field exists
  .setUpdatedAtToServerTimestamp() // Assumes field exists
  .commit();
```

### Using Raw FieldValue Operations

For nested fields or operations not covered by generated helpers, you can use the standard Admin SDK `update` method on the raw `DocumentReference` with `FieldValue` operations directly.

```typescript
// Get the raw DocumentReference
const userDocRef = usersCollection.docRef(userId);

await userDocRef.update({
  'settings.theme': 'monokai',
  'stats.adminLogins': FieldValue.increment(1), // Use imported FieldValue
  roles: FieldValue.arrayUnion('moderator'),   // Use imported FieldValue
  legacyId: FieldValue.delete()                // Use imported FieldValue
});
```

### Combining Updates

You can combine generated helpers with raw updates by committing the builder first, then performing the raw update, or vice-versa if appropriate for your logic. However, they cannot be chained within the same `UpdateBuilder` instance.

```typescript
// Example: Use builder for some fields, then raw update for others
await usersCollection.update(userId)
  .setIsActive(true)
  .commit(); // Commit builder changes first

await usersCollection.docRef(userId).update({ // Perform raw update separately
  roles: FieldValue.arrayUnion('verified-admin')
});
```

---

## Transactions & Batched Writes

Use standard Admin SDK functions (`firestore.runTransaction`, `firestore.batch`) with raw references and converters.

*(Setup assumed from above)*
```typescript
import { Transaction, WriteBatch } from 'firebase-admin/firestore';
import { ProductsCollection } from '../generated/firestore-admin/products.collection'; // Example
```

### Transactions

```typescript
await firestore.runTransaction(async (transaction: Transaction) => {
  const userRef = usersCollection.docRef(userId); // Raw ref
  const productRef = productsCollection.docRef(productId); // Raw ref
  const userSnap = await transaction.get(userRef); // Read
  const productSnap = await transaction.get(productRef); // Read
  if (!userSnap.exists || !productSnap.exists) throw new Error("Not found");
  const userData = userSnap.data(); // Typed data
  const productData = productSnap.data(); // Typed data
  // ... logic ...
  transaction.update(userRef, { balance: FieldValue.increment(-cost) }); // Write
  transaction.update(productRef, { stock: FieldValue.increment(-qty) }); // Write
});
```

### Batched Writes

```typescript
const batch: WriteBatch = firestore.batch();
const userRef = usersCollection.docRef(userId);
const newUserRef = usersCollection.docRef(); // New doc ref
const newUser: UserAddData = { /* ... */ };

// Use converter for set with typed data
batch.set(newUserRef, usersCollection.converter.toFirestore(newUser));
batch.update(userRef, { 'profile.lastAction': FieldValue.serverTimestamp() });
batch.delete(usersCollection.docRef('old-user-id'));

await batch.commit();
```
*(Refer to the official Firebase Admin SDK documentation for more complex transaction/batch patterns)*

---

## Testing Strategy

-   **Unit Tests:** Use Jest mocks to test application logic without hitting Firestore.
-   **Integration Tests:** Use the **Firestore Emulator** and Jest. Instantiate generated `Collection` classes with an emulator-connected `Firestore` instance (from `firebase-admin`) to test real interactions. This is the primary method used for testing the `@shtse8/fireschema-ts-admin-runtime` package.