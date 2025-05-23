/**
 * Generated by firestore-odm
 * Do not edit manually.
 */
import type { Firestore as ClientFirestore, CollectionReference as ClientCollectionReference, DocumentSnapshot as ClientDocumentSnapshot, Timestamp as ClientTimestamp, DocumentReference as ClientDocumentReference, WhereFilterOp as ClientWhereFilterOp, OrderByDirection as ClientOrderByDirection } from 'firebase/firestore';

// Runtime Imports - Base class and generic types
import { BaseQueryBuilder } from '@shtse8/fireschema-runtime'; // Use correct package name
import type { FirestoreLike, CollectionReferenceLike, DocumentSnapshotLike, TimestampLike, DocumentReferenceLike, WhereFilterOpLike, OrderByDirectionLike } from '@shtse8/fireschema-runtime';

// Local Imports
import { UsersData } from './users.types.js';

























import type { AddressesData } from './addresses.types.js';


/**
 * A typed query builder for the 'users' collection, extending BaseQueryBuilder.
 */
export class UsersQueryBuilder extends BaseQueryBuilder<UsersData> {

  // Constructor inherited from BaseQueryBuilder, accepts FirestoreLike and CollectionReferenceLike

  // --- Field-specific Where Methods ---
  // Overloads for 'displayName' field type safety based on operator
   
  whereDisplayName(op: '==', value: string): this;
   
  whereDisplayName(op: '!=', value: string): this;
   
  whereDisplayName(op: '<', value: string): this;
   
  whereDisplayName(op: '<=', value: string): this;
   
  whereDisplayName(op: '>', value: string): this;
   
  whereDisplayName(op: '>=', value: string): this;
   
  whereDisplayName(op: 'in', value: string[]): this;
   
  whereDisplayName(op: 'not-in', value: string[]): this;
  // Implementation signature for 'displayName'
  whereDisplayName(
    op: WhereFilterOpLike, // Use generic WhereFilterOpLike
    value: any
  ): this {
    // Call the protected _where method from the base class
    return this._where('displayName', op, value);
  }
  // Overloads for 'email' field type safety based on operator
   
  whereEmail(op: '==', value: string): this;
   
  whereEmail(op: '!=', value: string): this;
   
  whereEmail(op: '<', value: string): this;
   
  whereEmail(op: '<=', value: string): this;
   
  whereEmail(op: '>', value: string): this;
   
  whereEmail(op: '>=', value: string): this;
   
  whereEmail(op: 'in', value: string[]): this;
   
  whereEmail(op: 'not-in', value: string[]): this;
  // Implementation signature for 'email'
  whereEmail(
    op: WhereFilterOpLike, // Use generic WhereFilterOpLike
    value: any
  ): this {
    // Call the protected _where method from the base class
    return this._where('email', op, value);
  }
  // Overloads for 'createdAt' field type safety based on operator
   
  whereCreatedAt(op: '==', value: TimestampLike): this;
   
  whereCreatedAt(op: '!=', value: TimestampLike): this;
   
  whereCreatedAt(op: '<', value: TimestampLike): this;
   
  whereCreatedAt(op: '<=', value: TimestampLike): this;
   
  whereCreatedAt(op: '>', value: TimestampLike): this;
   
  whereCreatedAt(op: '>=', value: TimestampLike): this;
   
  whereCreatedAt(op: 'in', value: TimestampLike[]): this;
   
  whereCreatedAt(op: 'not-in', value: TimestampLike[]): this;
  // Implementation signature for 'createdAt'
  whereCreatedAt(
    op: WhereFilterOpLike, // Use generic WhereFilterOpLike
    value: any
  ): this {
    // Call the protected _where method from the base class
    return this._where('createdAt', op, value);
  }
  // Overloads for 'lastLogin' field type safety based on operator
   
  whereLastLogin(op: '==', value: TimestampLike): this;
   
  whereLastLogin(op: '!=', value: TimestampLike): this;
   
  whereLastLogin(op: '<', value: TimestampLike): this;
   
  whereLastLogin(op: '<=', value: TimestampLike): this;
   
  whereLastLogin(op: '>', value: TimestampLike): this;
   
  whereLastLogin(op: '>=', value: TimestampLike): this;
   
  whereLastLogin(op: 'in', value: TimestampLike[]): this;
   
  whereLastLogin(op: 'not-in', value: TimestampLike[]): this;
  // Implementation signature for 'lastLogin'
  whereLastLogin(
    op: WhereFilterOpLike, // Use generic WhereFilterOpLike
    value: any
  ): this {
    // Call the protected _where method from the base class
    return this._where('lastLogin', op, value);
  }
  // Overloads for 'age' field type safety based on operator
   
  whereAge(op: '==', value: number): this;
   
  whereAge(op: '!=', value: number): this;
   
  whereAge(op: '<', value: number): this;
   
  whereAge(op: '<=', value: number): this;
   
  whereAge(op: '>', value: number): this;
   
  whereAge(op: '>=', value: number): this;
   
  whereAge(op: 'in', value: number[]): this;
   
  whereAge(op: 'not-in', value: number[]): this;
  // Implementation signature for 'age'
  whereAge(
    op: WhereFilterOpLike, // Use generic WhereFilterOpLike
    value: any
  ): this {
    // Call the protected _where method from the base class
    return this._where('age', op, value);
  }
  // Overloads for 'isActive' field type safety based on operator
   
  whereIsActive(op: '==', value: boolean): this;
   
  whereIsActive(op: '!=', value: boolean): this;
   
  whereIsActive(op: '<', value: boolean): this;
   
  whereIsActive(op: '<=', value: boolean): this;
   
  whereIsActive(op: '>', value: boolean): this;
   
  whereIsActive(op: '>=', value: boolean): this;
   
  whereIsActive(op: 'in', value: boolean[]): this;
   
  whereIsActive(op: 'not-in', value: boolean[]): this;
  // Implementation signature for 'isActive'
  whereIsActive(
    op: WhereFilterOpLike, // Use generic WhereFilterOpLike
    value: any
  ): this {
    // Call the protected _where method from the base class
    return this._where('isActive', op, value);
  }
  // Overloads for 'settings' field type safety based on operator
   
  whereSettings(op: '==', value: { theme?: string; notificationsEnabled?: boolean }): this;
   
  whereSettings(op: '!=', value: { theme?: string; notificationsEnabled?: boolean }): this;
   
  whereSettings(op: 'in', value: { theme?: string; notificationsEnabled?: boolean }[]): this;
   
  whereSettings(op: 'not-in', value: { theme?: string; notificationsEnabled?: boolean }[]): this;
  // Implementation signature for 'settings'
  whereSettings(
    op: WhereFilterOpLike, // Use generic WhereFilterOpLike
    value: any
  ): this {
    // Call the protected _where method from the base class
    return this._where('settings', op, value);
  }
  // Overloads for 'tags' field type safety based on operator
   
  whereTags(op: 'array-contains', value: string): this;
   
  whereTags(op: 'array-contains-any', value: string[]): this;
   
  whereTags(op: 'in', value: string[][]): this;
   
  whereTags(op: 'not-in', value: string[][]): this;
  // Implementation signature for 'tags'
  whereTags(
    op: WhereFilterOpLike, // Use generic WhereFilterOpLike
    value: any
  ): this {
    // Call the protected _where method from the base class
    return this._where('tags', op, value);
  }
  // Overloads for 'primaryAddressRef' field type safety based on operator
   
  wherePrimaryAddressRef(op: '==', value: DocumentReferenceLike<AddressesData>): this;
   
  wherePrimaryAddressRef(op: '!=', value: DocumentReferenceLike<AddressesData>): this;
   
  wherePrimaryAddressRef(op: '<', value: DocumentReferenceLike<AddressesData>): this;
   
  wherePrimaryAddressRef(op: '<=', value: DocumentReferenceLike<AddressesData>): this;
   
  wherePrimaryAddressRef(op: '>', value: DocumentReferenceLike<AddressesData>): this;
   
  wherePrimaryAddressRef(op: '>=', value: DocumentReferenceLike<AddressesData>): this;
   
  wherePrimaryAddressRef(op: 'in', value: DocumentReferenceLike<AddressesData>[]): this;
   
  wherePrimaryAddressRef(op: 'not-in', value: DocumentReferenceLike<AddressesData>[]): this;
  // Implementation signature for 'primaryAddressRef'
  wherePrimaryAddressRef(
    op: WhereFilterOpLike, // Use generic WhereFilterOpLike
    value: any
  ): this {
    // Call the protected _where method from the base class
    return this._where('primaryAddressRef', op, value);
  }
  // --- End Field-specific Where Methods ---

  // Methods like orderBy(), limit(), limitToLast(), startAt(), startAfter(),
  // endBefore(), endAt(), get(), getSnapshot() are inherited from BaseQueryBuilder.

  // --- Custom Query Methods Placeholder ---
}