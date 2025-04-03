/**
 * Admin-side base class for query builders, using Firebase Admin SDK.
 */
import type {
  Firestore,
  CollectionReference,
  Query,
  DocumentSnapshot,
  DocumentData,
  QuerySnapshot,
  WhereFilterOp,
  OrderByDirection,
  FieldPath as AdminFieldPath, // Import Admin FieldPath
} from 'firebase-admin/firestore';

// Define local types for constraints (can be simple for now)
export type AdminWhereFilterOp = WhereFilterOp;
export type AdminOrderByDirection = OrderByDirection;

// Internal constraint definition structure
type ConstraintType = 'where' | 'orderBy' | 'limit' | 'limitToLast' | 'startAt' | 'startAfter' | 'endAt' | 'endBefore';
interface BaseConstraint { type: ConstraintType; }
interface WhereConstraint extends BaseConstraint { type: 'where'; fieldPath: string | AdminFieldPath; opStr: AdminWhereFilterOp; value: any; }
interface OrderByConstraint extends BaseConstraint { type: 'orderBy'; fieldPath: string | AdminFieldPath; directionStr: AdminOrderByDirection; }
interface LimitConstraint extends BaseConstraint { type: 'limit' | 'limitToLast'; limitCount: number; }
interface CursorConstraint extends BaseConstraint { type: 'startAt' | 'startAfter' | 'endAt' | 'endBefore'; snapshotOrFieldValue: any; fieldValues: unknown[]; }
type QueryConstraintDefinition = WhereConstraint | OrderByConstraint | LimitConstraint | CursorConstraint;


export class AdminBaseQueryBuilder<TData extends DocumentData> {
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
  protected _where(fieldPath: string | AdminFieldPath, opStr: AdminWhereFilterOp, value: any): this {
    return this.addConstraintDefinition({ type: 'where', fieldPath, opStr, value });
  }

  /** Adds an orderBy clause. */
  orderBy(
    fieldPath: string | AdminFieldPath, // Correct type for Admin SDK
    directionStr: AdminOrderByDirection = 'asc'
  ): this {
    return this.addConstraintDefinition({ type: 'orderBy', fieldPath, directionStr });
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

  /** Builds the final Firestore Query object using chaining. */
  buildQuery(): Query<TData> {
    let adminQuery: Query<TData> = this.collectionRef; // Start with the collection ref
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

  /** Executes the query and returns the QuerySnapshot. */
  async getSnapshot(): Promise<QuerySnapshot<TData>> {
    const q = this.buildQuery();
    // Use query's get method
    return q.get();
  }

  /** Executes the query and returns the matching documents' data. */
  async get(): Promise<TData[]> {
    const snapshot = await this.getSnapshot();
    return snapshot.docs.map(doc => doc.data());
  }
}