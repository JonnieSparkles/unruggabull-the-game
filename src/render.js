// Render module: draw everything to the canvas
import * as state from './state.js';
import levels from './levels/index.js';
import { getCurrentLevelKey } from './state.js';
import { showControlsScreen, drawHealth, drawKillCounter, drawDifficulty, drawGameOver, drawCongrats, drawRestartButton } from './ui.js';
import { drawPlatforms, platforms } from './physics.js';
import { deadSprite } from './assets.js';
import { drawCarpshits, drawLowerCarpshits, carpshits, lowerCarpshits } from './enemies/carpshits.js';
import { showDevSettings, showDifficulty, DEBUG_HITBOXES, drawDevSettings } from './devtools.js';
import { getHitbox } from './player.js';
import { getCarpshitHitbox } from './enemies/carpshits.js';
import { getBossHold, getBossPause, getBossTransition, getBossActive, getCurrentBoss, getScreenShake, getScreenShakeStartTime, SCREEN_SHAKE_DURATION, getScreenShakeMagnitude, getBlinkingOut, getBlinkingOutStartTime, getCarpshitsDuringBoss } from './state.js';
import { BLINK_OUT_DURATION } from './levels/rugcoAlley/rugfatherConstants.js';
import { bgSprite, FIRST_FLICKER_FRAMES, TRANSITION_FRAMES } from './levels/rugcoAlley/background.js';
import { PLAYER_SPRITES } from './playerSprites.js';
import { PLAYER_WIDTH, PLAYER_HEIGHT } from './constants/player.js';
import { drawProjectiles, projectiles } from './projectiles/index.js';
import { BLASTER_EMPTY_FLASH_DURATION } from './constants/blaster.js';

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
  let shaking = false;
  if (getScreenShake()) {
    const elapsedShake = now - getScreenShakeStartTime();
    if (elapsedShake > SCREEN_SHAKE_DURATION) {
      state.setScreenShake(false);
    } else {
      shaking = true;
      ctx.save();
      const magnitude = getScreenShakeMagnitude();
      const dx = (Math.random() * 2 - 1) * magnitude;
      const dy = (Math.random() * 2 - 1) * magnitude;
      ctx.translate(dx, dy);
    }
  }
  // Clear and draw level background (override during bossExit)
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const levelConfig = levels[getCurrentLevelKey()];
  const floorY = levelConfig.floorY;
  levelConfig.background(ctx, canvas);

  // Flash overlay
  if (state.flashActive) {
    const flashNow = performance.now();
    const timeLeft = state.flashEndTime - flashNow;
    if (timeLeft > 0) {
      const alpha = timeLeft / state.FLASH_DURATION;
      const color = state.flashColor || 'rgba(255,255,255,0.8)';
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
    } else {
      state.setFlashActive(false);
      state.setFlashColor('rgba(255,255,255,0.8)');
    }
  }

  if (state.gameState === 'controls') {
    showControlsScreen(ctx, canvas);
    shouldReturn = true;
  } else {
    // HUD
    drawHealth(ctx, player.health);
    // Blaster energy bar
    {
      const barX = 20;
      const barY = 50;
      const barWidth = 200;
      const barHeight = 12;
      // Background
      ctx.save();
      ctx.fillStyle = '#222';
      ctx.fillRect(barX, barY, barWidth, barHeight);
      // Filled portion
      const ratio = player.blasterEnergy / player.blasterMaxEnergy;
      ctx.fillStyle = '#0ff';
      ctx.fillRect(barX, barY, barWidth * ratio, barHeight);
      // Flash red when empty
      if (player.blasterEmptyFlashEndTime > now) {
        ctx.globalAlpha = (player.blasterEmptyFlashEndTime - now) / BLASTER_EMPTY_FLASH_DURATION;
        ctx.fillStyle = 'red';
        ctx.fillRect(barX, barY, barWidth, barHeight);
      }
      ctx.restore();
    }
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
      const frameWidth = spriteInfo.frameWidth || player.width;
      const frameHeight = spriteInfo.frameHeight || player.height;
      const t = performance.now();
      let frameData;
      if (spriteInfo.frameSequence) {
        frameData = spriteInfo.frameSequence[Math.floor(t / spriteInfo.frameDuration) % spriteInfo.frameSequence.length];
        if (typeof frameData === 'number') {
          frameData = { frame: frameData, mirror: false };
        }
      } else if (spriteInfo.animated) {
        frameData = { frame: Math.floor(t / spriteInfo.frameDuration) % (spriteInfo.frameCount || 1), mirror: false };
      } else {
        frameData = { frame: spriteInfo.frame || 0, mirror: false };
      }
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
      // Player invulnerability blink
      let alpha = player.opacity !== undefined ? player.opacity : 1.0;
      // Only apply invulnerable flicker if not dead
      if (player.invulnerable && spriteState !== 'dead') {
        const blinkInterval = 200; // ms between alpha toggles
        const blinkOn = Math.floor(now / blinkInterval) % 2 === 0;
        alpha *= blinkOn ? 0.5 : 1.0;
      }
      ctx.globalAlpha = alpha;
      // Support scale for defeat scene
      const scale = player.scale !== undefined ? player.scale : 1.0;
      ctx.translate(player.x + (frameWidth * (1 - scale)) / 2, destY + (frameHeight * (1 - scale)) / 2);
      ctx.scale(scale, scale);
      // Special case: dead sprite is always unmirrored and uses full width
      if (spriteState === 'dead') {
        ctx.drawImage(
          img,
          0, 0, frameWidth, frameHeight,
          0, 0, frameWidth, frameHeight
        );
      } else {
        // Mirror if frameData.mirror is true, or if player is facing left and not in walkForward (back view)
        const shouldMirror = frameData.mirror || (player.facing < 0 && spriteState !== 'walkForward');
        if (shouldMirror) {
          ctx.translate(frameWidth, 0);
          ctx.scale(-1, 1);
          ctx.drawImage(
            img,
            frameData.frame * frameWidth, srcY, frameWidth, srcH,
            0, 0, frameWidth, frameHeight
          );
        } else {
          ctx.drawImage(
            img,
            frameData.frame * frameWidth, srcY, frameWidth, srcH,
            0, 0, frameWidth, frameHeight
          );
        }
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
      const muzzleY = player.crouching
        ? player.feetY - player.height + muzzleOffsetY
        : player.y + muzzleOffsetY;
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

    // Projectiles (player bullets and boss carpets)
    // Draw only player bullets beneath environment
    projectiles.forEach(p => { if (p.type === 'player') p.draw(ctx, DEBUG_HITBOXES); });
    // Enemies behind boss: only before boss fight begins
    if (!getBossTransition() && !getBossActive()) {
      if (getBlinkingOut()) {
        const elapsed = performance.now() - getBlinkingOutStartTime();
        const blink = Math.floor(elapsed / 80) % 2 === 0;
        ctx.save();
        ctx.globalAlpha = blink ? 0.2 + 0.8 * (1 - elapsed / BLINK_OUT_DURATION) : 0.1;
        drawCarpshits(ctx);
        drawLowerCarpshits(ctx);
        ctx.globalAlpha = 1.0;
        ctx.restore();
      } else {
        drawCarpshits(ctx);
        drawLowerCarpshits(ctx);
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
      // Draw carpshits in front of boss during battle
      if (getCarpshitsDuringBoss()) {
        drawCarpshits(ctx);
        drawLowerCarpshits(ctx);
      }
      // Draw boss carpets on top of boss
      projectiles.forEach(p => { if (p.type === 'boss') p.draw(ctx, DEBUG_HITBOXES); });
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
  if (shouldReturn) {
    if (shaking) ctx.restore();
    ctx.restore();
    return;
  }
  if (shaking) ctx.restore();
  ctx.restore();
} 