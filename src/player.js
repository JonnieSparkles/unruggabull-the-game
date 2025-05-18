import { keys } from './input.js';

/**
 * Player state and related assets.
 */
export const player = {
  x: 50,
  feetY: 380, // 300 (ground) + 80 (height)
  width: 48,
  height: 80,
  frame: 0,
  speed: 4,
  vx: 0,
  vy: 0,
  jumping: false,
  grounded: true,
  firing: false,
  facing: 1, // 1 for right, -1 for left
  health: 3,
  crouching: false
};

/**
 * Sound effect for jumping.
 */
export const jumpSound = new Audio('assets/audio/sfx/jump_c_02-102843.mp3');

/**
 * Handle horizontal movement input.
 */
export function handleMovement() {
  let isWalking = false;
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
    player.vy = -12;
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
    player.height = 48;
    player.y = player.feetY - player.height;
  }
  if (!(keys['c'] || keys['C']) && player.crouching) {
    player.crouching = false;
    player.height = 80;
    player.y = player.feetY - player.height;
  }
  if (!player.grounded && player.crouching) {
    player.crouching = false;
    player.height = 80;
    player.y = player.feetY - player.height;
  }
}

/**
 * Update player input: movement, jumping, crouch.
 */
export function updatePlayerInput() {
  handleMovement();
  handleJumping();
  handleCrouch();
} 