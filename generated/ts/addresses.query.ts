/**
 * Generated by firestore-odm
 * Do not edit manually.
 */
import type { Firestore as ClientFirestore, CollectionReference as ClientCollectionReference, DocumentSnapshot as ClientDocumentSnapshot, Timestamp as ClientTimestamp, DocumentReference as ClientDocumentReference, WhereFilterOp as ClientWhereFilterOp, OrderByDirection as ClientOrderByDirection } from 'firebase/firestore';

// Runtime Imports - Base class and generic types
import { BaseQueryBuilder } from '@shtse8/fireschema-runtime'; // Use correct package name
import type { FirestoreLike, CollectionReferenceLike, DocumentSnapshotLike, TimestampLike, DocumentReferenceLike, WhereFilterOpLike, OrderByDirectionLike } from '@shtse8/fireschema-runtime';

// Local Imports
import { AddressesData } from './addresses.types.js';











/**
 * A typed query builder for the 'addresses' collection, extending BaseQueryBuilder.
 */
export class AddressesQueryBuilder extends BaseQueryBuilder<AddressesData> {

  // Constructor inherited from BaseQueryBuilder, accepts FirestoreLike and CollectionReferenceLike

  // --- Field-specific Where Methods ---
  // Overloads for 'street' field type safety based on operator
   
  whereStreet(op: '==', value: string): this;
   
  whereStreet(op: '!=', value: string): this;
   
  whereStreet(op: '<', value: string): this;
   
  whereStreet(op: '<=', value: string): this;
   
  whereStreet(op: '>', value: string): this;
   
  whereStreet(op: '>=', value: string): this;
   
  whereStreet(op: 'in', value: string[]): this;
   
  whereStreet(op: 'not-in', value: string[]): this;
  // Implementation signature for 'street'
  whereStreet(
    op: WhereFilterOpLike, // Use generic WhereFilterOpLike
    value: any
  ): this {
    // Call the protected _where method from the base class
    return this._where('street', op, value);
  }
  // Overloads for 'city' field type safety based on operator
   
  whereCity(op: '==', value: string): this;
   
  whereCity(op: '!=', value: string): this;
   
  whereCity(op: '<', value: string): this;
   
  whereCity(op: '<=', value: string): this;
   
  whereCity(op: '>', value: string): this;
   
  whereCity(op: '>=', value: string): this;
   
  whereCity(op: 'in', value: string[]): this;
   
  whereCity(op: 'not-in', value: string[]): this;
  // Implementation signature for 'city'
  whereCity(
    op: WhereFilterOpLike, // Use generic WhereFilterOpLike
    value: any
  ): this {
    // Call the protected _where method from the base class
    return this._where('city', op, value);
  }
  // Overloads for 'zip' field type safety based on operator
   
  whereZip(op: '==', value: string): this;
   
  whereZip(op: '!=', value: string): this;
   
  whereZip(op: '<', value: string): this;
   
  whereZip(op: '<=', value: string): this;
   
  whereZip(op: '>', value: string): this;
   
  whereZip(op: '>=', value: string): this;
   
  whereZip(op: 'in', value: string[]): this;
   
  whereZip(op: 'not-in', value: string[]): this;
  // Implementation signature for 'zip'
  whereZip(
    op: WhereFilterOpLike, // Use generic WhereFilterOpLike
    value: any
  ): this {
    // Call the protected _where method from the base class
    return this._where('zip', op, value);
  }
  // --- End Field-specific Where Methods ---

  // Methods like orderBy(), limit(), limitToLast(), startAt(), startAfter(),
  // endBefore(), endAt(), get(), getSnapshot() are inherited from BaseQueryBuilder.

  // --- Custom Query Methods Placeholder ---
}