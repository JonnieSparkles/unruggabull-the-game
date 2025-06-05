// Utility functions for scene transitions and cleanup

/**
 * Clear multiple game entity arrays by setting their lengths to zero.
 * @param  {...Array} arrays - Arrays to clear.
 */
export function clearEntities(...arrays) {
  arrays.forEach(arr => {
    if (Array.isArray(arr)) {
      arr.length = 0;
    }
  });
} 