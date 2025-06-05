// Level 1: Rugco Alley background
import * as state from '../../state.js';
const getBackgroundFlickerMode = state.getBackgroundFlickerMode;
// Level background sprite sheet (multiple frames)
const bgSprite = new Image();
bgSprite.src = 'assets/sprites/levels/rugcoAlley/background-rugcoAlley.png';

// Export sprite and frame constants for manual draw
export { bgSprite, FIRST_FLICKER_FRAMES, TRANSITION_FRAMES };

// Constants for animation frames
const TOTAL_FRAMES = 10;
const FIRST_FLICKER_FRAMES = 2;
const TRANSITION_FRAMES = TOTAL_FRAMES - FIRST_FLICKER_FRAMES; // 8 frames
// Separate durations for opening vs. closing the garage door
const OPEN_TRANSITION_DURATION = 13000;  // ms for garage opening
const CLOSE_TRANSITION_DURATION = 6000;  // ms for garage closing (adjust as needed)

// Ember system (hybrid: always on, intensifies with boss phase)
const embers = [];

function spawnEmber(phase, canvas) {
  // Subtle, pixel-style, only orange/red, very few embers
  let count = phase === 1 ? 0.1 : phase === 2 ? 0.2 : 0.4; // even fewer
  if (Math.random() > count) return;
  // Only spawn one ember per call
  const color = Math.random() < 0.5 ? '#ff6a00' : '#c22a00'; // orange or red
  embers.push({
    x: Math.floor(Math.random() * canvas.width),
    y: -2,
    vy: 0.8 + Math.random() * (phase === 3 ? 1.2 : 0.6), // moderate fall
    vx: 0, // no drift
    alpha: 0.7 + Math.random() * 0.3, // vibrant
    size: 1 + Math.floor(Math.random() * 2), // 1-2px, more pixel-like
    color,
    life: 4000 + Math.random() * 1000,
    born: performance.now(),
    phase
  });
}

function drawAndUpdateEmbers(ctx, canvas, phase, now) {
  spawnEmber(phase, canvas);
  if (embers.length > 200) embers.splice(0, embers.length - 200);
  for (let i = embers.length - 1; i >= 0; i--) {
    const e = embers[i];
    const age = now - e.born;
    if (age > e.life || e.y > canvas.height + 2) {
      embers.splice(i, 1);
      continue;
    }
    const fade = 1 - age / e.life;
    // Flicker: modulate alpha with a fast sine wave
    const flicker = 0.8 + 0.2 * Math.sin(now / 60 + e.x * 0.5);
    ctx.save();
    ctx.globalAlpha = e.alpha * fade * flicker;
    ctx.fillStyle = e.color;
    ctx.fillRect(Math.round(e.x), Math.round(e.y), e.size, e.size);
    ctx.restore();
    e.y += e.vy;
    e.x += e.vx;
  }
}

export default function drawRugcoBackground(ctx, canvas) {
  const now = performance.now();
  let phase = 1;
  try {
    const bossActive = state.getBossBattleStarted && state.getBossBattleStarted();
    if (bossActive && state.getCurrentBoss && state.getCurrentBoss()) {
      phase = state.getCurrentBoss().phase || 1;
    }
  } catch (e) {}
  // During boss exit door closing: reverse of opening frames
  if (state.getBossExitDoorClosing()) {
    const elapsed = now - state.getBossExitDoorStartTime();
    const framesToCycle = TOTAL_FRAMES;
    const transitionDuration = CLOSE_TRANSITION_DURATION;
    const interval = transitionDuration / framesToCycle;
    let idx = Math.floor(elapsed / interval);
    if (idx >= framesToCycle) idx = framesToCycle - 1;
    const frameIndex = framesToCycle - 1 - idx;
    ctx.drawImage(
      bgSprite,
      frameIndex * canvas.width, 0,
      canvas.width, canvas.height,
      0, 0,
      canvas.width, canvas.height
    );
    drawAndUpdateEmbers(ctx, canvas, phase, now);
    // Once closing animation is done, proceed to congrats
    if (elapsed > transitionDuration) {
      state.setBossExitDoorClosing(false);
      // Transition to congrats and clear boss so it doesn't linger
      state.setGameState('congrats');
      state.setCongratsStartTime(performance.now());
      state.setBossActive(false);
      state.setCurrentBoss(null);
    }
    return;
  }
  // During boss transition: hold first two flicker frames, then cycle opening frames
  if (state.getBossTransition()) {
    const elapsed = now - state.getBossTransitionStartTime();
    const initialHold = 2000; // ms to hold flicker before full opening
    if (elapsed < initialHold) {
      // Flicker between first two frames at original rate
      const flickerInterval = 1000 / 1.5;
      const fiIdx = Math.floor(now / flickerInterval) % FIRST_FLICKER_FRAMES;
      ctx.drawImage(
        bgSprite,
        fiIdx * canvas.width, 0,
        canvas.width, canvas.height,
        0, 0,
        canvas.width, canvas.height
      );
      drawAndUpdateEmbers(ctx, canvas, phase, now);
      return;
    } else {
      // Cycle remaining frames over the rest of the transition
      const framesToCycle = TRANSITION_FRAMES; // 8 frames
      const transitionDuration = OPEN_TRANSITION_DURATION; // total ms for opening
      const cycleDuration = transitionDuration - initialHold;
      const interval = cycleDuration / framesToCycle;
      let idx = Math.floor((elapsed - initialHold) / interval);
      if (idx >= framesToCycle) idx = framesToCycle - 1;
      const frameIndex = FIRST_FLICKER_FRAMES + idx;
      ctx.drawImage(
        bgSprite,
        frameIndex * canvas.width, 0,
        canvas.width, canvas.height,
        0, 0,
        canvas.width, canvas.height
      );
      drawAndUpdateEmbers(ctx, canvas, phase, now);
      return;
    }
  }
  // Timeline-driven background flicker mode
  const flickerMode = getBackgroundFlickerMode();
  if (flickerMode === 'doorOpenFlicker') {
    const lastA = FIRST_FLICKER_FRAMES + TRANSITION_FRAMES - 2;
    const lastB = FIRST_FLICKER_FRAMES + TRANSITION_FRAMES - 1;
    const flickerInterval = 500;
    const frameFlip = Math.floor(now / flickerInterval) % 2;
    const frameIndex = frameFlip === 0 ? lastA : lastB;
    ctx.drawImage(
      bgSprite,
      frameIndex * canvas.width, 0,
      canvas.width, canvas.height,
      0, 0,
      canvas.width, canvas.height
    );
    drawAndUpdateEmbers(ctx, canvas, phase, now);
    return;
  }
  // During bossPause, flicker between frames 1 and 2 (indexes 0 and 1)
  if (state.getBossPause()) {
    const flickerInterval = 1000 / 1.5;
    const frameIndex = Math.floor(now / flickerInterval) % 2;
    ctx.drawImage(
      bgSprite,
      frameIndex * canvas.width, 0,
      canvas.width, canvas.height,
      0, 0,
      canvas.width, canvas.height
    );
    drawAndUpdateEmbers(ctx, canvas, phase, now);
    return;
  }
  // Default flicker between frames 1-2 (indexes 0-1) at 1.5Hz
  const flickerInterval = 1000 / 1.5; // ~666ms
  const frameIndex = Math.floor(now / flickerInterval) % 2;
  ctx.drawImage(
    bgSprite,
    frameIndex * canvas.width, 0,
    canvas.width, canvas.height,
    0, 0,
    canvas.width, canvas.height
  );
  drawAndUpdateEmbers(ctx, canvas, phase, now);
} 