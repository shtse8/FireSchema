import * as admin from 'firebase-admin';
import { getFirestore, Firestore, DocumentReference } from 'firebase-admin/firestore';
import { AdminBaseCollectionRef } from '../../src/baseCollection'; // Import the runtime base class

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
}

// Simple Add type
type TestAdminAddData = Omit<TestAdminData, 'id' | 'lastChecked'>; // Exclude generated/server fields

// A concrete class extending the base for testing
class TestAdminCollection extends AdminBaseCollectionRef<TestAdminData, TestAdminAddData> {
  constructor(db: Firestore) {
    // No schema provided for this basic test
    super(db, 'test-admin-items');
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