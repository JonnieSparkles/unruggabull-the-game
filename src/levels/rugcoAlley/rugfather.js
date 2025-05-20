import { setPlayerAutoRunLeft } from '../../state.js';
import { player } from '../../player.js';
import * as stateModule from '../../state.js';
import { bgMusic, evilLaughSfx, fireWindsSwoosh, helloUnruggabullSfx } from '../../sound.js';
import { carpshits, lowerCarpshits, NUM_CARPSHITS, NUM_LOWER_CARPSHITS } from '../../enemy.js';
import { setAutoRunLeft } from '../../state.js';
import { setBossBattleStarted, getBossBattleStarted } from '../../state.js';

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

const BOSS_WIDTH = 128;
const BOSS_HEIGHT = 128;

// Internal state
const state = {
  x: 0,
  y: 0,
  hp: 5,
  active: false,
  opacity: 1,
  entering: true,
  blinkStartTime: 0,
  blinkActualStartTime: 0,
  blinking: false,
  laughPlayed: false,
  walkingForward: false,
  bossInPosition: false,
  jumpDone: false,
  scale: 1.0,
  speedMultiplier: 1.0,
  dying: false,
  deathStart: 0,
  spinEndTime: 0,
  helloPlayed: false
};

const bossCenterX = () => canvas.width / 2 - BOSS_WIDTH / 2;
const bossFinalX = () => bossCenterX() + (canvas.width - BOSS_WIDTH * 1.2 - bossCenterX()) * 0.5;
const bossStartX = () => bossCenterX();

// Blink pattern and total duration
const blinkPattern = [600, 300, 900, 200, 1200, 150, 1500, 100, 1800]; // ms on/off
const blinkTotalDuration = blinkPattern.reduce((a, b) => a + b, 0);

// Spawn the boss at center-top of the screen
function spawn() {
  state.active = true;
  state.hp = 5;
  state.scale = 1.0;
  state.x = bossStartX();
  // Anchor head at a fixed Y so feet align at player.feetY when fully scaled
  const finalScale = 2.0;
  const headY = player.feetY - BOSS_HEIGHT * finalScale;
  state.y = headY;
  state.opacity = 1;  // fully visible during blink, then transparent afterward
  state.entering = true;
  state.blinking = false;
  state.blinkStartTime = performance.now() + 1000; // wait 1s before blinking
  state.blinkActualStartTime = 0;
  state.laughPlayed = false;
  state.walkingForward = false;
  state.bossInPosition = false;
  state.spinEndTime = 0;
  state.jumpDone = false;
  state.helloPlayed = false;
  // reset battle flag too
  setBossBattleStarted(false);
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
  const finalScale = 2.0;
  const initialScale = 1.0;
  // headY so that feet end at player's feetY
  const headY = player.feetY - BOSS_HEIGHT * finalScale;

  // 1. Initial wait before blink
  if (state.entering && !state.blinking) {
    if (now >= state.blinkStartTime) {
      state.blinking = true;
      state.entering = false;
      state.blinkActualStartTime = now;
    }
    return;
  }

  // 2. Blinking eyes
  if (state.blinking) {
    const t = now - state.blinkActualStartTime;
    // Play evil laugh during last ~3400ms of blink
    if (t >= blinkTotalDuration - 3400 && !state.laughPlayed) {
      evilLaughSfx.currentTime = 0;
      evilLaughSfx.play();
      state.laughPlayed = true;
    }
    // Determine blink on/off
    let total = 0;
    let on = true;
    for (let i = 0; i < blinkPattern.length; i++) {
      total += blinkPattern[i];
      if (t < total) {
        on = i % 2 === 0;
        break;
      }
    }
    state.opacity = on ? 1 : 0;
    // End blinking
    if (t >= blinkTotalDuration) {
      state.blinking = false;
      state.walkingForward = true;
      state.spinEndTime = now;
      stateModule.setBossTransitionStartTime(now);
      setAutoRunLeft(true);
      // start move sound
      fireWindsSwoosh.currentTime = 0;
      fireWindsSwoosh.play();
      // Resume background music only after blinking
      bgMusic.currentTime = 0;
      bgMusic.play();
    }
    return;
  }

  // 3. Spin/Scale & Move Out
  if (state.walkingForward) {
    const t2 = now - stateModule.getBossTransitionStartTime();
    const spinDuration = 3200;
    const totalTime = spinDuration * 2;
    const progress = Math.min(t2 / totalTime, 1);
    // scale and position
    state.scale = initialScale + (finalScale - initialScale) * progress;
    state.x = bossStartX() + (bossFinalX() - bossStartX()) * progress;
    state.y = headY;
    state.opacity = progress;
    if (progress >= 1) {
      state.scale = finalScale;
      state.walkingForward = false;
      state.bossInPosition = true;
      // Boss will be set active after hold in draw()
    }
    return;
  }

  // 4. Post-entrance hold: draw handles battle start
  if (state.bossInPosition && !stateModule.getBossBattleStarted()) {
    return; // draw() handles draw hold and battle flag
  }

  // 5. After battle starts: boss holds in place
  if (stateModule.getBossBattleStarted()) {
    // boss holds in place
    return;
  }

  // Idle/battle movement (if needed later)
  const t3 = now / (500 / state.speedMultiplier);
  state.x = canvas.width / 2 - (BOSS_WIDTH * state.scale) / 2 + Math.sin(t3) * 100;
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
  // Guard: only draw if position and scale are valid and image is loaded
  if (!isFinite(state.x) || !isFinite(state.y) || !isFinite(state.scale) || !bossSpriteSheet.complete || bossSpriteSheet.naturalWidth === 0) {
    return;
  }
  // Before blinking starts, don't draw the boss at all
  if (state.entering) return;
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
  } else if (state.walkingForward) {
    // Spin/twirl frames 2-6 then reverse (mirror) for cinematic spin
    const spinFrames = [2,3,4,5,6,6,5,4,3,2];
    const spinCount = spinFrames.length;
    const spinDuration = 3200; // ms per rotation
    const totalRotations = 2;
    const t = performance.now() - stateModule.getBossTransitionStartTime();
    // progress over totalRotations
    const totalTime = spinDuration * totalRotations;
    const progress = Math.min(t / totalTime, 1);
    // Which frame in current spin
    let frameIdx = Math.floor((t / spinDuration) * spinCount) % spinCount;
    if (progress >= 1) frameIdx = spinCount - 1;
    const frameNumber = spinFrames[frameIdx];
    ctx.drawImage(
      bossSpriteSheet,
      frameNumber * FRAME_W, 0, FRAME_W, FRAME_H,
      state.x, state.y, FRAME_W * state.scale, FRAME_H * state.scale
    );
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
        y: canvas.height * 0.6 + Math.random() * ((canvas.height - 20 - 48) - canvas.height * 0.6),
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
const rugfatherBoss = { spawn, update, draw, hit, getHitbox };
export default rugfatherBoss;

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