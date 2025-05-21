import { bossState as state, BOSS_WIDTH, BOSS_HEIGHT } from './rugfather.js';
import { RUGFATHER_SPRITES } from './rugfatherSprites.js';
import { spawnRugfatherCarpet } from '../../projectiles/index.js';

// Projectile image
const flameCarpetImg = new Image();
flameCarpetImg.src = 'assets/sprites/levels/rugcoAlley/flaming-carpet-Sheet.png';

// Config
const PROJECTILE_SPEED = 5;
const PROJECTILE_DAMAGE = 1;
const ATTACK_FRAMES = RUGFATHER_SPRITES.attack.frameSequence.length;
const FRAME_DURATION = RUGFATHER_SPRITES.attack.frameDuration;
const ATTACK_ANIM_DURATION = ATTACK_FRAMES * FRAME_DURATION;

export function updateBossAI(now) {
  if (!state.active) return;

  // Handle attack animation and timing
  if (state.sprite === 'attack') {
    // Start timing for attack animation once
    if (state.attackAnimationStartTime == null) {
      state.attackAnimationStartTime = now;
      state.hasSpawnedProjectile = false;
    }
    const elapsed = now - state.attackAnimationStartTime;
    const frameIndex = Math.floor(elapsed / FRAME_DURATION);
    // Spawn projectile on 4th frame (index 3)
    if (frameIndex >= 3 && !state.hasSpawnedProjectile) {
      spawnProjectile();
      state.hasSpawnedProjectile = true;
    }
    // Reset to idle after full animation
    if (elapsed >= ATTACK_ANIM_DURATION) {
      state.sprite = 'idle';
      state.attackAnimationStartTime = null;
      state.hasSpawnedProjectile = false;
    }
    return;
  }

  // Initialize lastAttackTime if unset
  if (state.lastAttackTime == null) {
    state.lastAttackTime = now;
  }
  // Check cooldown and start a new attack
  if (now - state.lastAttackTime >= state.attackCooldown) {
    state.sprite = 'attack';
    state.lastAttackTime = now;
  }
}

function spawnProjectile() {
  // Fire horizontally from boss's mouth/hands (scale is always 1)
  const x = state.x + BOSS_WIDTH / 3;
  const y = state.y + BOSS_HEIGHT * 0.65;
  spawnRugfatherCarpet(x, y);
}
