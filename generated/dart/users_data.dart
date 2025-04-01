/**
 * Generated by firestore-odm
 * Do not edit manually.
 */
// ignore_for_file: unused_import, unused_local_variable

import 'package:cloud_firestore/cloud_firestore.dart';
// Import other necessary packages if needed



/// Represents the data structure for a 'Users' document.
/// Description: Stores user profile information.
class UsersData {
  /// User's public display name (string, required)
  final String displayName;
  /// email (string, required)
  final String email;
  /// Timestamp when the user was created (timestamp)
  final Timestamp? createdAt;
  /// lastLogin (timestamp)
  final Timestamp? lastLogin;
  /// age (number)
  final num? age;
  /// isActive (boolean)
  final bool? isActive;
  /// settings (map)
  final Map<String, dynamic>? settings;
  /// tags (array)
  final List<String>? tags;
  /// primaryAddressRef (reference)
  final DocumentReference<Map<String, dynamic>>? primaryAddressRef;

  const UsersData({
    required this.displayName,
    required this.email,
    this.createdAt,
    this.lastLogin,
    this.age,
    this.isActive,
    this.settings,
    this.tags,
    this.primaryAddressRef,
  });

  /// Creates a UsersData instance from a Firestore DocumentSnapshot.
  factory UsersData.fromSnapshot(DocumentSnapshot snapshot) {
    final data = snapshot.data() as Map<String, dynamic>?;
    if (data == null) {
        throw Exception("Document data was null on snapshot ${snapshot.id}!");
    }
    return UsersData.fromJson(data); // Reuse fromJson logic
  }

   /// Creates a UsersData instance from a Map.
  factory UsersData.fromJson(Map<String, dynamic> data) {
     return UsersData(








      displayName: data['displayName'] as String? ?? (throw Exception("Missing required field: displayName in $data")),








      email: data['email'] as String? ?? (throw Exception("Missing required field: email in $data")),









      createdAt: data['createdAt'] as Timestamp?,









      lastLogin: data['lastLogin'] as Timestamp?,








      age: data['age'] as num?,








      isActive: data['isActive'] as bool?,








      settings: data['settings'] as Map<String, dynamic>?,









      tags: (data['tags'] as List<dynamic>?)?.map((e) => e as String).toList(),







      primaryAddressRef: data['primaryAddressRef'] as DocumentReference<Map<String, dynamic>>?,
    );
  }

  /// Converts this UsersData instance to a Map suitable for Firestore.
  Map<String, dynamic> toJson() {
    return {








      'displayName': displayName,








      'email': email,








      'createdAt': createdAt,








      'lastLogin': lastLogin,








      'age': age,








      'isActive': isActive,








      'settings': settings,








      'tags': tags,








      'primaryAddressRef': primaryAddressRef,
    };
  }

  /// Creates a copy of this instance with potentially modified fields.
  UsersData copyWith({
    String? displayName,
    String? email,
    Timestamp? createdAt,
    Timestamp? lastLogin,
    num? age,
    bool? isActive,
    Map<String, dynamic>? settings,
    List<String>? tags,
    DocumentReference<Map<String, dynamic>>? primaryAddressRef,
  }) {
    return UsersData(
      displayName: displayName ?? this.displayName,
      email: email ?? this.email,
      createdAt: createdAt ?? this.createdAt,
      lastLogin: lastLogin ?? this.lastLogin,
      age: age ?? this.age,
      isActive: isActive ?? this.isActive,
      settings: settings ?? this.settings,
      tags: tags ?? this.tags,
      primaryAddressRef: primaryAddressRef ?? this.primaryAddressRef,
    );
  }

  // TODO: Add toString, equals, hashCode implementations?
}