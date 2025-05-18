// Update module: game tick logic
import { keys } from './input.js';
import { player, updatePlayerInput } from './player.js';
import { platforms, handlePhysics } from './physics.js';
import { updateBullets, handleFiring } from './bullets.js';
import { updateCarpshits as updateEnemyCarpshits, updateLowerCarpshits as updateEnemyLowerCarpshits, carpshits as enemyCarpshits, lowerCarpshits as enemyLowerCarpshits } from './enemy.js';
import { checkBulletcarpshitCollisions, checkBulletLowercarpshitCollisions, checkPlayercarpshitCollisions } from './collision.js';
import { handleBulletKill, handlePlayerHit } from './callbacks.js';
import * as state from './state.js';

/**
 * Perform one update cycle: input, physics, firing, bullet & enemy updates, and collision checks.
 */
export function updateGame(bullets, canvas) {
  if (state.gameState === 'dying') {
    // Animate body falling to the floor
    const floorY = canvas.height - 20;
    if (player.feetY < floorY) {
      player.vy += 1.2; // gravity
      player.feetY += player.vy;
      if (player.feetY > floorY) {
        player.feetY = floorY;
        player.vy = 0;
        if (!state.getDyingStartTime()) state.setDyingStartTime(performance.now());
      }
    } else {
      if (!state.getDyingStartTime()) state.setDyingStartTime(performance.now());
      // Wait 1s after landing, then show game over
      if (performance.now() - state.getDyingStartTime() > 1000) {
        state.setGameState('gameover');
      }
    }
    return;
  }
  if (state.gameState !== 'playing') return;
  updatePlayerInput();
  handlePhysics(player, platforms, canvas);
  // Handle firing input: spawn bullets when fire key is pressed
  handleFiring(keys, player, bullets);
  updateBullets(bullets, canvas.width);
  updateEnemyCarpshits();
  checkBulletcarpshitCollisions(bullets, enemyCarpshits, handleBulletKill);
  updateEnemyLowerCarpshits();
  checkBulletLowercarpshitCollisions(bullets, enemyLowerCarpshits, handleBulletKill);
  checkPlayercarpshitCollisions(player, enemyCarpshits, handlePlayerHit);
  checkPlayercarpshitCollisions(player, enemyLowerCarpshits, handlePlayerHit);
} 