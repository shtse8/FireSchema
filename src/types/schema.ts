/**
 * Represents the overall structure of the parsed Firestore schema definition.
 */
export interface ParsedFirestoreSchema {
  schemaVersion: string;
  collections: Record<string, ParsedCollectionDefinition>; // Key is collectionId
}

/**
 * Represents the definition of a single Firestore collection or subcollection.
 */
export interface ParsedCollectionDefinition {
  collectionId: string; // Added for easier reference after parsing
  description?: string;
  fields: Record<string, ParsedFieldDefinition>; // Key is fieldName
  subcollections?: Record<string, ParsedCollectionDefinition>; // Key is subcollectionId
}

/**
 * Represents the definition of a single field within a document.
 */
export interface ParsedFieldDefinition {
  fieldName: string; // Added for easier reference after parsing
  description?: string;
  type: FieldType;
  required?: boolean;
  defaultValue?: any; // Can be literal or special string like 'serverTimestamp'
  // Type-specific properties
  referenceTo?: string; // Path to the referenced collection (for 'reference' type)
  items?: ParsedFieldDefinition; // Definition for array items (for 'array' type)
  properties?: Record<string, ParsedFieldDefinition>; // Structure definition (for 'map' type)
}

/**
 * Enum defining the possible Firestore field types supported by the schema.
 */
export type FieldType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'timestamp'
  | 'geopoint'
  | 'reference'
  | 'array'
  | 'map';