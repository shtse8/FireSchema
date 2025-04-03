import { ClientBaseUpdateBuilder } from '../baseUpdateBuilder';
import {
  updateDoc,
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove,
  deleteField,
} from 'firebase/firestore';
import type {
  DocumentReference,
  DocumentData,
  FieldValue,
} from 'firebase/firestore';

// Mock FieldValue sentinel objects for comparison
const MOCK_INCREMENT = { type: 'increment', isEqual: jest.fn() } as FieldValue;
const MOCK_SERVER_TIMESTAMP = { type: 'serverTimestamp', isEqual: jest.fn() } as FieldValue;
const MOCK_ARRAY_UNION = { type: 'arrayUnion', isEqual: jest.fn() } as FieldValue;
const MOCK_ARRAY_REMOVE = { type: 'arrayRemove', isEqual: jest.fn() } as FieldValue;
const MOCK_DELETE_FIELD = { type: 'deleteField', isEqual: jest.fn() } as FieldValue;

// Mock the Firestore SDK functions
jest.mock('firebase/firestore', () => ({
  updateDoc: jest.fn(),
  serverTimestamp: jest.fn(() => MOCK_SERVER_TIMESTAMP),
  increment: jest.fn(() => MOCK_INCREMENT),
  arrayUnion: jest.fn(() => MOCK_ARRAY_UNION),
  arrayRemove: jest.fn(() => MOCK_ARRAY_REMOVE),
  deleteField: jest.fn(() => MOCK_DELETE_FIELD),
  // Mock other functions if needed by imports, even if not directly used
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
}));

// Mock types for testing
interface TestData extends DocumentData {
  name: string;
  count: number;
  tags: string[];
  updatedAt?: FieldValue;
  status?: string;
}

describe('ClientBaseUpdateBuilder', () => {
  let mockDocRef: DocumentReference<TestData>;
  let updateBuilder: ClientBaseUpdateBuilder<TestData>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockDocRef = {
      id: 'test-doc-id',
      path: 'test-collection/test-doc-id',
      // Add other properties/methods if needed
    } as DocumentReference<TestData>;

    updateBuilder = new ClientBaseUpdateBuilder<TestData>(mockDocRef);
  });

  it('should initialize with empty update data', () => {
    expect((updateBuilder as any)._updateData).toEqual({});
  });

  // Test immutability and basic set
  it('should add a basic field update immutably via _set', () => {
    const newValue = 'new name';
    const newBuilder = (updateBuilder as any)._set('name', newValue);

    expect(newBuilder).not.toBe(updateBuilder); // New instance
    expect((updateBuilder as any)._updateData).toEqual({}); // Original unchanged
    expect((newBuilder as any)._updateData).toEqual({ name: newValue });
  });

  // Test FieldValue helpers
  it('should add an increment update immutably', () => {
    const newBuilder = (updateBuilder as any)._increment('count', 5);
    expect(newBuilder).not.toBe(updateBuilder);
    expect((updateBuilder as any)._updateData).toEqual({});
    expect((newBuilder as any)._updateData).toEqual({ count: MOCK_INCREMENT });
    expect(increment).toHaveBeenCalledWith(5);
  });

  it('should add an arrayUnion update immutably', () => {
    const valuesToAdd = ['tag3', 'tag4'];
    const newBuilder = (updateBuilder as any)._arrayUnion('tags', valuesToAdd);
    expect(newBuilder).not.toBe(updateBuilder);
    expect((updateBuilder as any)._updateData).toEqual({});
    expect((newBuilder as any)._updateData).toEqual({ tags: MOCK_ARRAY_UNION });
    expect(arrayUnion).toHaveBeenCalledWith(...valuesToAdd);
  });

  it('should add an arrayRemove update immutably', () => {
    const valuesToRemove = ['tag1'];
    const newBuilder = (updateBuilder as any)._arrayRemove('tags', valuesToRemove);
    expect(newBuilder).not.toBe(updateBuilder);
    expect((updateBuilder as any)._updateData).toEqual({});
    expect((newBuilder as any)._updateData).toEqual({ tags: MOCK_ARRAY_REMOVE });
    expect(arrayRemove).toHaveBeenCalledWith(...valuesToRemove);
  });

  it('should add a serverTimestamp update immutably', () => {
    const newBuilder = (updateBuilder as any)._serverTimestamp('updatedAt');
    expect(newBuilder).not.toBe(updateBuilder);
    expect((updateBuilder as any)._updateData).toEqual({});
    expect((newBuilder as any)._updateData).toEqual({ updatedAt: MOCK_SERVER_TIMESTAMP });
    expect(serverTimestamp).toHaveBeenCalled();
  });

  it('should add a deleteField update immutably', () => {
    const newBuilder = (updateBuilder as any)._deleteField('status');
    expect(newBuilder).not.toBe(updateBuilder);
    expect((updateBuilder as any)._updateData).toEqual({});
    expect((newBuilder as any)._updateData).toEqual({ status: MOCK_DELETE_FIELD });
    expect(deleteField).toHaveBeenCalled();
  });

  // Test chaining
  it('should chain multiple updates immutably', () => {
    const finalBuilder = (updateBuilder as any)
      ._set('name', 'chained name')
      ._increment('count', 1)
      ._serverTimestamp('updatedAt');

    expect(finalBuilder).not.toBe(updateBuilder);
    expect((updateBuilder as any)._updateData).toEqual({});
    expect((finalBuilder as any)._updateData).toEqual({
      name: 'chained name',
      count: MOCK_INCREMENT,
      updatedAt: MOCK_SERVER_TIMESTAMP,
    });
    expect(increment).toHaveBeenCalledWith(1);
    expect(serverTimestamp).toHaveBeenCalled();
  });

  // Test commit
  it('should call updateDoc with the accumulated data on commit', async () => {
    const finalBuilder = (updateBuilder as any)
      ._set('status', 'active')
      ._increment('count', 2);

    const expectedUpdateData = {
      status: 'active',
      count: MOCK_INCREMENT,
    };
    (updateDoc as jest.Mock).mockResolvedValue(undefined); // Mock successful update

    await finalBuilder.commit();

    expect(updateDoc).toHaveBeenCalledTimes(1);
    expect(updateDoc).toHaveBeenCalledWith(mockDocRef, expectedUpdateData);
  });

  it('should not call updateDoc if no updates were specified', async () => {
    // Use the initial builder with no updates
    await updateBuilder.commit();
    expect(updateDoc).not.toHaveBeenCalled();
  });

  it('should resolve promise even if updateDoc is not called (no updates)', async () => {
    await expect(updateBuilder.commit()).resolves.toBeUndefined();
    expect(updateDoc).not.toHaveBeenCalled();
  });
});