/**
 * Generated by firestore-odm
 * Do not edit manually.
 */
import 'package:cloud_firestore/cloud_firestore.dart';
// Runtime Imports
import 'package:fireschema_dart_runtime/fireschema_dart_runtime.dart'; // Import the runtime package

// Local Imports
import 'users_data.dart';

/// A typed query builder for the 'users' collection, extending BaseQueryBuilder.
class UsersQueryBuilder extends BaseQueryBuilder<UsersData> {

  /// Creates a UsersQueryBuilder instance.
  UsersQueryBuilder({
    required FirebaseFirestore firestore,
    required CollectionReference<UsersData> collectionRef,
  }) : super(firestore: firestore, collectionRef: collectionRef);

  // Constructor and internal query state are inherited from BaseQueryBuilder

  // --- Field-specific Where Methods ---
  /// Adds a query filter for the 'displayName' field.
  /// Provide one of the named parameters to specify the query condition.
  UsersQueryBuilder whereDisplayName({
    String isEqualTo,
    String isNotEqualTo,
    String isLessThan,
    String isLessThanOrEqualTo,
    String isGreaterThan,
    String isGreaterThanOrEqualTo,
    List<dynamic> whereIn,
    List<dynamic> whereNotIn,
  }) {
    // Call the protected where method from the base class
    return where(
      'displayName', // Pass the field path string
      isEqualTo: isEqualTo,
      isNotEqualTo: isNotEqualTo,
      isLessThan: isLessThan,
      isLessThanOrEqualTo: isLessThanOrEqualTo,
      isGreaterThan: isGreaterThan,
      isGreaterThanOrEqualTo: isGreaterThanOrEqualTo,
      whereIn: whereIn,
      whereNotIn: whereNotIn,
    ) as UsersQueryBuilder; // Cast back to specific type
  }
  /// Adds a query filter for the 'email' field.
  /// Provide one of the named parameters to specify the query condition.
  UsersQueryBuilder whereEmail({
    String isEqualTo,
    String isNotEqualTo,
    String isLessThan,
    String isLessThanOrEqualTo,
    String isGreaterThan,
    String isGreaterThanOrEqualTo,
    List<dynamic> whereIn,
    List<dynamic> whereNotIn,
  }) {
    // Call the protected where method from the base class
    return where(
      'email', // Pass the field path string
      isEqualTo: isEqualTo,
      isNotEqualTo: isNotEqualTo,
      isLessThan: isLessThan,
      isLessThanOrEqualTo: isLessThanOrEqualTo,
      isGreaterThan: isGreaterThan,
      isGreaterThanOrEqualTo: isGreaterThanOrEqualTo,
      whereIn: whereIn,
      whereNotIn: whereNotIn,
    ) as UsersQueryBuilder; // Cast back to specific type
  }
  /// Adds a query filter for the 'createdAt' field.
  /// Provide one of the named parameters to specify the query condition.
  UsersQueryBuilder whereCreatedAt({
    Timestamp? isEqualTo,
    Timestamp? isNotEqualTo,
    Timestamp? isLessThan,
    Timestamp? isLessThanOrEqualTo,
    Timestamp? isGreaterThan,
    Timestamp? isGreaterThanOrEqualTo,
    List<dynamic> whereIn,
    List<dynamic> whereNotIn,
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
    ) as UsersQueryBuilder; // Cast back to specific type
  }
  /// Adds a query filter for the 'lastLogin' field.
  /// Provide one of the named parameters to specify the query condition.
  UsersQueryBuilder whereLastLogin({
    Timestamp? isEqualTo,
    Timestamp? isNotEqualTo,
    Timestamp? isLessThan,
    Timestamp? isLessThanOrEqualTo,
    Timestamp? isGreaterThan,
    Timestamp? isGreaterThanOrEqualTo,
    List<dynamic> whereIn,
    List<dynamic> whereNotIn,
  }) {
    // Call the protected where method from the base class
    return where(
      'lastLogin', // Pass the field path string
      isEqualTo: isEqualTo,
      isNotEqualTo: isNotEqualTo,
      isLessThan: isLessThan,
      isLessThanOrEqualTo: isLessThanOrEqualTo,
      isGreaterThan: isGreaterThan,
      isGreaterThanOrEqualTo: isGreaterThanOrEqualTo,
      whereIn: whereIn,
      whereNotIn: whereNotIn,
    ) as UsersQueryBuilder; // Cast back to specific type
  }
  /// Adds a query filter for the 'age' field.
  /// Provide one of the named parameters to specify the query condition.
  UsersQueryBuilder whereAge({
    num? isEqualTo,
    num? isNotEqualTo,
    num? isLessThan,
    num? isLessThanOrEqualTo,
    num? isGreaterThan,
    num? isGreaterThanOrEqualTo,
    List<dynamic> whereIn,
    List<dynamic> whereNotIn,
  }) {
    // Call the protected where method from the base class
    return where(
      'age', // Pass the field path string
      isEqualTo: isEqualTo,
      isNotEqualTo: isNotEqualTo,
      isLessThan: isLessThan,
      isLessThanOrEqualTo: isLessThanOrEqualTo,
      isGreaterThan: isGreaterThan,
      isGreaterThanOrEqualTo: isGreaterThanOrEqualTo,
      whereIn: whereIn,
      whereNotIn: whereNotIn,
    ) as UsersQueryBuilder; // Cast back to specific type
  }
  /// Adds a query filter for the 'isActive' field.
  /// Provide one of the named parameters to specify the query condition.
  UsersQueryBuilder whereIsActive({
    bool? isEqualTo,
    bool? isNotEqualTo,
    bool? isLessThan,
    bool? isLessThanOrEqualTo,
    bool? isGreaterThan,
    bool? isGreaterThanOrEqualTo,
    List<dynamic> whereIn,
    List<dynamic> whereNotIn,
  }) {
    // Call the protected where method from the base class
    return where(
      'isActive', // Pass the field path string
      isEqualTo: isEqualTo,
      isNotEqualTo: isNotEqualTo,
      isLessThan: isLessThan,
      isLessThanOrEqualTo: isLessThanOrEqualTo,
      isGreaterThan: isGreaterThan,
      isGreaterThanOrEqualTo: isGreaterThanOrEqualTo,
      whereIn: whereIn,
      whereNotIn: whereNotIn,
    ) as UsersQueryBuilder; // Cast back to specific type
  }
  /// Adds a query filter for the 'settings' field.
  /// Provide one of the named parameters to specify the query condition.
  UsersQueryBuilder whereSettings({
    Map<String, dynamic>? isEqualTo,
    Map<String, dynamic>? isNotEqualTo,
    List<dynamic> whereIn,
    List<dynamic> whereNotIn,
  }) {
    // Call the protected where method from the base class
    return where(
      'settings', // Pass the field path string
      isEqualTo: isEqualTo,
      isNotEqualTo: isNotEqualTo,
      whereIn: whereIn,
      whereNotIn: whereNotIn,
    ) as UsersQueryBuilder; // Cast back to specific type
  }
  /// Adds a query filter for the 'tags' field.
  /// Provide one of the named parameters to specify the query condition.
  UsersQueryBuilder whereTags({
    String? arrayContains,
    List<List<String>> arrayContainsAny,
    List<List<String>> whereIn,
    List<List<String>> whereNotIn,
  }) {
    // Call the protected where method from the base class
    return where(
      'tags', // Pass the field path string
      arrayContains: arrayContains,
      arrayContainsAny: arrayContainsAny,
      whereIn: whereIn,
      whereNotIn: whereNotIn,
    ) as UsersQueryBuilder; // Cast back to specific type
  }
  /// Adds a query filter for the 'primaryAddressRef' field.
  /// Provide one of the named parameters to specify the query condition.
  UsersQueryBuilder wherePrimaryAddressRef({
    DocumentReference<Map<String, dynamic>>? isEqualTo,
    DocumentReference<Map<String, dynamic>>? isNotEqualTo,
    DocumentReference<Map<String, dynamic>>? isLessThan,
    DocumentReference<Map<String, dynamic>>? isLessThanOrEqualTo,
    DocumentReference<Map<String, dynamic>>? isGreaterThan,
    DocumentReference<Map<String, dynamic>>? isGreaterThanOrEqualTo,
    List<dynamic> whereIn,
    List<dynamic> whereNotIn,
  }) {
    // Call the protected where method from the base class
    return where(
      'primaryAddressRef', // Pass the field path string
      isEqualTo: isEqualTo,
      isNotEqualTo: isNotEqualTo,
      isLessThan: isLessThan,
      isLessThanOrEqualTo: isLessThanOrEqualTo,
      isGreaterThan: isGreaterThan,
      isGreaterThanOrEqualTo: isGreaterThanOrEqualTo,
      whereIn: whereIn,
      whereNotIn: whereNotIn,
    ) as UsersQueryBuilder; // Cast back to specific type
  }
  // --- End Field-specific Where Methods ---

  // Methods like orderBy(), limit(), limitToLast(), startAt(), startAfter(),
  // endBefore(), endAt(), get(), getData() are inherited from BaseQueryBuilder.

  // --- Custom Query Methods Placeholder ---
}