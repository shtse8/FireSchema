/**
 * Base functionality for generated CollectionReference classes.
 * Designed to work with both firebase (client) and firebase-admin (server) SDKs.
 */
import type {
  Firestore as ClientFirestore,
  CollectionReference as ClientCollectionReference,
  DocumentReference as ClientDocumentReference,
  DocumentData as ClientDocumentData,
  SetOptions as ClientSetOptions,
  Timestamp as ClientTimestamp,
  FieldValue as ClientFieldValueType,
  DocumentSnapshot as ClientDocumentSnapshot,
  GeoPoint as ClientGeoPoint,
  Query as ClientQuery,
  QuerySnapshot as ClientQuerySnapshot,
  WhereFilterOp as ClientWhereFilterOp, // Import client op type
  OrderByDirection as ClientOrderByDirection, // Import client direction type
} from 'firebase/firestore';
// Import client functions needed
import {
  serverTimestamp as clientServerTimestamp,
  collection as clientCollection,
  doc as clientDoc,
  addDoc as clientAddDoc,
  setDoc as clientSetDoc,
  deleteDoc as clientDeleteDoc,
  getDoc as clientGetDoc,
} from 'firebase/firestore';

import type {
  Firestore as AdminFirestore,
  CollectionReference as AdminCollectionReference,
  DocumentReference as AdminDocumentReference,
  DocumentData as AdminDocumentData,
  Timestamp as AdminTimestamp,
  DocumentSnapshot as AdminDocumentSnapshot,
  GeoPoint as AdminGeoPoint,
  Query as AdminQuery,
  QuerySnapshot as AdminQuerySnapshot,
  WhereFilterOp as AdminWhereFilterOp, // Import admin op type
  OrderByDirection as AdminOrderByDirection, // Import admin direction type
} from 'firebase-admin/firestore';
// Import admin values/classes needed
import { FieldValue as AdminFieldValue, FieldPath as AdminFieldPath } from 'firebase-admin/firestore';

// --- Generic Type Aliases/Interfaces ---

export type FirestoreLike = ClientFirestore | AdminFirestore;
export type CollectionReferenceLike<T extends DocumentDataLike> = ClientCollectionReference<T> | AdminCollectionReference<T>;
export type DocumentReferenceLike<T extends DocumentDataLike> = ClientDocumentReference<T> | AdminDocumentReference<T>;
export type DocumentSnapshotLike<T extends DocumentDataLike> = ClientDocumentSnapshot<T> | AdminDocumentSnapshot<T>;
export type AdminSetOptionsLike = { merge?: boolean; mergeFields?: (string | AdminFieldPath)[] };
export type SetOptionsLike = ClientSetOptions | AdminSetOptionsLike;
export type TimestampLike = ClientTimestamp | AdminTimestamp;
export type FieldValueLike = ClientFieldValueType | AdminFieldValue;
export type DocumentDataLike = ClientDocumentData | AdminDocumentData;
export type GeoPointLike = ClientGeoPoint | AdminGeoPoint;
export type QueryLike<T extends DocumentDataLike> = ClientQuery<T> | AdminQuery<T>;
export type QuerySnapshotLike<T extends DocumentDataLike> = ClientQuerySnapshot<T> | AdminQuerySnapshot<T>;
// Define and export Query Op/Direction types here
export type WhereFilterOpLike = ClientWhereFilterOp | AdminWhereFilterOp;
export type OrderByDirectionLike = ClientOrderByDirection | AdminOrderByDirection;


// --- Type Guards ---
export function isAdminFirestore(db: FirestoreLike): db is AdminFirestore {
  return typeof (db as any).settings === 'function' && typeof (db as any).listCollections === 'function';
}
export function isClientFirestore(db: FirestoreLike): db is ClientFirestore {
    return !isAdminFirestore(db);
}
export function isAdminDocumentReference<T extends DocumentDataLike>(ref: DocumentReferenceLike<T>): ref is AdminDocumentReference<T> {
    return typeof (ref as any).listCollections === 'function';
}
export function isClientDocumentReference<T extends DocumentDataLike>(ref: DocumentReferenceLike<T>): ref is ClientDocumentReference<T> {
    return typeof (ref as any).converter === 'object';
}
export function isAdminCollectionReference<T extends DocumentDataLike>(ref: CollectionReferenceLike<T>): ref is AdminCollectionReference<T> {
    return typeof (ref as any).listDocuments === 'function';
}
export function isClientCollectionReference<T extends DocumentDataLike>(ref: CollectionReferenceLike<T>): ref is ClientCollectionReference<T> {
     return typeof (ref as any).converter === 'object';
}


// Placeholder for schema definitions
export interface FieldSchema {
  defaultValue?: any;
}
export interface CollectionSchema {
  fields: Record<string, FieldSchema>;
}

/**
 * Abstract base class for FireSchema-generated collection references.
 */
export abstract class BaseCollectionRef<
  TData extends DocumentDataLike,
  TAddData extends DocumentDataLike,
> {
  public ref: CollectionReferenceLike<TData>;
  protected firestore: FirestoreLike;
  protected collectionId: string;
  protected schema?: CollectionSchema;
  protected isClient: boolean;

  constructor(
    firestore: FirestoreLike,
    collectionId: string,
    schema?: CollectionSchema,
    parentRef?: DocumentReferenceLike<DocumentDataLike>
  ) {
    this.firestore = firestore;
    this.collectionId = collectionId;
    this.schema = schema;
    this.isClient = isClientFirestore(this.firestore);

    if (parentRef) {
        if (this.isClient) {
            this.ref = clientCollection(parentRef as ClientDocumentReference<ClientDocumentData>, collectionId) as ClientCollectionReference<TData>;
        } else {
            this.ref = (parentRef as AdminDocumentReference<AdminDocumentData>).collection(collectionId) as AdminCollectionReference<TData>;
        }
    } else {
        if (this.isClient) {
            this.ref = clientCollection(this.firestore as ClientFirestore, collectionId) as ClientCollectionReference<TData>;
        } else {
            this.ref = (this.firestore as AdminFirestore).collection(collectionId) as AdminCollectionReference<TData>;
        }
    }
  }

  /** Returns the DocumentReference for a given ID. */
  doc(id: string): DocumentReferenceLike<TData> {
    if (this.isClient) {
        return clientDoc(this.ref as ClientCollectionReference<TData>, id);
    } else {
        return (this.ref as AdminCollectionReference<TData>).doc(id);
    }
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
          (dataWithDefaults as any)[fieldName] = this.isClient
            ? clientServerTimestamp()
            : AdminFieldValue.serverTimestamp();
        }
      }
    }
    return dataWithDefaults as unknown as TData;
  }

  /** Adds a new document. */
  async add(data: TAddData): Promise<DocumentReferenceLike<TData>> {
    const dataToWrite = this.applyDefaults(data);
    if (this.isClient) {
        return clientAddDoc(this.ref as ClientCollectionReference<TData>, dataToWrite);
    } else {
        return (this.ref as AdminCollectionReference<TData>).add(dataToWrite);
    }
  }

  /** Sets the data for a document. */
  async set(id: string, data: TAddData, options?: SetOptionsLike): Promise<void> {
    const docRef = this.doc(id);
    if (this.isClient) {
        await clientSetDoc(docRef as ClientDocumentReference<TData>, data as unknown as TData, options as ClientSetOptions || {});
    } else {
        await (docRef as AdminDocumentReference<TData>).set(data as unknown as TData, options as AdminSetOptionsLike || {});
    }
  }

  /** Deletes a document. */
  async delete(id: string): Promise<void> {
    const docRef = this.doc(id);
    if (this.isClient) {
        await clientDeleteDoc(docRef as ClientDocumentReference<TData>);
    } else {
        await (docRef as AdminDocumentReference<TData>).delete();
    }
  }

  /** Reads a single document. */
  async get(id: string): Promise<TData | undefined> {
    const docRef = this.doc(id);
    let snapshot: DocumentSnapshotLike<TData>;
    let exists: boolean;

    if (this.isClient) {
        const clientSnap = await clientGetDoc(docRef as ClientDocumentReference<TData>);
        snapshot = clientSnap;
        exists = clientSnap.exists();
    } else {
        const adminSnap = await (docRef as AdminDocumentReference<TData>).get();
        snapshot = adminSnap;
        exists = adminSnap.exists;
    }

    return exists ? snapshot.data() : undefined;
  }

  /** Helper to access a subcollection. */
  protected subCollection<
    SubTData extends DocumentDataLike,
    SubTAddData extends DocumentDataLike,
    SubCollectionType extends BaseCollectionRef<SubTData, SubTAddData>
  >(
    parentId: string,
    subCollectionId: string,
    SubCollectionClass: new (
      firestore: FirestoreLike,
      collectionId: string,
      schema?: CollectionSchema,
      parentRef?: DocumentReferenceLike<DocumentDataLike>
    ) => SubCollectionType,
    subSchema?: CollectionSchema
  ): SubCollectionType {
    const parentDocRef = this.doc(parentId);
    return new SubCollectionClass(this.firestore, subCollectionId, subSchema, parentDocRef);
  }
}