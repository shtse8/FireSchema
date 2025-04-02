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
const mockDoc = jest.fn();
const mockUpdateDoc = jest.fn();
const mockServerTimestamp = jest.fn(() => 'mockServerTimestampValue');
const mockDeleteField = jest.fn(() => 'mockDeleteFieldValue');
const mockArrayUnion = jest.fn((...args) => ({ type: 'arrayUnion', args }));
const mockArrayRemove = jest.fn((...args) => ({ type: 'arrayRemove', args }));
const mockIncrement = jest.fn((value) => ({ type: 'increment', value }));

jest.mock('firebase/firestore', () => ({
  // Keep mocks from other tests if needed, or re-declare
  collection: jest.fn().mockReturnValue({ id: 'mockCollId', path: 'coll' }), // Basic mock

  // Update Mocks
  doc: (...args: any[]) => mockDoc(...args),
  updateDoc: (...args: any[]) => mockUpdateDoc(...args),
  serverTimestamp: () => mockServerTimestamp(),
  deleteField: () => mockDeleteField(),
  arrayUnion: (...args: any[]) => mockArrayUnion(...args),
  arrayRemove: (...args: any[]) => mockArrayRemove(...args),
  increment: (value: number) => mockIncrement(value),

  // Add other necessary exports
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

// Concrete implementation for testing (assuming BaseUpdateBuilder might be abstract)
class TestUpdateBuilder extends BaseUpdateBuilder<TestData> {
  constructor(docRef: DocumentReference<TestData>) {
    super(docRef); // Pass only docRef
  }
  // Implement abstract methods if any
}

describe('BaseUpdateBuilder', () => {
  // let mockFirestore: Firestore; // Firestore instance not needed by BaseUpdateBuilder constructor
  let mockDocumentRef: DocumentReference<TestData>;
  let testUpdateBuilder: TestUpdateBuilder;

  beforeEach(() => {
    jest.clearAllMocks();

    // mockFirestore = {} as Firestore; // Not needed
    // Use the mockDoc defined in the jest.mock setup
    mockDocumentRef = { id: 'testDoc123', path: 'testItems/testDoc123' } as DocumentReference<TestData>;
    mockDoc.mockReturnValue(mockDocumentRef); // Ensure doc() returns our mock ref

    // Pass the *mock* docRef to the constructor
    testUpdateBuilder = new TestUpdateBuilder(mockDocumentRef);
  });

  it('should initialize with the correct firestore and document reference', () => {
    expect(testUpdateBuilder).toBeInstanceOf(BaseUpdateBuilder);
    // expect((testUpdateBuilder as any).firestore).toBe(mockFirestore); // Property doesn't exist on base class
    expect((testUpdateBuilder as any)._docRef).toBe(mockDocumentRef); // Check the internal property name _docRef
    expect((testUpdateBuilder as any)._updateData).toEqual({}); // Update data should be empty initially
  }); // <-- Add missing closing brace and parenthesis

  // --- Update Accumulation Tests ---

  it('should add a field update using _set', () => {
    const result = (testUpdateBuilder as any)._set('name', 'New Name');
    expect(result).toBe(testUpdateBuilder); // Returns self
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
    (testUpdateBuilder as any)._set('status', 'completed'); // Overwrite

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
    expect(mockArrayUnion).toHaveBeenCalledWith(...tagsToAdd); // Check args passed to arrayUnion
    expect((testUpdateBuilder as any)._updateData).toEqual({ tags: { type: 'arrayUnion', args: tagsToAdd } });
  });

  it('should add arrayRemove using _arrayRemove', () => {
    const tagsToRemove = ['old'];
    (testUpdateBuilder as any)._arrayRemove('tags', tagsToRemove);
    expect(mockArrayRemove).toHaveBeenCalledTimes(1);
    expect(mockArrayRemove).toHaveBeenCalledWith(...tagsToRemove); // Check args passed to arrayRemove
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
    mockUpdateDoc.mockResolvedValue(undefined); // Mock successful update

    // Stage some updates
    (testUpdateBuilder as any)._set('name', 'Final Name');
    (testUpdateBuilder as any)._increment('count', 1);
    const expectedUpdateData = { name: 'Final Name', count: { type: 'increment', value: 1 } };

    await testUpdateBuilder.commit();

    expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
    // Check that updateDoc was called with the correct docRef and the accumulated data
    expect(mockUpdateDoc).toHaveBeenCalledWith(mockDocumentRef, expectedUpdateData);
  });

  it('should not call updateDoc if no updates are staged', async () => {
    mockUpdateDoc.mockResolvedValue(undefined);
    // Spy on console.warn
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

    await testUpdateBuilder.commit(); // Commit with no staged updates

    expect(mockUpdateDoc).not.toHaveBeenCalled();
    expect(consoleWarnSpy).toHaveBeenCalledWith('Update commit called with no changes specified.');

    consoleWarnSpy.mockRestore(); // Clean up spy
  });

  // Optional: Test if data is cleared after commit (if implemented)
  // it('should clear updateData after successful commit', async () => {
  //   mockUpdateDoc.mockResolvedValue(undefined);
  //   (testUpdateBuilder as any)._set('name', 'Temp Name');
  //   await testUpdateBuilder.commit();
  //   expect((testUpdateBuilder as any)._updateData).toEqual({});
  // });


  // Add tests here for set, serverTimestamp, deleteField, arrayUnion, arrayRemove, increment, commit
  // Example:
  // it('should add a field update using _set', () => {
  //   const result = (testUpdateBuilder as any)._set('name', 'New Name');
  //   expect(result).toBe(testUpdateBuilder); // Returns self
  //   expect((testUpdateBuilder as any).updateData).toEqual({ name: 'New Name' });
  // });

});