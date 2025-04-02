import { BaseCollectionRef, CollectionSchema } from '../baseCollection'; // Adjust path as needed
import {
  Firestore,
  CollectionReference,
  DocumentReference,
  DocumentData,
  collection,
  doc,
  getDoc,
  addDoc,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';

// Mock the 'firebase/firestore' module
const mockCollection = jest.fn();
const mockDoc = jest.fn();
const mockGetDoc = jest.fn();
const mockAddDoc = jest.fn();
const mockSetDoc = jest.fn();
const mockDeleteDoc = jest.fn();
const mockServerTimestamp = jest.fn(() => 'mockServerTimestampValue'); // Return a placeholder

jest.mock('firebase/firestore', () => ({
  collection: (...args: any[]) => mockCollection(...args),
  doc: (...args: any[]) => mockDoc(...args),
  getDoc: (...args: any[]) => mockGetDoc(...args),
  addDoc: (...args: any[]) => mockAddDoc(...args),
  setDoc: (...args: any[]) => mockSetDoc(...args),
  deleteDoc: (...args: any[]) => mockDeleteDoc(...args),
  serverTimestamp: () => mockServerTimestamp(), // Corrected: No arguments
  // Add other necessary exports if needed, e.g., types or other functions
}));

// Define dummy types for testing
interface TestData extends DocumentData {
  id?: string;
  name: string;
  value?: number;
  createdAt?: any; // Allow mock server timestamp
}
interface TestAddData extends DocumentData {
  name: string;
  value?: number;
  createdAt?: any;
}

// Concrete implementation for testing abstract class
class TestCollectionRef extends BaseCollectionRef<TestData, TestAddData> {
  constructor(
    firestore: Firestore,
    collectionId: string,
    schema?: CollectionSchema,
    parentRef?: DocumentReference<DocumentData>
  ) {
    super(firestore, collectionId, schema, parentRef);
  }
  // Implement abstract methods if BaseCollectionRef becomes abstract later
}

describe('BaseCollectionRef', () => {
  let mockFirestore: Firestore;
  let mockParentRef: DocumentReference<DocumentData>;
  let mockCollectionRef: CollectionReference<TestData>;
  let mockDocumentRef: DocumentReference<TestData>;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    // Setup mock return values
    mockFirestore = {} as Firestore; // Simple mock object
    mockParentRef = { id: 'parentId', path: 'parents/parentId' } as DocumentReference<DocumentData>;
    mockCollectionRef = { id: 'testItems', path: 'testItems' } as CollectionReference<TestData>;
    mockDocumentRef = { id: 'docId', path: 'testItems/docId' } as DocumentReference<TestData>;

    mockCollection.mockReturnValue(mockCollectionRef);
    mockDoc.mockReturnValue(mockDocumentRef);
  });

  // --- Constructor Tests ---
  it('should initialize ref correctly for a root collection', () => {
    const collectionId = 'testItems';
    const testCollection = new TestCollectionRef(mockFirestore, collectionId);

    expect(testCollection.ref).toBe(mockCollectionRef);
    expect(mockCollection).toHaveBeenCalledTimes(1);
    expect(mockCollection).toHaveBeenCalledWith(mockFirestore, collectionId);
    expect(testCollection).toBeInstanceOf(BaseCollectionRef);
  });

  it('should initialize ref correctly for a subcollection', () => {
    const collectionId = 'subItems';
    const testCollection = new TestCollectionRef(
      mockFirestore,
      collectionId,
      undefined, // no schema
      mockParentRef
    );

    expect(testCollection.ref).toBe(mockCollectionRef); // collection mock returns this
    expect(mockCollection).toHaveBeenCalledTimes(1);
    expect(mockCollection).toHaveBeenCalledWith(mockParentRef, collectionId);
  });

  // --- doc() Tests ---
  it('should return a DocumentReference when doc() is called', () => {
    const collectionId = 'testItems';
    const docId = 'testDoc123';
    const testCollection = new TestCollectionRef(mockFirestore, collectionId);
    const docRef = testCollection.doc(docId);

    expect(docRef).toBe(mockDocumentRef); // doc mock returns this
    expect(mockDoc).toHaveBeenCalledTimes(1);
    expect(mockDoc).toHaveBeenCalledWith(mockCollectionRef, docId); // Ensure doc is called on the collection ref
  });

  // --- applyDefaults() Tests ---
  it('should apply serverTimestamp default value', () => {
    const schema: CollectionSchema = {
      fields: {
        name: {}, // No default
        createdAt: { defaultValue: 'serverTimestamp' },
      },
    };
    const testCollection = new TestCollectionRef(mockFirestore, 'items', schema);
    const inputData: TestAddData = { name: 'Test Item' };
    const expectedData = { name: 'Test Item', createdAt: 'mockServerTimestampValue' };

    // Access protected method for testing (use @ts-ignore or make temporarily public if needed)
    // Or test via the 'add' method which uses it. Let's test via 'add'.
    mockAddDoc.mockResolvedValue(mockDocumentRef); // Mock addDoc for the test

    return testCollection.add(inputData).then(() => {
      expect(mockServerTimestamp).toHaveBeenCalledTimes(1);
      expect(mockAddDoc).toHaveBeenCalledTimes(1);
      // Check the data passed to addDoc
      expect(mockAddDoc).toHaveBeenCalledWith(mockCollectionRef, expectedData);
    });
  });

   it('should not overwrite existing value with serverTimestamp default', () => {
    const schema: CollectionSchema = {
      fields: {
        createdAt: { defaultValue: 'serverTimestamp' },
      },
    };
    const testCollection = new TestCollectionRef(mockFirestore, 'items', schema);
    const specificDate = new Date();
    const inputData: TestAddData = { name: 'Test Item', createdAt: specificDate };
    const expectedData = { name: 'Test Item', createdAt: specificDate }; // Expect original date

    mockAddDoc.mockResolvedValue(mockDocumentRef);

    return testCollection.add(inputData).then(() => {
      expect(mockServerTimestamp).not.toHaveBeenCalled();
      expect(mockAddDoc).toHaveBeenCalledTimes(1);
      expect(mockAddDoc).toHaveBeenCalledWith(mockCollectionRef, expectedData);
    });
  });

  // --- add() Tests ---
  it('should call addDoc with default-applied data', async () => {
     const schema: CollectionSchema = {
      fields: {
        createdAt: { defaultValue: 'serverTimestamp' },
      },
    };
    const testCollection = new TestCollectionRef(mockFirestore, 'items', schema);
    const inputData: TestAddData = { name: 'New Item' };
    const expectedData = { name: 'New Item', createdAt: 'mockServerTimestampValue' };
    mockAddDoc.mockResolvedValue(mockDocumentRef);

    const resultRef = await testCollection.add(inputData);

    expect(resultRef).toBe(mockDocumentRef);
    expect(mockAddDoc).toHaveBeenCalledTimes(1);
    expect(mockAddDoc).toHaveBeenCalledWith(mockCollectionRef, expectedData);
  });

  // --- set() Tests ---
   it('should call setDoc with provided data', async () => {
    const testCollection = new TestCollectionRef(mockFirestore, 'items');
    const docId = 'item1';
    const inputData: TestAddData = { name: 'Updated Item' };
    // Note: setDoc expects TData, we cast TAddData assuming compatibility for test
    const expectedData = inputData as unknown as TestData;
    mockSetDoc.mockResolvedValue(undefined);

    await testCollection.set(docId, inputData);

    expect(mockSetDoc).toHaveBeenCalledTimes(1);
    expect(mockDoc).toHaveBeenCalledWith(mockCollectionRef, docId);
    expect(mockSetDoc).toHaveBeenCalledWith(mockDocumentRef, expectedData, {}); // Default options
  });

   it('should call setDoc with options', async () => {
    const testCollection = new TestCollectionRef(mockFirestore, 'items');
    const docId = 'item1';
    const inputData: TestAddData = { name: 'Merged Item', value: 100 };
    const expectedData = inputData as unknown as TestData;
    const options = { merge: true };
    mockSetDoc.mockResolvedValue(undefined);

    await testCollection.set(docId, inputData, options);

    expect(mockSetDoc).toHaveBeenCalledTimes(1);
    expect(mockDoc).toHaveBeenCalledWith(mockCollectionRef, docId);
    expect(mockSetDoc).toHaveBeenCalledWith(mockDocumentRef, expectedData, options);
  });

  // --- delete() Tests ---
  it('should call deleteDoc', async () => {
    const testCollection = new TestCollectionRef(mockFirestore, 'items');
    const docId = 'itemToDelete';
    mockDeleteDoc.mockResolvedValue(undefined);

    await testCollection.delete(docId);

    expect(mockDeleteDoc).toHaveBeenCalledTimes(1);
    expect(mockDoc).toHaveBeenCalledWith(mockCollectionRef, docId);
    expect(mockDeleteDoc).toHaveBeenCalledWith(mockDocumentRef);
  });

  // --- get() Tests ---
  it('should call getDoc and return data if exists', async () => {
    const testCollection = new TestCollectionRef(mockFirestore, 'items');
    const docId = 'itemToGet';
    const mockData: TestData = { name: 'Fetched Item', value: 42 };
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => mockData,
      id: docId,
    });

    const result = await testCollection.get(docId);

    expect(result).toEqual(mockData);
    expect(mockGetDoc).toHaveBeenCalledTimes(1);
    expect(mockDoc).toHaveBeenCalledWith(mockCollectionRef, docId);
    expect(mockGetDoc).toHaveBeenCalledWith(mockDocumentRef);
  });

  it('should call getDoc and return undefined if not exists', async () => {
    const testCollection = new TestCollectionRef(mockFirestore, 'items');
    const docId = 'itemNotFound';
    mockGetDoc.mockResolvedValue({
      exists: () => false,
      data: () => undefined, // Firestore snapshot.data() returns undefined if !exists
      id: docId,
    });

    const result = await testCollection.get(docId);

    expect(result).toBeUndefined();
    expect(mockGetDoc).toHaveBeenCalledTimes(1);
    expect(mockDoc).toHaveBeenCalledWith(mockCollectionRef, docId);
    expect(mockGetDoc).toHaveBeenCalledWith(mockDocumentRef);
  });

  // --- subCollection() Tests ---
   it('should create subcollection instance correctly', () => {
    const rootCollection = new TestCollectionRef(mockFirestore, 'users');
    const parentId = 'user123';
    const subCollectionId = 'posts';

    // Mock subcollection class constructor
    const MockSubCollectionClass = jest.fn().mockImplementation((fs, id, schema, parent) => {
      // Basic mock instance properties
      return { firestore: fs, collectionId: id, parentRef: parent, ref: 'mockSubCollectionRef' };
    });

    // Access protected method for testing
    const subCollectionInstance = (rootCollection as any).subCollection(
      parentId,
      subCollectionId,
      MockSubCollectionClass,
      undefined // no subSchema
    );

    expect(mockDoc).toHaveBeenCalledTimes(1);
    expect(mockDoc).toHaveBeenCalledWith(rootCollection.ref, parentId); // Called to get parentDocRef
    expect(MockSubCollectionClass).toHaveBeenCalledTimes(1);
    expect(MockSubCollectionClass).toHaveBeenCalledWith(
      mockFirestore,
      subCollectionId,
      undefined, // subSchema
      mockDocumentRef // The result of rootCollection.doc(parentId)
    );
    expect(subCollectionInstance).toBeDefined();
    expect(subCollectionInstance.collectionId).toBe(subCollectionId);
    expect(subCollectionInstance.parentRef).toBe(mockDocumentRef);
  });

});