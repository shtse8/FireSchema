# Schema Definition (`firestore.schema.json`)

FireSchema uses JSON Schema (`draft-07`) as the foundation for defining your
Firestore collections, fields, and subcollections. This allows for a structured
and standard way to describe your database.

## Basic Structure

Your schema file (typically named `firestore.schema.json`) should have the
following root structure:

```json
{
    "schemaVersion": "1.0", // Or your desired version
    "collections": {
        "users": {
            // Collection definition for 'users'
        },
        "products": {
            // Collection definition for 'products'
        }
        // ... other top-level collections
    }
}
```

- **`schemaVersion`**: Indicates the version of your schema definition.
- **`collections`**: An object where each key represents the ID of a top-level
  collection in your Firestore database.

## Collection Definition

Each collection object within `collections` defines the structure of documents
within that collection:

```json
{
    // ... inside "collections" object ...
    "users": {
        "description": "Stores user profile information.", // Optional
        "fields": {
            // Field definitions for documents in the 'users' collection
        },
        "subcollections": {
            // Optional: Definitions for subcollections under 'users' documents
        }
    }
    // ...
}
```

- **`description`** (Optional): A brief description of the collection's purpose.
- **`fields`** (Required): An object defining the fields present in documents
  within this collection. Each key is the field name.
- **`subcollections`** (Optional): An object defining subcollections nested
  under documents in this collection. The structure mirrors the root
  `collections` object.

## Field Definition

Each field object within `fields` describes a specific field's type and
properties:

```json
{
    // ... inside "fields" object ...
    "email": {
        "type": "string", // Required: Data type
        "description": "User's primary email address.", // Optional
        "required": true, // Optional: Default is false
        "pattern": "^\\S+@\\S+\\.\\S+$" // Optional: Validation
    },
    "age": {
        "type": "number",
        "minimum": 0 // Optional: Validation
    },
    "createdAt": {
        "type": "timestamp",
        "defaultValue": "serverTimestamp" // Optional: Special default value
    },
    "tags": {
        "type": "array",
        "items": { // Required for array type
            "type": "string"
        }
    },
    "settings": {
        "type": "map",
        "properties": { // Optional for map type
            "theme": { "type": "string", "defaultValue": "light" },
            "notificationsEnabled": { "type": "boolean", "required": true }
        }
    },
    "primaryAddressRef": {
        "type": "reference",
        "referenceTo": "addresses" // Required for reference type
    }
    // ... other fields
}
```

### Supported Field Properties

- **`type`** (Required): Defines the data type. Supported values:
  - `string`: Generates `string` (TS) / `String` (Dart).
  - `number`: Generates `number` (TS) / `num` (Dart).
  - `boolean`: Generates `boolean` (TS) / `bool` (Dart).
  - `timestamp`: Generates `Timestamp` (TS, from `firebase/firestore` or
    `firebase-admin/firestore`) / `Timestamp` (Dart, from `cloud_firestore`).
  - `geopoint`: Generates `GeoPoint` (TS, from `firebase/firestore` or
    `firebase-admin/firestore`) / `GeoPoint` (Dart, from `cloud_firestore`).
  - `reference`: Generates `DocumentReference<ReferencedData>` (TS) /
    `DocumentReference<Map<String, dynamic>>` (Dart). Requires `referenceTo`.
  - `array`: Generates `ItemType[]` (TS) / `List<ItemType>` (Dart). Requires
    `items`.
  - `map`: Generates an inline object type `{...}` (TS) / `Map<String, dynamic>`
    (Dart). Can use `properties`.
- **`description`** (Optional): A string description, included as TSDoc/DartDoc
  in generated code.
- **`required`** (Optional, boolean, default: `false`): If `true`, the field is
  non-nullable in generated types. Dart runtime checks this during `fromJson`.
- **`defaultValue`** (Optional): A literal value (string, number, boolean,
  array, object) or the special string `"serverTimestamp"` (only for `timestamp`
  type). Applied by the Dart runtime's `add()` method if the field is omitted
  during document creation. _Note: Default values are primarily handled by the
  Dart runtime currently._
- **`referenceTo`** (Required if `type` is `reference`): String path to the
  referenced collection (e.g., `"users"` or `"addresses"`). Used for typed
  `DocumentReference` generation in TypeScript.
- **`items`** (Required if `type` is `array`): Another field definition object
  describing the elements within the array.
- **`properties`** (Optional if `type` is `map`): An object where keys are
  property names and values are field definition objects, defining a structured
  map. Generates nested classes/interfaces in generated code.
- **`minLength`** (Optional, number, for `string` type): Minimum string length.
  Generates Dart `assert`.
- **`maxLength`** (Optional, number, for `string` type): Maximum string length.
  Generates Dart `assert`.
- **`pattern`** (Optional, string, for `string` type): A valid JavaScript/Dart
  regex pattern string (remember to escape backslashes in JSON:
  `"^\\\\S+@\\\\S+\\\\.\\\\S+$"`). Generates Dart `assert`. _Note: Dart
  `pattern` assertion generation is currently limited due to template issues._
- **`minimum`** (Optional, number, for `number` type): Minimum numeric value
  (inclusive). Generates Dart `assert` and TS TSDoc.
- **`maximum`** (Optional, number, for `number` type): Maximum numeric value
  (inclusive). Generates Dart `assert` and TS TSDoc.
- **`x-read-only`** (Optional, boolean, default: `false`): Custom property. If
  `true`, the field is excluded from generated Dart `AddData` classes and
  `set<FieldName>` methods in Dart `UpdateBuilder`.

## Subcollections

Subcollections are defined within a collection's definition using the
`subcollections` key. The structure is identical to the root `collections`
object, allowing for arbitrary nesting.

```json
{
    // ... inside "users" collection definition ...
    "subcollections": {
        "posts": {
            "description": "Posts created by the user.",
            "fields": {
                "title": { "type": "string", "required": true },
                "content": { "type": "string" },
                "publishedAt": { "type": "timestamp" }
            }
        },
        "orders": {
            // ... definition for 'orders' subcollection ...
        }
    }
    // ...
}
```

## Example

Refer to the `examples/firestore.schema.json` file in the FireSchema repository
for a practical example demonstrating these concepts. You can also find the
formal validation schema used by the generator at `src/schema-definition.json`.
