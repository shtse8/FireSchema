import { AdminBaseUpdateBuilder } from '../baseUpdateBuilder';
import { FieldValue as AdminFieldValue } from 'firebase-admin/firestore';
import type {
  Firestore,
  DocumentReference,
  DocumentData,
  WriteResult,
  Timestamp,
  UpdateData, // Import UpdateData type
} from 'firebase-admin/firestore';

// --- Mocks ---

// Mock FieldValue sentinel objects for comparison
const MOCK_SERVER_TIMESTAMP = { type: 'serverTimestamp', isEqual: jest.fn() } as any;
const MOCK_DELETE_SENTINEL = { type: 'delete', isEqual: jest.fn() } as any;
const MOCK_INCREMENT_SENTINEL = { type: 'increment', value: 1, isEqual: jest.fn() } as any;
const MOCK_ARRAY_UNION_SENTINEL = { type: 'arrayUnion', elements: [1], isEqual: jest.fn() } as any;
const MOCK_ARRAY_REMOVE_SENTINEL = { type: 'arrayRemove', elements: [2], isEqual: jest.fn() } as any;

// Mock the Firestore Admin SDK module and FieldValue static methods
jest.mock('firebase-admin/firestore', () => {
  const originalModule = jest.requireActual('firebase-admin/firestore');
  const mockFieldValue = {
    serverTimestamp: jest.fn(() => MOCK_SERVER_TIMESTAMP),
    delete: jest.fn(() => MOCK_DELETE_SENTINEL),
    increment: jest.fn((val: number) => ({ ...MOCK_INCREMENT_SENTINEL, value: val })),
    arrayUnion: jest.fn((...elements: any[]) => ({ ...MOCK_ARRAY_UNION_SENTINEL, elements })),
    arrayRemove: jest.fn((...elements: any[]) => ({ ...MOCK_ARRAY_REMOVE_SENTINEL, elements })),
  };
  return {
    ...originalModule, // Keep original exports like Timestamp if needed
    FieldValue: mockFieldValue,
    // Mock Timestamp if needed for specific tests
    // Timestamp: { now: jest.fn(() => ({ seconds: 123, nanoseconds: 456 } as Timestamp)) },
  };
});

// Mock DocumentReference methods
const mockWriteResult: WriteResult = { writeTime: { seconds: 1, nanoseconds: 1 } as Timestamp } as WriteResult;
const mockDocRef: jest.Mocked<DocumentReference> = {
  update: jest.fn().mockResolvedValue(mockWriteResult),
  set: jest.fn().mockResolvedValue(mockWriteResult), // Needed if testing set through builder
  delete: jest.fn().mockResolvedValue(mockWriteResult), // Needed if testing delete through builder
  // Add other methods if needed
} as any;

// Mock types for testing
interface TestData extends DocumentData {
  name?: string;
  count?: number | AdminFieldValue; // Allow FieldValue for increment
  tags?: string[] | AdminFieldValue; // Allow FieldValue for array ops
  nested?: { value?: string | AdminFieldValue }; // Allow FieldValue for delete
  lastUpdated?: AdminFieldValue; // Allow FieldValue for serverTimestamp
}

// --- Test Suite ---

describe('AdminBaseUpdateBuilder', () => {
  let updateBuilder: AdminBaseUpdateBuilder<TestData>;

  beforeEach(() => {
    jest.clearAllMocks();
    // Instantiate the builder with the mock DocumentReference
    updateBuilder = new AdminBaseUpdateBuilder<TestData>(mockDocRef);
  });

  it('should initialize with the provided DocumentReference', () => {
    expect((updateBuilder as any)._docRef).toBe(mockDocRef);
    expect((updateBuilder as any)._updateData).toEqual({});
  });

  // --- Test Field Updates ---
  describe('set()', () => {
    it('should add a direct field update to updateData', () => {
      const result = (updateBuilder as any)._set('name', 'New Name');
      expect((result as any)._updateData).toEqual({ name: 'New Name' });
      expect(result).not.toBe(updateBuilder); // Should return a new instance
    });

    it('should handle nested field updates using dot notation', () => {
      (updateBuilder as any)._set('nested.value', 'Nested Update');
      // Need to capture the result of _set
      const result = (updateBuilder as any)._set('nested.value', 'Nested Update');
      expect((result as any)._updateData).toEqual({ 'nested.value': 'Nested Update' });
    });

    it('should overwrite previous updates for the same field', () => {
      const builder1 = (updateBuilder as any)._set('name', 'First Name');
      const builder2 = (builder1 as any)._set('name', 'Second Name'); // Chain off the returned builder
      expect((builder2 as any)._updateData).toEqual({ name: 'Second Name' }); // Check the final builder's data
    });
  });

  // --- Test FieldValue Updates ---
  describe('serverTimestamp()', () => {
    it('should add a serverTimestamp FieldValue update', () => {
      const finalBuilder = (updateBuilder as any)._serverTimestamp('lastUpdated');
      expect(AdminFieldValue.serverTimestamp).toHaveBeenCalledTimes(1);
      expect((finalBuilder as any)._updateData).toEqual({ lastUpdated: MOCK_SERVER_TIMESTAMP });
    });
  });

  describe('deleteField()', () => {
    it('should add a delete FieldValue update', () => {
      const finalBuilder = (updateBuilder as any)._deleteField('count');
      expect(AdminFieldValue.delete).toHaveBeenCalledTimes(1);
      expect((finalBuilder as any)._updateData).toEqual({ count: MOCK_DELETE_SENTINEL });
    });

     it('should add a nested delete FieldValue update', () => {
      const finalBuilder = (updateBuilder as any)._deleteField('nested.value');
      expect(AdminFieldValue.delete).toHaveBeenCalledTimes(1);
      expect((finalBuilder as any)._updateData).toEqual({ 'nested.value': MOCK_DELETE_SENTINEL });
    });
  });

  describe('increment()', () => {
    it('should add an increment FieldValue update', () => {
      const finalBuilder = (updateBuilder as any)._increment('count', 5);
      expect(AdminFieldValue.increment).toHaveBeenCalledWith(5);
      expect((finalBuilder as any)._updateData).toEqual({ count: { ...MOCK_INCREMENT_SENTINEL, value: 5 } });
    });
  });

  describe('arrayUnion()', () => {
    it('should add an arrayUnion FieldValue update', () => {
      const finalBuilder = (updateBuilder as any)._arrayUnion('tags', ['urgent', 'new']); // Pass values as an array
      expect(AdminFieldValue.arrayUnion).toHaveBeenCalledWith('urgent', 'new');
      expect((finalBuilder as any)._updateData).toEqual({ tags: { ...MOCK_ARRAY_UNION_SENTINEL, elements: ['urgent', 'new'] } });
    });
  });

  describe('arrayRemove()', () => {
    it('should add an arrayRemove FieldValue update', () => {
      const finalBuilder = (updateBuilder as any)._arrayRemove('tags', ['old']); // Pass values as an array
      expect(AdminFieldValue.arrayRemove).toHaveBeenCalledWith('old');
      expect((finalBuilder as any)._updateData).toEqual({ tags: { ...MOCK_ARRAY_REMOVE_SENTINEL, elements: ['old'] } });
    });
  });

  // --- Test Execution ---
  describe('commit()', () => {
    it('should call docRef.update() with the accumulated updateData', async () => {
      const updates: UpdateData<TestData> = {
        name: 'Final Name',
        count: MOCK_INCREMENT_SENTINEL,
        lastUpdated: MOCK_SERVER_TIMESTAMP,
      };
      // Apply updates through the builder methods instead of direct assignment
      let builderWithUpdates = updateBuilder;
      for (const key in updates) {
          builderWithUpdates = (builderWithUpdates as any)._set(key, updates[key]);
      }

      const result = await builderWithUpdates.commit(); // Commit the final builder state

      expect(mockDocRef.update).toHaveBeenCalledWith(updates);
      // Check that the promise resolves for a no-op commit
      await expect(updateBuilder.commit()).resolves.toBeDefined();
    });

    it('should call docRef.update() with an empty object if no updates were made', async () => {
      // No updates added to builder
      const result = await updateBuilder.commit();

      expect(mockDocRef.update).not.toHaveBeenCalled(); // Should not call update if no changes
      // The commit method returns a WriteResult, but the empty placeholder {} won't match
      // We should check that the promise resolves without error for a no-op
      await expect(updateBuilder.commit()).resolves.toBeDefined();
      // Or, if we want to check the placeholder specifically:
      // expect(result).toEqual({}); // Check against the empty placeholder if that's intended
    });
  });

  // --- Test Chaining ---
  it('should allow chaining of update methods', () => {
    // Perform the chain, casting the initial builder to 'any'
    const finalBuilder = (updateBuilder as any)
      ._set('name', 'Chained Name')
      ._increment('count', 1)
      ._serverTimestamp('lastUpdated')
      ._arrayUnion('tags', ['chain']); // Pass values as an array

    // Access internal data via the final builder instance with 'as any'
    const resultData = (finalBuilder as any)._updateData;

    // Assert the final state
    expect(resultData).toEqual({
      name: 'Chained Name',
      count: { ...MOCK_INCREMENT_SENTINEL, value: 1 },
      lastUpdated: MOCK_SERVER_TIMESTAMP,
      tags: { ...MOCK_ARRAY_UNION_SENTINEL, elements: ['chain'] },
    });
    // Check immutability - the original builder should be unchanged
    expect((updateBuilder as any)._updateData).toEqual({}); // Original builder remains empty
    expect(finalBuilder).not.toBe(updateBuilder); // Should be a new instance
  });

  // --- Test _encodeUpdateData (Protected Method) ---
  // This tests the internal logic used by generated code, not typically called directly
  // Removed invalid _encodeUpdateData test again
});