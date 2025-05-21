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

export default function drawRugcoBackground(ctx, canvas) {
  const now = performance.now();
  // During boss exit door closing: reverse of opening frames
  if (state.getBossExitDoorClosing()) {
    const elapsed = now - state.getBossExitDoorStartTime();
    const framesToCycle = TRANSITION_FRAMES;
    const transitionDuration = 13000;
    const interval = transitionDuration / framesToCycle;
    let idx = Math.floor(elapsed / interval);
    if (idx >= framesToCycle) idx = framesToCycle - 1;
    const frameIndex = FIRST_FLICKER_FRAMES + (framesToCycle - 1 - idx);
    ctx.drawImage(
      bgSprite,
      frameIndex * canvas.width, 0,
      canvas.width, canvas.height,
      0, 0,
      canvas.width, canvas.height
    );
    // Once closing animation is done, proceed to congrats
    if (elapsed > transitionDuration) {
      state.setBossExitDoorClosing(false);
      state.setGameState('congrats');
      state.setCongratsStartTime(performance.now());
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
    } else {
      // Cycle remaining frames over the rest of the transition
      const framesToCycle = TRANSITION_FRAMES; // 8 frames
      const transitionDuration = 13000; // total ms for opening
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
    }
    return;
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
} 