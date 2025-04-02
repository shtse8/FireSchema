// ignore_for_file: invalid_use_of_protected_member

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:fake_cloud_firestore/fake_cloud_firestore.dart';
import 'package:fireschema_dart_runtime/src/base_query_builder.dart'; // Import base class
import 'package:test/test.dart';

// --- Test Data Structures (can reuse from base_collection_ref_test or redefine) ---
class TestData {
  final String? id;
  final String name;
  final int value;
  final bool active;
  final List<String>? tags;

  TestData(
      {this.id,
      required this.name,
      required this.value,
      required this.active,
      this.tags});

  Map<String, dynamic> toMap() => {
        'name': name,
        'value': value,
        'active': active,
        if (tags != null) 'tags': tags,
      };
}

// --- Firestore Converters ---
TestData _fromFirestore(
    DocumentSnapshot<Map<String, dynamic>> snapshot, SnapshotOptions? options) {
  final data = snapshot.data()!;
  return TestData(
    id: snapshot.id,
    name: data['name'] as String,
    value: data['value'] as int,
    active: data['active'] as bool,
    tags: (data['tags'] as List<dynamic>?)?.map((e) => e as String).toList(),
  );
}

Map<String, Object?> _toFirestore(TestData data, SetOptions? options) {
  return data.toMap(); // Simple conversion for tests
}

// --- Concrete Test Implementation ---
class TestQueryBuilder extends BaseQueryBuilder<TestData> {
  TestQueryBuilder({
    required FirebaseFirestore firestore,
    required CollectionReference<TestData> collectionRef,
  }) : super(
          firestore: firestore,
          collectionRef: collectionRef,
        );

  // Expose protected `where` method for testing using named args
  TestQueryBuilder testWhere({
    required String fieldPath,
    Object? isEqualTo,
    Object? isNotEqualTo,
    Object? isLessThan,
    Object? isLessThanOrEqualTo,
    Object? isGreaterThan,
    Object? isGreaterThanOrEqualTo,
    Object? arrayContains,
    List<Object?>? arrayContainsAny,
    List<Object?>? whereIn,
    List<Object?>? whereNotIn,
    bool? isNull,
  }) {
    // Call the actual protected method from the base class
    where(
      fieldPath,
      isEqualTo: isEqualTo,
      isNotEqualTo: isNotEqualTo,
      isLessThan: isLessThan,
      isLessThanOrEqualTo: isLessThanOrEqualTo,
      isGreaterThan: isGreaterThan,
      isGreaterThanOrEqualTo: isGreaterThanOrEqualTo,
      arrayContains: arrayContains,
      arrayContainsAny: arrayContainsAny,
      whereIn: whereIn,
      whereNotIn: whereNotIn,
      isNull: isNull,
    );
    return this;
  }
}

void main() {
  late FakeFirebaseFirestore fakeFirestore;
  late CollectionReference<TestData> itemsCollRef;

  // setUp should be inside main/group
  setUp(() async {
    fakeFirestore = FakeFirebaseFirestore();
    // Create a converted collection reference for the builder
    itemsCollRef = fakeFirestore.collection('items').withConverter<TestData>(
          fromFirestore: _fromFirestore,
          toFirestore: _toFirestore,
        );

    // Add some initial data for querying
    await itemsCollRef.doc('item1').set(TestData(
        name: 'Apple', value: 10, active: true, tags: ['fruit', 'red']));
    await itemsCollRef.doc('item2').set(TestData(
        name: 'Banana', value: 20, active: true, tags: ['fruit', 'yellow']));
    await itemsCollRef.doc('item3').set(
        TestData(name: 'Carrot', value: 5, active: false, tags: ['vegetable']));
    await itemsCollRef.doc('item4').set(TestData(
        name: 'Apple',
        value: 15,
        active: false,
        tags: ['fruit', 'green'])); // Duplicate name
  });

  // Group should be inside main
  group('BaseQueryBuilder', () {
    // Move setUp inside group
    setUp(() async {
      fakeFirestore = FakeFirebaseFirestore();
      // Create a converted collection reference for the builder
      itemsCollRef = fakeFirestore.collection('items').withConverter<TestData>(
            fromFirestore: _fromFirestore,
            toFirestore: _toFirestore,
          );

      // Add some initial data for querying
      await itemsCollRef.doc('item1').set(TestData(
          name: 'Apple', value: 10, active: true, tags: ['fruit', 'red']));
      await itemsCollRef.doc('item2').set(TestData(
          name: 'Banana', value: 20, active: true, tags: ['fruit', 'yellow']));
      await itemsCollRef.doc('item3').set(TestData(
          name: 'Carrot', value: 5, active: false, tags: ['vegetable']));
      await itemsCollRef.doc('item4').set(TestData(
          name: 'Apple',
          value: 15,
          active: false,
          tags: ['fruit', 'green'])); // Duplicate name
    });
    // Initialization test (kept synchronous for now)
    test('should initialize correctly', () async {
      // Make test async
      final builder = TestQueryBuilder(
        firestore: fakeFirestore,
        collectionRef: itemsCollRef,
      );
      expect(builder, isA<BaseQueryBuilder<TestData>>());
      expect(
          builder.query, itemsCollRef); // Initial query should be the base ref
    }); // Close initialization test

    // --- Where Tests ---
    test('where() should filter with isEqualTo', () async {
      final builder = TestQueryBuilder(
          firestore: fakeFirestore, collectionRef: itemsCollRef);
      // Use the test helper which calls the protected where
      final results = await builder
          .testWhere(fieldPath: 'active', isEqualTo: true)
          .getData();
      expect(results.length, 2);
      expect(results.any((d) => d.name == 'Apple' && d.value == 10), isTrue);
      expect(results.any((d) => d.name == 'Banana'), isTrue);
    });

    test('where() should filter with isGreaterThan', () async {
      final builder = TestQueryBuilder(
          firestore: fakeFirestore, collectionRef: itemsCollRef);
      final results = await builder
          .testWhere(fieldPath: 'value', isGreaterThan: 10)
          .getData();
      expect(results.length, 2);
      expect(results.any((d) => d.name == 'Banana'), isTrue); // value: 20
      expect(results.any((d) => d.name == 'Apple' && d.value == 15),
          isTrue); // value: 15
    });

    test('where() should filter with arrayContains', () async {
      final builder = TestQueryBuilder(
          firestore: fakeFirestore, collectionRef: itemsCollRef);
      final results = await builder
          .testWhere(fieldPath: 'tags', arrayContains: 'fruit')
          .getData();
      expect(results.length, 3); // Apple(10), Banana(20), Apple(15)
      expect(results.any((d) => d.name == 'Carrot'), isFalse);
    });

    test('where() should chain multiple conditions', () async {
      final builder = TestQueryBuilder(
          firestore: fakeFirestore, collectionRef: itemsCollRef);
      final results = await builder
          .testWhere(fieldPath: 'tags', arrayContains: 'fruit')
          .testWhere(fieldPath: 'active', isEqualTo: true)
          .getData();
      expect(results.length, 2); // Apple(10), Banana(20)
      expect(results.any((d) => d.name == 'Apple' && d.value == 10), isTrue);
      expect(results.any((d) => d.name == 'Banana'), isTrue);
    });

    // --- OrderBy Tests ---
    test('orderBy() should sort results', () async {
      final builder = TestQueryBuilder(
          firestore: fakeFirestore, collectionRef: itemsCollRef);
      final results =
          await builder.orderBy('value').getData(); // Default ascending
      expect(results.length, 4);
      expect(results[0].name, equals('Carrot')); // value: 5
      expect(results[1].name, equals('Apple')); // value: 10
      expect(results[2].name, equals('Apple')); // value: 15
      expect(results[3].name, equals('Banana')); // value: 20
    });

    test('orderBy() descending should sort results', () async {
      final builder = TestQueryBuilder(
          firestore: fakeFirestore, collectionRef: itemsCollRef);
      final results =
          await builder.orderBy('value', descending: true).getData();
      expect(results.length, 4);
      expect(results[0].name, equals('Banana')); // value: 20
      expect(results[1].name, equals('Apple')); // value: 15
      expect(results[2].name, equals('Apple')); // value: 10
      expect(results[3].name, equals('Carrot')); // value: 5
    });

    // --- Limit Tests ---
    test('limit() should restrict number of results', () async {
      final builder = TestQueryBuilder(
          firestore: fakeFirestore, collectionRef: itemsCollRef);
      final results = await builder.orderBy('value').limit(2).getData();
      expect(results.length, 2);
      expect(results[0].name, equals('Carrot')); // value: 5
      expect(results[1].name, equals('Apple')); // value: 10
    });

    test('limitToLast() should restrict number of results from end', () async {
      final builder = TestQueryBuilder(
          firestore: fakeFirestore, collectionRef: itemsCollRef);
      // limitToLast requires orderBy
      final results = await builder.orderBy('value').limitToLast(2).getData();
      expect(results.length, 2);
      expect(results[0].name, equals('Apple')); // value: 15
      expect(results[1].name, equals('Banana')); // value: 20
    });

    // --- Cursor Tests ---
    // Note: fake_cloud_firestore might have limitations with cursors. These tests verify the methods are called.
    test('startAt() should apply cursor', () async {
      final builder = TestQueryBuilder(
          firestore: fakeFirestore, collectionRef: itemsCollRef);
      // Get a snapshot to start at (e.g., the second Apple)
      final startDoc = await itemsCollRef.doc('item4').get();

      final results =
          await builder.orderBy('value').startAtDocument(startDoc).getData();
      // Fake implementation might not perfectly replicate cursor behavior,
      // but we expect it to return results including and after the cursor.
      expect(results.length, 2); // Apple(15), Banana(20)
      expect(results[0].name, equals('Apple'));
      expect(results[0].value, equals(15));
      expect(results[1].name, equals('Banana'));
    });

    test('endBefore() should apply cursor', () async {
      final builder = TestQueryBuilder(
          firestore: fakeFirestore, collectionRef: itemsCollRef);
      // Get a snapshot to end before (e.g., the second Apple)
      final endDoc = await itemsCollRef.doc('item4').get();

      final results =
          await builder.orderBy('value').endBeforeDocument(endDoc).getData();
      // Expect results before the cursor.
      expect(results.length, 2); // Carrot(5), Apple(10)
      expect(results[0].name, equals('Carrot'));
      expect(results[1].name, equals('Apple'));
      expect(results[1].value, equals(10));
    });

    // --- Execution Tests ---
    test('get() should return QuerySnapshot', () async {
      final builder = TestQueryBuilder(
          firestore: fakeFirestore, collectionRef: itemsCollRef);
      final snapshot =
          await builder.testWhere(fieldPath: 'active', isEqualTo: false).get();
      expect(snapshot, isA<QuerySnapshot<TestData>>());
      expect(snapshot.docs.length, 2); // Carrot, Apple(15)
    });

    test('getData() should return List<TData>', () async {
      final builder = TestQueryBuilder(
          firestore: fakeFirestore, collectionRef: itemsCollRef);
      final dataList = await builder
          .testWhere(fieldPath: 'active', isEqualTo: false)
          .getData();
      expect(dataList, isA<List<TestData>>());
      expect(dataList.length, 2);
      expect(dataList.any((d) => d.name == 'Carrot'), isTrue);
      expect(dataList.any((d) => d.name == 'Apple' && d.value == 15), isTrue);
    });

    // Check internal state if possible/needed

    // --- Other tests would go here ---
  }); // Close group block
} // Close main block
