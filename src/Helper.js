/**
 * Small helper for checking if input is an Integer {number}.
 * @param {object} object to check
 * @see http://stackoverflow.com/a/14794066
 */
export function isInt(object) {
  return !isNaN(object) && !isNaN(parseInt(object)) && parseInt(Number(object)) == object
}
