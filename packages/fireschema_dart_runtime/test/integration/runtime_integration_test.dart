import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:fake_cloud_firestore/fake_cloud_firestore.dart'; // Keep for potential fallback or comparison
import 'package:fireschema_dart_runtime/fireschema_dart_runtime.dart';
import 'package:fireschema_dart_runtime/src/types.dart';
import 'package:flutter_test/flutter_test.dart'; // Keep for expect, group etc.
// Removed integration_test import

// --- Test Setup ---
const String firestoreEmulatorHost = '127.0.0.1';
const int firestoreEmulatorPort = 8080; // Default Firestore emulator port
const bool useEmulator = true; // Set to true to use emulator

// --- Test Data Classes (Similar to unit tests, but might evolve) ---

// Level 1 Data
class TestData {
  final String? id;
  final String name;
  final int value;
  final Timestamp? createdAt;
  final List<String>? tags;

  TestData({
    this.id,
    required this.name,
    required this.value,
    this.createdAt,
    this.tags,
  });

  factory TestData.fromFirestore(
      DocumentSnapshot<Map<String, dynamic>> snapshot,
      SnapshotOptions? options) {
    final data = snapshot.data()!;
    return TestData(
      id: snapshot.id,
      name: data['name'] as String,
      value: data['value'] as int,
      createdAt: data['createdAt'] as Timestamp?,
      tags: (data['tags'] as List<dynamic>?)?.map((e) => e as String).toList(),
    );
  }

  Map<String, Object?> toFirestore(SetOptions? options) {
    return {
      'name': name,
      'value': value,
      if (createdAt != null) 'createdAt': createdAt,
      if (tags != null) 'tags': tags,
    };
  }
}

class TestAddData implements ToJsonSerializable {
  final String name;
  final int value;
  final List<String>? tags; // Allow tags on add

  TestAddData({required this.name, required this.value, this.tags});

  @override
  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'value': value,
      if (tags != null) 'tags': tags,
    };
  }
}

// Level 2 Data (Subcollection)
class SubTestData {
  final String? id;
  final String description;
  final int count;

  SubTestData({this.id, required this.description, required this.count});

  factory SubTestData.fromFirestore(
      DocumentSnapshot<Map<String, dynamic>> snapshot,
      SnapshotOptions? options) {
    final data = snapshot.data()!;
    return SubTestData(
      id: snapshot.id,
      description: data['description'] as String,
      count: data['count'] as int,
    );
  }

  Map<String, Object?> toFirestore(SetOptions? options) {
    return {'description': description, 'count': count};
  }
}

class SubTestAddData implements ToJsonSerializable {
  final String description;
  final int count;
  SubTestAddData({required this.description, required this.count});

  @override
  Map<String, dynamic> toJson() => {'description': description, 'count': count};
}

// --- Collection Classes ---

// Level 1 Collection
class TestCollection extends BaseCollectionRef<TestData, TestAddData> {
  TestCollection(FirebaseFirestore firestore, {CollectionSchema? schema})
      : super(
          firestore: firestore,
          collectionId: 'integration_test_items', // Use a distinct collection
          fromFirestore: TestData.fromFirestore,
          toFirestore: (TestData data, SetOptions? options) =>
              data.toFirestore(options),
          schema: schema,
        );

  // Method to access subcollection
  TestSubCollection subItems(String parentId) {
    TestSubCollection subFactory({
      required FirebaseFirestore firestore,
      required String collectionId,
      CollectionSchema? schema,
      required DocumentReference? parentRef,
    }) {
      return TestSubCollection(
        firestore: firestore,
        collectionId: collectionId,
        schema: schema,
        parentRef: parentRef,
      );
    }

    return subCollection(
      parentId,
      'integration_sub_items', // Distinct subcollection path
      subFactory,
      SubTestData.fromFirestore,
      (SubTestData data, SetOptions? options) => data.toFirestore(options),
      null,
    );
  }
}

// Level 2 Collection
class TestSubCollection extends BaseCollectionRef<SubTestData, SubTestAddData> {
  TestSubCollection({
    required FirebaseFirestore firestore,
    required String collectionId,
    CollectionSchema? schema,
    required DocumentReference? parentRef,
  }) : super(
          firestore: firestore,
          collectionId: collectionId,
          fromFirestore: SubTestData.fromFirestore,
          toFirestore: (SubTestData data, SetOptions? options) =>
              data.toFirestore(options),
          schema: schema,
          parentRef: parentRef,
        );
}

// --- Test Main ---
void main() {
  // IntegrationTestWidgetsFlutterBinding.ensureInitialized(); // Removed Flutter-specific binding

  late FirebaseFirestore firestore;
  late TestCollection testCollection;

  setUpAll(() async {
    // Initialize Firestore
    firestore = FirebaseFirestore.instance;
    if (useEmulator) {
      print(
          'Using Firestore emulator at $firestoreEmulatorHost:$firestoreEmulatorPort');
      firestore.useFirestoreEmulator(
          firestoreEmulatorHost, firestoreEmulatorPort);
    } else {
      print('Using live Firestore instance.');
    }
    testCollection = TestCollection(firestore);

    // Initial cleanup
    print('Performing initial cleanup of integration test collection...');
    await cleanupTestCollection(testCollection);
    print('Initial cleanup complete.');
  });

  // Cleanup after each test
  tearDown(() async {
    await cleanupTestCollection(testCollection);
  });

  group('Dart Runtime Integration Tests', () {
    test('add() and get() work correctly', () async {
      final dataToAdd = TestAddData(name: 'Integration Add', value: 101);
      DocumentReference<TestData>? docRef;
      try {
        docRef = await testCollection.add(dataToAdd);
        expect(docRef, isNotNull);
        expect(docRef.id, isNotEmpty);
        final retrievedData = await testCollection.get(docRef.id);
        expect(retrievedData, isNotNull);
        expect(retrievedData?.name, equals('Integration Add'));
        expect(retrievedData?.value, equals(101));
      } finally {
        if (docRef != null) {
          await testCollection.delete(docRef.id);
        }
      }
    });

    test('set() and get() work correctly', () async {
      const docId = 'integration-set-id';
      final dataToSet =
          TestData(id: docId, name: 'Integration Set', value: 102);
      try {
        await testCollection.set(docId, dataToSet);
        final retrievedData = await testCollection.get(docId);
        expect(retrievedData, isNotNull);
        expect(retrievedData?.name, equals('Integration Set'));
        expect(retrievedData?.value, equals(102));
      } finally {
        await testCollection.delete(docId);
      }
    });

    test('delete() removes a document', () async {
      const docId = 'integration-delete-id';
      final dataToSet =
          TestData(id: docId, name: 'Integration Delete', value: 103);
      try {
        await testCollection.set(docId, dataToSet);
        var retrieved = await testCollection.get(docId);
        expect(retrieved, isNotNull); // Verify exists
        await testCollection.delete(docId);
        retrieved = await testCollection.get(docId);
        expect(retrieved, isNull); // Verify deleted
      } finally {
        try {
          await testCollection.delete(docId);
        } catch (_) {}
      }
    });

    test('updateData() updates specific fields', () async {
      const docId = 'integration-update-data-id';
      final initialData =
          TestData(id: docId, name: 'Integration Update Initial', value: 104);
      await testCollection.set(docId, initialData);
      final updateMap = {
        'name': 'Integration Updated',
        'value': FieldValue.increment(1),
        'tags': FieldValue.arrayUnion(['integration', 'update']),
      };
      try {
        await testCollection.updateData(docId, updateMap);
        final retrieved = await testCollection.get(docId);
        expect(retrieved, isNotNull);
        expect(retrieved?.name, equals('Integration Updated'));
        expect(retrieved?.value, equals(105));
        expect(retrieved?.tags, containsAll(['integration', 'update']));
      } finally {
        await testCollection.delete(docId);
      }
    });

    // --- Query Tests ---

    test('query with where clause works', () async {
      const id1 = 'query-where-1';
      const id2 = 'query-where-2';
      final data1 = TestAddData(name: 'Query Where A', value: 200);
      final data2 = TestAddData(name: 'Query Where B', value: 201);
      final data3 = TestAddData(name: 'Query Where C', value: 200);
      try {
        await testCollection.set(
            id1, TestData(id: id1, name: data1.name, value: data1.value));
        await testCollection.set(
            id2, TestData(id: id2, name: data2.name, value: data2.value));
        await testCollection.set(
            'query-where-3',
            TestData(
                id: 'query-where-3', name: data3.name, value: data3.value));
        final querySnapshot =
            await testCollection.ref.where('value', isEqualTo: 200).get();
        final results = querySnapshot.docs.map((doc) => doc.data()).toList();
        expect(results, hasLength(2));
        final names = results.map((r) => r.name).toList();
        expect(names, containsAll(['Query Where A', 'Query Where C']));
        expect(names, isNot(contains('Query Where B')));
      } finally {
        await cleanupTestCollection(testCollection);
      }
    });

    test('query with orderBy and limit works', () async {
      final dataSet = [
        TestData(id: 'query-order-1', name: 'Zebra', value: 1),
        TestData(id: 'query-order-2', name: 'Apple', value: 2),
        TestData(id: 'query-order-3', name: 'Mango', value: 3),
      ];
      try {
        for (final item in dataSet) {
          await testCollection.set(item.id!, item);
        }
        final querySnapshot = await testCollection.ref
            .orderBy('name', descending: false)
            .limit(2)
            .get();
        final results = querySnapshot.docs.map((doc) => doc.data()).toList();
        expect(results, hasLength(2));
        expect(results[0].name, equals('Apple'));
        expect(results[1].name, equals('Mango'));
      } finally {
        await cleanupTestCollection(testCollection);
      }
    });

    test('query with limitToLast works', () async {
      final dataSet = [
        TestData(id: 'query-limitlast-1', name: 'First', value: 1),
        TestData(id: 'query-limitlast-2', name: 'Second', value: 2),
        TestData(id: 'query-limitlast-3', name: 'Third', value: 3),
        TestData(id: 'query-limitlast-4', name: 'Fourth', value: 4),
      ];
      try {
        for (final item in dataSet) {
          await testCollection.set(item.id!, item);
        }
        final querySnapshot =
            await testCollection.ref.orderBy('value').limitToLast(2).get();
        final results = querySnapshot.docs.map((doc) => doc.data()).toList();
        expect(results, hasLength(2));
        expect(results[0].name, equals('Third'));
        expect(results[1].name, equals('Fourth'));
      } finally {
        await cleanupTestCollection(testCollection);
      }
    });

    test('query with comparison operators works', () async {
      final dataSet = [
        TestData(id: 'query-comp-1', name: 'Val10', value: 10),
        TestData(id: 'query-comp-2', name: 'Val20', value: 20),
        TestData(id: 'query-comp-3', name: 'Val30', value: 30),
      ];
      try {
        for (final item in dataSet) {
          await testCollection.set(item.id!, item);
        }
        // Test >
        var snap =
            await testCollection.ref.where('value', isGreaterThan: 15).get();
        expect(snap.docs, hasLength(2));
        expect(snap.docs.map((d) => d.data().name),
            containsAll(['Val20', 'Val30']));
        // Test >=
        snap = await testCollection.ref
            .where('value', isGreaterThanOrEqualTo: 20)
            .get();
        expect(snap.docs, hasLength(2));
        expect(snap.docs.map((d) => d.data().name),
            containsAll(['Val20', 'Val30']));
        // Test <
        snap = await testCollection.ref.where('value', isLessThan: 25).get();
        expect(snap.docs, hasLength(2));
        expect(snap.docs.map((d) => d.data().name),
            containsAll(['Val10', 'Val20']));
        // Test <=
        snap = await testCollection.ref
            .where('value', isLessThanOrEqualTo: 20)
            .get();
        expect(snap.docs, hasLength(2));
        expect(snap.docs.map((d) => d.data().name),
            containsAll(['Val10', 'Val20']));
        // Test !=
        snap = await testCollection.ref.where('value', isNotEqualTo: 20).get();
        expect(snap.docs, hasLength(2));
        expect(snap.docs.map((d) => d.data().name),
            containsAll(['Val10', 'Val30']));
      } finally {
        await cleanupTestCollection(testCollection);
      }
    });

    test('query with whereIn works', () async {
      final dataSet = [
        TestData(id: 'query-in-1', name: 'A', value: 1),
        TestData(id: 'query-in-2', name: 'B', value: 2),
        TestData(id: 'query-in-3', name: 'C', value: 3),
      ];
      try {
        for (final item in dataSet) {
          await testCollection.set(item.id!, item);
        }
        final snap =
            await testCollection.ref.where('name', whereIn: ['A', 'C']).get();
        expect(snap.docs, hasLength(2));
        expect(snap.docs.map((d) => d.data().name), containsAll(['A', 'C']));
        expect(snap.docs.map((d) => d.data().name), isNot(contains('B')));
      } finally {
        await cleanupTestCollection(testCollection);
      }
    });

    test('query with whereNotIn works', () async {
      final dataSet = [
        TestData(id: 'query-notin-1', name: 'A', value: 1),
        TestData(id: 'query-notin-2', name: 'B', value: 2),
        TestData(id: 'query-notin-3', name: 'C', value: 3),
      ];
      try {
        for (final item in dataSet) {
          await testCollection.set(item.id!, item);
        }
        final snap = await testCollection.ref
            .where('name', whereNotIn: ['A', 'C']).get();
        expect(snap.docs, hasLength(1));
        expect(snap.docs.first.data().name, equals('B'));
      } finally {
        await cleanupTestCollection(testCollection);
      }
    });

    test('query with arrayContains works', () async {
      final dataSet = [
        TestData(
            id: 'query-arrcon-1', name: 'Item 1', value: 1, tags: ['a', 'b']),
        TestData(
            id: 'query-arrcon-2', name: 'Item 2', value: 2, tags: ['c', 'd']),
        TestData(
            id: 'query-arrcon-3', name: 'Item 3', value: 3, tags: ['a', 'e']),
      ];
      try {
        for (final item in dataSet) {
          await testCollection.set(item.id!, item);
        }
        final snap =
            await testCollection.ref.where('tags', arrayContains: 'a').get();
        expect(snap.docs, hasLength(2));
        expect(snap.docs.map((d) => d.data().name),
            containsAll(['Item 1', 'Item 3']));
      } finally {
        await cleanupTestCollection(testCollection);
      }
    });

    test('query with arrayContainsAny works', () async {
      final dataSet = [
        TestData(
            id: 'query-arrconany-1',
            name: 'Item 1',
            value: 1,
            tags: ['a', 'b']),
        TestData(
            id: 'query-arrconany-2',
            name: 'Item 2',
            value: 2,
            tags: ['c', 'd']),
        TestData(
            id: 'query-arrconany-3',
            name: 'Item 3',
            value: 3,
            tags: ['a', 'e']),
      ];
      try {
        for (final item in dataSet) {
          await testCollection.set(item.id!, item);
        }
        final snap = await testCollection.ref
            .where('tags', arrayContainsAny: ['a', 'd']).get();
        expect(snap.docs,
            hasLength(3)); // Item 1 ('a'), Item 2 ('d'), Item 3 ('a')
        expect(snap.docs.map((d) => d.data().name),
            containsAll(['Item 1', 'Item 2', 'Item 3']));
      } finally {
        await cleanupTestCollection(testCollection);
      }
    });

    test('query with cursors works', () async {
      final dataSet = [
        TestData(id: 'query-cursor-a', name: 'A', value: 10),
        TestData(id: 'query-cursor-b', name: 'B', value: 20),
        TestData(id: 'query-cursor-c', name: 'C', value: 30),
        TestData(id: 'query-cursor-d', name: 'D', value: 40),
      ];
      try {
        for (final item in dataSet) {
          await testCollection.set(item.id!, item);
        }
        // Get snapshots for cursors
        final snapshotB = await testCollection.doc('query-cursor-b').get();
        final snapshotC = await testCollection.doc('query-cursor-c').get();
        expect(snapshotB.exists, isTrue);
        expect(snapshotC.exists, isTrue);
        final baseQuery = testCollection.ref.orderBy('value');
        // Test startAt (inclusive)
        var snap = await baseQuery.startAtDocument(snapshotB).get();
        expect(snap.docs, hasLength(3));
        expect(snap.docs.map((d) => d.data().name), equals(['B', 'C', 'D']));
        // Test startAfter
        snap = await baseQuery.startAfterDocument(snapshotB).get();
        expect(snap.docs, hasLength(2));
        expect(snap.docs.map((d) => d.data().name), equals(['C', 'D']));
        // Test endAt (inclusive)
        snap = await baseQuery.endAtDocument(snapshotC).get();
        expect(snap.docs, hasLength(3));
        expect(snap.docs.map((d) => d.data().name), equals(['A', 'B', 'C']));
        // Test endBefore (exclusive)
        snap = await baseQuery.endBeforeDocument(snapshotC).get();
        expect(snap.docs, hasLength(2));
        expect(snap.docs.map((d) => d.data().name), equals(['A', 'B']));
        // Test combination: startAfter B, endBefore D
        final snapshotD = await testCollection.doc('query-cursor-d').get();
        snap = await baseQuery
            .startAfterDocument(snapshotB)
            .endBeforeDocument(snapshotD)
            .get();
        expect(snap.docs, hasLength(1));
        expect(snap.docs.first.data().name, equals('C'));
      } finally {
        await cleanupTestCollection(testCollection);
      }
    });

    // --- Default Value Tests ---

    test('default values are applied on add', () async {
      final schemaWithDefaults = {
        'fields': {
          'createdAt': {'defaultValue': 'serverTimestamp'},
          'value': {'defaultValue': 999},
          'tags': {
            'defaultValue': ['default', 'tag']
          },
        }
      };
      final collectionWithSchema =
          TestCollection(firestore, schema: schemaWithDefaults);
      // Only provide 'name' - expect 'value', 'createdAt', 'tags' to get defaults
      // Provide value as it's required by TestAddData constructor, default should override if field missing
      final dataToAdd = TestAddData(name: 'Default Add Test', value: 1);
      DocumentReference<TestData>? docRef;

      try {
        docRef = await collectionWithSchema.add(dataToAdd);
        final retrieved = await collectionWithSchema.get(docRef.id);

        expect(retrieved, isNotNull);
        expect(retrieved?.name, equals('Default Add Test'));
        // Note: The current applyDefaults logic only applies default if field is MISSING.
        // Since 'value' was provided in dataToAdd, the default 999 is NOT applied.
        // This test verifies the serverTimestamp and tags defaults ARE applied.
        expect(retrieved?.value,
            equals(1)); // Value provided in add should be kept
        expect(retrieved?.tags, equals(['default', 'tag'])); // Default list
        expect(retrieved?.createdAt, isA<Timestamp>()); // Default timestamp
      } finally {
        if (docRef != null) {
          await collectionWithSchema.delete(docRef.id);
        }
      }
    });

    // Note: Testing defaults on 'set' is tricky because 'set' expects TData,

    // --- Subcollection Tests ---

    test('subcollection CRUD operations work', () async {
      const parentId = 'integration-parent-crud';
      const subId1 = 'integration-sub-crud-1';
      const subId2 = 'integration-sub-crud-2';

      final parentData = TestData(id: parentId, name: 'Parent CRUD', value: 1);
      final subData1 = SubTestAddData(description: 'Sub CRUD 1', count: 10);
      final subData2 =
          SubTestData(id: subId2, description: 'Sub CRUD 2 Set', count: 20);

      try {
        // Create parent
        await testCollection.set(parentId, parentData);
        final subCollection = testCollection.subItems(parentId);

        // Add sub-doc 1
        final docRef1 = await subCollection.add(subData1);
        expect(docRef1.id, isNotEmpty);

        // Set sub-doc 2
        await subCollection.set(subId2, subData2);

        // Get sub-doc 1
        var retrievedSub1 = await subCollection.get(docRef1.id);
        expect(retrievedSub1, isNotNull);
        expect(retrievedSub1?.description, equals('Sub CRUD 1'));
        expect(retrievedSub1?.count, equals(10));

        // Get sub-doc 2
        var retrievedSub2 = await subCollection.get(subId2);
        expect(retrievedSub2, isNotNull);
        expect(retrievedSub2?.description, equals('Sub CRUD 2 Set'));

        // Update sub-doc 1 using updateData
        await subCollection
            .updateData(docRef1.id, {'count': FieldValue.increment(5)});
        retrievedSub1 = await subCollection.get(docRef1.id);
        expect(retrievedSub1?.count, equals(15));

        // Delete sub-doc 1
        await subCollection.delete(docRef1.id);
        retrievedSub1 = await subCollection.get(docRef1.id);
        expect(retrievedSub1, isNull);

        // Delete sub-doc 2
        await subCollection.delete(subId2);
        retrievedSub2 = await subCollection.get(subId2);
        expect(retrievedSub2, isNull);
      } finally {
        // Cleanup parent (should remove subcollection in emulator)
        await testCollection.delete(parentId);
      }
    });

    test('subcollection query operations work', () async {
      const parentId = 'integration-parent-query';
      final parentData = TestData(id: parentId, name: 'Parent Query', value: 1);
      final subDataSet = [
        SubTestData(id: 'subq-1', description: 'Sub Query A', count: 10),
        SubTestData(id: 'subq-2', description: 'Sub Query B', count: 20),
        SubTestData(id: 'subq-3', description: 'Sub Query C', count: 10),
      ];

      try {
        await testCollection.set(parentId, parentData);
        final subCollection = testCollection.subItems(parentId);
        for (final item in subDataSet) {
          await subCollection.set(item.id!, item);
        }

        // Query: where count == 10
        final querySnapshot =
            await subCollection.ref.where('count', isEqualTo: 10).get();
        final results = querySnapshot.docs.map((doc) => doc.data()).toList();
        expect(results, hasLength(2));
        expect(results.map((r) => r.description),
            containsAll(['Sub Query A', 'Sub Query C']));

        // Query: orderBy count descending, limit 1
        final querySnapshotOrdered = await subCollection.ref
            .orderBy('count', descending: true)
            .limit(1)
            .get();
        final resultsOrdered =
            querySnapshotOrdered.docs.map((doc) => doc.data()).toList();
        expect(resultsOrdered, hasLength(1));
        expect(resultsOrdered.first.description, equals('Sub Query B'));
      } finally {
        await testCollection.delete(parentId);
      }
    });

    // which usually includes fields like 'createdAt'. The base 'set' method
    // doesn't apply defaults like 'add' does. If default-on-set is needed,
    // it might require custom logic in generated classes or enhancements
    // to the base 'set' or a dedicated 'setAdd' method.
    // We will rely on the 'add' test for default value verification for now.

    // TODO: Add integration tests for:
    // - Default values (with schema)
    // - Subcollections (CRUD, queries)
    // - Set with merge options (using updateData or if set is enhanced)
  }); // End group
}

// Helper function to clear the test collection
Future<void> cleanupTestCollection(TestCollection collection) async {
  try {
    final snapshot = await collection.ref.limit(50).get(); // Limit batch size
    if (snapshot.docs.isEmpty) {
      return;
    }
    final batch = collection.firestore.batch();
    for (final doc in snapshot.docs) {
      batch.delete(doc.reference);
    }
    await batch.commit();
    // Recursively call if more docs might exist
    if (snapshot.docs.length == 50) {
      print('WARN: Potentially more documents to clean up...');
      await cleanupTestCollection(collection);
    }
  } catch (e) {
    print('Error during cleanup: $e');
    // Don't fail tests due to cleanup issues, but log it.
  }
}
