/**
 * Generated by firestore-odm
 * Do not edit manually.
 */
import 'package:cloud_firestore/cloud_firestore.dart';
// Runtime Imports
import 'package:fireschema_dart_runtime/fireschema_dart_runtime.dart'; // Import the runtime package

// Local Imports
import 'items_data.dart';

/// A typed query builder for the 'items' collection, extending BaseQueryBuilder.
class ItemsQueryBuilder extends BaseQueryBuilder<ItemsData> {

  /// Creates a ItemsQueryBuilder instance.
  ItemsQueryBuilder({
    required FirebaseFirestore firestore,
    required CollectionReference<ItemsData> collectionRef,
  }) : super(firestore: firestore, collectionRef: collectionRef);

  // Constructor and internal query state are inherited from BaseQueryBuilder

  // --- Field-specific Where Methods ---
  /// Adds a query filter for the 'name' field.
  /// Provide one of the named parameters to specify the query condition.
  ItemsQueryBuilder whereName({
    String? isEqualTo, // Ensure only one trailing '?' for nullable parameter
    String? isNotEqualTo, // Ensure only one trailing '?' for nullable parameter
    String? isLessThan, // Ensure only one trailing '?' for nullable parameter
    String? isLessThanOrEqualTo, // Ensure only one trailing '?' for nullable parameter
    String? isGreaterThan, // Ensure only one trailing '?' for nullable parameter
    String? isGreaterThanOrEqualTo, // Ensure only one trailing '?' for nullable parameter
    List<dynamic>? whereIn, // Ensure only one trailing '?' for nullable parameter
    List<dynamic>? whereNotIn, // Ensure only one trailing '?' for nullable parameter
  }) {
    // Call the protected where method from the base class
    return where(
      'name', // Pass the field path string
      isEqualTo: isEqualTo,
      isNotEqualTo: isNotEqualTo,
      isLessThan: isLessThan,
      isLessThanOrEqualTo: isLessThanOrEqualTo,
      isGreaterThan: isGreaterThan,
      isGreaterThanOrEqualTo: isGreaterThanOrEqualTo,
      whereIn: whereIn,
      whereNotIn: whereNotIn,
    ) as ItemsQueryBuilder; // Cast back to specific type is necessary
  }
  /// Adds a query filter for the 'value' field.
  /// Provide one of the named parameters to specify the query condition.
  ItemsQueryBuilder whereValue({
    num? isEqualTo, // Ensure only one trailing '?' for nullable parameter
    num? isNotEqualTo, // Ensure only one trailing '?' for nullable parameter
    num? isLessThan, // Ensure only one trailing '?' for nullable parameter
    num? isLessThanOrEqualTo, // Ensure only one trailing '?' for nullable parameter
    num? isGreaterThan, // Ensure only one trailing '?' for nullable parameter
    num? isGreaterThanOrEqualTo, // Ensure only one trailing '?' for nullable parameter
    List<dynamic>? whereIn, // Ensure only one trailing '?' for nullable parameter
    List<dynamic>? whereNotIn, // Ensure only one trailing '?' for nullable parameter
  }) {
    // Call the protected where method from the base class
    return where(
      'value', // Pass the field path string
      isEqualTo: isEqualTo,
      isNotEqualTo: isNotEqualTo,
      isLessThan: isLessThan,
      isLessThanOrEqualTo: isLessThanOrEqualTo,
      isGreaterThan: isGreaterThan,
      isGreaterThanOrEqualTo: isGreaterThanOrEqualTo,
      whereIn: whereIn,
      whereNotIn: whereNotIn,
    ) as ItemsQueryBuilder; // Cast back to specific type is necessary
  }
  /// Adds a query filter for the 'createdAt' field.
  /// Provide one of the named parameters to specify the query condition.
  ItemsQueryBuilder whereCreatedAt({
    Timestamp? isEqualTo, // Ensure only one trailing '?' for nullable parameter
    Timestamp? isNotEqualTo, // Ensure only one trailing '?' for nullable parameter
    Timestamp? isLessThan, // Ensure only one trailing '?' for nullable parameter
    Timestamp? isLessThanOrEqualTo, // Ensure only one trailing '?' for nullable parameter
    Timestamp? isGreaterThan, // Ensure only one trailing '?' for nullable parameter
    Timestamp? isGreaterThanOrEqualTo, // Ensure only one trailing '?' for nullable parameter
    List<dynamic>? whereIn, // Ensure only one trailing '?' for nullable parameter
    List<dynamic>? whereNotIn, // Ensure only one trailing '?' for nullable parameter
  }) {
    // Call the protected where method from the base class
    return where(
      'createdAt', // Pass the field path string
      isEqualTo: isEqualTo,
      isNotEqualTo: isNotEqualTo,
      isLessThan: isLessThan,
      isLessThanOrEqualTo: isLessThanOrEqualTo,
      isGreaterThan: isGreaterThan,
      isGreaterThanOrEqualTo: isGreaterThanOrEqualTo,
      whereIn: whereIn,
      whereNotIn: whereNotIn,
    ) as ItemsQueryBuilder; // Cast back to specific type is necessary
  }
  // --- End Field-specific Where Methods ---

  // Methods like orderBy(), limit(), limitToLast(), startAt(), startAfter(),
  // endBefore(), endAt(), get(), getData() are inherited from BaseQueryBuilder.

  // --- Custom Query Methods Placeholder ---
}