import { ClientBaseCollectionRef } from '../baseCollection';
import { collection, doc, addDoc, setDoc, deleteDoc, getDoc } from 'firebase/firestore'; // Import necessary functions

// Mock the Firestore instance and related functions
// Mock FieldValue sentinel object for comparison
const MOCK_SERVER_TIMESTAMP = { type: 'serverTimestamp' } as any; // Simple mock object

jest.mock('firebase/firestore', () => ({
  // Keep original exports if needed, or mock specific ones
  ...(jest.requireActual('firebase/firestore')), // Keep actual implementations for types etc.
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  addDoc: jest.fn(),
  deleteDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  startAt: jest.fn(),
  startAfter: jest.fn(),
  endAt: jest.fn(),
  endBefore: jest.fn(),
  getDocs: jest.fn(),
  serverTimestamp: jest.fn(() => MOCK_SERVER_TIMESTAMP), // Mock serverTimestamp
  // Add other necessary mocks
}));

// Import serverTimestamp after mocking
import { serverTimestamp } from 'firebase/firestore';

// Mock types for testing
interface TestData {
  name: string;
  age?: number; // Add age
  createdAt?: any; // Use 'any' for FieldValue in type
}

// Mock Sub-Collection Class to be instantiated by the test
class MockSubCollection extends ClientBaseCollectionRef<any, any> {
  constructor(
    firestore: any, // Use 'any' for simplicity in mock
    collectionId: string,
    schema?: any,
    parentRef?: any // Use 'any' for simplicity in mock
  ) {
    super(firestore, collectionId, schema, parentRef);
  }
}
interface TestAddData {
  name: string;
  age?: number; // Add age
  createdAt?: 'serverTimestamp' | Date; // Allow string literal or Date
}


describe('ClientBaseCollectionRef', () => { // Renamed describe block
  let mockFirestore: any; // Type appropriately if possible
  let collectionRef: ClientBaseCollectionRef<TestData, TestAddData>; // Use specific types

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    // Setup mock Firestore instance
    mockFirestore = {
      // Mock necessary properties/methods if BaseCollectionRef interacts directly
    };

    // Mock the return value of the top-level 'collection' function
    const mockCollectionRefInternal = { id: 'test-collection', path: 'test-collection' };
    (collection as jest.Mock).mockReturnValue(mockCollectionRefInternal);

    // Instantiate the class under test
    // Adjust constructor arguments based on the actual class definition
    // Constructor: firestore, collectionId, schema?, parentRef?
    collectionRef = new ClientBaseCollectionRef<TestData, TestAddData>(
      mockFirestore,
      'test-collection'
      // Schema is added in specific tests below
    );
  });

  it('should be defined', () => {
    expect(collectionRef).toBeDefined();
  });

  it('should call firestore.collection() with collectionId when no parentRef is provided', () => {
    // This is implicitly tested in beforeEach, but let's make it explicit
    expect(collection).toHaveBeenCalledWith(mockFirestore, 'test-collection');
    expect(collectionRef.ref).toBe((collection as jest.Mock).mock.results[0].value);
  });

  it('should call firestore.collection() with parentRef when parentRef is provided', () => {
    const mockParentDocRef = { id: 'parent-id', path: 'parents/parent-id' };
    // Mock the top-level doc function to return the parent ref when needed
    (doc as jest.Mock).mockReturnValue(mockParentDocRef); // Assume doc is used to get parent ref if needed by constructor logic, adjust if not

    // Re-instantiate with parentRef
    const collectionWithParent = new ClientBaseCollectionRef(
      mockFirestore,
      'test-sub-collection',
      undefined, // No schema
      mockParentDocRef as any // Pass the mock parent ref
    );

    // Verify collection is called with parent ref and sub-collection id
    expect(collection).toHaveBeenCalledWith(mockParentDocRef, 'test-sub-collection');
    expect(collectionWithParent.ref).toBe((collection as jest.Mock).mock.results[1].value); // Assuming this is the second call
  }); // <-- Added missing closing brace

  // --- Test applyDefaults ---
  describe('applyDefaults() with serverTimestamp', () => {
    const schemaWithDefault = { fields: { createdAt: { defaultValue: 'serverTimestamp' } } };

    beforeEach(() => {
      // Instantiate with schema for these tests
      collectionRef = new ClientBaseCollectionRef<TestData, TestAddData>(
        mockFirestore,
        'test-collection',
        schemaWithDefault
      );
      // Reset serverTimestamp mock call count
      (serverTimestamp as jest.Mock).mockClear();
    });

    it('should apply serverTimestamp default before calling addDoc()', async () => {
      const dataToAdd: TestAddData = { name: 'Item With Default' };
      const expectedDataWithDefault: TestData = {
          name: 'Item With Default',
          createdAt: MOCK_SERVER_TIMESTAMP
      };
      const internalCollectionRef = (collection as jest.Mock).mock.results[0].value;
      (addDoc as jest.Mock).mockResolvedValue({ id: 'new-id' }); // Mock addDoc return

      await collectionRef.add(dataToAdd);

      expect(serverTimestamp).toHaveBeenCalledTimes(1);
      expect(addDoc).toHaveBeenCalledWith(internalCollectionRef, expectedDataWithDefault);
    });

    it('should NOT apply serverTimestamp default if value is provided to addDoc()', async () => {
      const providedDate = new Date();
      const dataToAdd: TestAddData = {
          name: 'Item With Provided Timestamp',
          createdAt: providedDate
      };
      const internalCollectionRef = (collection as jest.Mock).mock.results[0].value;
      (addDoc as jest.Mock).mockResolvedValue({ id: 'new-id' });

      await collectionRef.add(dataToAdd);

      expect(serverTimestamp).not.toHaveBeenCalled();
      expect(addDoc).toHaveBeenCalledWith(internalCollectionRef, dataToAdd); // Should use provided data
    });

     it('should apply serverTimestamp default before calling setDoc()', async () => {
      const testId = 'set-doc-id';
      const dataToSet: TestAddData = { name: 'Set Item With Default' };
       const expectedDataWithDefault: TestData = {
          name: 'Set Item With Default',
          createdAt: MOCK_SERVER_TIMESTAMP
      };
      const mockDocRefInternal = { id: testId };
      (doc as jest.Mock).mockReturnValue(mockDocRefInternal);
      (setDoc as jest.Mock).mockResolvedValue(undefined);

      await collectionRef.set(testId, dataToSet);

      expect(serverTimestamp).toHaveBeenCalledTimes(1);
      expect(setDoc).toHaveBeenCalledWith(mockDocRefInternal, expectedDataWithDefault, {}); // Default options
    });

    it('should NOT apply serverTimestamp default if value is provided to setDoc()', async () => {
      const testId = 'set-doc-id-provided';
      const providedDate = new Date();
      const dataToSet: TestAddData = {
          name: 'Set Item With Provided Timestamp',
          createdAt: providedDate
      };
       const mockDocRefInternal = { id: testId };
      (doc as jest.Mock).mockReturnValue(mockDocRefInternal);
      (setDoc as jest.Mock).mockResolvedValue(undefined);

      await collectionRef.set(testId, dataToSet);

      expect(serverTimestamp).not.toHaveBeenCalled();
      expect(setDoc).toHaveBeenCalledWith(mockDocRefInternal, dataToSet, {}); // Default options
    });
  });

  // Add tests for constructor, methods like get, add, update, delete, query building etc.

  it('should call firestore.doc() when creating a doc ref', () => {
    const testId = 'test-doc-id';
    // Retrieve the mocked internal ref returned by the top-level collection mock
    const internalCollectionRef = (collection as jest.Mock).mock.results[0].value;
    collectionRef.doc(testId);
    expect(doc).toHaveBeenCalledWith(internalCollectionRef, testId);
  });

  it('should call firestore.addDoc() when adding a document', async () => {
    const data = { name: 'Test User', age: 30 };
    const mockReturnedDocRef = { id: 'new-generated-id' };
    // Retrieve the mocked internal ref returned by the top-level collection mock
    const internalCollectionRef = (collection as jest.Mock).mock.results[0].value;

    // Mock the behavior of addDoc for this test
    (addDoc as jest.Mock).mockResolvedValue(mockReturnedDocRef);

    const result = await collectionRef.add(data);

    // Verify addDoc was called with the internal ref and data
    expect(addDoc).toHaveBeenCalledWith(internalCollectionRef, data);
    // Verify the returned value is the DocumentReference from the mock
    expect(result).toBe(mockReturnedDocRef);
  });


  it('should call firestore.setDoc() when setting a document', async () => {
    const testId = 'test-doc-id';
    const data = { name: 'Updated User', age: 31 };
    const mockDocRefInternal = { id: testId, path: `test-collection/${testId}` };

    // Mock the behavior of doc() for this test
    (doc as jest.Mock).mockReturnValue(mockDocRefInternal);
    // Mock the behavior of setDoc for this test
    (setDoc as jest.Mock).mockResolvedValue(undefined);

    await collectionRef.set(testId, data);

    // Verify doc was called correctly (it's called internally by set)
    // Note: doc() is called within the set method, using the internal collection ref
    const internalCollectionRef = (collection as jest.Mock).mock.results[0].value;
    expect(doc).toHaveBeenCalledWith(internalCollectionRef, testId);

    // Verify setDoc was called with the internal doc ref and data
    expect(setDoc).toHaveBeenCalledWith(mockDocRefInternal, data, {}); // Default options is empty object
  });

  it('should call firestore.setDoc() with options when setting a document', async () => {
    const testId = 'test-doc-id';
    const data: Partial<TestAddData> = { age: 32 }; // Use Partial<> for merge test
    const options = { merge: true } as const; // Use const assertion
    const mockDocRefInternal = { id: testId, path: `test-collection/${testId}` };

    (doc as jest.Mock).mockReturnValue(mockDocRefInternal);
    (setDoc as jest.Mock).mockResolvedValue(undefined);

    await collectionRef.set(testId, data as TestAddData, options); // Cast data for this specific test

    const internalCollectionRef = (collection as jest.Mock).mock.results[0].value;
    expect(doc).toHaveBeenCalledWith(internalCollectionRef, testId);
    expect(setDoc).toHaveBeenCalledWith(mockDocRefInternal, data, options);
  });

  it('should call firestore.deleteDoc() when deleting a document', async () => {
    const testId = 'test-doc-id';
    const mockDocRefInternal = { id: testId, path: `test-collection/${testId}` };

    (doc as jest.Mock).mockReturnValue(mockDocRefInternal);
    (deleteDoc as jest.Mock).mockResolvedValue(undefined);

    await collectionRef.delete(testId);

    const internalCollectionRef = (collection as jest.Mock).mock.results[0].value;
    expect(doc).toHaveBeenCalledWith(internalCollectionRef, testId);
    expect(deleteDoc).toHaveBeenCalledWith(mockDocRefInternal);
  }); // <-- Corrected closing brace

  it('should call firestore.getDoc() and return data when getting an existing document', async () => {
    const testId = 'test-doc-id';
    const expectedData = { name: 'Fetched User', age: 40 };
    const mockDocRefInternal = { id: testId, path: `test-collection/${testId}` };
    const mockSnapshot = {
      exists: () => true,
      data: () => expectedData,
      id: testId,
      ref: mockDocRefInternal,
    };

    (doc as jest.Mock).mockReturnValue(mockDocRefInternal);
    (getDoc as jest.Mock).mockResolvedValue(mockSnapshot);

    const result = await collectionRef.get(testId);

    const internalCollectionRef = (collection as jest.Mock).mock.results[0].value;
    expect(doc).toHaveBeenCalledWith(internalCollectionRef, testId);
    expect(getDoc).toHaveBeenCalledWith(mockDocRefInternal);
    expect(result).toEqual(expectedData);
  });

  it('should call firestore.getDoc() and return undefined when getting a non-existent document', async () => {
    const testId = 'non-existent-id';
    const mockDocRefInternal = { id: testId, path: `test-collection/${testId}` };
    const mockSnapshot = {
      exists: () => false,
      data: () => undefined, // Firestore SDK behavior
      id: testId,
      ref: mockDocRefInternal,
    };

    (doc as jest.Mock).mockReturnValue(mockDocRefInternal);
    (getDoc as jest.Mock).mockResolvedValue(mockSnapshot);

    const result = await collectionRef.get(testId);

    const internalCollectionRef = (collection as jest.Mock).mock.results[0].value;
    expect(doc).toHaveBeenCalledWith(internalCollectionRef, testId);
    expect(getDoc).toHaveBeenCalledWith(mockDocRefInternal);
    expect(result).toBeUndefined();
  });

  // --- Test subCollection() ---
  describe('subCollection()', () => {
    const parentDocId = 'parent-123';
    const subCollectionId = 'sub-items';
    const subSchema = { fields: { value: {} } };
    const fullSchema = {
      fields: { name: {} }, // Need fields for CollectionSchema type
      subCollections: {
        [subCollectionId]: {
          schema: subSchema,
          collectionClass: MockSubCollection, // Use the mock class
        },
      },
    };
    let mockParentDocRef: any;

    beforeEach(() => {
      // Mock the parent document reference
      mockParentDocRef = { id: parentDocId, path: `test-collection/${parentDocId}` };
      (doc as jest.Mock).mockImplementation((ref, id) => {
        if (id === parentDocId) {
          return mockParentDocRef;
        }
        // Default mock for other doc calls if needed
        return { id: id, path: `${ref.path}/${id}` };
      });

      // Instantiate the main collection with the full schema
      collectionRef = new ClientBaseCollectionRef<TestData, TestAddData>(
        mockFirestore,
        'test-collection',
        fullSchema
      );
    });

    it('should throw an error if the sub-collection key is not found in the schema', () => {
      // Set the schema on the instance for this test
      (collectionRef as any).schema = fullSchema;
      expect(() => {
        collectionRef.subCollection(parentDocId, 'non-existent-sub', MockSubCollection, undefined);
      }).toThrow(`Sub-collection 'non-existent-sub' not found in schema for collection 'test-collection'`);
      // Ensure doc() wasn't called unnecessarily before the check
      expect(doc).not.toHaveBeenCalledWith(mockParentDocRef, expect.anything());
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
       // Set the schema on the instance for this test
       (collectionRef as any).schema = schemaWithoutClass;
       expect(() => {
         // Call subCollection on the instance which now has the schemaWithoutClass
         collectionRef.subCollection(parentDocId, subCollectionId, MockSubCollection, undefined); // Pass undefined for subSchema as base method retrieves it
       }).toThrow(`Collection class definition missing for sub-collection '${subCollectionId}' in schema for collection 'test-collection'`);
     }); // <-- Added missing closing brace

    it('should instantiate the correct sub-collection class with correct parameters', () => {
      // Need to make subCollection public first, or use 'as any' for testing
      const subCollectionInstance = collectionRef.subCollection(
          parentDocId,
          subCollectionId,
          MockSubCollection, // Pass the class constructor
          subSchema          // Pass the schema
      );

      // 1. Verify parent document reference was obtained via doc()
      const internalCollectionRef = (collection as jest.Mock).mock.results[0].value;
      expect(doc).toHaveBeenCalledWith(internalCollectionRef, parentDocId);

      // 2. Verify the sub-collection class was instantiated
      expect(subCollectionInstance).toBeInstanceOf(MockSubCollection);

      // 3. Check parameters passed to the sub-collection constructor (via its properties)
      expect((subCollectionInstance as any).firestore).toBe(mockFirestore);
      expect((subCollectionInstance as any).collectionId).toBe(subCollectionId);
      expect((subCollectionInstance as any).schema).toBe(subSchema);
      // Removed check for parentRef property as it's not stored by default

      // 4. Verify the internal 'collection' function was called correctly by the sub-collection's constructor
      //    Use expect.anything() for the parent ref as mock comparison can be tricky.
      expect(collection).toHaveBeenCalledWith(expect.anything(), subCollectionId);
    });
  }); // Close describe('subCollection()', ...)
}); // Close describe('ClientBaseCollectionRef', ...)
