/**
 * Admin-side base class for update builders, using Firebase Admin SDK.
 */
import type {
  DocumentReference,
  DocumentData,
  // FieldValue is imported as value below
} from 'firebase-admin/firestore';

// Import admin static FieldValue class
import { FieldValue as AdminFieldValue } from 'firebase-admin/firestore';

export class AdminBaseUpdateBuilder<TData extends DocumentData> {
  protected _docRef: DocumentReference<TData>; // Use SDK's DocumentReference
  protected _updateData: Record<string, any> = {}; // Accumulator

  constructor(docRef: DocumentReference<TData>) {
    this._docRef = docRef;
  }

  /** Protected method to add an update operation. */
  protected _set(fieldPath: string, value: any | AdminFieldValue): this {
    const newBuilder = Object.create(Object.getPrototypeOf(this));
    Object.assign(newBuilder, this);
    newBuilder._updateData = { ...this._updateData, [fieldPath]: value };
    return newBuilder;
  }

  // --- FieldValue Helper Implementations ---

  protected _getIncrementFieldValue(value: number): AdminFieldValue {
    return AdminFieldValue.increment(value);
  }
  protected _getArrayUnionFieldValue(values: any[]): AdminFieldValue {
    return AdminFieldValue.arrayUnion(...values);
  }
  protected _getArrayRemoveFieldValue(values: any[]): AdminFieldValue {
    return AdminFieldValue.arrayRemove(...values);
  }
  protected _getServerTimestampFieldValue(): AdminFieldValue {
    return AdminFieldValue.serverTimestamp();
  }
  protected _getDeleteFieldValue(): AdminFieldValue {
    return AdminFieldValue.delete();
  }

  // --- Public methods using the helpers ---

  protected _increment(fieldPath: string, value: number): this {
    return this._set(fieldPath, this._getIncrementFieldValue(value));
  }
  protected _arrayUnion(fieldPath: string, values: any[]): this {
    return this._set(fieldPath, this._getArrayUnionFieldValue(values));
  }
  protected _arrayRemove(fieldPath: string, values: any[]): this {
    return this._set(fieldPath, this._getArrayRemoveFieldValue(values));
  }
  protected _serverTimestamp(fieldPath: string): this {
    return this._set(fieldPath, this._getServerTimestampFieldValue());
  }
  protected _deleteField(fieldPath: string): this {
    return this._set(fieldPath, this._getDeleteFieldValue());
  }

  // --- Commit Method ---

  async commit(): Promise<FirebaseFirestore.WriteResult> {
    if (Object.keys(this._updateData).length === 0) {
      console.warn('Update commit called with no changes specified.');
      // Admin SDK update returns WriteResult, maybe return a specific "empty" result?
      // For now, just resolve without error, mimicking no-op.
      // Consider what the expected return type should be for a no-op commit.
      return Promise.resolve({} as FirebaseFirestore.WriteResult); // Placeholder
    }
    // Use documentRef's update method
    return this._docRef.update(this._updateData);
    // Optional: Clear data after commit
    // this._updateData = {};
  }
}