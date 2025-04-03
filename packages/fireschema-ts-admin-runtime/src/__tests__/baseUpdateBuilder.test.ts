import { AdminBaseUpdateBuilder } from '../baseUpdateBuilder';
import { FieldValue as AdminFieldValue } from 'firebase-admin/firestore';
import type {
  DocumentReference,
  DocumentData,
  WriteResult,
  Timestamp, // Import Timestamp for mockWriteResult
} from 'firebase-admin/firestore';

// Mock FieldValue sentinel objects for comparison
const MOCK_INCREMENT = { type: 'increment', isEqual: jest.fn() } as any;
const MOCK_SERVER_TIMESTAMP = { type: 'serverTimestamp', isEqual: jest.fn() } as any;
const MOCK_ARRAY_UNION = { type: 'arrayUnion', isEqual: jest.fn() } as any;
const MOCK_ARRAY_REMOVE = { type: 'arrayRemove', isEqual: jest.fn() } as any;
const MOCK_DELETE_FIELD = { type: 'deleteField', isEqual: jest.fn() } as any;

// Mock the Firestore Admin SDK module and FieldValue static methods
jest.mock('firebase-admin/firestore', () => {
  const mockFieldValue = {
    serverTimestamp: jest.fn(() => MOCK_SERVER_TIMESTAMP),
    increment: jest.fn(() => MOCK_INCREMENT),
    arrayUnion: jest.fn(() => MOCK_ARRAY_UNION),
    arrayRemove: jest.fn(() => MOCK_ARRAY_REMOVE),
    delete: jest.fn(() => MOCK_DELETE_FIELD), // Mock the delete static method
  };
  return {
    FieldValue: mockFieldValue,
    Timestamp: { now: jest.fn(() => ({ seconds: 123, nanoseconds: 456 } as Timestamp)) }, // Mock Timestamp
  };
});


// Mock types for testing
interface TestData extends DocumentData {
  name: string;
  count: number;
  tags: string[];
  updatedAt?: any; // Use 'any' for FieldValue
  status?: string;
}

describe('AdminBaseUpdateBuilder', () => {
  let mockDocRef: any; // Use 'any' for simplified mock
  let updateBuilder: AdminBaseUpdateBuilder<TestData>;
  const mockWriteResult = { writeTime: { seconds: 1, nanoseconds: 1 } as Timestamp } as WriteResult; // Basic mock

  beforeEach(() => {
    jest.clearAllMocks();

    // Simplified mock for DocumentReference, only including 'update'
    mockDocRef = {
      id: 'test-doc-id',
      path: 'test-collection/test-doc-id',
      update: jest.fn().mockResolvedValue(mockWriteResult),
    };

    updateBuilder = new AdminBaseUpdateBuilder<TestData>(mockDocRef);

    // Reset AdminFieldValue mocks
    (AdminFieldValue.serverTimestamp as jest.Mock).mockClear();
    (AdminFieldValue.increment as jest.Mock).mockClear();
    (AdminFieldValue.arrayUnion as jest.Mock).mockClear();
    (AdminFieldValue.arrayRemove as jest.Mock).mockClear();
    (AdminFieldValue.delete as jest.Mock).mockClear();
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
    expect(AdminFieldValue.increment).toHaveBeenCalledWith(5);
  });

  it('should add an arrayUnion update immutably', () => {
    const valuesToAdd = ['tag3', 'tag4'];
    const newBuilder = (updateBuilder as any)._arrayUnion('tags', valuesToAdd);
    expect(newBuilder).not.toBe(updateBuilder);
    expect((updateBuilder as any)._updateData).toEqual({});
    expect((newBuilder as any)._updateData).toEqual({ tags: MOCK_ARRAY_UNION });
    expect(AdminFieldValue.arrayUnion).toHaveBeenCalledWith(...valuesToAdd);
  });

  it('should add an arrayRemove update immutably', () => {
    const valuesToRemove = ['tag1'];
    const newBuilder = (updateBuilder as any)._arrayRemove('tags', valuesToRemove);
    expect(newBuilder).not.toBe(updateBuilder);
    expect((updateBuilder as any)._updateData).toEqual({});
    expect((newBuilder as any)._updateData).toEqual({ tags: MOCK_ARRAY_REMOVE });
    expect(AdminFieldValue.arrayRemove).toHaveBeenCalledWith(...valuesToRemove);
  });

  it('should add a serverTimestamp update immutably', () => {
    const newBuilder = (updateBuilder as any)._serverTimestamp('updatedAt');
    expect(newBuilder).not.toBe(updateBuilder);
    expect((updateBuilder as any)._updateData).toEqual({});
    expect((newBuilder as any)._updateData).toEqual({ updatedAt: MOCK_SERVER_TIMESTAMP });
    expect(AdminFieldValue.serverTimestamp).toHaveBeenCalled();
  });

  it('should add a deleteField update immutably', () => {
    const newBuilder = (updateBuilder as any)._deleteField('status');
    expect(newBuilder).not.toBe(updateBuilder);
    expect((updateBuilder as any)._updateData).toEqual({});
    expect((newBuilder as any)._updateData).toEqual({ status: MOCK_DELETE_FIELD });
    expect(AdminFieldValue.delete).toHaveBeenCalled();
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
    expect(AdminFieldValue.increment).toHaveBeenCalledWith(1);
    expect(AdminFieldValue.serverTimestamp).toHaveBeenCalled();
  });

  // Test commit
  it('should call docRef.update with the accumulated data on commit', async () => {
    const finalBuilder = (updateBuilder as any)
      ._set('status', 'active')
      ._increment('count', 2);

    const expectedUpdateData = {
      status: 'active',
      count: MOCK_INCREMENT,
    };

    const result = await finalBuilder.commit();

    expect(mockDocRef.update).toHaveBeenCalledTimes(1);
    expect(mockDocRef.update).toHaveBeenCalledWith(expectedUpdateData);
    expect(result).toBe(mockWriteResult);
  });

  it('should not call docRef.update if no updates were specified', async () => {
    // Use the initial builder with no updates
    await updateBuilder.commit();
    expect(mockDocRef.update).not.toHaveBeenCalled();
  });

  it('should return a placeholder WriteResult if commit is called with no updates', async () => {
    const result = await updateBuilder.commit();
    // Check if it's an empty object or matches the placeholder structure
    expect(result).toEqual({}); // Matches the placeholder {} as WriteResult
    expect(mockDocRef.update).not.toHaveBeenCalled();
  });
});