// RugfatherCarpet module
import { projectiles } from './index.js';

const flameCarpetImg = new Image();
flameCarpetImg.src = 'assets/sprites/levels/rugcoAlley/flaming-carpet-Sheet.png';
const PROJECTILE_HP = 2;
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
    // projectile health and flash timer for first hit
    this.hp = PROJECTILE_HP;
    this.flashEndTime = 0;
    // Summoning animation
    this.spawnTime = performance.now();
    this.scaleDuration = SUMMON_GROW_DURATION;
    // Trail effect
    this.trail = [{ x: x, y: y, time: performance.now() }];

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
    // Trail effect: add new position and keep only recent
    this.trail.push({ x: this.x, y: this.y, time: now });
    this.trail = this.trail.filter(point => now - point.time < 300);
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
    // Determine flash state
    const now = performance.now();
    const flashActive = now < this.flashEndTime;
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
    // Draw fire-like trail
    const nowTrail = performance.now();
    for (const point of this.trail) {
      const age = nowTrail - point.time;
      const fade = 1 - age / 300;
      // Flicker: random offset for fire effect
      const flickerX = (Math.random() - 0.5) * 6 * fade;
      const flickerY = (Math.random() - 0.5) * 6 * fade;
      // Color and size based on age
      let color, radius, alpha;
      if (fade > 0.7) {
        color = 'rgba(255,255,180,1)'; // white-yellow, hottest
        radius = 13 * fade;
        alpha = 0.25 * fade;
      } else if (fade > 0.4) {
        color = 'rgba(255,180,40,1)'; // orange-yellow
        radius = 10 * fade;
        alpha = 0.18 * fade;
      } else {
        color = 'rgba(255,60,0,1)'; // red-orange, coolest
        radius = 7 * fade;
        alpha = 0.10 * fade;
      }
      // Outer glow
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(point.x + flickerX, point.y + flickerY, Math.max(radius * 1.5, 1), 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 16;
      ctx.fill();
      ctx.restore();
      // Inner core
      ctx.save();
      ctx.globalAlpha = alpha * 1.5;
      ctx.beginPath();
      ctx.arc(point.x + flickerX, point.y + flickerY, Math.max(radius * 0.7, 1), 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 4;
      ctx.fill();
      ctx.restore();
    }
    // Draw with scaling around center
    ctx.save();
    // apply flash effect if first hit occurred
    if (flashActive) ctx.filter = 'brightness(2)';
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
    // restore filter
    ctx.filter = 'none';
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