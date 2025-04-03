import { ClientBaseQueryBuilder } from '../baseQueryBuilder';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  limitToLast,
  startAt,
  startAfter,
  endAt,
  endBefore,
  getDocs,
} from 'firebase/firestore';
import type {
  Firestore,
  CollectionReference,
  DocumentData,
  QuerySnapshot,
  DocumentSnapshot,
  QueryDocumentSnapshot,
} from 'firebase/firestore';

// Mock the Firestore SDK functions
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn().mockImplementation((field, op, value) => ({ type: 'where', field, op, value })), // Return mock constraint object
  orderBy: jest.fn().mockImplementation((field, dir) => ({ type: 'orderBy', field, dir })),
  limit: jest.fn().mockImplementation((num) => ({ type: 'limit', num })),
  limitToLast: jest.fn().mockImplementation((num) => ({ type: 'limitToLast', num })),
  startAt: jest.fn().mockImplementation((val) => ({ type: 'startAt', val })),
  startAfter: jest.fn().mockImplementation((val) => ({ type: 'startAfter', val })),
  endAt: jest.fn().mockImplementation((val) => ({ type: 'endAt', val })),
  endBefore: jest.fn().mockImplementation((val) => ({ type: 'endBefore', val })),
  getDocs: jest.fn(),
  doc: jest.fn(), // Mock doc as it might be used indirectly or by related classes
  // Add other necessary mocks if needed
}));

// Mock types for testing
interface TestData extends DocumentData {
  name: string;
  age: number;
  active: boolean;
}

describe('ClientBaseQueryBuilder', () => {
  let mockFirestore: Firestore;
  let mockCollectionRef: CollectionReference<TestData>;
  let queryBuilder: ClientBaseQueryBuilder<TestData>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockFirestore = {} as Firestore; // Simple mock, adjust if methods are called directly
    mockCollectionRef = {
      id: 'test-collection',
      path: 'test/path',
      // Add other properties/methods if needed by the builder
    } as CollectionReference<TestData>;

    // Mock the return value of the top-level 'collection' function if needed elsewhere,
    // but the builder receives the ref directly.
    // (collection as jest.Mock).mockReturnValue(mockCollectionRef);

    queryBuilder = new ClientBaseQueryBuilder<TestData>(mockFirestore, mockCollectionRef);
  });

  it('should initialize with no constraints', () => {
    expect((queryBuilder as any).constraintDefinitions).toEqual([]);
  });

  // Test immutability and constraint definition addition
  it('should add a where constraint definition immutably', () => {
    const newBuilder = (queryBuilder as any)._where('age', '>', 30);
    expect(newBuilder).not.toBe(queryBuilder); // Should be a new instance
    expect((queryBuilder as any).constraintDefinitions).toEqual([]); // Original unchanged
    expect((newBuilder as any).constraintDefinitions).toEqual([
      { type: 'where', fieldPath: 'age', opStr: '>', value: 30 },
    ]);
  });

  it('should add an orderBy constraint definition immutably', () => {
    const newBuilder = queryBuilder.orderBy('name', 'desc');
    expect(newBuilder).not.toBe(queryBuilder);
    expect((queryBuilder as any).constraintDefinitions).toEqual([]);
    expect((newBuilder as any).constraintDefinitions).toEqual([
      { type: 'orderBy', fieldPath: 'name', directionStr: 'desc' },
    ]);
  });

   it('should add a limit constraint definition immutably', () => {
    const newBuilder = queryBuilder.limit(10);
    expect(newBuilder).not.toBe(queryBuilder);
    expect((queryBuilder as any).constraintDefinitions).toEqual([]);
    expect((newBuilder as any).constraintDefinitions).toEqual([
      { type: 'limit', limitCount: 10 },
    ]);
  });

   it('should add a limitToLast constraint definition immutably', () => {
    const newBuilder = queryBuilder.limitToLast(5);
    expect(newBuilder).not.toBe(queryBuilder);
    expect((queryBuilder as any).constraintDefinitions).toEqual([]);
    expect((newBuilder as any).constraintDefinitions).toEqual([
      { type: 'limitToLast', limitCount: 5 },
    ]);
  });

  it('should add a startAt constraint definition immutably', () => {
    const mockSnapshot = { id: 'doc1' } as DocumentSnapshot<TestData>;
    const newBuilder = queryBuilder.startAt(mockSnapshot);
    expect(newBuilder).not.toBe(queryBuilder);
    expect((queryBuilder as any).constraintDefinitions).toEqual([]);
    expect((newBuilder as any).constraintDefinitions).toEqual([
      { type: 'startAt', snapshotOrFieldValue: mockSnapshot, fieldValues: [] },
    ]);
  });

   it('should add a startAfter constraint definition immutably', () => {
    const newBuilder = queryBuilder.startAfter('value1');
    expect(newBuilder).not.toBe(queryBuilder);
    expect((queryBuilder as any).constraintDefinitions).toEqual([]);
    expect((newBuilder as any).constraintDefinitions).toEqual([
      { type: 'startAfter', snapshotOrFieldValue: 'value1', fieldValues: [] },
    ]);
  });

   it('should add an endAt constraint definition immutably', () => {
    const newBuilder = queryBuilder.endAt('value2');
    expect(newBuilder).not.toBe(queryBuilder);
    expect((queryBuilder as any).constraintDefinitions).toEqual([]);
    expect((newBuilder as any).constraintDefinitions).toEqual([
      { type: 'endAt', snapshotOrFieldValue: 'value2', fieldValues: [] },
    ]);
  });

   it('should add an endBefore constraint definition immutably', () => {
    const newBuilder = queryBuilder.endBefore('value3');
    expect(newBuilder).not.toBe(queryBuilder);
    expect((queryBuilder as any).constraintDefinitions).toEqual([]);
    expect((newBuilder as any).constraintDefinitions).toEqual([
      { type: 'endBefore', snapshotOrFieldValue: 'value3', fieldValues: [] },
    ]);
  });

  it('should chain constraints immutably', () => {
    const finalBuilder = (queryBuilder as any)
      ._where('active', '==', true)
      .orderBy('age', 'asc')
      .limit(5);

    expect(finalBuilder).not.toBe(queryBuilder);
    expect((queryBuilder as any).constraintDefinitions).toEqual([]); // Original still empty
    expect((finalBuilder as any).constraintDefinitions).toEqual([
      { type: 'where', fieldPath: 'active', opStr: '==', value: true },
      { type: 'orderBy', fieldPath: 'age', directionStr: 'asc' },
      { type: 'limit', limitCount: 5 },
    ]);
  });

  // Test buildQuery
  it('should call query() with correct constraints when buildQuery() is called', () => {
    const finalBuilder = (queryBuilder as any)
      ._where('age', '>=', 21)
      .orderBy('name')
      .limit(10); // Add limit constraint

    const mockWhereConstraint = { type: 'where', field: 'age', op: '>=', value: 21 };
    const mockOrderByConstraint = { type: 'orderBy', field: 'name', dir: 'asc' };
    const mockLimitConstraint = { type: 'limit', num: 10 }; // Mock for limit
    (where as jest.Mock).mockReturnValueOnce(mockWhereConstraint);
    (orderBy as jest.Mock).mockReturnValueOnce(mockOrderByConstraint);
    (limit as jest.Mock).mockReturnValueOnce(mockLimitConstraint); // Mock limit function return

    const builtQuery = finalBuilder.buildQuery();

    expect(where).toHaveBeenCalledWith('age', '>=', 21);
    expect(orderBy).toHaveBeenCalledWith('name', 'asc');
    expect(limit).toHaveBeenCalledWith(10); // Assert limit was called
    // Assert query was called with all constraints
    expect(query).toHaveBeenCalledWith(mockCollectionRef, mockWhereConstraint, mockOrderByConstraint, mockLimitConstraint);
    expect(builtQuery).toBe((query as jest.Mock).mock.results[0].value); // Ensure the result of query() is returned
  });

  it('should call query() with cursor and limitToLast constraints when buildQuery() is called', () => {
    const mockStartAtSnapshot = { id: 'startAtDoc' } as DocumentSnapshot<TestData>;
    const mockStartAfterValue = 'startAfterValue';
    const mockEndBeforeSnapshot = { id: 'endBeforeDoc' } as DocumentSnapshot<TestData>;
    const mockEndAtValue = 'endAtValue';

    const finalBuilder = queryBuilder
      .limitToLast(5)
      .startAt(mockStartAtSnapshot)
      .startAfter(mockStartAfterValue)
      .endBefore(mockEndBeforeSnapshot)
      .endAt(mockEndAtValue);

    // Mock the return values of the constraint functions
    const mockLimitToLastConstraint = { type: 'limitToLast', num: 5 };
    const mockStartAtConstraint = { type: 'startAt', val: mockStartAtSnapshot };
    const mockStartAfterConstraint = { type: 'startAfter', val: mockStartAfterValue };
    const mockEndBeforeConstraint = { type: 'endBefore', val: mockEndBeforeSnapshot };
    const mockEndAtConstraint = { type: 'endAt', val: mockEndAtValue };

    (limitToLast as jest.Mock).mockReturnValueOnce(mockLimitToLastConstraint);
    (startAt as jest.Mock).mockReturnValueOnce(mockStartAtConstraint);
    (startAfter as jest.Mock).mockReturnValueOnce(mockStartAfterConstraint);
    (endBefore as jest.Mock).mockReturnValueOnce(mockEndBeforeConstraint);
    (endAt as jest.Mock).mockReturnValueOnce(mockEndAtConstraint);

    finalBuilder.buildQuery();

    // Verify the constraint functions were called
    expect(limitToLast).toHaveBeenCalledWith(5);
    expect(startAt).toHaveBeenCalledWith(mockStartAtSnapshot);
    expect(startAfter).toHaveBeenCalledWith(mockStartAfterValue);
    expect(endBefore).toHaveBeenCalledWith(mockEndBeforeSnapshot);
    expect(endAt).toHaveBeenCalledWith(mockEndAtValue);

    // Verify query() was called with the collection ref and all the mock constraints
    expect(query).toHaveBeenCalledWith(
      mockCollectionRef,
      mockLimitToLastConstraint,
      mockStartAtConstraint,
      mockStartAfterConstraint,
      mockEndBeforeConstraint,
      mockEndAtConstraint
    );
  });

  it('should throw an error for unsupported constraint types in buildQuery', () => {
    // Manually add an invalid constraint definition
    (queryBuilder as any).constraintDefinitions.push({ type: 'invalid-constraint' });

    // Expect buildQuery to throw an error
    expect(() => queryBuilder.buildQuery()).toThrow(
      'Unsupported client constraint type: invalid-constraint'
    );
  });



  // Test getSnapshot
  it('should call getDocs() with the built query when getSnapshot() is called', async () => {
    const mockBuiltQuery = { type: 'mockQuery' };
    const mockSnapshot = {
      docs: [],
      empty: true,
      size: 0,
      metadata: {} as any, // Add mock metadata if needed
      query: {} as any, // Add mock query if needed
      forEach: jest.fn(), // Mock forEach
      docChanges: jest.fn(() => []), // Mock docChanges
    } as QuerySnapshot<TestData>;
    (query as jest.Mock).mockReturnValue(mockBuiltQuery); // Mock the result of query()
    (getDocs as jest.Mock).mockResolvedValue(mockSnapshot);

    const builder = (queryBuilder as any)._where('active', '==', false); // Add a constraint to trigger query build
    const snapshotResult = await builder.getSnapshot();

    expect(query).toHaveBeenCalledWith(mockCollectionRef, expect.objectContaining({ type: 'where' })); // Verify query was called
    expect(getDocs).toHaveBeenCalledWith(mockBuiltQuery); // Verify getDocs was called with the result of query()
    expect(snapshotResult).toBe(mockSnapshot);
  });

  // Test get
  it('should call getSnapshot() and return mapped data when get() is called', async () => {
    const mockData1 = { name: 'Alice', age: 30, active: true };
    const mockData2 = { name: 'Bob', age: 25, active: true };
    const mockDoc1 = { exists: () => true, data: () => mockData1 } as QueryDocumentSnapshot<TestData>;
    const mockDoc2 = { exists: () => true, data: () => mockData2 } as QueryDocumentSnapshot<TestData>;
    const mockSnapshot = {
      docs: [mockDoc1, mockDoc2],
      empty: false,
      size: 2,
      metadata: {} as any,
      query: {} as any,
      forEach: jest.fn((callback) => [mockDoc1, mockDoc2].forEach(callback)),
      docChanges: jest.fn(() => []), // Mock docChanges
    } as QuerySnapshot<TestData>;

    const mockBuiltQuery = { type: 'mockQuery' };
    (query as jest.Mock).mockReturnValue(mockBuiltQuery);
    (getDocs as jest.Mock).mockResolvedValue(mockSnapshot);

    // Spy on getSnapshot within the same instance
    const builder = (queryBuilder as any)._where('active', '==', true);
    const getSnapshotSpy = jest.spyOn(builder, 'getSnapshot');

    const dataResult = await builder.get();

    expect(getSnapshotSpy).toHaveBeenCalledTimes(1);
    expect(dataResult).toEqual([mockData1, mockData2]);

    getSnapshotSpy.mockRestore(); // Clean up spy
  });
});