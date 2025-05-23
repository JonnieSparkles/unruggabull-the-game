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
import levels from '../levels/index.js';
import { getCurrentLevelKey } from '../state.js';
const levelConfig = levels[getCurrentLevelKey()];
const floorY = levelConfig.floorY;
const upperSpawnMinY = canvas.height * 0.1;
const upperSpawnMaxY = canvas.height * 0.6;
const lowerSpawnMinY = canvas.height * 0.6;
const lowerSpawnMaxY = floorY - 48;

import { difficultyLevel, getCarpshitsDuringBoss } from '../state.js';

/**
 * Primary enemy: flying carpshits
 */
export const NUM_CARPSHITS = 3;
export const carpshits = Array.from({ length: NUM_CARPSHITS }, () => ({
  x: canvas.width + 48 + Math.random() * 200,
  y: upperSpawnMinY + Math.random() * (upperSpawnMaxY - upperSpawnMinY),
  vx: -getUpperSpeed(),
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
  vx: -getLowerSpeed(),
  alive: true,
  frame: 0,
  frameTimer: 0,
  falling: false,
  vy: 0,
  onFloor: false,
  respawnTimer: 0
}));

// Difficulty-based speed and respawn helper functions
function getUpperSpeed() {
  const base = 1.5 + Math.random();
  return base * (1 + (difficultyLevel - 1) * 0.15);
}
function getLowerSpeed() {
  const base = 1 + Math.random() * 1.2;
  return base * (1 + (difficultyLevel - 1) * 0.15);
}
function getRespawnDelay() {
  const base = Math.max(500, 2000 - (difficultyLevel - 1) * 300);
  return base + Math.random() * base;
}

// Independent spawn timers
let nextUpperSpawn = performance.now() + getRespawnDelay();
let nextLowerSpawn = performance.now() + getRespawnDelay();
// Floor-clear interval and independent clear timers
const floorClearInterval = 5000;
let nextUpperClear = performance.now() + floorClearInterval;
let nextLowerClear = performance.now() + floorClearInterval;

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
  let fromLeft = false;
  if (difficultyLevel >= 2) fromLeft = Math.random() < 0.5;
  const x = fromLeft
    ? -48 - Math.random() * 200
    : canvas.width + 48 + Math.random() * 200;
  const speed = getUpperSpeed();
  const vx = fromLeft ? speed : -speed;
  carpshits.push({
    x,
    y: upperSpawnMinY + Math.random() * (upperSpawnMaxY - upperSpawnMinY),
    swoop: difficultyLevel >= 4 && Math.random() < 0.3,
    swoopStart: performance.now(),
    swoopAmplitude: (upperSpawnMaxY - upperSpawnMinY) / 2,
    swoopBaseY: (upperSpawnMaxY + upperSpawnMinY) / 2,
    swoopPeriod: 1500,
    vx,
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
  let fromLeft = false;
  if (difficultyLevel >= 2) fromLeft = Math.random() < 0.5;
  const x = fromLeft
    ? -48 - Math.random() * 200
    : canvas.width + 48 + Math.random() * 200;
  const speed = getLowerSpeed();
  const vx = fromLeft ? speed : -speed;
  lowerCarpshits.push({
    x,
    y: lowerSpawnMinY + Math.random() * (lowerSpawnMaxY - lowerSpawnMinY),
    swoop: difficultyLevel >= 4 && Math.random() < 0.3,
    swoopStart: performance.now(),
    swoopAmplitude: (lowerSpawnMaxY - lowerSpawnMinY) / 2,
    swoopBaseY: (lowerSpawnMaxY + lowerSpawnMinY) / 2,
    swoopPeriod: 1500,
    vx,
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
      const thresholdY = floorY - 48;
      if (carpshit.y >= thresholdY) {
        carpshit.y = thresholdY;
        carpshit.falling = false;
        carpshit.onFloor = true;
        carpshit.respawnTimer = performance.now();
      }
      return;
    }
    if (!carpshit.alive) return;
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
    if (carpshit.swoop) {
      const t = performance.now() - carpshit.swoopStart;
      carpshit.y = carpshit.swoopBaseY +
        Math.sin((t / carpshit.swoopPeriod) * 2 * Math.PI) *
        carpshit.swoopAmplitude;
    }
  });
  // periodic clear of dead minions on floor (works during boss battle too)
  const now = performance.now();
  if (now >= nextUpperClear) {
    for (let i = carpshits.length - 1; i >= 0; i--) {
      const c = carpshits[i];
      if (!c.alive && c.onFloor) carpshits.splice(i, 1);
    }
    nextUpperClear = now + floorClearInterval;
  }
  // periodic spawn only outside boss battle
  if (!getCarpshitsDuringBoss() && now >= nextUpperSpawn) {
    spawnCarpshit();
    nextUpperSpawn = now + getRespawnDelay();
  }
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
      const thresholdY = floorY - 48;
      if (carpshit.y >= thresholdY) {
        carpshit.y = thresholdY;
        carpshit.falling = false;
        carpshit.onFloor = true;
        carpshit.respawnTimer = performance.now();
      }
      return;
    }
    if (!carpshit.alive) return;
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
    if (carpshit.swoop) {
      const t = performance.now() - carpshit.swoopStart;
      carpshit.y = carpshit.swoopBaseY +
        Math.sin((t / carpshit.swoopPeriod) * 2 * Math.PI) *
        carpshit.swoopAmplitude;
    }
  });
  // periodic clear of dead minions on floor (works during boss battle too)
  const nowL = performance.now();
  if (nowL >= nextLowerClear) {
    for (let i = lowerCarpshits.length - 1; i >= 0; i--) {
      const c = lowerCarpshits[i];
      if (!c.alive && c.onFloor) lowerCarpshits.splice(i, 1);
    }
    nextLowerClear = nowL + floorClearInterval;
  }
  // periodic spawn only outside boss battle
  if (!getCarpshitsDuringBoss() && nowL >= nextLowerSpawn) {
    spawnLowerCarpshit();
    nextLowerSpawn = nowL + getRespawnDelay();
  }
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