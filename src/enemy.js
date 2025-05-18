// Enemy module: flying carpshits logic

// Access canvas and context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Sprite for carpshits
const carpshitSprite = new Image();
carpshitSprite.src = 'assets/sprites/enemy-carpshit.png';

// Carpshit sprite dimensions
export const CARPSHIT_SPRITE_WIDTH = 64;
export const CARPSHIT_SPRITE_HEIGHT = 50;

// Define dynamic floor and spawn ranges
const floorY = canvas.height - 20;
const upperSpawnMinY = canvas.height * 0.1;
const upperSpawnMaxY = canvas.height * 0.6;
const lowerSpawnMinY = canvas.height * 0.6;
const lowerSpawnMaxY = floorY - 48;

/**
 * Primary enemy: flying carpshits
 */
export const NUM_CARPSHITS = 3;
export const carpshits = Array.from({ length: NUM_CARPSHITS }, () => ({
  x: canvas.width + 48 + Math.random() * 200,
  y: upperSpawnMinY + Math.random() * (upperSpawnMaxY - upperSpawnMinY),
  vx: -(1.5 + Math.random()),
  alive: true,
  frame: 0,
  frameTimer: 0,
  falling: false,
  vy: 0,
  onFloor: false,
  respawnTimer: 0
}));

/**
 * Lower flying carpshits (animated)
 */
export const NUM_LOWER_CARPSHITS = 2;
export const lowerCarpshits = Array.from({ length: NUM_LOWER_CARPSHITS }, () => ({
  x: canvas.width + 48 + Math.random() * 200,
  y: lowerSpawnMinY + Math.random() * (lowerSpawnMaxY - lowerSpawnMinY),
  vx: -(1 + Math.random()),
  alive: true,
  frame: 0,
  frameTimer: 0,
  falling: false,
  vy: 0,
  onFloor: false,
  respawnTimer: 0
}));

/**
 * Get the carpshit's collision hitbox rectangle.
 * Handles floor offset when carpshit is dead and on floor.
 */
export function getCarpshitHitbox(carpshit) {
  // Determine the draw Y used by render and collision (floor offset when onFloor)
  const y = (!carpshit.alive && carpshit.onFloor)
    ? carpshit.y + 12
    : carpshit.y;
  return {
    x: carpshit.x,
    y,
    width: CARPSHIT_SPRITE_WIDTH,
    height: CARPSHIT_SPRITE_HEIGHT
  };
}

/**
 * Spawn a new upper carpshit off-screen
 */
export function spawnCarpshit() {
  carpshits.push({
    x: canvas.width + 48 + Math.random() * 200,
    y: upperSpawnMinY + Math.random() * (upperSpawnMaxY - upperSpawnMinY),
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

/**
 * Spawn a new lower carpshit off-screen
 */
export function spawnLowerCarpshit() {
  lowerCarpshits.push({
    x: canvas.width + 48 + Math.random() * 200,
    y: lowerSpawnMinY + Math.random() * (lowerSpawnMaxY - lowerSpawnMinY),
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

/**
 * Update upper carpshits movement and animations
 */
export function updateCarpshits() {
  carpshits.forEach(carpshit => {
    if (carpshit.falling) {
      carpshit.vy += 0.7;
      carpshit.y += carpshit.vy;
      const floorY = canvas.height - 20;
      const thresholdY = floorY - 48;
      if (carpshit.y >= thresholdY) {
        carpshit.y = thresholdY;
        carpshit.falling = false;
        carpshit.onFloor = true;
        carpshit.respawnTimer = performance.now();
      }
      return;
    }
    if (!carpshit.alive && carpshit.onFloor) {
      if (performance.now() - carpshit.respawnTimer > 2000 + Math.random() * 2000) {
        const fromLeft = false;
        if (fromLeft) {
          carpshit.x = -48 - Math.random() * 200;
          carpshit.vx = 1.5 + Math.random();
        } else {
          carpshit.x = canvas.width + 48 + Math.random() * 200;
          carpshit.vx = -(1.5 + Math.random());
        }
        carpshit.y = upperSpawnMinY + Math.random() * (upperSpawnMaxY - upperSpawnMinY);
        carpshit.alive = true;
        carpshit.frame = 0;
        carpshit.frameTimer = 0;
        carpshit.falling = false;
        carpshit.vy = 0;
        carpshit.onFloor = false;
        carpshit.respawnTimer = 0;
      }
      return;
    }
    if (!carpshit.alive && !carpshit.onFloor) return;
    if (carpshit.alive) {
      carpshit.x += carpshit.vx;
      carpshit.frameTimer++;
      if (carpshit.frameTimer > 8) {
        carpshit.frame = (carpshit.frame + 1) % 3;
        carpshit.frameTimer = 0;
      }
      if (carpshit.vx < 0 && carpshit.x < -48) {
        carpshit.x = canvas.width + 48;
      } else if (carpshit.vx > 0 && carpshit.x > canvas.width + 48) {
        carpshit.x = -48;
      }
    }
  });
}

/**
 * Draw upper carpshits
 */
export function drawCarpshits() {
  carpshits.forEach(carpshit => {
    if (!carpshit.alive && !carpshit.falling && !carpshit.onFloor) return;
    const frameToDraw = carpshit.alive ? carpshit.frame : 3;
    const yDraw = (!carpshit.alive && carpshit.onFloor) ? carpshit.y + 12 : carpshit.y;
    ctx.drawImage(carpshitSprite, frameToDraw * 64, 0, 64, 64, carpshit.x, yDraw, 64, 64);
  });
}

/**
 * Update lower carpshits movement and animations
 */
export function updateLowerCarpshits() {
  lowerCarpshits.forEach(carpshit => {
    if (carpshit.falling) {
      carpshit.vy += 0.7;
      carpshit.y += carpshit.vy;
      const floorY = canvas.height - 20;
      const thresholdY = floorY - 48;
      if (carpshit.y >= thresholdY) {
        carpshit.y = thresholdY;
        carpshit.falling = false;
        carpshit.onFloor = true;
        carpshit.respawnTimer = performance.now();
      }
      return;
    }
    if (!carpshit.alive && carpshit.onFloor) {
      if (performance.now() - carpshit.respawnTimer > 2000 + Math.random() * 2000) {
        const fromLeft = false;
        if (fromLeft) {
          carpshit.x = -48 - Math.random() * 200;
          carpshit.vx = 1 + Math.random();
        } else {
          carpshit.x = canvas.width + 48 + Math.random() * 200;
          carpshit.vx = -(1 + Math.random());
        }
        carpshit.y = lowerSpawnMinY + Math.random() * (lowerSpawnMaxY - lowerSpawnMinY);
        carpshit.alive = true;
        carpshit.frame = 0;
        carpshit.frameTimer = 0;
        carpshit.falling = false;
        carpshit.vy = 0;
        carpshit.onFloor = false;
        carpshit.respawnTimer = 0;
      }
      return;
    }
    if (!carpshit.alive && !carpshit.onFloor) return;
    if (carpshit.alive) {
      carpshit.x += carpshit.vx;
      carpshit.frameTimer++;
      if (carpshit.frameTimer > 8) {
        carpshit.frame = (carpshit.frame + 1) % 3;
        carpshit.frameTimer = 0;
      }
      if (carpshit.vx < 0 && carpshit.x < -48) {
        carpshit.x = canvas.width + 48;
      } else if (carpshit.vx > 0 && carpshit.x > canvas.width + 48) {
        carpshit.x = -48;
      }
    }
  });
}

/**
 * Draw lower carpshits
 */
export function drawLowerCarpshits() {
  lowerCarpshits.forEach(carpshit => {
    if (!carpshit.alive && !carpshit.falling && !carpshit.onFloor) return;
    const frameToDraw = carpshit.alive ? carpshit.frame : 3;
    const yDraw = (!carpshit.alive && carpshit.onFloor) ? carpshit.y + 12 : carpshit.y;
    ctx.drawImage(carpshitSprite, frameToDraw * 64, 0, 64, 64, carpshit.x, yDraw, 64, 64);
  });
} 