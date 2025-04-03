import * as admin from 'firebase-admin';
import { getFirestore, Firestore, DocumentReference, FieldValue, Timestamp } from 'firebase-admin/firestore';
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
  constructor(db: Firestore, parentRef: DocumentReference<TestAdminData>) {
    super(db, 'sub-admin-items', undefined, parentRef);
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
    return (this as any)._subCollection(parentId, 'sub-admin-items', TestAdminSubCollection);
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

  // Add more tests for:
  // - Updates (requires BaseUpdateBuilder integration)
  // - Queries (requires BaseQueryBuilder integration)
  // - Subcollections
  // - Default values / Server Timestamps (if schema is used)

});