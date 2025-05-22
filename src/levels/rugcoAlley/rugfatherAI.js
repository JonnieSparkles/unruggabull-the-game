import {
  BOSS_WIDTH,
  BOSS_HEIGHT,
  NUM_PHASES,
  MAX_HP,
  PHASE_ATTACK_COOLDOWNS,
  PHASE1_MOVE_AMPLITUDE,
  PHASE1_MOVE_PERIOD,
  PHASE1_JUMP_HEIGHT,
  PHASE1_JUMP_PERIOD
} from './rugfatherConstants.js';
import { getBossBattleStarted } from '../../state.js';
import { RUGFATHER_SPRITES } from './rugfatherSprites.js';
import { projectiles, spawnRugfatherCarpet } from '../../projectiles/index.js';
import { bgMusic, evilLaughSfx, helloUnruggabullSfx, challengeMeSfx, wovenIntoRugSfx, heatThingsUpSfx, muhahahaSfx } from '../../sound.js';
import { carpshits, lowerCarpshits, NUM_CARPSHITS, NUM_LOWER_CARPSHITS } from '../../enemies/carpshits.js';
import levels from '../index.js';
import { getCurrentLevelKey, setCarpshitsDuringBoss } from '../../state.js';
import * as stateModule from '../../state.js';

// Projectile image
const flameCarpetImg = new Image();
flameCarpetImg.src = 'assets/sprites/levels/rugcoAlley/flaming-carpet-Sheet.png';

// Config
const PROJECTILE_SPEED = 5;
const PROJECTILE_DAMAGE = 1;
const ATTACK_FRAMES = RUGFATHER_SPRITES.attack.frameSequence.length;
const FRAME_DURATION = RUGFATHER_SPRITES.attack.frameDuration;
const ATTACK_ANIM_DURATION = ATTACK_FRAMES * FRAME_DURATION;

// Boss spin arc landing X (left side)
const SPIN_LAND_X = 128;

// Basic attack behavior shared across phases
function basicAttack(now, state) {
  if (state.sprite === 'attack') {
    if (state.attackAnimationStartTime == null) {
      state.attackAnimationStartTime = now;
      state.hasSpawnedProjectile = false;
    }
    const elapsed = now - state.attackAnimationStartTime;
    const frameIndex = Math.floor(elapsed / FRAME_DURATION);
    if (frameIndex >= 3 && !state.hasSpawnedProjectile) {
      spawnProjectile(state);
      stateModule.setScreenShake(true);
      stateModule.setScreenShakeStartTime(performance.now());
      state.hasSpawnedProjectile = true;
    }
    if (elapsed >= ATTACK_ANIM_DURATION) {
      state.sprite = 'idle';
      state.attackAnimationStartTime = null;
      state.hasSpawnedProjectile = false;
    }
    return;
  }
  if (state.lastAttackTime == null) {
    state.lastAttackTime = now;
  }
  if (now - state.lastAttackTime >= state.attackCooldown) {
    state.sprite = 'attack';
    state.lastAttackTime = now;
  }
}

// Special spin-and-bounce behavior for final phase
function spinBounceBehavior(now, state) {
  // Initialize base positions once
  if (!state.spinCaptured) {
    state.spinBaseX = state.x;
    state.spinBaseY = state.y;
    state.spinCaptured = true;
  }
  // Oscillate horizontally and bounce vertically
  const periodX = 1000; // ms per horizontal cycle
  const periodY = 500;  // ms per vertical bounce
  const amplitudeX = 80;
  const amplitudeY = 40;
  state.x = state.spinBaseX + amplitudeX * Math.sin((now / periodX) * 2 * Math.PI);
  state.y = state.spinBaseY + amplitudeY * Math.abs(Math.sin((now / periodY) * 2 * Math.PI));
  // Use spin sprite
  state.sprite = 'spin';
  // Continue basic attack firing while spinning
  basicAttack(now, state);
}

// One-time spin-and-switch behavior for final phase
function spinSwitchBehavior(now, state) {
  // Dramatic pause before takeoff
  const prePause = 800;
  const postPause = 800;
  const arcStart = state.spinSwitchStartTime + prePause;
  const arcEnd = arcStart + state.spinSwitchDuration;
  // Play takeoff SFX once
  if (!state.spinSwitchTakeoffPlayed && now >= arcStart) {
    heatThingsUpSfx.currentTime = 0;
    heatThingsUpSfx.play();
    state.spinSwitchTakeoffPlayed = true;
  }
  // Not started yet: dramatic pause
  if (now < arcStart) {
    state.sprite = 'hit';
    return;
  }
  // Arc in progress
  const t = (now - arcStart) / state.spinSwitchDuration;
  if (t < 1) {
    const lerpX = state.spinSwitchStartX + (state.spinSwitchEndX - state.spinSwitchStartX) * t;
    // Use a sharper parabola: y = y0 - amp * sin(PI * t)
    const y0 = state.spinSwitchFloorY;
    const amp = state.spinSwitchAmplitude;
    const arcY = y0 - amp * Math.sin(Math.PI * t);
    state.x = lerpX;
    state.y = arcY;
    state.sprite = 'spin';
    return;
  }
  // Dramatic pause after landing
  if (!state.spinSwitchLanded) {
    state.x = state.spinSwitchEndX;
    state.y = state.spinSwitchFloorY;
    state.sprite = 'hit';
    // Play landing SFX once
    muhahahaSfx.currentTime = 0;
    muhahahaSfx.play();
    state.spinSwitchLanded = true;
    state.spinSwitchLandTime = now;
    // Face right after landing
    state.facing = 1;
    return;
  }
  if (now - state.spinSwitchLandTime < postPause) {
    state.sprite = 'hit';
    return;
  }
  // Resume normal AI
  state.sprite = 'idle';
  state.spinSwitchDone = true;
}

// Map boss AI behavior functions to phases
function getPhaseBehavior(phase, state) {
  // Before spin-switch completes, use spinSwitchBehavior
  if (phase === NUM_PHASES && state.spinSwitchStartTime && !state.spinSwitchDone) {
    return spinSwitchBehavior;
  }
  // Default basic attack
  return basicAttack;
}

export function updateBossAI(now, state) {
  if (!state.active) return;
  const behavior = getPhaseBehavior(state.phase, state);
  behavior(now, state);
}

/**
 * Recalculate boss phase based on current HP and adjust parameters.
 */
export function updatePhaseLogic(state) {
  const ratio = state.hp / MAX_HP;
  const oldPhaseIdx = Math.ceil(ratio * NUM_PHASES);
  // Map high HP->phase1, med->2, low->3
  const newPhase = NUM_PHASES - oldPhaseIdx + 1;
  if (newPhase !== state.phase) {
    // Show hit frame between phases and pause music for dramatic effect
    const dramaticPause = 2000;
    state.sprite = 'hit';
    state.invulnerable = true; // Boss is invulnerable during phase change
    bgMusic.pause();
    setTimeout(() => {
      if (state.sprite === 'hit') state.sprite = 'idle';
      bgMusic.play();
    }, dramaticPause);
    // Prepare one-time spin-and-switch for hardest phase 3
    let extraInvuln = 0;
    if (newPhase === NUM_PHASES) {
      const canvas = document.getElementById('gameCanvas');
      const floorY = levels[getCurrentLevelKey()].floorY - BOSS_HEIGHT * state.scale;
      state.spinSwitchStartTime = performance.now() + dramaticPause;
      state.spinSwitchDuration = 2000;
      state.spinSwitchDone = false;
      state.spinSwitchStartX = state.x;
      state.spinSwitchEndX = SPIN_LAND_X;
      state.spinSwitchFloorY = floorY;
      state.spinSwitchAmplitude = 200
      extraInvuln = state.spinSwitchDuration + 200; // buffer after landing
    }
    // Remove invulnerability after pause and (if phase 3) after spin
    setTimeout(() => {
      state.invulnerable = false;
      state.invulnFadeIn = true;
      state.invulnFadeInStart = performance.now();
    }, dramaticPause + extraInvuln);
    state.phase = newPhase;
    // Reset movement base capture for new phase
    state.hasCapturedBaseX = false;
    state.hasCapturedBaseY = false;
    const cd = PHASE_ATTACK_COOLDOWNS[newPhase] || state.attackCooldown;
    state.attackCooldown = cd;
    console.log(`Rugfather phase changed to ${newPhase}, attackCooldown=${cd}`);
    // Prepare for spawning minions: get canvas and level config
    const canvas = document.getElementById('gameCanvas');
    const levelConfig = levels[getCurrentLevelKey()];
    // Phase 2: speed up music and spawn minions
    if (newPhase === 2) {
      // Play phase 2 challenge-me SFX
      challengeMeSfx.currentTime = 0;
      challengeMeSfx.play();
      bgMusic.playbackRate = 1.5;
      setCarpshitsDuringBoss(true);
      for (let i = 0; i < NUM_CARPSHITS; i++) {
        carpshits.push({
          x: canvas.width + 48 + Math.random() * 200,
          y: canvas.height * 0.1 + Math.random() *
             (canvas.height * 0.6 - canvas.height * 0.1),
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
          y: canvas.height * 0.6 + Math.random() *
             ((levelConfig.floorY - 48) - canvas.height * 0.6),
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
    } else if (newPhase === 3) {
      // Phase 3: fastest music and additional minions
      bgMusic.playbackRate = 2.0;
      setCarpshitsDuringBoss(true);
      for (let i = 0; i < NUM_CARPSHITS; i++) {
        carpshits.push({
          x: canvas.width + 48 + Math.random() * 200,
          y: canvas.height * 0.1 + Math.random() *
             (canvas.height * 0.6 - canvas.height * 0.1),
          vx: -(2 + Math.random()),
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
          y: canvas.height * 0.6 + Math.random() *
             ((levelConfig.floorY - 48) - canvas.height * 0.6),
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
    } else if (newPhase === 1) {
      // Phase 1: slowest music
      bgMusic.playbackRate = 1.0;
    }
  }
}

/**
 * Handle phase 1 movement (oscillation and bob) after spin-switch completes.
 */
export function updatePhase1Movement(now, state) {
  if (!getBossBattleStarted() || !state.active || state.dying || state.phase !== NUM_PHASES || !state.spinSwitchDone) return;
  // Capture base positions once
  if (!state.hasCapturedBaseY) {
    state.baseY = state.y;
    state.hasCapturedBaseY = true;
  }
  if (!state.hasCapturedBaseX) {
    state.baseX = state.x;
    state.hasCapturedBaseX = true;
  }
  // Horizontal oscillation
  const offsetX = PHASE1_MOVE_AMPLITUDE * Math.sin((now / PHASE1_MOVE_PERIOD) * 2 * Math.PI);
  state.x = state.baseX + offsetX;
  // Vertical bob/jump effect
  const jumpOffset = Math.abs(Math.sin((now / PHASE1_JUMP_PERIOD) * 2 * Math.PI)) * PHASE1_JUMP_HEIGHT;
  state.y = state.baseY - jumpOffset;
}

function spawnProjectile(state) {
  // Fire horizontally from boss's mouth/hands, mirrored for facing
  let x;
  if (state.facing < 0) {
    // Facing left (default)
    x = state.x + BOSS_WIDTH * 0.2;
  } else {
    // Facing right: spawn from right side
    x = state.x + BOSS_WIDTH * 0.8;
  }
  const y = state.y + BOSS_HEIGHT * 0.65;
  spawnRugfatherCarpet(x, y);
  // Adjust projectile direction based on boss facing
  const p = projectiles[projectiles.length - 1];
  if (p) p.vx = PROJECTILE_SPEED * state.facing;
}
