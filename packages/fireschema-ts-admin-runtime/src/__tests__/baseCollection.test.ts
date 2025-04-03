import { AdminBaseCollectionRef } from '../baseCollection';
import * as admin from 'firebase-admin/firestore';

// Mock the Firestore admin SDK parts
jest.mock('firebase-admin/firestore', () => {
  // Create mocks for classes and functions
  const mockCollection = jest.fn();
  const mockDoc = jest.fn();
  const mockGet = jest.fn();
  const mockSet = jest.fn();
  const mockAdd = jest.fn();
  const mockDelete = jest.fn();
  const mockWhere = jest.fn();
  const mockOrderBy = jest.fn();
  const mockLimit = jest.fn();
  // ... add other necessary mocks

  // Mock the DocumentReference class behavior
  mockDoc.mockImplementation((id?: string) => ({
    id: id || 'mock-doc-id',
    path: `mock-collection/${id || 'mock-doc-id'}`,
    get: mockGet,
    set: mockSet,
    delete: mockDelete,
    collection: mockCollection, // For subcollections
    // Add other DocumentReference methods/properties if needed
  }));

  // Mock the CollectionReference class behavior
  mockCollection.mockImplementation((id?: string) => ({
    id: id || 'mock-collection-id',
    path: id || 'mock-collection-id',
    doc: mockDoc,
    add: mockAdd,
    where: mockWhere,
    orderBy: mockOrderBy,
    limit: mockLimit,
    get: jest.fn(), // Mock get for collection queries if needed
    // Add other CollectionReference methods/properties if needed
  }));

  // Mock the main Firestore class/namespace
  const mockFirestoreInstance = {
    collection: mockCollection,
    // Add other Firestore methods if needed (e.g., batch, runTransaction)
  };

  // Mock the static methods/properties like Timestamp, FieldValue if needed
  return {
    getFirestore: jest.fn(() => mockFirestoreInstance),
    Timestamp: {
      now: jest.fn(() => ({ seconds: Date.now() / 1000, nanoseconds: 0 })),
      fromDate: jest.fn((date: Date) => ({ seconds: date.getTime() / 1000, nanoseconds: 0 })),
    },
    FieldValue: {
      serverTimestamp: jest.fn(() => 'SERVER_TIMESTAMP_PLACEHOLDER'), // Placeholder
      delete: jest.fn(() => 'DELETE_FIELD_PLACEHOLDER'),
      // Add other FieldValue static methods if needed
    },
    // Export the mocked classes/functions if they are used directly
    CollectionReference: mockCollection,
    DocumentReference: mockDoc,
    // Export the mock instance if needed for type checking in tests
    mockFirestoreInstance, // Export the instance for potential use in tests
  };
});


describe('AdminBaseCollectionRef (Admin Runtime)', () => {
  let mockFirestoreAdmin: admin.Firestore;
  let collectionRef: AdminBaseCollectionRef<any, any>; // Use specific types if available
  let mockAdminCollectionRefInternal: any; // To hold the mocked internal ref

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Get the mocked Firestore instance
    // We need to re-import or access the mock correctly after jest.mock
    const mockedAdmin = require('firebase-admin/firestore');
    mockFirestoreAdmin = mockedAdmin.getFirestore();
    mockAdminCollectionRefInternal = mockFirestoreAdmin.collection('test-collection'); // Get the mocked internal ref

    // Instantiate the class under test
    // Constructor: firestore, collectionId, schema?, parentRef?
    collectionRef = new AdminBaseCollectionRef(
      mockFirestoreAdmin,
      'test-collection'
      // Add schema mock if needed
    );
  });

  it('should be defined', () => {
    expect(collectionRef).toBeDefined();
  });

  it('should call admin firestore.collection().doc() when creating a doc ref', () => {
    const testId = 'test-admin-doc-id';
    collectionRef.doc(testId);
    // Check if the 'doc' method on the *mocked* internal collection reference was called
    expect(mockAdminCollectionRefInternal.doc).toHaveBeenCalledWith(testId);
  });

  it('should call admin firestore.collection().add() when adding a document', async () => {
    const data = { service: 'admin-test', status: 'active' };
    const mockReturnedDocRef = { id: 'new-admin-generated-id' };

    // Mock the behavior of add for this test on the internal ref
    (mockAdminCollectionRefInternal.add as jest.Mock).mockResolvedValue(mockReturnedDocRef);

    const result = await collectionRef.add(data);

    // Verify add was called on the internal ref with data
    expect(mockAdminCollectionRefInternal.add).toHaveBeenCalledWith(data);
    // Verify the returned value is the DocumentReference from the mock
    expect(result).toBe(mockReturnedDocRef);
  });

});