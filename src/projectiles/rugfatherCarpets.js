// RugfatherCarpet module
import { projectiles } from './index.js';

const flameCarpetImg = new Image();
flameCarpetImg.src = 'assets/sprites/levels/rugcoAlley/flaming-carpet-Sheet.png';
const PROJECTILE_SPEED = 5;
const PROJECTILE_DAMAGE = 1;

export default class RugfatherCarpet {
  constructor(x, y) {
    this.type = 'boss';
    this.x = x;
    this.y = y;
    this.vx = -PROJECTILE_SPEED;
    this.vy = 0;
    this.sprite = flameCarpetImg;
    this.width = 128;
    this.height = 128;
    this.damage = PROJECTILE_DAMAGE;
    this.frameTimer = 0;
    this.hit = false;
    // Play fire swoosh sound
    const fireSwooshSfx = new Audio('assets/audio/sfx/fire-swoosh-whoosh-short.mp3');
    fireSwooshSfx.currentTime = 0;
    fireSwooshSfx.play();
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
  }

  /**
   * Get the collision hitbox for the carpet.
   */
  getHitbox() {
    // 60px wide, 40px tall, centered on (x, y)
    const hitboxWidth = 70;
    const hitboxHeight = 50;
    return {
      x: this.x - hitboxWidth / 2,
      y: this.y - hitboxHeight / 2,
      width: hitboxWidth,
      height: hitboxHeight
    };
  }

  draw(ctx, debug) {
    const frameW = this.width;
    const frameH = this.height;
    let frame = 0;
    if (this.hit) {
      frame = 3;
    } else {
      this.frameTimer++;
      frame = Math.floor(this.frameTimer / 6) % 3;
    }
    ctx.drawImage(
      this.sprite,
      frame * frameW, 0, frameW, frameH,
      this.x - frameW / 2, this.y - frameH / 2,
      frameW, frameH
    );
    if (debug) {
      const hb = this.getHitbox();
      ctx.save();
      ctx.strokeStyle = 'orange';
      ctx.lineWidth = 2;
      ctx.strokeRect(hb.x, hb.y, hb.width, hb.height);
      ctx.restore();
    }
  }
} 