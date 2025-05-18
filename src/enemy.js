// Enemy module: flying carpets logic

// Access canvas and context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Sprite for carpets
const carpetSprite = new Image();
carpetSprite.src = 'assets/sprites/enemy-flying-carpet.png';

// Define dynamic floor and spawn ranges
const floorY = canvas.height - 20;
const upperSpawnMinY = canvas.height * 0.1;
const upperSpawnMaxY = canvas.height * 0.6;
const lowerSpawnMinY = canvas.height * 0.6;
const lowerSpawnMaxY = floorY - 48;

/**
 * Primary enemy: flying carpets
 */
export const NUM_CARPETS = 3;
export const carpets = Array.from({ length: NUM_CARPETS }, () => ({
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
 * Lower flying carpets (animated)
 */
export const NUM_LOWER_CARPETS = 2;
export const lowerCarpets = Array.from({ length: NUM_LOWER_CARPETS }, () => ({
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
 * Spawn a new upper carpet off-screen
 */
export function spawnCarpet() {
  carpets.push({
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
 * Spawn a new lower carpet off-screen
 */
export function spawnLowerCarpet() {
  lowerCarpets.push({
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
 * Update upper carpets movement and animations
 */
export function updateCarpets() {
  carpets.forEach(carpet => {
    if (carpet.falling) {
      carpet.vy += 0.7;
      carpet.y += carpet.vy;
      const floorY = canvas.height - 20;
      const thresholdY = floorY - 48;
      if (carpet.y >= thresholdY) {
        carpet.y = thresholdY;
        carpet.falling = false;
        carpet.onFloor = true;
        carpet.respawnTimer = performance.now();
      }
      return;
    }
    if (!carpet.alive && carpet.onFloor) {
      if (performance.now() - carpet.respawnTimer > 2000 + Math.random() * 2000) {
        const fromLeft = false;
        if (fromLeft) {
          carpet.x = -48 - Math.random() * 200;
          carpet.vx = 1.5 + Math.random();
        } else {
          carpet.x = canvas.width + 48 + Math.random() * 200;
          carpet.vx = -(1.5 + Math.random());
        }
        carpet.y = upperSpawnMinY + Math.random() * (upperSpawnMaxY - upperSpawnMinY);
        carpet.alive = true;
        carpet.frame = 0;
        carpet.frameTimer = 0;
        carpet.falling = false;
        carpet.vy = 0;
        carpet.onFloor = false;
        carpet.respawnTimer = 0;
      }
      return;
    }
    if (!carpet.alive && !carpet.onFloor) return;
    if (carpet.alive) {
      carpet.x += carpet.vx;
      carpet.frameTimer++;
      if (carpet.frameTimer > 8) {
        carpet.frame = (carpet.frame + 1) % 3;
        carpet.frameTimer = 0;
      }
      if (carpet.vx < 0 && carpet.x < -48) {
        carpet.x = canvas.width + 48;
      } else if (carpet.vx > 0 && carpet.x > canvas.width + 48) {
        carpet.x = -48;
      }
    }
  });
}

/**
 * Draw upper carpets
 */
export function drawCarpets() {
  carpets.forEach(carpet => {
    if (!carpet.alive && !carpet.falling && !carpet.onFloor) return;
    const frameToDraw = carpet.alive ? carpet.frame : 3;
    const yDraw = (!carpet.alive && carpet.onFloor) ? carpet.y + 12 : carpet.y;
    ctx.drawImage(carpetSprite, frameToDraw * 48, 0, 48, 48, carpet.x, yDraw, 48, 48);
  });
}

/**
 * Update lower carpets movement and animations
 */
export function updateLowerCarpets() {
  lowerCarpets.forEach(carpet => {
    if (carpet.falling) {
      carpet.vy += 0.7;
      carpet.y += carpet.vy;
      const floorY = canvas.height - 20;
      const thresholdY = floorY - 48;
      if (carpet.y >= thresholdY) {
        carpet.y = thresholdY;
        carpet.falling = false;
        carpet.onFloor = true;
        carpet.respawnTimer = performance.now();
      }
      return;
    }
    if (!carpet.alive && carpet.onFloor) {
      if (performance.now() - carpet.respawnTimer > 2000 + Math.random() * 2000) {
        const fromLeft = false;
        if (fromLeft) {
          carpet.x = -48 - Math.random() * 200;
          carpet.vx = 1 + Math.random();
        } else {
          carpet.x = canvas.width + 48 + Math.random() * 200;
          carpet.vx = -(1 + Math.random());
        }
        carpet.y = lowerSpawnMinY + Math.random() * (lowerSpawnMaxY - lowerSpawnMinY);
        carpet.alive = true;
        carpet.frame = 0;
        carpet.frameTimer = 0;
        carpet.falling = false;
        carpet.vy = 0;
        carpet.onFloor = false;
        carpet.respawnTimer = 0;
      }
      return;
    }
    if (!carpet.alive && !carpet.onFloor) return;
    if (carpet.alive) {
      carpet.x += carpet.vx;
      carpet.frameTimer++;
      if (carpet.frameTimer > 8) {
        carpet.frame = (carpet.frame + 1) % 3;
        carpet.frameTimer = 0;
      }
      if (carpet.vx < 0 && carpet.x < -48) {
        carpet.x = canvas.width + 48;
      } else if (carpet.vx > 0 && carpet.x > canvas.width + 48) {
        carpet.x = -48;
      }
    }
  });
}

/**
 * Draw lower carpets
 */
export function drawLowerCarpets() {
  lowerCarpets.forEach(carpet => {
    if (!carpet.alive && !carpet.falling && !carpet.onFloor) return;
    const frameToDraw = carpet.alive ? carpet.frame : 3;
    const yDraw = (!carpet.alive && carpet.onFloor) ? carpet.y + 12 : carpet.y;
    ctx.drawImage(carpetSprite, frameToDraw * 48, 0, 48, 48, carpet.x, yDraw, 48, 48);
  });
} 