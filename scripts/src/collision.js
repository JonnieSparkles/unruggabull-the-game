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
      // Simple AABB collision
      if (
        bullet.x > carpet.x && bullet.x < carpet.x + 48 &&
        bullet.y > carpet.y && bullet.y < carpet.y + 48
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
export function checkPlayerCarpetCollisions(player, carpets, onHit) {
  if (!player || typeof onHit !== 'function') return;
  for (let j = carpets.length - 1; j >= 0; j--) {
    const carpet = carpets[j];
    if (!carpet.alive) continue;
    if (
      player.x + player.width > carpet.x && player.x < carpet.x + 48 &&
      player.y + player.height > carpet.y && player.y < carpet.y + 48
    ) {
      onHit(carpet);
    }
  }
} 