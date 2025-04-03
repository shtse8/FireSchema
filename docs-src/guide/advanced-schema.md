# Advanced Schema Definition

This page covers more advanced topics related to defining your Firestore schema using JSON Schema for FireSchema.

## Using `$ref` for Reusable Definitions

JSON Schema's `$ref` keyword is a powerful feature for creating reusable schema components. This is particularly useful in Firestore schemas for defining common object structures (like an `Address` or `AuditLog`) that might appear in multiple collections or nested within different fields.

By defining a structure once and referencing it elsewhere, you ensure consistency and make schema maintenance easier.

### Defining Reusable Components

You can define reusable components under a top-level `definitions` key (or `components/schemas` which is common in OpenAPI but also works here) in your `firestore.schema.json`.

```json{4-16}
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "schemaVersion": "1.1",
  "definitions": {
    "address": {
      "type": "object",
      "description": "Standard address structure.",
      "properties": {
        "street": { "type": "string", "required": true },
        "city": { "type": "string", "required": true },
        "state": { "type": "string" },
        "zip": { "type": "string" }
      },
      "required": ["street", "city"]
    },
    "auditInfo": {
      "type": "object",
      "properties": {
        "createdAt": { "type": "timestamp", "defaultValue": "serverTimestamp" },
        "updatedAt": { "type": "timestamp", "defaultValue": "serverTimestamp" },
        "createdBy": { "type": "reference", "referenceTo": "users" }
      }
    }
  },
  "collections": {
    // ... collections will reference definitions ...
  }
}
```

### Referencing Definitions

Use the `$ref` keyword with a JSON Pointer path to reference a definition. The path typically starts with `#/definitions/` followed by the key of the definition you want to reuse.

```json{10,24}
{
  // ... definitions from above ...
  "collections": {
    "users": {
      "description": "User profiles.",
      "fields": {
        "displayName": { "type": "string", "required": true },
        "email": { "type": "string", "format": "email", "required": true },
        "shippingAddress": {
          "$ref": "#/definitions/address" // Reference the address definition
        },
        "audit": {
           "$ref": "#/definitions/auditInfo"
        }
        // ... other user fields
      }
    },
    "companies": {
      "description": "Company information.",
      "fields": {
        "companyName": { "type": "string", "required": true },
        "headquartersAddress": {
          "$ref": "#/definitions/address" // Reuse the same address definition
        },
        "audit": {
           "$ref": "#/definitions/auditInfo"
        }
        // ... other company fields
      }
    }
  }
}
```

### Benefits

-   **DRY (Don't Repeat Yourself):** Define complex structures once.
-   **Consistency:** Ensures that fields like `address` or `auditInfo` have the exact same structure wherever they are used.
-   **Maintainability:** Update the definition in one place, and the change propagates to all references.

FireSchema correctly resolves these `$ref`s during code generation, creating the necessary shared interfaces/classes (for TypeScript `object` types with `properties`) or using the referenced type directly.

## Advanced Validation Keywords

While FireSchema primarily focuses on generating type-safe structures, it also leverages some standard JSON Schema validation keywords to enhance data integrity, particularly in the generated Dart code. Support in TypeScript is mainly through type definitions and TSDoc comments.

### `pattern` (for `string`)

Defines a regular expression that the string value must match.

```json
"postalCode": {
  "type": "string",
  "description": "US Postal Code (5 digits)",
  "pattern": "^[0-9]{5}$"
}
```

-   **Dart Generation:** May include an `assert` statement with a basic `RegExp` check in the `AddData` class constructor (support might be limited for complex patterns).
-   **TypeScript Generation:** Adds TSDoc comment indicating the pattern. Runtime validation is not automatically included.

### `minLength` / `maxLength` (for `string` and `array`)

Specifies the minimum or maximum length for a string or the minimum/maximum number of items in an array.

```json
"username": {
  "type": "string",
  "minLength": 3,
  "maxLength": 20
},
"tags": {
  "type": "array",
  "items": { "type": "string" },
  "minItems": 1, // Must have at least one tag
  "maxItems": 5  // No more than 5 tags
}
```

-   **Dart Generation:** Includes `assert` statements in the `AddData` class constructor checking `length` (for strings) or `length` (for arrays).
-   **TypeScript Generation:** Adds TSDoc comments. Type definitions reflect the base type (`string` or `string[]`) but don't enforce length at compile time.

### `minimum` / `maximum` (for `number` / `integer`)

Specifies the minimum or maximum numeric value. `exclusiveMinimum` and `exclusiveMaximum` can also be used for exclusive bounds.

```json
"rating": {
  "type": "integer",
  "minimum": 1,
  "maximum": 5
},
"discount": {
    "type": "number",
    "minimum": 0.0,
    "exclusiveMaximum": 1.0 // Discount must be less than 1.0 (100%)
}
```

-   **Dart Generation:** Includes `assert` statements in the `AddData` class constructor.
-   **TypeScript Generation:** Adds TSDoc comments. Type is `number`.

### `enum` (for `string`, `number`, `integer`)

Restricts the value to a fixed set of predefined values.

```json
"status": {
  "type": "string",
  "enum": ["pending", "processing", "completed", "failed"]
}
```

-   **Dart Generation:** Generates a Dart `enum` type and uses it in the data classes. Includes an `assert` in the `AddData` constructor.
-   **TypeScript Generation:** Generates a TypeScript string literal union type (e.g., `"pending" | "processing" | ...`), providing strong compile-time checking.

### `uniqueItems` (for `array`)

Specifies that all items in the array must be unique.

```json
"subscriberEmails": {
  "type": "array",
  "items": { "type": "string", "format": "email" },
  "uniqueItems": true
}
```

-   **Dart Generation:** May include an `assert` in the `AddData` constructor that checks uniqueness by converting the list to a set and comparing lengths.
-   **TypeScript Generation:** Adds TSDoc comment. Type is `string[]`. Runtime uniqueness is not enforced by the type system.

**Important Note:** While Dart generation includes `assert` statements for some validations, these are primarily development-time checks. They do **not** replace Firestore Security Rules for enforcing data integrity on the backend. TypeScript relies more heavily on the generated types and developer discipline.

## Handling Complex Nested Objects and Arrays

Firestore supports nested data structures within documents, including maps (objects) and arrays. FireSchema allows you to define these structures accurately using standard JSON Schema.

### Nested Objects (Maps)

Use `type: "object"` and the `properties` keyword to define structured maps. You can nest these arbitrarily deep.

```json
"product": {
  "type": "object",
  "properties": {
    "name": { "type": "string", "required": true },
    "details": {
      "type": "object",
      "properties": {
        "dimensions": {
          "type": "object",
          "properties": {
            "width": { "type": "number" },
            "height": { "type": "number" },
            "depth": { "type": "number" }
          }
        },
        "material": { "type": "string" }
      }
    }
  }
}
```

-   **Generation:** FireSchema generates corresponding nested interfaces (TypeScript) or classes (Dart) for these structured objects, providing type safety for accessing nested properties (e.g., `product.details.dimensions.width`).

### Arrays of Objects

Use `type: "array"` with an `items` definition that has `type: "object"` and `properties`.

```json
"variants": {
  "type": "array",
  "description": "Product variants (e.g., size, color)",
  "items": {
    "type": "object",
    "properties": {
      "sku": { "type": "string", "required": true },
      "color": { "type": "string" },
      "size": { "type": "string" },
      "stock": { "type": "integer", "minimum": 0 }
    },
    "required": ["sku"]
  }
}
```

-   **Generation:** Creates a type for the array elements (e.g., `Variant[]` in TS, `List<Variant>` in Dart), where `Variant` is the generated interface/class for the object structure defined in `items`.

### Arrays of Primitives

Simple arrays of strings, numbers, etc., are defined as expected:

```json
"keywords": {
  "type": "array",
  "items": { "type": "string" }
}
```

### Free-form Objects (Maps)

If you need a map with arbitrary string keys but known value types, omit the `properties` keyword for `type: "object"` and optionally use `additionalProperties`. Firestore often uses maps like this.

```json
"userPreferences": {
  "type": "object",
  "description": "User-specific UI preferences (key-value)",
  // No 'properties' means any string key is allowed.
  // Values default to 'any'/'dynamic' unless additionalProperties is used.
  "additionalProperties": {
     "type": "string" // All values in this map must be strings
  }
}

"featureFlags": {
    "type": "object",
    "description": "Feature flags map",
    // If additionalProperties is true or omitted, values are any/dynamic.
    // If additionalProperties is false, no extra properties are allowed beyond 'properties' (if any).
}
```

-   **Generation:**
    -   TypeScript: Generates `Record<string, ValueType>` (if `additionalProperties` specifies a type) or `Record<string, any>` (if `additionalProperties` is `true` or omitted).
    -   Dart: Generates `Map<String, ValueType>` or `Map<String, dynamic>`.

Combining these allows for rich, type-safe definitions of complex document structures. Remember to leverage `$ref` for common nested structures to keep your schema maintainable.

## Best Practices for Organizing Large Schemas

As your Firestore database grows, your `firestore.schema.json` file can become large and difficult to manage. While JSON Schema doesn't natively support splitting definitions across multiple files in a way that FireSchema currently resolves automatically, you can use these strategies:

1.  **Heavy Use of `definitions` and `$ref`:**
    -   Define *all* reusable object structures, common field patterns (like audit trails), and even complex array item types within the top-level `definitions` block.
    -   Keep the `collections` definitions primarily focused on the top-level fields and references (`$ref`) to these shared definitions. This makes the collection structure easier to scan.

2.  **Clear Naming Conventions:**
    -   Use descriptive names for your definitions (e.g., `addressShipping`, `productVariant`, `userAuditLog`).
    -   Prefix definition keys if it helps group them (e.g., `common_address`, `user_profileDetails`).

3.  **JSON Comments (If Supported):**
    -   While not standard JSON, some editors and tools tolerate comments (`//` or `/* */`). Use them judiciously within your schema file to explain complex sections or decisions. Be aware these might be stripped by some JSON parsers. FireSchema's internal parser should handle standard JSON.

4.  **External Scripting/Preprocessing (Advanced):**
    -   For very large projects, you could maintain schema parts in separate JSON or YAML files and use a build script (e.g., Node.js) to assemble them into a single `firestore.schema.json` file *before* running `fireschema generate`. This script would handle merging `definitions` and `collections` from different sources. This adds complexity to your build process but offers maximum modularity.

5.  **Keep Descriptions Updated:**
    -   Use the `description` field liberally for collections, fields, and definitions. This serves as inline documentation that also appears in the generated code's TSDoc/DartDoc.

Prioritize using `definitions` and `$ref` extensively within the single schema file, as this is the most straightforward approach supported directly by FireSchema and standard JSON Schema tooling.

## Limitations and Workarounds

While FireSchema leverages JSON Schema effectively, there are some inherent limitations or areas where workarounds might be needed:

-   **External `$ref` Resolution:** FireSchema currently only supports internal `$ref`s (within the same `firestore.schema.json` file, like `#/definitions/myDef`). It does not automatically resolve `$ref`s pointing to external files (e.g., `"$ref": "./common-types.json#/address"`).
    -   **Workaround:** Use the "External Scripting/Preprocessing" approach mentioned in the best practices section to assemble a single schema file before generation.
-   **Complex Conditional Logic (`oneOf`, `anyOf`, `allOf`, `if/then/else`):** Standard JSON Schema offers keywords for conditional structures. FireSchema's support for generating precise types for these is limited.
    -   `oneOf`/`anyOf`: Might generate a union type (`TypeA | TypeB`) in TypeScript, but complex validation or distinct properties might not be fully captured in the type system or Dart assertions.
    -   `allOf`: Primarily useful for merging properties from multiple definitions (often used with `$ref`). FireSchema generally handles this for merging object properties.
    -   `if`/`then`/`else`: Not typically used or well-supported for type generation.
    -   **Workaround:** Simplify your schema where possible. For complex conditional data, you might need runtime checks in your application code or rely more heavily on Firestore Security Rules. Define the most common structure and handle variations manually.
-   **Runtime Enforcement of All Validations:** As noted, while Dart gets some `assert` statements, not all JSON Schema validation keywords (especially complex `pattern`s or `uniqueItems` in all scenarios) are fully enforced at runtime by the generated code itself. TypeScript relies primarily on compile-time type checking.
    -   **Workaround:** Always implement robust Firestore Security Rules to enforce critical data integrity constraints on the backend. Add application-level validation where necessary.
-   **Recursive `$ref`s:** Defining schemas that reference themselves (e.g., a `category` object with a `parentCategory` field referencing `#/definitions/category`) can be problematic for type generation in some languages and might lead to infinite loops or overly complex types.
    -   **Workaround:** Consider flattening the structure or using simple ID references (`parentCategoryId: { type: "string" }`) instead of direct recursive object definitions if you encounter issues.
-   **`referenceTo` Typing in Dart:** Currently, the generated Dart `DocumentReference` type is `DocumentReference<Map<String, dynamic>>` even when `referenceTo` is specified. It doesn't yet generate `DocumentReference<ReferencedTypeData>`.
    -   **Workaround:** You'll need to cast or fetch and convert the referenced document manually in Dart to get strong typing for the referenced data. TypeScript generation *does* provide `DocumentReference<ReferencedTypeData>`.