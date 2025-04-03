import { ClientBaseCollectionRef } from '../baseCollection';
import { collection, doc, addDoc, setDoc, deleteDoc, getDoc } from 'firebase/firestore'; // Import necessary functions

// Mock the Firestore instance and related functions
jest.mock('firebase/firestore', () => ({
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
  // Add other necessary mocks
}));

describe('BaseCollectionRef (Client Runtime)', () => {
  let mockFirestore: any; // Type appropriately if possible
  let collectionRef: ClientBaseCollectionRef<any, any>; // Use specific types if available

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
    collectionRef = new ClientBaseCollectionRef(
      mockFirestore,
      'test-collection'
      // Add schema mock if needed for specific tests
    );
  });

  it('should be defined', () => {
    expect(collectionRef).toBeDefined();
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
    const data = { age: 32 };
    const options = { merge: true };
    const mockDocRefInternal = { id: testId, path: `test-collection/${testId}` };

    (doc as jest.Mock).mockReturnValue(mockDocRefInternal);
    (setDoc as jest.Mock).mockResolvedValue(undefined);

    await collectionRef.set(testId, data, options);

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
  });

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

});