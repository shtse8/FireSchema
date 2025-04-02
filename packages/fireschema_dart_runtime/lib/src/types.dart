/// Interface for classes that can be serialized to a JSON-like map.
abstract class ToJsonSerializable {
  /// Converts this instance to a Map suitable for Firestore operations.
  Map<String, Object?> toJson();
}
