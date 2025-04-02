import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:meta/meta.dart';
import 'types.dart'; // Import the interface

// Placeholder for schema definition types in Dart
// These might be simple Maps or dedicated classes depending on complexity.
typedef FieldSchema
    = Map<String, dynamic>; // Example: {'defaultValue': 'serverTimestamp'}
typedef CollectionSchema
    = Map<String, FieldSchema>; // Example: {'fields': {'createdAt': {...}}}

/// Abstract base class for FireSchema-generated Dart collection references.
/// Provides common CRUD operations and path handling using `withConverter`.
///
/// [TData] The type of the Dart model class for the document data.
/// [TAddData] The type for data used when adding a new document (often the same as TData or a subset).
abstract class BaseCollectionRef<TData, TAddData extends ToJsonSerializable> {
  @protected
  final FirebaseFirestore firestore;
  @protected
  final String collectionId;
  @protected
  final CollectionSchema? schema; // Optional schema for advanced features
  @protected
  final DocumentReference? parentRef; // Optional parent ref for subcollections

  /// The core Firestore CollectionReference, typed using `withConverter`.
  late final CollectionReference<TData> ref;

  /// Constructor for the base collection reference.
  BaseCollectionRef({
    required this.firestore,
    required this.collectionId,
    required TData Function(
      DocumentSnapshot<Map<String, dynamic>>,
      SnapshotOptions?,
    ) fromFirestore,
    required Map<String, Object?> Function(TData, SetOptions?) toFirestore,
    this.schema,
    this.parentRef,
  }) {
    final baseRef = parentRef != null
        ? parentRef!.collection(collectionId)
        : firestore.collection(collectionId);

    ref = baseRef.withConverter<TData>(
      fromFirestore: fromFirestore,
      toFirestore: toFirestore,
    );
  }

  /// Returns the DocumentReference for a given ID, typed via `withConverter`.
  DocumentReference<TData> doc(String id) {
    // Access the converter from the collection reference
    return ref.doc(id);
  }

  /// Prepares data for writing by applying default values (e.g., serverTimestamp).
  /// This base implementation handles serverTimestamp. Generated classes might override
  /// or extend this for other default types.
  @protected
  Map<String, dynamic> applyDefaults(Map<String, dynamic> data) {
    final dataWithDefaults = Map<String, dynamic>.from(data);
    final fields = schema?[
        'fields']; // Cast is unnecessary as FieldSchema is Map<String, dynamic>

    if (fields != null) {
      fields.forEach((fieldName, fieldDef) {
        final def = fieldDef as FieldSchema?; // Cast to expected type
        final defaultValue = def?['defaultValue'];
        // Check if the field is missing in the input data
        if (dataWithDefaults[fieldName] == null && defaultValue != null) {
          if (defaultValue == 'serverTimestamp') {
            dataWithDefaults[fieldName] = FieldValue.serverTimestamp();
          } else if (defaultValue is String ||
              defaultValue is num ||
              defaultValue is bool) {
            // Apply basic default types directly
            dataWithDefaults[fieldName] = defaultValue;
          }
          // TODO: Handle other default value types if necessary (e.g., arrays, maps?)
        }
      });
    }
    return dataWithDefaults;
  }

  /// Adds a new document with the given data, returning the new DocumentReference.
  /// Assumes TAddData is convertible to Map<String, dynamic>.
  Future<DocumentReference<TData>> add(TAddData data) async {
    // Assume TAddData is Map<String, dynamic> or easily convertible for applying defaults.
    // Use the toJson method from the AddData type
    final rawData = data.toJson();
    // Ensure the map passed to applyDefaults matches its expected type
    final dataToWrite = applyDefaults(Map<String, dynamic>.from(rawData));

    // Use the *unconverted* reference to add the Map, then return the *converted* DocumentReference.
    final unconvertedRef = (parentRef != null
        ? parentRef!.collection(collectionId)
        : firestore.collection(collectionId));
    final rawDocRef = await unconvertedRef.add(dataToWrite);
    return doc(rawDocRef
        .id); // doc(id) returns the DocumentReference<TData> with converter
  }

  /// Sets the data for a document, overwriting existing data by default.
  Future<void> set(String id, TData data, [SetOptions? options]) async {
    // Set uses the converter automatically
    await doc(id).set(data, options);
  }

  /// Deletes a document.
  Future<void> delete(String id) async {
    await doc(id).delete();
  }

  /// Reads a single document.
  Future<TData?> get(String id) async {
    final snapshot = await doc(id).get();
    return snapshot.data(); // data() uses the converter
  }

  // --- Abstract methods or placeholders ---

  // BaseQueryBuilder<TData> query(); // Placeholder
  // BaseUpdateBuilder<TData> update(String id); // Placeholder

  /// Helper to access a subcollection.
  @protected
  SubCollectionType subCollection<
      SubTData,
      SubTAddData extends ToJsonSerializable, // Add constraint here
      SubCollectionType extends BaseCollectionRef<SubTData, SubTAddData>>(
    String parentId,
    String subCollectionId,
    // Need a factory function or similar to create the specific subcollection class instance
    SubCollectionType Function({
      required FirebaseFirestore firestore,
      required String collectionId,
      // Note: 'required' is part of the outer function signature, not the inner type signature
      // Corrected: Use SubTData for the factory's converter signatures
      // Factory signature simplified: only requires parameters needed by the factory body
      CollectionSchema? schema,
      required DocumentReference? parentRef, // Make required again
    }) subCollectionFactory,
    // Pass the necessary converters and schema for the subcollection
    // Note: 'required' is part of the outer function signature, not the inner type signature
    // Corrected: Use SubTData for the converter function parameters
    SubTData Function(DocumentSnapshot<Map<String, dynamic>>, SnapshotOptions?)
        subFromFirestore,
    Map<String, Object?> Function(SubTData, SetOptions?) subToFirestore,
    CollectionSchema? subSchema,
  ) {
    final parentDocRef = (parentRef != null
            ? parentRef!.collection(collectionId)
            : firestore.collection(collectionId))
        .doc(parentId); // Get unconverted parent doc ref

    return subCollectionFactory(
      firestore: firestore,
      collectionId: subCollectionId,
      schema: subSchema,
      parentRef: parentDocRef, // Pass the parent DocumentReference
    );
  }
}
