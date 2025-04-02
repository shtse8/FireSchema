import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:fake_cloud_firestore/fake_cloud_firestore.dart';
import 'package:fireschema_dart_runtime/src/base_collection_ref.dart'; // Import base class
import 'package:test/test.dart';

// --- Test Data Structures ---
class TestData {
  final String? id;
  final String name;
  final int? value;
  final DateTime? createdAt;

  TestData({this.id, required this.name, this.value, this.createdAt});

  // Basic equality for testing
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is TestData &&
          runtimeType == other.runtimeType &&
          id == other.id &&
          name == other.name &&
          value == other.value &&
          createdAt == other.createdAt;

  @override
  int get hashCode =>
      id.hashCode ^ name.hashCode ^ value.hashCode ^ createdAt.hashCode;

  Map<String, dynamic> toMap() => {
        'name': name,
        if (value != null) 'value': value,
        if (createdAt != null) 'createdAt': Timestamp.fromDate(createdAt!),
      };
}

// For add operations, ID is not present, createdAt might be FieldValue
// Class for adding data, implementing the required interface
class TestAddData implements ToJsonSerializable {
  final String name;
  final int? value;
  // Can accept DateTime or FieldValue for server timestamp during add
  final dynamic createdAt; // Use dynamic to allow DateTime or FieldValue

  TestAddData({required this.name, this.value, this.createdAt});

  @override
  Map<String, Object?> toJson() {
    final map = <String, Object?>{
      'name': name,
    };
    if (value != null) {
      map['value'] = value;
    }
    // Handle both DateTime and FieldValue for createdAt
    if (createdAt is DateTime) {
      map['createdAt'] = Timestamp.fromDate(createdAt as DateTime);
    } else if (createdAt != null) {
      // Assume it's a FieldValue (like serverTimestamp())
      map['createdAt'] = createdAt;
    }
    return map;
  }
}

// --- Firestore Converters ---
TestData _fromFirestore(
    DocumentSnapshot<Map<String, dynamic>> snapshot, SnapshotOptions? options) {
  final data = snapshot.data()!;
  return TestData(
    id: snapshot.id,
    name: data['name'] as String,
    value: data['value'] as int?,
    createdAt: (data['createdAt'] as Timestamp?)?.toDate(),
  );
}

Map<String, Object?> _toFirestore(TestData data, SetOptions? options) {
  // Don't include ID when writing to Firestore
  return {
    'name': data.name,
    if (data.value != null) 'value': data.value,
    // Let serverTimestamp handle createdAt if null, otherwise convert
    if (data.createdAt != null)
      'createdAt': Timestamp.fromDate(data.createdAt!),
  };
}

// --- Concrete Test Implementation ---
class TestCollectionRef extends BaseCollectionRef<TestData, TestAddData> {
  TestCollectionRef({
    required FirebaseFirestore firestore,
    required String collectionId,
    CollectionSchema? schema,
    DocumentReference? parentRef,
  }) : super(
          firestore: firestore,
          collectionId: collectionId,
          schema: schema,
          parentRef: parentRef,
          fromFirestore: _fromFirestore,
          toFirestore: _toFirestore,
        );
}

// --- Subcollection Test Implementation ---
class TestSubCollectionRef extends BaseCollectionRef<TestData, TestAddData> {
  TestSubCollectionRef({
    required FirebaseFirestore firestore,
    required String collectionId,
    CollectionSchema? schema,
    DocumentReference? parentRef,
  }) : super(
          firestore: firestore,
          collectionId: collectionId,
          schema: schema,
          parentRef: parentRef,
          fromFirestore: _fromFirestore,
          toFirestore: _toFirestore,
        );
}

// Factory for subcollection test
TestSubCollectionRef _subCollectionFactory({
  required FirebaseFirestore firestore,
  required String collectionId,
  CollectionSchema? schema,
  required DocumentReference? parentRef,
}) {
  return TestSubCollectionRef(
    firestore: firestore,
    collectionId: collectionId,
    schema: schema,
    parentRef: parentRef,
  );
}

void main() {
  late FakeFirebaseFirestore fakeFirestore;

  setUp(() {
    fakeFirestore = FakeFirebaseFirestore();
  });

  group('BaseCollectionRef', () {
    // --- Constructor Tests ---
    test('should initialize correctly for a root collection', () {
      final testCollection = TestCollectionRef(
        firestore: fakeFirestore,
        collectionId: 'items',
      );

      expect(testCollection, isA<BaseCollectionRef<TestData, TestAddData>>());
      expect(testCollection.collectionId, equals('items'));
      expect(testCollection.ref.path, equals('items'));
      expect(testCollection.parentRef, isNull);
      // Check if converter is attached (indirectly by checking type)
      expect(testCollection.ref, isA<CollectionReference<TestData>>());
    });

    test('should initialize correctly for a subcollection', () {
      final parentDocRef = fakeFirestore.collection('parents').doc('parentId');
      final testCollection = TestCollectionRef(
        firestore: fakeFirestore,
        collectionId: 'subItems',
        parentRef: parentDocRef,
      );

      expect(testCollection.collectionId, equals('subItems'));
      expect(testCollection.ref.path, equals('parents/parentId/subItems'));
      expect(testCollection.parentRef, equals(parentDocRef));
      expect(testCollection.ref, isA<CollectionReference<TestData>>());
    });

    // --- doc() Tests ---
    test('doc() should return correctly typed DocumentReference', () {
      final testCollection = TestCollectionRef(
        firestore: fakeFirestore,
        collectionId: 'items',
      );
      const docId = 'testDoc123';
      final docRef = testCollection.doc(docId);

      expect(docRef, isA<DocumentReference<TestData>>());
      expect(docRef.id, equals(docId));
      expect(docRef.path, equals('items/$docId'));
    });

    // --- applyDefaults() Tests ---
    test('applyDefaults should add serverTimestamp if field is null', () {
      final schema = {
        'fields': {
          'name': <String, dynamic>{}, // No default
          'createdAt': {'defaultValue': 'serverTimestamp'},
        }
      };
      final testCollection = TestCollectionRef(
        firestore: fakeFirestore,
        collectionId: 'items',
        schema: schema,
      );
      final inputData = {'name': 'Test Item'};
      final expectedData = {
        'name': 'Test Item',
        'createdAt': FieldValue.serverTimestamp(), // Expect FieldValue object
      };

      final result = testCollection.applyDefaults(inputData);

      // FieldValue.serverTimestamp() doesn't have a standard equality check
      expect(result['name'], equals(expectedData['name']));
      expect(result['createdAt'], isA<FieldValue>());
      // We can't easily compare FieldValue instances directly in unit tests
      // without more complex mocking. Checking the type is often sufficient.
    });

    test(
        'applyDefaults should add basic types (String, num, bool) if field is null',
        () {
      final schema = {
        'fields': {
          'name': {'defaultValue': 'Default Name'},
          'value': {'defaultValue': 0},
          'active': {'defaultValue': true},
          'existingValue': {'defaultValue': 99},
        }
      };
      final testCollection = TestCollectionRef(
        firestore: fakeFirestore,
        collectionId: 'items',
        schema: schema,
      );
      final inputData = {'existingValue': 100}; // Provide one value
      final expectedData = {
        'name': 'Default Name',
        'value': 0,
        'active': true,
        'existingValue': 100, // Should not be overwritten
      };

      final result = testCollection.applyDefaults(inputData);
      expect(result, equals(expectedData));
    });

    test('applyDefaults should not overwrite existing values', () {
      final schema = {
        'fields': {
          'name': {'defaultValue': 'Default Name'},
          'createdAt': {'defaultValue': 'serverTimestamp'},
        }
      };
      final testCollection = TestCollectionRef(
        firestore: fakeFirestore,
        collectionId: 'items',
        schema: schema,
      );
      final specificDate = DateTime.now();
      final inputData = {
        'name': 'Specific Name',
        'createdAt':
            Timestamp.fromDate(specificDate), // Provide specific timestamp
      };
      final expectedData = {
        'name': 'Specific Name',
        'createdAt': Timestamp.fromDate(specificDate),
      };

      final result = testCollection.applyDefaults(inputData);
      expect(result, equals(expectedData));
      // Ensure serverTimestamp wasn't added
      expect(result['createdAt'], isNot(isA<FieldValue>()));
    }); // <-- Add missing closing brace and parenthesis

    // --- add() Tests ---
    test('add() should add document with defaults applied', () async {
      final schema = {
        'fields': {
          'createdAt': {'defaultValue': 'serverTimestamp'},
          'value': {'defaultValue': 0}, // Add another default
        }
      };
      final testCollection = TestCollectionRef(
        firestore: fakeFirestore,
        collectionId: 'items',
        schema: schema,
      );
      // Input data missing 'createdAt' and 'value'
      final inputData = TestAddData(name: 'New Item'); // Use TestAddData class

      final newDocRef = await testCollection.add(inputData);
      expect(newDocRef, isA<DocumentReference<TestData>>());

      // Verify data in fake Firestore
      final snapshot =
          await fakeFirestore.collection('items').doc(newDocRef.id).get();
      expect(snapshot.exists, isTrue);
      final data = snapshot.data();
      expect(data?['name'], equals('New Item'));
      expect(data?['value'], equals(0)); // Check numeric default
      // Check serverTimestamp was added (fake_cloud_firestore represents it)
      expect(data?['createdAt'], isA<Timestamp>());
    });

    test('add() should return correctly typed DocumentReference', () async {
      final testCollection = TestCollectionRef(
        firestore: fakeFirestore,
        collectionId: 'items',
      );
      final inputData =
          TestAddData(name: 'Another Item'); // Use TestAddData class
      final newDocRef = await testCollection.add(inputData);

      expect(newDocRef, isA<DocumentReference<TestData>>());
      expect(newDocRef.path, startsWith('items/')); // Path should be correct
    });

    // --- set() Tests ---
    test('set() should write document data using converter', () async {
      final testCollection = TestCollectionRef(
        firestore: fakeFirestore,
        collectionId: 'items',
      );
      const docId = 'item1';
      final dataToSet = TestData(name: 'Set Item', value: 100);

      await testCollection.set(docId, dataToSet);

      // Verify using fake Firestore's raw access
      final snapshot = await fakeFirestore.collection('items').doc(docId).get();
      expect(snapshot.exists, isTrue);
      expect(snapshot.data()?['name'], equals('Set Item'));
      expect(snapshot.data()?['value'], equals(100));
      expect(snapshot.data()?['createdAt'], isNull); // Not set in TestData
    });

    test('set() with merge should merge document data', () async {
      final testCollection = TestCollectionRef(
        firestore: fakeFirestore,
        collectionId: 'items',
      );
      const docId = 'itemToMerge';
      // Pre-populate data
      await fakeFirestore
          .collection('items')
          .doc(docId)
          .set({'name': 'Original Name', 'value': 50});

      // Data to merge (only name)
      final dataToMerge = TestData(name: 'Merged Name');

      // Perform merge set using the runtime method
      await testCollection.set(docId, dataToMerge, SetOptions(merge: true));

      // Verify merged data
      final snapshot = await fakeFirestore.collection('items').doc(docId).get();
      expect(snapshot.exists, isTrue);
      expect(snapshot.data()?['name'], equals('Merged Name')); // Updated
      expect(snapshot.data()?['value'], equals(50)); // Original value retained
    });

    // --- delete() Tests ---
    test('delete() should remove the document', () async {
      final testCollection = TestCollectionRef(
        firestore: fakeFirestore,
        collectionId: 'items',
      );
      const docId = 'itemToDelete';
      // Add a document first
      await fakeFirestore
          .collection('items')
          .doc(docId)
          .set({'name': 'Delete Me'});

      // Ensure it exists
      var snapshot = await fakeFirestore.collection('items').doc(docId).get();
      expect(snapshot.exists, isTrue);

      // Delete using the runtime method
      await testCollection.delete(docId);

      // Verify it's gone
      snapshot = await fakeFirestore.collection('items').doc(docId).get();
      expect(snapshot.exists, isFalse);
    });

    // --- get() Tests ---
    test('get() should retrieve and convert document data', () async {
      final testCollection = TestCollectionRef(
        firestore: fakeFirestore,
        collectionId: 'items',
      );
      const docId = 'itemToGet';
      final now = DateTime.now();
      // Add raw data
      await fakeFirestore.collection('items').doc(docId).set({
        'name': 'Get Me',
        'value': 42,
        'createdAt': Timestamp.fromDate(now),
      });

      // Get using the runtime method (which uses the converter)
      final result = await testCollection.get(docId);

      expect(result, isNotNull);
      expect(result, isA<TestData>());
      expect(result?.id, equals(docId));
      expect(result?.name, equals('Get Me'));
      expect(result?.value, equals(42));
      // Compare DateTime components as direct equality might fail due to precision
      expect(result?.createdAt?.year, equals(now.year));
      expect(result?.createdAt?.month, equals(now.month));
      expect(result?.createdAt?.day, equals(now.day));
      expect(result?.createdAt?.hour, equals(now.hour));
      expect(result?.createdAt?.minute, equals(now.minute));
    });

    test('get() should return null if document does not exist', () async {
      final testCollection = TestCollectionRef(
        firestore: fakeFirestore,
        collectionId: 'items',
      );
      const docId = 'nonExistentItem';

      final result = await testCollection.get(docId);

      expect(result, isNull);
    });

    // --- subCollection() Tests ---
    test('subCollection() should call factory with correct parameters', () {
      final testCollection = TestCollectionRef(
        firestore: fakeFirestore,
        collectionId: 'parents',
      );
      const parentId = 'parent1';
      const subCollectionId = 'children';
      final subSchema = {
        'fields': {
          'age': {'defaultValue': 0}
        }
      };

      // Call the protected helper method
      final subCollectionInstance = testCollection
          .subCollection<TestData, TestAddData, TestSubCollectionRef>(
        parentId,
        subCollectionId,
        _subCollectionFactory, // Pass the factory function
        _fromFirestore, // Pass converters (needed by factory in real scenario)
        _toFirestore,
        subSchema,
      );

      // Verify the returned instance
      expect(subCollectionInstance, isA<TestSubCollectionRef>());
      expect(subCollectionInstance.collectionId, equals(subCollectionId));
      expect(subCollectionInstance.schema, equals(subSchema));
      // Verify the parent reference path
      expect(
          subCollectionInstance.parentRef?.path, equals('parents/$parentId'));
    });

    test('applyDefaults should handle schema being null', () {
      final testCollection = TestCollectionRef(
        firestore: fakeFirestore,
        collectionId: 'items',
        schema: null, // Explicitly null schema
      );
      final inputData = {'name': 'Test Item'};
      final expectedData = {'name': 'Test Item'}; // No changes expected

      final result = testCollection.applyDefaults(inputData);
      expect(result, equals(expectedData));
    });

    test('applyDefaults should handle empty fields in schema', () {
      final schema = {'fields': <String, dynamic>{}}; // Empty fields map
      final testCollection = TestCollectionRef(
        firestore: fakeFirestore,
        collectionId: 'items',
        schema: schema,
      );
      final inputData = {'name': 'Test Item'};
      final expectedData = {'name': 'Test Item'}; // No changes expected

      final result = testCollection.applyDefaults(inputData);
      expect(result, equals(expectedData));
    });

    // Add tests for add, set, delete, get, subCollection here...
  });
}
