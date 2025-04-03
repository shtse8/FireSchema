import { initializeApp, deleteApp, FirebaseApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator, terminate, Firestore, doc, getDoc, deleteDoc, collection, getDocs, query, writeBatch, serverTimestamp, Timestamp, DocumentReference, DocumentData, FieldValue, CollectionReference, limit } from 'firebase/firestore'; // Added CollectionReference, limit
import { ClientBaseCollectionRef, CollectionSchema } from '../../src/baseCollection'; // Import the runtime base class and schema type
import { ClientBaseQueryBuilder } from '../../src/baseQueryBuilder';   // Import Query Builder
import { ClientBaseUpdateBuilder } from '../../src/baseUpdateBuilder'; // Import Update Builder

// --- Test Setup ---
const FIREBASE_PROJECT_ID = 'fireschema-test-emulator';
const FIRESTORE_EMULATOR_HOST = '127.0.0.1';
const FIRESTORE_EMULATOR_PORT = 8080; // Default Firestore emulator port

let app: FirebaseApp;
let firestore: Firestore;

// Simple interface for test data
interface TestData {
  id?: string; // Optional because ID is assigned by Firestore or used for get/delete
  name: string;
  value: number;
  tags?: string[];
  lastUpdated?: Timestamp;
}

// Simple Add type (usually excludes generated fields like id)
type TestAddData = Omit<TestData, 'id'>;

// --- Subcollection Types ---
interface SubTestData {
  id?: string;
  description: string;
  count: number;
}
type SubTestAddData = Omit<SubTestData, 'id'>;

// --- Sub-Subcollection Types ---
interface SubSubTestData {
  id?: string;
  detail: string;
  timestamp: Timestamp;
}
type SubSubTestAddData = Omit<SubSubTestData, 'id'>;

// Sub-Subcollection class
class TestSubSubCollection extends ClientBaseCollectionRef<SubSubTestData, SubSubTestAddData> {
  constructor(
    firestore: Firestore,
    collectionId: string,
    schema?: CollectionSchema,
    parentRef?: DocumentReference<DocumentData>
  ) {
    super(firestore, collectionId, schema, parentRef);
  }
  // Basic query/update builders for testing
  query(): ClientBaseQueryBuilder<SubSubTestData> {
    return new ClientBaseQueryBuilder<SubSubTestData>(this.firestore, this.ref);
  }
  update(id: string): ClientBaseUpdateBuilder<SubSubTestData> {
    return new ClientBaseUpdateBuilder<SubSubTestData>(this.doc(id));
  }
}


// Subcollection class (Level 2)
class TestSubCollection extends ClientBaseCollectionRef<SubTestData, SubTestAddData> {
  // Match the signature expected by the base subCollection method
  constructor(
    firestore: Firestore,
    collectionId: string, // Added collectionId
    schema?: CollectionSchema, // Added schema
    parentRef?: DocumentReference<DocumentData> // Use DocumentData for base compatibility
  ) {
    // Pass all arguments to super
    super(firestore, collectionId, schema, parentRef);
  }

  // Method to create a query builder instance for the subcollection
  query(): ClientBaseQueryBuilder<SubTestData> {
    return new ClientBaseQueryBuilder<SubTestData>(this.firestore, this.ref);
  }

  // Method to create an update builder instance for the subcollection
  update(id: string): ClientBaseUpdateBuilder<SubTestData> {
    const docRef = this.doc(id); // Use base class doc() method
    return new ClientBaseUpdateBuilder<SubTestData>(docRef);
  }

  // Method to access the sub-subcollection (Level 3)
  subSubItems(parentId: string): TestSubSubCollection {
    const subSubSchema = undefined; // Define schema if needed
    return this.subCollection(parentId, 'sub-sub-items', TestSubSubCollection, subSubSchema);
  }
}

// A concrete class extending the base for testing
// In a real scenario, this would be generated by FireSchema
class TestCollection extends ClientBaseCollectionRef<TestData, TestAddData> {
  constructor(db: Firestore, schema?: CollectionSchema) {
    // No schema provided for this basic test
    super(db, 'test-items', schema);
  }

  // Method to create a query builder instance
  query(): ClientBaseQueryBuilder<TestData> {
    return new ClientBaseQueryBuilder<TestData>(this.firestore, this.ref);
  }

  // Method to create an update builder instance
  update(id: string): ClientBaseUpdateBuilder<TestData> {
    const docRef = this.doc(id); // Use base class doc() method
    return new ClientBaseUpdateBuilder<TestData>(docRef);
  }

  // Method to access the subcollection using the public base method
  subItems(parentId: string): TestSubCollection {
    // Define the schema for the subcollection if needed by the base method or constructor
    const subSchema = undefined; // Or provide actual schema if required
    // Use the now public subCollection method from the base class
    return this.subCollection(parentId, 'sub-items', TestSubCollection, subSchema);
  }
  // Add specific methods if needed, otherwise inherit base methods
}

let testCollection: TestCollection;
// Define the schema including subcollections for tests that need it
const testSchemaWithSubcollections: CollectionSchema = {
    fields: {
        name: {},
        value: {},
        tags: {},
        lastUpdated: {}
    },
    subCollections: {
        'sub-items': {
            schema: {
                fields: {
                    description: {},
                    count: {}
                },
                subCollections: { // Define Level 3 subcollection here
                    'sub-sub-items': {
                        schema: {
                            fields: {
                                detail: {},
                                timestamp: {}
                            }
                        },
                        collectionClass: TestSubSubCollection
                    }
                }
            },
            collectionClass: TestSubCollection
        }
    }
};

let testCollectionWithSchema: TestCollection; // For tests needing schema

// Helper function to clear the collection (moved earlier)
async function cleanupCollection(collectionRef: CollectionReference<any>) {
    if (!collectionRef) return;
    try {
        const snapshot = await getDocs(query(collectionRef, limit(50))); // Limit batch size
        if (snapshot.empty) {
            return;
        }
        const batch = writeBatch(firestore);
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


beforeAll(async () => {
  // Initialize Firebase App for testing
  app = initializeApp({ projectId: FIREBASE_PROJECT_ID });
  firestore = getFirestore(app);

  // Connect to Firestore Emulator
  connectFirestoreEmulator(firestore, FIRESTORE_EMULATOR_HOST, FIRESTORE_EMULATOR_PORT);

  // Instantiate our test collection class
  testCollection = new TestCollection(firestore);

  console.log(`Connected to Firestore emulator at ${FIRESTORE_EMULATOR_HOST}:${FIRESTORE_EMULATOR_PORT}. Clearing test collection...`);
  // Clear the test collection before all tests
  await cleanupCollection(testCollection.ref); // Use new name and pass ref
  console.log('Test collection cleared.');

  // Clear the test collection before tests (optional, but good practice)
  // Note: A helper function to clear collection might be needed for robustness
  console.log(`Connected to Firestore emulator at ${FIRESTORE_EMULATOR_HOST}:${FIRESTORE_EMULATOR_PORT}`);
  testCollectionWithSchema = new TestCollection(firestore, testSchemaWithSubcollections); // Instance WITH schema
});

afterAll(async () => {
  // Terminate Firestore connection
  await terminate(firestore);
  // Delete Firebase App
  await deleteApp(app);
  console.log('Disconnected from Firestore emulator.');
});

// Clear collection before each test run for isolation

// Clear collection before each test run for isolation
beforeEach(async () => { // Make async and call cleanup for both
    await cleanupCollection(testCollection.ref);
    await cleanupCollection(testCollectionWithSchema.ref);
});


describe('Client Runtime Integration Tests', () => {

  it('should add a document and retrieve it', async () => {
    const dataToAdd: TestAddData = { name: 'Integration Test Item', value: 123 };
    let docRef;
    try {
      docRef = await testCollection.add(dataToAdd);
      expect(docRef).toBeDefined();
      expect(docRef.id).toBeTruthy();

  await cleanupCollection(testCollectionWithSchema.ref); // Cleanup schema collection too
      // Retrieve the document directly using the runtime's get method
      const retrievedData = await testCollection.get(docRef.id);

      expect(retrievedData).toBeDefined();
      // ID is not part of the data payload itself in Firestore
  await cleanupCollection(testCollectionWithSchema.ref);
      expect(retrievedData).toEqual(expect.objectContaining(dataToAdd));

    } finally {
      // Cleanup: delete the added document
      if (docRef?.id) {
        await testCollection.delete(docRef.id);
      }
    }
  });

  it('should set a document with a specific ID and retrieve it', async () => {
    const docId = 'specific-test-id';
    const dataToSet: TestAddData = { name: 'Specific ID Item', value: 456 };
    try {
      // Use the set method from the base class
      await testCollection.set(docId, dataToSet);

      // Retrieve using the base class get method
      const retrievedData = await testCollection.get(docId);

      expect(retrievedData).toBeDefined();
      expect(retrievedData).toEqual(expect.objectContaining(dataToSet));

    } finally {
      // Cleanup
      await testCollection.delete(docId);
    }
  });

   it('should delete a document', async () => {
    const docId = 'to-be-deleted';
    const dataToSet: TestAddData = { name: 'Delete Me', value: 789 };
    try {
      await testCollection.set(docId, dataToSet);

      // Verify it exists first
      let retrievedData = await testCollection.get(docId);
      expect(retrievedData).toBeDefined();

      // Delete using the base class method
      await testCollection.delete(docId);

      // Verify it's gone
      retrievedData = await testCollection.get(docId);
      expect(retrievedData).toBeUndefined();

    } catch (error) {
        // Ensure cleanup happens even if assertions fail mid-test
        try { await testCollection.delete(docId); } catch (e) {}
        throw error; // Re-throw the original error
    }
  }); // End of 'delete a document' test

  // --- Query Tests ---

  it('should query documents using where', async () => {
    const id1 = 'query-test-1';
    const id2 = 'query-test-2';
    const data1: TestAddData = { name: 'Query A', value: 100 };
    const data2: TestAddData = { name: 'Query B', value: 200 };
    const data3: TestAddData = { name: 'Query C', value: 100 }; // Same value as data1
    try {
      await testCollection.set(id1, data1);
      await testCollection.set(id2, data2);
      await testCollection.set('query-test-3', data3);

      const queryBuilder = testCollection.query();
      // Use public where method if available, otherwise cast for testing protected method
      const results = await (queryBuilder as any)._where('value', '==', 100).get();

      expect(results).toHaveLength(2);
      // Check if the results contain the expected names (order might vary)
      const names = results.map((r: TestData) => r.name); // Added type annotation
      expect(names).toContain('Query A');
      expect(names).toContain('Query C');
      expect(names).not.toContain('Query B');

    } finally {
      // Cleanup
      await cleanupCollection(testCollection.ref);
    }
  });

  it('should query documents using orderBy and limit', async () => {
    const dataSet = [
      { id: 'order-1', data: { name: 'Zebra', value: 1 } },
      { id: 'order-2', data: { name: 'Apple', value: 2 } },
      { id: 'order-3', data: { name: 'Mango', value: 3 } },
    ];
    try {
      // Add test data
      for (const item of dataSet) {
        await testCollection.set(item.id, item.data);
      }

      const queryBuilder = testCollection.query();
      const results = await queryBuilder.orderBy('name', 'asc').limit(2).get();

      expect(results).toHaveLength(2);
      expect(results[0].name).toBe('Apple');
      expect(results[1].name).toBe('Mango');

    } finally {
      // Cleanup
      await cleanupCollection(testCollection.ref);
    }
  });

  it('should query documents using "in" operator', async () => {
    const dataSet = [
      { id: 'in-1', data: { name: 'A', value: 1 } },
      { id: 'in-2', data: { name: 'B', value: 2 } },
      { id: 'in-3', data: { name: 'C', value: 3 } },
    ];
    try {
      for (const item of dataSet) {
        await testCollection.set(item.id, item.data);
      }

      const queryBuilder = testCollection.query();
      // Use protected _where for testing base class logic
      const results = await (queryBuilder as any)._where('name', 'in', ['A', 'C']).get();

      expect(results).toHaveLength(2);
      const names = results.map((r: TestData) => r.name);
      expect(names).toContain('A');
      expect(names).toContain('C');
      expect(names).not.toContain('B');

    } finally {
      await cleanupCollection(testCollection.ref);
    }
  });

  it('should query documents using multiple where clauses', async () => {
    const dataSet = [
      { id: 'multi-1', data: { name: 'X', value: 10, tags: ['a'] } },
      { id: 'multi-2', data: { name: 'Y', value: 20, tags: ['a', 'b'] } },
      { id: 'multi-3', data: { name: 'Z', value: 10, tags: ['b'] } },
    ];
    try {
      for (const item of dataSet) {
        await testCollection.set(item.id, item.data);
      }

      const queryBuilder = testCollection.query();
      const results = await (queryBuilder as any)
        ._where('value', '==', 10)
        ._where('tags', 'array-contains', 'a') // Firestore requires index for this
        .get();

      // Note: This specific query (equality on one field, array-contains on another)
      // might require a composite index in a real Firestore setup.
      // The test assumes the emulator handles it or the necessary index exists.
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('X');

    } finally {
      await cleanupCollection(testCollection.ref);
    }
  });

  it('should update nested fields using the update builder', async () => {
    const docId = 'update-nested-test';
    // Define a type with a nested object
    interface NestedTestData extends DocumentData {
      config?: {
        isEnabled?: boolean;
        level?: number | FieldValue; // Allow increment
      }
    }
    // Use 'any' for AddData for simplicity in this test
    class NestedTestCollection extends ClientBaseCollectionRef<NestedTestData, any> {
        constructor(db: Firestore) { super(db, 'nested-test'); }
        update(id: string): ClientBaseUpdateBuilder<NestedTestData> {
            return new ClientBaseUpdateBuilder<NestedTestData>(this.doc(id));
        }
    }
    const nestedCollection = new NestedTestCollection(firestore);
    const initialData = { config: { isEnabled: false, level: 1 } };

    try {
      await nestedCollection.set(docId, initialData);

      // Update nested fields
      await nestedCollection.update(docId)
        ._set('config.isEnabled', true) // Update boolean
        ._increment('config.level', 2)   // Increment nested number
        .commit();

      const retrievedData = await nestedCollection.get(docId);

      expect(retrievedData).toBeDefined();
      expect(retrievedData?.config?.isEnabled).toBe(true);
      expect(retrievedData?.config?.level).toBe(3); // 1 + 2

    } finally {
      // Cleanup
      await nestedCollection.delete(docId);
    }
  });

  it('should query documents using cursors (startAfter)', async () => {
    const dataSet = [
      { id: 'cursor-1', data: { name: 'One', value: 1 } },
      { id: 'cursor-2', data: { name: 'Two', value: 2 } },
      { id: 'cursor-3', data: { name: 'Three', value: 3 } },
    ];
    try {
      for (const item of dataSet) {
        await testCollection.set(item.id, item.data);
      }

      // Get the document snapshot for 'One' using the SDK's getDoc
      const docRefToStartAfter = testCollection.doc('cursor-1'); // Get the DocumentReference
      const startAfterDoc = await getDoc(docRefToStartAfter); // Fetch the snapshot
      expect(startAfterDoc).toBeDefined();

      const queryBuilder = testCollection.query();
      const results = await queryBuilder
        .orderBy('value', 'asc') // Cursors require orderBy
        .startAfter(startAfterDoc)
        .get();

      expect(results).toHaveLength(2);
      expect(results[0].name).toBe('Two');
      expect(results[1].name).toBe('Three');

    } finally {
      await cleanupCollection(testCollection.ref);
    }
  });


  it('should query documents using comparison operators (<, <=, >, >=, !=)', async () => {
    const dataSet = [
      { id: 'comp-1', data: { name: 'Val10', value: 10 } },
      { id: 'comp-2', data: { name: 'Val20', value: 20 } },
      { id: 'comp-3', data: { name: 'Val30', value: 30 } },
    ];
    try {
      for (const item of dataSet) {
        await testCollection.set(item.id, item.data);
      }

      const queryBuilder = testCollection.query();

      // Test >
      let results = await (queryBuilder as any)._where('value', '>', 15).get();
      expect(results).toHaveLength(2);
      expect(results.map((r: TestData) => r.name)).toEqual(expect.arrayContaining(['Val20', 'Val30']));

      // Test >=
      results = await (queryBuilder as any)._where('value', '>=', 20).get();
      expect(results).toHaveLength(2);
      expect(results.map((r: TestData) => r.name)).toEqual(expect.arrayContaining(['Val20', 'Val30']));

      // Test <
      results = await (queryBuilder as any)._where('value', '<', 25).get();
      expect(results).toHaveLength(2);
      expect(results.map((r: TestData) => r.name)).toEqual(expect.arrayContaining(['Val10', 'Val20']));

      // Test <=
      results = await (queryBuilder as any)._where('value', '<=', 20).get();
      expect(results).toHaveLength(2);
      expect(results.map((r: TestData) => r.name)).toEqual(expect.arrayContaining(['Val10', 'Val20']));

      // Test !=
      results = await (queryBuilder as any)._where('value', '!=', 20).get();
      expect(results).toHaveLength(2);
      expect(results.map((r: TestData) => r.name)).toEqual(expect.arrayContaining(['Val10', 'Val30']));

    } finally {
      await cleanupCollection(testCollection.ref);
    }
  });

  it('should query documents using "not-in" operator', async () => {
    const dataSet = [
      { id: 'notin-1', data: { name: 'A', value: 1 } },
      { id: 'notin-2', data: { name: 'B', value: 2 } },
      { id: 'notin-3', data: { name: 'C', value: 3 } },
    ];
    try {
      for (const item of dataSet) {
        await testCollection.set(item.id, item.data);
      }

      const queryBuilder = testCollection.query();
      const results = await (queryBuilder as any)._where('name', 'not-in', ['A', 'C']).get();

      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('B');

    } finally {
      await cleanupCollection(testCollection.ref);
    }
  });

  it('should query documents using "array-contains-any" operator', async () => {
    const dataSet = [
      { id: 'arrany-1', data: { name: 'Item 1', value: 1, tags: ['a', 'b'] } },
      { id: 'arrany-2', data: { name: 'Item 2', value: 2, tags: ['c', 'd'] } },
      { id: 'arrany-3', data: { name: 'Item 3', value: 3, tags: ['a', 'e'] } },
    ];
    try {
      for (const item of dataSet) {
        await testCollection.set(item.id, item.data);
      }

      const queryBuilder = testCollection.query();
      // Find documents where tags contain either 'a' or 'd'
      const results = await (queryBuilder as any)._where('tags', 'array-contains-any', ['a', 'd']).get();

      expect(results).toHaveLength(3); // Item 1 ('a'), Item 2 ('d'), Item 3 ('a')
      const names = results.map((r: TestData) => r.name);
      expect(names).toContain('Item 1');
      expect(names).toContain('Item 2');
      expect(names).toContain('Item 3');

    } finally {
      await cleanupCollection(testCollection.ref);
    }
  });

  // --- Default Value Tests ---

  it('should apply serverTimestamp and numeric default values from schema on add', async () => {
    const schemaWithDefault: CollectionSchema = {
      fields: {
        lastUpdated: { defaultValue: 'serverTimestamp' },
        value: { defaultValue: 999 } // Add another default for testing
      },
    };
    const collectionWithSchema = new TestCollection(firestore, schemaWithDefault);
    // Omit value and lastUpdated to test defaults
    const dataToAdd = { name: 'Default Add Test' };
    let docRefId: string | undefined;

    try {
      // Use add to test if ClientBaseCollectionRef applies defaults on add
      const docRef = await collectionWithSchema.add(dataToAdd as TestAddData); // Use type assertion
      expect(docRef).toBeDefined();
      docRefId = docRef.id;

      const retrievedData = await collectionWithSchema.get(docRefId);

      expect(retrievedData).toBeDefined();
      expect(retrievedData?.name).toBe('Default Add Test');
      // Check that the default values were applied
      expect(retrievedData?.value).toBe(999); // Check numeric default
      expect(retrievedData?.lastUpdated).toBeInstanceOf(Timestamp);

    } finally {
      // Cleanup using the same collection reference
      if (docRefId) {
        await collectionWithSchema.delete(docRefId);
      }
    }
  });

  it('should apply serverTimestamp default value from schema on set', async () => {
    const docId = 'default-value-test-set';
    const schemaWithDefault: CollectionSchema = {
      fields: {
        lastUpdated: { defaultValue: 'serverTimestamp' },
      },
    };
    // Instantiate a new collection reference WITH the schema
    const collectionWithSchema = new TestCollection(firestore, schemaWithDefault);
    const dataToSet: TestAddData = { name: 'Default Timestamp Set', value: 1 }; // lastUpdated is omitted

    try {
      // Use set to test if ClientBaseCollectionRef applies defaults on set
      await collectionWithSchema.set(docId, dataToSet);

      const retrievedData = await collectionWithSchema.get(docId);

      expect(retrievedData).toBeDefined();
      expect(retrievedData?.name).toBe('Default Timestamp Set');
      expect(retrievedData?.value).toBe(1);
      // Check that the default value was applied
      expect(retrievedData?.lastUpdated).toBeInstanceOf(Timestamp);

    } finally {
      // Cleanup using the same collection reference
      await collectionWithSchema.delete(docId);
    }
  });

  it('should apply various default values from schema on add', async () => {
    const docId = 'default-values-various-add';
    const schemaWithDefaults: CollectionSchema = {
      fields: {
        name: { defaultValue: 'Default Name' },
        value: { defaultValue: 0 },
        tags: { defaultValue: ['default'] },
        // Assuming a boolean field 'isActive' could exist
        isActive: { defaultValue: true },
      },
    };
    // Extend TestData for the boolean field
    interface TestDataWithActive extends TestData { isActive?: boolean; }
    class TestCollectionWithActive extends ClientBaseCollectionRef<TestDataWithActive, Omit<TestDataWithActive, 'id'>> {
        constructor(db: Firestore, schema?: CollectionSchema) { super(db, 'test-items-active', schema); }
    }
    const collectionWithSchema = new TestCollectionWithActive(firestore, schemaWithDefaults);
    // Provide only a field *not* having a default to trigger others
    const dataToAdd = { lastUpdated: serverTimestamp() };

    try {
      // Add the document first
      const docRef = await collectionWithSchema.add(dataToAdd as Omit<TestDataWithActive, 'id'>);
      const addedDocId = docRef.id;

      // Then retrieve it
      const retrievedData = await collectionWithSchema.get(addedDocId);

      expect(retrievedData).toBeDefined();
      expect(retrievedData?.name).toBe('Default Name');
      expect(retrievedData?.value).toBe(0);
      expect(retrievedData?.tags).toEqual(['default']);
      expect(retrievedData?.isActive).toBe(true);
      expect(retrievedData?.lastUpdated).toBeInstanceOf(Timestamp); // Ensure the provided value is still set

    } finally {
      // Need to clean up potentially added documents
      const q = query(collectionWithSchema.ref);
      const snapshot = await getDocs(q);
      const batch = writeBatch(firestore);
      snapshot.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
    }
  });


  it('should query documents using cursors (startAt, endBefore, endAt)', async () => {
    const dataSet = [
      { id: 'cursor-a', data: { name: 'A', value: 10 } },
      { id: 'cursor-b', data: { name: 'B', value: 20 } },
      { id: 'cursor-c', data: { name: 'C', value: 30 } },
      { id: 'cursor-d', data: { name: 'D', value: 40 } },
    ];
    try {
      for (const item of dataSet) {
        await testCollection.set(item.id, item.data);
      }

      // Get snapshots for cursors
      const docBRef = testCollection.doc('cursor-b');
      const docCRef = testCollection.doc('cursor-c');
      const snapshotB = await getDoc(docBRef);
      const snapshotC = await getDoc(docCRef);
      expect(snapshotB.exists()).toBe(true);
      expect(snapshotC.exists()).toBe(true);

      const queryBuilder = testCollection.query().orderBy('value', 'asc');

      // Test startAt (inclusive)
      let results = await queryBuilder.startAt(snapshotB).get();
      expect(results).toHaveLength(3);
      expect(results.map((r: TestData) => r.name)).toEqual(['B', 'C', 'D']);

      // Test endBefore (exclusive)
      results = await queryBuilder.endBefore(snapshotC).get();
      expect(results).toHaveLength(2);
      expect(results.map((r: TestData) => r.name)).toEqual(['A', 'B']);

      // Test endAt (inclusive)
      results = await queryBuilder.endAt(snapshotC).get();
      expect(results).toHaveLength(3);
      expect(results.map((r: TestData) => r.name)).toEqual(['A', 'B', 'C']);

      // Test combination: startAt B, endBefore D
      const docDRef = testCollection.doc('cursor-d'); // Need the ref for endBefore
      // Fetch snapshot for endBefore cursor
      const snapshotD = await getDoc(docDRef);
      expect(snapshotD.exists()).toBe(true);
      results = await queryBuilder.startAt(snapshotB).endBefore(snapshotD).get();
      // Reverted expectation: startAt B (inclusive), endBefore D (exclusive) should yield B, C
      expect(results).toHaveLength(2);
      expect(results.map((r: TestData) => r.name)).toEqual(['B', 'C']);
    } finally {
        await cleanupCollection(testCollection.ref);
    }
  }); // <-- Closing brace for this test

  it('should query documents using limitToLast', async () => {
    const dataSet = [
      { id: 'limitlast-1', data: { name: 'First', value: 1 } },
      { id: 'limitlast-2', data: { name: 'Second', value: 2 } },
      { id: 'limitlast-3', data: { name: 'Third', value: 3 } },
      { id: 'limitlast-4', data: { name: 'Fourth', value: 4 } },
    ];
    try {
      for (const item of dataSet) {
        await testCollection.set(item.id, item.data);
      }

      const queryBuilder = testCollection.query();
      // Get the last 2 documents when ordered by value ascending
      const results = await queryBuilder.orderBy('value', 'asc').limitToLast(2).get();

      expect(results).toHaveLength(2);
      expect(results[0].name).toBe('Third'); // Third item has value 3
      expect(results[1].name).toBe('Fourth'); // Fourth item has value 4

    } finally {
      await cleanupCollection(testCollection.ref);
    }
  });


  it('should query documents in a subcollection', async () => {
    const parentId = 'parent-for-subquery';
    const subDataSet = [
      { id: 'subq-1', data: { description: 'Sub Query A', count: 10 } },
      { id: 'subq-2', data: { description: 'Sub Query B', count: 20 } },
      { id: 'subq-3', data: { description: 'Sub Query C', count: 10 } },
    ];
    try {
      await testCollection.set(parentId, { name: 'Parent SubQuery', value: 1 });
      const subCollection = testCollectionWithSchema.subItems(parentId); // Use instance WITH schema

      for (const item of subDataSet) {
        await subCollection.set(item.id, item.data);
      }

      // Need a way to get a query builder for the subcollection
      // Assuming TestSubCollection inherits or has a query() method similar to TestCollection
      // If not, we might need to instantiate ClientBaseQueryBuilder directly
      const subQueryBuilder = subCollection.query(); // Use the method from TestSubCollection

      // Query by count == 10
      const results = await (subQueryBuilder as any)._where('count', '==', 10).get();
      expect(results).toHaveLength(2);
      const descriptions = results.map((r: SubTestData) => r.description);
      expect(descriptions).toContain('Sub Query A');
      expect(descriptions).toContain('Sub Query C');

      // Query order by count desc, limit 1
      const resultsOrdered = await subQueryBuilder.orderBy('count', 'desc').limit(1).get();
      expect(resultsOrdered).toHaveLength(1);
      expect(resultsOrdered[0].description).toBe('Sub Query B');

    } finally {
      await testCollection.delete(parentId); // Cleans up subcollection too
    }
  });

  it('should update documents in a subcollection', async () => {
    const parentId = 'parent-for-subupdate';
    const subDocId = 'subu-1';
    const initialSubData: SubTestAddData = { description: 'Initial Sub Desc', count: 5 };
    try {
      await testCollection.set(parentId, { name: 'Parent SubUpdate', value: 1 });
      const subCollection = testCollectionWithSchema.subItems(parentId); // Use instance WITH schema
      await subCollection.set(subDocId, initialSubData);

      // Need a way to get an update builder for the subcollection document
      // Assuming TestSubCollection inherits or has an update() method
      // If not, instantiate ClientBaseUpdateBuilder directly
      const subUpdateBuilder = subCollection.update(subDocId); // Use the method from TestSubCollection

      await (subUpdateBuilder as any)
        ._set('description', 'Updated Sub Desc')
        ._increment('count', 5)
        .commit();

      const retrievedSubData = await subCollection.get(subDocId);
      expect(retrievedSubData).toBeDefined();
      expect(retrievedSubData?.description).toBe('Updated Sub Desc');
      expect(retrievedSubData?.count).toBe(10);

    } finally {
      await testCollection.delete(parentId);
    }
  });

  // --- Update Tests ---

  it('should update a document using the update builder', async () => {
    const docId = 'update-test-1';
    const initialData: TestAddData = { name: 'Initial Name', value: 50 };
    try {
      await testCollection.set(docId, initialData);

      const updateBuilder = testCollection.update(docId);
      // Use the now public methods (assuming previous change applied)
      await updateBuilder
        ._set('name', 'Updated Name' as any) // Direct set
        ._increment('value', 10)      // Increment
        ._arrayUnion('tags', ['new', 'updated']) // Array Union
        ._serverTimestamp('lastUpdated') // Server Timestamp
        .commit();

      const retrievedData = await testCollection.get(docId);

      expect(retrievedData).toBeDefined();
      expect(retrievedData?.name).toBe('Updated Name');
      expect(retrievedData?.value).toBe(60);
      expect(retrievedData?.tags).toEqual(['new', 'updated']);
      expect(retrievedData?.lastUpdated).toBeInstanceOf(Timestamp); // Check type

    } finally {
      // Cleanup
      await testCollection.delete(docId);
    }
  });

  it('should remove array elements and delete fields', async () => {
    const docId = 'update-test-2';
    const initialData: TestAddData = { name: 'Array Remove Test', value: 1, tags: ['a', 'b', 'c'] };
    try {
      await testCollection.set(docId, initialData);

      const updateBuilder = testCollection.update(docId);
      // Use the now public methods
      await updateBuilder
        ._arrayRemove('tags', ['b'] as any) // Array Remove
        ._deleteField('value')       // Delete Field
        .commit();

      const retrievedData = await testCollection.get(docId);

      expect(retrievedData).toBeDefined();
      expect(retrievedData?.name).toBe('Array Remove Test');
      expect(retrievedData?.tags).toEqual(['a', 'c']);
      expect(retrievedData?.value).toBeUndefined(); // Field should be deleted

    } finally {
      // Cleanup
       await testCollection.delete(docId); // Added cleanup
    }
  }); // <-- Closing brace for this test

  it('should set document with merge options', async () => {
    const docId = 'set-merge-test';
    const initialData: TestAddData = { name: 'Initial Merge', value: 100, tags: ['one'] };
    const partialUpdateData = { value: 200, tags: ['two'] }; // Update value, replace tags
    const mergeFieldsUpdateData = { name: 'Merged Fields Name' }; // Only update name

    try {
      // 1. Initial set
      await testCollection.set(docId, initialData);
      let retrieved = await testCollection.get(docId);
      expect(retrieved).toEqual(expect.objectContaining(initialData));

      // 2. Set with merge: true (should update value, replace tags, keep name)
      await testCollection.set(docId, partialUpdateData, { merge: true });
      retrieved = await testCollection.get(docId);
      expect(retrieved?.name).toBe('Initial Merge'); // Name should persist
      expect(retrieved?.value).toBe(200); // Value updated
      expect(retrieved?.tags).toEqual(['two']); // Tags replaced

      // 3. Set with mergeFields (should only update name, keep value and tags from step 2)
      await testCollection.set(docId, mergeFieldsUpdateData, { mergeFields: ['name'] });
      retrieved = await testCollection.get(docId);
      expect(retrieved?.name).toBe('Merged Fields Name'); // Name updated
      expect(retrieved?.value).toBe(200); // Value from step 2 persists
      expect(retrieved?.tags).toEqual(['two']); // Tags from step 2 persist

    } finally {
      await testCollection.delete(docId);
    }
  }); // <-- Closing brace for this test

  it('should handle 3-level nested subcollections (add, get, delete)', async () => {
    const parentId = 'level1-doc';
    const subId = 'level2-doc';
    const subSubId = 'level3-doc';

    const parentData: TestAddData = { name: 'Level 1', value: 1 };
    const subData: SubTestAddData = { description: 'Level 2', count: 2 };
    const subSubData: SubSubTestAddData = { detail: 'Level 3', timestamp: Timestamp.now() };

    try {
      // Create parent (Level 1)
      await testCollection.set(parentId, parentData);

      // Get subcollection (Level 2)
      const subCollection = testCollectionWithSchema.subItems(parentId); // Use instance WITH schema
      await subCollection.set(subId, subData);

      // Get sub-subcollection (Level 3)
      const subSubCollection = subCollection.subSubItems(subId);
      await subSubCollection.set(subSubId, subSubData);

      // Verify Level 3 data
      const retrievedSubSub = await subSubCollection.get(subSubId);
      expect(retrievedSubSub).toBeDefined();
      expect(retrievedSubSub?.detail).toBe('Level 3');
      expect(retrievedSubSub?.timestamp).toEqual(subSubData.timestamp); // Compare timestamps

      // Delete Level 3
      await subSubCollection.delete(subSubId);
      const deletedSubSub = await subSubCollection.get(subSubId);
      expect(deletedSubSub).toBeUndefined();

      // Verify Level 2 still exists
      const retrievedSub = await subCollection.get(subId);
      expect(retrievedSub).toBeDefined();

      // Verify Level 1 still exists
      const retrievedParent = await testCollection.get(parentId);
      expect(retrievedParent).toBeDefined();

    } finally {
      // Cleanup: Deleting parent should cascade in emulator (usually)
      // but explicit cleanup is safer if needed.
      await testCollection.delete(parentId);
      // Optionally add explicit deletes for sub/sub-sub if needed
    }
  }); // <-- Closing brace for this test

  it('should add, get, and delete documents in a subcollection', async () => {
    const parentId = 'parent-doc-for-sub';
    const subDocId = 'sub-doc-1';
    const parentData: TestAddData = { name: 'Parent Doc', value: 1 };
    const subData: SubTestAddData = { description: 'Sub Item 1', count: 10 };

    try {
      // Create the parent document first
      await testCollection.set(parentId, parentData);

      // Get the subcollection reference
      const subCollection = testCollectionWithSchema.subItems(parentId); // Use instance WITH schema
      expect(subCollection).toBeInstanceOf(TestSubCollection);
      expect(subCollection.ref.path).toBe(`${testCollection.ref.path}/${parentId}/sub-items`); // Verify path construction

      // Add a document to the subcollection
      const subDocRef = await subCollection.add(subData);
      expect(subDocRef).toBeDefined();
      const addedSubDocId = subDocRef.id;

      // Get the subcollection document using its ID
      let retrievedSubData = await subCollection.get(addedSubDocId);
      expect(retrievedSubData).toBeDefined();
      expect(retrievedSubData).toEqual(expect.objectContaining(subData));

      // Set a document with a specific ID in the subcollection
      await subCollection.set(subDocId, { description: 'Specific Sub Item', count: 20 });
      retrievedSubData = await subCollection.get(subDocId);
      expect(retrievedSubData?.description).toBe('Specific Sub Item');

      // Delete from subcollection
      await subCollection.delete(addedSubDocId);
      retrievedSubData = await subCollection.get(addedSubDocId);
      expect(retrievedSubData).toBeUndefined();

      await subCollection.delete(subDocId);
      retrievedSubData = await subCollection.get(subDocId);
      expect(retrievedSubData).toBeUndefined();

    } finally {
      // Cleanup: Delete parent doc (subcollection is deleted automatically)
      await testCollection.delete(parentId);
    }
  }); // <-- Closing brace for this test

}); // Close describe block