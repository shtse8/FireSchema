/**
 * Generated by firestore-odm
 * Do not edit manually.
 */
import {
  Firestore,
  CollectionReference,
  Query,
  QueryConstraint,
  query,
  where as firestoreWhere, // Alias to avoid conflict with generated methods
  orderBy,
  limit,
  getDocs,
  // Add other query-related imports as needed (startAt, endAt, etc.)
} from 'firebase/firestore';
import { PostsData } from './posts.types';

// Define order direction
type OrderByDirection = 'desc' | 'asc';

/**
 * A typed query builder for the 'posts' collection.
 */
export class PostsQueryBuilder {
  private firestore: Firestore;
  private collectionRef: CollectionReference<PostsData>;
  private constraints: QueryConstraint[] = [];

  constructor(firestore: Firestore, collectionRef: CollectionReference<PostsData>) {
    this.firestore = firestore;
    this.collectionRef = collectionRef;
  }

// --- Field-specific Where Methods ---
  // Overloads for 'title' field type safety based on operator
  whereTitle(op: '==', value: string): this;
  whereTitle(op: '!=', value: string): this;
  whereTitle(op: '<', value: string): this;
  whereTitle(op: '<=', value: string): this;
  whereTitle(op: '>', value: string): this;
  whereTitle(op: '>=', value: string): this;
  whereTitle(op: 'in', value: string[]): this;
  whereTitle(op: 'not-in', value: string[]): this;
  // Implementation signature for 'title'
  whereTitle(
    op: string, // Use string for implementation signature
    value: any   // Use any for implementation signature
  ): this {
    this.constraints.push(firestoreWhere('title', op as WhereFilterOp, value));
    return this;
  }
  // Overloads for 'content' field type safety based on operator
  whereContent(op: '==', value: string): this;
  whereContent(op: '!=', value: string): this;
  whereContent(op: '<', value: string): this;
  whereContent(op: '<=', value: string): this;
  whereContent(op: '>', value: string): this;
  whereContent(op: '>=', value: string): this;
  whereContent(op: 'in', value: string[]): this;
  whereContent(op: 'not-in', value: string[]): this;
  // Implementation signature for 'content'
  whereContent(
    op: string, // Use string for implementation signature
    value: any   // Use any for implementation signature
  ): this {
    this.constraints.push(firestoreWhere('content', op as WhereFilterOp, value));
    return this;
  }
  // Overloads for 'publishedAt' field type safety based on operator
  wherePublishedAt(op: '==', value: Timestamp): this;
  wherePublishedAt(op: '!=', value: Timestamp): this;
  wherePublishedAt(op: '<', value: Timestamp): this;
  wherePublishedAt(op: '<=', value: Timestamp): this;
  wherePublishedAt(op: '>', value: Timestamp): this;
  wherePublishedAt(op: '>=', value: Timestamp): this;
  wherePublishedAt(op: 'in', value: Timestamp[]): this;
  wherePublishedAt(op: 'not-in', value: Timestamp[]): this;
  // Implementation signature for 'publishedAt'
  wherePublishedAt(
    op: string, // Use string for implementation signature
    value: any   // Use any for implementation signature
  ): this {
    this.constraints.push(firestoreWhere('publishedAt', op as WhereFilterOp, value));
    return this;
  }
  // --- End Field-specific Where Methods ---

  /**
   * Adds an orderBy clause to the query.
   *
   * @param fieldPath The field to order by.
   * @param directionStr Order direction ('asc' or 'desc'). Defaults to 'asc'.
   * @returns The QueryBuilder instance for chaining.
   */
  orderBy(
    fieldPath: keyof PostsData,
    directionStr: OrderByDirection = 'asc'
  ): this {
    this.constraints.push(orderBy(fieldPath as string, directionStr));
    return this;
  }

  /**
   * Adds a limit clause to the query.
   *
   * @param limitCount The maximum number of documents to return.
   * @returns The QueryBuilder instance for chaining.
   */
  limit(limitCount: number): this {
    this.constraints.push(limit(limitCount));
    return this;
  }

  // TODO: Add limitToLast, startAt, startAfter, endAt, endBefore methods

  /**
   * Executes the query and returns the matching documents.
   *
   * @returns A promise that resolves with an array of document data.
   */
  async get(): Promise<PostsData[]> {
    const q = query(this.collectionRef, ...this.constraints);
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data());
    // TODO: Consider returning document IDs as well, maybe { id: string, data: ModelData }[]
  }
}