// Physics / World definitions

import levels from './levels/index.js';
import { getCurrentLevelKey } from './state.js';

/**
 * Platform dimensions and fixed layout
 */
export const PLATFORM_WIDTH = 120;
export const PLATFORM_HEIGHT = 16;
export const platforms = [
  { x: 150, y: 450, width: PLATFORM_WIDTH, height: PLATFORM_HEIGHT },
  { x: 250, y: 400, width: PLATFORM_WIDTH, height: PLATFORM_HEIGHT },
  { x: 320, y: 350, width: PLATFORM_WIDTH, height: PLATFORM_HEIGHT },
  { x: 400, y: 275, width: PLATFORM_WIDTH, height: PLATFORM_HEIGHT }
];

/**
 * No-op for fixed platforms (skeletal for future dynamic levels)
 */
export function generatePlatforms() {
  // platforms are static in this game
}

// Add physics handlers
/**
 * Apply gravity, movement, collisions, and animation frame updates for the player.
 */
export function handlePhysics(player, platforms, canvas) {
  // gravity and movement
  player.vy += 0.8;
  player.x += player.vx;
  player.feetY += player.vy;
  player.y = player.feetY - player.height;
  // platform collision
  let onPlatform = false;
  if (player.vy >= 0) {
    for (const p of platforms) {
      if (
        player.feetY <= p.y + player.vy &&
        player.feetY + player.vy >= p.y &&
        player.x + player.width > p.x &&
        player.x < p.x + p.width
      ) {
        player.feetY = p.y;
        player.vy = 0;
        player.jumping = false;
        player.grounded = true;
        player.y = player.feetY - player.height;
        onPlatform = true;
        break;
      }
    }
  }
  // ground collision
  if (!onPlatform) {
    const levelConfig = levels[getCurrentLevelKey()];
    const floorY = levelConfig.floorY;
    if (player.feetY >= floorY) {
      player.feetY = floorY;
      player.vy = 0;
      player.jumping = false;
      player.grounded = true;
      player.y = player.feetY - player.height;
    } else {
      player.grounded = false;
    }
  }
  // horizontal wrap
  if (player.x + player.width < 0) {
    player.x = canvas.width;
  } else if (player.x > canvas.width) {
    player.x = -player.width;
  }
  // frame update
  if (player.vx !== 0) {
    player.frame = (player.frame + 1) % 40;
  } else {
    player.frame = 0;
  }
}

/**
 * Render platforms on the canvas.
 */
export function drawPlatforms(ctx, platforms) {
  ctx.fillStyle = '#964B00';
  platforms.forEach(p => {
    ctx.fillRect(p.x, p.y, p.width, p.height);
    ctx.strokeStyle = '#fff8';
    ctx.strokeRect(p.x, p.y, p.width, p.height);
  });
}
