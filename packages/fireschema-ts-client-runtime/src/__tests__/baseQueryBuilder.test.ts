import { ClientBaseQueryBuilder } from '../baseQueryBuilder';
import type {
  Firestore,
  CollectionReference,
  Query,
  DocumentData,
  Timestamp,
  WhereFilterOp,
  OrderByDirection,
  DocumentSnapshot, // Import DocumentSnapshot for cursor tests
  QuerySnapshot, // Import QuerySnapshot for getSnapshot test
  QueryDocumentSnapshot, // Import QueryDocumentSnapshot for get test
} from 'firebase/firestore';

// Import client functions that are mocked
import {
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

// --- Mocks ---

// Mock the Firestore Client SDK module
jest.mock('firebase/firestore', () => {
  // Create mock constraint functions that return identifiable objects
  const mockWhere = jest.fn((...args) => ({ __type: 'whereConstraint', args }));
  const mockOrderBy = jest.fn((...args) => ({ __type: 'orderByConstraint', args }));
  const mockLimit = jest.fn((...args) => ({ __type: 'limitConstraint', args }));
  const mockLimitToLast = jest.fn((...args) => ({ __type: 'limitToLastConstraint', args }));
  const mockStartAt = jest.fn((...args) => ({ __type: 'startAtConstraint', args }));
  const mockStartAfter = jest.fn((...args) => ({ __type: 'startAfterConstraint', args }));
  const mockEndAt = jest.fn((...args) => ({ __type: 'endAtConstraint', args }));
  const mockEndBefore = jest.fn((...args) => ({ __type: 'endBeforeConstraint', args }));

  // Mock the main query function
  const mockQuery = jest.fn();
  const mockGetDocs = jest.fn();

  return {
    ...(jest.requireActual('firebase/firestore')), // Keep actual types etc.
    query: mockQuery,
    where: mockWhere,
    orderBy: mockOrderBy,
    limit: mockLimit,
    limitToLast: mockLimitToLast,
    startAt: mockStartAt,
    startAfter: mockStartAfter,
    endAt: mockEndAt,
    endBefore: mockEndBefore,
    getDocs: mockGetDocs,
    // Mock serverTimestamp if needed for specific query values
    // serverTimestamp: jest.fn(() => ({ type: 'serverTimestamp' })),
  };
});

// Mock types for testing
interface TestData extends DocumentData {
  name: string;
  count: number;
  active: boolean;
  createdAt?: Timestamp;
  tags?: string[];
}

// --- Test Suite ---

describe('ClientBaseQueryBuilder', () => {
  let mockFirestore: Firestore; // Declare mockFirestore
  let queryBuilder: ClientBaseQueryBuilder<TestData>;
  let mockInitialRef: CollectionReference<TestData>; // The starting point for queries
  let mockQueryObj: any; // Declare mockQueryObj in the describe scope

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock Firestore instance
    mockFirestore = {} as Firestore; // Simple mock

    // Mock the initial CollectionReference or Query object
    mockInitialRef = { id: 'test-collection', path: 'test-collection' } as any;

    // Mock the object returned by the main query function
    mockQueryObj = { __type: 'mockQueryObject', ref: mockInitialRef } as any; // Make it identifiable

    // Reset the main query mock and set its return value for all calls
    (query as jest.Mock).mockClear();
    (query as jest.Mock).mockReturnValue(mockQueryObj);

    // Reset constraint mocks (they are defined outside beforeEach in the module scope mock)
    (where as jest.Mock).mockClear();
    (orderBy as jest.Mock).mockClear();
    (limit as jest.Mock).mockClear();
    (limitToLast as jest.Mock).mockClear();
    (startAt as jest.Mock).mockClear();
    (startAfter as jest.Mock).mockClear();
    (endAt as jest.Mock).mockClear();
    (endBefore as jest.Mock).mockClear();
    (getDocs as jest.Mock).mockClear();


    // Instantiate the builder with the mock initial reference
    queryBuilder = new ClientBaseQueryBuilder<TestData>(mockFirestore, mockInitialRef);
  });

  it('should initialize with the provided initial reference', () => {
    expect((queryBuilder as any).collectionRef).toBe(mockInitialRef); // Corrected property name
    expect((queryBuilder as any).constraintDefinitions).toEqual([]);
  });

  // --- Test Where Clauses (using protected _where) ---
  describe('_where()', () => {
    it('should add a where constraint definition', () => {
      const field = 'name';
      const op = '==';
      const value = 'Test Name';
      // Access protected method for testing base class logic
      const result = (queryBuilder as any)._where(field, op, value);

      const definitions = (result as any).constraintDefinitions;
      expect(definitions).toHaveLength(1);
      expect(definitions[0]).toEqual({ type: 'where', fieldPath: field, opStr: op, value: value });
      expect(result).not.toBe(queryBuilder); // Should return a new instance
      expect(result).toBeInstanceOf(ClientBaseQueryBuilder);
    });

    it('should build query with where constraint using top-level functions', () => {
        const field = 'count';
        const op = '>';
        const value = 5;
        const finalQuery = (queryBuilder as any)._where(field, op, value).buildQuery();

        // Check that the constraint function was called correctly
        expect(where).toHaveBeenCalledWith(field, op, value);

        // Check that the main query function was called with the initial ref
        // and the result of the constraint function call.
        expect(query).toHaveBeenCalledWith(
            mockInitialRef, // Base ref
            expect.objectContaining({ __type: 'whereConstraint', args: [field, op, value] }) // The constraint object
        );

        // The finalQuery is the result of the main query mock
        expect(finalQuery).toBe(mockQueryObj);
    });
  });

  // --- Test OrderBy Clauses ---
  describe('orderBy()', () => {
    it('should add an orderBy constraint definition', () => {
      const field = 'createdAt';
      const result = queryBuilder.orderBy(field, 'desc');

      const definitions = (result as any).constraintDefinitions;
      expect(definitions).toHaveLength(1);
      expect(definitions[0]).toEqual({ type: 'orderBy', fieldPath: field, directionStr: 'desc' });
      expect(result).not.toBe(queryBuilder);
    });

     it('should build query with orderBy constraint', () => {
        const field = 'name';
        const finalQuery = queryBuilder.orderBy(field).buildQuery(); // Default 'asc'

        expect(orderBy).toHaveBeenCalledWith(field, 'asc');
        expect(query).toHaveBeenCalledWith(
            mockInitialRef,
            expect.objectContaining({ __type: 'orderByConstraint', args: [field, 'asc'] })
        );
        expect(finalQuery).toBe(mockQueryObj);
    });
  });

  // --- Test Limit Clauses ---
  describe('limit()', () => {
    it('should add a limit constraint definition', () => {
      const limitNum = 10;
      const result = queryBuilder.limit(limitNum);

      const definitions = (result as any).constraintDefinitions;
      expect(definitions).toHaveLength(1);
      expect(definitions[0]).toEqual({ type: 'limit', limitCount: limitNum });
      expect(result).not.toBe(queryBuilder);
    });

     it('should build query with limit constraint', () => {
        const limitNum = 25;
        const finalQuery = queryBuilder.limit(limitNum).buildQuery();

        expect(limit).toHaveBeenCalledWith(limitNum);
        expect(query).toHaveBeenCalledWith(
            mockInitialRef,
            expect.objectContaining({ __type: 'limitConstraint', args: [limitNum] })
        );
        expect(finalQuery).toBe(mockQueryObj);
    });
  });

  describe('limitToLast()', () => {
    it('should add a limitToLast constraint definition', () => {
      const limitNum = 5;
      const result = queryBuilder.limitToLast(limitNum);

      const definitions = (result as any).constraintDefinitions;
      expect(definitions).toHaveLength(1);
      expect(definitions[0]).toEqual({ type: 'limitToLast', limitCount: limitNum });
       expect(result).not.toBe(queryBuilder);
    });

     it('should build query with limitToLast constraint', () => {
        const limitNum = 15;
        const finalQuery = queryBuilder.limitToLast(limitNum).buildQuery();

        expect(limitToLast).toHaveBeenCalledWith(limitNum);
        expect(query).toHaveBeenCalledWith(
            mockInitialRef,
            expect.objectContaining({ __type: 'limitToLastConstraint', args: [limitNum] })
        );
        expect(finalQuery).toBe(mockQueryObj);
    });
  });

  // --- Test Cursor Clauses ---
  describe('startAt()', () => {
    it('should add a startAt constraint definition', () => {
      const value = 'Start Value';
      const result = queryBuilder.startAt(value);

      const definitions = (result as any).constraintDefinitions;
      expect(definitions).toHaveLength(1);
      expect(definitions[0]).toEqual({ type: 'startAt', snapshotOrFieldValue: value, fieldValues: [] });
       expect(result).not.toBe(queryBuilder);
    });

     it('should build query with startAt constraint', () => {
        const value = 'Start Value';
        const finalQuery = queryBuilder.startAt(value).buildQuery();

        expect(startAt).toHaveBeenCalledWith(value);
        expect(query).toHaveBeenCalledWith(
            mockInitialRef,
            expect.objectContaining({ __type: 'startAtConstraint', args: [value] })
        );
        expect(finalQuery).toBe(mockQueryObj);
    });
  });

  // Add similar tests for startAfter, endAt, endBefore...

  // --- Test Execution ---
  describe('getSnapshot()', () => {
    it('should build query and call getDocs() on the final query object', async () => {
      const mockSnapshotData = { docs: [], empty: true, size: 0 } as any; // Basic mock snapshot
      (getDocs as jest.Mock).mockResolvedValue(mockSnapshotData); // Mock getDocs result

      // Add a constraint to ensure buildQuery is involved
      const builderWithConstraint = queryBuilder.limit(10);
      const builtQuery = builderWithConstraint.buildQuery(); // Get the mocked query object

      // Verify buildQuery called query correctly
      expect(limit).toHaveBeenCalledWith(10);
      expect(query).toHaveBeenCalledWith(
          mockInitialRef,
          expect.objectContaining({ __type: 'limitConstraint', args: [10] })
      );
      expect(builtQuery).toBe(mockQueryObj); // Ensure buildQuery returned the mocked object

      const result = await builderWithConstraint.getSnapshot();

      // Ensure getDocs is called with the result of buildQuery (which is mockQueryObj)
      expect(getDocs).toHaveBeenCalledWith(mockQueryObj);
      expect(result).toBe(mockSnapshotData);
    });
  });

  describe('get()', () => {
     it('should call getSnapshot and return mapped data', async () => {
        const mockDocs = [
            { data: () => ({ name: 'A', count: 1 } as TestData), id: '1', ref: {} },
            { data: () => ({ name: 'B', count: 2 } as TestData), id: '2', ref: {} },
        ] as any[]; // Use any[] for mock docs
        const mockSnapshotData = { docs: mockDocs, empty: false, size: 2 } as any; // Use any for mock snapshot
        (getDocs as jest.Mock).mockResolvedValue(mockSnapshotData); // Mock getDocs result

        const result = await queryBuilder.get();
        const builtQuery = queryBuilder.buildQuery(); // Need to call buildQuery to trigger mocks

        // Check that query was called (with no constraints here)
        expect(query).toHaveBeenCalledWith(mockInitialRef);
        expect(builtQuery).toBe(mockQueryObj);

        // Check getDocs was called with the result of buildQuery
        expect(getDocs).toHaveBeenCalledWith(mockQueryObj);
        expect(result).toEqual([
            { name: 'A', count: 1 },
            { name: 'B', count: 2 },
        ]);
    });

     it('should return empty array if snapshot is empty', async () => {
        const mockSnapshotData = { docs: [], empty: true, size: 0 } as any;
        (getDocs as jest.Mock).mockResolvedValue(mockSnapshotData);

        const result = await queryBuilder.get();
        const builtQuery = queryBuilder.buildQuery();

        // Check that query was called (with no constraints here)
        expect(query).toHaveBeenCalledWith(mockInitialRef);
        expect(builtQuery).toBe(mockQueryObj);

        // Check getDocs was called with the result of buildQuery
        expect(getDocs).toHaveBeenCalledWith(mockQueryObj);
        expect(result).toEqual([]);
    });
  });

  // --- Test Chaining ---
  it('should allow chaining and build the correct query', () => {
    const finalBuilder = (queryBuilder as any)
      ._where('active', '==', true)
      .orderBy('createdAt', 'desc')
      .limit(5)
      .startAfter('someTimestamp');

    const finalQuery = finalBuilder.buildQuery();

    // Check if constraints were added
    expect((finalBuilder as any).constraintDefinitions).toHaveLength(4);

    // Check constraint functions called
    expect(where).toHaveBeenCalledWith('active', '==', true);
    expect(orderBy).toHaveBeenCalledWith('createdAt', 'desc');
    expect(limit).toHaveBeenCalledWith(5);
    expect(startAfter).toHaveBeenCalledWith('someTimestamp');

    // Check the final query call
    expect(query).toHaveBeenCalledWith(
        mockInitialRef,
        expect.objectContaining({ __type: 'whereConstraint', args: ['active', '==', true] }),
        expect.objectContaining({ __type: 'orderByConstraint', args: ['createdAt', 'desc'] }),
        expect.objectContaining({ __type: 'limitConstraint', args: [5] }),
        expect.objectContaining({ __type: 'startAfterConstraint', args: ['someTimestamp'] })
    );
    expect(finalQuery).toBe(mockQueryObj);
  });
});