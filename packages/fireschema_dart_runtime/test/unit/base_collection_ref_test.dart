import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:cloud_firestore_platform_interface/cloud_firestore_platform_interface.dart';
import 'package:fake_cloud_firestore/fake_cloud_firestore.dart';
import 'package:fireschema_dart_runtime/fireschema_dart_runtime.dart';
import 'package:fireschema_dart_runtime/src/types.dart'; // Import for ToJsonSerializable
import 'package:flutter_test/flutter_test.dart';
// Removed mockito import as fake_cloud_firestore is used

// --- Top-Level Test Data Classes ---

// Simple data class for testing (Level 1)
class TestData {
  final String? id;
  final String name;
  final int value;
  final Timestamp? createdAt;

  TestData({this.id, required this.name, required this.value, this.createdAt});

  factory TestData.fromFirestore(
      DocumentSnapshot<Map<String, dynamic>> snapshot,
      SnapshotOptions? options) {
    final data = snapshot.data()!;
    return TestData(
      id: snapshot.id,
      name: data['name'] as String,
      value: data['value'] as int,
      createdAt: data['createdAt'] as Timestamp?,
    );
  }

  // Match the required signature for the converter
  Map<String, Object?> toFirestore(SetOptions? options) {
    return {
      'name': name,
      'value': value,
      // Let serverTimestamp handle createdAt during add/update
      if (createdAt != null &&
          (options == null ||
              options.mergeFields == null ||
              !options.mergeFields!.contains('createdAt')))
        'createdAt': createdAt,
    };
  }
}

// Add type for TestData - must implement ToJsonSerializable
class TestAddData implements ToJsonSerializable {
  final String name;
  final int value;

  TestAddData({required this.name, required this.value});

  @override
  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'value': value,
    };
  }
}

// --- Subcollection Types/Classes for Testing (Level 2) ---
class SubTestData {
  final String? id;
  final String description;

  SubTestData({this.id, required this.description});

  factory SubTestData.fromFirestore(
      DocumentSnapshot<Map<String, dynamic>> snapshot,
      SnapshotOptions? options) {
    final data = snapshot.data()!;
    return SubTestData(
      id: snapshot.id,
      description: data['description'] as String,
    );
  }

  Map<String, Object?> toFirestore(SetOptions? options) {
    return {'description': description};
  }
}

class SubTestAddData implements ToJsonSerializable {
  final String description;
  SubTestAddData({required this.description});

  @override
  Map<String, dynamic> toJson() => {'description': description};
}

// Concrete implementation for testing BaseCollectionRef (Level 1)
class TestCollection extends BaseCollectionRef<TestData, TestAddData> {
  TestCollection(FirebaseFirestore firestore, {CollectionSchema? schema})
      : super(
          firestore: firestore,
          collectionId: 'test-items',
          fromFirestore: TestData.fromFirestore,
          toFirestore: (TestData data, SetOptions? options) =>
              data.toFirestore(options),
          schema: schema,
        );

  // Method to access subcollection for testing
  TestSubCollection subItems(String parentId) {
    // Define the factory function required by the base subCollection method
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
      'sub-items', // Subcollection path ID
      subFactory,
      SubTestData.fromFirestore, // Pass converter functions
      (SubTestData data, SetOptions? options) => data.toFirestore(options),
      null, // No specific schema for subcollection in this test
    );
  }
}

// Concrete implementation for testing Subcollection (Level 2)
class TestSubCollection extends BaseCollectionRef<SubTestData, SubTestAddData> {
  TestSubCollection({
    required FirebaseFirestore firestore,
    required String collectionId,
    CollectionSchema? schema,
    required DocumentReference?
        parentRef, // parentRef is required by subCollection factory
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

void main() {
  late FakeFirebaseFirestore fakeFirestore;
  late TestCollection testCollection;
  late CollectionSchema schemaWithDefaults;

  setUp(() {
    fakeFirestore = FakeFirebaseFirestore();
    // Use Map literals for schema, matching the typedefs
    schemaWithDefaults = {
      'fields': {
        'createdAt': {'defaultValue': 'serverTimestamp'}, // Use string literal
        'value': {'defaultValue': 0},
      }
    };
    // Instantiate with the fake Firestore instance
    testCollection = TestCollection(fakeFirestore);
  });

  group('BaseCollectionRef Unit Tests (Dart)', () {
    test('doc() returns correct DocumentReference path', () {
      const docId = 'test-doc-123';
      final docRef = testCollection.doc(docId);
      expect(docRef.path, equals('test-items/test-doc-123'));
    });

    test('applyDefaults adds serverTimestamp when field is missing', () {
      final collectionWithSchema =
          TestCollection(fakeFirestore, schema: schemaWithDefaults);
      final data =
          TestAddData(name: 'Test Name', value: 10); // createdAt is missing
      // Call toJson() before passing to applyDefaults
      final dataWithDefaults =
          collectionWithSchema.applyDefaults(data.toJson());

      expect(dataWithDefaults['name'], equals('Test Name'));
      expect(
          dataWithDefaults['value'], equals(10)); // Should keep provided value
      expect(
          dataWithDefaults['createdAt'], equals(FieldValue.serverTimestamp()));
    });

    test('applyDefaults adds numeric default when field is missing', () {
      final collectionWithSchema =
          TestCollection(fakeFirestore, schema: schemaWithDefaults);
      // Provide name, omit value
      // Provide value as it's required by TestAddData constructor
      final data = TestAddData(
          name: 'Test Name',
          value: 999); // Use a dummy value, default should override
      // Call toJson() before passing to applyDefaults
      final dataWithDefaults =
          collectionWithSchema.applyDefaults(data.toJson());

      expect(dataWithDefaults['name'], equals('Test Name'));
      expect(
          dataWithDefaults['value'], equals(0)); // Should apply default value
      expect(dataWithDefaults['createdAt'],
          equals(FieldValue.serverTimestamp())); // Should still apply timestamp
    });

    test('applyDefaults does not overwrite existing values', () {
      final collectionWithSchema =
          TestCollection(fakeFirestore, schema: schemaWithDefaults);
      final data = TestAddData(name: 'Test Name', value: 123); // Provide value
      // Call toJson() before passing to applyDefaults
      final dataWithDefaults =
          collectionWithSchema.applyDefaults(data.toJson());

      expect(dataWithDefaults['name'], equals('Test Name'));
      expect(
          dataWithDefaults['value'], equals(123)); // Should keep provided value
      expect(
          dataWithDefaults['createdAt'], equals(FieldValue.serverTimestamp()));
    });

    test('add() creates a document and returns correct DocumentReference',
        () async {
      final dataToAdd = TestAddData(name: 'Add Test', value: 1);
      final docRef = await testCollection.add(dataToAdd);

      expect(docRef, isA<DocumentReference<TestData>>());
      expect(docRef.path, startsWith('test-items/')); // ID is generated

      // Verify data was written using the fake instance
      final snapshot =
          await fakeFirestore.collection('test-items').doc(docRef.id).get();
      expect(snapshot.exists, isTrue);
      expect(snapshot.data()?['name'], equals('Add Test'));
      expect(snapshot.data()?['value'], equals(1));
    });

    test('set() creates a document with a specific ID', () async {
      const docId = 'set-test-id';
      // Use TestData directly for set, as BaseCollectionRef.set expects TData
      final dataToSet = TestData(id: docId, name: 'Set Test', value: 2);
      await testCollection.set(docId, dataToSet);

      // Verify data using the fake instance
      final snapshot =
          await fakeFirestore.collection('test-items').doc(docId).get();
      expect(snapshot.exists, isTrue);
      expect(snapshot.data()?['name'], equals('Set Test'));
      expect(snapshot.data()?['value'], equals(2));
    });

    test('set() overwrites existing document', () async {
      const docId = 'set-overwrite-id';
      final initialData = TestData(id: docId, name: 'Initial', value: 1);
      final newData = TestData(id: docId, name: 'Overwritten', value: 2);

      await testCollection.set(docId, initialData); // Set initial
      await testCollection.set(docId, newData); // Overwrite

      // Verify overwritten data
      final snapshot =
          await fakeFirestore.collection('test-items').doc(docId).get();
      expect(snapshot.exists, isTrue);
      expect(snapshot.data()?['name'], equals('Overwritten'));
      expect(snapshot.data()?['value'], equals(2));
    });

    test('get() retrieves an existing document', () async {
      const docId = 'get-test-id';
      final dataToSet = TestData(id: docId, name: 'Get Test', value: 3);
      await testCollection.set(docId, dataToSet);

      final retrievedData = await testCollection.get(docId);

      expect(retrievedData, isNotNull);
      expect(retrievedData, isA<TestData>());
      expect(retrievedData?.id, equals(docId));
      expect(retrievedData?.name, equals('Get Test'));
      expect(retrievedData?.value, equals(3));
    });

    test('get() returns null for non-existent document', () async {
      final retrievedData = await testCollection.get('non-existent-id');
      expect(retrievedData, isNull);
    });

    test('delete() removes a document', () async {
      const docId = 'delete-test-id';
      final dataToSet = TestData(id: docId, name: 'Delete Test', value: 4);
      await testCollection.set(docId, dataToSet);

      // Verify it exists first
      var snapshot =
          await fakeFirestore.collection('test-items').doc(docId).get();
      expect(snapshot.exists, isTrue);

      // Delete using the runtime method
      await testCollection.delete(docId);

      // Verify it's gone
      snapshot = await fakeFirestore.collection('test-items').doc(docId).get();
      expect(snapshot.exists, isFalse);
      final retrievedData = await testCollection.get(docId);
      expect(retrievedData, isNull);
    });

    test('subCollection() returns correctly configured subcollection reference',
        () async {
      const parentId = 'parent-for-sub';
      // Create parent doc first so the path is valid
      await testCollection.set(
          parentId, TestData(id: parentId, name: 'Parent', value: 1));

      final subCollection = testCollection.subItems(parentId);

      expect(subCollection, isA<TestSubCollection>());
      expect(subCollection.parentRef?.path, equals('test-items/$parentId'));
      expect(subCollection.collectionId, equals('sub-items'));
      expect(subCollection.ref.path, equals('test-items/$parentId/sub-items'));

      // Test adding a document to the subcollection
      final subData = SubTestAddData(description: 'Sub Item');
      final subDocRef = await subCollection.add(subData);
      expect(subDocRef.path, startsWith('test-items/$parentId/sub-items/'));

      test('updateData() updates specific fields of a document', () async {
        const docId = 'update-data-test-id';
        final initialData =
            TestData(id: docId, name: 'Initial Update', value: 10);
        await testCollection.set(docId, initialData); // Set initial data

        // Prepare update map
        final updateMap = {
          'name': 'Partially Updated',
          'value': FieldValue.increment(5), // Use FieldValue for increment
          'newField': true, // Add a new field
        };

        // Call updateData
        await testCollection.updateData(docId, updateMap);

        // Verify using fake instance
        final snapshot =
            await fakeFirestore.collection('test-items').doc(docId).get();
        expect(snapshot.exists, isTrue);
        expect(snapshot.data()?['name'], equals('Partially Updated'));
        expect(snapshot.data()?['value'], equals(15)); // 10 + 5
        expect(snapshot.data()?['newField'], isTrue); // Check new field
      });

      // Verify using fake instance
      final subSnapshot = await fakeFirestore
          .collection('test-items')
          .doc(parentId)
          .collection('sub-items')
          .doc(subDocRef.id)
          .get();
      expect(subSnapshot.exists, isTrue);
      expect(subSnapshot.data()?['description'], equals('Sub Item'));
    });
  }); // End group
}
