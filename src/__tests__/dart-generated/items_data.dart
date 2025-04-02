/**
 * Generated by firestore-odm
 * Do not edit manually.
 */
// ignore_for_file: unused_import, unused_local_variable

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:fireschema_dart_runtime/fireschema_dart_runtime.dart'; // Import runtime types
// Import other necessary packages if needed



/// Represents the data structure for a 'Items' document.
/// Description: A collection of test items.
class ItemsData {
  /// name (string, required)
  final String name;
  /// value (number)
  final num? value;
  /// createdAt (timestamp, required)
  final Timestamp createdAt;
  /// address (map)
  final Map<String, dynamic>? address;

  const ItemsData({
    required this.name,
    this.value,
    required this.createdAt,
    this.address,
  });

  /// Creates a ItemsData instance from a Firestore DocumentSnapshot.
  factory ItemsData.fromSnapshot(DocumentSnapshot snapshot) {
    final data = snapshot.data() as Map<String, dynamic>?;
    if (data == null) {
        throw Exception("Document data was null on snapshot ${snapshot.id}!");
    }
    return ItemsData.fromJson(data); // Reuse fromJson logic
  }

   /// Creates a ItemsData instance from a Map.
  factory ItemsData.fromJson(Map<String, dynamic> data) {
     return ItemsData(








      name: data['name'] as String? ?? (throw Exception("Missing required field: name in $data")),








      value: data['value'] as num?,









      createdAt: data['createdAt'] as Timestamp? ?? (throw Exception("Missing required field: createdAt in $data")),








      address: data['address'] as Map<String, dynamic>?,
    );
  }

  /// Creates a ItemsData instance from a Firestore DocumentSnapshot.
  /// Required for Firestore `withConverter`.
  factory ItemsData.fromFirestore(
    DocumentSnapshot<Map<String, dynamic>> snapshot,
    SnapshotOptions? options,
  ) {
    final data = snapshot.data();
    if (data == null) {
      throw Exception('Snapshot data was null!');
    }
    // We can reuse the existing fromJson logic.
    // Add the document ID to the data map if you want it in the model.
    // data['id'] = snapshot.id; // Optional: include document ID
    return ItemsData.fromJson(data);
  }

  /// Converts this ItemsData instance to a Map suitable for Firestore.
  Map<String, dynamic> toJson() {
    return {








      'name': name,








      'value': value,








      'createdAt': createdAt,








      'address': address,
    };
  }

  /// Converts this ItemsData instance to a Map suitable for Firestore.
  /// Required for Firestore `withConverter`.
  Map<String, Object?> toFirestore(SetOptions? options) {
    // We can reuse the existing toJson logic.
    // Firestore expects Map<String, Object?>
    return toJson();
  }

  /// Creates a copy of this instance with potentially modified fields.
  ItemsData copyWith({
    String? name,
    num? value,
    Timestamp? createdAt,
    Map<String, dynamic>? address,
  }) {
    return ItemsData(
      name: name ?? this.name,
      value: value ?? this.value,
      createdAt: createdAt ?? this.createdAt,
      address: address ?? this.address,
    );
  }
} // End of ItemsData class

  // TODO: Add toString, equals, hashCode implementations?


/// Represents the data structure for adding a new 'Items' document.
/// Fields with default values (like server timestamps) or optional fields are nullable.
class ItemsAddData implements ToJsonSerializable {


  final String name;


  final num? value;


  final Timestamp? createdAt;


  final Map<String, dynamic>? address;

  const ItemsAddData({

    required this.name,

    this.value,

    this.createdAt,

    this.address,
  });

  /// Converts this instance to a Map suitable for Firestore add operation.
  /// Excludes fields that are null to avoid overwriting server-generated values.
  Map<String, Object?> toJson() {
    final map = <String, Object?>{};

    // Required fields are always included
    // TODO: Handle nested toJson if needed for complex types
    map['name'] = name;

    // Only include non-null values in the map for optional fields
    if (value != null) {
      // TODO: Handle nested toJson if needed for complex types
      map['value'] = value;
    }

    // Only include non-null values in the map for optional fields
    if (createdAt != null) {
      // TODO: Handle nested toJson if needed for complex types
      map['createdAt'] = createdAt;
    }

    // Only include non-null values in the map for optional fields
    if (address != null) {
      // TODO: Handle nested toJson if needed for complex types
      map['address'] = address;
    }
    return map;
  }
}