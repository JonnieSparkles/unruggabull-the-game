import { keys } from './input.js';
import { PLAYER_WIDTH, PLAYER_HEIGHT, MOVE_SPEED, CROUCH_SPEED, JUMP_FORCE, MAX_VELOCITY } from './constants/player.js';

export const PLAYER_START_HEALTH = 10;

/**
 * Player state and related assets.
 */
export const player = {
  x: 50,
  feetY: 380, // 300 (ground) + 80 (height)
  width: PLAYER_WIDTH,
  height: PLAYER_HEIGHT,
  frame: 0,
  speed: MOVE_SPEED,
  vx: 0,
  vy: 0,
  jumping: false,
  grounded: true,
  firing: false,
  facing: 1, // 1 for right, -1 for left
  health: PLAYER_START_HEALTH,
  crouching: false,
  muzzleFlashTimer: 0,
  shockedFrame: 0,
  shockedFrameTimer: 0,
  controlEnabled: true,
  sprite: 'idle',
  invulnerable: false,
  invulnerableUntil: null,
  hitHoldUntil: 0,
  scale: 1,
  opacity: 1
};

/**
 * Sound effect for jumping.
 */
export const jumpSound = new Audio('assets/audio/sfx/unruggabull/unruggabull-jump.mp3');

/**
 * Handle horizontal movement input.
 */
export function handleMovement() {
  let isWalking = false;
  // Slow down if crouching
  const normalSpeed = MOVE_SPEED;
  const crouchSpeed = CROUCH_SPEED;
  player.speed = player.crouching ? crouchSpeed : normalSpeed;
  if (keys['d'] || keys['D']) {
    player.vx = player.speed;
    isWalking = true;
    player.facing = 1;
  } else if (keys['a'] || keys['A']) {
    player.vx = -player.speed;
    isWalking = true;
    player.facing = -1;
  } else {
    player.vx = 0;
  }
  // wasWalking state managed in game loop if needed
}

/**
 * Handle jump input.
 */
export function handleJumping() {
  if (keys[' '] && player.grounded) {
    player.vy = JUMP_FORCE;
    player.jumping = true;
    player.grounded = false;
    jumpSound.currentTime = 0;
    jumpSound.play();
  }
}

/**
 * Handle crouch input.
 */
export function handleCrouch() {
  if ((keys['c'] || keys['C']) && player.grounded && !player.crouching) {
    player.crouching = true;
    player.height = 80;
    player.y = player.feetY - player.height;
  }
  if (!(keys['c'] || keys['C']) && player.crouching) {
    player.crouching = false;
    player.height = 96;
    player.y = player.feetY - player.height;
  }
  if (!player.grounded && player.crouching) {
    player.crouching = false;
    player.height = 96;
    player.y = player.feetY - player.height;
  }
}

/**
 * Update player input: movement, jumping, crouch.
 */
export function updatePlayerInput() {
  if (!player.controlEnabled) return;
  handleMovement();
  handleJumping();
  handleCrouch();
  if (player.muzzleFlashTimer > 0) player.muzzleFlashTimer--;
}

/**
 * Get the player's collision hitbox rectangle.
 * When jumping, use a reduced height of 84px aligned to the feet.
 */
export function getHitbox(player) {
  if (!player.grounded && !player.crouching) {
    const height = 84;
    const topY = player.feetY - height;
    return { x: player.x, y: topY, width: player.width, height };
  } else {
    // Always align hitbox to feet, even when crouching
    return { x: player.x, y: player.feetY - player.height, width: player.width, height: player.height };
  }
} 