/**
 * Entry point for the FireSchema TS Admin Runtime package.
 * Exports admin-specific implementations of base classes.
 */

export * from './baseCollection';
export * from './baseQueryBuilder';
export * from './baseUpdateBuilder';

// Re-export core types for convenience? Optional.
// export * from '@shtse8/fireschema-core-types';