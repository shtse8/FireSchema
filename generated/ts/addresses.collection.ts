/**
 * Generated by firestore-odm
 * Do not edit manually.
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
  updateDoc,
  deleteDoc,
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove,
  deleteField,
  DocumentData, // Added for parentRef typing
  // TODO: Add query imports: query, where, orderBy, limit, startAt, endAt etc.
} from 'firebase/firestore';
import { AddressesData } from './addresses.types';
import { AddressesQueryBuilder } from './addresses.query';
import { AddressesUpdateBuilder } from './addresses.update';



// Define types for data manipulation.
// AddData: Makes fields optional if they have a default value or are not required.
type AddressesAddData = {
  street: AddressesData['street'];
  city: AddressesData['city'];
  zip?: AddressesData['zip'];
};
// UpdateData: Make all fields optional for partial updates.
// Note: For UpdateData, the type should allow FieldValue types (increment, arrayUnion, etc.)
//       This is complex to type perfectly, so we use Partial<> for now, and users must
//       ensure they pass the correct FieldValue types where needed.
type AddressesUpdateData = Partial<AddressesAddData>;

/**
 * Typed reference to the 'addresses' collection.
 */
export class AddressesCollection {
  public ref: CollectionReference<AddressesData>; // Path: addresses

  private firestore: Firestore; // Store firestore instance
  private parentRef?: DocumentReference<DocumentData>; // Optional parent ref for subcollections

  /**
   * @param firestore The Firestore instance.
   * @param parentRef Optional DocumentReference of the parent document (for subcollections).
   */
  constructor(firestore: Firestore, parentRef?: DocumentReference<DocumentData>) {
    this.firestore = firestore; // Store firestore instance
    this.parentRef = parentRef;
    if (parentRef) {
      // Subcollection reference
      this.ref = collection(parentRef, 'addresses') as CollectionReference<AddressesData>;
    } else {
      // Root collection reference
      this.ref = collection(firestore, 'addresses') as CollectionReference<AddressesData>;
    }
  }

  /** Returns the DocumentReference for a given ID. */
  doc(id: string): DocumentReference<AddressesData> {
    return doc(this.ref, id);
  }

  /** Adds a new document with the given data, returning the new DocumentReference. */
  async add(data: AddressesAddData): Promise<DocumentReference<AddressesData>> {
    const dataWithDefaults = { ...data };
    // Automatically add server timestamps for fields configured in the schema
    // TODO: Handle other non-serverTimestamp default values if needed
    return addDoc(this.ref, dataWithDefaults as AddressesData); // Cast needed as defaults are added
  }

  /** Sets the data for a document, overwriting existing data. */
  async set(id: string, data: AddressesAddData): Promise<void> {
    // Note: set might need its own data type if it should behave differently than add
    // Also, set doesn't automatically apply defaults like add does.
    await setDoc(this.doc(id), data as AddressesData); // Cast needed as AddData is slightly different
  }

  /**
   * Creates a new UpdateBuilder instance for the document with the given ID.
   * @param id The ID of the document to update.
   * @returns A new UpdateBuilder instance.
   */
  update(id: string): AddressesUpdateBuilder {
    return new AddressesUpdateBuilder(this.doc(id));
  }

  /** Deletes a document. */
  async delete(id: string): Promise<void> {
    await deleteDoc(this.doc(id));
  }

  /** Reads a single document. */
  async get(id: string): Promise<AddressesData | undefined> {
    const snapshot = await getDoc(this.doc(id));
    return snapshot.exists() ? snapshot.data() : undefined;
  }

  /**
   * Creates a new QueryBuilder instance for this collection.
   * @returns A new QueryBuilder instance.
   */
  query(): AddressesQueryBuilder {
    return new AddressesQueryBuilder(this.firestore, this.ref);
  }

  // --- Subcollection Accessors ---


  // Example: findByEmail(email: string) { ... }
  // Example: listActiveUsers(limitCount: number) { ... }

  // --- Helper for data conversion? ---
  // Maybe add private methods for converting data before writes (e.g., handling default values)
}