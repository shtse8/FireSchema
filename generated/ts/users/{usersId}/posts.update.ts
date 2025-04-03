/**
 * Generated by firestore-odm
 * Do not edit manually.
 */

// Runtime Imports - Base class and generic types
import { BaseUpdateBuilder } from '@shtse8/fireschema-runtime'; // Correct package name
import type { DocumentReferenceLike, FieldValueLike, TimestampLike, GeoPointLike } from '@shtse8/fireschema-runtime'; // Import generic types

// Local Imports
import { PostsData } from './posts.types.js';











/**
 * A typed builder for creating update operations for 'posts' documents, extending BaseUpdateBuilder.
 */
export class PostsUpdateBuilder extends BaseUpdateBuilder<PostsData> {

  // Constructor inherited from BaseUpdateBuilder (accepts DocumentReferenceLike)

  // --- Field Setters ---






  /** Sets the value for the 'title' field. */
  setTitle(value: string | FieldValueLike): this { // method.fieldType includes FieldValueLike
    return this._set('title', value);
  }











  /** Sets the value for the 'content' field. */
  setContent(value: string | FieldValueLike): this { // method.fieldType includes FieldValueLike
    return this._set('content', value);
  }






  /** Deletes the 'content' field. */
  deleteContent(): this {
    return this._deleteField('content');
  }






  /** Sets the value for the 'publishedAt' field. */
  setPublishedAt(value: TimestampLike | FieldValueLike): this { // method.fieldType includes FieldValueLike
    return this._set('publishedAt', value);
  }






  /** Deletes the 'publishedAt' field. */
  deletePublishedAt(): this {
    return this._deleteField('publishedAt');
  }



  // --- End Field Setters ---

  // commit() method is inherited from BaseUpdateBuilder

  // --- Custom Update Methods Placeholder ---
}