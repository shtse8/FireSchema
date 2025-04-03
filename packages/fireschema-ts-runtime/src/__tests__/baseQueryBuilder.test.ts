import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { BaseQueryBuilder } from '../baseQueryBuilder';
import type { QueryConstraintDefinition } from '../baseQueryBuilder';
import type {
    FirestoreLike,
    CollectionReferenceLike,
    DocumentSnapshotLike,
    DocumentDataLike,
    QueryLike,
    QuerySnapshotLike,
    WhereFilterOpLike,
    OrderByDirectionLike
} from '../baseCollection';

// --- Mock Client SDK ('firebase/firestore') ---
const mockClientQuery = jest.fn<(...args: any[]) => QueryLike<TestData>>();
const mockClientWhere = jest.fn<(...args: any[]) => any>((...args) => ({ type: 'clientWhere', args }));
const mockClientOrderBy = jest.fn<(...args: any[]) => any>((...args) => ({ type: 'clientOrderBy', args }));
const mockClientLimit = jest.fn<(...args: any[]) => any>((...args) => ({ type: 'clientLimit', args }));
const mockClientLimitToLast = jest.fn<(...args: any[]) => any>((...args) => ({ type: 'clientLimitToLast', args }));
const mockClientStartAt = jest.fn<(...args: any[]) => any>((...args) => ({ type: 'clientStartAt', args }));
const mockClientStartAfter = jest.fn<(...args: any[]) => any>((...args) => ({ type: 'clientStartAfter', args }));
const mockClientEndAt = jest.fn<(...args: any[]) => any>((...args) => ({ type: 'clientEndAt', args }));
const mockClientEndBefore = jest.fn<(...args: any[]) => any>((...args) => ({ type: 'clientEndBefore', args }));
const mockClientGetDocs = jest.fn<(...args: any[]) => Promise<QuerySnapshotLike<TestData>>>();

jest.mock('firebase/firestore', () => ({
  query: (...args: any[]) => mockClientQuery(...args),
  where: (...args: any[]) => mockClientWhere(...args),
  orderBy: (...args: any[]) => mockClientOrderBy(...args),
  limit: (...args: any[]) => mockClientLimit(...args),
  limitToLast: (...args: any[]) => mockClientLimitToLast(...args),
  startAt: (...args: any[]) => mockClientStartAt(...args),
  startAfter: (...args: any[]) => mockClientStartAfter(...args),
  endAt: (...args: any[]) => mockClientEndAt(...args),
  endBefore: (...args: any[]) => mockClientEndBefore(...args),
  getDocs: (...args: any[]) => mockClientGetDocs(...args),
  Timestamp: { now: jest.fn() }, GeoPoint: jest.fn(),
  DocumentReference: jest.fn(), CollectionReference: jest.fn(),
}));

// --- Mock Admin SDK ('firebase-admin/firestore') ---
const mockAdminQueryGet = jest.fn<() => Promise<QuerySnapshotLike<TestData>>>();
const mockAdminQueryWhere = jest.fn<(...args: any[]) => any>(function(this: any) { return this; });
const mockAdminQueryOrderBy = jest.fn<(...args: any[]) => any>(function(this: any) { return this; });
const mockAdminQueryLimit = jest.fn<(...args: any[]) => any>(function(this: any) { return this; });
const mockAdminQueryLimitToLast = jest.fn<(...args: any[]) => any>(function(this: any) { return this; });
const mockAdminQueryStartAt = jest.fn<(...args: any[]) => any>(function(this: any) { return this; });
const mockAdminQueryStartAfter = jest.fn<(...args: any[]) => any>(function(this: any) { return this; });
const mockAdminQueryEndAt = jest.fn<(...args: any[]) => any>(function(this: any) { return this; });
const mockAdminQueryEndBefore = jest.fn<(...args: any[]) => any>(function(this: any) { return this; });

const mockAdminQueryChaining = {
    where: mockAdminQueryWhere, orderBy: mockAdminQueryOrderBy, limit: mockAdminQueryLimit,
    limitToLast: mockAdminQueryLimitToLast, startAt: mockAdminQueryStartAt, startAfter: mockAdminQueryStartAfter,
    endAt: mockAdminQueryEndAt, endBefore: mockAdminQueryEndBefore, get: mockAdminQueryGet,
};
const mockAdminCollectionRef = {
    id: 'adminColl', path: 'adminColl', ...mockAdminQueryChaining, listDocuments: jest.fn(),
} as unknown as CollectionReferenceLike<TestData>;

jest.mock('firebase-admin/firestore', () => ({
  FieldValue: { serverTimestamp: jest.fn(), delete: jest.fn(), increment: jest.fn(), arrayUnion: jest.fn(), arrayRemove: jest.fn() },
  Timestamp: { now: jest.fn() }, GeoPoint: jest.fn(), FieldPath: jest.fn(),
}));

// --- Test Setup ---
type TestData = DocumentDataLike & { id?: string; name: string; value: number; active: boolean; tags?: string[]; };
class TestQueryBuilder extends BaseQueryBuilder<TestData> {}

describe('BaseQueryBuilder', () => {
  let mockClientFirestore: FirestoreLike;
  let mockAdminFirestore: FirestoreLike;
  let mockClientCollectionRef: CollectionReferenceLike<TestData>;
  let clientBuilder: TestQueryBuilder;
  let adminBuilder: TestQueryBuilder;
  let mockClientSnapshot: DocumentSnapshotLike<TestData>;
  let mockAdminSnapshot: DocumentSnapshotLike<TestData>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockClientFirestore = { type: 'firestore', app: {} } as unknown as FirestoreLike;
    mockAdminFirestore = { settings: jest.fn(), listCollections: jest.fn() } as unknown as FirestoreLike;
    mockClientCollectionRef = { id: 'clientColl', path: 'clientColl', converter: null } as unknown as CollectionReferenceLike<TestData>;
    mockClientSnapshot = { id: 'clientSnap', exists: () => true, data: () => ({}) } as DocumentSnapshotLike<TestData>;
    mockAdminSnapshot = { id: 'adminSnap', exists: true, data: () => ({}) } as DocumentSnapshotLike<TestData>;
    clientBuilder = new TestQueryBuilder(mockClientFirestore, mockClientCollectionRef);
    adminBuilder = new TestQueryBuilder(mockAdminFirestore, mockAdminCollectionRef);
  });

  it('should initialize correctly for both client and admin', () => {
    expect((clientBuilder as any).isClient).toBe(true);
    expect((clientBuilder as any).constraintDefinitions).toEqual([]);
    expect((adminBuilder as any).isClient).toBe(false);
    expect((adminBuilder as any).constraintDefinitions).toEqual([]);
  });

  // --- Constraint Definition Tests ---
  it('should add a where constraint definition via _where', () => {
    const expectedDef: QueryConstraintDefinition = { type: 'where', fieldPath: 'name', opStr: '==', value: 'Test' };
    (clientBuilder as any)._where('name', '==', 'Test');
    expect((clientBuilder as any).constraintDefinitions).toEqual([expectedDef]);
  });

  it('should add an orderBy constraint definition', () => {
    const expectedDef: QueryConstraintDefinition = { type: 'orderBy', fieldPath: 'value', directionStr: 'desc' };
    clientBuilder.orderBy('value', 'desc');
    expect((clientBuilder as any).constraintDefinitions).toEqual([expectedDef]);
  });

   it('should add a limit constraint definition', () => {
    const expectedDef: QueryConstraintDefinition = { type: 'limit', limitCount: 10 };
    clientBuilder.limit(10);
    expect((clientBuilder as any).constraintDefinitions).toEqual([expectedDef]);
  });

   it('should add a limitToLast constraint definition', () => {
    const expectedDef: QueryConstraintDefinition = { type: 'limitToLast', limitCount: 5 };
    clientBuilder.limitToLast(5);
    expect((clientBuilder as any).constraintDefinitions).toEqual([expectedDef]);
  });

  it('should add a startAt constraint definition (value)', () => {
    const expectedDef: QueryConstraintDefinition = { type: 'startAt', snapshotOrFieldValue: 'TestName', fieldValues: [] };
    clientBuilder.startAt('TestName');
    expect((clientBuilder as any).constraintDefinitions).toEqual([expectedDef]);
  });

   it('should add a startAfter constraint definition (snapshot)', () => {
    const expectedDef: QueryConstraintDefinition = { type: 'startAfter', snapshotOrFieldValue: mockClientSnapshot, fieldValues: [] };
    clientBuilder.startAfter(mockClientSnapshot);
    expect((clientBuilder as any).constraintDefinitions).toEqual([expectedDef]);
   });

   it('should add an endBefore constraint definition (value)', () => {
    const expectedDef: QueryConstraintDefinition = { type: 'endBefore', snapshotOrFieldValue: 100, fieldValues: [] };
    clientBuilder.endBefore(100);
    expect((clientBuilder as any).constraintDefinitions).toEqual([expectedDef]);
   });

   it('should add an endAt constraint definition (snapshot)', () => {
    const expectedDef: QueryConstraintDefinition = { type: 'endAt', snapshotOrFieldValue: mockAdminSnapshot, fieldValues: [5] };
    adminBuilder.endAt(mockAdminSnapshot, 5);
    expect((adminBuilder as any).constraintDefinitions).toEqual([expectedDef]);
   });

  // --- Execution Tests ---

  it('should build client query using static helpers', () => {
    const mockFinalClientQuery = { type: 'finalClientQuery' } as unknown as QueryLike<TestData>;
    mockClientQuery.mockReturnValue(mockFinalClientQuery);
    (clientBuilder as any)._where('active', '==', true);
    clientBuilder.orderBy('name');
    const query = clientBuilder.buildQuery();
    expect(query).toBe(mockFinalClientQuery);
    expect(mockClientWhere).toHaveBeenCalledWith('active', '==', true);
    expect(mockClientOrderBy).toHaveBeenCalledWith('name', 'asc');
    expect(mockClientQuery).toHaveBeenCalledTimes(1);
    expect(mockClientQuery).toHaveBeenCalledWith(mockClientCollectionRef, expect.anything(), expect.anything()); // Check constraints were passed
    expect(mockAdminQueryWhere).not.toHaveBeenCalled();
  });

  it('should build admin query using chaining', () => {
    (adminBuilder as any)._where('active', '==', false);
    adminBuilder.limit(10);
    const query = adminBuilder.buildQuery();
    expect(query).toBe(mockAdminCollectionRef); // Returns the mocked ref after chaining
    expect(mockAdminQueryWhere).toHaveBeenCalledTimes(1);
    expect(mockAdminQueryWhere).toHaveBeenCalledWith('active', '==', false);
    expect(mockAdminQueryLimit).toHaveBeenCalledTimes(1);
    expect(mockAdminQueryLimit).toHaveBeenCalledWith(10);
    expect(mockClientQuery).not.toHaveBeenCalled();
  });


  it('should call clientGetDocs on get() for client builder', async () => {
    const mockClientSnapshotResult = { docs: [{ data: () => ({ name: 'A' }) }, { data: () => ({ name: 'B' }) }] } as unknown as QuerySnapshotLike<TestData>;
    mockClientGetDocs.mockResolvedValue(mockClientSnapshotResult);
    mockClientQuery.mockReturnValue({} as QueryLike<TestData>); // Mock return value for buildQuery

    (clientBuilder as any)._where('value', '>', 0); // Add a constraint to trigger buildQuery
    const results = await clientBuilder.get();

    expect(mockClientQuery).toHaveBeenCalledTimes(1);
    expect(mockClientGetDocs).toHaveBeenCalledTimes(1);
    expect(mockClientGetDocs).toHaveBeenCalledWith({}); // Called with result of clientQuery
    expect(mockAdminQueryGet).not.toHaveBeenCalled();
    expect(results).toEqual([{ name: 'A' }, { name: 'B' }]);
  });

  it('should call admin query.get() on get() for admin builder', async () => {
     const mockAdminSnapshotResult = { docs: [{ data: () => ({ name: 'C' }) }] } as unknown as QuerySnapshotLike<TestData>;
     mockAdminQueryGet.mockResolvedValue(mockAdminSnapshotResult);

    (adminBuilder as any)._where('value', '<', 0); // Add a constraint to trigger buildQuery
    const results = await adminBuilder.get();

    expect(mockAdminQueryWhere).toHaveBeenCalledTimes(1); // Called by buildQuery
    expect(mockAdminQueryGet).toHaveBeenCalledTimes(1); // Called by getSnapshotInternal
    expect(mockClientGetDocs).not.toHaveBeenCalled();
    expect(results).toEqual([{ name: 'C' }]);
  });

  it('should call correct getSnapshotInternal method on getSnapshot()', async () => {
     const mockClientSnapshotResult = { docs: [] } as unknown as QuerySnapshotLike<TestData>;
     const mockAdminSnapshotResult = { docs: [] } as unknown as QuerySnapshotLike<TestData>;
     mockClientGetDocs.mockResolvedValue(mockClientSnapshotResult);
     mockAdminQueryGet.mockResolvedValue(mockAdminSnapshotResult);
     mockClientQuery.mockReturnValue({} as QueryLike<TestData>);

     const clientSnap = await clientBuilder.getSnapshot();
     expect(mockClientGetDocs).toHaveBeenCalledTimes(1);
     expect(mockAdminQueryGet).not.toHaveBeenCalled();
     expect(clientSnap).toBe(mockClientSnapshotResult);

     // Reset admin mock call count before testing admin path
     mockAdminQueryGet.mockClear();

     const adminSnap = await adminBuilder.getSnapshot();
     expect(mockClientGetDocs).toHaveBeenCalledTimes(1); // Still called once above
     expect(mockAdminQueryGet).toHaveBeenCalledTimes(1);
     expect(adminSnap).toBe(mockAdminSnapshotResult);
  });

});