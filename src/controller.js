// Controller module: manage game start, loop, and reset logic
import { setupControls } from './input.js';
import { generatePlatforms } from './physics.js';
import { bgMusic } from './sound.js';
import * as state from './state.js';
import { updateGame } from './update.js';
import { renderGame } from './render.js';
import { sprite, carpshitSprite } from './assets.js';
import { player } from './player.js';
import { carpshits as enemyCarpshits, lowerCarpshits as enemyLowerCarpshits } from './enemy.js';

/**
 * Reset player, enemies, and bullets for a new game.
 */
export function resetGame(canvas, bullets) {
  player.x = 50;
  player.feetY = canvas.height - 20;
  player.vx = 0;
  player.vy = 0;
  player.jumping = false;
  player.grounded = true;
  player.firing = false;
  player.facing = 1;
  player.health = 3;
  state.resetKillCount();
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
  bullets.length = 0;
  state.setDyingStartTime(null);
  state.setGameState('playing');
}

/**
 * Main game loop.
 */
export function gameLoop(canvas, ctx, bullets, restartButton, isRestartHover) {
  if (state.gameState !== 'playing' && state.gameState !== 'dying') return;
  updateGame(bullets, canvas);
  renderGame(ctx, canvas, bullets, player, restartButton, isRestartHover);
  if (state.gameState === 'playing' || state.gameState === 'dying') {
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
  bgMusic.currentTime = 0;
  bgMusic.play();
  // Controls screen dismissal
  function controlsScreenHandler(e) {
    if (state.gameState === 'controls') {
      state.setGameState('playing');
      gameLoop(canvas, ctx, bullets, restartButton, isRestartHover);
      document.removeEventListener('keydown', controlsScreenHandler);
      canvas.removeEventListener('click', controlsScreenHandler);
    }
  }
  document.addEventListener('keydown', controlsScreenHandler);
  canvas.addEventListener('click', controlsScreenHandler);
  if (sprite.complete && carpshitSprite.complete) {
    state.setGameState('controls');
    renderGame(ctx, canvas, bullets, player, restartButton, isRestartHover);
  } else {
    let loaded = 0;
    function tryStart() {
      loaded++;
      if (loaded >= 2) {
        state.setGameState('controls');
        renderGame(ctx, canvas, bullets, player, restartButton, isRestartHover);
      }
    }
    sprite.onload = tryStart;
    carpshitSprite.onload = tryStart;
  }
  enemyCarpshits.forEach(c => c.respawnTimer = 0);
  enemyLowerCarpshits.forEach(c => c.respawnTimer = 0);
}

// Expose to global for inline HTML
window.startGame = startGame; 