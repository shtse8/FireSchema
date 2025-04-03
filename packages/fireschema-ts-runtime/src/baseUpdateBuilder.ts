/**
 * Base functionality for generated UpdateBuilder classes.
 * Designed to work with both firebase (client) and firebase-admin (server) SDKs.
 */
import type {
  DocumentReference as ClientDocumentReference,
  DocumentData as ClientDocumentData,
  FieldValue as ClientFieldValueType,
} from 'firebase/firestore';
// Import client static functions/values
import {
  updateDoc as clientUpdateDoc,
  serverTimestamp as clientServerTimestamp,
  increment as clientIncrement,
  arrayUnion as clientArrayUnion,
  arrayRemove as clientArrayRemove,
  deleteField as clientDeleteField,
} from 'firebase/firestore';

import type {
  DocumentReference as AdminDocumentReference,
  DocumentData as AdminDocumentData,
  // FieldValue is imported as value below
} from 'firebase-admin/firestore';
// Import admin static FieldValue class
import { FieldValue as AdminFieldValue } from 'firebase-admin/firestore';

// --- Re-import shared types ---
import type {
  DocumentReferenceLike,
  FieldValueLike,
  DocumentDataLike,
} from './baseCollection'; // Assuming baseCollection exports these
import { isClientDocumentReference } from './baseCollection'; // Import type guard

/**
 * Abstract base class for FireSchema-generated update builders.
 */
export abstract class BaseUpdateBuilder<TData extends DocumentDataLike> {
  protected _docRef: DocumentReferenceLike<TData>;
  protected _updateData: Record<string, any> = {}; // Internal data accumulator
  protected isClient: boolean;

  constructor(docRef: DocumentReferenceLike<TData>) {
    this._docRef = docRef;
    // Determine SDK type based on the passed reference
    this.isClient = isClientDocumentReference(docRef);
  }

  /**
   * Protected method to add an update operation.
   */
  protected _set(fieldPath: string, value: any | FieldValueLike): this {
    this._updateData[fieldPath] = value;
    return this;
  }

  // --- Common FieldValue Helpers ---

  protected _increment(fieldPath: string, value: number): this {
    const fieldValue = this.isClient
      ? clientIncrement(value)
      : AdminFieldValue.increment(value);
    return this._set(fieldPath, fieldValue);
  }

  protected _arrayUnion(fieldPath: string, values: any[]): this {
    const fieldValue = this.isClient
      ? clientArrayUnion(...values)
      : AdminFieldValue.arrayUnion(...values);
    return this._set(fieldPath, fieldValue);
  }

  protected _arrayRemove(fieldPath: string, values: any[]): this {
    const fieldValue = this.isClient
      ? clientArrayRemove(...values)
      : AdminFieldValue.arrayRemove(...values);
    return this._set(fieldPath, fieldValue);
  }

  protected _serverTimestamp(fieldPath: string): this {
    const fieldValue = this.isClient
      ? clientServerTimestamp()
      : AdminFieldValue.serverTimestamp();
    return this._set(fieldPath, fieldValue);
  }

  protected _deleteField(fieldPath: string): this {
    const fieldValue = this.isClient
      ? clientDeleteField()
      : AdminFieldValue.delete();
    return this._set(fieldPath, fieldValue);
  }

  // --- Commit ---

  /**
   * Commits the accumulated update operations to Firestore.
   */
  async commit(): Promise<void> {
    if (Object.keys(this._updateData).length === 0) {
      console.warn('Update commit called with no changes specified.');
      return Promise.resolve();
    }

    if (this.isClient) {
      // Use client static updateDoc function
      await clientUpdateDoc(this._docRef as ClientDocumentReference<TData>, this._updateData);
    } else {
      // Use admin document reference's update method
      await (this._docRef as AdminDocumentReference<TData>).update(this._updateData);
    }
    // Optional: Clear data after commit
    // this._updateData = {};
  }
}