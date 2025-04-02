import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { BaseQueryBuilder } from '../baseQueryBuilder';
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
  QuerySnapshot // Add missing import
  // Add other necessary Firestore query types/functions
} from 'firebase/firestore';

// Mock the 'firebase/firestore' module for query functions
const mockCollection = jest.fn<(...args: any[]) => CollectionReference<TestData>>();
const mockQuery = jest.fn<(...args: any[]) => Query<TestData>>();
const mockWhere = jest.fn<(...args: any[]) => QueryConstraint>();
const mockOrderBy = jest.fn<(...args: any[]) => QueryConstraint>();
const mockLimit = jest.fn<(...args: any[]) => QueryConstraint>();
const mockStartAt = jest.fn<(...args: any[]) => QueryConstraint>();
const mockStartAfter = jest.fn<(...args: any[]) => QueryConstraint>();
const mockEndAt = jest.fn<(...args: any[]) => QueryConstraint>();
const mockEndBefore = jest.fn<(...args: any[]) => QueryConstraint>();
const mockGetDocs = jest.fn<(...args: any[]) => Promise<QuerySnapshot<TestData>>>();
const mockLimitToLast = jest.fn<(...args: any[]) => QueryConstraint>();
const mockServerTimestamp = jest.fn(() => 'mockServerTimestampValue');

jest.mock('firebase/firestore', () => ({
  collection: (...args: any[]) => mockCollection(...args),
  doc: jest.fn().mockReturnValue({ id: 'mockDocId', path: 'col/mockDocId' }),
  query: (...args: any[]) => mockQuery(...args),
  where: (...args: any[]) => mockWhere(...args),
  orderBy: (...args: any[]) => mockOrderBy(...args),
  limit: (...args: any[]) => mockLimit(...args),
  startAt: (...args: any[]) => mockStartAt(...args),
  startAfter: (...args: any[]) => mockStartAfter(...args),
  endAt: (...args: any[]) => mockEndAt(...args),
  endBefore: (...args: any[]) => mockEndBefore(...args),
  getDocs: (...args: any[]) => mockGetDocs(...args),
  limitToLast: (...args: any[]) => mockLimitToLast(...args),
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

// Concrete implementation for testing
class TestQueryBuilder extends BaseQueryBuilder<TestData> {
  constructor(firestore: Firestore, collectionRef: CollectionReference<TestData>) {
    super(firestore, collectionRef);
  }
}

describe('BaseQueryBuilder', () => {
  let mockFirestore: Firestore;
  let mockCollectionRef: CollectionReference<TestData>;
  let testQueryBuilder: TestQueryBuilder;

  beforeEach(() => {
    jest.clearAllMocks();

    mockFirestore = {} as Firestore;
    mockCollectionRef = { id: 'testItems', path: 'testItems' } as CollectionReference<TestData>;
    testQueryBuilder = new TestQueryBuilder(mockFirestore, mockCollectionRef);

    mockQuery.mockClear();
    mockWhere.mockClear();
    mockOrderBy.mockClear();
    mockLimit.mockClear();
    mockGetDocs.mockClear();
    mockLimitToLast.mockClear();
    mockStartAt.mockClear();
    mockStartAfter.mockClear();
    mockEndAt.mockClear();
    mockEndBefore.mockClear();
  });

  it('should initialize with the correct firestore and collection reference', () => {
    expect(testQueryBuilder).toBeInstanceOf(BaseQueryBuilder);
    expect((testQueryBuilder as any).firestore).toBe(mockFirestore);
    expect((testQueryBuilder as any).collectionRef).toBe(mockCollectionRef);
    expect((testQueryBuilder as any).constraints).toEqual([]);
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it('should add a where constraint via _where', () => {
    const mockWhereConstraint = { type: 'whereConstraint' } as unknown as QueryConstraint;
    mockWhere.mockReturnValue(mockWhereConstraint);
    const result = (testQueryBuilder as any)._where('name', '==', 'Test');
    expect(result).toBe(testQueryBuilder);
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
    mockLimitToLast.mockReturnValue(mockLimitToLastConstraint);
    const result = testQueryBuilder.limitToLast(5);
    expect(result).toBe(testQueryBuilder);
    expect(mockLimitToLast).toHaveBeenCalledTimes(1);
    expect(mockLimitToLast).toHaveBeenCalledWith(5);
    expect((testQueryBuilder as any).constraints).toContain(mockLimitToLastConstraint);
  });

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
    const mockSnapshot = { id: 'doc1' } as any;
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
    const mockSnapshot = { id: 'doc2' } as any;
    mockEndAt.mockReturnValue(mockEndAtConstraint);
    const result = testQueryBuilder.endAt(mockSnapshot);
    expect(result).toBe(testQueryBuilder);
    expect(mockEndAt).toHaveBeenCalledTimes(1);
    expect(mockEndAt).toHaveBeenCalledWith(mockSnapshot);
    expect((testQueryBuilder as any).constraints).toContain(mockEndAtConstraint);
  });

  it('should build query and call getDocs on get()', async () => {
    const mockFinalQuery = { type: 'finalQuery' } as unknown as Query<TestData>;
    const mockSnapshot = {
      docs: [
        { id: 'docA', ref: {} as any, exists: function(this: any): this is any { return true; }, metadata: {} as any, get: jest.fn(), data: () => ({ name: 'A', value: 1, active: true }) },
        { id: 'docB', ref: {} as any, exists: function(this: any): this is any { return true; }, metadata: {} as any, get: jest.fn(), data: () => ({ name: 'B', value: 2, active: false }) },
      ],
      metadata: {} as any,
      query: {} as any,
      size: 2,
      empty: false,
      forEach: jest.fn(),
      docChanges: jest.fn(() => []),
    };
    mockQuery.mockReturnValue(mockFinalQuery);
    mockGetDocs.mockResolvedValue(mockSnapshot as QuerySnapshot<TestData>); // Cast to satisfy type

    (testQueryBuilder as any)._where('active', '==', true);
    testQueryBuilder.orderBy('value');

    const results = await testQueryBuilder.get();

    expect(mockQuery).toHaveBeenCalledTimes(1);
    expect(mockQuery).toHaveBeenCalledWith(mockCollectionRef, expect.any(Object), expect.any(Object));
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
      docs: [],
      size: 0,
      empty: true,
      metadata: {} as any,
      query: {} as any,
      forEach: jest.fn(),
      docChanges: jest.fn(() => []),
    };
    mockQuery.mockReturnValue(mockFinalQuery);
    mockGetDocs.mockResolvedValue(mockSnapshot as QuerySnapshot<TestData>); // Cast to satisfy type

    testQueryBuilder.limit(5);

    const snapshotResult = await testQueryBuilder.getSnapshot();

    expect(mockQuery).toHaveBeenCalledTimes(1);
    expect(mockQuery).toHaveBeenCalledWith(mockCollectionRef, expect.any(Object));
    expect(mockGetDocs).toHaveBeenCalledTimes(1);
    expect(mockGetDocs).toHaveBeenCalledWith(mockFinalQuery);
    expect(snapshotResult).toBe(mockSnapshot);
  });
});