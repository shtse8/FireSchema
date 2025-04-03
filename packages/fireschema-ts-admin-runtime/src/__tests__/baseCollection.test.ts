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
// Top-level variables for mocks and test data
let mockFirestore: any;
let mockParentRef: any;
let mockCollectionRef: any;
let mockDocRef: any;
let collectionRefInstance: AdminBaseCollectionRef<TestData, TestAddData>;
const testCollectionId = 'test-items';
const testDocId = 'test-doc-123';
const mockWriteResult = { writeTime: { seconds: 1, nanoseconds: 1 } as Timestamp } as WriteResult; // Basic mock

describe('AdminBaseCollectionRef', () => {
  // Declarations moved to top level
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

  describe('subCollection()', () => {
    const parentDocId = 'parent-123';
    const subCollectionId = 'sub-items';
    const subSchema = { fields: { value: {} } };
    const fullSchema = {
      fields: { name: {} },
      subCollections: {
        [subCollectionId]: {
          schema: subSchema,
          collectionClass: MockSubCollection, // Use the mock class
        },
      },
    };

    beforeEach(() => {
      // --- START COPY ---
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
      // --- END COPY ---

      // Ensure the main collection instance is created with the schema
      collectionRefInstance = new AdminBaseCollectionRef<TestData, TestAddData>(
        mockFirestore,
        testCollectionId,
        fullSchema // Provide the schema with sub-collection info
      );
      // Mock the doc() call on the main collection ref to return the parent doc ref
      mockCollectionRef.doc.mockReturnValue(mockParentRef);
    });

    it('should throw an error if the sub-collection key is not found in the schema', () => {
      expect(() => {
        collectionRefInstance.subCollection(parentDocId, 'non-existent-sub', MockSubCollection, undefined); // Pass class/schema to satisfy TS, error should throw first
      }).toThrow(`Sub-collection 'non-existent-sub' not found in schema for collection '${testCollectionId}'`);
      expect(mockCollectionRef.doc).not.toHaveBeenCalled(); // Should throw before getting parent doc ref
    });

     it('should throw an error if the sub-collection definition is missing the collectionClass', () => {
       const schemaWithoutClass = {
         fields: { name: {} },
         subCollections: {
           [subCollectionId]: {
             schema: subSchema,
             // Missing collectionClass
           },
         },
       };
       collectionRefInstance = new AdminBaseCollectionRef<TestData, TestAddData>(
         mockFirestore, testCollectionId, schemaWithoutClass
       );
       expect(() => {
         collectionRefInstance.subCollection(parentDocId, subCollectionId, MockSubCollection, subSchema); // Pass class/schema
       }).toThrow(`Collection class definition missing for sub-collection '${subCollectionId}' in schema for collection '${testCollectionId}'`);
       expect(mockCollectionRef.doc).not.toHaveBeenCalled();
     });

    it('should instantiate the correct sub-collection class with correct parameters', () => {
      const subCollectionInstance = collectionRefInstance.subCollection(parentDocId, subCollectionId, MockSubCollection, subSchema); // Pass class/schema

      // 1. Verify parent document reference was obtained
      expect(mockCollectionRef.doc).toHaveBeenCalledWith(parentDocId);

      // 2. Verify the sub-collection class was instantiated
      // We can't directly check the constructor call count on MockSubCollection easily without more complex mocking,
      // but we can check the type and properties of the returned instance.
      expect(subCollectionInstance).toBeInstanceOf(MockSubCollection);

      // 3. Check parameters passed to the sub-collection constructor (via its properties/methods if needed)
      // Accessing private members for testing is generally discouraged, but we can infer from the mock setup.
      // The MockSubCollection constructor calls super(), which sets up the internal ref.
      expect((subCollectionInstance as any).firestore).toBe(mockFirestore); // Check firestore instance
      expect(subCollectionInstance.ref.id).toBe(subCollectionId); // Check collectionId
      expect((subCollectionInstance as any).schema).toBe(subSchema); // Check schema passed
      expect((subCollectionInstance as any).parentRef).toBe(mockParentRef); // Check parentRef passed
      expect(mockParentRef.collection).toHaveBeenCalledWith(subCollectionId); // Check underlying SDK call
    });

     it('should instantiate the sub-collection even if the main schema has no fields defined', () => {
        const schemaNoFields = {
            fields: {}, // Add empty fields object
            subCollections: {
                [subCollectionId]: {
                    schema: subSchema,
                    collectionClass: MockSubCollection,
                },
            },
        };
        collectionRefInstance = new AdminBaseCollectionRef<TestData, TestAddData>(
            mockFirestore, testCollectionId, schemaNoFields
        );

        const subCollectionInstance = collectionRefInstance.subCollection(parentDocId, subCollectionId, MockSubCollection, subSchema); // Pass class/schema
        expect(mockCollectionRef.doc).toHaveBeenCalledWith(parentDocId);
        expect(subCollectionInstance).toBeInstanceOf(MockSubCollection);
        expect((subCollectionInstance as any).parentRef).toBe(mockParentRef);
     });
  });
}); // This now closes the main describe block
