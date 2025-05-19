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
  entering: true
};

// Spawn the boss at center-top of the screen
function spawn() {
  state.active = true;
  state.hp = 100;
  state.x = canvas.width / 2 - BOSS_WIDTH / 2;
  // Place feet at garage floor (bottom of door)
  const garageFloorY = canvas.height - 120; // adjust as needed for your art
  state.y = garageFloorY - BOSS_HEIGHT;
  state.opacity = 0;
  state.entering = true;
}

// Basic oscillation movement
function update() {
  if (!state.active) return;
  if (state.entering) {
    // Fade in only (no vertical movement)
    if (state.opacity < 1) {
      state.opacity += 0.04;
      if (state.opacity > 1) state.opacity = 1;
    }
    if (state.opacity === 1) {
      state.entering = false;
    }
    return;
  }
  // Idle/battle movement
  const t = performance.now() / 500;
  state.x = canvas.width / 2 - BOSS_WIDTH / 2 + Math.sin(t) * 100;
}

// Draw the boss and its HP bar
function draw() {
  if (!state.active) return;
  ctx.save();
  ctx.globalAlpha = state.opacity;
  ctx.drawImage(bossSprite, state.x, state.y, BOSS_WIDTH, BOSS_HEIGHT);
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

// Export boss interface
const rugfatherBoss = { spawn, update, draw, hit };
export default rugfatherBoss; 