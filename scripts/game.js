// Minimal orchestration stub: wires up restart UI, DevTools, and exposes startGame
import { player } from './src/player.js';
import {
  spawnCarpet as enemySpawnCarpet,
  spawnLowerCarpet as enemySpawnLowerCarpet,
  carpets as enemyCarpets,
  lowerCarpets as enemyLowerCarpets,
  NUM_CARPETS,
  NUM_LOWER_CARPETS
} from './src/enemy.js';
import * as state from './src/state.js';
import { setupRestartUI, restartButton, isRestartHover } from './src/uiController.js';
import { setupDevTools } from './src/devtools.js';
import { renderGame } from './src/render.js';
import { startGame, gameLoop } from './src/controller.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const bullets = [];

/**
 * DevTools difficulty adjustment wrappers.
 */
function devIncreaseDifficulty() {
  state.increaseDifficulty();
  enemySpawnCarpet();
  enemySpawnLowerCarpet();
}

function devDecreaseDifficulty() {
  state.decreaseDifficulty();
  if (state.difficultyLevel > 1) {
    if (enemyCarpets.length > NUM_CARPETS) enemyCarpets.pop();
    if (enemyLowerCarpets.length > NUM_LOWER_CARPETS) enemyLowerCarpets.pop();
  }
}

/**
 * Proxy draw method for DevTools.
 */
function draw() {
  renderGame(ctx, canvas, bullets, player, restartButton, isRestartHover);
}

// Initialize UI and DevTools.
setupRestartUI(canvas, ctx, bullets);
const boundGameLoop = () => gameLoop(canvas, ctx, bullets, restartButton, isRestartHover);
setupDevTools(
  canvas,
  draw,
  boundGameLoop,
  devIncreaseDifficulty,
  devDecreaseDifficulty,
  state.getGameState,
  state.setGameState
);

// Expose startGame globally.
window.startGame = () => startGame(canvas, ctx, bullets, restartButton, isRestartHover); 