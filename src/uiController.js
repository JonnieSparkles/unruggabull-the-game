// UI Controller: manage restart button interactions
import * as state from './state.js';
import { resetGame, gameLoop } from './controller.js';
import { renderGame } from './render.js';
import { bgMusic } from './sound.js';
import { player } from './player.js';
import levels from './levels/index.js';
import { getCurrentLevelKey } from './state.js';

export let isRestartHover = false;
export const restartButton = {
  x: 0,
  y: 0,
  width: 200,
  height: 60
};

/**
 * Set up restart button click and hover handlers.
 */
export function setupRestartUI(canvas, ctx, bullets) {
  canvas.addEventListener('click', function(e) {
    // Allow restart on game over or congrats screens
    if (!state.gameState.includes('over') && state.gameState !== 'congrats') return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    if (
      mx >= restartButton.x && mx <= restartButton.x + restartButton.width &&
      my >= restartButton.y && my <= restartButton.y + restartButton.height
    ) {
      // Reset game state and reload level-specific music
      resetGame(canvas, bullets);
      const levelConfig = levels[getCurrentLevelKey()];
      // Pause before changing src to avoid AbortError
      bgMusic.pause();
      bgMusic.src = levelConfig.music;
      bgMusic.currentTime = 0;
      // Play in a microtask to avoid race with pause
      Promise.resolve().then(() => bgMusic.play());
      state.setGameState('playing');
      isRestartHover = false;
      gameLoop(canvas, ctx, bullets, restartButton, isRestartHover);
    }
  });

  canvas.addEventListener('mousemove', function(e) {
    // Allow hover on game over or congrats screens
    if (!state.gameState.includes('over') && state.gameState !== 'congrats') return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    isRestartHover = (
      mx >= restartButton.x && mx <= restartButton.x + restartButton.width &&
      my >= restartButton.y && my <= restartButton.y + restartButton.height
    );
    if (state.gameState.includes('over') || state.gameState === 'congrats') {
      renderGame(ctx, canvas, bullets, player, restartButton, isRestartHover);
    }
  });
} 