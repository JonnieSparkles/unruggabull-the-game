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
import { spawnRugfatherCarpet } from '../../projectiles/index.js';
import { bgMusic } from '../../sound.js';
import { carpshits, lowerCarpshits, NUM_CARPSHITS, NUM_LOWER_CARPSHITS } from '../../enemies/carpshits.js';
import levels from '../index.js';
import { getCurrentLevelKey, setCarpshitsDuringBoss } from '../../state.js';

// Projectile image
const flameCarpetImg = new Image();
flameCarpetImg.src = 'assets/sprites/levels/rugcoAlley/flaming-carpet-Sheet.png';

// Config
const PROJECTILE_SPEED = 5;
const PROJECTILE_DAMAGE = 1;
const ATTACK_FRAMES = RUGFATHER_SPRITES.attack.frameSequence.length;
const FRAME_DURATION = RUGFATHER_SPRITES.attack.frameDuration;
const ATTACK_ANIM_DURATION = ATTACK_FRAMES * FRAME_DURATION;

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

// Map boss AI behavior functions to phases
function getPhaseBehavior(phase) {
  // For now, all phases use basicAttack
  return basicAttack;
}

export function updateBossAI(now, state) {
  if (!state.active) return;
  const behavior = getPhaseBehavior(state.phase);
  behavior(now, state);
}

/**
 * Recalculate boss phase based on current HP and adjust parameters.
 */
export function updatePhaseLogic(state) {
  const ratio = state.hp / MAX_HP;
  const newPhase = Math.ceil(ratio * NUM_PHASES);
  if (newPhase !== state.phase) {
    state.phase = newPhase;
    const cd = PHASE_ATTACK_COOLDOWNS[newPhase] || state.attackCooldown;
    state.attackCooldown = cd;
    console.log(`Rugfather phase changed to ${newPhase}, attackCooldown=${cd}`);
    // Prepare for spawning minions: get canvas and level config
    const canvas = document.getElementById('gameCanvas');
    const levelConfig = levels[getCurrentLevelKey()];
    // Phase 2: speed up music and spawn minions
    if (newPhase === 2) {
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
    } else if (newPhase === 1) {
      // Phase 3: further speed up music and additional minions
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
    }
  }
}

/**
 * Handle phase 1 movement (oscillation and bob) in initial phase.
 */
export function updatePhase1Movement(now, state) {
  if (!getBossBattleStarted() || !state.active || state.dying || state.phase !== NUM_PHASES) return;
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
  // Fire horizontally from boss's mouth/hands (scale is always 1)
  const x = state.x + BOSS_WIDTH * 0.2;
  const y = state.y + BOSS_HEIGHT * 0.65;
  spawnRugfatherCarpet(x, y);
}
