// Callbacks module: default handlers for collisions
import { carpshitDeathSound, gameOverSound } from './sound.js';
import * as state from './state.js';
import { player } from './player.js';

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
  player.health--;
  carpshit.alive = false;
  carpshit.frame = 3;
  carpshit.falling = true;
  carpshit.vy = 0;
  carpshitDeathSound.currentTime = 0;
  carpshitDeathSound.play();
  if (player.health <= 0) {
    if (!state.gameState.includes('over') && state.gameState !== 'dying') {
      gameOverSound.currentTime = 0;
      gameOverSound.play();
      state.setGameState('dying');
      state.setDyingStartTime(null);
    }
  }
} 