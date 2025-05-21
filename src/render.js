// Render module: draw everything to the canvas
import * as state from './state.js';
import levels from './levels/index.js';
import { getCurrentLevelKey } from './state.js';
import { showControlsScreen, drawHealth, drawKillCounter, drawDifficulty, drawGameOver, drawCongrats, drawRestartButton } from './ui.js';
import { drawPlatforms, platforms } from './physics.js';
import { walkingSprite, crouchSprite, deadSprite, jumpingSprite, shockedSprite, walkingForwardSprite, bossDeadImage } from './assets.js';
import { drawCarpshits, drawLowerCarpshits, carpshits, lowerCarpshits } from './enemies/carpshits.js';
import { showDevSettings, showDifficulty, DEBUG_HITBOXES, drawDevSettings } from './devtools.js';
import { getHitbox } from './player.js';
import { getCarpshitHitbox } from './enemies/carpshits.js';
import { getBossHold, getBossPause, getBossTransition, getBossActive, getCurrentBoss, getScreenShake, getScreenShakeStartTime, SCREEN_SHAKE_DURATION, getBlinkingOut, getBlinkingOutStartTime, getCarpshitsDuringBoss } from './state.js';
import { BLINK_OUT_DURATION } from './levels/rugcoAlley/rugfatherConstants.js';
import { bgSprite, FIRST_FLICKER_FRAMES, TRANSITION_FRAMES } from './levels/rugcoAlley/background.js';
import { PLAYER_SPRITES } from './playerSprites.js';
import { PLAYER_WIDTH, PLAYER_HEIGHT } from './constants/player.js';
import { drawProjectiles } from './projectiles/index.js';

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
    levelConfig.background(ctx, canvas);
  if (state.getGameState() === 'bossExit' || state.getGameState() === 'bossExitDoorClosing') {
      ctx.save();
    ctx.font = 'bold 72px Arial';
    ctx.fillStyle = '#0f0';
    ctx.textAlign = 'center';
    ctx.fillText('VICTORY!', canvas.width / 2, canvas.height / 2);
      ctx.restore();
    if (shaking) ctx.restore();
    // TODO: move full exit/defeat sequence logic into rugfatherDefeatScene.js using rugfatherDefeatTimeline
    return;
  }

  // Flash overlay
  if (state.flashActive) {
    const now = performance.now();
    if (now < state.flashEndTime) {
      ctx.save();
      const alpha = 0.8 * ((state.flashEndTime - now) / state.FLASH_DURATION);
      const color = state.flashColor || 'rgba(255,255,255,0.8)';
      ctx.fillStyle = color;
      ctx.globalAlpha = 1.0;
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
      // Player hit flash: brighten sprite for a brief moment
      if (state.playerHitFlashActive) {
        ctx.globalAlpha = 1.0;
        ctx.globalCompositeOperation = 'lighter';
        if (performance.now() > state.playerHitFlashEndTime) {
          state.setPlayerHitFlashActive(false);
        }
      }
      // Special case: dead sprite is always unmirrored and uses full width
      if (spriteState === 'dead') {
        ctx.drawImage(
          img,
          0, 0, frameWidth, frameHeight,
          player.x, destY, frameWidth, frameHeight
        );
      } else {
        // Mirror if frameData.mirror is true, or if player is facing left and not in walkForward (back view)
        const shouldMirror = frameData.mirror || (player.facing < 0 && spriteState !== 'walkForward');
        if (shouldMirror) {
          ctx.translate(player.x + frameWidth, destY);
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
            player.x, destY, frameWidth, frameHeight
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
    drawProjectiles(ctx, DEBUG_HITBOXES);
    // Enemies only when not in boss transition or boss fight, or if carpshitsDuringBoss is true
    if (!getBossTransition() && !getBossActive() || getCarpshitsDuringBoss()) {
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