import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { BaseUpdateBuilder } from '../baseUpdateBuilder'; // Adjust path as needed
import {
  Firestore,
  DocumentReference,
  DocumentData,
  doc,
  updateDoc,
  serverTimestamp,
  deleteField,
  arrayUnion,
  arrayRemove,
  increment,
  // Add other necessary Firestore types/functions
} from 'firebase/firestore';

// Mock the 'firebase/firestore' module for update functions
const mockDoc = jest.fn<(...args: any[]) => DocumentReference<TestData>>();
const mockUpdateDoc = jest.fn<(...args: any[]) => Promise<void>>();
const mockServerTimestamp = jest.fn(() => 'mockServerTimestampValue');
const mockDeleteField = jest.fn(() => 'mockDeleteFieldValue');
const mockArrayUnion = jest.fn((...args: any[]) => ({ type: 'arrayUnion', args }));
const mockArrayRemove = jest.fn((...args: any[]) => ({ type: 'arrayRemove', args }));
const mockIncrement = jest.fn((value: number) => ({ type: 'increment', value }));

jest.mock('firebase/firestore', () => ({
  collection: jest.fn().mockReturnValue({ id: 'mockCollId', path: 'coll' }),
  doc: (...args: any[]) => mockDoc(...args),
  updateDoc: (...args: any[]) => mockUpdateDoc(...args),
  serverTimestamp: () => mockServerTimestamp(),
  deleteField: () => mockDeleteField(),
  arrayUnion: (...args: any[]) => mockArrayUnion(...args),
  arrayRemove: (...args: any[]) => mockArrayRemove(...args),
  increment: (value: number) => mockIncrement(value),
}));

// Define dummy types for testing
interface TestData extends DocumentData {
  id?: string;
  name?: string;
  value?: number;
  status?: string | any; // Allow FieldValue
  tags?: any; // Allow FieldValue
  count?: any; // Allow FieldValue
  nested?: {
    prop?: string | any; // Allow FieldValue
  };
}

// Concrete implementation for testing
class TestUpdateBuilder extends BaseUpdateBuilder<TestData> {
  constructor(docRef: DocumentReference<TestData>) {
    super(docRef);
  }
}

describe('BaseUpdateBuilder', () => {
  let mockDocumentRef: DocumentReference<TestData>;
  let testUpdateBuilder: TestUpdateBuilder;

  beforeEach(() => {
    jest.clearAllMocks();

    mockDocumentRef = { id: 'testDoc123', path: 'testItems/testDoc123' } as DocumentReference<TestData>;
    mockDoc.mockReturnValue(mockDocumentRef); // Ensure doc() mock returns this if used

    testUpdateBuilder = new TestUpdateBuilder(mockDocumentRef);
  });

  it('should initialize with the correct document reference', () => {
    expect(testUpdateBuilder).toBeInstanceOf(BaseUpdateBuilder);
    expect((testUpdateBuilder as any)._docRef).toBe(mockDocumentRef);
    expect((testUpdateBuilder as any)._updateData).toEqual({});
  });

  // --- Update Accumulation Tests ---

  it('should add a field update using _set', () => {
    const result = (testUpdateBuilder as any)._set('name', 'New Name');
    expect(result).toBe(testUpdateBuilder);
    expect((testUpdateBuilder as any)._updateData).toEqual({ name: 'New Name' });
  });

  it('should add multiple field updates using _set', () => {
    (testUpdateBuilder as any)._set('name', 'Another Name');
    (testUpdateBuilder as any)._set('value', 123);
    (testUpdateBuilder as any)._set('nested.prop', 'Nested Value');
    expect((testUpdateBuilder as any)._updateData).toEqual({
      name: 'Another Name',
      value: 123,
      'nested.prop': 'Nested Value',
    });
  });

  it('should overwrite previous updates for the same field using _set', () => {
    (testUpdateBuilder as any)._set('status', 'pending');
    (testUpdateBuilder as any)._set('status', 'completed');
    expect((testUpdateBuilder as any)._updateData).toEqual({ status: 'completed' });
  });

  // --- Convenience Helper Tests ---

  it('should add serverTimestamp using _serverTimestamp', () => {
    (testUpdateBuilder as any)._serverTimestamp('status');
    expect(mockServerTimestamp).toHaveBeenCalledTimes(1);
    expect((testUpdateBuilder as any)._updateData).toEqual({ status: 'mockServerTimestampValue' });
  });

  it('should add deleteField using _deleteField', () => {
    (testUpdateBuilder as any)._deleteField('value');
    expect(mockDeleteField).toHaveBeenCalledTimes(1);
    expect((testUpdateBuilder as any)._updateData).toEqual({ value: 'mockDeleteFieldValue' });
  });

  it('should add arrayUnion using _arrayUnion', () => {
    const tagsToAdd = ['new', 'urgent'];
    (testUpdateBuilder as any)._arrayUnion('tags', tagsToAdd);
    expect(mockArrayUnion).toHaveBeenCalledTimes(1);
    expect(mockArrayUnion).toHaveBeenCalledWith(...tagsToAdd);
    expect((testUpdateBuilder as any)._updateData).toEqual({ tags: { type: 'arrayUnion', args: tagsToAdd } });
  });

  it('should add arrayRemove using _arrayRemove', () => {
    const tagsToRemove = ['old'];
    (testUpdateBuilder as any)._arrayRemove('tags', tagsToRemove);
    expect(mockArrayRemove).toHaveBeenCalledTimes(1);
    expect(mockArrayRemove).toHaveBeenCalledWith(...tagsToRemove);
    expect((testUpdateBuilder as any)._updateData).toEqual({ tags: { type: 'arrayRemove', args: tagsToRemove } });
  });

  it('should add increment using _increment', () => {
    (testUpdateBuilder as any)._increment('count', 5);
    expect(mockIncrement).toHaveBeenCalledTimes(1);
    expect(mockIncrement).toHaveBeenCalledWith(5);
    expect((testUpdateBuilder as any)._updateData).toEqual({ count: { type: 'increment', value: 5 } });
  });

  // --- Commit Tests ---

  it('should call updateDoc with accumulated data on commit', async () => {
    mockUpdateDoc.mockResolvedValue(undefined);
    (testUpdateBuilder as any)._set('name', 'Final Name');
    (testUpdateBuilder as any)._increment('count', 1);
    const expectedUpdateData = { name: 'Final Name', count: { type: 'increment', value: 1 } };
    await testUpdateBuilder.commit();
    expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
    expect(mockUpdateDoc).toHaveBeenCalledWith(mockDocumentRef, expectedUpdateData);
  });

  it('should not call updateDoc if no updates are staged', async () => {
    mockUpdateDoc.mockResolvedValue(undefined);
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {}); // Fix mockImplementation call
    await testUpdateBuilder.commit();
    expect(mockUpdateDoc).not.toHaveBeenCalled();
    expect(consoleWarnSpy).toHaveBeenCalledWith('Update commit called with no changes specified.');
    consoleWarnSpy.mockRestore();
  });
});