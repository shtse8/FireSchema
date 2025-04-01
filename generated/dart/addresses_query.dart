/**
 * Generated by firestore-odm
 * Do not edit manually.
 */
// ignore_for_file: unused_import, unused_local_variable

import 'package:cloud_firestore/cloud_firestore.dart';
import './addresses_data.dart'; // Import the generated model type

/// Typed query builder for the 'addresses' collection.
class AddressesQueryBuilder {
  final FirebaseFirestore firestore;
  final CollectionReference<AddressesData> collectionRef;
  Query<AddressesData> _query; // Internal query state

  AddressesQueryBuilder(this.firestore, this.collectionRef) : _query = collectionRef;

  /// Creates a new query builder instance with the applied query constraints.
  AddressesQueryBuilder._(this.firestore, this.collectionRef, this._query);

// --- Field-specific Where Methods ---
  /// Adds a query filter for the 'street' field.
  ///
  /// Available filter parameters: isEqualTo, isNotEqualTo, isLessThan, isLessThanOrEqualTo, isGreaterThan, isGreaterThanOrEqualTo, whereIn, whereNotIn
  AddressesQueryBuilder whereStreet({
    String isEqualTo,
    String isNotEqualTo,
    String isLessThan,
    String isLessThanOrEqualTo,
    String isGreaterThan,
    String isGreaterThanOrEqualTo,
    List<dynamic> whereIn,
    List<dynamic> whereNotIn
  }) {
    Query<AddressesData> newQuery = _query;
    if (isEqualTo != null) newQuery = newQuery.where('street', isEqualTo: isEqualTo);
    if (isNotEqualTo != null) newQuery = newQuery.where('street', isNotEqualTo: isNotEqualTo);
    if (isLessThan != null) newQuery = newQuery.where('street', isLessThan: isLessThan);
    if (isLessThanOrEqualTo != null) newQuery = newQuery.where('street', isLessThanOrEqualTo: isLessThanOrEqualTo);
    if (isGreaterThan != null) newQuery = newQuery.where('street', isGreaterThan: isGreaterThan);
    if (isGreaterThanOrEqualTo != null) newQuery = newQuery.where('street', isGreaterThanOrEqualTo: isGreaterThanOrEqualTo);
    if (whereIn != null) newQuery = newQuery.where('street', whereIn: whereIn);
    if (whereNotIn != null) newQuery = newQuery.where('street', whereNotIn: whereNotIn);
    // It's recommended to only pass one operator per where<FieldName> call.
    // If multiple are passed, Firestore behavior might be unexpected or unsupported.
    return AddressesQueryBuilder._(firestore, collectionRef, newQuery);
  }
  /// Adds a query filter for the 'city' field.
  ///
  /// Available filter parameters: isEqualTo, isNotEqualTo, isLessThan, isLessThanOrEqualTo, isGreaterThan, isGreaterThanOrEqualTo, whereIn, whereNotIn
  AddressesQueryBuilder whereCity({
    String isEqualTo,
    String isNotEqualTo,
    String isLessThan,
    String isLessThanOrEqualTo,
    String isGreaterThan,
    String isGreaterThanOrEqualTo,
    List<dynamic> whereIn,
    List<dynamic> whereNotIn
  }) {
    Query<AddressesData> newQuery = _query;
    if (isEqualTo != null) newQuery = newQuery.where('city', isEqualTo: isEqualTo);
    if (isNotEqualTo != null) newQuery = newQuery.where('city', isNotEqualTo: isNotEqualTo);
    if (isLessThan != null) newQuery = newQuery.where('city', isLessThan: isLessThan);
    if (isLessThanOrEqualTo != null) newQuery = newQuery.where('city', isLessThanOrEqualTo: isLessThanOrEqualTo);
    if (isGreaterThan != null) newQuery = newQuery.where('city', isGreaterThan: isGreaterThan);
    if (isGreaterThanOrEqualTo != null) newQuery = newQuery.where('city', isGreaterThanOrEqualTo: isGreaterThanOrEqualTo);
    if (whereIn != null) newQuery = newQuery.where('city', whereIn: whereIn);
    if (whereNotIn != null) newQuery = newQuery.where('city', whereNotIn: whereNotIn);
    // It's recommended to only pass one operator per where<FieldName> call.
    // If multiple are passed, Firestore behavior might be unexpected or unsupported.
    return AddressesQueryBuilder._(firestore, collectionRef, newQuery);
  }
  /// Adds a query filter for the 'zip' field.
  ///
  /// Available filter parameters: isEqualTo, isNotEqualTo, isLessThan, isLessThanOrEqualTo, isGreaterThan, isGreaterThanOrEqualTo, whereIn, whereNotIn
  AddressesQueryBuilder whereZip({
    String? isEqualTo,
    String? isNotEqualTo,
    String? isLessThan,
    String? isLessThanOrEqualTo,
    String? isGreaterThan,
    String? isGreaterThanOrEqualTo,
    List<dynamic> whereIn,
    List<dynamic> whereNotIn
  }) {
    Query<AddressesData> newQuery = _query;
    if (isEqualTo != null) newQuery = newQuery.where('zip', isEqualTo: isEqualTo);
    if (isNotEqualTo != null) newQuery = newQuery.where('zip', isNotEqualTo: isNotEqualTo);
    if (isLessThan != null) newQuery = newQuery.where('zip', isLessThan: isLessThan);
    if (isLessThanOrEqualTo != null) newQuery = newQuery.where('zip', isLessThanOrEqualTo: isLessThanOrEqualTo);
    if (isGreaterThan != null) newQuery = newQuery.where('zip', isGreaterThan: isGreaterThan);
    if (isGreaterThanOrEqualTo != null) newQuery = newQuery.where('zip', isGreaterThanOrEqualTo: isGreaterThanOrEqualTo);
    if (whereIn != null) newQuery = newQuery.where('zip', whereIn: whereIn);
    if (whereNotIn != null) newQuery = newQuery.where('zip', whereNotIn: whereNotIn);
    // It's recommended to only pass one operator per where<FieldName> call.
    // If multiple are passed, Firestore behavior might be unexpected or unsupported.
    return AddressesQueryBuilder._(firestore, collectionRef, newQuery);
  }
  // --- End Field-specific Where Methods ---

   /// Adds an orderBy clause to the query.
  AddressesQueryBuilder orderBy(String fieldPath, {bool descending = false}) {
     final newQuery = _query.orderBy(fieldPath, descending: descending);
     return AddressesQueryBuilder._(firestore, collectionRef, newQuery);
  }

  /// Adds a limit clause to the query.
  AddressesQueryBuilder limit(int limit) {
     final newQuery = _query.limit(limit);
     return AddressesQueryBuilder._(firestore, collectionRef, newQuery);
  }

  // TODO: Add limitToLast, startAt, startAfter, endAt, endBefore methods

  /// Executes the query and returns the matching documents.
  Future<List<AddressesData>> get() async {
    final snapshot = await _query.get();
    return snapshot.docs.map((doc) => doc.data()).toList();
     // TODO: Consider returning document IDs as well
  }

   /// Executes the query and returns a stream of matching documents.
  Stream<List<AddressesData>> snapshots() {
    return _query.snapshots().map((snapshot) =>
        snapshot.docs.map((doc) => doc.data()).toList());
  }
}