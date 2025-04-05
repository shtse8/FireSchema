import fs from 'fs';
import Ajv, { ErrorObject } from 'ajv';
import schemaDefinition from './schema-definition.json'; // Import the definition schema
import {
  ParsedFirestoreSchema,
  ParsedCollectionDefinition,
  ParsedFieldDefinition,
  FieldType
} from './types/schema';

/**
 * Loads, validates, and parses the user-provided Firestore schema JSON file.
 *
 * @param schemaPath Absolute path to the user's schema file.
 * @returns The parsed and validated schema structure.
 * @throws Error if the file is not found, invalid JSON, or fails schema validation.
 */
export function loadAndValidateSchema(schemaPath: string): ParsedFirestoreSchema {
  if (!fs.existsSync(schemaPath)) {
    throw new Error(`Schema file not found at: ${schemaPath}`);
  }

  let schemaContent: string;
  try {
    schemaContent = fs.readFileSync(schemaPath, 'utf-8');
  } catch (error: any) {
    throw new Error(`Failed to read schema file: ${error.message}`);
  }

  let userSchema: any;
  try {
    userSchema = JSON.parse(schemaContent);
  } catch (error: any) {
    throw new Error(`Failed to parse schema file as JSON: ${error.message}`);
  }

  // Validate the user's schema against our definition
  const ajv = new Ajv({ allErrors: true }); // Configure Ajv
  const validate = ajv.compile(schemaDefinition);
  const isValid = validate(userSchema);

  if (!isValid) {
    const errorMessages = (validate.errors as ErrorObject[])
      .map(err => {
        // Attempt to make the path more readable
        const readablePath = err.instancePath.replace(/\//g, ' -> ').replace(/^ -> /, '');
        return `  - Location: ${readablePath || 'Root'}\n    Error: ${err.message}\n    Rule: ${err.schemaPath}`;
      })
      .join('\n\n'); // Add extra newline for better separation
    throw new Error(`Schema validation failed:\n${errorMessages}`);
  }

  console.log(`Schema validation successful for: ${schemaPath}`);

  // Transform the validated schema into our internal ParsedFirestoreSchema structure
  const parsedSchema = transformSchema(userSchema);

  // Perform Firestore-specific validation AFTER parsing
  validateFirestoreSpecificRules(parsedSchema); // MOVED CALL HERE

  return parsedSchema;
}

/**
 * Transforms the raw, validated schema object into the internal ParsedFirestoreSchema structure.
 * Adds helpful properties like collectionId and fieldName.
 */
function transformSchema(rawSchema: any): ParsedFirestoreSchema {
  const collections: Record<string, ParsedCollectionDefinition> = {};
  for (const collectionId in rawSchema.collections) {
    collections[collectionId] = transformCollection(collectionId, rawSchema.collections[collectionId]);
  }

  return {
    schemaVersion: rawSchema.schemaVersion,
    collections: collections,
  };
}

/** Transforms a single collection definition. */
function transformCollection(collectionId: string, rawCollection: any): ParsedCollectionDefinition {
  const fields: Record<string, ParsedFieldDefinition> = {};
  for (const fieldName in rawCollection.fields) {
    fields[fieldName] = transformField(fieldName, rawCollection.fields[fieldName]);
  }

  const subcollections: Record<string, ParsedCollectionDefinition> | undefined = rawCollection.subcollections
    ? Object.entries(rawCollection.subcollections).reduce((acc, [subId, subDef]) => {
        acc[subId] = transformCollection(subId, subDef);
        return acc;
      }, {} as Record<string, ParsedCollectionDefinition>)
    : undefined;

  return {
    collectionId: collectionId,
    description: rawCollection.description,
    fields: fields,
    subcollections: subcollections,
  };
}

/** Transforms a single field definition. */
function transformField(fieldName: string, rawField: any): ParsedFieldDefinition {
  // Recursively transform items for arrays and properties for maps
  const items = rawField.items ? transformField('item', rawField.items) : undefined; // 'item' name is arbitrary here
  const properties = rawField.properties
    ? Object.entries(rawField.properties).reduce((acc, [propName, propDef]) => {
        acc[propName] = transformField(propName, propDef);
        return acc;
      }, {} as Record<string, ParsedFieldDefinition>)
    : undefined;

  return {
    fieldName: fieldName,
    description: rawField.description,
    type: rawField.type as FieldType,
    required: rawField.required ?? false, // Default to false if not specified
    defaultValue: rawField.defaultValue, // Keep as is for now
    referenceTo: rawField.referenceTo,
    items: items,
    properties: properties,
    // Add validation properties
    minLength: rawField.minLength,
    maxLength: rawField.maxLength,
    pattern: rawField.pattern,
    minimum: rawField.minimum,
    maximum: rawField.maximum,
  };
} // END OF transformField

// MOVED FUNCTION DEFINITION HERE
/**
 * Performs additional validation checks specific to Firestore rules
 * after the basic JSON schema validation.
 *
 * @param schema The parsed schema object.
 * @throws Error if Firestore-specific rules are violated.
 */
function validateFirestoreSpecificRules(schema: ParsedFirestoreSchema): void {
  const errors: string[] = [];

  // Helper to get all defined collection paths from the schema
  const definedCollectionPaths = new Set<string>();
  function collectPaths(currentPath: string, collection: ParsedCollectionDefinition) {
    const path = currentPath ? `${currentPath}/${collection.collectionId}` : collection.collectionId;
    definedCollectionPaths.add(path);
    if (collection.subcollections) {
      for (const subId in collection.subcollections) {
        collectPaths(`${path}/<docId>`, collection.subcollections[subId]);
      }
    }
  }
  for (const rootId in schema.collections) {
    collectPaths('', schema.collections[rootId]);
  }


  function checkCollection(collectionPath: string, collection: ParsedCollectionDefinition) {
    // Check fields in the current collection
    for (const fieldName in collection.fields) {
      const field = collection.fields[fieldName];
      const currentPath = `${collectionPath}/${collection.collectionId}/<docId>/${fieldName}`;

      // Rule: Field names cannot contain '/' or '.'
      if (fieldName.includes('/') || fieldName.includes('.')) {
        errors.push(`Invalid field name at ${currentPath}: Field names cannot contain '/' or '.'. Found: '${fieldName}'`);
      }

      // Rule: Check referenceTo validity (Revised)
      if (field.type === 'reference') {
        if (!field.referenceTo) {
           // This case should be caught by Ajv based on schema-definition.json required rule
           // errors.push(`Missing referenceTo at ${currentPath}: Field of type 'reference' requires 'referenceTo'.`);
        } else {
           const normalizedRefPath = field.referenceTo.replace(/\{[^}]+\}/g, '<docId>');
           if (!definedCollectionPaths.has(normalizedRefPath)) {
              // Ensure the error message includes the list of valid paths for easier debugging
              errors.push(`Invalid referenceTo at ${currentPath}: Path '${field.referenceTo}' (normalized: '${normalizedRefPath}') does not correspond to a defined collection path in the schema. Defined paths: [${Array.from(definedCollectionPaths).join(', ')}]`);
           }
        }
      }

      // Rule: Check defaultValue type using the enhanced recursive helper (Final)
      if (field.defaultValue !== undefined) {
        if (!isDefaultValueValid(field, field.defaultValue)) {
            errors.push(`Invalid defaultValue at ${currentPath}: Default value ${JSON.stringify(field.defaultValue)} is not valid for field type '${field.type}'.`);
        }
      }

      // Recursively check fields within maps
      if (field.type === 'map' && field.properties) {
        checkMapProperties(currentPath, field.properties);
      }
      // Recursively check fields within arrays (if items are maps)
      else if (field.type === 'array' && field.items?.type === 'map' && field.items.properties) {
         checkMapProperties(`${currentPath}[]`, field.items.properties); // Indicate array context
      }
    }

    // Recursively check subcollections
    if (collection.subcollections) {
      for (const subId in collection.subcollections) {
        checkCollection(`${collectionPath}/${collection.collectionId}/<docId>`, collection.subcollections[subId]);
      }
    }
  }

  function checkMapProperties(mapPath: string, properties: Record<string, ParsedFieldDefinition>) {
    for (const propName in properties) {
      const propField = properties[propName];
      const currentPath = `${mapPath}.${propName}`;

      // Rule: Field names (map keys) cannot contain '/' or '.'
      if (propName.includes('/') || propName.includes('.')) {
        errors.push(`Invalid map key at ${currentPath}: Map keys cannot contain '/' or '.'. Found: '${propName}'`);
      }

      // Rule: Check defaultValue type for map properties using the enhanced recursive helper (Final)
      if (propField.defaultValue !== undefined) {
         if (!isDefaultValueValid(propField, propField.defaultValue)) {
            errors.push(`Invalid defaultValue at ${currentPath}: Default value ${JSON.stringify(propField.defaultValue)} is not valid for field type '${propField.type}'.`);
         }
      }

      // Recursively check nested maps
      if (propField.type === 'map' && propField.properties) {
        checkMapProperties(currentPath, propField.properties);
      }
       // Recursively check fields within arrays (if items are maps)
      else if (propField.type === 'array' && propField.items?.type === 'map' && propField.items.properties) {
         checkMapProperties(`${currentPath}[]`, propField.items.properties); // Indicate array context
      }
    }
  }

  // Start validation from root collections
  for (const collectionId in schema.collections) {
    checkCollection('', schema.collections[collectionId]);
  }

  // Throw error if any custom validation failed (Final)
  if (errors.length > 0) {
    throw new Error(`Firestore specific schema validation failed:\n${errors.map(e => `  - ${e}`).join('\n')}`);
  } else {
    // Only log success if no errors were found by Ajv OR custom validation
    console.log('Firestore specific validation rules passed.');
  }
}

/**
 * Recursively checks if a default value is valid for a given field definition.
 */
function isDefaultValueValid(field: ParsedFieldDefinition, defaultValue: any): boolean {
  if (defaultValue === undefined) return true; // No default value to check

  const expectedType = field.type;

  switch (expectedType) {
    case 'string':
      return typeof defaultValue === 'string';
    case 'number':
      return typeof defaultValue === 'number';
    case 'boolean':
      return typeof defaultValue === 'boolean';
    case 'timestamp':
      return defaultValue === 'serverTimestamp' || defaultValue instanceof Date || (typeof defaultValue === 'string' && !isNaN(Date.parse(defaultValue))); // Allow valid date strings too? Maybe too lenient. Stick to Date object or serverTimestamp for now.
      // Let's stick to Date object or serverTimestamp for stricter validation:
      // return defaultValue === 'serverTimestamp' || defaultValue instanceof Date;
    case 'geopoint':
      return typeof defaultValue === 'object' && defaultValue !== null &&
             typeof defaultValue.latitude === 'number' && typeof defaultValue.longitude === 'number';
    case 'reference':
      // Basic check: is it a string? Could add path format check later.
      return typeof defaultValue === 'string';
    case 'array':
      if (!Array.isArray(defaultValue)) return false;
      if (!field.items) return false; // Invalid schema, should be caught earlier
      // Check each item in the array against the 'items' definition
      return defaultValue.every(item => isDefaultValueValid(field.items!, item));
    case 'map':
      if (typeof defaultValue !== 'object' || defaultValue === null || Array.isArray(defaultValue)) return false;
      if (!field.properties) return false; // Invalid schema
      // Check each property in the default value object
      for (const key in defaultValue) {
        if (!field.properties[key]) {
          // Allow extra properties in default value? For now, let's be strict.
          // return false; // Uncomment for strict property matching
        } else if (!isDefaultValueValid(field.properties[key], defaultValue[key])) {
          return false; // Invalid type for a defined property
        }
      }
      // Check if all required properties of the map have a default value if the map itself has a default
      // This might be too complex/strict for defaultValue validation. Let's skip for now.
      return true;
    default:
      return false; // Unknown type
  }
}

// Remove or comment out the old basic helper if no longer needed
/*
function getFirestoreValueType(value: any): string {
  // ... old implementation ...
}
*/