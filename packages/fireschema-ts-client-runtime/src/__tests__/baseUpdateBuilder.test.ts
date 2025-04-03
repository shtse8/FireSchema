import { ClientBaseUpdateBuilder } from '../baseUpdateBuilder';
import type {
  Firestore,
  DocumentReference,
  DocumentData,
  Timestamp,
  FieldValue, // Import FieldValue type
  UpdateData, // Import UpdateData type
} from 'firebase/firestore';

// Import client functions that are mocked
import {
  updateDoc,
  serverTimestamp,
  deleteField,
  increment,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';

// --- Mocks ---

// Mock FieldValue sentinel objects for comparison
const MOCK_SERVER_TIMESTAMP = { type: 'serverTimestamp' } as any;
const MOCK_DELETE_SENTINEL = { type: 'delete' } as any;
const MOCK_INCREMENT_SENTINEL = { type: 'increment', value: 1 } as any;
const MOCK_ARRAY_UNION_SENTINEL = { type: 'arrayUnion', elements: [1] } as any;
const MOCK_ARRAY_REMOVE_SENTINEL = { type: 'arrayRemove', elements: [2] } as any;

// Mock the Firestore Client SDK module functions
jest.mock('firebase/firestore', () => ({
  // Keep original exports if needed, or mock specific ones
  ...(jest.requireActual('firebase/firestore')), // Keep actual implementations for types etc.
  updateDoc: jest.fn(),
  serverTimestamp: jest.fn(() => MOCK_SERVER_TIMESTAMP),
  deleteField: jest.fn(() => MOCK_DELETE_SENTINEL),
  increment: jest.fn((val: number) => ({ ...MOCK_INCREMENT_SENTINEL, value: val })),
  arrayUnion: jest.fn((...elements: any[]) => ({ ...MOCK_ARRAY_UNION_SENTINEL, elements })),
  arrayRemove: jest.fn((...elements: any[]) => ({ ...MOCK_ARRAY_REMOVE_SENTINEL, elements })),
}));

// Mock DocumentReference
const mockDocRef: jest.Mocked<DocumentReference> = {
  // Add properties/methods if needed by the builder itself
} as any;

// Mock types for testing
interface TestData extends DocumentData {
  name?: string;
  count?: number | FieldValue; // Allow FieldValue for increment
  tags?: string[] | FieldValue; // Allow FieldValue for array ops
  nested?: { value?: string | FieldValue }; // Allow FieldValue for delete
  lastUpdated?: FieldValue; // Allow FieldValue for serverTimestamp
}

// --- Test Suite ---

describe('ClientBaseUpdateBuilder', () => {
  let updateBuilder: ClientBaseUpdateBuilder<TestData>;

  beforeEach(() => {
    jest.clearAllMocks();
    // Instantiate the builder with the mock DocumentReference
    updateBuilder = new ClientBaseUpdateBuilder<TestData>(mockDocRef);
  });

  it('should initialize with the provided DocumentReference', () => {
    expect((updateBuilder as any)._docRef).toBe(mockDocRef);
    expect((updateBuilder as any)._updateData).toEqual({});
  });

  // --- Test Field Updates (using protected _set) ---
  describe('_set()', () => {
    it('should add a direct field update to updateData', () => {
      const result = (updateBuilder as any)._set('name', 'New Name');
      expect((result as any)._updateData).toEqual({ name: 'New Name' });
      expect(result).not.toBe(updateBuilder); // Should return new instance
      expect(result).toBeInstanceOf(ClientBaseUpdateBuilder);
    });

    it('should handle nested field updates using dot notation', () => {
      const result = (updateBuilder as any)._set('nested.value', 'Nested Update');
      expect((result as any)._updateData).toEqual({ 'nested.value': 'Nested Update' });
    });

    it('should overwrite previous updates for the same field', () => {
      const result = (updateBuilder as any)._set('name', 'First Name')._set('name', 'Second Name');
      expect((result as any)._updateData).toEqual({ name: 'Second Name' });
    });
  });

  // --- Test FieldValue Updates (using protected helpers) ---
  describe('_serverTimestamp()', () => {
    it('should add a serverTimestamp FieldValue update', () => {
      const result = (updateBuilder as any)._serverTimestamp('lastUpdated');
      expect(serverTimestamp).toHaveBeenCalledTimes(1);
      expect((result as any)._updateData).toEqual({ lastUpdated: MOCK_SERVER_TIMESTAMP });
      expect(result).not.toBe(updateBuilder);
    });
  });

  describe('_deleteField()', () => {
    it('should add a delete FieldValue update', () => {
      const result = (updateBuilder as any)._deleteField('count');
      expect(deleteField).toHaveBeenCalledTimes(1);
      expect((result as any)._updateData).toEqual({ count: MOCK_DELETE_SENTINEL });
      expect(result).not.toBe(updateBuilder);
    });
  });

  describe('_increment()', () => {
    it('should add an increment FieldValue update', () => {
      const result = (updateBuilder as any)._increment('count', 5);
      expect(increment).toHaveBeenCalledWith(5);
      expect((result as any)._updateData).toEqual({ count: { ...MOCK_INCREMENT_SENTINEL, value: 5 } });
      expect(result).not.toBe(updateBuilder);
    });
  });

  describe('_arrayUnion()', () => {
    it('should add an arrayUnion FieldValue update', () => {
      const result = (updateBuilder as any)._arrayUnion('tags', ['urgent', 'new']);
      expect(arrayUnion).toHaveBeenCalledWith('urgent', 'new');
      expect((result as any)._updateData).toEqual({ tags: { ...MOCK_ARRAY_UNION_SENTINEL, elements: ['urgent', 'new'] } });
      expect(result).not.toBe(updateBuilder);
    });
  });

  describe('_arrayRemove()', () => {
    it('should add an arrayRemove FieldValue update', () => {
      const result = (updateBuilder as any)._arrayRemove('tags', ['old']);
      expect(arrayRemove).toHaveBeenCalledWith('old');
      expect((result as any)._updateData).toEqual({ tags: { ...MOCK_ARRAY_REMOVE_SENTINEL, elements: ['old'] } });
      expect(result).not.toBe(updateBuilder);
    });
  });

  // --- Test Execution ---
  describe('commit()', () => {
    it('should call updateDoc() with the docRef and accumulated updateData', async () => {
      const updates: UpdateData<TestData> = {
        name: 'Final Name',
        count: MOCK_INCREMENT_SENTINEL, // Use the mock sentinel directly
        lastUpdated: MOCK_SERVER_TIMESTAMP,
      };
      // Build up state using the protected methods
      const finalBuilder = (updateBuilder as any)
        ._set('name', 'Final Name')
        ._increment('count', 1) // Assuming increment(1) returns MOCK_INCREMENT_SENTINEL
        ._serverTimestamp('lastUpdated');

      await finalBuilder.commit();

      // Check updateDoc call
      expect(updateDoc).toHaveBeenCalledWith(mockDocRef, (finalBuilder as any)._updateData);
      // Check the data passed matches the expected structure (adjust based on actual mock return values)
      expect((finalBuilder as any)._updateData).toEqual({
          name: 'Final Name',
          count: { ...MOCK_INCREMENT_SENTINEL, value: 1 }, // Check value if mock returns specific object
          lastUpdated: MOCK_SERVER_TIMESTAMP
      });
    });

    it('should NOT call updateDoc() if no updates were made', async () => {
      // No updates added to builder
      await updateBuilder.commit();

      expect(updateDoc).not.toHaveBeenCalled();
    });
  });

  // --- Test Chaining ---
  it('should allow chaining of update methods and return new instances', () => {
    const builder1 = (updateBuilder as any)._set('name', 'Chained Name');
    const builder2 = (builder1 as any)._increment('count', 1);
    const builder3 = (builder2 as any)._serverTimestamp('lastUpdated');
    const finalBuilder = (builder3 as any)._arrayUnion('tags', ['chain']);

    // Check immutability
    expect(finalBuilder).not.toBe(updateBuilder);
    expect(finalBuilder).not.toBe(builder1);
    expect(finalBuilder).not.toBe(builder2);
    expect(finalBuilder).not.toBe(builder3);

    // Check final state
    expect((finalBuilder as any)._updateData).toEqual({
      name: 'Chained Name',
      count: { ...MOCK_INCREMENT_SENTINEL, value: 1 },
      lastUpdated: MOCK_SERVER_TIMESTAMP,
      tags: { ...MOCK_ARRAY_UNION_SENTINEL, elements: ['chain'] },
    });
    // Check original builder is unchanged
    expect((updateBuilder as any)._updateData).toEqual({});
  });

});