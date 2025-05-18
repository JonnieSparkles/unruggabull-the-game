// Update module: game tick logic
import { keys } from './input.js';
import { player, updatePlayerInput } from './player.js';
import { platforms, handlePhysics } from './physics.js';
import { updateBullets, handleFiring } from './bullets.js';
import { updateCarpets as updateEnemyCarpets, updateLowerCarpets as updateEnemyLowerCarpets, carpets as enemyCarpets, lowerCarpets as enemyLowerCarpets } from './enemy.js';
import { checkBulletCarpetCollisions, checkBulletLowerCarpetCollisions, checkPlayerCarpetCollisions } from './collision.js';
import { handleBulletKill, handlePlayerHit } from './callbacks.js';
import * as state from './state.js';

/**
 * Perform one update cycle: input, physics, firing, bullet & enemy updates, and collision checks.
 */
export function updateGame(bullets, canvas) {
  if (state.gameState === 'dying') {
    // Animate body falling to the floor
    if (player.feetY < canvas.height - player.height) {
      player.vy += 1.2; // gravity
      player.feetY += player.vy;
      if (player.feetY > canvas.height - player.height) {
        player.feetY = canvas.height - player.height;
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
  updateEnemyCarpets();
  checkBulletCarpetCollisions(bullets, enemyCarpets, handleBulletKill);
  updateEnemyLowerCarpets();
  checkBulletLowerCarpetCollisions(bullets, enemyLowerCarpets, handleBulletKill);
  checkPlayerCarpetCollisions(player, enemyCarpets, handlePlayerHit);
  checkPlayerCarpetCollisions(player, enemyLowerCarpets, handlePlayerHit);
} 