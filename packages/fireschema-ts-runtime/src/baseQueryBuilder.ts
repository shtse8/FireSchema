/**
 * Base functionality for generated QueryBuilder classes.
 */
import {
  Firestore,
  CollectionReference,
  Query,
  QueryConstraint,
  query,
  where as firestoreWhere, // Alias to avoid conflict
  orderBy as firestoreOrderBy, // Alias
  limit as firestoreLimit, // Alias
  limitToLast as firestoreLimitToLast, // Alias
  startAt as firestoreStartAt, // Alias
  startAfter as firestoreStartAfter, // Alias
  endAt as firestoreEndAt, // Alias
  endBefore as firestoreEndBefore, // Alias
  getDocs,
  DocumentSnapshot,
  DocumentData,
  QuerySnapshot,
  WhereFilterOp,
  OrderByDirection,
} from 'firebase/firestore';

/**
 * Abstract base class for FireSchema-generated query builders.
 * Provides common query constraint methods and execution logic.
 *
 * TData: The type of the document data for the collection being queried.
 */
export abstract class BaseQueryBuilder<TData extends DocumentData> {
  protected firestore: Firestore;
  protected collectionRef: CollectionReference<TData>;
  protected constraints: QueryConstraint[] = [];

  constructor(firestore: Firestore, collectionRef: CollectionReference<TData>) {
    this.firestore = firestore;
    this.collectionRef = collectionRef;
  }

  /**
   * Adds a constraint to the query builder.
   * @param constraint The QueryConstraint to add.
   */
  protected addConstraint(constraint: QueryConstraint): this {
    this.constraints.push(constraint);
    return this;
  }

  /**
   * Protected helper to add a 'where' constraint.
   * Generated classes should provide type-safe public methods that call this.
   * @param fieldPath The path to compare
   * @param opStr The operation string.
   * @param value The value for comparison
   * @returns The QueryBuilder instance for chaining.
   */
  protected _where(fieldPath: string, opStr: WhereFilterOp, value: any): this {
    return this.addConstraint(firestoreWhere(fieldPath, opStr, value));
  }

  /**
   * Adds an orderBy clause to the query.
   * @param fieldPath The field to order by (must be a key of TData).
   * @param directionStr Order direction ('asc' or 'desc'). Defaults to 'asc'.
   * @returns The QueryBuilder instance for chaining.
   */
  orderBy(
    fieldPath: keyof TData | string, // Allow string for flexibility, but keyof TData preferred
    directionStr: OrderByDirection = 'asc'
  ): this {
    // Firestore's orderBy requires string, cast needed if keyof TData is used.
    return this.addConstraint(firestoreOrderBy(fieldPath as string, directionStr));
  }

  /**
   * Adds a limit clause to the query.
   * @param limitCount The maximum number of documents to return.
   * @returns The QueryBuilder instance for chaining.
   */
  limit(limitCount: number): this {
    return this.addConstraint(firestoreLimit(limitCount));
  }

  /**
   * Adds a limitToLast clause to the query. Requires an orderBy clause.
   * @param limitCount The maximum number of documents to return from the end.
   * @returns The QueryBuilder instance for chaining.
   */
  limitToLast(limitCount: number): this {
    return this.addConstraint(firestoreLimitToLast(limitCount));
  }

  // --- Cursor Methods ---

  /**
   * Modifies the query to start at the provided document snapshot or field values (inclusive).
   * @param snapshotOrFieldValue The snapshot or the first field value to start at.
   * @param fieldValues Additional field values for multi-field ordering.
   * @returns The QueryBuilder instance for chaining.
   */
  startAt(
    snapshotOrFieldValue: DocumentSnapshot<TData> | unknown,
    ...fieldValues: unknown[]
  ): this {
    return this.addConstraint(firestoreStartAt(snapshotOrFieldValue, ...fieldValues));
  }

  /**
   * Modifies the query to start after the provided document snapshot or field values (exclusive).
   * @param snapshotOrFieldValue The snapshot or the first field value to start after.
   * @param fieldValues Additional field values for multi-field ordering.
   * @returns The QueryBuilder instance for chaining.
   */
  startAfter(
    snapshotOrFieldValue: DocumentSnapshot<TData> | unknown,
    ...fieldValues: unknown[]
  ): this {
    return this.addConstraint(firestoreStartAfter(snapshotOrFieldValue, ...fieldValues));
  }

  /**
   * Modifies the query to end before the provided document snapshot or field values (exclusive).
   * @param snapshotOrFieldValue The snapshot or the first field value to end before.
   * @param fieldValues Additional field values for multi-field ordering.
   * @returns The QueryBuilder instance for chaining.
   */
  endBefore(
    snapshotOrFieldValue: DocumentSnapshot<TData> | unknown,
    ...fieldValues: unknown[]
  ): this {
    return this.addConstraint(firestoreEndBefore(snapshotOrFieldValue, ...fieldValues));
  }

  /**
   * Modifies the query to end at the provided document snapshot or field values (inclusive).
   * @param snapshotOrFieldValue The snapshot or the first field value to end at.
   * @param fieldValues Additional field values for multi-field ordering.
   * @returns The QueryBuilder instance for chaining.
   */
  endAt(
    snapshotOrFieldValue: DocumentSnapshot<TData> | unknown,
    ...fieldValues: unknown[]
  ): this {
    return this.addConstraint(firestoreEndAt(snapshotOrFieldValue, ...fieldValues));
  }

  // --- Execution ---

  /**
   * Builds the final Firestore Query object.
   * @returns The constructed Query<TData>.
   */
  buildQuery(): Query<TData> {
    return query(this.collectionRef, ...this.constraints);
  }

  /**
   * Executes the query and returns the matching documents' data.
   * @returns A promise that resolves with an array of document data (TData[]).
   */
  async get(): Promise<TData[]> {
    const q = this.buildQuery();
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data());
  }

  /**
   * Executes the query and returns the QuerySnapshot.
   * Useful for accessing document snapshots (including IDs) or metadata.
   * @returns A promise that resolves with the QuerySnapshot<TData>.
   */
  async getSnapshot(): Promise<QuerySnapshot<TData>> {
      const q = this.buildQuery();
      return getDocs(q);
  }
}