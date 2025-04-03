import { AdminBaseQueryBuilder } from '../baseQueryBuilder';
import type {
  Firestore,
  CollectionReference,
  Query,
  DocumentData,
  Timestamp,
  WhereFilterOp,
  OrderByDirection,
  FieldPath as AdminFieldPath, // Import Admin FieldPath
  QuerySnapshot, // Import QuerySnapshot
  QueryDocumentSnapshot, // Import QueryDocumentSnapshot
} from 'firebase-admin/firestore';

// --- Mocks ---

// Mock Firestore instance
const mockFirestore: jest.Mocked<Firestore> = {} as any; // Add methods if needed by constructor

// Mock Query methods that return the Query itself for chaining
const mockQueryChainableMethods = {
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  limitToLast: jest.fn(),
  startAt: jest.fn(),
  startAfter: jest.fn(),
  endAt: jest.fn(),
  endBefore: jest.fn(),
  get: jest.fn(), // Mock get separately as it returns a Promise
};

// Mock CollectionReference, including Query methods
const mockCollectionRef = {
  ...mockQueryChainableMethods, // Spread chainable methods
  // Add specific CollectionReference properties/methods if needed
  id: 'test-collection',
  path: 'test-collection',
  firestore: mockFirestore,
} as any; // Use 'as any' to simplify mocking

// Configure chainable methods to return the mock itself
Object.values(mockQueryChainableMethods).forEach((mockFn) => {
  if (mockFn !== mockQueryChainableMethods.get) { // Exclude get
    mockFn.mockReturnValue(mockCollectionRef); // Return the mock CollectionRef/Query
  }
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

describe('AdminBaseQueryBuilder', () => {
  let queryBuilder: AdminBaseQueryBuilder<TestData>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset mocks specifically for collectionRef/query
    Object.values(mockQueryChainableMethods).forEach(mockFn => mockFn.mockClear());
    // Reconfigure chainable methods before each test
    Object.values(mockQueryChainableMethods).forEach(mockFn => {
      if (mockFn !== mockQueryChainableMethods.get) {
        mockFn.mockReturnValue(mockCollectionRef);
      }
    });
    mockQueryChainableMethods.get.mockResolvedValue({ // Default mock for get()
        docs: [],
        empty: true,
        size: 0,
    } as any); // Use 'as any' for mock snapshot


    // Instantiate the builder with the mock Firestore and CollectionReference
    queryBuilder = new AdminBaseQueryBuilder<TestData>(mockFirestore, mockCollectionRef as any); // Use 'as any' for constructor
  });

  it('should initialize with the provided firestore and collectionRef', () => {
    expect((queryBuilder as any).firestore).toBe(mockFirestore);
    expect((queryBuilder as any).collectionRef).toBe(mockCollectionRef);
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
      expect(result).toBeInstanceOf(AdminBaseQueryBuilder);
    });

    it('should build query with where constraint', () => {
        const field = 'count';
        const op = '>';
        const value = 5;
        const finalQuery = (queryBuilder as any)._where(field, op, value).buildQuery();

        expect(mockCollectionRef.where).toHaveBeenCalledWith(field, op, value);
        expect(finalQuery).toBe(mockCollectionRef); // Because where returns the mock
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
      expect(result).toBeInstanceOf(AdminBaseQueryBuilder);
    });

     it('should build query with orderBy constraint', () => {
        const field = 'name';
        const finalQuery = queryBuilder.orderBy(field).buildQuery(); // Default 'asc'

        expect(mockCollectionRef.orderBy).toHaveBeenCalledWith(field, 'asc');
        expect(finalQuery).toBe(mockCollectionRef);
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

        expect(mockCollectionRef.limit).toHaveBeenCalledWith(limitNum);
        expect(finalQuery).toBe(mockCollectionRef);
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

        expect(mockCollectionRef.limitToLast).toHaveBeenCalledWith(limitNum);
        expect(finalQuery).toBe(mockCollectionRef);
    });
  });

  // --- Test Cursor Clauses ---
  // Note: Testing cursors thoroughly requires mock DocumentSnapshots
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

        expect(mockCollectionRef.startAt).toHaveBeenCalledWith(value);
        expect(finalQuery).toBe(mockCollectionRef);
    });
  });

  describe('startAfter()', () => {
     it('should build query with startAfter constraint', () => {
        const value = 'After Value';
        const finalQuery = queryBuilder.startAfter(value).buildQuery();

        expect(mockCollectionRef.startAfter).toHaveBeenCalledWith(value);
        expect(finalQuery).toBe(mockCollectionRef);
    });
  });

  describe('endAt()', () => {
     it('should build query with endAt constraint', () => {
        const value = 'End Value';
        const finalQuery = queryBuilder.endAt(value).buildQuery();

        expect(mockCollectionRef.endAt).toHaveBeenCalledWith(value);
        expect(finalQuery).toBe(mockCollectionRef);
    });
  });

  describe('endBefore()', () => {
     it('should build query with endBefore constraint', () => {
        const value = 'Before Value';
        const finalQuery = queryBuilder.endBefore(value).buildQuery();

        expect(mockCollectionRef.endBefore).toHaveBeenCalledWith(value);
        expect(finalQuery).toBe(mockCollectionRef);
    });
  });

  // --- Test Execution ---
  describe('getSnapshot()', () => {
    it('should build query and call get() on the final query object', async () => {
      const mockSnapshotData = { docs: ['doc1'], empty: false, size: 1 } as any;
      mockQueryChainableMethods.get.mockResolvedValue(mockSnapshotData); // Mock get result

      const result = await queryBuilder.limit(10).getSnapshot(); // Add a constraint

      expect(mockCollectionRef.limit).toHaveBeenCalledWith(10); // Ensure build happened
      expect(mockCollectionRef.get).toHaveBeenCalledTimes(1); // get called on the (mocked) final query
      expect(result).toBe(mockSnapshotData);
    });
  });

  describe('get()', () => {
     it('should call getSnapshot and return mapped data', async () => {
        const mockDocs = [
            { data: () => ({ name: 'A', count: 1 } as TestData) },
            { data: () => ({ name: 'B', count: 2 } as TestData) },
        ] as any[]; // Use 'as any[]' for mock docs array
        const mockSnapshotData = { docs: mockDocs, empty: false, size: 2 } as any; // Use 'as any'
        mockQueryChainableMethods.get.mockResolvedValue(mockSnapshotData); // Mock get result

        const result = await queryBuilder.get();

        expect(mockCollectionRef.get).toHaveBeenCalledTimes(1);
        expect(result).toEqual([
            { name: 'A', count: 1 },
            { name: 'B', count: 2 },
        ]);
    });

     it('should return empty array if snapshot is empty', async () => {
        const mockSnapshotData = { docs: [], empty: true, size: 0 } as any; // Use 'as any'
        mockQueryChainableMethods.get.mockResolvedValue(mockSnapshotData); // Mock get result

        const result = await queryBuilder.get();

        expect(mockCollectionRef.get).toHaveBeenCalledTimes(1);
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

    // Check if constraints were added (optional, but good for debugging)
    expect((finalBuilder as any).constraintDefinitions).toHaveLength(4);

    // Check if the build process calls the underlying mock methods correctly
    expect(mockCollectionRef.where).toHaveBeenCalledWith('active', '==', true);
    expect(mockCollectionRef.orderBy).toHaveBeenCalledWith('createdAt', 'desc');
    expect(mockCollectionRef.limit).toHaveBeenCalledWith(5);
    expect(mockCollectionRef.startAfter).toHaveBeenCalledWith('someTimestamp');
    expect(finalQuery).toBe(mockCollectionRef); // Final result of buildQuery is the mock
  });
});