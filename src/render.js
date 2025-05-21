// Render module: draw everything to the canvas
import * as state from './state.js';
import levels from './levels/index.js';
import { getCurrentLevelKey } from './state.js';
import { showControlsScreen, drawHealth, drawKillCounter, drawDifficulty, drawGameOver, drawCongrats, drawRestartButton } from './ui.js';
import { drawPlatforms, platforms } from './physics.js';
import { walkingSprite, crouchSprite, deadSprite, jumpingSprite, shockedSprite, walkingForwardSprite, bossDeadImage } from './assets.js';
import { drawBullets } from './bullets.js';
import { drawCarpshits as drawEnemyCarpshits, drawLowerCarpshits as drawEnemyLowerCarpshits, carpshits, lowerCarpshits } from './enemy.js';
import { showDevSettings, showDifficulty, DEBUG_HITBOXES, drawDevSettings } from './devtools.js';
import { getHitbox } from './player.js';
import { getCarpshitHitbox } from './enemy.js';
import { getBossHold, getBossPause, getBossTransition, getBossActive, getCurrentBoss, getScreenShake, getScreenShakeStartTime, SCREEN_SHAKE_DURATION, getBlinkingOut, getBlinkingOutStartTime, getCarpshitsDuringBoss } from './state.js';
import { BLINK_OUT_DURATION } from './constants/timing.js';
import { bgSprite, FIRST_FLICKER_FRAMES, TRANSITION_FRAMES } from './levels/rugcoAlley/background.js';
import { PLAYER_SPRITES } from './playerSprites.js';
import { PLAYER_WIDTH, PLAYER_HEIGHT } from './constants/player.js';

/**
 * Render the current game frame.
 */
export function renderGame(ctx, canvas, bullets, player, restartButton, isRestartHover) {
  // Screen shake wrapper
  const now = performance.now();
  // FIGHT! banner overlay
  if (state.getFightBanner && state.getFightBanner()) {
    const elapsed = now - state.getFightBannerStartTime();
    const DURATION = 1000; // ms to display banner
    if (elapsed < DURATION) {
      ctx.save();
      ctx.font = 'bold 72px Arial';
      ctx.fillStyle = '#ff0';
      ctx.textAlign = 'center';
      ctx.shadowColor = '#000';
      ctx.shadowBlur = 12;
      ctx.fillText('FIGHT!', canvas.width / 2, canvas.height / 2 - 50);
      ctx.restore();
      return; // skip other rendering while banner shows
    } else {
      state.setFightBanner(false);
    }
  }
  ctx.save();
  let shouldReturn = false;
  if (getScreenShake()) {
    const elapsedShake = now - getScreenShakeStartTime();
    if (elapsedShake > SCREEN_SHAKE_DURATION) {
      state.setScreenShake(false);
    } else {
      const magnitude = 10;
      const dx = (Math.random() * 2 - 1) * magnitude;
      const dy = (Math.random() * 2 - 1) * magnitude;
      ctx.translate(dx, dy);
    }
  }
  // Clear and draw level background (override during bossExit)
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const levelConfig = levels[getCurrentLevelKey()];
  const floorY = levelConfig.floorY;
  if (state.getGameState() === 'bossExit') {
    // If Unruggabull is still visible (hasn't finished vertical walk), hold on final door-open frame (index 9)
    const garageFloorY = ctx.canvas.height - 120;
    if (player.feetY > garageFloorY + 10) {
      const frameIndex = FIRST_FLICKER_FRAMES + TRANSITION_FRAMES - 1;
      ctx.drawImage(
        bgSprite,
        frameIndex * ctx.canvas.width, 0,
        ctx.canvas.width, ctx.canvas.height,
        0, 0,
        ctx.canvas.width, ctx.canvas.height
      );
    } else {
      // After Unruggabull has entered, flicker between frames 2 and 1
      const flickerInterval = 1000 / 1.5;
      const flickerFrames = [2, 1];
      const idx = Math.floor(performance.now() / flickerInterval) % 2;
      const frameIndex = flickerFrames[idx];
      ctx.drawImage(
        bgSprite,
        frameIndex * ctx.canvas.width, 0,
        ctx.canvas.width, ctx.canvas.height,
        0, 0,
        ctx.canvas.width, ctx.canvas.height
      );
    }
  } else {
    levelConfig.background(ctx, canvas);
  }

  // Special exit sequence rendering
  if (state.getGameState() === 'bossExit') {
    // Draw dead boss at recorded exit position
    const BOSS_WIDTH = 128;
    const BOSS_HEIGHT = 128;
    const exitX = state.getExitBossX();
    const exitY = state.getExitBossY();
    const exitScale = state.getExitBossScale();
    ctx.drawImage(
      bossDeadImage,
      exitX,
      exitY,
      BOSS_WIDTH * exitScale,
      BOSS_HEIGHT * exitScale
    );
    // Determine exit phase: horizontal or vertical
    const centerX = Math.round(canvas.width / 2 - player.width / 2);
    const garageFloorY = canvas.height - 120;
    if (Math.abs(player.x - centerX) > 2) {
      // Horizontal walking: use side-view sprite
      const walkFrame = Math.floor(player.frame / 10) % 4;
      ctx.save();
      if (player.facing < 0) {
        // Flip sprite when facing left
        ctx.translate(player.x + player.width, player.feetY - player.height);
        ctx.scale(-1, 1);
        ctx.drawImage(walkingSprite, walkFrame * player.width, 0, player.width, player.height, 0, 0, player.width, player.height);
      } else {
        ctx.drawImage(walkingSprite, walkFrame * player.width, 0, player.width, player.height, player.x, player.feetY - player.height, player.width, player.height);
      }
      ctx.restore();
    } else {
      // Vertical walking into garage with perspective shrink
      const frameCount = 4;
      const frameW = 96;
      const frameH = 96;
      const frameIndex = Math.floor(player.frame / 10) % frameCount;
      const progress = (floorY - player.feetY) / (floorY - garageFloorY);
      const scaleFactor = 1 - progress * 0.5; // shrink up to 50%
      const drawW = frameW * scaleFactor;
      const drawH = frameH * scaleFactor;
      const drawX = player.x + player.width / 2 - drawW / 2;
      const drawY = player.feetY - drawH;
      ctx.drawImage(
        walkingForwardSprite,
        frameIndex * frameW,
        0,
        frameW,
        frameH,
        drawX,
        drawY,
        drawW,
        drawH
      );
    }
    return;
  }
  // During door closing, keep showing dead boss behind the closing door
  if (state.getGameState() === 'bossExitDoorClosing') {
    const scale = 2.0;
    const BOSS_WIDTH = 128;
    const BOSS_HEIGHT = 128;
    const imgW = BOSS_WIDTH * scale;
    const imgH = BOSS_HEIGHT * scale;
    const imgX = Math.round(canvas.width / 2 - imgW / 2);
    const imgY = Math.round(levelConfig.floorY - imgH);
    ctx.drawImage(bossDeadImage, imgX, imgY, imgW, imgH);
    return;
  }

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
    shouldReturn = true;
  } else {
    // HUD
    drawHealth(ctx, player.health);
    if (!getBossHold() && !getBossPause() && !getBossTransition() && !getBossActive()) {
      drawKillCounter(ctx, state.killCount, canvas.width);
      if (showDifficulty) drawDifficulty(ctx, state.difficultyLevel, canvas.width);
    }

    // Platforms
    if (!getBossTransition() && !getBossActive()) {
      if (getBlinkingOut()) {
        const elapsed = performance.now() - getBlinkingOutStartTime();
        const blink = Math.floor(elapsed / 80) % 2 === 0;
        ctx.save();
        ctx.globalAlpha = blink ? 0.2 + 0.8 * (1 - elapsed / BLINK_OUT_DURATION) : 0.1;
        drawPlatforms(ctx, platforms);
        ctx.globalAlpha = 1.0;
        ctx.restore();
      } else {
        drawPlatforms(ctx, platforms);
      }
    }

    // Draw player with timeline-driven sprite map (time-based animation)
    const spriteState = player.sprite || 'idle';
    let spriteInfo = PLAYER_SPRITES[spriteState];
    if (!spriteInfo) {
      console.warn(`Unknown player sprite state: "${spriteState}"; defaulting to idle.`);
      spriteInfo = PLAYER_SPRITES['idle'];
    }
    {
      const img = spriteInfo.image;
      const frameWidth = player.width;
      const frameHeight = player.height;
      const frameCount = spriteInfo.animated ? spriteInfo.frameCount : 1;
      const duration = spriteInfo.animated ? spriteInfo.frameDuration : 0;
      const t = performance.now();
      const frameIndex = spriteInfo.animated
        ? Math.floor(t / duration) % frameCount
        : (spriteInfo.frame || 0);
      const offsetY = spriteInfo.offsetY || 0;

      let srcY = 0;
      let srcH = frameHeight;
      let destY = player.feetY - frameHeight + offsetY;
      if (spriteState === 'crouch') {
        // Crop from the bottom of the crouch sprite so feet align
        srcY = img.height - frameHeight;
        srcH = frameHeight;
        destY = player.feetY - frameHeight + offsetY;
      }

      ctx.save();
      if (player.facing < 0) {
        ctx.translate(player.x + frameWidth, destY);
        ctx.scale(-1, 1);
        ctx.drawImage(
          img,
          frameIndex * frameWidth, srcY, frameWidth, srcH,
          0, 0, frameWidth, frameHeight
        );
      } else {
        ctx.drawImage(
          img,
          frameIndex * frameWidth, srcY, frameWidth, srcH,
          player.x, destY, frameWidth, frameHeight
        );
      }
      ctx.restore();
    }
    // Skip legacy drawing logic. Continue with muzzle flash, bullets, etc.

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
        if (getBlinkingOut()) {
          const elapsed = performance.now() - getBlinkingOutStartTime();
          if (Math.floor(elapsed / 80) % 2 === 0) return;
        }
        const { x: cx, y: cy, width: cw, height: ch } = getCarpshitHitbox(carpshit);
        ctx.strokeRect(cx, cy, cw, ch);
      });
      // Lower carpshits
      lowerCarpshits.forEach(carpshit => {
        if (!carpshit.alive && !carpshit.falling && !carpshit.onFloor) return;
        if (getBlinkingOut()) {
          const elapsed = performance.now() - getBlinkingOutStartTime();
          if (Math.floor(elapsed / 80) % 2 === 0) return;
        }
        const { x: cx, y: cy, width: cw, height: ch } = getCarpshitHitbox(carpshit);
        ctx.strokeRect(cx, cy, cw, ch);
      });
      ctx.restore();
    }

    // Bullets always visible
    drawBullets(ctx, bullets, DEBUG_HITBOXES);
    // Enemies only when not in boss transition or boss fight, or if carpshitsDuringBoss is true
    if (!getBossTransition() && !getBossActive() || getCarpshitsDuringBoss()) {
      if (getBlinkingOut()) {
        const elapsed = performance.now() - getBlinkingOutStartTime();
        const blink = Math.floor(elapsed / 80) % 2 === 0;
        ctx.save();
        ctx.globalAlpha = blink ? 0.2 + 0.8 * (1 - elapsed / BLINK_OUT_DURATION) : 0.1;
        drawEnemyCarpshits(ctx);
        drawEnemyLowerCarpshits(ctx);
        ctx.globalAlpha = 1.0;
        ctx.restore();
      } else {
        drawEnemyCarpshits(ctx);
        drawEnemyLowerCarpshits(ctx);
      }
    }

    // Congrats screen
    if (state.gameState === 'congrats') {
      // Fade overlay
      ctx.save();
      ctx.globalAlpha = 0.6;
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.globalAlpha = 1.0;
      ctx.restore();

      drawCongrats(ctx, canvas);
      // Center the restart button
      restartButton.x = Math.round(canvas.width / 2 - restartButton.width / 2);
      restartButton.y = Math.round(canvas.height / 2 + 60);
      drawRestartButton(ctx, canvas, restartButton, isRestartHover);
      shouldReturn = true;
    }

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
      shouldReturn = true;
    }

    // Boss draw if active
    if (getBossActive() && getCurrentBoss()) {
      getCurrentBoss().draw(ctx);
      if (DEBUG_HITBOXES) {
        // Draw boss hitbox
        const bossHitbox = getCurrentBoss().getHitbox();
        ctx.save();
        ctx.strokeStyle = 'orange';
        ctx.lineWidth = 2;
        ctx.strokeRect(bossHitbox.x, bossHitbox.y, bossHitbox.width, bossHitbox.height);
        ctx.restore();
        // Draw player hitbox
        const { x: hx, y: hy, width: hw, height: hh } = getHitbox(player);
        ctx.save();
        ctx.strokeStyle = 'lime';
        ctx.lineWidth = 2;
        ctx.strokeRect(hx, hy, hw, hh);
        ctx.restore();
      }
      shouldReturn = true;
    }
  }

  // Dev settings overlay always on top
  if (showDevSettings) {
    drawDevSettings(ctx, canvas, state.difficultyLevel);
  }
  ctx.restore();
  if (shouldReturn) return;
} 