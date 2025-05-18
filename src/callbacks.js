// Callbacks module: default handlers for collisions
import { carpetDeathSound, gameOverSound } from './sound.js';
import * as state from './state.js';
import { player } from './player.js';

/**
 * Handle when a bullet hits a carpet: kill carpet, play sound, update score and difficulty.
 */
export function handleBulletKill(bullets, index, carpet) {
  carpet.alive = false;
  carpet.frame = 3;
  carpet.falling = true;
  carpet.vy = 0;
  carpetDeathSound.currentTime = 0;
  carpetDeathSound.play();
  bullets.splice(index, 1);
  state.incrementKillCount();
  if (state.getKillCount() === state.nextPhaseKillCount) {
    state.setFlashActive(true);
    state.setFlashEndTime(performance.now() + state.FLASH_DURATION);
    state.increaseDifficulty();
  }
}

/**
 * Handle when the player collides with a carpet: decrement health, trigger game over if needed.
 */
export function handlePlayerHit(carpet) {
  player.health--;
  carpet.alive = false;
  carpet.frame = 3;
  carpet.falling = true;
  carpet.vy = 0;
  carpetDeathSound.currentTime = 0;
  carpetDeathSound.play();
  if (player.health <= 0) {
    if (!state.gameState.includes('over') && state.gameState !== 'dying') {
      gameOverSound.currentTime = 0;
      gameOverSound.play();
      state.setGameState('dying');
      state.setDyingStartTime(null);
    }
  }
} 