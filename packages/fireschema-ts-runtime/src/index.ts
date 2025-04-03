/**
 * FireSchema TypeScript Runtime Library
 *
 * Exports base classes and types used by code generated by the FireSchema CLI.
 */

export { BaseCollectionRef, type CollectionSchema, type FieldSchema } from './baseCollection'; // Removed FirestoreFunctions export
// Export generic types
export type { FirestoreLike, CollectionReferenceLike, DocumentReferenceLike, DocumentSnapshotLike, SetOptionsLike, TimestampLike, FieldValueLike, DocumentDataLike, GeoPointLike } from './baseCollection'; // Added GeoPointLike
export { BaseQueryBuilder } from './baseQueryBuilder';
export { BaseUpdateBuilder } from './baseUpdateBuilder';

// Re-export common Firestore types for convenience? Optional.
// export {
//   Firestore,
//   CollectionReference,
//   DocumentReference,
//   DocumentSnapshot,
//   QuerySnapshot,
//   Timestamp,
//   FieldValue,
//   serverTimestamp,
//   increment,
//   arrayUnion,
//   arrayRemove,
//   deleteField,
//   type OrderByDirection,
//   type WhereFilterOp,
// } from 'firebase/firestore';