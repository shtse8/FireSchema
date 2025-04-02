/**
 * Generated by firestore-odm
 * Do not edit manually.
 */
import {
  DocumentReference,
  // updateDoc, // Handled by base class commit()
  FieldValue, // Keep for potential direct use if needed, though base provides helpers
  Timestamp,  // Needed for timestamp field setters
  // DocumentReference, // Needed for reference field setters (Already imported above)
  // serverTimestamp, // Handled by base class helper _serverTimestamp()
  // increment, // Handled by base class helper _increment()
  // arrayUnion, // Handled by base class helper _arrayUnion()
  // arrayRemove, // Handled by base class helper _arrayRemove()
  // deleteField, // Handled by base class helper _deleteField()
} from 'firebase/firestore';
// Runtime Imports
import { BaseUpdateBuilder } from '@fireschema/ts-runtime'; // Adjust path/package name as needed

// Local Imports
import { TagsData } from './tags.types.js';







/**
 * A typed builder for creating update operations for 'tags' documents, extending BaseUpdateBuilder.
 */
export class TagsUpdateBuilder extends BaseUpdateBuilder<TagsData> {

  // Constructor is inherited from BaseUpdateBuilder
  // _docRef and _updateData are managed by the base class

  // --- Field Setters ---






  /** Sets the value for the 'label' field. */
  setLabel(value: string): this {
    return this._set('label', value);
  }


  // --- End Field Setters ---

  // commit() method is inherited from BaseUpdateBuilder

  // --- Custom Update Methods Placeholder ---
  // Example: markAsRead() { return this._set('read', true); }
}