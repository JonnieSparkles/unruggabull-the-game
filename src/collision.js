// Collision module: bullet and player collision detection

/**
 * Check collisions between bullets and carpshits.
 * Calls onKill(index, carpshit) when a bullet hits a carpshit.
 */
export function checkBulletcarpshitCollisions(bullets, carpshits, onKill) {
  for (let i = bullets.length - 1; i >= 0; i--) {
    const bullet = bullets[i];
    for (let j = carpshits.length - 1; j >= 0; j--) {
      const carpshit = carpshits[j];
      if (!carpshit.alive) continue;
      // Get carpshit hitbox
      const { x: cx, y: cy, width: cw, height: ch } = getCarpshitHitbox(carpshit);
      // Simple AABB collision
      if (
        bullet.x > cx && bullet.x < cx + cw &&
        bullet.y > cy && bullet.y < cy + ch
      ) {
        onKill(bullets, i, carpshit);
        break;
      }
    }
  }
}

/**
 * Check collisions between bullets and lower carpshits.
 * Reuses the same logic for lower carpshits.
 */
export function checkBulletLowercarpshitCollisions(bullets, carpshits, onKill) {
  checkBulletcarpshitCollisions(bullets, carpshits, onKill);
}

/**
 * Check collisions between player and carpshits.
 * Calls onHit(carpshit) when the player collides with a carpshit.
 */
import { getHitbox } from './player.js';
import { getCarpshitHitbox } from './enemy.js';
export function checkPlayercarpshitCollisions(player, carpshits, onHit) {
  if (!player || typeof onHit !== 'function') return;
  for (let j = carpshits.length - 1; j >= 0; j--) {
    const carpshit = carpshits[j];
    if (!carpshit.alive) continue;
    // Get player and carpshit hitboxes
    const { x: hx, y: hy, width: hw, height: hh } = getHitbox(player);
    const { x: cx, y: cy, width: cw, height: ch } = getCarpshitHitbox(carpshit);
    // Simple AABB collision
    if (
      hx + hw > cx && hx < cx + cw &&
      hy + hh > cy && hy < cy + ch
    ) {
      onHit(carpshit);
    }
  }
} 