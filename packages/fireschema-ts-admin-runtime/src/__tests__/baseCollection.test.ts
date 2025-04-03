import { AdminBaseCollectionRef } from '../baseCollection';
import { FieldValue as AdminFieldValue } from 'firebase-admin/firestore';
import type {
  Firestore,
  CollectionReference,
  DocumentReference,
  DocumentData,
  SetOptions,
  DocumentSnapshot,
  WriteResult,
  Timestamp, // Import Timestamp for mockSnapshot
} from 'firebase-admin/firestore';

// Mock FieldValue sentinel object for comparison
const MOCK_SERVER_TIMESTAMP = { type: 'serverTimestamp', isEqual: jest.fn() } as any;

// Mock the Firestore Admin SDK module and FieldValue static methods
jest.mock('firebase-admin/firestore', () => {
  const mockFieldValue = {
    serverTimestamp: jest.fn(() => MOCK_SERVER_TIMESTAMP),
    increment: jest.fn(), // Add mocks for others if needed later
    arrayUnion: jest.fn(),
    arrayRemove: jest.fn(),
    delete: jest.fn(),
  };
  return {
    FieldValue: mockFieldValue,
    Timestamp: { now: jest.fn(() => ({ seconds: 123, nanoseconds: 456 } as Timestamp)) }, // Mock Timestamp
  };
});

// Mock types for testing
interface TestData extends DocumentData {
  name: string;
  createdAt?: any; // Use 'any' for FieldValue in type
}
interface TestAddData extends DocumentData {
  name: string;
  createdAt?: 'serverTimestamp'; // Use string literal for schema default
}

// Mock Sub-Collection Class to be instantiated by the test
class MockSubCollection extends AdminBaseCollectionRef<any, any> {
  constructor(
    firestore: Firestore,
    collectionId: string,
    schema?: any,
    parentRef?: DocumentReference<DocumentData>
  ) {
    super(firestore, collectionId, schema, parentRef);
  }
}

describe('AdminBaseCollectionRef', () => {
  // Use 'any' or partial mocks, focusing on methods used by the class under test
  let mockFirestore: any;
  let mockParentRef: any;
  let mockCollectionRef: any;
  let mockDocRef: any;
  let collectionRefInstance: AdminBaseCollectionRef<TestData, TestAddData>;

  const testCollectionId = 'test-items';
  const testDocId = 'test-doc-123';
  const mockWriteResult = { writeTime: { seconds: 1, nanoseconds: 1 } as Timestamp } as WriteResult; // Basic mock

  beforeEach(() => {
    jest.clearAllMocks();

    // --- Simplified Mock Firestore Structure ---
    mockDocRef = {
      id: testDocId,
      path: `${testCollectionId}/${testDocId}`,
      set: jest.fn().mockResolvedValue(mockWriteResult),
      delete: jest.fn().mockResolvedValue(mockWriteResult),
      get: jest.fn(),
      // No need to mock everything, only what's called by AdminBaseCollectionRef
    };

    mockCollectionRef = {
      id: testCollectionId,
      path: testCollectionId,
      doc: jest.fn().mockReturnValue(mockDocRef),
      add: jest.fn().mockResolvedValue(mockDocRef), // add returns a DocumentReference
    };

    mockParentRef = {
      id: 'parent-doc',
      path: 'parents/parent-doc',
      collection: jest.fn().mockReturnValue(mockCollectionRef),
      parent: { // Add mock parent
        path: 'parents'
      }
    };

    mockFirestore = {
      collection: jest.fn().mockReturnValue(mockCollectionRef),
    };

    // Reset AdminFieldValue mocks
    (AdminFieldValue.serverTimestamp as jest.Mock).mockClear();
  });

  it('should initialize using firestore.collection() when no parentRef is provided', () => {
    collectionRefInstance = new AdminBaseCollectionRef<TestData, TestAddData>(
      mockFirestore,
      testCollectionId
    );
    expect(mockFirestore.collection).toHaveBeenCalledWith(testCollectionId);
    expect(mockParentRef.collection).not.toHaveBeenCalled();
    expect(collectionRefInstance.ref).toBe(mockCollectionRef);
    expect((collectionRefInstance as any).schema).toBeUndefined();
  });

  it('should initialize using parentRef.collection() when parentRef is provided', () => {
    collectionRefInstance = new AdminBaseCollectionRef<TestData, TestAddData>(
      mockFirestore,
      testCollectionId,
      undefined, // No schema
      mockParentRef
    );
    expect(mockParentRef.collection).toHaveBeenCalledWith(testCollectionId);
    expect(mockFirestore.collection).not.toHaveBeenCalled();
    expect(collectionRefInstance.ref).toBe(mockCollectionRef);
  });

   it('should store schema if provided', () => {
     const schema = { fields: { name: {} } };
     collectionRefInstance = new AdminBaseCollectionRef<TestData, TestAddData>(
       mockFirestore,
       testCollectionId,
       schema
     );
     expect((collectionRefInstance as any).schema).toBe(schema);
   });

  it('should call collectionRef.doc() when doc() is called', () => {
    collectionRefInstance = new AdminBaseCollectionRef<TestData, TestAddData>(mockFirestore, testCollectionId);
    const result = collectionRefInstance.doc(testDocId);
    expect(mockCollectionRef.doc).toHaveBeenCalledWith(testDocId);
    expect(result).toBe(mockDocRef);
  });

  // Test add() and applyDefaults
  it('should call collectionRef.add() with data when add() is called', async () => {
    collectionRefInstance = new AdminBaseCollectionRef<TestData, TestAddData>(mockFirestore, testCollectionId);
    const dataToAdd: TestAddData = { name: 'New Item' };
    const result = await collectionRefInstance.add(dataToAdd);

    expect(mockCollectionRef.add).toHaveBeenCalledWith(dataToAdd); // Defaults not applied in this case
    expect(result).toBe(mockDocRef); // add returns the new doc ref
  });

  it('should apply serverTimestamp default before calling collectionRef.add()', async () => {
    const schema = { fields: { createdAt: { defaultValue: 'serverTimestamp' } } };
    collectionRefInstance = new AdminBaseCollectionRef<TestData, TestAddData>(
        mockFirestore, testCollectionId, schema
    );
    const dataToAdd: TestAddData = { name: 'Item With Default' };
    const expectedDataWithDefault: TestData = {
        name: 'Item With Default',
        createdAt: MOCK_SERVER_TIMESTAMP
    };

    await collectionRefInstance.add(dataToAdd);

    expect(AdminFieldValue.serverTimestamp).toHaveBeenCalledTimes(1);
    expect(mockCollectionRef.add).toHaveBeenCalledWith(expectedDataWithDefault);
  });

  it('should NOT apply serverTimestamp default if value is provided', async () => {
    const schema = { fields: { createdAt: { defaultValue: 'serverTimestamp' } } };
    collectionRefInstance = new AdminBaseCollectionRef<TestData, TestAddData>(
        mockFirestore, testCollectionId, schema
    );
    const providedTimestamp = { seconds: 987, nanoseconds: 654 } as Timestamp; // Mock a specific timestamp
    const dataToAdd: TestAddData = {
        name: 'Item With Provided Timestamp',
        createdAt: providedTimestamp as any // Cast to 'any' to match TestAddData structure if needed, but value is provided
    };
    const expectedDataWithoutDefault: TestData = {
        name: 'Item With Provided Timestamp',
        createdAt: providedTimestamp
    };

    await collectionRefInstance.add(dataToAdd);

    // Ensure serverTimestamp was NOT called, and the provided value was used
    expect(AdminFieldValue.serverTimestamp).not.toHaveBeenCalled();
    expect(mockCollectionRef.add).toHaveBeenCalledWith(expectedDataWithoutDefault);
  });


  // Test set()
  it('should call docRef.set() with data when set() is called', async () => {
    collectionRefInstance = new AdminBaseCollectionRef<TestData, TestAddData>(mockFirestore, testCollectionId);
    const dataToSet: TestAddData = { name: 'Updated Item' };
    const result = await collectionRefInstance.set(testDocId, dataToSet);

    expect(mockCollectionRef.doc).toHaveBeenCalledWith(testDocId);
    expect(mockDocRef.set).toHaveBeenCalledWith(dataToSet, {}); // Default options
    expect(result).toBe(mockWriteResult);
  });

  it('should call docRef.set() with data and options when set() is called with options', async () => {
    collectionRefInstance = new AdminBaseCollectionRef<TestData, TestAddData>(mockFirestore, testCollectionId);
    const dataToSet: TestAddData = { name: 'Merged Item' };
    const options: SetOptions = { merge: true };
    const result = await collectionRefInstance.set(testDocId, dataToSet, options);

    expect(mockCollectionRef.doc).toHaveBeenCalledWith(testDocId);
    expect(mockDocRef.set).toHaveBeenCalledWith(dataToSet, options);
    expect(result).toBe(mockWriteResult);
  });

  // Test delete()
  it('should call docRef.delete() when delete() is called', async () => {
    collectionRefInstance = new AdminBaseCollectionRef<TestData, TestAddData>(mockFirestore, testCollectionId);
    const result = await collectionRefInstance.delete(testDocId);

    expect(mockCollectionRef.doc).toHaveBeenCalledWith(testDocId);
    expect(mockDocRef.delete).toHaveBeenCalledTimes(1);
    expect(result).toBe(mockWriteResult);
  });

  // Test get()
  it('should call docRef.get() and return data for existing doc', async () => {
    collectionRefInstance = new AdminBaseCollectionRef<TestData, TestAddData>(mockFirestore, testCollectionId);
    const expectedData: TestData = { name: 'Fetched Item' };
    // Add missing properties to snapshot mock
    const mockSnapshot = {
      exists: true,
      data: () => expectedData,
      id: testDocId,
      ref: mockDocRef,
      readTime: { seconds: 2, nanoseconds: 2 } as Timestamp, // Mock readTime
      get: jest.fn((fieldPath) => (expectedData as any)[fieldPath]), // Mock get
      isEqual: jest.fn(), // Mock isEqual
    } as any; // Use 'any' to avoid strict type checking on the mock object itself
    mockDocRef.get.mockResolvedValue(mockSnapshot);

    const result = await collectionRefInstance.get(testDocId);

    expect(mockCollectionRef.doc).toHaveBeenCalledWith(testDocId);
    expect(mockDocRef.get).toHaveBeenCalledTimes(1);
    expect(result).toEqual(expectedData);
  });

  it('should call docRef.get() and return undefined for non-existing doc', async () => {
    collectionRefInstance = new AdminBaseCollectionRef<TestData, TestAddData>(mockFirestore, testCollectionId);
    // Add missing properties to snapshot mock
    const mockSnapshot = {
      exists: false,
      data: () => undefined, // Admin SDK behavior
      id: testDocId,
      ref: mockDocRef,
      readTime: { seconds: 3, nanoseconds: 3 } as Timestamp, // Mock readTime
      get: jest.fn(() => undefined), // Mock get
      isEqual: jest.fn(), // Mock isEqual
    } as any; // Use 'any'
    mockDocRef.get.mockResolvedValue(mockSnapshot);

    const result = await collectionRefInstance.get(testDocId);

    expect(mockCollectionRef.doc).toHaveBeenCalledWith(testDocId);
    expect(mockDocRef.get).toHaveBeenCalledTimes(1);
    expect(result).toBeUndefined();
  });

});