/**
 * Base functionality for generated UpdateBuilder classes.
 */
import {
  DocumentReference,
  updateDoc,
  FieldValue, // Import FieldValue type itself
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove,
  deleteField,
  DocumentData,
} from 'firebase/firestore';

/**
 * Abstract base class for FireSchema-generated update builders.
 * Provides common logic for accumulating updates and committing them.
 *
 * TData: The type of the document data being updated.
 */
export abstract class BaseUpdateBuilder<TData extends DocumentData> {
  protected _docRef: DocumentReference<TData>;
  protected _updateData: Record<string, any> = {}; // Internal data accumulator

  constructor(docRef: DocumentReference<TData>) {
    this._docRef = docRef;
  }

  /**
   * Protected method to add an update operation to the internal data object.
   * Generated classes should provide type-safe public methods that call this.
   * Handles simple value setting and FieldValue operations.
   *
   * @param fieldPath The dot-notation path of the field to update.
   * @param value The value or FieldValue operation to apply.
   * @returns The UpdateBuilder instance for chaining.
   */
  protected _set(fieldPath: string, value: any | FieldValue): this {
    this._updateData[fieldPath] = value;
    return this;
  }

  // --- Common FieldValue Helpers (Optional Convenience) ---
  // These could be called by generated methods if desired, or generated methods
  // can construct the FieldValues directly.

  protected _increment(fieldPath: string, value: number): this {
    return this._set(fieldPath, increment(value));
  }

  protected _arrayUnion(fieldPath: string, values: any[]): this {
    return this._set(fieldPath, arrayUnion(...values));
  }

  protected _arrayRemove(fieldPath: string, values: any[]): this {
    return this._set(fieldPath, arrayRemove(...values));
  }

  protected _serverTimestamp(fieldPath: string): this {
    return this._set(fieldPath, serverTimestamp());
  }

  protected _deleteField(fieldPath: string): this {
    return this._set(fieldPath, deleteField());
  }

  // --- Commit ---

  /**
   * Commits the accumulated update operations to Firestore.
   * @returns A promise that resolves when the update is complete.
   */
  async commit(): Promise<void> {
    if (Object.keys(this._updateData).length === 0) {
      // Avoid unnecessary Firestore calls if no updates were staged.
      console.warn('Update commit called with no changes specified.');
      return Promise.resolve(); // Return a resolved promise
    }
    // Type assertion needed because updateDoc's UpdateData<T> is complex
    // and Record<string, any> is a simplified internal representation.
    await updateDoc(this._docRef, this._updateData as any);
    // Clear data after commit to prevent accidental re-use? Optional.
    // this._updateData = {};
  }
}