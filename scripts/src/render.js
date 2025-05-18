// Render module: draw everything to the canvas
import * as state from './state.js';
import { showControlsScreen, drawHealth, drawKillCounter, drawDifficulty, drawGameOver, drawRestartButton } from './ui.js';
import { drawPlatforms, platforms } from './physics.js';
import { sprite, crouchSprite, deadSprite } from './assets.js';
import { drawBullets } from './bullets.js';
import { drawCarpets as drawEnemyCarpets, drawLowerCarpets as drawEnemyLowerCarpets } from './enemy.js';
import { showDevSettings, showDifficulty, DEBUG_HITBOXES, drawDevSettings } from './devtools.js';

/**
 * Render the current game frame.
 */
export function renderGame(ctx, canvas, bullets, player, restartButton, isRestartHover) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Flash overlay
  if (state.flashActive) {
    const now = performance.now();
    if (now < state.flashEndTime) {
      ctx.save();
      const alpha = 0.8 * ((state.flashEndTime - now) / state.FLASH_DURATION);
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
    } else {
      state.flashActive = false;
    }
  }

  if (state.gameState === 'controls') {
    showControlsScreen(ctx, canvas);
    return;
  }

  // HUD
  drawHealth(ctx, player.health);
  drawKillCounter(ctx, state.killCount, canvas.width);
  if (showDifficulty) drawDifficulty(ctx, state.difficultyLevel, canvas.width);

  // Platforms
  drawPlatforms(ctx, platforms);

  // Draw player
  if (state.gameState === 'dying') {
    ctx.save();
    if (player.facing < 0) {
      ctx.translate(player.x + player.width / 2, player.y + player.height - 80);
      ctx.scale(-1, 1);
      ctx.drawImage(deadSprite, 0, 0, 96, 96, -48, 0, 96, 96);
    } else {
      ctx.drawImage(deadSprite, 0, 0, 96, 96, player.x + player.width / 2 - 48, player.y + player.height - 80, 96, 96);
    }
    ctx.restore();
  } else {
    if (player.crouching) {
      ctx.save();
      if (player.facing < 0) {
        ctx.translate(player.x + player.width, player.feetY - player.height);
        ctx.scale(-1, 1);
        ctx.drawImage(crouchSprite, 0, 0, player.width, player.height, 0, 0, player.width, player.height);
      } else {
        ctx.drawImage(crouchSprite, 0, 0, player.width, player.height, player.x, player.feetY - player.height, player.width, player.height);
      }
      ctx.restore();
    } else {
      const frameIndex = player.firing ? 3 : Math.floor(player.frame / 10) % 4;
      ctx.save();
      if (player.facing < 0) {
        ctx.translate(player.x + player.width, player.feetY - player.height);
        ctx.scale(-1, 1);
        ctx.drawImage(sprite, frameIndex * player.width, 0, player.width, player.height, 0, 0, player.width, player.height);
      } else {
        ctx.drawImage(sprite, frameIndex * player.width, 0, player.width, player.height, player.x, player.feetY - player.height, player.width, player.height);
      }
      ctx.restore();
    }
  }

  // Debug hitboxes
  if (DEBUG_HITBOXES) {
    ctx.save();
    ctx.strokeStyle = 'lime';
    ctx.lineWidth = 2;
    ctx.strokeRect(player.x, player.y, player.width, player.height);
    ctx.restore();
  }

  // Bullets & enemies
  drawBullets(ctx, bullets, DEBUG_HITBOXES);
  drawEnemyCarpets(ctx);
  drawEnemyLowerCarpets(ctx);

  // Game over
  if (state.gameState.includes('over')) {
    drawGameOver(ctx, canvas);
    drawRestartButton(ctx, canvas, restartButton, isRestartHover);
    return;
  }

  // Dev settings overlay
  if (showDevSettings) {
    drawDevSettings(ctx, canvas, state.difficultyLevel);
  }
} 