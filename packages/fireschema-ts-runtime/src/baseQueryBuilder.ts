/**
 * Base functionality for generated QueryBuilder classes.
 * Designed to work with both firebase (client) and firebase-admin (server) SDKs.
 */
import type {
  Firestore as ClientFirestore,
  CollectionReference as ClientCollectionReference,
  Query as ClientQuery,
  QueryConstraint as ClientQueryConstraint,
  DocumentSnapshot as ClientDocumentSnapshot,
  DocumentData as ClientDocumentData,
  QuerySnapshot as ClientQuerySnapshot,
  WhereFilterOp as ClientWhereFilterOp,
  OrderByDirection as ClientOrderByDirection,
} from 'firebase/firestore';
// Import client static functions
import {
  query as clientQuery,
  where as clientWhere,
  orderBy as clientOrderBy,
  limit as clientLimit,
  limitToLast as clientLimitToLast,
  startAt as clientStartAt,
  startAfter as clientStartAfter,
  endAt as clientEndAt,
  endBefore as clientEndBefore,
  getDocs as clientGetDocs,
} from 'firebase/firestore';

import type {
  Firestore as AdminFirestore,
  CollectionReference as AdminCollectionReference,
  Query as AdminQuery,
  DocumentSnapshot as AdminDocumentSnapshot,
  DocumentData as AdminDocumentData,
  QuerySnapshot as AdminQuerySnapshot,
  WhereFilterOp as AdminWhereFilterOp,
  OrderByDirection as AdminOrderByDirection,
  FieldPath as AdminFieldPath, // Import FieldPath for admin
} from 'firebase-admin/firestore';

// --- Re-import shared types from baseCollection ---
import type {
  FirestoreLike,
  CollectionReferenceLike,
  DocumentSnapshotLike,
  DocumentDataLike,
} from './baseCollection';
import { isClientFirestore } from './baseCollection'; // Import type guard

// --- Generic Type Aliases/Interfaces ---
export type QueryLike<T extends DocumentDataLike> = ClientQuery<T> | AdminQuery<T>;
export type QuerySnapshotLike<T extends DocumentDataLike> = ClientQuerySnapshot<T> | AdminQuerySnapshot<T>;
export type WhereFilterOpLike = ClientWhereFilterOp | AdminWhereFilterOp;
export type OrderByDirectionLike = ClientOrderByDirection | AdminOrderByDirection;

// --- Constraint Definition Interfaces ---
type ConstraintType = 'where' | 'orderBy' | 'limit' | 'limitToLast' | 'startAt' | 'startAfter' | 'endAt' | 'endBefore';

interface BaseConstraint {
  type: ConstraintType;
}
interface WhereConstraint extends BaseConstraint {
  type: 'where';
  fieldPath: string | AdminFieldPath; // Allow FieldPath for admin
  opStr: WhereFilterOpLike;
  value: any;
}
interface OrderByConstraint extends BaseConstraint {
  type: 'orderBy';
  fieldPath: string | AdminFieldPath;
  directionStr: OrderByDirectionLike;
}
interface LimitConstraint extends BaseConstraint {
  type: 'limit' | 'limitToLast';
  limitCount: number;
}
interface CursorConstraint extends BaseConstraint {
  type: 'startAt' | 'startAfter' | 'endAt' | 'endBefore';
  // Use 'any' for snapshotOrFieldValue to avoid complex admin/client snapshot type issues here
  snapshotOrFieldValue: any;
  fieldValues: unknown[];
}

type QueryConstraintDefinition = WhereConstraint | OrderByConstraint | LimitConstraint | CursorConstraint;


/**
 * Abstract base class for FireSchema-generated query builders.
 */
export abstract class BaseQueryBuilder<TData extends DocumentDataLike> {
  protected firestore: FirestoreLike;
  protected collectionRef: CollectionReferenceLike<TData>;
  // Store definitions instead of results of static functions
  protected constraintDefinitions: QueryConstraintDefinition[] = [];
  protected isClient: boolean;

  constructor(firestore: FirestoreLike, collectionRef: CollectionReferenceLike<TData>) {
    this.firestore = firestore;
    this.collectionRef = collectionRef;
    this.isClient = isClientFirestore(firestore);
  }

  /**
   * Adds a constraint definition to the query builder.
   */
  protected addConstraintDefinition(definition: QueryConstraintDefinition): this {
    this.constraintDefinitions.push(definition);
    return this;
  }

  /**
   * Protected helper to add a 'where' constraint definition.
   */
  protected _where(fieldPath: string | AdminFieldPath, opStr: WhereFilterOpLike, value: any): this {
    return this.addConstraintDefinition({ type: 'where', fieldPath, opStr, value });
  }

  /**
   * Adds an orderBy clause definition.
   */
  orderBy(
    fieldPath: keyof TData | string | AdminFieldPath, // Allow FieldPath for admin
    directionStr: OrderByDirectionLike = 'asc'
  ): this {
    return this.addConstraintDefinition({ type: 'orderBy', fieldPath: fieldPath as string | AdminFieldPath, directionStr });
  }

  /**
   * Adds a limit clause definition.
   */
  limit(limitCount: number): this {
    return this.addConstraintDefinition({ type: 'limit', limitCount });
  }

  /**
   * Adds a limitToLast clause definition.
   */
  limitToLast(limitCount: number): this {
    return this.addConstraintDefinition({ type: 'limitToLast', limitCount });
  }

  // --- Cursor Methods ---

  startAt(
    snapshotOrFieldValue: DocumentSnapshotLike<TData> | unknown,
    ...fieldValues: unknown[]
  ): this {
    return this.addConstraintDefinition({ type: 'startAt', snapshotOrFieldValue, fieldValues });
  }

  startAfter(
    snapshotOrFieldValue: DocumentSnapshotLike<TData> | unknown,
    ...fieldValues: unknown[]
  ): this {
    return this.addConstraintDefinition({ type: 'startAfter', snapshotOrFieldValue, fieldValues });
  }

  endBefore(
    snapshotOrFieldValue: DocumentSnapshotLike<TData> | unknown,
    ...fieldValues: unknown[]
  ): this {
    return this.addConstraintDefinition({ type: 'endBefore', snapshotOrFieldValue, fieldValues });
  }

  endAt(
    snapshotOrFieldValue: DocumentSnapshotLike<TData> | unknown,
    ...fieldValues: unknown[]
  ): this {
    return this.addConstraintDefinition({ type: 'endAt', snapshotOrFieldValue, fieldValues });
  }

  // --- Execution ---

  /**
   * Builds the final Firestore Query object based on the stored definitions.
   */
  buildQuery(): QueryLike<TData> {
    if (this.isClient) {
      // Build client query using static helpers
      const clientConstraints: ClientQueryConstraint[] = this.constraintDefinitions.map(def => {
        switch (def.type) {
          case 'where':       return clientWhere(def.fieldPath as string, def.opStr, def.value);
          case 'orderBy':     return clientOrderBy(def.fieldPath as string, def.directionStr);
          case 'limit':       return clientLimit(def.limitCount);
          case 'limitToLast': return clientLimitToLast(def.limitCount);
          case 'startAt':     return clientStartAt(def.snapshotOrFieldValue, ...def.fieldValues);
          case 'startAfter':  return clientStartAfter(def.snapshotOrFieldValue, ...def.fieldValues);
          case 'endAt':       return clientEndAt(def.snapshotOrFieldValue, ...def.fieldValues);
          case 'endBefore':   return clientEndBefore(def.snapshotOrFieldValue, ...def.fieldValues);
          default: throw new Error(`Unsupported client constraint type: ${(def as any).type}`);
        }
      });
      return clientQuery(this.collectionRef as ClientCollectionReference<TData>, ...clientConstraints);

    } else {
      // Build admin query using chaining methods
      let adminQuery: AdminQuery<TData> = this.collectionRef as AdminCollectionReference<TData>; // Start with collection ref
      this.constraintDefinitions.forEach(def => {
        switch (def.type) {
          case 'where':
            adminQuery = adminQuery.where(def.fieldPath, def.opStr, def.value);
            break;
          case 'orderBy':
            adminQuery = adminQuery.orderBy(def.fieldPath, def.directionStr);
            break;
          case 'limit':
            adminQuery = adminQuery.limit(def.limitCount);
            break;
          case 'limitToLast':
            adminQuery = adminQuery.limitToLast(def.limitCount);
            break;
          case 'startAt':
            adminQuery = adminQuery.startAt(def.snapshotOrFieldValue, ...def.fieldValues);
            break;
          case 'startAfter':
            adminQuery = adminQuery.startAfter(def.snapshotOrFieldValue, ...def.fieldValues);
            break;
          case 'endAt':
            adminQuery = adminQuery.endAt(def.snapshotOrFieldValue, ...def.fieldValues);
            break;
          case 'endBefore':
            adminQuery = adminQuery.endBefore(def.snapshotOrFieldValue, ...def.fieldValues);
            break;
          default: throw new Error(`Unsupported admin constraint type: ${(def as any).type}`);
        }
      });
      return adminQuery;
    }
  }

  /**
   * Executes the query and returns the matching documents' data.
   */
  async get(): Promise<TData[]> {
    const q = this.buildQuery();
    const snapshot = await this.getSnapshotInternal(q);
    return snapshot.docs.map(doc => doc.data());
  }

  /**
   * Executes the query and returns the QuerySnapshot.
   */
  async getSnapshot(): Promise<QuerySnapshotLike<TData>> {
    const q = this.buildQuery();
    return this.getSnapshotInternal(q);
  }

  /** Internal helper to fetch snapshot based on SDK */
  private async getSnapshotInternal(q: QueryLike<TData>): Promise<QuerySnapshotLike<TData>> {
      if (this.isClient) {
          // Use client static helper
          return clientGetDocs(q as ClientQuery<TData>);
      } else {
          // Use admin query's get() method
          return (q as AdminQuery<TData>).get();
      }
  }
}