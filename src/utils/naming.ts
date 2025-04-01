/**
 * Capitalizes the first letter of a string.
 * @param str The input string.
 * @returns The string with the first letter capitalized.
 */
export function capitalizeFirstLetter(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Converts a camelCase or snake_case string to PascalCase.
 * Handles basic cases, might need refinement for edge cases.
 * e.g., userProfile -> UserProfile, user_profile -> UserProfile
 * @param str The input string.
 * @returns The PascalCase string.
 */
export function camelToPascalCase(str: string): string {
  if (!str) return str;
  // Handle snake_case first by replacing underscores and capitalizing the next letter
  const camelCaseStr = str.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
  // Capitalize the first letter
  return capitalizeFirstLetter(camelCaseStr);
}

/**
 * Converts a string to camelCase.
 * e.g., UserProfile -> userProfile, user_profile -> userProfile
 * @param str The input string.
 * @returns The camelCase string.
 */
export function toCamelCase(str: string): string {
    if (!str) return str;
    // Handle snake_case
    let camel = str.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
    // Ensure first letter is lowercase
    return camel.charAt(0).toLowerCase() + camel.slice(1);
}


/**
 * Converts a string (camelCase, PascalCase) to snake_case.
 * e.g., userProfile -> user_profile, UserProfile -> user_profile
 * @param str The input string.
 * @returns The snake_case string.
 */
export function toSnakeCase(str: string): string {
  if (!str) return str;
  // Add underscore before capitals, handle potential leading underscore for PascalCase
  const snake = str.replace(/([A-Z])/g, (match) => `_${match.toLowerCase()}`);
  return snake.startsWith('_') ? snake.substring(1) : snake;
}

// Add other naming utility functions as needed, e.g., toSnakeCase, toKebabCase