// Render module: draw everything to the canvas
import * as state from './state.js';
import levels from './levels/index.js';
import { getCurrentLevelKey } from './state.js';
import { showControlsScreen, drawHealth, drawKillCounter, drawDifficulty, drawGameOver, drawRestartButton } from './ui.js';
import { drawPlatforms, platforms } from './physics.js';
import { sprite, crouchSprite, deadSprite, jumpingSprite } from './assets.js';
import { drawBullets } from './bullets.js';
import { drawCarpshits as drawEnemyCarpshits, drawLowerCarpshits as drawEnemyLowerCarpshits, carpshits, lowerCarpshits } from './enemy.js';
import { showDevSettings, showDifficulty, DEBUG_HITBOXES, drawDevSettings } from './devtools.js';
import { getHitbox } from './player.js';
import { getCarpshitHitbox } from './enemy.js';

/**
 * Render the current game frame.
 */
export function renderGame(ctx, canvas, bullets, player, restartButton, isRestartHover) {
  // Clear and draw level background
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const levelConfig = levels[getCurrentLevelKey()];
  levelConfig.background(ctx, canvas);

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
      state.setFlashActive(false);
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
  if (state.gameState === 'dying' || state.gameState === 'gameover') {
    ctx.save();
    const deadW = 128;
    const deadH = 96;
    const drawX = player.x + player.width / 2 - deadW / 2;
    const drawY = player.feetY - deadH;
    if (player.facing < 0) {
      ctx.translate(drawX + deadW / 2, drawY + deadH / 2);
      ctx.scale(-1, 1);
      ctx.drawImage(deadSprite, 0, 0, deadW, deadH, -deadW / 2, -deadH / 2, deadW, deadH);
    } else {
      ctx.drawImage(deadSprite, 0, 0, deadW, deadH, drawX, drawY, deadW, deadH);
    }
    ctx.restore();
  } else {
    if (player.crouching) {
      ctx.save();
      // Animate crouch: crop bottom frameH pixels
      let frameIndex = player.firing ? 3 : Math.floor(player.frame / 10) % 4;
      const frameW = player.width;
      const frameH = player.height;
      const srcY = crouchSprite.height - frameH;
      const destY = player.feetY - frameH;
      if (player.facing < 0) {
        ctx.translate(player.x + frameW, destY);
        ctx.scale(-1, 1);
        ctx.drawImage(crouchSprite, frameIndex * frameW, srcY, frameW, frameH, 0, 0, frameW, frameH);
      } else {
        ctx.drawImage(crouchSprite, frameIndex * frameW, srcY, frameW, frameH, player.x, destY, frameW, frameH);
      }
      ctx.restore();
    } else {
      const frameIndex = player.firing ? 3 : Math.floor(player.frame / 10) % 4;
      ctx.save();
      if (!player.grounded && !player.crouching) {
        // Draw jumping sprite, crop bottom to align feet
        const frameW = player.width;
        const frameH = player.height;
        const srcY = jumpingSprite.height - frameH;
        const destY = player.feetY - frameH;
        if (player.facing < 0) {
          ctx.translate(player.x + frameW, destY);
          ctx.scale(-1, 1);
          ctx.drawImage(jumpingSprite, 0, srcY, frameW, frameH, 0, 0, frameW, frameH);
        } else {
          ctx.drawImage(jumpingSprite, 0, srcY, frameW, frameH, player.x, destY, frameW, frameH);
        }
      } else if (player.facing < 0) {
        ctx.translate(player.x + player.width, player.feetY - player.height);
        ctx.scale(-1, 1);
        ctx.drawImage(sprite, frameIndex * player.width, 0, player.width, player.height, 0, 0, player.width, player.height);
      } else {
        ctx.drawImage(sprite, frameIndex * player.width, 0, player.width, player.height, player.x, player.feetY - player.height, player.width, player.height);
      }
      ctx.restore();
    }
  }

  // Muzzle flash
  if (player.muzzleFlashTimer > 0) {
    ctx.save();
    ctx.fillStyle = 'yellow';
    ctx.globalAlpha = 0.85;
    const direction = player.facing;
    const muzzleOffsetX = direction === 1 ? player.width - 6 : -6;
    const muzzleOffsetY = player.crouching ? player.height / 2 : player.height / 2 + 5;
    const muzzleX = player.x + muzzleOffsetX;
    const muzzleY = player.y + muzzleOffsetY;
    ctx.beginPath();
    ctx.ellipse(muzzleX, muzzleY, 14, 7, 0, 0, 2 * Math.PI);
    ctx.fill();
    ctx.globalAlpha = 1.0;
    ctx.restore();
  }

  // Debug hitboxes
  if (DEBUG_HITBOXES) {
    // Draw actual hitbox
    ctx.save();
    const { x: hx, y: hy, width: hw, height: hh } = getHitbox(player);
    ctx.strokeStyle = 'lime';
    ctx.lineWidth = 2;
    ctx.strokeRect(hx, hy, hw, hh);
    ctx.restore();
    // Draw red hitboxes for all visible carpshits
    ctx.save();
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 2;
    // Upper carpshits
    carpshits.forEach(carpshit => {
      if (!carpshit.alive && !carpshit.falling && !carpshit.onFloor) return;
      const { x: cx, y: cy, width: cw, height: ch } = getCarpshitHitbox(carpshit);
      ctx.strokeRect(cx, cy, cw, ch);
    });
    // Lower carpshits
    lowerCarpshits.forEach(carpshit => {
      if (!carpshit.alive && !carpshit.falling && !carpshit.onFloor) return;
      const { x: cx, y: cy, width: cw, height: ch } = getCarpshitHitbox(carpshit);
      ctx.strokeRect(cx, cy, cw, ch);
    });
    ctx.restore();
  }

  // Bullets & enemies
  drawBullets(ctx, bullets, DEBUG_HITBOXES);
  drawEnemyCarpshits(ctx);
  drawEnemyLowerCarpshits(ctx);

  // Game over
  if (state.gameState.includes('over')) {
    // Fade overlay
    ctx.save();
    ctx.globalAlpha = 0.6; // Adjust for desired darkness
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 1.0;
    ctx.restore();

    drawGameOver(ctx, canvas);
    // Center the restart button
    restartButton.x = Math.round(canvas.width / 2 - restartButton.width / 2);
    restartButton.y = Math.round(canvas.height / 2 + 40);
    drawRestartButton(ctx, canvas, restartButton, isRestartHover);
    return;
  }

  // Dev settings overlay
  if (showDevSettings) {
    drawDevSettings(ctx, canvas, state.difficultyLevel);
  }
} 