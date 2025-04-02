/**
 * Generated by firestore-odm
 * Do not edit manually.
 */
// ignore_for_file: unused_import, unused_local_variable

import 'package:cloud_firestore/cloud_firestore.dart';
// Import other necessary packages if needed



/// Represents the data structure for a 'Posts' document.
/// Description: Posts created by the user
class PostsData {
  /// title (string, required)
  final String title;
  /// content (string)
  final String? content;
  /// publishedAt (timestamp)
  final Timestamp? publishedAt;

  const PostsData({
    required this.title,
    this.content,
    this.publishedAt,
  });

  /// Creates a PostsData instance from a Firestore DocumentSnapshot.
  factory PostsData.fromSnapshot(DocumentSnapshot snapshot) {
    final data = snapshot.data() as Map<String, dynamic>?;
    if (data == null) {
        throw Exception("Document data was null on snapshot ${snapshot.id}!");
    }
    return PostsData.fromJson(data); // Reuse fromJson logic
  }

   /// Creates a PostsData instance from a Map.
  factory PostsData.fromJson(Map<String, dynamic> data) {
     return PostsData(








      title: data['title'] as String? ?? (throw Exception("Missing required field: title in $data")),








      content: data['content'] as String?,









      publishedAt: data['publishedAt'] as Timestamp?,
    );
  }

  /// Creates a PostsData instance from a Firestore DocumentSnapshot.
  /// Required for Firestore `withConverter`.
  factory PostsData.fromFirestore(
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
    return PostsData.fromJson(data);
  }

  /// Converts this PostsData instance to a Map suitable for Firestore.
  Map<String, dynamic> toJson() {
    return {








      'title': title,








      'content': content,








      'publishedAt': publishedAt,
    };
  }

  /// Converts this PostsData instance to a Map suitable for Firestore.
  /// Required for Firestore `withConverter`.
  Map<String, Object?> toFirestore(SetOptions? options) {
    // We can reuse the existing toJson logic.
    // Firestore expects Map<String, Object?>
    return toJson();
  }

  /// Creates a copy of this instance with potentially modified fields.
  PostsData copyWith({
    String? title,
    String? content,
    Timestamp? publishedAt,
  }) {
    return PostsData(
      title: title ?? this.title,
      content: content ?? this.content,
      publishedAt: publishedAt ?? this.publishedAt,
    );
  }

  // TODO: Add toString, equals, hashCode implementations?
}