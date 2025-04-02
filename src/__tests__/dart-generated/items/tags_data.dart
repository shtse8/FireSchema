/**
 * Generated by firestore-odm
 * Do not edit manually.
 */
// ignore_for_file: unused_import, unused_local_variable

import 'package:cloud_firestore/cloud_firestore.dart';
// Import other necessary packages if needed



/// Represents the data structure for a 'Tags' document.
/// Description: Tags for an item.
class TagsData {
  /// label (string, required)
  final String label;

  const TagsData({
    required this.label,
  });

  /// Creates a TagsData instance from a Firestore DocumentSnapshot.
  factory TagsData.fromSnapshot(DocumentSnapshot snapshot) {
    final data = snapshot.data() as Map<String, dynamic>?;
    if (data == null) {
        throw Exception("Document data was null on snapshot ${snapshot.id}!");
    }
    return TagsData.fromJson(data); // Reuse fromJson logic
  }

   /// Creates a TagsData instance from a Map.
  factory TagsData.fromJson(Map<String, dynamic> data) {
     return TagsData(








      label: data['label'] as String? ?? (throw Exception("Missing required field: label in $data")),
    );
  }

  /// Creates a TagsData instance from a Firestore DocumentSnapshot.
  /// Required for Firestore `withConverter`.
  factory TagsData.fromFirestore(
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
    return TagsData.fromJson(data);
  }

  /// Converts this TagsData instance to a Map suitable for Firestore.
  Map<String, dynamic> toJson() {
    return {








      'label': label,
    };
  }

  /// Converts this TagsData instance to a Map suitable for Firestore.
  /// Required for Firestore `withConverter`.
  Map<String, Object?> toFirestore(SetOptions? options) {
    // We can reuse the existing toJson logic.
    // Firestore expects Map<String, Object?>
    return toJson();
  }

  /// Creates a copy of this instance with potentially modified fields.
  TagsData copyWith({
    String? label,
  }) {
    return TagsData(
      label: label ?? this.label,
    );
  }

  // TODO: Add toString, equals, hashCode implementations?
}