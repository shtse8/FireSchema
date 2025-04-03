import { AdminBaseQueryBuilder } from '../baseQueryBuilder';
import type {
  Firestore,
  CollectionReference,
  Query,
  DocumentSnapshot,
  DocumentData,
  QuerySnapshot,
  WhereFilterOp,
  OrderByDirection,
  FieldPath as AdminFieldPath,
  Timestamp, // Import Timestamp for mockSnapshot
} from 'firebase-admin/firestore';

// Mock the FieldPath class if needed for specific tests
jest.mock('firebase-admin/firestore', () => ({
  // Mock FieldValue and Timestamp if they were needed (not directly used here, but good practice)
  FieldValue: {
    serverTimestamp: jest.fn(),
    increment: jest.fn(),
    arrayUnion: jest.fn(),
    arrayRemove: jest.fn(),
    delete: jest.fn(),
  },
  Timestamp: { now: jest.fn(() => ({ seconds: 123, nanoseconds: 456 } as Timestamp)) },
  // Mock FieldPath if complex paths are tested
  FieldPath: jest.fn().mockImplementation((...args) => ({ // Basic mock
      _segments: args,
      isEqual: jest.fn(),
  })),
}), { virtual: true }); // Use virtual mock as we don't need the actual implementation


// Mock types for testing
interface TestData extends DocumentData {
  name: string;
  age: number;
  active: boolean;
}

describe('AdminBaseQueryBuilder', () => {
  let mockFirestore: any; // Use 'any' for simplicity
  let mockCollectionRef: any;
  let mockQuery: any; // Mock for the query object returned by chaining
  let queryBuilder: AdminBaseQueryBuilder<TestData>;

  beforeEach(() => {
    jest.clearAllMocks(); // Clear mocks from previous tests

    // --- Simplified Mock Firestore Structure ---
    // Mock the chainable query methods to return 'this' (the mock itself)
    // and the final 'get' method
    mockQuery = {
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      limitToLast: jest.fn().mockReturnThis(),
      startAt: jest.fn().mockReturnThis(),
      startAfter: jest.fn().mockReturnThis(),
      endAt: jest.fn().mockReturnThis(),
      endBefore: jest.fn().mockReturnThis(),
      get: jest.fn(), // Mock the final execution step
    };

    mockCollectionRef = {
      id: 'test-collection',
      path: 'test/path',
      // Mock query methods directly on collectionRef as they are the start of the chain
      where: jest.fn().mockReturnValue(mockQuery),
      orderBy: jest.fn().mockReturnValue(mockQuery),
      limit: jest.fn().mockReturnValue(mockQuery),
      limitToLast: jest.fn().mockReturnValue(mockQuery),
      startAt: jest.fn().mockReturnValue(mockQuery),
      startAfter: jest.fn().mockReturnValue(mockQuery),
      endAt: jest.fn().mockReturnValue(mockQuery),
      endBefore: jest.fn().mockReturnValue(mockQuery),
      get: jest.fn(), // CollectionRef also has get()
    };

    mockFirestore = {
      // No direct calls expected in this builder, but mock if needed
    };

    queryBuilder = new AdminBaseQueryBuilder<TestData>(mockFirestore, mockCollectionRef);
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

   // ... (Add similar immutability tests for limitToLast, startAt, startAfter, endAt, endBefore) ...
   it('should add a limitToLast constraint definition immutably', () => {
    const newBuilder = queryBuilder.limitToLast(5);
    expect(newBuilder).not.toBe(queryBuilder);
    expect((queryBuilder as any).constraintDefinitions).toEqual([]); // Check original builder is unchanged
    expect((newBuilder as any).constraintDefinitions).toEqual([
      { type: 'limitToLast', limitCount: 5 },
    ]);
  });

  it('should add a startAt constraint definition immutably', () => {
    const mockSnapshot = { id: 'doc1' } as DocumentSnapshot<TestData>;
    const newBuilder = queryBuilder.startAt(mockSnapshot);
    expect(newBuilder).not.toBe(queryBuilder);
    expect((queryBuilder as any).constraintDefinitions).toEqual([]); // Check original builder is unchanged
    expect((newBuilder as any).constraintDefinitions).toEqual([
      { type: 'startAt', snapshotOrFieldValue: mockSnapshot, fieldValues: [] },
    ]);
  });

  // Test chaining definitions
  it('should chain constraint definitions immutably', () => {
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

  // Test buildQuery - verify chaining calls
  it('should call chained methods on collectionRef/query when buildQuery() is called', () => {
    const finalBuilder = (queryBuilder as any)
      ._where('age', '>=', 21)
      .orderBy('name')
      .limit(10);

    const builtQuery = finalBuilder.buildQuery();

    // Verify the chain: starts with collectionRef.where, then query.orderBy, then query.limit
    expect(mockCollectionRef.where).toHaveBeenCalledWith('age', '>=', 21);
    expect(mockQuery.orderBy).toHaveBeenCalledWith('name', 'asc'); // Default direction
    expect(mockQuery.limit).toHaveBeenCalledWith(10);

    // The final result should be the mockQuery object after all chaining
    expect(builtQuery).toBe(mockQuery);
  });

   it('should handle only collectionRef if no constraints', () => {
     const builtQuery = queryBuilder.buildQuery();
     expect(mockCollectionRef.where).not.toHaveBeenCalled();
     expect(mockCollectionRef.orderBy).not.toHaveBeenCalled();
     // etc.
     expect(builtQuery).toBe(mockCollectionRef); // Returns the original ref if no constraints
   });

  // Test getSnapshot
  it('should call get() on the built query when getSnapshot() is called', async () => {
    const mockSnapshotResult = {
      docs: [],
      empty: true,
      size: 0,
      query: mockQuery, // Link back to the mock query
      readTime: { seconds: 1, nanoseconds: 1 } as Timestamp, // Mock readTime
      docChanges: jest.fn(() => []), // Mock docChanges
      forEach: jest.fn(), // Mock forEach
      isEqual: jest.fn(), // Mock isEqual
    } as QuerySnapshot<TestData>;
    mockQuery.get.mockResolvedValue(mockSnapshotResult); // Mock the final get() call

    const builder = (queryBuilder as any)._where('active', '==', false); // Add a constraint
    const snapshotResult = await builder.getSnapshot();

    // Verify the query was built (where was called) and then get() was called on the result
    expect(mockCollectionRef.where).toHaveBeenCalledWith('active', '==', false);
    expect(mockQuery.get).toHaveBeenCalledTimes(1);
    expect(snapshotResult).toBe(mockSnapshotResult);
  });

  // Test get
  it('should call getSnapshot() and return mapped data when get() is called', async () => {
    const mockData1 = { name: 'Alice', age: 30, active: true };
    const mockData2 = { name: 'Bob', age: 25, active: true };
    // Admin SDK QueryDocumentSnapshot has data() returning TData directly
    const mockDoc1 = { data: () => mockData1, id: '1', exists: true } as any;
    const mockDoc2 = { data: () => mockData2, id: '2', exists: true } as any;
    const mockSnapshotResult = {
        docs: [mockDoc1, mockDoc2],
        empty: false,
        size: 2,
        // Add other QuerySnapshot properties if needed by code under test
    } as QuerySnapshot<TestData>;

    // Mock the build and get process
    mockQuery.get.mockResolvedValue(mockSnapshotResult);

    const builder = (queryBuilder as any)._where('active', '==', true);
    const getSnapshotSpy = jest.spyOn(builder, 'getSnapshot'); // Spy on the builder's method

    const dataResult = await builder.get();

    expect(getSnapshotSpy).toHaveBeenCalledTimes(1);
    expect(mockCollectionRef.where).toHaveBeenCalledWith('active', '==', true); // Ensure build happened
    expect(mockQuery.get).toHaveBeenCalledTimes(1); // Ensure get was called
    expect(dataResult).toEqual([mockData1, mockData2]);

    getSnapshotSpy.mockRestore(); // Clean up spy
  });
});