import { BaseQueryBuilder } from '../baseQueryBuilder'; // Adjust path as needed
import {
  Firestore,
  CollectionReference,
  DocumentData,
  Query,
  collection,
  query,
  where,
  orderBy,
  limit,
  startAt,
  startAfter,
  endAt,
  endBefore,
  getDocs,
  QueryConstraint,
  // Add other necessary Firestore query types/functions
} from 'firebase/firestore';

// Mock the 'firebase/firestore' module for query functions
const mockCollection = jest.fn();
const mockQuery = jest.fn();
const mockWhere = jest.fn();
const mockOrderBy = jest.fn();
const mockLimit = jest.fn();
const mockStartAt = jest.fn();
const mockStartAfter = jest.fn();
const mockEndAt = jest.fn();
const mockEndBefore = jest.fn();
const mockGetDocs = jest.fn();
const mockLimitToLast = jest.fn(); // Add mock for limitToLast

jest.mock('firebase/firestore', () => ({
  // Keep mocks from BaseCollectionRef tests if needed, or re-declare
  collection: (...args: any[]) => mockCollection(...args),
  doc: jest.fn().mockReturnValue({ id: 'mockDocId', path: 'col/mockDocId' }), // Basic mock for potential parent refs

  // Query Mocks
  query: (...args: any[]) => mockQuery(...args),
  where: (...args: any[]) => mockWhere(...args),
  orderBy: (...args: any[]) => mockOrderBy(...args),
  limit: (...args: any[]) => mockLimit(...args),
  startAt: (...args: any[]) => mockStartAt(...args),
  startAfter: (...args: any[]) => mockStartAfter(...args),
  endAt: (...args: any[]) => mockEndAt(...args),
  endBefore: (...args: any[]) => mockEndBefore(...args),
  getDocs: (...args: any[]) => mockGetDocs(...args),
  limitToLast: (...args: any[]) => mockLimitToLast(...args), // Add limitToLast to mock definition

  // Add other necessary exports like serverTimestamp if BaseQueryBuilder uses them
  serverTimestamp: jest.fn(() => 'mockServerTimestampValue'),
}));

// Define dummy types for testing
interface TestData extends DocumentData {
  id?: string;
  name: string;
  value: number;
  active: boolean;
  tags?: string[];
}

// Concrete implementation for testing abstract class (if BaseQueryBuilder is abstract)
// Assuming BaseQueryBuilder might not be abstract, but good practice for testing base classes
class TestQueryBuilder extends BaseQueryBuilder<TestData> {
  constructor(firestore: Firestore, collectionRef: CollectionReference<TestData>) {
    super(firestore, collectionRef);
  }
  // Implement abstract methods if any
}

describe('BaseQueryBuilder', () => {
  let mockFirestore: Firestore;
  let mockCollectionRef: CollectionReference<TestData>;
  let testQueryBuilder: TestQueryBuilder;

  beforeEach(() => {
    jest.clearAllMocks();

    mockFirestore = {} as Firestore;
    mockCollectionRef = { id: 'testItems', path: 'testItems' } as CollectionReference<TestData>;

    // Constructor just stores refs, doesn't call query()
    testQueryBuilder = new TestQueryBuilder(mockFirestore, mockCollectionRef);

    // Clear mocks *after* constructor, before each test runs its specific logic
    // Note: constructor doesn't call these, but good practice if it did.
    mockQuery.mockClear();
    mockWhere.mockClear();
    mockOrderBy.mockClear();
    mockLimit.mockClear();
    // ... clear other mocks ...
    mockGetDocs.mockClear();
  });

  it('should initialize with the correct firestore and collection reference', () => {
    expect(testQueryBuilder).toBeInstanceOf(BaseQueryBuilder);
    // Access protected fields for verification
    expect((testQueryBuilder as any).firestore).toBe(mockFirestore);
    expect((testQueryBuilder as any).collectionRef).toBe(mockCollectionRef);
    expect((testQueryBuilder as any).constraints).toEqual([]); // Constraints should be empty initially
    expect(mockQuery).not.toHaveBeenCalled(); // Constructor should not call query()

  // --- Constraint Tests ---

  }); // End of initialization test

  // --- Constraint Tests ---

  it('should add a where constraint via _where', () => {
    const mockWhereConstraint = { type: 'whereConstraint' } as unknown as QueryConstraint;
    mockWhere.mockReturnValue(mockWhereConstraint);

    // Access protected method for testing
    const result = (testQueryBuilder as any)._where('name', '==', 'Test');

    expect(result).toBe(testQueryBuilder); // Returns self
    expect(mockWhere).toHaveBeenCalledTimes(1);
    expect(mockWhere).toHaveBeenCalledWith('name', '==', 'Test');
    expect((testQueryBuilder as any).constraints).toContain(mockWhereConstraint);
  });

  it('should add an orderBy constraint', () => {
    const mockOrderByConstraint = { type: 'orderByConstraint' } as unknown as QueryConstraint;
    mockOrderBy.mockReturnValue(mockOrderByConstraint);

    const result = testQueryBuilder.orderBy('value', 'desc');

    expect(result).toBe(testQueryBuilder);
    expect(mockOrderBy).toHaveBeenCalledTimes(1);
    expect(mockOrderBy).toHaveBeenCalledWith('value', 'desc');
    expect((testQueryBuilder as any).constraints).toContain(mockOrderByConstraint);
  });

   it('should add a limit constraint', () => {
    const mockLimitConstraint = { type: 'limitConstraint' } as unknown as QueryConstraint;
    mockLimit.mockReturnValue(mockLimitConstraint);

    const result = testQueryBuilder.limit(10);

    expect(result).toBe(testQueryBuilder);
    expect(mockLimit).toHaveBeenCalledTimes(1);
    expect(mockLimit).toHaveBeenCalledWith(10);
    expect((testQueryBuilder as any).constraints).toContain(mockLimitConstraint);
  });

   it('should add a limitToLast constraint', () => {
    const mockLimitToLastConstraint = { type: 'limitToLastConstraint' } as unknown as QueryConstraint;
    // Use the globally defined mock function
    mockLimitToLast.mockReturnValue(mockLimitToLastConstraint);


    const result = testQueryBuilder.limitToLast(5);

    expect(result).toBe(testQueryBuilder);
    expect(mockLimitToLast).toHaveBeenCalledTimes(1);
    expect(mockLimitToLast).toHaveBeenCalledWith(5);
    expect((testQueryBuilder as any).constraints).toContain(mockLimitToLastConstraint);
  });

  // --- Cursor Tests ---

  it('should add a startAt constraint (value)', () => {
    const mockStartAtConstraint = { type: 'startAtConstraint' } as unknown as QueryConstraint;
    mockStartAt.mockReturnValue(mockStartAtConstraint);

    const result = testQueryBuilder.startAt('TestName');

    expect(result).toBe(testQueryBuilder);
    expect(mockStartAt).toHaveBeenCalledTimes(1);
    expect(mockStartAt).toHaveBeenCalledWith('TestName');
    expect((testQueryBuilder as any).constraints).toContain(mockStartAtConstraint);
  });

   it('should add a startAfter constraint (snapshot)', () => {
    const mockStartAfterConstraint = { type: 'startAfterConstraint' } as unknown as QueryConstraint;
    const mockSnapshot = { id: 'doc1' } as any; // Mock snapshot
    mockStartAfter.mockReturnValue(mockStartAfterConstraint);

    const result = testQueryBuilder.startAfter(mockSnapshot);

    expect(result).toBe(testQueryBuilder);
    expect(mockStartAfter).toHaveBeenCalledTimes(1);
    expect(mockStartAfter).toHaveBeenCalledWith(mockSnapshot);
    expect((testQueryBuilder as any).constraints).toContain(mockStartAfterConstraint);
  });

   it('should add an endBefore constraint (value)', () => {
    const mockEndBeforeConstraint = { type: 'endBeforeConstraint' } as unknown as QueryConstraint;
    mockEndBefore.mockReturnValue(mockEndBeforeConstraint);

    const result = testQueryBuilder.endBefore(100);

    expect(result).toBe(testQueryBuilder);
    expect(mockEndBefore).toHaveBeenCalledTimes(1);
    expect(mockEndBefore).toHaveBeenCalledWith(100);
    expect((testQueryBuilder as any).constraints).toContain(mockEndBeforeConstraint);
  });

   it('should add an endAt constraint (snapshot)', () => {
    const mockEndAtConstraint = { type: 'endAtConstraint' } as unknown as QueryConstraint;
    const mockSnapshot = { id: 'doc2' } as any; // Mock snapshot
    mockEndAt.mockReturnValue(mockEndAtConstraint);

    const result = testQueryBuilder.endAt(mockSnapshot);

    expect(result).toBe(testQueryBuilder);
    expect(mockEndAt).toHaveBeenCalledTimes(1);
    expect(mockEndAt).toHaveBeenCalledWith(mockSnapshot);
    expect((testQueryBuilder as any).constraints).toContain(mockEndAtConstraint);
  });


  // --- Execution Tests ---

  it('should build query and call getDocs on get()', async () => {
    const mockFinalQuery = { type: 'finalQuery' } as unknown as Query<TestData>;
    const mockSnapshot = {
      docs: [
        { data: () => ({ name: 'A', value: 1, active: true }) },
        { data: () => ({ name: 'B', value: 2, active: false }) },
      ],
    };
    mockQuery.mockReturnValue(mockFinalQuery); // Mock the buildQuery() call
    mockGetDocs.mockResolvedValue(mockSnapshot);

    // Add some constraints first
    (testQueryBuilder as any)._where('active', '==', true);
    testQueryBuilder.orderBy('value');

    const results = await testQueryBuilder.get();

    expect(mockQuery).toHaveBeenCalledTimes(1); // Called by buildQuery
    expect(mockQuery).toHaveBeenCalledWith(mockCollectionRef, expect.any(Object), expect.any(Object)); // With constraints
    expect(mockGetDocs).toHaveBeenCalledTimes(1);
    expect(mockGetDocs).toHaveBeenCalledWith(mockFinalQuery);
    expect(results).toEqual([
      { name: 'A', value: 1, active: true },
      { name: 'B', value: 2, active: false },
    ]);
  });

  it('should build query and call getDocs on getSnapshot()', async () => {
    const mockFinalQuery = { type: 'finalQuery' } as unknown as Query<TestData>;
    const mockSnapshot = {
      docs: [ /* ... */ ],
      size: 2,
      empty: false,
      // ... other snapshot properties
    };
    mockQuery.mockReturnValue(mockFinalQuery); // Mock the buildQuery() call
    mockGetDocs.mockResolvedValue(mockSnapshot);

    // Add a constraint
    testQueryBuilder.limit(5);

    const snapshotResult = await testQueryBuilder.getSnapshot();

    expect(mockQuery).toHaveBeenCalledTimes(1); // Called by buildQuery
    expect(mockQuery).toHaveBeenCalledWith(mockCollectionRef, expect.any(Object)); // With limit constraint
    expect(mockGetDocs).toHaveBeenCalledTimes(1);
    expect(mockGetDocs).toHaveBeenCalledWith(mockFinalQuery);
    expect(snapshotResult).toBe(mockSnapshot);
  });


  // Add more tests here for where, orderBy, limit, get, etc.
  // Example:
  // it('should add a where clause correctly', () => {
  //   const mockWhereConstraint = { type: 'whereConstraint' } as QueryConstraint;
  //   const mockCombinedQuery = { type: 'query', path: 'testItems/where' } as unknown as Query<TestData>;
  //   mockWhere.mockReturnValue(mockWhereConstraint);
  //   mockQuery.mockReturnValue(mockCombinedQuery); // Mock return for query() call within where()

  //   const result = testQueryBuilder.where('name', '==', 'Test');

  //   expect(result).toBe(testQueryBuilder); // Should return itself for chaining
  //   expect(mockWhere).toHaveBeenCalledTimes(1);
  //   expect(mockWhere).toHaveBeenCalledWith('name', '==', 'Test');
  //   expect(mockQuery).toHaveBeenCalledTimes(1); // Called once by the where method
  //   // Check that query was called with the previous query state and the new constraint
  //   expect(mockQuery).toHaveBeenCalledWith(expect.anything(), mockWhereConstraint);
  //   expect((testQueryBuilder as any).currentQuery).toBe(mockCombinedQuery); // Internal state updated
  // });

});