/**
 * Client-side base class for query builders, using Firebase JS Client SDK v9+.
 */
import type {
  Firestore,
  CollectionReference,
  Query,
  QueryConstraint,
  DocumentSnapshot,
  DocumentData,
  QuerySnapshot,
  WhereFilterOp,
  OrderByDirection,
} from 'firebase/firestore';

// Import client static functions for building queries and constraints
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

// Define local types for constraints (can be simple for now)
export type ClientWhereFilterOp = WhereFilterOp;
export type ClientOrderByDirection = OrderByDirection;

// Internal constraint definition structure
type ConstraintType = 'where' | 'orderBy' | 'limit' | 'limitToLast' | 'startAt' | 'startAfter' | 'endAt' | 'endBefore';
interface BaseConstraint { type: ConstraintType; }
interface WhereConstraint extends BaseConstraint { type: 'where'; fieldPath: string; opStr: ClientWhereFilterOp; value: any; }
interface OrderByConstraint extends BaseConstraint { type: 'orderBy'; fieldPath: string; directionStr: ClientOrderByDirection; }
interface LimitConstraint extends BaseConstraint { type: 'limit' | 'limitToLast'; limitCount: number; }
interface CursorConstraint extends BaseConstraint { type: 'startAt' | 'startAfter' | 'endAt' | 'endBefore'; snapshotOrFieldValue: any; fieldValues: unknown[]; }
type QueryConstraintDefinition = WhereConstraint | OrderByConstraint | LimitConstraint | CursorConstraint;


export class ClientBaseQueryBuilder<TData extends DocumentData> {
  protected firestore: Firestore;
  protected collectionRef: CollectionReference<TData>;
  protected constraintDefinitions: QueryConstraintDefinition[] = [];

  constructor(firestore: Firestore, collectionRef: CollectionReference<TData>) {
    this.firestore = firestore;
    this.collectionRef = collectionRef;
  }

  /** Adds a constraint definition immutably. */
  protected addConstraintDefinition(definition: QueryConstraintDefinition): this {
    const newBuilder = Object.create(Object.getPrototypeOf(this));
    Object.assign(newBuilder, this);
    newBuilder.constraintDefinitions = [...this.constraintDefinitions, definition];
    return newBuilder;
  }

  /** Protected helper to add a 'where' constraint. */
  protected _where(fieldPath: string, opStr: ClientWhereFilterOp, value: any): this {
    return this.addConstraintDefinition({ type: 'where', fieldPath, opStr, value });
  }

  /** Adds an orderBy clause. */
  orderBy(
    fieldPath: keyof TData | string,
    directionStr: ClientOrderByDirection = 'asc'
  ): this {
    return this.addConstraintDefinition({ type: 'orderBy', fieldPath: fieldPath as string, directionStr });
  }

  /** Adds a limit clause. */
  limit(limitCount: number): this {
    return this.addConstraintDefinition({ type: 'limit', limitCount });
  }

  /** Adds a limitToLast clause. */
  limitToLast(limitCount: number): this {
    return this.addConstraintDefinition({ type: 'limitToLast', limitCount });
  }

  // --- Cursor Methods ---
  startAt(snapshotOrFieldValue: DocumentSnapshot<TData> | unknown, ...fieldValues: unknown[]): this {
    return this.addConstraintDefinition({ type: 'startAt', snapshotOrFieldValue, fieldValues });
  }
  startAfter(snapshotOrFieldValue: DocumentSnapshot<TData> | unknown, ...fieldValues: unknown[]): this {
    return this.addConstraintDefinition({ type: 'startAfter', snapshotOrFieldValue, fieldValues });
  }
  endBefore(snapshotOrFieldValue: DocumentSnapshot<TData> | unknown, ...fieldValues: unknown[]): this {
    return this.addConstraintDefinition({ type: 'endBefore', snapshotOrFieldValue, fieldValues });
  }
  endAt(snapshotOrFieldValue: DocumentSnapshot<TData> | unknown, ...fieldValues: unknown[]): this {
    return this.addConstraintDefinition({ type: 'endAt', snapshotOrFieldValue, fieldValues });
  }

  // --- Execution ---

  /** Builds the final Firestore Query object. */
  buildQuery(): Query<TData> {
    const clientConstraints: QueryConstraint[] = this.constraintDefinitions.map(def => {
      switch (def.type) {
        case 'where':       return where(def.fieldPath, def.opStr, def.value);
        case 'orderBy':     return orderBy(def.fieldPath, def.directionStr);
        case 'limit':       return limit(def.limitCount);
        case 'limitToLast': return limitToLast(def.limitCount);
        case 'startAt':     return startAt(def.snapshotOrFieldValue, ...def.fieldValues);
        case 'startAfter':  return startAfter(def.snapshotOrFieldValue, ...def.fieldValues);
        case 'endAt':       return endAt(def.snapshotOrFieldValue, ...def.fieldValues);
        case 'endBefore':   return endBefore(def.snapshotOrFieldValue, ...def.fieldValues);
        default: throw new Error(`Unsupported client constraint type: ${(def as any).type}`);
      }
    });
    // Use top-level query function
    return query(this.collectionRef, ...clientConstraints);
  }

  /** Executes the query and returns the QuerySnapshot. */
  async getSnapshot(): Promise<QuerySnapshot<TData>> {
    const q = this.buildQuery();
    // Use top-level getDocs function
    return getDocs(q);
  }

  /** Executes the query and returns the matching documents' data. */
  async get(): Promise<TData[]> {
    const snapshot = await this.getSnapshot();
    return snapshot.docs.map(doc => doc.data());
  }
}