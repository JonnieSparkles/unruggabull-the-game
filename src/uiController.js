// UI Controller: manage restart button interactions
import * as state from './state.js';
import { resetGame, gameLoop, startGame } from './controller.js';
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
  // Track last mouse position globally for congrats hover fix
  window._lastMousePos = { x: 0, y: 0 };
  window.isRestartHover = isRestartHover;
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
      // On congrats, do a full reload to reset all game state
      if (state.gameState === 'congrats') {
        window.location.reload();
        return;
      }
      // Always restart from the controls screen (normal and boss deaths)
      isRestartHover = false;
      startGame(canvas, ctx, bullets, restartButton, isRestartHover);
    }
  });

  canvas.addEventListener('mousemove', function(e) {
    // Allow hover on game over or congrats screens
    if (!state.gameState.includes('over') && state.gameState !== 'congrats') return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    window._lastMousePos = { x: mx, y: my };
    isRestartHover = (
      mx >= restartButton.x && mx <= restartButton.x + restartButton.width &&
      my >= restartButton.y && my <= restartButton.y + restartButton.height
    );
    window.isRestartHover = isRestartHover;
    if (state.gameState.includes('over') || state.gameState === 'congrats') {
      renderGame(ctx, canvas, bullets, player, restartButton, isRestartHover);
    }
  });
} 