import { player } from '../../player.js';
import * as stateModule from '../../state.js';
import { bgMusic, evilLaughSfx, fireWindsSwoosh, helloUnruggabullSfx } from '../../sound.js';
import { setAutoRunLeft, setBossBattleStarted, getBossBattleStarted } from '../../state.js';
import { RUGFATHER_SPRITES } from './rugfatherSprites.js';
import {
  BOSS_HOLD_DURATION,
  BLINK_OUT_DURATION,
  MAX_HP,
  NUM_PHASES,
  PHASE_ATTACK_COOLDOWNS,
  PHASE1_MOVE_AMPLITUDE,
  PHASE1_MOVE_PERIOD,
  PHASE1_JUMP_HEIGHT,
  PHASE1_JUMP_PERIOD,
  BLINK_PATTERN,
  BLINK_TOTAL_DURATION
} from './rugfatherConstants.js';
import { GAME_STATES } from '../../constants/gameStates.js';
import { updateBossAI, updatePhaseLogic, updatePhase1Movement } from './rugfatherAI.js';
import { setScreenShake, setScreenShakeStartTime, setCurrentBoss, setBossActive, setGameState, setCongratsStartTime } from '../../state.js';

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

// Internal state
const state = {
  x: 0,
  y: 0,
  baseY: null,          // for vertical movement in phase 1
  hasCapturedBaseY: false,
  baseX: null,          // for horizontal movement in phase 1
  hasCapturedBaseX: false,
  hp: MAX_HP,
  phase: NUM_PHASES,
  active: false,
  opacity: 1,
  scale: 0.5,
  speedMultiplier: 1.0,
  dying: false,
  deathStart: 0,
  sprite: 'idle',
  lastAttackTime: 0,
  attackCooldown: PHASE_ATTACK_COOLDOWNS[NUM_PHASES],
  attackAnimationStartTime: null,
  hasSpawnedProjectile: false
};

const bossCenterX = () => canvas.width / 2 - BOSS_WIDTH / 2;
const bossFinalX = () => bossCenterX() + (canvas.width - BOSS_WIDTH * 1.2 - bossCenterX()) * 0.5;
const bossStartX = () => bossCenterX();

// Spawn the boss at center-top of the screen
function spawn() {
  state.active = true;
  state.hp = MAX_HP;
  state.phase = NUM_PHASES;
  state.scale = 0.5;
  state.x = bossStartX();
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
  // Reset baseY capture for phase 1 movement
  state.baseY = null;
  state.hasCapturedBaseY = false;
  state.baseX = null;
  state.hasCapturedBaseX = false;
}

// Basic oscillation movement
function update() {
  if (state.dying) return;
  if (!state.active) return;
  const now = performance.now();

  updateBossAI(now, state);
  // Phase 1 movement
  updatePhase1Movement(now, state);
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
  // Intro rendering: respect orchestrator-driven sprite states
  if (state.entering) {
    const spriteState = state.sprite || 'idle';
    let spriteInfo = RUGFATHER_SPRITES[spriteState];
    if (!spriteInfo) {
      console.warn(`Unknown boss sprite state: "${spriteState}"; defaulting to idle.`);
      spriteInfo = RUGFATHER_SPRITES.idle;
    }
    const t = performance.now();
    let frameData;
    if (spriteInfo.frameSequence) {
      frameData = spriteInfo.frameSequence[Math.floor(t / spriteInfo.frameDuration) % spriteInfo.frameSequence.length];
      if (typeof frameData === 'number') frameData = { frame: frameData, mirror: false };
    } else {
      frameData = { frame: spriteInfo.frame || 0, mirror: false };
    }
    const fw = spriteInfo.frameWidth;
    const fh = spriteInfo.frameHeight;
    ctx.save();
    ctx.globalAlpha = state.opacity;
    if (frameData.mirror) {
      ctx.translate(state.x + fw * state.scale, state.y);
      ctx.scale(-1, 1);
      ctx.drawImage(
        spriteInfo.image,
        frameData.frame * fw, 0, fw, fh,
        0, 0, fw * state.scale, fh * state.scale
      );
    } else {
      ctx.drawImage(
        spriteInfo.image,
        frameData.frame * fw, 0, fw, fh,
        state.x, state.y, fw * state.scale, fh * state.scale
      );
    }
    ctx.restore();
    return;
  }
  ctx.save();
  ctx.globalAlpha = state.opacity;

  // Determine which sprite frame to draw
  const spriteState = state.sprite || 'idle';
  let spriteInfo = RUGFATHER_SPRITES[spriteState] || RUGFATHER_SPRITES.idle;
  const fw = spriteInfo.frameWidth;
  const fh = spriteInfo.frameHeight;
  if (spriteInfo.animated && spriteInfo.frameSequence) {
    const t = performance.now();
    const frameSequence = spriteInfo.frameSequence;
    const frameDuration = spriteInfo.frameDuration;
    const frameIdx = Math.floor(t / frameDuration) % frameSequence.length;
    let frameData = frameSequence[frameIdx];
    if (typeof frameData === 'number') frameData = { frame: frameData, mirror: false };
    ctx.save();
    ctx.globalAlpha = state.opacity;
    if (frameData.mirror) {
      ctx.translate(state.x + fw * state.scale, state.y);
      ctx.scale(-1, 1);
      ctx.drawImage(
        spriteInfo.image,
        frameData.frame * fw, 0, fw, fh,
        0, 0, fw * state.scale, fh * state.scale
      );
    } else {
      ctx.drawImage(
        spriteInfo.image,
        frameData.frame * fw, 0, fw, fh,
        state.x, state.y, fw * state.scale, fh * state.scale
      );
    }
    ctx.globalAlpha = 1.0;
    ctx.restore();
    ctx.globalAlpha = 1.0;
    ctx.restore();
    // Health bar
    const barWidth = 200;
    const hpRatio = Math.max(0, state.hp) / 5;
    ctx.fillStyle = 'red';
    ctx.fillRect(canvas.width / 2 - barWidth / 2, 20, barWidth * hpRatio, 10);
    ctx.strokeStyle = 'white';
    ctx.strokeRect(canvas.width / 2 - barWidth / 2, 20, barWidth, 10);
    return;
  }
  // Static frame (idle, etc.)
  ctx.drawImage(
    spriteInfo.image,
    (spriteInfo.frame || 0) * fw, 0, fw, fh,
    state.x, state.y, fw * state.scale, fh * state.scale
  );
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
  updatePhaseLogic(state);
  if (state.hp < 0) state.hp = 0;
  // Shake the screen
  stateModule.setScreenShake(true);
  stateModule.setScreenShakeStartTime(performance.now());
  // Speed up music and boss
  state.speedMultiplier += 0.5;
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

// Add public methods for orchestrator-driven visual control
function setSprite(name) {
  state.sprite = name;
}
function setPosition(x, y) {
  state.x = x;
  state.y = y;
}
function setOpacity(alpha) {
  state.opacity = alpha;
}
function setScale(scale) {
  state.scale = scale;
}

// Export boss interface (spawn, update, draw, hit, getHitbox, setSprite, setPosition, setOpacity, setScale)
const rugfatherBoss = {
  spawn,
  update,
  draw,
  hit,
  getHitbox,
  setSprite,
  setPosition,
  setOpacity,
  setScale
};
export default rugfatherBoss;

// Internal state export for orchestrator tweening (DO NOT use externally)
export const __bossState = state;

// Helper for bullet collision: checks if a player bullet hit the boss
export function checkBossBulletCollision(bullet) {
  if (!state.active) return false;
  const hitbox = getHitbox();
  return (
    bullet.x > hitbox.x && bullet.x < hitbox.x + hitbox.width &&
    bullet.y > hitbox.y && bullet.y < hitbox.y + hitbox.height
  );
}

// NOTE: Internal boss state is encapsulated; avoid direct access.
// (getBossInPosition removed) 