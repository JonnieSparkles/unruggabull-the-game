// Collision module: bullet and player collision detection

/**
 * Check collisions between bullets and carpets.
 * Calls onKill(index, carpet) when a bullet hits a carpet.
 */
export function checkBulletCarpetCollisions(bullets, carpets, onKill) {
  for (let i = bullets.length - 1; i >= 0; i--) {
    const bullet = bullets[i];
    for (let j = carpets.length - 1; j >= 0; j--) {
      const carpet = carpets[j];
      if (!carpet.alive) continue;
      // Get carpet hitbox
      const { x: cx, y: cy, width: cw, height: ch } = getCarpetHitbox(carpet);
      // Simple AABB collision
      if (
        bullet.x > cx && bullet.x < cx + cw &&
        bullet.y > cy && bullet.y < cy + ch
      ) {
        onKill(bullets, i, carpet);
        break;
      }
    }
  }
}

/**
 * Check collisions between bullets and lower carpets.
 * Reuses the same logic for lower carpets.
 */
export function checkBulletLowerCarpetCollisions(bullets, carpets, onKill) {
  checkBulletCarpetCollisions(bullets, carpets, onKill);
}

/**
 * Check collisions between player and carpets.
 * Calls onHit(carpet) when the player collides with a carpet.
 */
import { getHitbox } from './player.js';
import { getCarpetHitbox } from './enemy.js';
export function checkPlayerCarpetCollisions(player, carpets, onHit) {
  if (!player || typeof onHit !== 'function') return;
  for (let j = carpets.length - 1; j >= 0; j--) {
    const carpet = carpets[j];
    if (!carpet.alive) continue;
    // Get player and carpet hitboxes
    const { x: hx, y: hy, width: hw, height: hh } = getHitbox(player);
    const { x: cx, y: cy, width: cw, height: ch } = getCarpetHitbox(carpet);
    // Simple AABB collision
    if (
      hx + hw > cx && hx < cx + cw &&
      hy + hh > cy && hy < cy + ch
    ) {
      onHit(carpet);
    }
  }
} 