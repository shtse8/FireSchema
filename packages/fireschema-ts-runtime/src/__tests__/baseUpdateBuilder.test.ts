import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { BaseUpdateBuilder } from '../baseUpdateBuilder';
import type { DocumentReferenceLike, FieldValueLike, DocumentDataLike, SetOptionsLike } from '../baseCollection'; // Import generic types

// --- Mock Client SDK ('firebase/firestore') ---
const mockClientUpdateDoc = jest.fn<(...args: any[]) => Promise<void>>();
const mockClientServerTimestamp = jest.fn(() => 'mockClientServerTimestampValue');
const mockClientDeleteField = jest.fn(() => 'mockClientDeleteFieldValue');
const mockClientArrayUnion = jest.fn((...args: any[]) => ({ type: 'clientArrayUnion', args }));
const mockClientArrayRemove = jest.fn((...args: any[]) => ({ type: 'clientArrayRemove', args }));
const mockClientIncrement = jest.fn((value: number) => ({ type: 'clientIncrement', value }));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  collection: jest.fn(),
  updateDoc: (...args: any[]) => mockClientUpdateDoc(...args),
  serverTimestamp: () => mockClientServerTimestamp(),
  deleteField: () => mockClientDeleteField(),
  arrayUnion: (...args: any[]) => mockClientArrayUnion(...args),
  arrayRemove: (...args: any[]) => mockClientArrayRemove(...args),
  increment: (value: number) => mockClientIncrement(value),
  Timestamp: { now: jest.fn() }, // Add placeholders for types if needed
  GeoPoint: jest.fn(),
}));

// --- Mock Admin SDK ('firebase-admin/firestore') ---
const mockAdminFieldValueServerTimestamp = jest.fn(() => 'mockAdminServerTimestampValue');
const mockAdminFieldValueDelete = jest.fn(() => 'mockAdminDeleteFieldValue');
const mockAdminFieldValueIncrement = jest.fn((value: number) => ({ type: 'adminIncrement', value }));
const mockAdminFieldValueArrayUnion = jest.fn((...args: any[]) => ({ type: 'adminArrayUnion', args }));
const mockAdminFieldValueArrayRemove = jest.fn((...args: any[]) => ({ type: 'adminArrayRemove', args }));
const mockAdminDocRefUpdate = jest.fn<(...args: any[]) => Promise<any>>(); // Mock for adminRef.update()

jest.mock('firebase-admin/firestore', () => ({
  FieldValue: {
    serverTimestamp: () => mockAdminFieldValueServerTimestamp(),
    delete: () => mockAdminFieldValueDelete(),
    increment: (value: number) => mockAdminFieldValueIncrement(value),
    arrayUnion: (...args: any[]) => mockAdminFieldValueArrayUnion(...args),
    arrayRemove: (...args: any[]) => mockAdminFieldValueArrayRemove(...args),
  },
  Timestamp: { now: jest.fn() },
  GeoPoint: jest.fn(),
  FieldPath: jest.fn(),
}));


// --- Test Setup ---

type TestData = DocumentDataLike & {
  id?: string;
  name?: string;
  value?: number;
  status?: string | FieldValueLike;
  tags?: any[] | FieldValueLike;
  count?: number | FieldValueLike;
  nested?: {
    prop?: string | FieldValueLike;
  };
};

class TestUpdateBuilder extends BaseUpdateBuilder<TestData> {}

describe('BaseUpdateBuilder', () => {
  let mockClientDocRef: DocumentReferenceLike<TestData>;
  let mockAdminDocRef: DocumentReferenceLike<TestData>;
  let clientBuilder: TestUpdateBuilder;
  let adminBuilder: TestUpdateBuilder;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock refs satisfying type guards
    mockClientDocRef = { id: 'clientDoc123', path: 'test/clientDoc123', converter: null } as unknown as DocumentReferenceLike<TestData>;
    mockAdminDocRef = { id: 'adminDoc456', path: 'test/adminDoc456', listCollections: jest.fn(), update: mockAdminDocRefUpdate } as unknown as DocumentReferenceLike<TestData>;

    clientBuilder = new TestUpdateBuilder(mockClientDocRef);
    adminBuilder = new TestUpdateBuilder(mockAdminDocRef);
  });

  it('should initialize correctly for both client and admin refs', () => {
    expect((clientBuilder as any).isClient).toBe(true);
    expect((adminBuilder as any).isClient).toBe(false);
  });

  it('should add field updates using _set', () => {
    (clientBuilder as any)._set('name', 'Client Name');
    expect((clientBuilder as any)._updateData).toEqual({ name: 'Client Name' });
  });

  // --- Convenience Helper Tests (Check correct mock called) ---

  it('should use correct serverTimestamp via _serverTimestamp', () => {
    (clientBuilder as any)._serverTimestamp('status');
    expect(mockClientServerTimestamp).toHaveBeenCalledTimes(1);
    expect(mockAdminFieldValueServerTimestamp).not.toHaveBeenCalled();
    expect((clientBuilder as any)._updateData['status']).toBe('mockClientServerTimestampValue');

    (adminBuilder as any)._serverTimestamp('status');
    expect(mockClientServerTimestamp).toHaveBeenCalledTimes(1); // No change
    expect(mockAdminFieldValueServerTimestamp).toHaveBeenCalledTimes(1);
    expect((adminBuilder as any)._updateData['status']).toBe('mockAdminServerTimestampValue');
  });

  it('should use correct deleteField via _deleteField', () => {
    (clientBuilder as any)._deleteField('value');
    expect(mockClientDeleteField).toHaveBeenCalledTimes(1);
    expect(mockAdminFieldValueDelete).not.toHaveBeenCalled();
    expect((clientBuilder as any)._updateData['value']).toBe('mockClientDeleteFieldValue');

    (adminBuilder as any)._deleteField('value');
    expect(mockClientDeleteField).toHaveBeenCalledTimes(1);
    expect(mockAdminFieldValueDelete).toHaveBeenCalledTimes(1);
    expect((adminBuilder as any)._updateData['value']).toBe('mockAdminDeleteFieldValue');
  });

   it('should use correct arrayUnion via _arrayUnion', () => {
    const tags = ['a', 'b'];
    (clientBuilder as any)._arrayUnion('tags', tags);
    expect(mockClientArrayUnion).toHaveBeenCalledTimes(1);
    expect(mockClientArrayUnion).toHaveBeenCalledWith(...tags);
    expect(mockAdminFieldValueArrayUnion).not.toHaveBeenCalled();
    expect((clientBuilder as any)._updateData['tags']).toEqual({ type: 'clientArrayUnion', args: tags });

    (adminBuilder as any)._arrayUnion('tags', tags);
    expect(mockClientArrayUnion).toHaveBeenCalledTimes(1);
    expect(mockAdminFieldValueArrayUnion).toHaveBeenCalledTimes(1);
    expect(mockAdminFieldValueArrayUnion).toHaveBeenCalledWith(...tags);
    expect((adminBuilder as any)._updateData['tags']).toEqual({ type: 'adminArrayUnion', args: tags });
  });

   it('should use correct arrayRemove via _arrayRemove', () => {
    const tags = ['c'];
    (clientBuilder as any)._arrayRemove('tags', tags);
    expect(mockClientArrayRemove).toHaveBeenCalledTimes(1);
    expect(mockClientArrayRemove).toHaveBeenCalledWith(...tags);
    expect(mockAdminFieldValueArrayRemove).not.toHaveBeenCalled();
    expect((clientBuilder as any)._updateData['tags']).toEqual({ type: 'clientArrayRemove', args: tags });

    (adminBuilder as any)._arrayRemove('tags', tags);
    expect(mockClientArrayRemove).toHaveBeenCalledTimes(1);
    expect(mockAdminFieldValueArrayRemove).toHaveBeenCalledTimes(1);
    expect(mockAdminFieldValueArrayRemove).toHaveBeenCalledWith(...tags);
    expect((adminBuilder as any)._updateData['tags']).toEqual({ type: 'adminArrayRemove', args: tags });
  });

   it('should use correct increment via _increment', () => {
    (clientBuilder as any)._increment('count', 2);
    expect(mockClientIncrement).toHaveBeenCalledTimes(1);
    expect(mockClientIncrement).toHaveBeenCalledWith(2);
    expect(mockAdminFieldValueIncrement).not.toHaveBeenCalled();
    expect((clientBuilder as any)._updateData['count']).toEqual({ type: 'clientIncrement', value: 2 });

    (adminBuilder as any)._increment('count', 3);
    expect(mockClientIncrement).toHaveBeenCalledTimes(1);
    expect(mockAdminFieldValueIncrement).toHaveBeenCalledTimes(1);
    expect(mockAdminFieldValueIncrement).toHaveBeenCalledWith(3);
    expect((adminBuilder as any)._updateData['count']).toEqual({ type: 'adminIncrement', value: 3 });
  });


  // --- Commit Tests (Check correct function/method called) ---

  it('should call correct update function/method on commit', async () => {
    mockClientUpdateDoc.mockResolvedValue(undefined);
    mockAdminDocRefUpdate.mockResolvedValue({ writeTime: 'mockTime' });

    const clientData = { name: 'Client Final' };
    const adminData = { name: 'Admin Final' };

    (clientBuilder as any)._set('name', 'Client Final');
    await clientBuilder.commit();
    expect(mockClientUpdateDoc).toHaveBeenCalledTimes(1);
    expect(mockClientUpdateDoc).toHaveBeenCalledWith(mockClientDocRef, clientData);
    expect(mockAdminDocRefUpdate).not.toHaveBeenCalled();

    // Reset mocks for admin call verification
    mockClientUpdateDoc.mockClear();
    mockAdminDocRefUpdate.mockClear();

    (adminBuilder as any)._set('name', 'Admin Final');
    await adminBuilder.commit();
    expect(mockClientUpdateDoc).not.toHaveBeenCalled();
    expect(mockAdminDocRefUpdate).toHaveBeenCalledTimes(1);
    expect(mockAdminDocRefUpdate).toHaveBeenCalledWith(adminData);
  });

  it('should not call update function/method if no updates are staged', async () => {
    mockClientUpdateDoc.mockResolvedValue(undefined);
    mockAdminDocRefUpdate.mockResolvedValue({ writeTime: 'mockTime' });
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    await clientBuilder.commit();
    expect(mockClientUpdateDoc).not.toHaveBeenCalled();
    expect(mockAdminDocRefUpdate).not.toHaveBeenCalled();
    expect(consoleWarnSpy).toHaveBeenCalledWith('Update commit called with no changes specified.');

    await adminBuilder.commit();
    expect(mockClientUpdateDoc).not.toHaveBeenCalled();
    expect(mockAdminDocRefUpdate).not.toHaveBeenCalled();
    expect(consoleWarnSpy).toHaveBeenCalledTimes(2);

    consoleWarnSpy.mockRestore();
  });
});