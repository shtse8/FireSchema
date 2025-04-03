/**
 * Generated by firestore-odm
 * Do not edit manually.
 */
import type { Firestore as ClientFirestore, DocumentReference as ClientDocumentReference, DocumentData as ClientDocumentData } from 'firebase/firestore';

// Runtime Imports - Base class and generic types
import { BaseCollectionRef } from '@shtse8/fireschema-runtime';
// Ensure all needed generic types are imported
import type { FirestoreLike, DocumentReferenceLike, CollectionReferenceLike, CollectionSchema, FieldSchema, DocumentDataLike } from '@shtse8/fireschema-runtime';

// Local Imports
import { PostsData } from './posts.types.js';
import { PostsQueryBuilder } from './posts.query.js';
import { PostsUpdateBuilder } from './posts.update.js';



// Define types for data manipulation.
type PostsAddData = {
  title: PostsData['title'];
  content?: PostsData['content'];
  publishedAt?: PostsData['publishedAt'];
};

/**
 * Typed reference to the 'posts' collection, extending BaseCollectionRef.
 */
export class PostsCollection extends BaseCollectionRef<PostsData, PostsAddData> {

  /**
   * @param firestore The Firestore instance (client or admin).
   * @param parentRef Optional DocumentReference of the parent document (for subcollections).
   */
  // Simplified constructor: Accepts only firestore and optional parentRef
  constructor(
    firestore: FirestoreLike,
    parentRef?: DocumentReferenceLike<DocumentDataLike> // Use generic type
  ) {
    // Process fields to create schema for runtime base class
    const processedFields: Record<string, FieldSchema> = {};
    
      processedFields['title'] = {
        
      };
    
      processedFields['content'] = {
        
      };
    
      processedFields['publishedAt'] = {
        
      };
    
    const schemaForRuntime: CollectionSchema = { fields: processedFields };

    // Call the base class constructor, providing the hardcoded collectionId
    // Base class constructor: (firestore, collectionId, schema?, parentRef?)
    super(firestore, 'posts', schemaForRuntime, parentRef);
  }

  // Methods like doc(), add(), set(), get(), delete() are inherited from BaseCollectionRef

  /**
   * Creates a new UpdateBuilder instance for the document with the given ID.
   */
  update(id: string): PostsUpdateBuilder {
    return new PostsUpdateBuilder(this.doc(id));
  }

  /**
   * Creates a new QueryBuilder instance for this collection.
   */
  query(): PostsQueryBuilder {
    return new PostsQueryBuilder(this.firestore, this.ref);
  }

  // --- Subcollection Accessors ---


  // --- Custom Methods Placeholder ---
}