/**
 * Client-side base class for update builders, using Firebase JS Client SDK v9+.
 */
import type {
  DocumentReference,
  DocumentData,
  FieldValue, // Import FieldValue type
} from 'firebase/firestore';

// Import client static functions/values for updates
import {
  updateDoc,
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove,
  deleteField,
} from 'firebase/firestore';

export class ClientBaseUpdateBuilder<TData extends DocumentData> {
  protected _docRef: DocumentReference<TData>; // Use SDK's DocumentReference
  protected _updateData: Record<string, any> = {}; // Accumulator

  constructor(docRef: DocumentReference<TData>) {
    this._docRef = docRef;
  }

  /** Protected method to add an update operation. */
  _set(fieldPath: string, value: any | FieldValue): this {
    const newBuilder = Object.create(Object.getPrototypeOf(this));
    Object.assign(newBuilder, this);
    newBuilder._updateData = { ...this._updateData, [fieldPath]: value };
    return newBuilder;
  }

  // --- FieldValue Helper Implementations ---

  protected _getIncrementFieldValue(value: number): FieldValue {
    return increment(value);
  }
  protected _getArrayUnionFieldValue(values: any[]): FieldValue {
    return arrayUnion(...values);
  }
  protected _getArrayRemoveFieldValue(values: any[]): FieldValue {
    return arrayRemove(...values);
  }
  protected _getServerTimestampFieldValue(): FieldValue {
    return serverTimestamp();
  }
  protected _getDeleteFieldValue(): FieldValue {
    return deleteField();
  }

  // --- Public methods using the helpers ---

  _increment(fieldPath: string, value: number): this {
    return this._set(fieldPath, this._getIncrementFieldValue(value));
  }
  _arrayUnion(fieldPath: string, values: any[]): this {
    return this._set(fieldPath, this._getArrayUnionFieldValue(values));
  }
  _arrayRemove(fieldPath: string, values: any[]): this {
    return this._set(fieldPath, this._getArrayRemoveFieldValue(values));
  }
  _serverTimestamp(fieldPath: string): this {
    return this._set(fieldPath, this._getServerTimestampFieldValue());
  }
  _deleteField(fieldPath: string): this {
    return this._set(fieldPath, this._getDeleteFieldValue());
  }

  // --- Commit Method ---

  async commit(): Promise<void> {
    if (Object.keys(this._updateData).length === 0) {
      console.warn('Update commit called with no changes specified.');
      return Promise.resolve();
    }
    // Use top-level updateDoc function
    await updateDoc(this._docRef, this._updateData);
    // Optional: Clear data after commit
    // this._updateData = {};
  }
}