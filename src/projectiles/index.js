import PlayerBullet from './playerBullets.js';
import RugfatherCarpet from './rugfatherCarpets.js';

export const projectiles = [];

export function updateProjectiles(canvasWidth) {
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i];
    p.update();
    if (p.x < 0 || p.x > canvasWidth) {
      projectiles.splice(i, 1);
    }
  }
}

export function drawProjectiles(ctx, debug) {
  projectiles.forEach(p => p.draw(ctx, debug));
}

export function spawnPlayerBullet(player) {
  projectiles.push(new PlayerBullet(player));
}

export function spawnRugfatherCarpet(x, y) {
  projectiles.push(new RugfatherCarpet(x, y));
} 