/**
 * Base functionality for generated CollectionReference classes.
 */
import {
  Firestore,
  CollectionReference,
  DocumentReference,
  collection,
  doc,
  getDoc,
  addDoc,
  setDoc,
  deleteDoc,
  serverTimestamp, // Keep for potential default value handling
  DocumentData,
  SetOptions, // For set with merge option
  // Query related imports might be needed if base query methods are added
} from 'firebase/firestore';

// Placeholder for a type definition for schema fields, needed for default handling
// This might need refinement based on how schema info is passed.
export interface FieldSchema {
  defaultValue?: any;
  // Add other relevant properties from your schema definition if needed
}

export interface CollectionSchema {
  fields: Record<string, FieldSchema>;
  // Potentially add subcollection info if needed for base helpers
}

/**
 * Abstract base class for FireSchema-generated collection references.
 * Provides common CRUD operations and path handling.
 *
 * TData: The type of the document data for the collection.
 * TAddData: The type for data used when adding a new document (often with optional defaults).
 * TUpdateData: The type for data used when updating (usually Partial<TData> plus FieldValues).
 */
export abstract class BaseCollectionRef<
  TData extends DocumentData,
  TAddData extends DocumentData, // Use TAddData for add/set operations
  // TUpdateData is implicitly handled by Firestore's UpdateData type for updateDoc
> {
  public ref: CollectionReference<TData>;
  protected firestore: Firestore;
  protected collectionId: string;
  protected schema?: CollectionSchema; // Optional schema for advanced features like defaults

  /**
   * Creates a BaseCollectionRef instance.
   * @param firestore The Firestore instance.
   * @param collectionId The ID of the collection.
   * @param schema Optional schema definition for the collection.
   * @param parentRef Optional DocumentReference of the parent document (for subcollections).
   */
  constructor(
    firestore: Firestore,
    collectionId: string,
    schema?: CollectionSchema,
    parentRef?: DocumentReference<DocumentData>
  ) {
    this.firestore = firestore;
    this.collectionId = collectionId;
    this.schema = schema;
    if (parentRef) {
      this.ref = collection(parentRef, collectionId) as CollectionReference<TData>;
    } else {
      this.ref = collection(firestore, collectionId) as CollectionReference<TData>;
    }
  }

  /** Returns the DocumentReference for a given ID. */
  doc(id: string): DocumentReference<TData> {
    return doc(this.ref, id);
  }

  /**
   * Prepares data for writing by applying default values (e.g., serverTimestamp).
   * This base implementation handles serverTimestamp. Generated classes might override
   * or extend this for other default types.
   */
  protected applyDefaults(data: TAddData): TData {
    const dataWithDefaults = { ...data };
    if (this.schema) {
      for (const fieldName in this.schema.fields) {
        const fieldDef = this.schema.fields[fieldName];
        if (
          fieldDef.defaultValue === 'serverTimestamp' &&
          (dataWithDefaults as any)[fieldName] === undefined
        ) {
          (dataWithDefaults as any)[fieldName] = serverTimestamp();
        }
        // TODO: Handle other default value types if necessary
      }
    }
    // It's assumed TAddData is compatible with TData after defaults are applied.
    // A cast might be necessary depending on strictness, but Firestore handles
    // ServerTimestamp internally.
    return dataWithDefaults as unknown as TData;
  }

  /** Adds a new document with the given data, returning the new DocumentReference. */
  async add(data: TAddData): Promise<DocumentReference<TData>> {
    const dataToWrite = this.applyDefaults(data);
    // Firestore's addDoc expects the final data type (TData after defaults)
    return addDoc(this.ref, dataToWrite);
  }

  /**
   * Sets the data for a document, overwriting existing data by default.
   * @param id The document ID.
   * @param data The data to set.
   * @param options Options for set operation (e.g., { merge: true }).
   */
  async set(id: string, data: TAddData, options?: SetOptions): Promise<void> {
    // Note: set typically doesn't apply defaults in the same way as add.
    // If defaults are desired for set, the logic might need adjustment or
    // the TAddData type should already include them.
    // We cast TAddData to TData assuming compatibility for the set operation.
    // If TAddData has optional fields that TData requires, this could be an issue,
    // requiring a different type or more complex handling.
    await setDoc(this.doc(id), data as unknown as TData, options || {});
  }

  /** Deletes a document. */
  async delete(id: string): Promise<void> {
    await deleteDoc(this.doc(id));
  }

  /** Reads a single document. */
  async get(id: string): Promise<TData | undefined> {
    const snapshot = await getDoc(this.doc(id));
    return snapshot.exists() ? snapshot.data() : undefined;
  }

  // --- Abstract methods or placeholders for generated classes to implement ---

  /**
   * Creates a new QueryBuilder instance for this collection.
   * Must be implemented by the generated class.
   */
  // abstract query(): BaseQueryBuilder<TData>; // Example if BaseQueryBuilder exists

  /**
   * Creates a new UpdateBuilder instance for the document with the given ID.
   * Must be implemented by the generated class.
   */
  // abstract update(id: string): BaseUpdateBuilder<TData, TUpdateData>; // Example if BaseUpdateBuilder exists

  /**
   * Helper to access a subcollection. Generated classes will provide specific methods
   * like `posts(parentId): PostsCollection`.
   * @param parentId The ID of the document containing the subcollection.
   * @param subCollectionId The ID of the subcollection.
   * @param SubCollectionClass The constructor of the subcollection's generated class.
   */
  protected subCollection<
    SubTData extends DocumentData,
    SubTAddData extends DocumentData,
    // SubTUpdateData extends DocumentData,
    SubCollectionType extends BaseCollectionRef<SubTData, SubTAddData /*, SubTUpdateData*/>
  >(
    parentId: string,
    subCollectionId: string,
    SubCollectionClass: new (
      firestore: Firestore,
      collectionId: string,
      schema?: CollectionSchema, // Pass schema if needed by subcollection
      parentRef?: DocumentReference<DocumentData>
    ) => SubCollectionType,
    subSchema?: CollectionSchema // Optional schema for the subcollection
  ): SubCollectionType {
    const parentDocRef = this.doc(parentId);
    // We pass the specific subCollectionId and potentially its schema
    return new SubCollectionClass(this.firestore, subCollectionId, subSchema, parentDocRef);
  }
}