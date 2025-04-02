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
      .map(err => `  - ${err.instancePath || '/'} ${err.message} (${err.schemaPath})`)
      .join('\n');
    throw new Error(`Schema validation failed:\n${errorMessages}`);
  }

  console.log(`Schema validation successful for: ${schemaPath}`);

  // Transform the validated schema into our internal ParsedFirestoreSchema structure
  const parsedSchema = transformSchema(userSchema);

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
}