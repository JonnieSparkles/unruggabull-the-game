import { setPlayerAutoRunLeft } from '../../state.js';
import { player } from '../../player.js';
import * as stateModule from '../../state.js';
import { bgMusic } from '../../sound.js';
import { carpshits, lowerCarpshits, NUM_CARPSHITS, NUM_LOWER_CARPSHITS } from '../../enemy.js';

// Level 1 Boss: Rugfather
// Access the canvas and context
document; // ensure module scope
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Boss sprite setup
const bossSprite = new Image();
bossSprite.src = 'assets/sprites/levels/rugcoAlley/rugfather.png';
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
  opacity: 0,
  entering: true,
  walkingForward: false,
  scale: 1.0,
  speedMultiplier: 1.0,
  dying: false,
  deathStart: 0
};

// Spawn the boss at center-top of the screen
function spawn() {
  state.active = true;
  state.hp = 5;
  state.x = canvas.width / 2 - BOSS_WIDTH / 2;
  state.scale = 1.0;
  // Start at garage floor (further back)
  const garageFloorY = canvas.height - 120;
  state.y = garageFloorY - BOSS_HEIGHT * state.scale;
  state.opacity = 0;
  state.entering = true;
  state.walkingForward = false;
}

// Basic oscillation movement
function update() {
  if (state.dying) {
    // Dramatic death: fade out, fall, or shake
    const elapsed = performance.now() - state.deathStart;
    if (elapsed < 1200) {
      // Shake and fade
      state.opacity = 1 - (elapsed / 1200);
      state.x += Math.sin(elapsed * 0.05) * 8;
    } else {
      state.opacity = 0;
      state.dying = false;
      // After death animation, begin exit walk into garage
      setTimeout(() => {
        stateModule.setGameState('bossExit');
      }, 500);
    }
    return;
  }
  if (!state.active) return;
  const playerFloorY = canvas.height - 20;
  const garageFloorY = canvas.height - 120;
  if (state.entering) {
    // Fade in only (no vertical movement)
    if (state.opacity < 1) {
      state.opacity += 0.02; // slower fade
      if (state.opacity > 1) state.opacity = 1;
    }
    // Keep at garage floor during fade-in
    state.y = garageFloorY - BOSS_HEIGHT * state.scale;
    if (state.opacity === 1) {
      state.entering = false;
      state.walkingForward = true;
    }
    if (state.walkingForward && state.opacity === 1) {
      setPlayerAutoRunLeft(true);
      player.facing = -1;
      player.feetY = canvas.height - 20;
    }
    return;
  }
  // Hybrid: walk forward (scale up and move y)
  if (state.walkingForward) {
    const finalScale = 2.0;
    const scaleSpeed = 0.01 * state.speedMultiplier;
    // Animate scale
    if (state.scale < finalScale) {
      state.scale += scaleSpeed;
      if (state.scale > finalScale) state.scale = finalScale;
    }
    // Animate y from garage floor to player floor
    const startY = garageFloorY - BOSS_HEIGHT * 1.0;
    const endY = playerFloorY - BOSS_HEIGHT * finalScale;
    // Progress 0 to 1
    const progress = (state.scale - 1.0) / (finalScale - 1.0);
    state.y = startY + (endY - startY) * progress;
    if (state.scale === finalScale) {
      state.walkingForward = false;
    }
    return;
  }
  // Idle/battle movement
  const t = performance.now() / (500 / state.speedMultiplier);
  state.x = canvas.width / 2 - (BOSS_WIDTH * state.scale) / 2 + Math.sin(t) * 100;
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
  ctx.save();
  ctx.globalAlpha = state.opacity;
  ctx.drawImage(
    bossSprite,
    state.x,
    state.y,
    BOSS_WIDTH * state.scale,
    BOSS_HEIGHT * state.scale
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
    stateModule.setBossActive(false);
    stateModule.setCarpshitsDuringBoss(false);
    stateModule.setCurrentBoss(null);
    bgMusic.playbackRate = 1.0;
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