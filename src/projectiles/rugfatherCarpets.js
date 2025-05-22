// RugfatherCarpet module
import { projectiles } from './index.js';

const flameCarpetImg = new Image();
flameCarpetImg.src = 'assets/sprites/levels/rugcoAlley/flaming-carpet-Sheet.png';
const PROJECTILE_SPEED = 5;
const PROJECTILE_DAMAGE = 1;
const SUMMON_GROW_DURATION = 300; // ms to grow from 25% to 100%

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
    // Summoning animation
    this.spawnTime = performance.now();
    this.scaleDuration = SUMMON_GROW_DURATION;

    // Play fire swoosh sound
    const fireSwooshSfx = new Audio('assets/audio/sfx/fire-swoosh-whoosh-short.mp3');
    fireSwooshSfx.currentTime = 0;
    fireSwooshSfx.play();
  }

  update() {
    // Delay movement until fully grown
    const now = performance.now();
    const t = Math.min(1, (now - this.spawnTime) / this.scaleDuration);
    if (t < 1) {
      // still growing
      return;
    }
    // Move after growth complete
    this.x += this.vx;
    this.y += this.vy;
  }

  /**
   * Get current scale from 0.25 to 1 over duration
   */
  getScale() {
    const now = performance.now();
    const t = Math.min(1, (now - this.spawnTime) / this.scaleDuration);
    return 0.25 + 0.75 * t;
  }

  /**
   * Get the collision hitbox for the carpet.
   */
  getHitbox() {
    // Base hitbox size
    const baseW = 70;
    const baseH = 50;
    const scale = this.getScale();
    const w = baseW * scale;
    const h = baseH * scale;
    return {
      x: this.x - w / 2,
      y: this.y - h / 2,
      width: w,
      height: h
    };
  }

  draw(ctx, debug) {
    const frameW = this.width;
    const frameH = this.height;
    const scale = this.getScale();
    let frame = 0;
    if (this.hit) {
      frame = 3;
    } else {
      this.frameTimer++;
      frame = Math.floor(this.frameTimer / 6) % 3;
    }
    // Draw with scaling around center
    ctx.save();
    ctx.translate(this.x, this.y);
    // Mirror if moving right (vx>0)
    const sx = this.vx > 0 ? -scale : scale;
    ctx.scale(sx, scale);
    ctx.drawImage(
      this.sprite,
      frame * frameW, 0, frameW, frameH,
      -frameW / 2, -frameH / 2,
      frameW, frameH
    );
    ctx.restore();
    // Debug hitbox outline in global context
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