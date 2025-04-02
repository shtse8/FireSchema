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
import { BaseUpdateBuilder } from '@shtse8/fireschema-runtime'; // Adjust path/package name as needed

// Local Imports
import { UsersData } from './users.types.js';

























import type { AddressesData } from './addresses.types.js';


/**
 * A typed builder for creating update operations for 'users' documents, extending BaseUpdateBuilder.
 */
export class UsersUpdateBuilder extends BaseUpdateBuilder<UsersData> {

  // Constructor is inherited from BaseUpdateBuilder
  // _docRef and _updateData are managed by the base class

  // --- Field Setters ---






  /** Sets the value for the 'displayName' field. */
  setDisplayName(value: string): this {
    return this._set('displayName', value);
  }


  /** Sets the value for the 'email' field. */
  setEmail(value: string): this {
    return this._set('email', value);
  }


  /** Sets the value for the 'createdAt' field. */
  setCreatedAt(value: Timestamp): this {
    return this._set('createdAt', value);
  }

  /** Sets the 'createdAt' field to the server timestamp. */
  setCreatedAtToServerTimestamp(): this {
    return this._serverTimestamp('createdAt');
  }
  /** Deletes the 'createdAt' field. */
  deleteCreatedAt(): this {
    return this._deleteField('createdAt');
  }

  /** Sets the value for the 'lastLogin' field. */
  setLastLogin(value: Timestamp): this {
    return this._set('lastLogin', value);
  }

  /** Deletes the 'lastLogin' field. */
  deleteLastLogin(): this {
    return this._deleteField('lastLogin');
  }

  /** Sets the value for the 'age' field. */
  setAge(value: number): this {
    return this._set('age', value);
  }

  /** Atomically increments the 'age' field. */
  incrementAge(value: number): this {
    return this._increment('age', value);
  }
  /** Deletes the 'age' field. */
  deleteAge(): this {
    return this._deleteField('age');
  }

  /** Sets the value for the 'isActive' field. */
  setIsActive(value: boolean): this {
    return this._set('isActive', value);
  }

  /** Deletes the 'isActive' field. */
  deleteIsActive(): this {
    return this._deleteField('isActive');
  }






  /** Sets the value for the 'settings.theme' field. */
  setSettings_Theme(value: string): this {
    return this._set('settings.theme', value);
  }

  /** Deletes the 'settings.theme' field. */
  deleteSettings_Theme(): this {
    return this._deleteField('settings.theme');
  }





  /** Sets the value for the 'settings.notificationsEnabled' field. */
  setSettings_NotificationsEnabled(value: boolean): this {
    return this._set('settings.notificationsEnabled', value);
  }

  /** Deletes the 'settings.notificationsEnabled' field. */
  deleteSettings_NotificationsEnabled(): this {
    return this._deleteField('settings.notificationsEnabled');
  }



  /** Sets the value for the 'tags' field. */
  setTags(value: string[]): this {
    return this._set('tags', value);
  }

  /** Atomically adds elements to the 'tags' array field. */
  arrayUnionTags(values: string[] | string): this {
    return this._arrayUnion('tags', Array.isArray(values) ? values : [values]);
  }

  /** Atomically removes elements from the 'tags' array field. */
  arrayRemoveTags(values: string[] | string): this {
    return this._arrayRemove('tags', Array.isArray(values) ? values : [values]);
  }
  /** Deletes the 'tags' field. */
  deleteTags(): this {
    return this._deleteField('tags');
  }

  /** Sets the value for the 'primaryAddressRef' field. */
  setPrimaryAddressRef(value: DocumentReference<AddressesData>): this {
    return this._set('primaryAddressRef', value);
  }

  /** Deletes the 'primaryAddressRef' field. */
  deletePrimaryAddressRef(): this {
    return this._deleteField('primaryAddressRef');
  }

  // --- End Field Setters ---

  // commit() method is inherited from BaseUpdateBuilder

  // --- Custom Update Methods Placeholder ---
  // Example: markAsRead() { return this._set('read', true); }
}