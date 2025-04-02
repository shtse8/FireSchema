/**
 * Generated by firestore-odm
 * Do not edit manually.
 */
import {
  Firestore,
  CollectionReference, // Keep for type annotation if needed, but base handles creation
  DocumentReference,
  DocumentData, // Needed for parentRef typing and subCollection helper
  // serverTimestamp, // Handled by base class applyDefaults
  // increment, // Not used directly here
  // arrayUnion, // Not used directly here
  // arrayRemove, // Not used directly here
  // deleteField, // Not used directly here
  // Basic CRUD functions (collection, doc, getDoc, addDoc, setDoc, updateDoc, deleteDoc) are handled by base
} from 'firebase/firestore';
// Runtime Imports
import { BaseCollectionRef, CollectionSchema, FieldSchema } from '@fireschema/ts-runtime'; // Removed FirestoreFunctions import

// Local Imports
import { ItemsData } from './items.types.js';
import { ItemsQueryBuilder } from './items.query.js';
import { ItemsUpdateBuilder } from './items.update.js';




import { TagsCollection } from './items/{itemsId}/tags.collection.js';



// Define types for data manipulation.
// AddData: Makes fields optional if they have a default value or are not required.
// NOTE: This might need refinement if base class handles defaults differently.
type ItemsAddData = {
  name: ItemsData['name'];
  value?: ItemsData['value'];
  createdAt?: ItemsData['createdAt'];
};
// UpdateData: Type used by UpdateBuilder, defined there or implicitly via Firestore types.

/**
 * Typed reference to the 'items' collection, extending BaseCollectionRef.
 */
export class ItemsCollection extends BaseCollectionRef<ItemsData, ItemsAddData> {

  /**
   * @param firestore The Firestore instance.
   * @param parentRef Optional DocumentReference of the parent document (for subcollections).
   */
  // Constructor needs to accept all potential args for both root and subcollection instantiation
  constructor(
    firestore: Firestore,
    collectionId: string,
    // firestoreFunctions removed
    schema?: CollectionSchema,
    parentRef?: DocumentReference<DocumentData>
  ) {
    // Process fields from the input schema to create a valid CollectionSchema for the runtime
    const processedFields: Record<string, FieldSchema> = {};
    
      processedFields['name'] = {
        
        // Add other allowed FieldSchema properties here if needed
      };
    
      processedFields['value'] = {
        
        // Add other allowed FieldSchema properties here if needed
      };
    
      processedFields['createdAt'] = {
        
        defaultValue: "serverTimestamp",
        
        // Add other allowed FieldSchema properties here if needed
      };
    
    const schemaForRuntime: CollectionSchema = { fields: processedFields };

    // Call the base class constructor, passing the resolved collectionId and schema
    // Pass firestoreFunctions to the base class constructor
    // Removed firestoreFunctions from super() call
    super(firestore, collectionId, schema ?? schemaForRuntime, parentRef);
  }

  // Methods like doc(), add(), set(), get(), delete() are inherited from BaseCollectionRef

  /**
   * Creates a new UpdateBuilder instance for the document with the given ID.
   * @param id The ID of the document to update.
   * @returns A new ItemsUpdateBuilder instance.
   */
  update(id: string): ItemsUpdateBuilder {
    // Returns the specific generated UpdateBuilder
    return new ItemsUpdateBuilder(this.doc(id));
  }

  /**
   * Creates a new QueryBuilder instance for this collection.
   * @returns A new ItemsQueryBuilder instance.
   */
  query(): ItemsQueryBuilder {
    // Returns the specific generated QueryBuilder
    return new ItemsQueryBuilder(this.firestore, this.ref);
  }

  // --- Subcollection Accessors ---




  /**
   * Access the 'tags' subcollection for a specific document.
   * @param documentId The ID of the parent 'items' document.
   * @returns A typed reference to the 'tags' subcollection.
   */
  tags(documentId: string): TagsCollection {
    // Use the helper method from BaseCollectionRef
    // Process subcollection fields similarly to the main constructor
    const processedSubFields: Record<string, FieldSchema> = {};
    
      processedSubFields['label'] = {
        
      };
    
    const subSchema: CollectionSchema = { fields: processedSubFields };
    // Pass the instance's firestoreFunctions down to the subcollection helper
    // Pass only the required arguments to the subCollection helper
    // Removed firestoreFunctions from subCollection call
    return this.subCollection(documentId, 'tags', TagsCollection, subSchema);
  }



  // --- Custom Methods Placeholder ---
  // Example: findByEmail(email: string) { ... } - Add custom query methods here if needed
}