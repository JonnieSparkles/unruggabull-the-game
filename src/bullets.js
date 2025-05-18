// Bullet module: creation, update, and rendering of bullets
import { fireSound } from './sound.js';

/**
 * Update bullet positions and remove those off-screen.
 */
export function updateBullets(bullets, canvasWidth) {
  for (let i = bullets.length - 1; i >= 0; i--) {
    bullets[i].x += bullets[i].vx;
    bullets[i].y += bullets[i].vy;
    if (bullets[i].x < 0 || bullets[i].x > canvasWidth) {
      bullets.splice(i, 1);
    }
  }
}

/**
 * Render bullets.
 */
export function drawBullets(ctx, bullets, debug) {
  ctx.fillStyle = '#ff0';
  bullets.forEach(bullet => {
    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, 6, 0, Math.PI * 2);
    ctx.fill();
  });
  if (debug) {
    ctx.save();
    ctx.fillStyle = 'red';
    bullets.forEach(bullet => {
      ctx.beginPath();
      ctx.arc(bullet.x, bullet.y, 2, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }
}

// Add firing handlers
/**
 * Handle firing input: spawn bullets when fire key is pressed.
 */
export function handleFiring(keys, player, bullets) {
  const fireKeyPressed = keys['f'] || keys['F'] || keys['j'] || keys['J'] || keys['Enter'];
  if (fireKeyPressed && !player.firing) {
    player.firing = true;
    fireBullet(player, bullets);
  } else if (!fireKeyPressed) {
    player.firing = false;
  }
}

/**
 * Spawn a new bullet from the player at its current position.
 */
export function fireBullet(player, bullets) {
  const direction = player.facing;
  const bulletOffsetX = direction === 1
    ? player.width - 6
    : -6;
  const bulletOffsetY = player.crouching
    ? player.height / 2
    : player.height / 2 + 5;
  const bulletX = player.x + bulletOffsetX;
  const bulletY = player.y + bulletOffsetY;

  bullets.push({
    x: bulletX,
    y: bulletY,
    vx: 10 * direction,
    vy: 0
  });
  fireSound.currentTime = 0;
  fireSound.play();
} 