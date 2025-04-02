import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:meta/meta.dart';

/// Abstract base class for FireSchema-generated Dart update builders.
/// Provides common logic for accumulating updates and committing them.
///
/// [TData] The type of the Dart model class being updated.
abstract class BaseUpdateBuilder<TData> {
  @protected
  final DocumentReference<TData> docRef; // Use the converted doc ref
  @protected
  final Map<String, dynamic> updateData = {}; // Internal data accumulator

  BaseUpdateBuilder({required this.docRef});

  /// Protected method to add an update operation to the internal data map.
  /// Generated classes should provide type-safe public methods that call this.
  /// Handles simple value setting and FieldValue operations.
  ///
  /// @param fieldPath The dot-notation path of the field to update.
  /// @param value The value or FieldValue operation to apply.
  /// @returns The UpdateBuilder instance for chaining.
  @protected
  BaseUpdateBuilder<TData> set(String fieldPath, dynamic value) {
    updateData[fieldPath] = value;
    return this;
  }

  // --- Common FieldValue Helpers (Optional Convenience) ---

  @protected
  BaseUpdateBuilder<TData> increment(String fieldPath, num value) {
    return set(
      fieldPath,
      FieldValue.increment(value.toDouble()),
    ); // Ensure double for increment
  }

  @protected
  BaseUpdateBuilder<TData> arrayUnion(String fieldPath, List<dynamic> values) {
    return set(fieldPath, FieldValue.arrayUnion(values));
  }

  @protected
  BaseUpdateBuilder<TData> arrayRemove(String fieldPath, List<dynamic> values) {
    return set(fieldPath, FieldValue.arrayRemove(values));
  }

  @protected
  BaseUpdateBuilder<TData> serverTimestamp(String fieldPath) {
    return set(fieldPath, FieldValue.serverTimestamp());
  }

  @protected
  BaseUpdateBuilder<TData> deleteField(String fieldPath) {
    return set(fieldPath, FieldValue.delete());
  }

  // --- Commit ---

  /// Commits the accumulated update operations to Firestore.
  /// Uses the unconverted DocumentReference for the update operation.
  Future<void> commit() async {
    if (updateData.isEmpty) {
      // Avoid unnecessary Firestore calls if no updates were staged.
      print(
        'Update commit called with no changes specified.',
      ); // Use print for Dart
      return Future.value(); // Return a completed future
    }
    // Update using the unconverted reference and the data map
    await docRef.update(updateData);
    // Clear data after commit? Optional.
    // updateData.clear();
  }
}
