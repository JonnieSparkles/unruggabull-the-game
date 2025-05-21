// PlayerBullet module
import { fireSound } from '../sound.js';
import { projectiles } from './index.js';

export default class PlayerBullet {
  constructor(player) {
    this.type = 'player';
    const direction = player.facing;
    const offsetX = direction === 1 ? player.width - 6 : -6;
    const offsetY = player.crouching ? player.height / 2 : player.height / 2 + 5;
    this.x = player.x + offsetX;
    this.y = player.crouching
      ? player.feetY - player.height + offsetY
      : player.y + offsetY;
    this.vx = 10 * direction;
    this.vy = 0;
    player.muzzleFlashTimer = 3;
    fireSound.currentTime = 0;
    fireSound.play();
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
  }

  draw(ctx) {
    ctx.save();
    ctx.fillStyle = '#ff0';
    ctx.beginPath();
    ctx.arc(this.x, this.y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
} 