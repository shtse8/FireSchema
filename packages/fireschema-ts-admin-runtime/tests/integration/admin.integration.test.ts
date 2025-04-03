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

// Simple Add type

// --- Subcollection Types ---
interface SubTestAdminData {
  id?: string;
  description: string;
  count: number;
}
type SubTestAdminAddData = Omit<SubTestAdminData, 'id'>;

// Subcollection class
class TestAdminSubCollection extends AdminBaseCollectionRef<SubTestAdminData, SubTestAdminAddData> {
  // Match the constructor signature expected by the subCollection helper
  constructor(
    firestore: Firestore,
    collectionId: string, // Use the passed collectionId
    schema: CollectionSchema | undefined, // Accept schema
    parentRef: DocumentReference<DocumentData> // Use base DocumentData
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

}

type TestAdminAddData = Omit<TestAdminData, 'id' | 'lastChecked'>; // Exclude generated/server fields

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
    // Use the protected helper from the base class, casting this to any
    // Note: TestAdminSubCollection needs to be defined
    return (this as any).subCollection(parentId, 'sub-admin-items', TestAdminSubCollection); // Use public method name
  }
}

let testAdminCollection: TestAdminCollection;

beforeAll(async () => {
  // Set the emulator host environment variable
  process.env.FIRESTORE_EMULATOR_HOST = FIRESTORE_EMULATOR_HOST;

  // Initialize Firebase Admin SDK
  // Check if already initialized to prevent errors in watch mode
  if (admin.apps.length === 0) {
      app = admin.initializeApp({ projectId: FIREBASE_PROJECT_ID });
  } else {
      app = admin.apps[0]!; // Use the existing app
  }

  firestore = getFirestore(app);

  // Instantiate our test collection class
  testAdminCollection = new TestAdminCollection(firestore);

  console.log(`Admin SDK connected to Firestore emulator at ${FIRESTORE_EMULATOR_HOST}`);

  // Optional: Initial cleanup of the collection
  await cleanupCollection();
});

afterAll(async () => {
  // Cleanup Firestore resources if necessary
  // Shut down the admin app
  await app.delete();
  // Unset the environment variable
  delete process.env.FIRESTORE_EMULATOR_HOST;
  console.log('Admin SDK disconnected from Firestore emulator.');
});

// Helper function to clear the collection (more robust than single doc delete)
async function cleanupCollection() {
    // Check if testAdminCollection is initialized
    if (!testAdminCollection || !testAdminCollection.ref) return;
    try {
        const snapshot = await testAdminCollection.ref.limit(50).get(); // Limit batch size
        if (snapshot.empty) {
            return;
        }
        const batch = firestore.batch();
        snapshot.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
        // Recursively call if more docs might exist (optional)
        if (snapshot.size === 50) {
            await cleanupCollection();
        }
    } catch (error) {
        console.error("Error during cleanup:", error);
        // Don't fail tests due to cleanup issues, but log it.
    }
}

// Clear collection before each test run for isolation
beforeEach(async () => {
    await cleanupCollection();
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
  }); // Correctly closed 'it' block

  // --- Query Tests --- // Now correctly outside the previous 'it' block

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
      await cleanupCollection();
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
      await cleanupCollection();
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
      await cleanupCollection();
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
      expect(results).toHaveLength(1);
      expect(results[0].serviceName).toBe('X');

    } finally {
      await cleanupCollection();
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
      await cleanupCollection();
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
      await cleanupCollection();
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

      const names = results.map((r: TestAdminData) => r.serviceName);
      expect(names).toContain('Svc 1');
      expect(names).toContain('Svc 2');
      expect(names).toContain('Svc 3');

    } finally {
      await cleanupCollection();
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
      const snapshotB = await docBRef.get();
      const snapshotC = await docCRef.get();
      expect(snapshotB.exists).toBe(true);
      expect(snapshotC.exists).toBe(true);

      const queryBuilder = testAdminCollection.query().orderBy('value', 'asc');

      // Test startAt (inclusive)
      let results = await queryBuilder.startAt(snapshotB).get();
      expect(results).toHaveLength(3);
      expect(results.map((r: TestAdminData) => r.serviceName)).toEqual(['B', 'C', 'D']);


  it('should query documents in a subcollection', async () => {
    const parentId = 'admin-parent-for-subquery';
    const subDataSet = [
      { id: 'admin-subq-1', data: { description: 'Admin Sub Query A', count: 10 } },
      { id: 'admin-subq-2', data: { description: 'Admin Sub Query B', count: 20 } },
      { id: 'admin-subq-3', data: { description: 'Admin Sub Query C', count: 10 } },
    ];
    try {
      await testAdminCollection.set(parentId, { serviceName: 'Admin Parent SubQuery', status: 'active' });
      const subCollection = testAdminCollection.subItems(parentId);

      for (const item of subDataSet) {
        await subCollection.set(item.id, item.data);
      }

      // Use the query() method added to TestAdminSubCollection
      const subQueryBuilder = subCollection.query();

      // Query by count == 10
      const results = await (subQueryBuilder as any)._where('count', '==', 10).get();
      expect(results).toHaveLength(2);
      const descriptions = results.map((r: SubTestAdminData) => r.description);
      expect(descriptions).toContain('Admin Sub Query A');
      expect(descriptions).toContain('Admin Sub Query C');

      // Query order by count desc, limit 1
      const resultsOrdered = await subQueryBuilder.orderBy('count', 'desc').limit(1).get();
      expect(resultsOrdered).toHaveLength(1);
      expect(resultsOrdered[0].description).toBe('Admin Sub Query B');

    } finally {
      await testAdminCollection.delete(parentId); // Cleans up subcollection too
    }
  });

  it('should update documents in a subcollection', async () => {
    const parentId = 'admin-parent-for-subupdate';
    const subDocId = 'admin-subu-1';
    const initialSubData: SubTestAdminAddData = { description: 'Initial Admin Sub Desc', count: 50 };
    try {
      await testAdminCollection.set(parentId, { serviceName: 'Admin Parent SubUpdate', status: 'active' });
      const subCollection = testAdminCollection.subItems(parentId);
      await subCollection.set(subDocId, initialSubData);

      // Use the update() method added to TestAdminSubCollection
      const subUpdateBuilder = subCollection.update(subDocId);

      await (subUpdateBuilder as any)
        ._set('description', 'Updated Admin Sub Desc')
        ._increment('count', 5)
        .commit();

      const retrievedSubData = await subCollection.get(subDocId);
      expect(retrievedSubData).toBeDefined();
      expect(retrievedSubData?.description).toBe('Updated Admin Sub Desc');
      expect(retrievedSubData?.count).toBe(55);

    } finally {
      await testAdminCollection.delete(parentId);
    }
  });

      // Test endBefore (exclusive)
      results = await queryBuilder.endBefore(snapshotC).get();
      expect(results).toHaveLength(2);
      expect(results.map((r: TestAdminData) => r.serviceName)).toEqual(['A', 'B']);

      // Test endAt (inclusive)
      results = await queryBuilder.endAt(snapshotC).get();
      expect(results).toHaveLength(3);
      expect(results.map((r: TestAdminData) => r.serviceName)).toEqual(['A', 'B', 'C']);

      // Test combination: startAt B, endBefore D
      results = await queryBuilder.startAt(snapshotB).endBefore(testAdminCollection.doc('admin-cursor-d')).get(); // Use doc ref directly
      expect(results).toHaveLength(2);
      expect(results.map((r: TestAdminData) => r.serviceName)).toEqual(['B', 'C']);

    } finally {
      await cleanupCollection();
    }
  });








    } finally {
      await cleanupCollection();
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
      expect(retrievedData?.value).toBe(15); // Admin increment happens server-side, check might need adjustment
      expect(retrievedData?.tags).toEqual(['admin-tag', 'updated']);
      expect(retrievedData?.lastChecked).toBeInstanceOf(Timestamp);

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

  // --- Default Value Test ---

  it('should apply serverTimestamp default value from schema', async () => {
    const docId = 'admin-default-value';
    const schemaWithDefault: CollectionSchema = {
      fields: {
        lastChecked: { defaultValue: 'serverTimestamp' },
      },
    };
    // Instantiate with schema
    const collectionWithSchema = new TestAdminCollection(firestore, schemaWithDefault);
    const dataToAdd: TestAdminAddData = { serviceName: 'Admin Default', status: 'active' };

    try {
      await collectionWithSchema.set(docId, dataToAdd);
      const retrievedData = await collectionWithSchema.get(docId);

      expect(retrievedData).toBeDefined();
      expect(retrievedData?.serviceName).toBe('Admin Default');
      expect(retrievedData?.lastChecked).toBeInstanceOf(Timestamp);

    } finally {
      await collectionWithSchema.delete(docId);
    }
  });

  // --- Subcollection Test ---

  it('should add, get, and delete documents in a subcollection', async () => {
    const parentId = 'admin-parent-for-sub';
    const subDocId = 'admin-sub-doc-1';
    const parentData: TestAdminAddData = { serviceName: 'Admin Parent', status: 'active' };
    const subData: SubTestAdminAddData = { description: 'Admin Sub Item 1', count: 100 };

    try {
      await testAdminCollection.set(parentId, parentData);
      const subCollection = testAdminCollection.subItems(parentId);
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
      await testAdminCollection.delete(parentId);
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

  // Add more tests for:
  // - Updates (requires BaseUpdateBuilder integration)
  // - Queries (requires BaseQueryBuilder integration)
  // - Subcollections
  // - Default values / Server Timestamps (if schema is used)

}); // Close describe block