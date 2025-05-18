// Minimal orchestration stub: wires up restart UI, DevTools, and exposes startGame
import { player } from './player.js';
import {
  spawnCarpshit as enemySpawnCarpshit,
  spawnLowerCarpshit as enemySpawnLowerCarpshit,
  carpshits as enemyCarpshits,
  lowerCarpshits as enemyLowerCarpshits,
  NUM_CARPSHITS,
  NUM_LOWER_CARPSHITS
} from './enemy.js';
import * as state from './state.js';
import { setupRestartUI, restartButton, isRestartHover } from './uiController.js';
import { setupDevTools } from './devtools.js';
import { renderGame } from './render.js';
import { startGame, gameLoop } from './controller.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const bullets = [];

/**
 * DevTools difficulty adjustment wrappers.
 */
function devIncreaseDifficulty() {
  state.increaseDifficulty();
  enemySpawnCarpshit();
  enemySpawnLowerCarpshit();
  state.setNextPhaseKillCount(state.getKillCount() + state.PHASE_CHANGE_KILL_COUNT);
}

function devDecreaseDifficulty() {
  state.decreaseDifficulty();
  if (state.difficultyLevel > 1) {
    if (enemyCarpshits.length > NUM_CARPSHITS) enemyCarpshits.pop();
    if (enemyLowerCarpshits.length > NUM_LOWER_CARPSHITS) enemyLowerCarpshits.pop();
  }
  state.setNextPhaseKillCount(state.getKillCount() + state.PHASE_CHANGE_KILL_COUNT);
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