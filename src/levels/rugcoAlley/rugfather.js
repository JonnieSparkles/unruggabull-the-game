import { setPlayerAutoRunLeft } from '../../state.js';
import { player } from '../../player.js';

// Level 1 Boss: Rugfather
// Access the canvas and context
document; // ensure module scope
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Boss sprite setup
const bossSprite = new Image();
bossSprite.src = 'assets/sprites/levels/rugcoAlley/rugfather.png';

const BOSS_WIDTH = 128;
const BOSS_HEIGHT = 128;

// Internal state
const state = {
  x: 0,
  y: 0,
  hp: 100,
  active: false,
  opacity: 0,
  entering: true,
  walkingForward: false,
  scale: 1.0
};

// Spawn the boss at center-top of the screen
function spawn() {
  state.active = true;
  state.hp = 100;
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
    const scaleSpeed = 0.01; // slower scale
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
  const t = performance.now() / 500;
  state.x = canvas.width / 2 - (BOSS_WIDTH * state.scale) / 2 + Math.sin(t) * 100;
}

// Draw the boss and its HP bar
function draw() {
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
  const hpRatio = Math.max(0, state.hp) / 100;
  ctx.fillStyle = 'red';
  ctx.fillRect(canvas.width / 2 - barWidth / 2, 20, barWidth * hpRatio, 10);
  ctx.strokeStyle = 'white';
  ctx.strokeRect(canvas.width / 2 - barWidth / 2, 20, barWidth, 10);
}

// Apply damage to the boss
function hit(damage = 10) {
  if (!state.active) return;
  state.hp -= damage;
  if (state.hp <= 0) {
    state.active = false;
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