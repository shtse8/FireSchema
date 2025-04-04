import * as admin from 'firebase-admin';
import { getFirestore, Firestore, DocumentReference, FieldValue, Timestamp, DocumentData } from 'firebase-admin/firestore'; // Added DocumentData
import { AdminBaseCollectionRef, CollectionSchema } from '../../src/baseCollection'; // Import base class and schema type
import { AdminBaseQueryBuilder } from '../../src/baseQueryBuilder';   // Import Query Builder
import { AdminBaseUpdateBuilder } from '../../src/baseUpdateBuilder'; // Import Update Builder

// --- Test Setup ---
const FIREBASE_PROJECT_ID = 'fireschema-test-emulator'; // Must match emulator project ID
const FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080'; // Host and port for admin SDK

let firestore: Firestore;
let app: admin.app.App;

// Simple interface for test data
interface TestAdminData {
  id?: string;
  serviceName: string;
  status: 'active' | 'inactive';
  lastChecked?: admin.firestore.Timestamp; // Use admin Timestamp
  value?: number;
  tags?: string[];
}

// --- Subcollection Types ---
interface SubTestAdminData {
  id?: string;
  description: string;
  count: number;
}
type SubTestAdminAddData = Omit<SubTestAdminData, 'id'>;

// --- Sub-Subcollection Types (Level 3) ---
interface SubSubTestAdminData {
  id?: string;
  detail: string;
  timestamp: Timestamp; // Use admin Timestamp
}
type SubSubTestAdminAddData = Omit<SubSubTestAdminData, 'id'>;

// Sub-Subcollection class (Level 3)
class TestAdminSubSubCollection extends AdminBaseCollectionRef<SubSubTestAdminData, SubSubTestAdminAddData> {
  constructor(
    firestore: Firestore,
    collectionId: string,
    schema?: CollectionSchema,
    parentRef?: DocumentReference<DocumentData>
  ) {
    super(firestore, collectionId, schema, parentRef);
  }
  // Basic query/update builders for testing
  query(): AdminBaseQueryBuilder<SubSubTestAdminData> {
    return new AdminBaseQueryBuilder<SubSubTestAdminData>(this.firestore, this.ref);
  }
  update(id: string): AdminBaseUpdateBuilder<SubSubTestAdminData> {
    return new AdminBaseUpdateBuilder<SubSubTestAdminData>(this.doc(id));
  }
}


// Subcollection class (Level 2)
class TestAdminSubCollection extends AdminBaseCollectionRef<SubTestAdminData, SubTestAdminAddData> {
  // Match the constructor signature expected by the subCollection helper
  constructor(
    firestore: Firestore,
    collectionId: string, // Use the passed collectionId
    schema: CollectionSchema | undefined, // Accept schema
    parentRef?: DocumentReference<DocumentData> // Make parentRef optional
   ) {
    super(firestore, collectionId, schema, parentRef); // Pass arguments to base
  }

  // Method to create a query builder instance for the subcollection
  query(): AdminBaseQueryBuilder<SubTestAdminData> {
    return new AdminBaseQueryBuilder<SubTestAdminData>(this.firestore, this.ref);
  }

  // Method to create an update builder instance for the subcollection
  update(id: string): AdminBaseUpdateBuilder<SubTestAdminData> {
    const docRef = this.doc(id); // Use base class doc() method
    return new AdminBaseUpdateBuilder<SubTestAdminData>(docRef);
  }

  // Method to access the sub-subcollection (Level 3)
  subSubItems(parentId: string): TestAdminSubSubCollection {
    const subSubSchema: CollectionSchema = { // Define schema for sub-sub if needed
        fields: {
            detail: {},
            timestamp: {}
        }
        // No deeper subcollections defined here
    };
    // Use the public subCollection method from the base class
    return this.subCollection(parentId, 'sub-sub-admin-items', TestAdminSubSubCollection, subSubSchema);
  }
}

// Make fields that might have defaults optional in the Add type
type TestAdminAddData = Omit<TestAdminData, 'id' | 'lastChecked'> & Partial<Pick<TestAdminData, 'serviceName' | 'status' | 'value' | 'tags'>>;


// Define the schema including subcollections for tests that need it
const testSchemaWithSubcollections: CollectionSchema = {
    fields: {
        serviceName: {},
        status: {},
        lastChecked: {},
        value: {},
        tags: {}
    },
    subCollections: {
        'sub-admin-items': {
            schema: {
                fields: {
                    description: {},
                    count: {}
                },
                subCollections: { // Define Level 3 subcollection here
                    'sub-sub-admin-items': {
                        schema: {
                            fields: {
                                detail: {},
                                timestamp: {}
                            }
                        },
                        collectionClass: TestAdminSubSubCollection
                    }
                }
            },
            collectionClass: TestAdminSubCollection
        }
    }
};


// A concrete class extending the base for testing
class TestAdminCollection extends AdminBaseCollectionRef<TestAdminData, TestAdminAddData> {
  constructor(db: Firestore, schema?: CollectionSchema) {
    super(db, 'test-admin-items', schema);
  }

  // Method to create a query builder instance
  query(): AdminBaseQueryBuilder<TestAdminData> {
    return new AdminBaseQueryBuilder<TestAdminData>(this.firestore, this.ref);
  }

  // Method to create an update builder instance
  update(id: string): AdminBaseUpdateBuilder<TestAdminData> {
    const docRef = this.doc(id); // Use base class doc() method
    return new AdminBaseUpdateBuilder<TestAdminData>(docRef);
  }

  // Method to access the subcollection (requires SubCollection class definition)
  subItems(parentId: string): TestAdminSubCollection {
    // Use the public subCollection method from the base class
    // The schema passed to the main collection's constructor should contain the subcollection definition
    // Pass undefined for subSchema argument to match base method signature
    // Pass undefined for subSchema argument, as the base method retrieves it internally now
    return this.subCollection(parentId, 'sub-admin-items', TestAdminSubCollection, undefined);
  }
}

let testAdminCollection: TestAdminCollection;
let testAdminCollectionWithSchema: TestAdminCollection; // For tests needing schema

beforeAll(async () => {
  // Set the emulator host environment variable
  process.env.FIRESTORE_EMULATOR_HOST = FIRESTORE_EMULATOR_HOST;

  // Initialize Firebase Admin SDK
  if (admin.apps.length === 0) {
      app = admin.initializeApp({ projectId: FIREBASE_PROJECT_ID });
  } else {
      app = admin.apps[0]!; // Use the existing app
  }

  firestore = getFirestore(app);

  // Instantiate our test collection classes
  testAdminCollection = new TestAdminCollection(firestore); // Instance without schema
  testAdminCollectionWithSchema = new TestAdminCollection(firestore, testSchemaWithSubcollections); // Instance WITH schema

  console.log(`Admin SDK connected to Firestore emulator at ${FIRESTORE_EMULATOR_HOST}`);

  // Optional: Initial cleanup of the collection
  await cleanupCollection(testAdminCollection.ref); // Pass ref for cleanup
  await cleanupCollection(testAdminCollectionWithSchema.ref); // Cleanup schema collection too
});

afterAll(async () => {
  // Cleanup Firestore resources if necessary
  await app.delete();
  // Unset the environment variable
  delete process.env.FIRESTORE_EMULATOR_HOST;
  console.log('Admin SDK disconnected from Firestore emulator.');
  process.exit(0); // Force exit in CI
});

// Helper function to clear the collection (more robust than single doc delete)
async function cleanupCollection(collectionRef: admin.firestore.CollectionReference<any>) {
    if (!collectionRef) return;
    try {
        const snapshot = await collectionRef.limit(50).get(); // Limit batch size
        if (snapshot.empty) {
            return;
        }
        const batch = firestore.batch();
        snapshot.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
        // Recursively call if more docs might exist (optional)
        if (snapshot.size === 50) {
            await cleanupCollection(collectionRef);
        }
    } catch (error) {
        console.error("Error during cleanup:", error);
        // Don't fail tests due to cleanup issues, but log it.
    }
}

// Clear collection before each test run for isolation
beforeEach(async () => {
    await cleanupCollection(testAdminCollection.ref);
    await cleanupCollection(testAdminCollectionWithSchema.ref);
});


describe('Admin Runtime Integration Tests', () => {

  it('should add a document and retrieve it', async () => {
    const dataToAdd: TestAdminAddData = { serviceName: 'Admin Test Service', status: 'active' };
    let docRef: DocumentReference<TestAdminData> | undefined;
    try {
      docRef = await testAdminCollection.add(dataToAdd);
      expect(docRef).toBeDefined();
      expect(docRef.id).toBeTruthy();

      // Retrieve using the runtime's get method
      const retrievedData = await testAdminCollection.get(docRef.id);

      expect(retrievedData).toBeDefined();
      expect(retrievedData).toEqual(expect.objectContaining(dataToAdd)); // ID is not in the data

    } finally {
      // Cleanup
      if (docRef?.id) {
        await testAdminCollection.delete(docRef.id);
      }
    }
  });

  it('should set a document with a specific ID and retrieve it', async () => {
    const docId = 'specific-admin-id';
    const dataToSet: TestAdminAddData = { serviceName: 'Specific Admin Item', status: 'inactive' };
    try {
      await testAdminCollection.set(docId, dataToSet);
      const retrievedData = await testAdminCollection.get(docId);

      // Assertions moved inside the try block
      expect(retrievedData).toBeDefined();
      expect(retrievedData).toEqual(expect.objectContaining(dataToSet));

    } finally {
      // Cleanup
      await testAdminCollection.delete(docId);
    }
  });

  it('should delete a document', async () => {
    const docId = 'admin-to-be-deleted';
    const dataToSet: TestAdminAddData = { serviceName: 'Admin Delete Me', status: 'active' };
    try {
      await testAdminCollection.set(docId, dataToSet);

      let retrievedData = await testAdminCollection.get(docId);
      expect(retrievedData).toBeDefined();

      await testAdminCollection.delete(docId);

      retrievedData = await testAdminCollection.get(docId);
      expect(retrievedData).toBeUndefined();

    } catch (error) {
        try { await testAdminCollection.delete(docId); } catch (e) {}
        throw error;
    }
  });

  // --- Query Tests ---

  it('should query documents using where', async () => {
    const id1 = 'admin-query-1';
    const id2 = 'admin-query-2';
    const data1: TestAdminAddData = { serviceName: 'Query Svc A', status: 'active', value: 100 };
    const data2: TestAdminAddData = { serviceName: 'Query Svc B', status: 'inactive', value: 200 };
    const data3: TestAdminAddData = { serviceName: 'Query Svc C', status: 'active', value: 150 };
    try {
      await testAdminCollection.set(id1, data1);
      await testAdminCollection.set(id2, data2);
      await testAdminCollection.set('admin-query-3', data3);

      const queryBuilder = testAdminCollection.query();
      // Use (queryBuilder as any) to access protected _where for testing
      const results = await (queryBuilder as any)._where('status', '==', 'active').get();

      expect(results).toHaveLength(2);
      const names = results.map((r: TestAdminData) => r.serviceName);
      expect(names).toContain('Query Svc A');
      expect(names).toContain('Query Svc C');
      expect(names).not.toContain('Query Svc B');

    } finally {
      await cleanupCollection(testAdminCollection.ref);
    }
  });

  it('should query documents using orderBy and limit', async () => {
    const dataSet = [
      { id: 'admin-order-1', data: { serviceName: 'Svc Z', status: 'active', value: 1 } },
      { id: 'admin-order-2', data: { serviceName: 'Svc A', status: 'active', value: 2 } },
      { id: 'admin-order-3', data: { serviceName: 'Svc M', status: 'active', value: 3 } },
    ];
    try {
      for (const item of dataSet) {
        await testAdminCollection.set(item.id, item.data as TestAdminAddData); // Cast to satisfy status type
      }

      const queryBuilder = testAdminCollection.query();
      const results = await queryBuilder.orderBy('serviceName', 'asc').limit(2).get();

      expect(results).toHaveLength(2);
      expect(results[0].serviceName).toBe('Svc A');
      expect(results[1].serviceName).toBe('Svc M');

    } finally {
      await cleanupCollection(testAdminCollection.ref);
    }
  });

  it('should query documents using "in" operator', async () => {
    const dataSet = [
      { id: 'admin-in-1', data: { serviceName: 'Svc A', status: 'active' } },
      { id: 'admin-in-2', data: { serviceName: 'Svc B', status: 'inactive' } },
      { id: 'admin-in-3', data: { serviceName: 'Svc C', status: 'active' } },
    ];
    try {
      for (const item of dataSet) {
        await testAdminCollection.set(item.id, item.data as TestAdminAddData);
      }

      const queryBuilder = testAdminCollection.query();
      const results = await (queryBuilder as any)._where('serviceName', 'in', ['Svc A', 'Svc C']).get();

      expect(results).toHaveLength(2);
      const names = results.map((r: TestAdminData) => r.serviceName);
      expect(names).toContain('Svc A');
      expect(names).toContain('Svc C');
      expect(names).not.toContain('Svc B');

    } finally {
      await cleanupCollection(testAdminCollection.ref);
    }
  });

  it('should query documents using multiple where clauses', async () => {
    const dataSet = [
      { id: 'admin-multi-1', data: { serviceName: 'X', status: 'active', tags: ['a'], value: 10 } },
      { id: 'admin-multi-2', data: { serviceName: 'Y', status: 'inactive', tags: ['a', 'b'], value: 20 } },
      { id: 'admin-multi-3', data: { serviceName: 'Z', status: 'active', tags: ['b'], value: 10 } },
    ];
    try {
      for (const item of dataSet) {
        await testAdminCollection.set(item.id, item.data as TestAdminAddData);
      }

      const queryBuilder = testAdminCollection.query();
      const results = await (queryBuilder as any)
        ._where('status', '==', 'active')
        ._where('value', '==', 10) // Firestore requires index for this
        .get();

      // Note: This specific query (equality on two different fields)
      // might require a composite index in a real Firestore setup.
      // The test assumes the emulator handles it or the necessary index exists.
      // Corrected expectation: Only 'X' matches both status='active' and value=10
      expect(results).toHaveLength(2); // Both X and Z match status='active' and value=10
      const names = results.map((r: TestAdminData) => r.serviceName);
      expect(names).toContain('X');
      expect(names).toContain('Z');

    } finally {
      await cleanupCollection(testAdminCollection.ref);
    }
  });

  it('should update nested fields using the update builder', async () => {
    const docId = 'admin-update-nested';
    // Define type with nested object
    interface NestedAdminData extends DocumentData {
      config?: {
        isEnabled?: boolean;
        level?: number | FieldValue; // Allow increment
        name?: string | FieldValue; // Allow delete
      }
    }
    // Use 'any' for AddData for simplicity
    class NestedAdminCollection extends AdminBaseCollectionRef<NestedAdminData, any> {
        constructor(db: Firestore) { super(db, 'nested-admin-test'); }
        update(id: string): AdminBaseUpdateBuilder<NestedAdminData> {
            return new AdminBaseUpdateBuilder<NestedAdminData>(this.doc(id));
        }
    }
    const nestedCollection = new NestedAdminCollection(firestore);
    const initialData = { config: { isEnabled: false, level: 5, name: 'initial' } };

    try {
      await nestedCollection.set(docId, initialData);

      // Update nested fields
      const anyBuilder = nestedCollection.update(docId) as any;
      await anyBuilder
        ._set('config.isEnabled', true) // Update boolean
        ._increment('config.level', -1)  // Increment nested number
        ._deleteField('config.name')   // Delete nested string
        .commit();

      const retrievedData = await nestedCollection.get(docId);

      expect(retrievedData).toBeDefined();
      expect(retrievedData?.config?.isEnabled).toBe(true);
      expect(retrievedData?.config?.level).toBe(4); // 5 - 1
      expect(retrievedData?.config?.name).toBeUndefined(); // Field deleted

    } finally {
      // Cleanup
      await nestedCollection.delete(docId);
    }
  });

  it('should query documents using cursors (startAfter)', async () => {
    const dataSet = [
      { id: 'admin-cursor-1', data: { serviceName: 'One', status: 'active', value: 1 } },
      { id: 'admin-cursor-2', data: { serviceName: 'Two', status: 'active', value: 2 } },
      { id: 'admin-cursor-3', data: { serviceName: 'Three', status: 'active', value: 3 } },
    ];
    try {
      for (const item of dataSet) {
        await testAdminCollection.set(item.id, item.data as TestAdminAddData);
      }

      // Get the document snapshot for 'One' to start after it
      const docRefToStartAfter = testAdminCollection.doc('admin-cursor-1');
      const startAfterDoc = await docRefToStartAfter.get(); // Use Admin SDK get() for snapshot
      expect(startAfterDoc.exists).toBe(true);

      const queryBuilder = testAdminCollection.query();
      const results = await queryBuilder
        .orderBy('value', 'asc') // Cursors require orderBy
        .startAfter(startAfterDoc) // Use the snapshot
        .get();

      expect(results).toHaveLength(2);
      expect(results[0].serviceName).toBe('Two');
      expect(results[1].serviceName).toBe('Three');

    } finally {
      await cleanupCollection(testAdminCollection.ref);
    }
  });

  it('should query documents using comparison operators (<, <=, >, >=, !=)', async () => {
    const dataSet = [
      { id: 'admin-comp-1', data: { serviceName: 'Val10', status: 'active', value: 10 } },
      { id: 'admin-comp-2', data: { serviceName: 'Val20', status: 'active', value: 20 } },
      { id: 'admin-comp-3', data: { serviceName: 'Val30', status: 'inactive', value: 30 } },
    ];
    try {
      for (const item of dataSet) {
        await testAdminCollection.set(item.id, item.data as TestAdminAddData);
      }

      const queryBuilder = testAdminCollection.query();

      // Test >
      let results = await (queryBuilder as any)._where('value', '>', 15).get();
      expect(results).toHaveLength(2);
      expect(results.map((r: TestAdminData) => r.serviceName)).toEqual(expect.arrayContaining(['Val20', 'Val30']));

      // Test >=
      results = await (queryBuilder as any)._where('value', '>=', 20).get();
      expect(results).toHaveLength(2);
      expect(results.map((r: TestAdminData) => r.serviceName)).toEqual(expect.arrayContaining(['Val20', 'Val30']));

      // Test <
      results = await (queryBuilder as any)._where('value', '<', 25).get();
      expect(results).toHaveLength(2);
      expect(results.map((r: TestAdminData) => r.serviceName)).toEqual(expect.arrayContaining(['Val10', 'Val20']));

      // Test <=
      results = await (queryBuilder as any)._where('value', '<=', 20).get();
      expect(results).toHaveLength(2);
      expect(results.map((r: TestAdminData) => r.serviceName)).toEqual(expect.arrayContaining(['Val10', 'Val20']));

      // Test !=
      results = await (queryBuilder as any)._where('value', '!=', 20).get();
      expect(results).toHaveLength(2);
      expect(results.map((r: TestAdminData) => r.serviceName)).toEqual(expect.arrayContaining(['Val10', 'Val30']));

    } finally {
      await cleanupCollection(testAdminCollection.ref);
    }
  });

  it('should query documents using "not-in" operator', async () => {
    const dataSet = [
      { id: 'admin-notin-1', data: { serviceName: 'Svc A', status: 'active' } },
      { id: 'admin-notin-2', data: { serviceName: 'Svc B', status: 'inactive' } },
      { id: 'admin-notin-3', data: { serviceName: 'Svc C', status: 'active' } },
    ];
    try {
      for (const item of dataSet) {
        await testAdminCollection.set(item.id, item.data as TestAdminAddData);
      }

      const queryBuilder = testAdminCollection.query();
      const results = await (queryBuilder as any)._where('serviceName', 'not-in', ['Svc A', 'Svc C']).get();

      expect(results).toHaveLength(1);
      expect(results[0].serviceName).toBe('Svc B');

    } finally {
      await cleanupCollection(testAdminCollection.ref);
    }
  });

  it('should query documents using "array-contains-any" operator', async () => {
    const dataSet = [
      { id: 'admin-arrany-1', data: { serviceName: 'Svc 1', status: 'active', tags: ['a', 'b'] } },
      { id: 'admin-arrany-2', data: { serviceName: 'Svc 2', status: 'inactive', tags: ['c', 'd'] } },
      { id: 'admin-arrany-3', data: { serviceName: 'Svc 3', status: 'active', tags: ['a', 'e'] } },
    ];
    try {
      for (const item of dataSet) {
        await testAdminCollection.set(item.id, item.data as TestAdminAddData);
      }

      const queryBuilder = testAdminCollection.query();
      // Find documents where tags contain either 'a' or 'd'
      const results = await (queryBuilder as any)._where('tags', 'array-contains-any', ['a', 'd']).get();

      expect(results).toHaveLength(3); // Svc 1 ('a'), Svc 2 ('d'), Svc 3 ('a')
      const names = results.map((r: TestAdminData) => r.serviceName);
      expect(names).toContain('Svc 1');
      expect(names).toContain('Svc 2');
      expect(names).toContain('Svc 3');

    } finally {
      await cleanupCollection(testAdminCollection.ref);
    }
  });

  it('should query documents using cursors (startAt, endBefore, endAt)', async () => {
    const dataSet = [
      { id: 'admin-cursor-a', data: { serviceName: 'A', status: 'active', value: 10 } },
      { id: 'admin-cursor-b', data: { serviceName: 'B', status: 'active', value: 20 } },
      { id: 'admin-cursor-c', data: { serviceName: 'C', status: 'inactive', value: 30 } },
      { id: 'admin-cursor-d', data: { serviceName: 'D', status: 'active', value: 40 } },
    ];
    try {
      for (const item of dataSet) {
        await testAdminCollection.set(item.id, item.data as TestAdminAddData);
      }

      // Get snapshots for cursors
      const docBRef = testAdminCollection.doc('admin-cursor-b');
      const docCRef = testAdminCollection.doc('admin-cursor-c');
      const docDRef = testAdminCollection.doc('admin-cursor-d'); // Get ref for D
      const snapshotB = await docBRef.get();
      const snapshotC = await docCRef.get();
      const snapshotD = await docDRef.get(); // Get snapshot for D
      expect(snapshotB.exists).toBe(true);
      expect(snapshotC.exists).toBe(true);
      expect(snapshotD.exists).toBe(true); // Check D exists

      const queryBuilder = testAdminCollection.query().orderBy('value', 'asc');

      // Test startAt (inclusive)
      let results = await queryBuilder.startAt(snapshotB).get();
      expect(results).toHaveLength(3);
      expect(results.map((r: TestAdminData) => r.serviceName)).toEqual(['B', 'C', 'D']);

      // Test endBefore (exclusive)
      results = await queryBuilder.endBefore(snapshotC).get();
      expect(results).toHaveLength(2);
      expect(results.map((r: TestAdminData) => r.serviceName)).toEqual(['A', 'B']);

      // Test endAt (inclusive)
      results = await queryBuilder.endAt(snapshotC).get();
      expect(results).toHaveLength(3);
      expect(results.map((r: TestAdminData) => r.serviceName)).toEqual(['A', 'B', 'C']);

      // Test combination: startAt B, endBefore D
      results = await queryBuilder.startAt(snapshotB).endBefore(snapshotD).get(); // Use snapshotD
      expect(results).toHaveLength(2);
      expect(results.map((r: TestAdminData) => r.serviceName)).toEqual(['B', 'C']);

    } finally {
      await cleanupCollection(testAdminCollection.ref);
    }
  });

  it('should query documents using limitToLast', async () => {
    const dataSet = [
      { id: 'admin-limitlast-1', data: { serviceName: 'First', status: 'active', value: 1 } },
      { id: 'admin-limitlast-2', data: { serviceName: 'Second', status: 'active', value: 2 } },
      { id: 'admin-limitlast-3', data: { serviceName: 'Third', status: 'inactive', value: 3 } },
      { id: 'admin-limitlast-4', data: { serviceName: 'Fourth', status: 'active', value: 4 } },
    ];
    try {
      for (const item of dataSet) {
        await testAdminCollection.set(item.id, item.data as TestAdminAddData);
      }

      const queryBuilder = testAdminCollection.query();
      // Get the last 2 documents when ordered by value ascending
      const results = await queryBuilder.orderBy('value', 'asc').limitToLast(2).get();

      expect(results).toHaveLength(2);
      expect(results[0].serviceName).toBe('Third'); // Third item has value 3
      expect(results[1].serviceName).toBe('Fourth'); // Fourth item has value 4

    } finally {
      await cleanupCollection(testAdminCollection.ref);
    }
  });

  // --- Update Tests ---

  it('should update a document using the update builder', async () => {
    const docId = 'admin-update-1';
    const initialData: TestAdminAddData = { serviceName: 'Initial Admin', status: 'active', value: 10 };
    try {
      await testAdminCollection.set(docId, initialData);

      const updateBuilder = testAdminCollection.update(docId);
      const anyBuilder = updateBuilder as any; // Cast once for protected methods
      await anyBuilder
        ._set('serviceName', 'Updated Admin')
        ._increment('value', 5)
        ._arrayUnion('tags', ['admin-tag', 'updated'])
        ._serverTimestamp('lastChecked')
        .commit();

      const retrievedData = await testAdminCollection.get(docId);

      expect(retrievedData).toBeDefined();
      expect(retrievedData?.serviceName).toBe('Updated Admin');
      // Admin increment happens server-side, value might not be immediately reflected
      // unless we re-fetch or use transactions. Test existence/type instead.
      expect(retrievedData?.value).toBe(15); // Assuming emulator reflects increment immediately
      expect(retrievedData?.tags).toEqual(['admin-tag', 'updated']);
      expect(retrievedData?.lastChecked).toBeInstanceOf(Timestamp);

    } finally {
      await testAdminCollection.delete(docId);
    }
  });

  it('should set document with merge options', async () => {
    const docId = 'admin-set-merge-test';
    const initialData: TestAdminAddData = { serviceName: 'Initial Admin Merge', status: 'active', value: 100, tags: ['one'] };
    const partialUpdateData = { value: 200, tags: ['two'] }; // Update value, replace tags
    const mergeFieldsUpdateData = { serviceName: 'Merged Fields Admin Name' }; // Only update name

    try {
      // 1. Initial set
      await testAdminCollection.set(docId, initialData);
      let retrieved = await testAdminCollection.get(docId);
      expect(retrieved).toEqual(expect.objectContaining(initialData));

      // 2. Set with merge: true (should update value, replace tags, keep name and status)
      await testAdminCollection.set(docId, partialUpdateData, { merge: true });
      retrieved = await testAdminCollection.get(docId);
      expect(retrieved?.serviceName).toBe('Initial Admin Merge'); // Name should persist
      expect(retrieved?.status).toBe('active'); // Status should persist
      expect(retrieved?.value).toBe(200); // Value updated
      expect(retrieved?.tags).toEqual(['two']); // Tags replaced

      // 3. Set with mergeFields (should only update name, keep value, status, and tags from step 2)
      await testAdminCollection.set(docId, mergeFieldsUpdateData, { mergeFields: ['serviceName'] });
      retrieved = await testAdminCollection.get(docId);
      expect(retrieved?.serviceName).toBe('Merged Fields Admin Name'); // Name updated
      expect(retrieved?.status).toBe('active'); // Status from step 1 persists
      expect(retrieved?.value).toBe(200); // Value from step 2 persists
      expect(retrieved?.tags).toEqual(['two']); // Tags from step 2 persist

    } finally {
      await testAdminCollection.delete(docId);
    }
  });

  it('should remove array elements and delete fields', async () => {
    const docId = 'admin-update-2';
    const initialData: TestAdminAddData = { serviceName: 'Admin Array Remove', status: 'active', tags: ['x', 'y', 'z'], value: 99 };
    try {
      await testAdminCollection.set(docId, initialData);

      const updateBuilder = testAdminCollection.update(docId);
      const anyBuilder = updateBuilder as any; // Cast once
      await anyBuilder
        ._arrayRemove('tags', ['y'])
        ._deleteField('status')
        .commit();

      const retrievedData = await testAdminCollection.get(docId);

      expect(retrievedData).toBeDefined();
      expect(retrievedData?.serviceName).toBe('Admin Array Remove');
      expect(retrievedData?.tags).toEqual(['x', 'z']);
      expect(retrievedData?.status).toBeUndefined();
      expect(retrievedData?.value).toBe(99); // Value should remain

    } finally {
      await testAdminCollection.delete(docId);
    }
  });

  // --- Default Value Tests ---

  it('should apply default values from schema on add', async () => {
    const docId = 'admin-default-add';
    const schemaWithDefaults: CollectionSchema = {
      fields: {
        lastChecked: { defaultValue: 'serverTimestamp' },
        value: { defaultValue: 777 }, // Add a numeric default
        status: { defaultValue: 'inactive' } // Add a string default
      },
    };
    const collectionWithSchema = new TestAdminCollection(firestore, schemaWithDefaults);
    // Omit lastChecked, value, and status to test defaults
    const dataToAdd = { serviceName: 'Admin Default Add' };
    let addedDocId: string | undefined;

    try {
      // Use add and type assertion to test default application
      const docRef = await collectionWithSchema.add(dataToAdd as TestAdminAddData);
      expect(docRef).toBeDefined();
      addedDocId = docRef.id;

      const retrievedData = await collectionWithSchema.get(addedDocId);

      expect(retrievedData).toBeDefined();
      expect(retrievedData?.serviceName).toBe('Admin Default Add');
      // Check that the default values were applied
      expect(retrievedData?.lastChecked).toBeInstanceOf(Timestamp);
      expect(retrievedData?.value).toBe(777);
      expect(retrievedData?.status).toBe('inactive');

    } finally {
      // Cleanup using the same collection reference
      if (addedDocId) {
        await collectionWithSchema.delete(addedDocId);
      }
    }
  });

  it('should apply various default values from schema on add', async () => {
    const docId = 'admin-default-values-various-add';
    const schemaWithDefaults: CollectionSchema = {
      fields: {
        serviceName: { defaultValue: 'Default Service' },
        value: { defaultValue: 0 },
        tags: { defaultValue: ['default-admin'] },
        status: { defaultValue: 'inactive' }, // Default for existing field
        lastChecked: { defaultValue: 'serverTimestamp' },
        // Assuming a boolean field 'isCritical' could exist
        isCritical: { defaultValue: false },
      },
    };
    // Extend TestAdminData for the boolean field
    interface TestAdminDataExtended extends TestAdminData { isCritical?: boolean; }
    // Define a specific Add type for the extended interface, making fields with defaults optional
    // Make all fields optional for Add type when testing defaults
    type TestAdminAddDataExtended = Partial<Omit<TestAdminDataExtended, 'id'>>;

    // Use the specific Add type in the class definition
    class TestAdminCollectionExtended extends AdminBaseCollectionRef<TestAdminDataExtended, TestAdminAddDataExtended> {
        constructor(db: Firestore, schema?: CollectionSchema) { super(db, 'test-admin-items-extended', schema); }
    }
    const collectionWithSchema = new TestAdminCollectionExtended(firestore, schemaWithDefaults);
    // Provide only a field *not* having a default to trigger others
    const dataToAdd = {}; // Pass empty object to test all defaults
    let addedDocId: string | undefined;

    try {
      // Add the document, expecting defaults to be applied
      const docRef = await collectionWithSchema.add(dataToAdd); // Pass data that doesn't define default fields
      addedDocId = docRef.id;
      const retrievedData = await collectionWithSchema.get(addedDocId);

      expect(retrievedData).toBeDefined();
      // Check defaults
      expect(retrievedData?.serviceName).toBe('Default Service');
      expect(retrievedData?.value).toBe(0);
      expect(retrievedData?.tags).toEqual(['default-admin']);
      expect(retrievedData?.status).toBe('inactive');
      expect(retrievedData?.isCritical).toBe(false);
      expect(retrievedData?.lastChecked).toBeInstanceOf(Timestamp);
      // Check that the non-schema field wasn't added (Firestore behavior)
      expect(retrievedData?.hasOwnProperty('someOtherField')).toBe(false);

    } finally {
      if (addedDocId) {
        await collectionWithSchema.delete(addedDocId);
      }
    }
  });

  // --- Subcollection Tests ---

  it('should handle 3-level nested subcollections (add, get, delete)', async () => {
    const parentId = 'admin-level1-doc';
    const subId = 'admin-level2-doc';
    const subSubId = 'admin-level3-doc';

    const parentData: TestAdminAddData = { serviceName: 'Admin Level 1', status: 'active' };
    const subData: SubTestAdminAddData = { description: 'Admin Level 2', count: 20 };
    const subSubData: SubSubTestAdminAddData = { detail: 'Admin Level 3', timestamp: Timestamp.now() };

    try {
      // Use collection WITH schema for this test
      await testAdminCollectionWithSchema.set(parentId, parentData);

      // Get subcollection (Level 2) - Use collection with schema
      const subCollection = testAdminCollectionWithSchema.subItems(parentId);
      await subCollection.set(subId, subData);

      // Get sub-subcollection (Level 3)
      const subSubCollection = subCollection.subSubItems(subId);
      await subSubCollection.set(subSubId, subSubData);

      // Verify Level 3 data
      const retrievedSubSub = await subSubCollection.get(subSubId);
      expect(retrievedSubSub).toBeDefined();
      expect(retrievedSubSub?.detail).toBe('Admin Level 3');
      expect(retrievedSubSub?.timestamp).toEqual(subSubData.timestamp); // Compare admin timestamps

      // Delete Level 3
      await subSubCollection.delete(subSubId);
      const deletedSubSub = await subSubCollection.get(subSubId);
      expect(deletedSubSub).toBeUndefined();

      // Verify Level 2 still exists
      const retrievedSub = await subCollection.get(subId);
      expect(retrievedSub).toBeDefined();

      // Verify Level 1 still exists
      const retrievedParent = await testAdminCollectionWithSchema.get(parentId);
      expect(retrievedParent).toBeDefined();

    } finally {
      // Cleanup: Deleting parent should cascade in emulator
      await testAdminCollectionWithSchema.delete(parentId);
    }
  });

  it('should add, get, and delete documents in a subcollection', async () => {
    const parentId = 'admin-parent-for-sub';
    const subDocId = 'admin-sub-doc-1';
    const parentData: TestAdminAddData = { serviceName: 'Admin Parent', status: 'active' };
    const subData: SubTestAdminAddData = { description: 'Admin Sub Item 1', count: 100 };

    try {
      // Use collection WITH schema
      await testAdminCollectionWithSchema.set(parentId, parentData);
      const subCollection = testAdminCollectionWithSchema.subItems(parentId);
      expect(subCollection).toBeInstanceOf(TestAdminSubCollection);

      // Add
      const subDocRef = await subCollection.add(subData);
      const addedSubDocId = subDocRef.id;
      let retrievedSubData = await subCollection.get(addedSubDocId);
      expect(retrievedSubData).toEqual(expect.objectContaining(subData));

      // Set
      await subCollection.set(subDocId, { description: 'Specific Admin Sub', count: 200 });
      retrievedSubData = await subCollection.get(subDocId);
      expect(retrievedSubData?.description).toBe('Specific Admin Sub');

      // Delete
      await subCollection.delete(addedSubDocId);
      retrievedSubData = await subCollection.get(addedSubDocId);
      expect(retrievedSubData).toBeUndefined();
      await subCollection.delete(subDocId);
      retrievedSubData = await subCollection.get(subDocId);
      expect(retrievedSubData).toBeUndefined();

    } finally {
      await testAdminCollectionWithSchema.delete(parentId);
    }
  });

}); // Close describe block