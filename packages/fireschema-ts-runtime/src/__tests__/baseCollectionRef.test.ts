import { describe, it, expect, jest, beforeEach } from '@jest/globals'; // Import jest
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
  SetOptions, // Import SetOptions
} from 'firebase/firestore';

// Mock the 'firebase/firestore' module
const mockCollection = jest.fn<(...args: any[]) => CollectionReference<TestData>>(); // Use jest.fn with types
const mockDoc = jest.fn<(...args: any[]) => DocumentReference<TestData>>();
const mockGetDoc = jest.fn<(...args: any[]) => Promise<{ exists: () => boolean; data: () => TestData | undefined; id: string }>>();
const mockAddDoc = jest.fn<(...args: any[]) => Promise<DocumentReference<TestData>>>();
const mockSetDoc = jest.fn<(...args: any[]) => Promise<void>>();
const mockDeleteDoc = jest.fn<(...args: any[]) => Promise<void>>();
const mockServerTimestamp = jest.fn(() => 'mockServerTimestampValue');

jest.mock('firebase/firestore', () => ({ // Use jest.mock
  collection: (...args: any[]) => mockCollection(...args),
  doc: (...args: any[]) => mockDoc(...args),
  getDoc: (...args: any[]) => mockGetDoc(...args),
  addDoc: (...args: any[]) => mockAddDoc(...args),
  setDoc: (...args: any[]) => mockSetDoc(...args),
  deleteDoc: (...args: any[]) => mockDeleteDoc(...args),
  serverTimestamp: () => mockServerTimestamp(),
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
}

describe('BaseCollectionRef', () => {
  let mockFirestore: Firestore;
  let mockParentRef: DocumentReference<DocumentData>;
  let mockCollectionRef: CollectionReference<TestData>;
  let mockDocumentRef: DocumentReference<TestData>;

  beforeEach(() => {
    jest.clearAllMocks(); // Use jest.clearAllMocks

    mockFirestore = {} as Firestore;
    mockParentRef = { id: 'parentId', path: 'parents/parentId' } as DocumentReference<DocumentData>;
    mockCollectionRef = { id: 'testItems', path: 'testItems' } as CollectionReference<TestData>;
    mockDocumentRef = { id: 'docId', path: 'testItems/docId' } as DocumentReference<TestData>;

    mockCollection.mockReturnValue(mockCollectionRef);
    mockDoc.mockReturnValue(mockDocumentRef);
  });

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
    const testCollection = new TestCollectionRef(mockFirestore, collectionId, undefined, mockParentRef);
    expect(testCollection.ref).toBe(mockCollectionRef);
    expect(mockCollection).toHaveBeenCalledTimes(1);
    expect(mockCollection).toHaveBeenCalledWith(mockParentRef, collectionId);
  });

  it('should return a DocumentReference when doc() is called', () => {
    const collectionId = 'testItems';
    const docId = 'testDoc123';
    const testCollection = new TestCollectionRef(mockFirestore, collectionId);
    const docRef = testCollection.doc(docId);
    expect(docRef).toBe(mockDocumentRef);
    expect(mockDoc).toHaveBeenCalledTimes(1);
    expect(mockDoc).toHaveBeenCalledWith(mockCollectionRef, docId);
  });

  it('should call doc with an empty ID', () => {
    const collectionId = 'testItems';
    const docId = '';
    const testCollection = new TestCollectionRef(mockFirestore, collectionId);
    testCollection.doc(docId);
    expect(mockDoc).toHaveBeenCalledTimes(1);
    expect(mockDoc).toHaveBeenCalledWith(mockCollectionRef, docId);
  });

  it('should apply serverTimestamp default value', () => {
    const schema: CollectionSchema = { fields: { name: {}, createdAt: { defaultValue: 'serverTimestamp' } } };
    const testCollection = new TestCollectionRef(mockFirestore, 'items', schema);
    const inputData: TestAddData = { name: 'Test Item' };
    const expectedData = { name: 'Test Item', createdAt: 'mockServerTimestampValue' };
    mockAddDoc.mockResolvedValue(mockDocumentRef);
    return testCollection.add(inputData).then(() => {
      expect(mockServerTimestamp).toHaveBeenCalledTimes(1);
      expect(mockAddDoc).toHaveBeenCalledTimes(1);
      expect(mockAddDoc).toHaveBeenCalledWith(mockCollectionRef, expectedData);
    });
  });

  it('should not overwrite existing value with serverTimestamp default', () => {
    const schema: CollectionSchema = { fields: { createdAt: { defaultValue: 'serverTimestamp' } } };
    const testCollection = new TestCollectionRef(mockFirestore, 'items', schema);
    const specificDate = new Date();
    const inputData: TestAddData = { name: 'Test Item', createdAt: specificDate };
    const expectedData = { name: 'Test Item', createdAt: specificDate };
    mockAddDoc.mockResolvedValue(mockDocumentRef);
    return testCollection.add(inputData).then(() => {
      expect(mockServerTimestamp).not.toHaveBeenCalled();
      expect(mockAddDoc).toHaveBeenCalledTimes(1);
      expect(mockAddDoc).toHaveBeenCalledWith(mockCollectionRef, expectedData);
    });
  });

  it('should ignore non-serverTimestamp default values currently', () => {
    const schema: CollectionSchema = { fields: { name: { defaultValue: 'Default Name' }, value: { defaultValue: 0 } } };
    const testCollection = new TestCollectionRef(mockFirestore, 'items', schema);
    const inputData: TestAddData = { name: 'Specific Name' };
    const expectedData = { name: 'Specific Name' };
    mockAddDoc.mockResolvedValue(mockDocumentRef);
    return testCollection.add(inputData).then(() => {
      expect(mockServerTimestamp).not.toHaveBeenCalled();
      expect(mockAddDoc).toHaveBeenCalledTimes(1);
      expect(mockAddDoc).toHaveBeenCalledWith(mockCollectionRef, expectedData);
    });
  });

  it('should call addDoc with default-applied data', async () => {
    const schema: CollectionSchema = { fields: { createdAt: { defaultValue: 'serverTimestamp' } } };
    const testCollection = new TestCollectionRef(mockFirestore, 'items', schema);
    const inputData: TestAddData = { name: 'New Item' };
    const expectedData = { name: 'New Item', createdAt: 'mockServerTimestampValue' };
    mockAddDoc.mockResolvedValue(mockDocumentRef);
    const resultRef = await testCollection.add(inputData);
    expect(resultRef).toBe(mockDocumentRef);
    expect(mockAddDoc).toHaveBeenCalledTimes(1);
    expect(mockAddDoc).toHaveBeenCalledWith(mockCollectionRef, expectedData);
  });

  it('should call setDoc with provided data', async () => {
    const testCollection = new TestCollectionRef(mockFirestore, 'items');
    const docId = 'item1';
    const inputData: TestAddData = { name: 'Updated Item' };
    const expectedData = inputData as unknown as TestData;
    mockSetDoc.mockResolvedValue(undefined);
    await testCollection.set(docId, inputData);
    expect(mockSetDoc).toHaveBeenCalledTimes(1);
    expect(mockDoc).toHaveBeenCalledWith(mockCollectionRef, docId);
    expect(mockSetDoc).toHaveBeenCalledWith(mockDocumentRef, expectedData, {}); // Expect empty options object
  });

  it('should call setDoc with options', async () => {
    const testCollection = new TestCollectionRef(mockFirestore, 'items');
    const docId = 'item1';
    const inputData: TestAddData = { name: 'Merged Item', value: 100 };
    const expectedData = inputData as unknown as TestData;
    const options: SetOptions = { merge: true };
    mockSetDoc.mockResolvedValue(undefined);
    await testCollection.set(docId, inputData, options);
    expect(mockSetDoc).toHaveBeenCalledTimes(1);
    expect(mockDoc).toHaveBeenCalledWith(mockCollectionRef, docId);
    expect(mockSetDoc).toHaveBeenCalledWith(mockDocumentRef, expectedData, options);
  });

  it('should call deleteDoc', async () => {
    const testCollection = new TestCollectionRef(mockFirestore, 'items');
    const docId = 'itemToDelete';
    mockDeleteDoc.mockResolvedValue(undefined);
    await testCollection.delete(docId);
    expect(mockDeleteDoc).toHaveBeenCalledTimes(1);
    expect(mockDoc).toHaveBeenCalledWith(mockCollectionRef, docId);
    expect(mockDeleteDoc).toHaveBeenCalledWith(mockDocumentRef);
  });

  it('should call getDoc and return data if exists', async () => {
    const testCollection = new TestCollectionRef(mockFirestore, 'items');
    const docId = 'itemToGet';
    const mockData: TestData = { name: 'Fetched Item', value: 42 };
    mockGetDoc.mockResolvedValue({ exists: () => true, data: () => mockData, id: docId });
    const result = await testCollection.get(docId);
    expect(result).toEqual(mockData);
    expect(mockGetDoc).toHaveBeenCalledTimes(1);
    expect(mockDoc).toHaveBeenCalledWith(mockCollectionRef, docId);
    expect(mockGetDoc).toHaveBeenCalledWith(mockDocumentRef);
  });

  it('should call getDoc and return undefined if not exists', async () => {
    const testCollection = new TestCollectionRef(mockFirestore, 'items');
    const docId = 'itemNotFound';
    mockGetDoc.mockResolvedValue({ exists: () => false, data: () => undefined, id: docId });
    const result = await testCollection.get(docId);
    expect(result).toBeUndefined();
    expect(mockGetDoc).toHaveBeenCalledTimes(1);
    expect(mockDoc).toHaveBeenCalledWith(mockCollectionRef, docId);
    expect(mockGetDoc).toHaveBeenCalledWith(mockDocumentRef);
  });

  it('should create subcollection instance correctly', () => {
    const rootCollection = new TestCollectionRef(mockFirestore, 'users');
    const parentId = 'user123';
    const subCollectionId = 'posts';
    const MockSubCollectionClass = jest.fn().mockImplementation((fs, id, schema, parent) => { // Remove explicit types
      return { firestore: fs, collectionId: id, parentRef: parent, ref: 'mockSubCollectionRef' };
    });
    const subCollectionInstance = (rootCollection as any).subCollection(parentId, subCollectionId, MockSubCollectionClass, undefined);
    expect(mockDoc).toHaveBeenCalledTimes(1);
    expect(mockDoc).toHaveBeenCalledWith(rootCollection.ref, parentId);
    expect(MockSubCollectionClass).toHaveBeenCalledTimes(1);
    expect(MockSubCollectionClass).toHaveBeenCalledWith(mockFirestore, subCollectionId, undefined, mockDocumentRef);
    expect(subCollectionInstance).toBeDefined();
    expect(subCollectionInstance.collectionId).toBe(subCollectionId);
    expect(subCollectionInstance.parentRef).toBe(mockDocumentRef);
  });
});