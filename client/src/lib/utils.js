/**
 * Tailwind CSS classname utility function
 * Merges multiple classnames together
 * 
 * @param  {...string} classnames - Class names to merge
 * @returns {string} - Merged class names
 */
export function cn(...classnames) {
  return classnames.filter(Boolean).join(" ");
}