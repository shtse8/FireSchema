/**
 * Admin-side base class for collection references, using Firebase Admin SDK.
 */
import type {
  Firestore,
  CollectionReference,
  DocumentReference,
  DocumentData,
  SetOptions, // Admin SDK has SetOptions type
  DocumentSnapshot,
  // FieldValue is imported as value below
} from 'firebase-admin/firestore';

// Import Admin FieldValue class
import { FieldValue as AdminFieldValue } from 'firebase-admin/firestore';

// Define local types for schema (can be simple for now)
export interface FieldSchema {
  defaultValue?: any;
}
export interface CollectionSchema {
  fields: Record<string, FieldSchema>;
}

export class AdminBaseCollectionRef<
  TData extends DocumentData, // Use SDK's DocumentData
  TAddData extends DocumentData,
> {
  public ref: CollectionReference<TData>;
  protected firestore: Firestore;
  protected collectionId: string;
  protected schema?: CollectionSchema;

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
      // Use parentRef's collection method
      // Removed console logs here
      this.ref = parentRef.collection(collectionId) as CollectionReference<TData>; // Use Admin SDK's built-in method
    } else {
      // Use firestore's collection method
      this.ref = this.firestore.collection(collectionId) as CollectionReference<TData>;
    }
  }

  /** Returns the DocumentReference for a given ID. */
  doc(id: string): DocumentReference<TData> {
    // Use collectionRef's doc method
    return this.ref.doc(id);
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
          // Use Admin FieldValue
          (dataWithDefaults as any)[fieldName] = AdminFieldValue.serverTimestamp();
        }
        // Add other default value logic if needed
      }
    }
    return dataWithDefaults as unknown as TData;
  }

  /** Adds a new document. */
  async add(data: TAddData): Promise<DocumentReference<TData>> {
    const dataToWrite = this.applyDefaults(data);
    // Use collectionRef's add method
    return this.ref.add(dataToWrite);
  }

  /** Sets the data for a document, overwriting existing data unless merge options are provided. */
  // Overload for setting the entire document (no merge options or explicit merge: false)
  async set(id: string, data: TAddData, options?: SetOptions & { merge?: false | undefined }): Promise<FirebaseFirestore.WriteResult>;
  // Overload for setting with merge options (accepts partial data, requires merge:true or mergeFields)
  async set(id: string, data: Partial<TAddData>, options: SetOptions & ({ merge: true } | { mergeFields: ReadonlyArray<string | FirebaseFirestore.FieldPath> })): Promise<FirebaseFirestore.WriteResult>;
  // Implementation signature
  async set(id: string, data: TAddData | Partial<TAddData>, options?: SetOptions): Promise<FirebaseFirestore.WriteResult> {
    const docRef = this.doc(id);

    // Determine if it's a merge operation
    const isMerge = options && ('merge' in options && options.merge === true || 'mergeFields' in options);

    // Apply defaults ONLY if it's NOT a merge operation (setting the whole document)
    // We cast data to TAddData here because the overload guarantees it's the full type when !isMerge.
    const dataToWrite = !isMerge ? this.applyDefaults(data as TAddData) : data;

    // Use documentRef's set method
    // Cast dataToWrite to Partial<TData> which is compatible with set's expectation for merge operations.
    // Note: Admin SDK's set method handles the Partial<T> typing internally more flexibly than client v9.
    return docRef.set(dataToWrite as Partial<TData>, options || {});
  }

  /** Deletes a document. */
  async delete(id: string): Promise<FirebaseFirestore.WriteResult> {
    const docRef = this.doc(id);
    // Use documentRef's delete method
    return docRef.delete();
  }

  /** Reads a single document. */
  async get(id: string): Promise<TData | undefined> {
    const docRef = this.doc(id);
    // Use documentRef's get method
    const snapshot: DocumentSnapshot<TData> = await docRef.get();
    return snapshot.exists ? snapshot.data() : undefined;
  }

  /**
   * Helper to access a subcollection factory.
   * Needs the specific SubCollectionClass constructor.
   */
  public subCollection<
    SubTData extends DocumentData,
    SubTAddData extends DocumentData,
    SubCollectionType extends AdminBaseCollectionRef<SubTData, SubTAddData> // Expect AdminBaseCollectionRef subclass
  >(
    parentId: string,
    subCollectionId: string,
    SubCollectionClass: new (
      firestore: Firestore,
      collectionId: string,
      schema?: CollectionSchema,
      parentRef?: DocumentReference<DocumentData>
    ) => SubCollectionType,
    subSchema?: CollectionSchema
  ): SubCollectionType {
    const parentDocRef = this.doc(parentId);
    return new SubCollectionClass(this.firestore, subCollectionId, subSchema, parentDocRef);
  }

  // --- Admin Specific Methods ---
  // Example: bulkWriter() - Actual implementation might differ
  // bulkWriter(): FirebaseFirestore.BulkWriter {
  //   return this.firestore.bulkWriter();
  // }
}