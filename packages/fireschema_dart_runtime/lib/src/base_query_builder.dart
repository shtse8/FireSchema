import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:meta/meta.dart';

/// Abstract base class for FireSchema-generated Dart query builders.
/// Provides common query constraint methods and execution logic.
///
/// [TData] The type of the Dart model class for the document data.
abstract class BaseQueryBuilder<TData> {
  @protected
  final FirebaseFirestore firestore;
  @protected
  final CollectionReference<TData> collectionRef;
  @protected
  Query<TData> query; // Internal query state, starts with collectionRef

  BaseQueryBuilder({required this.firestore, required this.collectionRef})
      : query =
            collectionRef; // Initialize query with the base collection reference

  /// Internal helper to apply a new query state.
  @protected
  BaseQueryBuilder<TData> applyQuery(Query<TData> newQuery) {
    query = newQuery;
    return this;
  }

  /// Protected helper to add a 'where' constraint using raw field path.
  /// Generated classes should provide type-safe public methods that call this.
  @protected
  BaseQueryBuilder<TData> where(
    // Back to original non-generic
    String fieldPath, {
    Object? isEqualTo,
    Object? isNotEqualTo,
    Object? isLessThan,
    Object? isLessThanOrEqualTo,
    Object? isGreaterThan,
    Object? isGreaterThanOrEqualTo,
    Object? arrayContains,
    List<Object?>? arrayContainsAny, // Back to List<Object?>?
    List<Object?>? whereIn, // Back to List<Object?>?
    List<Object?>? whereNotIn, // Back to List<Object?>?
    bool? isNull,
  }) {
    // Apply the underlying query where method
    // Note: Dart SDK's where is slightly different from JS (no direct op string)
    // We map the named parameters to the corresponding Firestore SDK calls.
    Query<TData> newQuery = query;
    if (isEqualTo != null)
      newQuery = newQuery.where(fieldPath, isEqualTo: isEqualTo);
    if (isNotEqualTo != null)
      newQuery = newQuery.where(fieldPath, isNotEqualTo: isNotEqualTo);
    if (isLessThan != null)
      newQuery = newQuery.where(fieldPath, isLessThan: isLessThan);
    if (isLessThanOrEqualTo != null)
      newQuery = newQuery.where(
        fieldPath,
        isLessThanOrEqualTo: isLessThanOrEqualTo,
      );
    if (isGreaterThan != null)
      newQuery = newQuery.where(fieldPath, isGreaterThan: isGreaterThan);
    if (isGreaterThanOrEqualTo != null)
      newQuery = newQuery.where(
        fieldPath,
        isGreaterThanOrEqualTo: isGreaterThanOrEqualTo,
      );
    if (arrayContains != null)
      newQuery = newQuery.where(fieldPath, arrayContains: arrayContains);
    if (arrayContainsAny != null)
      newQuery = newQuery.where(fieldPath,
          arrayContainsAny: arrayContainsAny); // No cast needed now
    if (whereIn != null)
      newQuery =
          newQuery.where(fieldPath, whereIn: whereIn); // No cast needed now
    if (whereNotIn != null)
      newQuery = newQuery.where(fieldPath,
          whereNotIn: whereNotIn); // No cast needed now
    if (isNull != null) newQuery = newQuery.where(fieldPath, isNull: isNull);

    return applyQuery(newQuery);
  }

  /// Adds an orderBy clause to the query.
  BaseQueryBuilder<TData> orderBy(String fieldPath, {bool descending = false}) {
    return applyQuery(query.orderBy(fieldPath, descending: descending));
  }

  /// Adds a limit clause to the query.
  BaseQueryBuilder<TData> limit(int limit) {
    return applyQuery(query.limit(limit));
  }

  /// Adds a limitToLast clause to the query. Requires an orderBy clause.
  BaseQueryBuilder<TData> limitToLast(int limit) {
    return applyQuery(query.limitToLast(limit));
  }

  // --- Cursor Methods ---

  /// Modifies the query to start at the provided document snapshot (inclusive).
  BaseQueryBuilder<TData> startAtDocument(DocumentSnapshot documentSnapshot) {
    return applyQuery(query.startAtDocument(documentSnapshot));
  }

  /// Modifies the query to start at the provided field values (inclusive).
  BaseQueryBuilder<TData> startAt(List<Object?> fieldValues) {
    return applyQuery(query.startAt(fieldValues));
  }

  /// Modifies the query to start after the provided document snapshot (exclusive).
  BaseQueryBuilder<TData> startAfterDocument(
    DocumentSnapshot documentSnapshot,
  ) {
    return applyQuery(query.startAfterDocument(documentSnapshot));
  }

  /// Modifies the query to start after the provided field values (exclusive).
  BaseQueryBuilder<TData> startAfter(List<Object?> fieldValues) {
    return applyQuery(query.startAfter(fieldValues));
  }

  /// Modifies the query to end before the provided document snapshot (exclusive).
  BaseQueryBuilder<TData> endBeforeDocument(DocumentSnapshot documentSnapshot) {
    return applyQuery(query.endBeforeDocument(documentSnapshot));
  }

  /// Modifies the query to end before the provided field values (exclusive).
  BaseQueryBuilder<TData> endBefore(List<Object?> fieldValues) {
    return applyQuery(query.endBefore(fieldValues));
  }

  /// Modifies the query to end at the provided document snapshot (inclusive).
  BaseQueryBuilder<TData> endAtDocument(DocumentSnapshot documentSnapshot) {
    return applyQuery(query.endAtDocument(documentSnapshot));
  }

  /// Modifies the query to end at the provided field values (inclusive).
  BaseQueryBuilder<TData> endAt(List<Object?> fieldValues) {
    return applyQuery(query.endAt(fieldValues));
  }

  // --- Execution ---

  /// Executes the query and returns the QuerySnapshot.
  Future<QuerySnapshot<TData>> get() async {
    return query.get();
  }

  /// Executes the query and returns the matching documents' data.
  Future<List<TData>> getData() async {
    final snapshot = await get();
    return snapshot.docs.map((doc) => doc.data()).toList();
  }
}
