// Controller module: manage game start, loop, and reset logic
import { setupControls } from './input.js';
import { generatePlatforms } from './physics.js';
import { bgMusic } from './sound.js';
import * as state from './state.js';
import { updateGame } from './update.js';
import { renderGame } from './render.js';
import { carpshitSprite } from './assets.js';
import { player} from './player.js';
import { carpshits as enemyCarpshits, lowerCarpshits as enemyLowerCarpshits } from './enemies/carpshits.js';
import levels from './levels/index.js';
import { getCurrentLevelKey } from './state.js';
import { GAME_STATES } from './constants/gameStates.js';
import { PLAYER_WIDTH, PLAYER_HEIGHT, PLAYER_START_HEALTH } from './constants/player.js';
import { clearEntities } from './utils/sceneUtils.js';
import { BLASTER_MAX_ENERGY } from './constants/blaster.js';

/**
 * Reset player, enemies, and bullets for a new game.
 */
export function resetGame(canvas, bullets) {
  // Reset boss trigger state
  state.setBossTriggered(false);
  // Reset exit sequence flags
  state.setBossExit(false);
  state.setBossExitDoorClosing(false);
  player.x = 50;
  // Reset player dimensions
  player.width = PLAYER_WIDTH;
  player.height = PLAYER_HEIGHT;
  const levelConfig = levels[getCurrentLevelKey()];
  player.feetY = levelConfig.floorY;
  player.vx = 0;
  player.vy = 0;
  player.jumping = false;
  player.grounded = true;
  player.firing = false;
  player.facing = 1;
  player.health = PLAYER_START_HEALTH;
  player.invulnerable = false;
  player.invulnerableUntil = null;
  // Initialize blaster energy system
  player.blasterEnergy = BLASTER_MAX_ENERGY;
  player.blasterMaxEnergy = BLASTER_MAX_ENERGY;
  player.blasterLastRechargeTime = performance.now();
  player.blasterEmptyFlashEndTime = 0;
  state.resetKillCount();
  // Configure how many kills until difficulty increases for this level
  state.setPhaseChangeKillCount(levelConfig.phaseChangeKillCount);
  enemyCarpshits.forEach(carpshit => {
    carpshit.x = canvas.width + 48 + Math.random() * 200;
    carpshit.y = 80 + Math.random() * 180;
    carpshit.vx = -(1.5 + Math.random());
    carpshit.alive = true;
    carpshit.frame = 0;
    carpshit.frameTimer = 0;
    carpshit.falling = false;
    carpshit.vy = 0;
    carpshit.onFloor = false;
    carpshit.respawnTimer = 0;
  });
  enemyLowerCarpshits.forEach(carpshit => {
    carpshit.x = canvas.width + 48 + Math.random() * 200;
    carpshit.y = 300 + Math.random() * 40;
    carpshit.vx = -(1 + Math.random());
    carpshit.alive = true;
    carpshit.frame = 0;
    carpshit.frameTimer = 0;
    carpshit.falling = false;
    carpshit.vy = 0;
    carpshit.onFloor = false;
    carpshit.respawnTimer = 0;
  });
  clearEntities(bullets);
  state.setDyingStartTime(null);
  state.setGameState('playing');
  state.setGameStartTime(performance.now());
  state.setGameStopTime(0);
  state.setCongratsStartTime(0);
  state.setDifficultyLevel(1);
  state.setWaveBanner(false);
  state.setWaveBannerStartTime(0);
  // Reset defeat scene trigger
  if (typeof updateGame !== 'undefined') updateGame._defeatSceneStarted = false;
}

/**
 * Main game loop.
 */
export function gameLoop(canvas, ctx, bullets, restartButton, isRestartHover) {
  // Continue loop for playing, dying, exit phases, or congrats state
  if (
    state.gameState !== 'playing' &&
    state.gameState !== 'dying' &&
    state.gameState !== 'bossExit' &&
    state.gameState !== 'bossExitDoorClosing' &&
    state.gameState !== 'congrats'
  ) return;
  updateGame(bullets, canvas);
  renderGame(ctx, canvas, bullets, player, restartButton, isRestartHover);
  if (
    state.gameState === 'playing' ||
    state.gameState === 'dying' ||
    state.gameState === 'bossExit' ||
    state.gameState === 'bossExitDoorClosing' ||
    state.gameState === 'congrats'
  ) {
    requestAnimationFrame(() => gameLoop(canvas, ctx, bullets, restartButton, isRestartHover));
  }
}

/**
 * Start a new game: show controls screen, initialize, then enter main loop.
 */
export function startGame(canvas, ctx, bullets, restartButton, isRestartHover) {
  // Reset player, enemies, and bullets to the updated canvas-based starting positions
  resetGame(canvas, bullets);
  setupControls();
  generatePlatforms();
  // Load level-specific music
  const levelConfig = levels[getCurrentLevelKey()];
  bgMusic.src = levelConfig.music;
  bgMusic.currentTime = 0;
  bgMusic.play();
  // Controls screen dismissal
  function controlsScreenHandler(e) {
    if (state.gameState === 'controls') {
      state.setGameState('playing');
      state.setGameStartTime(performance.now());
      // Show initial wave banner only after controls screen is dismissed
      state.setWaveBanner(true);
      state.setWaveBannerStartTime(performance.now());
      gameLoop(canvas, ctx, bullets, restartButton, isRestartHover);
      document.removeEventListener('keydown', controlsScreenHandler);
      canvas.removeEventListener('click', controlsScreenHandler);
    }
  }
  document.addEventListener('keydown', controlsScreenHandler);
  canvas.addEventListener('click', controlsScreenHandler);
  if (carpshitSprite.complete) {
    state.setGameState('controls');
    renderGame(ctx, canvas, bullets, player, restartButton, isRestartHover);
  } else {
    carpshitSprite.onload = function() {
      state.setGameState('controls');
      renderGame(ctx, canvas, bullets, player, restartButton, isRestartHover);
    };
  }
  enemyCarpshits.forEach(c => c.respawnTimer = 0);
  enemyLowerCarpshits.forEach(c => c.respawnTimer = 0);
}

// Expose to global for inline HTML
window.startGame = startGame; 