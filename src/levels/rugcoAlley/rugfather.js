import { setPlayerAutoRunLeft } from '../../state.js';
import { player } from '../../player.js';
import * as stateModule from '../../state.js';
import { bgMusic, evilLaughSfx, fireWindsSwoosh, helloUnruggabullSfx } from '../../sound.js';
import { carpshits, lowerCarpshits, NUM_CARPSHITS, NUM_LOWER_CARPSHITS } from '../../enemies/carpshits.js';
import { setAutoRunLeft } from '../../state.js';
import { setBossBattleStarted, getBossBattleStarted } from '../../state.js';
import { startBossIntro, updateBossIntro } from './rugfatherOrchestrator.js';
import { RUGFATHER_SPRITES } from './rugfatherSprites.js';
import levels from '../../levels/index.js';
import { getCurrentLevelKey } from '../../state.js';
import { FLASH_DURATION } from '../../constants/timing.js';
import { BOSS_HOLD_DURATION, BLINK_OUT_DURATION } from './rugfatherConstants.js';
import { GAME_STATES } from '../../constants/gameStates.js';
import { PLAYER_WIDTH, PLAYER_HEIGHT } from '../../constants/player.js';
import { updateBossAI } from './rugfatherAI.js';
import { setScreenShake, setScreenShakeStartTime, setCarpshitsDuringBoss, setCurrentBoss, setBossActive, setGameState, setCongratsStartTime } from '../../state.js';

// Level 1 Boss: Rugfather
// Access the canvas and context
document; // ensure module scope
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Boss sprite sheet setup (16 frames, 128x128 each)
const bossSpriteSheet = new Image();
bossSpriteSheet.src = 'assets/sprites/levels/rugcoAlley/rugfather-sprite.png';
const bossDeadSprite = new Image();
bossDeadSprite.src = 'assets/sprites/levels/rugcoAlley/rugfather-dead.png';

const BOSS_WIDTH = 256;
const BOSS_HEIGHT = 256;

// Export sprite dimensions for external positioning
export { BOSS_WIDTH, BOSS_HEIGHT };

// Maximum HP for phase calculations
const MAX_HP = 5;
// Phase configurations: attack cooldown in ms per phase
const PHASE_ATTACK_COOLDOWNS = {
  5: 3000, // 100%
  4: 2500, // 80%
  3: 2000, // 60%
  2: 1500, // 40%
  1: 1000  // 20%
};

// Internal state
const state = {
  x: 0,
  y: 0,
  hp: MAX_HP,
  phase: 5,
  active: false,
  opacity: 1,
  entering: true,
  blinkStartTime: 0,
  blinkActualStartTime: 0,
  blinking: false,
  laughPlayed: false,
  bossInPosition: false,
  jumpDone: false,
  scale: 0.5,
  speedMultiplier: 1.0,
  dying: false,
  deathStart: 0,
  spinEndTime: 0,
  helloPlayed: false,
  fadeInStartTime: null,
  fadeInDuration: 0,
  sprite: 'idle',
  lastAttackTime: 0,
  attackCooldown: PHASE_ATTACK_COOLDOWNS[5],
  attackAnimationStartTime: null,
  hasSpawnedProjectile: false
};

const bossCenterX = () => canvas.width / 2 - BOSS_WIDTH / 2;
const bossFinalX = () => bossCenterX() + (canvas.width - BOSS_WIDTH * 1.2 - bossCenterX()) * 0.5;
const bossStartX = () => bossCenterX();

// Blink pattern and total duration
const blinkPattern = [600, 300, 900, 200, 1200, 150, 1500, 100, 1800]; // ms on/off
const blinkTotalDuration = blinkPattern.reduce((a, b) => a + b, 0);

/**
 * Recalculate boss phase based on current HP and adjust parameters.
 */
function updatePhase() {
  const ratio = state.hp / MAX_HP;
  const newPhase = Math.ceil(ratio * MAX_HP);
  if (newPhase !== state.phase) {
    state.phase = newPhase;
    // Adjust attack cooldown for this phase
    const cd = PHASE_ATTACK_COOLDOWNS[newPhase] || state.attackCooldown;
    state.attackCooldown = cd;
    console.log(`Rugfather phase changed to ${newPhase}, attackCooldown=${cd}`);
  }
}

// Spawn the boss at center-top of the screen
function spawn() {
  state.active = true;
  state.hp = MAX_HP;
  state.phase = MAX_HP;
  state.scale = 0.5;
  state.x = bossStartX();
  // Anchor head at a fixed Y so feet align at player.feetY when fully scaled
  const finalScale = 1.0;
  const headY = player.feetY - BOSS_HEIGHT * finalScale;
  state.y = headY;
  state.opacity = 1;  // fully visible during blink, then transparent afterward
  state.entering = true;
  state.blinking = false;
  state.laughPlayed = false;
  state.bossInPosition = false;
  state.spinEndTime = 0;
  state.jumpDone = false;
  state.helloPlayed = false;
  state.lastAttackTime = performance.now();
  state.attackAnimationStartTime = null;
  state.hasSpawnedProjectile = false;
  // reset battle flag too
  setBossBattleStarted(false);
  // start the intro sequence
  startBossIntro();
}

// Basic oscillation movement
function update() {
  if (state.dying) {
    // During dying, hold full opacity and static position until pause ends
    const elapsed = performance.now() - state.deathStart;
    if (elapsed < 1200) {
      state.opacity = 1;  // keep full brightness
    } else {
      state.dying = false;
      // Record exit boss position & scale for static corpse
      stateModule.setExitBossX(state.x);
      stateModule.setExitBossY(state.y);
      stateModule.setExitBossScale(state.scale);
      // Remove boss from active state
      stateModule.setBossActive(false);
      stateModule.setCarpshitsDuringBoss(false);
      stateModule.setCurrentBoss(null);
      // Immediately begin exit sequence with dramatic pause
      stateModule.setGameState('bossExit');
      stateModule.setExitPause(true);
      stateModule.setExitPauseStartTime(performance.now());
    }
    return;
  }
  if (!state.active) return;
  const now = performance.now();

  // handle fade-in transition
  if (state.fadeInStartTime != null) {
    const t = now - state.fadeInStartTime;
    state.opacity = Math.min(1, t / state.fadeInDuration);
    if (t >= state.fadeInDuration) {
      state.fadeInStartTime = null;
    }
  }

  if (state.entering) {
    updateBossIntro(now);
    return;
  }

  // Post-intro and battle logic are now fully controlled by timeline and combat handlers.
  updateBossAI(now);
}

// Draw the boss and its HP bar
function draw() {
  if (state.dying) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, state.opacity);
    ctx.drawImage(
      bossDeadSprite,
      state.x,
      state.y,
      BOSS_WIDTH * state.scale,
      BOSS_HEIGHT * state.scale
    );
    ctx.globalAlpha = 1.0;
    ctx.restore();
    // Health bar not shown when dying
    return;
  }
  if (!state.active) return;
  if (!isFinite(state.x) || !isFinite(state.y) || !isFinite(state.scale) || !bossSpriteSheet.complete || bossSpriteSheet.naturalWidth === 0) {
    return;
  }
  if (state.entering) {
    // Timeline-driven boss sprite override during intro
    const spriteState = state.sprite || 'idle';
    let spriteInfo = RUGFATHER_SPRITES[spriteState];
    if (!spriteInfo) {
      console.warn(`Unknown boss sprite state: "${spriteState}"; defaulting to idle.`);
      spriteInfo = RUGFATHER_SPRITES['idle'];
    }
    const t = performance.now();
    let frameData;
    if (spriteInfo.frameSequence) {
      frameData = spriteInfo.frameSequence[Math.floor(t / spriteInfo.frameDuration) % spriteInfo.frameSequence.length];
      // If frameData is a number, convert to object for uniformity
      if (typeof frameData === 'number') {
        frameData = { frame: frameData, mirror: false };
      }
    } else if (spriteInfo.animated) {
      frameData = { frame: Math.floor(t / spriteInfo.frameDuration) % spriteInfo.frameCount, mirror: false };
    } else {
      frameData = { frame: spriteInfo.frame, mirror: false };
    }
    const FRAME_W = BOSS_WIDTH;
    const FRAME_H = BOSS_HEIGHT;
    ctx.save();
    ctx.globalAlpha = state.opacity;
    if (frameData.mirror) {
      ctx.translate(state.x + FRAME_W * state.scale, state.y);
      ctx.scale(-1, 1);
      ctx.drawImage(
        spriteInfo.image,
        frameData.frame * FRAME_W, 0, FRAME_W, FRAME_H,
        0, 0, FRAME_W * state.scale, FRAME_H * state.scale
      );
    } else {
      ctx.drawImage(
        spriteInfo.image,
        frameData.frame * FRAME_W, 0, FRAME_W, FRAME_H,
        state.x, state.y, FRAME_W * state.scale, FRAME_H * state.scale
      );
    }
    ctx.globalAlpha = 1.0;
    ctx.restore();
    return;
  }
  ctx.save();
  ctx.globalAlpha = state.opacity;

  // Determine which sprite frame to draw
  const FRAME_W = BOSS_WIDTH;
  const FRAME_H = BOSS_HEIGHT;
  if (state.blinking) {
    // Dramatic eye blink: longer, slower, and more random
    let t = performance.now() - state.blinkActualStartTime;
    let total = 0;
    let on = true;
    for (let i = 0; i < blinkPattern.length; i++) {
      total += blinkPattern[i];
      if (t < total) {
        on = i % 2 === 0;
        break;
      }
    }
    if (on) {
      // Show frame index 0 (eyes open)
      ctx.drawImage(
        bossSpriteSheet,
        0, 0, FRAME_W, FRAME_H,
        state.x, state.y, FRAME_W * state.scale, FRAME_H * state.scale
      );
    }
    ctx.globalAlpha = 1.0;
    ctx.restore();
    return;
  } else if (state.sprite === 'spin') {
    // Use the sprite map for spin animation with mirroring support
    const spriteInfo = RUGFATHER_SPRITES['spin'];
    const t = performance.now();
    const frameSequence = spriteInfo.frameSequence;
    const frameDuration = spriteInfo.frameDuration;
    const frameIdx = Math.floor(t / frameDuration) % frameSequence.length;
    const frameData = frameSequence[frameIdx];
    ctx.save();
    ctx.globalAlpha = state.opacity;
    if (frameData.mirror) {
      ctx.translate(state.x + FRAME_W * state.scale, state.y);
      ctx.scale(-1, 1);
      ctx.drawImage(
        spriteInfo.image,
        frameData.frame * FRAME_W, 0, FRAME_W, FRAME_H,
        0, 0, FRAME_W * state.scale, FRAME_H * state.scale
      );
    } else {
      ctx.drawImage(
        spriteInfo.image,
        frameData.frame * FRAME_W, 0, FRAME_W, FRAME_H,
        state.x, state.y, FRAME_W * state.scale, FRAME_H * state.scale
      );
    }
    ctx.globalAlpha = 1.0;
    ctx.restore();
    return;
  } else if (state.sprite === 'attack') {
    // Draw attack animation
    const spriteInfo = RUGFATHER_SPRITES.attack;
    const elapsed = performance.now() - (state.attackAnimationStartTime || performance.now());
    const idx = Math.floor(elapsed / spriteInfo.frameDuration) % spriteInfo.frameSequence.length;
    let frameData = spriteInfo.frameSequence[idx];
    if (typeof frameData === 'number') frameData = { frame: frameData, mirror: false };
    ctx.save();
    ctx.globalAlpha = state.opacity;
    if (frameData.mirror) {
      ctx.translate(state.x + FRAME_W * state.scale, state.y);
      ctx.scale(-1, 1);
      ctx.drawImage(
        spriteInfo.image,
        frameData.frame * FRAME_W, 0, FRAME_W, FRAME_H,
        0, 0, FRAME_W * state.scale, FRAME_H * state.scale
      );
    } else {
      ctx.drawImage(
        spriteInfo.image,
        frameData.frame * FRAME_W, 0, FRAME_W, FRAME_H,
        state.x, state.y, FRAME_W * state.scale, FRAME_H * state.scale
      );
    }
    ctx.globalAlpha = 1.0;
    ctx.restore();
    return;
  } else {
    // After spin/scale and before battle, hold frame 9 then frame 10
    if (state.bossInPosition && !getBossBattleStarted()) {
      const now = performance.now();
      const holdDuration = 3000;
      const frameIndex = now < state.spinEndTime + holdDuration ? 9 : 7; // after hold, start battle on frame 7
      ctx.save();
      ctx.globalAlpha = state.opacity;
      ctx.drawImage(
        bossSpriteSheet,
        frameIndex * FRAME_W, 0, FRAME_W, FRAME_H,
        state.x, state.y, FRAME_W * state.scale, FRAME_H * state.scale
      );
      ctx.globalAlpha = 1.0;
      ctx.restore();
      // After holding the second frame, start battle
      if (now >= state.spinEndTime + holdDuration) {
        // Play hello-unruggabull.mp3 once
        if (!state.helloPlayed) {
          helloUnruggabullSfx.currentTime = 0;
          helloUnruggabullSfx.play();
          state.helloPlayed = true;
        }
        // Position boss and player for battle
        // Boss at 25% from right
        state.x = Math.round(canvas.width * 0.75 - (BOSS_WIDTH * state.scale) / 2);
        // Player at 25% from left
        player.x = Math.round(canvas.width * 0.25 - player.width / 2);
        player.facing = 1;
        stateModule.setBossActive(true);
        setBossBattleStarted(true);
      }
      return;
    }
    // Battle-ready: frame 8 (then 7 if needed)
    const readyFrame = 8;
    // Boss start battle on frame 7
    const battleFrame = 7;
    ctx.drawImage(
      bossSpriteSheet,
      battleFrame * FRAME_W, 0, FRAME_W, FRAME_H,
      state.x, state.y, FRAME_W * state.scale, FRAME_H * state.scale
    );
  }
  ctx.globalAlpha = 1.0;
  ctx.restore();
  // Health bar
  const barWidth = 200;
  const hpRatio = Math.max(0, state.hp) / 5;
  ctx.fillStyle = 'red';
  ctx.fillRect(canvas.width / 2 - barWidth / 2, 20, barWidth * hpRatio, 10);
  ctx.strokeStyle = 'white';
  ctx.strokeRect(canvas.width / 2 - barWidth / 2, 20, barWidth, 10);
}

// Apply damage to the boss
function hit(damage = 1) {
  if (!state.active) return;
  state.hp -= damage;
  // Update phase based on new HP
  updatePhase();
  if (state.hp < 0) state.hp = 0;
  // Shake the screen
  stateModule.setScreenShake(true);
  stateModule.setScreenShakeStartTime(performance.now());
  // Speed up music and boss
  state.speedMultiplier += 0.5;
  if (state.hp === 3) {
    // Respawn carpshits and lowerCarpshits
    carpshits.length = 0;
    lowerCarpshits.length = 0;
    const levelConfig = levels[getCurrentLevelKey()];
    for (let i = 0; i < NUM_CARPSHITS; i++) {
      carpshits.push({
        x: canvas.width + 48 + Math.random() * 200,
        y: canvas.height * 0.1 + Math.random() * (canvas.height * 0.6 - canvas.height * 0.1),
        vx: -(1.5 + Math.random()),
        alive: true,
        frame: 0,
        frameTimer: 0,
        falling: false,
        vy: 0,
        onFloor: false,
        respawnTimer: 0
      });
    }
    for (let i = 0; i < NUM_LOWER_CARPSHITS; i++) {
      lowerCarpshits.push({
        x: canvas.width + 48 + Math.random() * 200,
        y: canvas.height * 0.6 + Math.random() * ((levelConfig.floorY - 48) - canvas.height * 0.6),
        vx: -(1 + Math.random()),
        alive: true,
        frame: 0,
        frameTimer: 0,
        falling: false,
        vy: 0,
        onFloor: false,
        respawnTimer: 0
      });
    }
    stateModule.setCarpshitsDuringBoss(true);
  }
  if (state.hp > 0) {
    bgMusic.playbackRate = Math.min(2.0, Math.max(0.5, 1 + (5 - state.hp) * 0.2));
  }
  // Win on last hit
  if (state.hp <= 0) {
    state.active = false;
    state.dying = true;
    state.deathStart = performance.now();
    // Reset music speed
    bgMusic.playbackRate = 1.0;
    // Removal of boss and carpshitsDuringBoss will happen after death animation
  }
}

// Get boss hitbox (for collision)
function getHitbox() {
  return {
    x: state.x,
    y: state.y,
    width: BOSS_WIDTH * state.scale,
    height: BOSS_HEIGHT * state.scale
  };
}

// Export boss interface
const rugfatherBoss = { spawn, update, draw, hit, getHitbox, phase: () => state.phase };
export default rugfatherBoss;

// Expose internal boss state for orchestrator
export const bossState = state;

// Helper for bullet collision
export function checkBossBulletCollision(bullet) {
  if (!state.active) return false;
  const hitbox = getHitbox();
  return (
    bullet.x > hitbox.x && bullet.x < hitbox.x + hitbox.width &&
    bullet.y > hitbox.y && bullet.y < hitbox.y + hitbox.height
  );
}

export function getBossInPosition() { return state.bossInPosition; } 