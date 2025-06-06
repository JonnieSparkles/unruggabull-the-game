// Physics / World definitions

import levels from './levels/index.js';
import { getCurrentLevelKey } from './state.js';
import { PLAYER_WIDTH, PLAYER_HEIGHT } from './constants/player.js';
import { GRAVITY } from './constants/physics.js';

/**
 * Platform dimensions and fixed layout
 */
export const PLATFORM_WIDTH = 120;
export const PLATFORM_HEIGHT = 16;
export let platforms = [];

/**
 * Populate the platforms array based on the current level configuration.
 */
export function generatePlatforms() {
  const levelConfig = levels[getCurrentLevelKey()];
  const levelPlatforms = levelConfig.platforms || [];
  platforms.length = 0;
  levelPlatforms.forEach(p => platforms.push(p));
}

// Add physics handlers
/**
 * Apply gravity, movement, collisions, and animation frame updates for the player.
 */
export function handlePhysics(player, platforms, canvas) {
  const levelConfig = levels[getCurrentLevelKey()];
  // gravity and movement
  player.vy += GRAVITY;
  player.x += player.vx;
  player.feetY += player.vy;
  player.y = player.feetY - PLAYER_HEIGHT;
  // platform collision
  let onPlatform = false;
  if (player.vy >= 0) {
    for (const p of platforms) {
      if (
        player.feetY <= p.y + player.vy &&
        player.feetY + player.vy >= p.y &&
        player.x + PLAYER_WIDTH > p.x &&
        player.x < p.x + p.width
      ) {
        player.feetY = p.y;
        player.vy = 0;
        player.jumping = false;
        player.grounded = true;
        player.y = player.feetY - PLAYER_HEIGHT;
        onPlatform = true;
        break;
      }
    }
  }
  // ground collision
  if (!onPlatform) {
    const floorY = levelConfig.floorY;
    if (player.feetY >= floorY) {
      player.feetY = floorY;
      player.vy = 0;
      player.jumping = false;
      player.grounded = true;
      player.y = player.feetY - PLAYER_HEIGHT;
    } else {
      player.grounded = false;
    }
  }
  // horizontal wrap (configurable per level)
  if (levelConfig.wrapHorizontal) {
    // wrap around edges
    if (player.x + PLAYER_WIDTH < 0) {
      player.x = canvas.width;
    } else if (player.x > canvas.width) {
      player.x = -PLAYER_WIDTH;
    }
  } else {
    // clamp to level bounds
    if (player.x < 0) {
      player.x = 0;
    } else if (player.x + PLAYER_WIDTH > canvas.width) {
      player.x = canvas.width - PLAYER_WIDTH;
    }
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
