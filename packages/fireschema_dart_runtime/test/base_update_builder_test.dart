import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:fake_cloud_firestore/fake_cloud_firestore.dart';
import 'package:fireschema_dart_runtime/src/base_update_builder.dart'; // Import base class
import 'package:test/test.dart';

// --- Test Data Structures ---
class TestData {
  final String? id;
  final String? name;
  final int?
      value; // Changed back to int? as increment result type was the issue
  final bool? active;
  final List<String>? tags;
  final Timestamp? updatedAt; // For serverTimestamp testing

  TestData(
      {this.id, this.name, this.value, this.active, this.tags, this.updatedAt});

  // Helper for comparison in tests
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is TestData &&
          runtimeType == other.runtimeType &&
          id == other.id &&
          name == other.name &&
          value == other.value && // Compare int? directly
          active == other.active &&
          // Basic list equality check for simplicity in tests
          (tags == other.tags ||
              (tags != null &&
                  other.tags != null &&
                  tags!.length == other.tags!.length &&
                  List.generate(tags!.length, (i) => tags![i] == other.tags![i])
                      .every((e) => e))) &&
          updatedAt == other.updatedAt;

  @override
  int get hashCode =>
      id.hashCode ^
      name.hashCode ^
      value.hashCode ^
      active.hashCode ^
      tags.hashCode ^
      updatedAt.hashCode;

  Map<String, dynamic> toMap() => {
        if (name != null) 'name': name,
        if (value != null) 'value': value,
        if (active != null) 'active': active,
        if (tags != null) 'tags': tags,
        if (updatedAt != null) 'updatedAt': updatedAt,
      };
}

// --- Firestore Converters ---
TestData _fromFirestore(
    DocumentSnapshot<Map<String, dynamic>> snapshot, SnapshotOptions? options) {
  final data = snapshot.data() ?? {}; // Handle non-existent doc
  // Handle potential double from increment before casting
  num? valueAsNum = data['value'] as num?;
  int? valueAsInt = valueAsNum?.toInt();

  return TestData(
    id: snapshot.id,
    name: data['name'] as String?,
    value: valueAsInt, // Use the converted int?
    active: data['active'] as bool?,
    tags: (data['tags'] as List<dynamic>?)?.map((e) => e as String).toList(),
    updatedAt: data['updatedAt'] as Timestamp?,
  );
}

Map<String, Object?> _toFirestore(TestData data, SetOptions? options) {
  // This converter is primarily used for `set`, `updateDoc` uses raw maps.
  return data.toMap();
}

// --- Concrete Test Implementation ---
// This class provides public methods that simulate generated builder methods.
// These public methods CAN call the protected base methods (set, increment etc.)
// because the call originates from within the subclass definition.
class TestUpdateBuilder extends BaseUpdateBuilder<TestData> {
  TestUpdateBuilder({
    required DocumentReference<TestData> docRef,
  }) : super(docRef: docRef);

  // Public methods simulating generated builder methods
  TestUpdateBuilder set(String fieldPath, dynamic value) {
    super.set(fieldPath, value); // Use super to call the base method
    return this;
  }

  TestUpdateBuilder increment(String fieldPath, num value) {
    super.increment(fieldPath, value); // Use super to call the base method
    return this;
  }

  TestUpdateBuilder arrayUnion(String fieldPath, List<dynamic> values) {
    super.arrayUnion(fieldPath, values); // Use super to call the base method
    return this;
  }

  TestUpdateBuilder arrayRemove(String fieldPath, List<dynamic> values) {
    super.arrayRemove(fieldPath, values); // Use super to call the base method
    return this;
  }

  TestUpdateBuilder serverTimestamp(String fieldPath) {
    super.serverTimestamp(fieldPath); // Use super to call the base method
    return this;
  }

  TestUpdateBuilder deleteField(String fieldPath) {
    super.deleteField(fieldPath); // Use super to call the base method
    return this;
  }
  // NOTE: Cannot add a getter here to access _updateData from the test file.
}

void main() {
  late FakeFirebaseFirestore fakeFirestore;
  late DocumentReference<TestData> docRef;
  const docId = 'testDoc';

  setUp(() async {
    fakeFirestore = FakeFirebaseFirestore();
    // Create a converted doc reference for the builder
    docRef =
        fakeFirestore.collection('items').doc(docId).withConverter<TestData>(
              fromFirestore: _fromFirestore,
              toFirestore: _toFirestore,
            );

    // Add initial data using raw map for consistency
    await fakeFirestore.collection('items').doc(docId).set({
      'name': 'Initial Name',
      'value': 100, // Initial value as int
      'active': true,
      'tags': ['a', 'b']
    });
  });

  group('BaseUpdateBuilder', () {
    test('should initialize correctly', () {
      final builder = TestUpdateBuilder(docRef: docRef);
      expect(builder, isA<BaseUpdateBuilder<TestData>>());
      // Cannot directly test internal _updateData state due to privacy
    });

    // We test the protected methods indirectly by calling commit()
    // and verifying the results in the fake database.

    test('commit() applies simple set update', () async {
      final builder = TestUpdateBuilder(docRef: docRef);
      // Use the public method on the TestUpdateBuilder instance to stage data
      builder.set('name', 'Updated Name');
      await builder.commit();

      final snapshot = await fakeFirestore.collection('items').doc(docId).get();
      // Use _fromFirestore to read data back for consistent type handling
      final testData = _fromFirestore(snapshot, null);
      expect(testData.name, equals('Updated Name'));
      expect(testData.value, equals(100)); // Unchanged
    });

    test('commit() applies increment update', () async {
      final builder = TestUpdateBuilder(docRef: docRef);
      builder.increment('value', 5); // Increment by int
      await builder.commit();

      final snapshot = await fakeFirestore.collection('items').doc(docId).get();
      final testData = _fromFirestore(snapshot, null);
      expect(testData.value, equals(105)); // 100 + 5
    });

    test('commit() applies increment update with double', () async {
      final builder = TestUpdateBuilder(docRef: docRef);
      builder.increment('value', -0.5); // Increment by double
      await builder.commit();

      final snapshot = await fakeFirestore.collection('items').doc(docId).get();
      final testData = _fromFirestore(snapshot, null);
      // Firestore stores increments as double if input is double
      // Our _fromFirestore now handles num? -> int? conversion
      expect(testData.value, equals(99)); // 100 - 0.5 truncated to int
    });

    test('commit() applies arrayUnion update', () async {
      final builder = TestUpdateBuilder(docRef: docRef);
      builder.arrayUnion('tags', ['c', 'd']);
      await builder.commit();

      final snapshot = await fakeFirestore.collection('items').doc(docId).get();
      final testData = _fromFirestore(snapshot, null);
      expect(testData.tags, containsAll(['a', 'b', 'c', 'd']));
      expect(testData.tags?.length, 4);
    });

    test('commit() applies arrayRemove update', () async {
      final builder = TestUpdateBuilder(docRef: docRef);
      builder.arrayRemove('tags', ['a', 'c']); // Remove 'a', 'c' is not present
      await builder.commit();

      final snapshot = await fakeFirestore.collection('items').doc(docId).get();
      final testData = _fromFirestore(snapshot, null);
      expect(testData.tags, equals(['b'])); // Only 'b' remains
    });

    test('commit() applies serverTimestamp update', () async {
      final builder = TestUpdateBuilder(docRef: docRef);
      builder.serverTimestamp('updatedAt');
      await builder.commit();

      final snapshot = await fakeFirestore.collection('items').doc(docId).get();
      final testData = _fromFirestore(snapshot, null);
      expect(testData.updatedAt, isA<Timestamp>());
    });

    test('commit() applies deleteField update', () async {
      final builder = TestUpdateBuilder(docRef: docRef);
      builder.deleteField('active');
      await builder.commit();

      final snapshot = await fakeFirestore.collection('items').doc(docId).get();
      // Check raw data as field won't exist in TestData object
      expect(snapshot.data()?.containsKey('active'), isFalse);
    });

    test('commit() applies multiple updates correctly', () async {
      final builder = TestUpdateBuilder(docRef: docRef);
      builder
          .set('name', 'Multi Update')
          .increment('value', -10) // 100 -> 90
          .arrayUnion('tags', ['new']) // ['a', 'b', 'new']
          .deleteField('active');
      await builder.commit();

      final snapshot = await fakeFirestore.collection('items').doc(docId).get();
      final testData = _fromFirestore(snapshot, null);
      final rawData = snapshot.data();

      expect(testData.name, equals('Multi Update'));
      expect(testData.value, equals(90));
      expect(testData.tags, containsAll(['a', 'b', 'new']));
      expect(testData.tags?.length, 3);
      expect(rawData?.containsKey('active'),
          isFalse); // Check raw data for deletion
    });

    test('commit() does nothing if no updates are staged', () async {
      final builder = TestUpdateBuilder(docRef: docRef);
      final initialSnapshot =
          await fakeFirestore.collection('items').doc(docId).get();

      await builder.commit(); // Commit with no staged updates

      final finalSnapshot =
          await fakeFirestore.collection('items').doc(docId).get();
      // Verify data hasn't changed
      expect(finalSnapshot.data(), equals(initialSnapshot.data()));
    });

    test('commit() does nothing if called twice without new data', () async {
      final builder = TestUpdateBuilder(docRef: docRef);

      builder.set('name', 'First Commit');
      await builder.commit();

      final snapshot1 =
          await fakeFirestore.collection('items').doc(docId).get();
      expect(snapshot1.data()?['name'], equals('First Commit'));

      // Call commit again immediately (staged data is cleared internally by commit)
      await builder.commit();

      final snapshot2 =
          await fakeFirestore.collection('items').doc(docId).get();
      // Data should be identical to after the first commit
      expect(snapshot2.data(), equals(snapshot1.data()));
    });
  }); // Close group
} // Close main
