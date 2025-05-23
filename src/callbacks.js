// Callbacks module: default handlers for collisions
import { carpshitDeathSound, gameOverSound } from './sound.js';
import * as state from './state.js';
import { player } from './player.js';
import { FLASH_DURATION, INVULNERABLE_TIME } from './constants/timing.js';
import { GAME_STATES } from './constants/gameStates.js';
import { playPlayerHitSound, setPlayerHitFlashActive, setPlayerHitFlashEndTime } from './state.js';

/**
 * Handle when a bullet hits a carpshit: kill carpshit, play sound, update score and difficulty.
 */
export function handleBulletKill(bullets, index, carpshit) {
  carpshit.alive = false;
  carpshit.frame = 3;
  carpshit.falling = true;
  carpshit.vy = 0;
  carpshitDeathSound.currentTime = 0;
  carpshitDeathSound.play();
  bullets.splice(index, 1);
  state.incrementKillCount();
  if (state.getKillCount() === state.nextPhaseKillCount) {
    state.setFlashActive(true);
    state.setFlashEndTime(performance.now() + state.FLASH_DURATION);
    state.increaseDifficulty();
  }
}

/**
 * Handle when the player collides with a carpshit: decrement health, trigger game over if needed.
 */
export function handlePlayerHit(carpshit) {
  if (player.invulnerable) return;
  player.health--;
  player.invulnerable = true;
  player.invulnerableUntil = performance.now() + 1500;
  // If player died, set death sprite and width
  if (player.health <= 0) {
    player.sprite = 'dead';
    player.width = 128;
  }
  carpshit.alive = false;
  carpshit.frame = 3;
  carpshit.falling = true;
  carpshit.vy = 0;
  carpshitDeathSound.currentTime = 0;
  carpshitDeathSound.play();
  // Red screen flash and hit sound
  const duration = FLASH_DURATION;
  state.setFlashActive(true);
  state.setFlashEndTime(performance.now() + duration);
  state.setFlashColor('rgba(255,0,0,0.5)');
  playPlayerHitSound();
  setPlayerHitFlashActive(true);
  setPlayerHitFlashEndTime(performance.now() + duration);
  if (player.health <= 0) {
    if (!state.gameState.includes('over') && state.gameState !== 'dying') {
      gameOverSound.currentTime = 0;
      gameOverSound.play();
      state.setGameState('dying');
      state.setDyingStartTime(null);
    }
  }
}

/**
 * Handle when a boss carpet projectile hits the player.
 */
export function handleCarpetHit(projectiles, index, carpet) {
  if (player.invulnerable) return;
  player.health--;
  player.invulnerable = true;
  player.invulnerableUntil = performance.now() + INVULNERABLE_TIME;
  if (player.health <= 0) {
    player.sprite = 'dead';
    player.width = 128;
  }
  // Mark as hit and stop movement, then remove after delay to show final frame
  carpet.hit = true;
  carpet.vx = 0;
  carpet.vy = 0;
  setTimeout(() => {
    const idx = projectiles.indexOf(carpet);
    if (idx >= 0) projectiles.splice(idx, 1);
  }, 500);
  state.setFlashActive(true);
  state.setFlashColor('rgba(255,0,0,0.5)');
  state.setFlashEndTime(performance.now() + FLASH_DURATION);
  playPlayerHitSound();
  setPlayerHitFlashActive(true);
  setPlayerHitFlashEndTime(performance.now() + FLASH_DURATION);
  if (player.health <= 0 && !state.gameState.includes('over') && state.gameState !== 'dying') {
    gameOverSound.currentTime = 0;
    gameOverSound.play();
    state.setGameState('dying');
    state.setDyingStartTime(null);
  }
} 