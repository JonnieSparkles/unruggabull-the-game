// UI Controller: manage restart button interactions
import * as state from './state.js';
import { resetGame, gameLoop } from './controller.js';
import { renderGame } from './render.js';
import { bgMusic } from './sound.js';
import { player } from './player.js';

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
    if (!state.gameState.includes('over')) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    if (
      mx >= restartButton.x && mx <= restartButton.x + restartButton.width &&
      my >= restartButton.y && my <= restartButton.y + restartButton.height
    ) {
      resetGame(canvas, bullets);
      bgMusic.currentTime = 0;
      bgMusic.play();
      state.setGameState('playing');
      isRestartHover = false;
      gameLoop(canvas, ctx, bullets, restartButton, isRestartHover);
    }
  });

  canvas.addEventListener('mousemove', function(e) {
    if (!state.gameState.includes('over')) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    isRestartHover = (
      mx >= restartButton.x && mx <= restartButton.x + restartButton.width &&
      my >= restartButton.y && my <= restartButton.y + restartButton.height
    );
    if (state.gameState.includes('over')) {
      renderGame(ctx, canvas, bullets, player, restartButton, isRestartHover);
    }
  });
} 