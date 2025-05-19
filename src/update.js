// Update module: game tick logic
import { keys } from './input.js';
import { player, updatePlayerInput } from './player.js';
import { platforms, handlePhysics } from './physics.js';
import { updateBullets, handleFiring } from './bullets.js';
import { updateCarpshits as updateEnemyCarpshits, updateLowerCarpshits as updateEnemyLowerCarpshits, carpshits as enemyCarpshits, lowerCarpshits as enemyLowerCarpshits } from './enemy.js';
import { checkBulletcarpshitCollisions, checkBulletLowercarpshitCollisions, checkPlayercarpshitCollisions } from './collision.js';
import { handleBulletKill, handlePlayerHit } from './callbacks.js';
import * as state from './state.js';
import { bgMusic, garageDoorSound } from './sound.js';
import levels from './levels/index.js';
import { getCurrentLevelKey } from './state.js';

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
  const now = performance.now();
  // Boss hold: when reaching difficulty 6, start hold phase
  if (!state.getBossHold() && !state.getBossTransition() && !state.getBossActive() && state.difficultyLevel >= 6) {
    state.setBossHold(true);
    state.setBossHoldStartTime(now);
    // Stop music immediately
    bgMusic.pause();
    // Flash and shake to signal upcoming boss
    state.setFlashActive(true);
    state.setFlashEndTime(now + state.FLASH_DURATION);
    state.setScreenShake(true);
    state.setScreenShakeStartTime(now);
    // Reset shocked animation
    player.shockedFrame = 0;
    player.shockedFrameTimer = 0;
  }
  // During hold, wait before starting transition
  if (state.getBossHold()) {
    // Simulate unruggabull falling to ground during hold
    const floorY = canvas.height - 20;
    if (player.feetY < floorY) {
      player.vy += 0.7;
      player.feetY += player.vy;
      if (player.feetY >= floorY) {
        player.feetY = floorY;
        player.vy = 0;
        player.grounded = true;
      }
      player.y = player.feetY - player.height;
    }
    // Move player to center of screen
    const centerX = Math.round(canvas.width / 2 - player.width / 2);
    const walkSpeed = 4;
    if (Math.abs(player.x - centerX) > 2) {
      player.x += player.x < centerX ? walkSpeed : -walkSpeed;
      player.facing = player.x < centerX ? 1 : -1;
      // Don't animate shocked yet, always show frame 0
      player.shockedFrame = 0;
      player.shockedFrameTimer = 0;
      // Advance walk animation
      player.frame = (player.frame + 1) % 40;
    } else {
      player.x = centerX;
      // Still show frame 0 (no animation) during hold
      player.shockedFrame = 0;
      player.shockedFrameTimer = 0;
      // Start bossPause if not already started
      if (!state.getBossPause()) {
        state.setBossPause(true);
        state.setBossPauseStartTime(now);
      }
      // Wait for pause to finish before starting transition
      if (state.getBossPause()) {
        if (now - state.getBossPauseStartTime() < state.BOSS_PAUSE_DURATION) {
          return;
        } else {
          state.setBossPause(false);
        }
      }
    }
    const elapsedHold = now - state.getBossHoldStartTime();
    if (elapsedHold > state.BOSS_HOLD_DURATION) {
      state.setBossHold(false);
      state.setBossTransition(true);
      state.setBossTransitionStartTime(now);
      // Play garage door opening sound at transition start
      garageDoorSound.currentTime = 0;
      garageDoorSound.play();
    }
    return;
  }
  // During transition, skip normal updates until completed
  if (state.getBossTransition()) {
    // Move player to center if not already there
    const centerX = Math.round(canvas.width / 2 - player.width / 2);
    const walkSpeed = 4;
    if (Math.abs(player.x - centerX) > 2) {
      player.x += player.x < centerX ? walkSpeed : -walkSpeed;
      player.facing = player.x < centerX ? 1 : -1;
      // Don't animate shocked yet
      player.shockedFrame = 0;
      player.shockedFrameTimer = 0;
      // Advance walk animation
      player.frame = (player.frame + 1) % 40;
    } else {
      player.x = centerX;
      // Animate shocked
      player.shockedFrameTimer++;
      if (player.shockedFrameTimer > 10) {
        player.shockedFrame = (player.shockedFrame + 1) % 4;
        player.shockedFrameTimer = 0;
      }
    }
    const elapsed = now - state.getBossTransitionStartTime();
    const framesToCycle = 6; // sprites indexes 2 to 7
    const transitionDuration = 13000; // ms for full cycle
    const interval = transitionDuration / framesToCycle;
    if (elapsed > interval * framesToCycle) {
      state.setBossTransition(false);
      state.setBossActive(true);
      // Spawn boss
      state.setCurrentBoss(levels[getCurrentLevelKey()].boss);
      state.getCurrentBoss().spawn();
    }
    return;
  }
  // If boss is active, only update boss logic
  if (state.getBossActive() && state.getCurrentBoss()) {
    state.getCurrentBoss().update();
    return;
  }
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