import { player } from '../../player.js';
import * as stateModule from '../../state.js';
import { challengeMeSfx } from '../../sound.js';
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
import { updateBossAI, updatePhaseLogic } from './rugfatherAI.js';
import levels from '../index.js';
import { getCurrentLevelKey } from '../../state.js';

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
  hasSpawnedProjectile: false,
  entering: true,
  blinking: false,
  laughPlayed: false,
  bossInPosition: false,
  spinEndTime: 0,
  jumpDone: false,
  helloPlayed: false,
  facing: -1, // Boss initially faces left
  invulnerable: false, // Add invulnerability flag
  invulnFadeIn: false,
  invulnFadeInStart: 0,
  hitFlashEnd: 0, // For hit flash effect
  hitJitterX: 0,  // For jitter/knockback effect
  hitJitterY: 0   // For vertical jitter/knockback effect
};

const bossCenterX = () => canvas.width / 2 - BOSS_WIDTH / 2;
const bossFinalX = () => bossCenterX() + (canvas.width - BOSS_WIDTH * 1.2 - bossCenterX()) * 0.5;
const bossStartX = () => bossCenterX();

// Spawn the boss at center-top of the screen
function spawn() {
  state.active = true;
  state.hp = MAX_HP;
  // Set initial phase based on full HP (phase 1 = easiest)
  state.phase = 1;
  // Set attack cooldown for phase 1
  state.attackCooldown = PHASE_ATTACK_COOLDOWNS[state.phase];
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
  state.facing = -1;
  state.lastAttackTime = performance.now();
  state.attackAnimationStartTime = null;
  state.hasSpawnedProjectile = false;
  // reset battle flag too
  stateModule.setBossBattleStarted(false);
  // start the intro sequence
  // Reset baseY capture for phase 1 movement
  state.baseY = null;
  state.hasCapturedBaseY = false;
  state.baseX = null;
  state.hasCapturedBaseX = false;
  state.invulnerable = false; // Reset invulnerability on spawn
}

// Basic oscillation movement
function update() {
  if (state.dying) return;
  if (!state.active) return;
  const now = performance.now();
  updateBossAI(now, state);
  // Decay jitter/knockback if active (but do not add to state.x/y here)
  if (state.hitJitterX) {
    state.hitJitterX *= 0.8;
    if (state.hitJitterX < 0.5) state.hitJitterX = 0;
  }
  if (state.hitJitterY) {
    state.hitJitterY *= 0.8;
    if (state.hitJitterY < 0.5) state.hitJitterY = 0;
  }
  // Phase 1 (easy): horizontal sway only
  if (state.phase === 1) {
    if (!state.hasCapturedBaseX) {
      state.baseX = state.x;
      state.hasCapturedBaseX = true;
    }
    const offsetX = PHASE1_MOVE_AMPLITUDE * Math.sin((now / PHASE1_MOVE_PERIOD) * 2 * Math.PI);
    state.x = state.baseX + offsetX;
  }
  // Phase 2 (medium): horizontal sway + vertical bob
  else if (state.phase === 2) {
    if (!state.hasCapturedBaseX) {
      state.baseX = state.x;
      state.hasCapturedBaseX = true;
    }
    if (!state.hasCapturedBaseY) {
      state.baseY = state.y;
      state.hasCapturedBaseY = true;
    }
    const offsetX = PHASE1_MOVE_AMPLITUDE * Math.sin((now / PHASE1_MOVE_PERIOD) * 2 * Math.PI);
    const offsetY = Math.abs(Math.sin((now / PHASE1_JUMP_PERIOD) * 2 * Math.PI)) * PHASE1_JUMP_HEIGHT;
    state.x = state.baseX + offsetX;
    state.y = state.baseY - offsetY;
  }
  // Phase 3 (hard): spin-switch then same bob after landing
  else if (state.phase === 3) {
    // Before landing, position controlled by spinSwitchBehavior in AI
    if (!state.spinSwitchDone) {
      return;
    }
    // After spin-switch, horizontal sway + bob
    if (!state.hasCapturedBaseX) {
      state.baseX = state.x;
      state.hasCapturedBaseX = true;
    }
    if (!state.hasCapturedBaseY) {
      state.baseY = state.y;
      state.hasCapturedBaseY = true;
    }
    const offsetX = PHASE1_MOVE_AMPLITUDE * Math.sin((now / PHASE1_MOVE_PERIOD) * 2 * Math.PI);
    const offsetY = Math.abs(Math.sin((now / PHASE1_JUMP_PERIOD) * 2 * Math.PI)) * PHASE1_JUMP_HEIGHT;
    state.x = state.baseX + offsetX;
    state.y = state.baseY - offsetY;
  }
}

// Draw the boss and its HP bar
function draw() {
  if (state.dying) {
    const spriteInfo = RUGFATHER_SPRITES.dead;
    const now = performance.now();
    const elapsed = now - state.deathStart;
    const sequence = spriteInfo.frameSequence;
    const frameDuration = spriteInfo.frameDuration;
    const holdTime = 2500;
    const animTime = holdTime + sequence.length * frameDuration;
    let frameNum;
    if (elapsed < holdTime) {
      // Hold first frame
      frameNum = sequence[0];
    } else if (elapsed < animTime) {
      // Play through sequence
      const idx = Math.floor((elapsed - holdTime) / frameDuration);
      frameNum = sequence[Math.min(idx, sequence.length - 1)];
    } else {
      // Flicker between last two frames after animation
      const flickerInterval = 500;
      const t = Math.floor((elapsed - animTime) / flickerInterval) % 2;
      const last = sequence.length - 1;
      const prev = Math.max(0, last - 1);
      frameNum = t === 0 ? sequence[last] : sequence[prev];
    }
    const fw = spriteInfo.frameWidth;
    const fh = spriteInfo.frameHeight;
    ctx.save();
    ctx.globalAlpha = Math.max(0, state.opacity);
    ctx.drawImage(
      spriteInfo.image,
      frameNum * fw, 0, fw, fh,
      state.x, state.y,
      fw * state.scale, fh * state.scale
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
  // Draw shadow ellipse if boss is near the ground
  const levelConfig = levels[getCurrentLevelKey()];
  const bossFeetY = state.y + BOSS_HEIGHT * state.scale;
  if (Math.abs(bossFeetY - levelConfig.floorY) < 10) {
    ctx.save();
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.beginPath();
    ctx.ellipse(
      state.x + (BOSS_WIDTH * state.scale) / 2,
      levelConfig.floorY - 5,
      (BOSS_WIDTH * state.scale) / 2.5,
      16,
      0,
      0,
      2 * Math.PI
    );
    ctx.fill();
    ctx.restore();
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
  // Hit flash effect: brighten/contrast if recently hit
  let filterApplied = false;
  if (state.hitFlashEnd && performance.now() < state.hitFlashEnd) {
    ctx.filter = 'brightness(1.5) contrast(1.0)';
    filterApplied = true;
  }
  // Flicker effect when invulnerable
  let drawAlpha = state.opacity;
  if (state.invulnerable) {
    // Flicker: alternate visible/invisible every 80ms
    const flickerSpeed = 80; // ms
    const now = performance.now();
    drawAlpha = (Math.floor(now / flickerSpeed) % 2 === 0) ? 0.25 : 1.0;
  } else if (state.invulnFadeIn) {
    // Fade in: animate opacity from 0 to 1 over 400ms
    const fadeDuration = 400;
    const now = performance.now();
    const t = Math.min(1, (now - state.invulnFadeInStart) / fadeDuration);
    drawAlpha = t;
    if (t >= 1) {
      state.invulnFadeIn = false;
      drawAlpha = 1.0;
    }
  }
  // Calculate jitter offset for this frame
  const jitterX = state.hitJitterX ? (Math.random() - 0.5) * state.hitJitterX : 0;
  const jitterY = state.hitJitterY ? (Math.random() - 0.5) * state.hitJitterY : 0;
  ctx.save();
  ctx.globalAlpha = drawAlpha;
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
    // Determine mirroring based on frameData or boss facing
    const shouldMirror = frameData.mirror || state.facing > 0;
    ctx.save();
    ctx.globalAlpha = drawAlpha;
    if (shouldMirror) {
      ctx.translate(state.x + jitterX + fw * state.scale, state.y + jitterY);
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
        state.x + jitterX, state.y + jitterY, fw * state.scale, fh * state.scale
      );
    }
    ctx.restore();
    ctx.globalAlpha = 1.0;
    ctx.restore();
    // Health bar
    const barWidth = 200;
    const hpRatio = Math.max(0, state.hp) / MAX_HP;
    ctx.fillStyle = 'red';
    ctx.fillRect(canvas.width / 2 - barWidth / 2, 20, barWidth * hpRatio, 10);
    ctx.strokeStyle = 'white';
    ctx.strokeRect(canvas.width / 2 - barWidth / 2, 20, barWidth, 10);
    if (filterApplied) ctx.filter = 'none';
    return;
  }
  // Draw static frame with mirroring based on facing
  const staticFrame = spriteInfo.frame || 0;
  const mirrorStatic = state.facing > 0;
  ctx.save();
  ctx.globalAlpha = drawAlpha;
  if (mirrorStatic) {
    ctx.translate(state.x + jitterX + fw * state.scale, state.y + jitterY);
    ctx.scale(-1, 1);
    ctx.drawImage(
      spriteInfo.image,
      staticFrame * fw, 0, fw, fh,
      0, 0, fw * state.scale, fh * state.scale
    );
  } else {
    ctx.drawImage(
      spriteInfo.image,
      staticFrame * fw, 0, fw, fh,
      state.x + jitterX, state.y + jitterY, fw * state.scale, fh * state.scale
    );
  }
  ctx.restore();
  ctx.globalAlpha = 1.0;
  ctx.restore();
  // Health bar
  const barWidth = 200;
  const hpRatio = Math.max(0, state.hp) / MAX_HP;
  ctx.fillStyle = 'red';
  ctx.fillRect(canvas.width / 2 - barWidth / 2, 20, barWidth * hpRatio, 10);
  ctx.strokeStyle = 'white';
  ctx.strokeRect(canvas.width / 2 - barWidth / 2, 20, barWidth, 10);
  if (filterApplied) ctx.filter = 'none';
}

// Apply damage to the boss
function hit(damage = 1) {
  // Ignore hits before battle starts, during intro, while invulnerable, or when dying
  if (!state.active || state.entering || state.invulnerable || state.dying) {
    return;
  }
  state.hp -= damage;
  // play challenge SFX when crossing 75% HP threshold
  const prevHp = state.hp + damage;
  const threshold = MAX_HP * 0.75;
  if (prevHp > threshold && state.hp <= threshold) {
    challengeMeSfx.currentTime = 0;
    challengeMeSfx.play();
  }
  // Flash effect
  state.hitFlashEnd = performance.now() + 150;
  // Jitter/knockback effect (more dramatic)
  state.hitJitterX = 24;
  state.hitJitterY = 12;
  // Screen shake on low HP
  if (state.hp < MAX_HP * 0.25) {
    stateModule.setScreenShake(true);
    stateModule.setScreenShakeStartTime(performance.now());
  }
  // Update phase based on new HP, but skip if dying
  if (state.hp > 0) {
    updatePhaseLogic(state);
    state.speedMultiplier += 0.5;
  } else if (state.hp <= 0 && !state.dying) {
    state.hp = 0;
    state.active = false;
    state.dying = true;
    state.deathStart = performance.now();
    // Defeat visuals/audio handled by orchestrator defeat scene
  }
}

// Get boss hitbox (for collision)
function getHitbox() {
  const width = 100;
  const height = 196;
  const offsetX = (BOSS_WIDTH * state.scale - width) / 2;
  const offsetY = (BOSS_HEIGHT * state.scale - height) / 2;
  return {
    x: state.x + offsetX,
    y: state.y + offsetY,
    width,
    height
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

// Signal end of intro so boss enters battle mode
function setEntering(isEntering) {
  state.entering = isEntering;
}

// Export boss interface (spawn, update, draw, hit, getHitbox, setSprite, setPosition, setOpacity, setScale, setEntering)
const rugfatherBoss = {
  spawn,
  update,
  draw,
  hit,
  getHitbox,
  setSprite,
  setPosition,
  setOpacity,
  setScale,
  setEntering,
  // Expose internal dying state for external checks
  get dying() {
    return state.dying;
  }
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