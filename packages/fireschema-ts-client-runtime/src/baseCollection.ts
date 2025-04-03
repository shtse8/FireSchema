/**
 * Client-side base class for collection references, using Firebase JS Client SDK v9+.
 */
import type {
  Firestore,
  CollectionReference,
  DocumentReference,
  DocumentData,
  SetOptions,
  DocumentSnapshot,
  FieldValue, // Import FieldValue type
} from 'firebase/firestore';

// Import client functions
import {
  collection,
  doc,
  addDoc,
  setDoc,
  deleteDoc,
  getDoc,
  serverTimestamp, // Import serverTimestamp function
} from 'firebase/firestore';

// Define local types for schema (can be simple for now)
export interface FieldSchema {
  defaultValue?: any;
}
export interface CollectionSchema {
  fields: Record<string, FieldSchema>;
  // Add subCollections definition
  subCollections?: Record<string, {
    schema?: CollectionSchema; // Recursive type for sub-schema
    collectionClass: any; // Constructor type for the sub-collection class
  }>;
}

export class ClientBaseCollectionRef<
  TData extends DocumentData, // Use SDK's DocumentData
  TAddData extends DocumentData,
> {
  public ref: CollectionReference<TData>; // Use SDK's CollectionReference
  protected firestore: Firestore; // Use SDK's Firestore
  protected collectionId: string;
  protected schema?: CollectionSchema;

  constructor(
    firestore: Firestore, // Expect specific Firestore type
    collectionId: string,
    schema?: CollectionSchema,
    parentRef?: DocumentReference<DocumentData> // Expect specific DocumentReference type
  ) {
    this.firestore = firestore;
    this.collectionId = collectionId;
    this.schema = schema;

    if (parentRef) {
      // Use top-level collection function with parentRef
      this.ref = collection(parentRef, collectionId) as CollectionReference<TData>;
    } else {
      // Use top-level collection function with firestore
      this.ref = collection(this.firestore, collectionId) as CollectionReference<TData>;
    }
  }

  /** Returns the DocumentReference for a given ID. */
  doc(id: string): DocumentReference<TData> {
    // Use top-level doc function
    return doc(this.ref, id);
  }

  /** Prepares data for writing by applying default values. */
  protected applyDefaults(data: TAddData): TData {
    const dataWithDefaults = { ...data };
    if (this.schema) {
      for (const fieldName in this.schema.fields) {
        const fieldDef = this.schema.fields[fieldName];
        if (
          fieldDef.defaultValue === 'serverTimestamp' &&
          (dataWithDefaults as any)[fieldName] === undefined
        ) {
          // Use client serverTimestamp function
          (dataWithDefaults as any)[fieldName] = serverTimestamp() as FieldValue; // Cast to FieldValue
        }
        // Handle other literal default values
        else if (
          fieldDef.defaultValue !== undefined &&
          fieldDef.defaultValue !== 'serverTimestamp' && // Already handled
          (dataWithDefaults as any)[fieldName] === undefined
        ) {
          (dataWithDefaults as any)[fieldName] = fieldDef.defaultValue;
        }
      }
    }
    return dataWithDefaults as unknown as TData;
  }

  /** Adds a new document. */
  async add(data: TAddData): Promise<DocumentReference<TData>> {
    const dataToWrite = this.applyDefaults(data);
    // Use top-level addDoc function
    return addDoc(this.ref, dataToWrite);
  }

  /** Sets the data for a document, overwriting existing data unless merge options are provided. */
  // Overload for setting the entire document (no merge options or explicit merge: false)
  async set(id: string, data: TAddData, options?: SetOptions & { merge?: false | undefined }): Promise<void>;
  // Overload for setting with merge options (accepts partial data, requires merge:true or mergeFields)
  async set(id: string, data: Partial<TAddData>, options: SetOptions & ({ merge: true } | { mergeFields: ReadonlyArray<string> })): Promise<void>;
  // Implementation signature
  async set(id: string, data: TAddData | Partial<TAddData>, options?: SetOptions): Promise<void> {
    const docRef = this.doc(id);

    // Determine if it's a merge operation
    const isMerge = options && ('merge' in options && options.merge === true || 'mergeFields' in options);

    // Apply defaults ONLY if it's NOT a merge operation (setting the whole document)
    // We cast data to TAddData here because the overload guarantees it's the full type when !isMerge.
    const dataToWrite = !isMerge ? this.applyDefaults(data as TAddData) : data;

    // Use top-level setDoc function
    // Cast dataToWrite to Partial<TData> which is compatible with setDoc's expectation for merge operations.
    await setDoc(docRef, dataToWrite as Partial<TData>, options || {});
  }

  /** Deletes a document. */
  async delete(id: string): Promise<void> {
    const docRef = this.doc(id);
    // Use top-level deleteDoc function
    await deleteDoc(docRef);
  }

  /** Reads a single document. */
  async get(id: string): Promise<TData | undefined> {
    const docRef = this.doc(id);
    // Use top-level getDoc function
    const snapshot: DocumentSnapshot<TData> = await getDoc(docRef);
    return snapshot.exists() ? snapshot.data() : undefined;
  }

  /**
   * Helper to access a subcollection factory.
   * Needs the specific SubCollectionClass constructor.
   */
  public subCollection<
    SubTData extends DocumentData,
    SubTAddData extends DocumentData,
    SubCollectionType extends ClientBaseCollectionRef<SubTData, SubTAddData> // Expect ClientBaseCollectionRef subclass
  >(
    parentId: string,
    subCollectionId: string,
    SubCollectionClass: new (
      firestore: Firestore, // Expect specific Firestore type
      collectionId: string,
      schema?: CollectionSchema,
      parentRef?: DocumentReference<DocumentData> // Expect specific DocumentReference type
    ) => SubCollectionType,
    subSchema?: CollectionSchema
  ): SubCollectionType {
    // 1. Check schema existence
    if (!this.schema?.subCollections || !this.schema.subCollections[subCollectionId]) {
      throw new Error(`Sub-collection '${subCollectionId}' not found in schema for collection '${this.ref.id}'`);
    }
    const subCollectionDef = this.schema.subCollections[subCollectionId];

    // 2. Check for collectionClass (use the one from the schema)
    const ResolvedSubCollectionClass = subCollectionDef.collectionClass;
    if (!ResolvedSubCollectionClass) {
        throw new Error(`Collection class definition missing for sub-collection '${subCollectionId}' in schema for collection '${this.ref.id}'`);
    }

    // 3. Get parent document reference
    const parentDocRef = this.doc(parentId);

    // 4. Instantiate using the correct constructor signature
    //    The base constructor handles initializing the internal ref correctly.
    return new ResolvedSubCollectionClass(
        this.firestore,
        subCollectionId,
        subCollectionDef.schema, // Pass schema from definition
        parentDocRef // Pass parentRef
    );
  }
}