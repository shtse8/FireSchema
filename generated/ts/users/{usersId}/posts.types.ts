/**
 * Generated by firestore-odm
 * Do not edit manually.
 */
import { Timestamp, GeoPoint, DocumentReference, DocumentData } from 'firebase/firestore';











/**
 * Represents the structure of a 'Posts' document.
 * Description: Posts created by the user
 */
export interface PostsData {
  /** title (string, required) */
  title: string;
  /** content (string) */
  content?: string;
  /** publishedAt (timestamp) */
  publishedAt?: Timestamp;
}

// Potential future additions:
// - A class wrapper for data with helper methods?
// - Separate types for creation vs reading?