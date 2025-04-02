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
import { ItemsData } from './items.types.js';













/**
 * A typed builder for creating update operations for 'items' documents, extending BaseUpdateBuilder.
 */
export class ItemsUpdateBuilder extends BaseUpdateBuilder<ItemsData> {

  // Constructor is inherited from BaseUpdateBuilder
  // _docRef and _updateData are managed by the base class

  // --- Field Setters ---






  /** Sets the value for the 'name' field. */
  setName(value: string): this {
    return this._set('name', value);
  }


  /** Sets the value for the 'value' field. */
  setValue(value: number): this {
    return this._set('value', value);
  }

  /** Atomically increments the 'value' field. */
  incrementValue(value: number): this {
    return this._increment('value', value);
  }
  /** Deletes the 'value' field. */
  deleteValue(): this {
    return this._deleteField('value');
  }

  /** Sets the value for the 'createdAt' field. */
  setCreatedAt(value: Timestamp): this {
    return this._set('createdAt', value);
  }

  /** Sets the 'createdAt' field to the server timestamp. */
  setCreatedAtToServerTimestamp(): this {
    return this._serverTimestamp('createdAt');
  }






  /** Sets the value for the 'address.street' field. */
  setAddress_Street(value: string): this {
    return this._set('address.street', value);
  }






  /** Sets the value for the 'address.city' field. */
  setAddress_City(value: string): this {
    return this._set('address.city', value);
  }






  /** Sets the value for the 'address.zip' field. */
  setAddress_Zip(value: string): this {
    return this._set('address.zip', value);
  }

  /** Deletes the 'address.zip' field. */
  deleteAddress_Zip(): this {
    return this._deleteField('address.zip');
  }





  /** Sets the value for the 'address.coords' field. */
  setAddress_Coords(value: { lat: number; lon: number }): this {
    return this._set('address.coords', value);
  }

  /** Deletes the 'address.coords' field. */
  deleteAddress_Coords(): this {
    return this._deleteField('address.coords');
  }





  /** Sets the value for the 'address.coords.lat' field. */
  setAddress_Coords_Lat(value: number): this {
    return this._set('address.coords.lat', value);
  }

  /** Atomically increments the 'address.coords.lat' field. */
  incrementAddress_Coords_Lat(value: number): this {
    return this._increment('address.coords.lat', value);
  }





  /** Sets the value for the 'address.coords.lon' field. */
  setAddress_Coords_Lon(value: number): this {
    return this._set('address.coords.lon', value);
  }

  /** Atomically increments the 'address.coords.lon' field. */
  incrementAddress_Coords_Lon(value: number): this {
    return this._increment('address.coords.lon', value);
  }





  // --- End Field Setters ---

  // commit() method is inherited from BaseUpdateBuilder

  // --- Custom Update Methods Placeholder ---
  // Example: markAsRead() { return this._set('read', true); }
}