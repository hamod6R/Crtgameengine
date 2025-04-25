/**
 * Generate a random UUID string
 * @returns A random UUID string
 */
export function generateUUID(): string {
  // Create a v4 UUID (random)
  // This is a simplified implementation and not cryptographically secure
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}