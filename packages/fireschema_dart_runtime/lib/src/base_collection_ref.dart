import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:meta/meta.dart';

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
abstract class BaseCollectionRef<TData, TAddData> {
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
    final fields =
        schema?['fields'] as Map<String, dynamic>?; // Assuming schema structure

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
    // It's expected that TAddData can be represented as a Map for Firestore.
    // The toFirestore converter handles the final conversion from TData.
    // We apply defaults to a Map representation before adding.
    final rawData = data
        as Map<String, dynamic>; // Requires TAddData to be Map or convertible
    final dataToWrite = applyDefaults(rawData);
    // addDoc uses the converter automatically via ref
    return ref.add(dataToWrite as TData); // Cast needed after applying defaults
    // TODO: Review this cast - applyDefaults returns Map, but ref.add expects TData.
    // The `toFirestore` converter should handle the Map from applyDefaults implicitly?
    // Let's rethink: addDoc takes Map<String, dynamic>, not TData directly unless using the converted ref.
    // If TAddData is NOT TData, we need to convert TAddData to Map, apply defaults,
    // then let the converter handle it? Or does the user pass TData directly?
    // Assuming user passes TAddData (potentially different from TData), convert to Map, apply defaults.
    // The `ref.add()` *should* take TData, meaning we need TAddData -> TData conversion first?
    // Let's assume TAddData is the input type, apply defaults to its Map form,
    // and rely on `toFirestore` to handle the final object passed to `add`.
    // This seems complex. Maybe `add` should expect TData directly?
    // Or TAddData needs a `toMap()` method?

    // Simpler approach: Assume TAddData is Map<String, dynamic> or similar for now.
    // Let the `withConverter` handle the final object.
    // This requires the `fromFirestore` / `toFirestore` to be robust.

    // Revised approach: addDoc on the *unconverted* ref takes Map.
    // Let's use the unconverted ref to add the map with defaults.
    // final unconvertedRef = parentRef != null
    //     ? parentRef!.collection(collectionId)
    //     : firestore.collection(collectionId);
    // DocumentReference rawDocRef = await unconvertedRef.add(dataToWrite);
    // Return the converted doc ref:
    // return doc(rawDocRef.id);
    // This seems more correct.

    final unconvertedRef = (parentRef != null
        ? parentRef!.collection(collectionId)
        : firestore.collection(collectionId));
    final rawDocRef = await unconvertedRef.add(dataToWrite);
    return doc(rawDocRef.id); // Return the converted DocumentReference<TData>
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
  SubCollectionType subCollection<SubTData, SubTAddData,
      SubCollectionType extends BaseCollectionRef<SubTData, SubTAddData>>(
    String parentId,
    String subCollectionId,
    // Need a factory function or similar to create the specific subcollection class instance
    SubCollectionType Function({
      required FirebaseFirestore firestore,
      required String collectionId,
      // Note: 'required' is part of the outer function signature, not the inner type signature
      TData Function(DocumentSnapshot<Map<String, dynamic>>, SnapshotOptions?)
          fromFirestore,
      Map<String, Object?> Function(TData, SetOptions?) toFirestore,
      CollectionSchema? schema,
      DocumentReference? parentRef,
    }) subCollectionFactory,
    // Pass the necessary converters and schema for the subcollection
    // Note: 'required' is part of the outer function signature, not the inner type signature
    TData Function(DocumentSnapshot<Map<String, dynamic>>, SnapshotOptions?)
        subFromFirestore,
    Map<String, Object?> Function(TData, SetOptions?) subToFirestore,
    CollectionSchema? subSchema,
  ) {
    final parentDocRef = (parentRef != null
            ? parentRef!.collection(collectionId)
            : firestore.collection(collectionId))
        .doc(parentId); // Get unconverted parent doc ref

    return subCollectionFactory(
      firestore: firestore,
      collectionId: subCollectionId,
      fromFirestore: subFromFirestore, // Pass subcollection's converters
      toFirestore: subToFirestore,
      schema: subSchema,
      parentRef: parentDocRef, // Pass the parent DocumentReference
    );
  }
}
