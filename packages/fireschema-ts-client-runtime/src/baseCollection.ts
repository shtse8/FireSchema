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
        // Add other default value logic if needed
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

  /** Sets the data for a document. */
  async set(id: string, data: TAddData, options?: SetOptions): Promise<void> {
    const docRef = this.doc(id);
    // Use top-level setDoc function
    const dataToWrite = this.applyDefaults(data); // Apply defaults for set as well
    await setDoc(docRef, dataToWrite, options || {});
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
    const parentDocRef = this.doc(parentId);
    return new SubCollectionClass(this.firestore, subCollectionId, subSchema, parentDocRef);
  }
}