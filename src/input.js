// Input handling module
export const keys = {};

/**
 * Attach global keyboard listeners and maintain `keys` state.
 */
export function setupControls() {
  const controlledKeys = ['a','A','d','D','j','J','f','F','Enter',' ','c','C'];
  document.addEventListener('keydown', e => {
    if (controlledKeys.includes(e.key)) {
      e.preventDefault();
      keys[e.key] = true;
    }
  });
  document.addEventListener('keyup', e => {
    if (controlledKeys.includes(e.key)) {
      e.preventDefault();
      keys[e.key] = false;
    }
  });
} 