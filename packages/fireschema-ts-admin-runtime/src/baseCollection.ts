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
      this.ref = parentRef.collection(collectionId) as CollectionReference<TData>;
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

  /** Sets the data for a document. */
  async set(id: string, data: TAddData, options?: SetOptions): Promise<FirebaseFirestore.WriteResult> {
    const docRef = this.doc(id);
    // Use documentRef's set method
    return docRef.set(data as unknown as TData, options || {});
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
  protected subCollection<
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