import { bossState as state, BOSS_WIDTH, BOSS_HEIGHT } from './rugfather.js';
import { RUGFATHER_SPRITES } from './rugfatherSprites.js';
import { spawnRugfatherCarpet } from '../../projectiles/index.js';
import { NUM_PHASES } from './rugfatherConstants.js';

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
function basicAttack(now) {
  if (state.sprite === 'attack') {
    if (state.attackAnimationStartTime == null) {
      state.attackAnimationStartTime = now;
      state.hasSpawnedProjectile = false;
    }
    const elapsed = now - state.attackAnimationStartTime;
    const frameIndex = Math.floor(elapsed / FRAME_DURATION);
    if (frameIndex >= 3 && !state.hasSpawnedProjectile) {
      spawnProjectile();
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
const PHASE_BEHAVIORS = {
  [NUM_PHASES]: basicAttack,
  [NUM_PHASES - 1]: basicAttack,
  [NUM_PHASES - 2]: basicAttack,
  [NUM_PHASES - 3]: basicAttack,
  1: basicAttack
};

export function updateBossAI(now) {
  if (!state.active) return;
  const behavior = PHASE_BEHAVIORS[state.phase] || basicAttack;
  behavior(now);
}

function spawnProjectile() {
  // Fire horizontally from boss's mouth/hands (scale is always 1)
  const x = state.x + BOSS_WIDTH * 0.2;
  const y = state.y + BOSS_HEIGHT * 0.65;
  spawnRugfatherCarpet(x, y);
}
