// Level 1: Rugco Alley background
import * as state from '../../state.js';
// Level background sprite sheet (multiple frames)
const bgSprite = new Image();
bgSprite.src = 'assets/sprites/levels/rugcoAlley/background-rugcoAlley.png';

export default function drawRugcoBackground(ctx, canvas) {
  const now = performance.now();
  // During boss exit door closing, play reverse of opening frames
  if (state.bossExitDoorClosing) {
    const elapsed = now - state.bossExitDoorStartTime;
    const framesToCycle = 6;
    const transitionDuration = 13000;
    const interval = transitionDuration / framesToCycle;
    let idx = Math.floor(elapsed / interval);
    if (idx >= framesToCycle) idx = framesToCycle - 1;
    const startIndex = 2;
    const frameIndex = startIndex + (framesToCycle - 1 - idx);
    ctx.drawImage(
      bgSprite,
      frameIndex * canvas.width, 0,
      canvas.width, canvas.height,
      0, 0,
      canvas.width, canvas.height
    );
    // Once closing animation is done, show congrats
    if (elapsed > transitionDuration) {
      state.setBossExitDoorClosing(false);
      state.setGameState('congrats');
      state.setCongratsStartTime(performance.now());
    }
    return;
  }
  // During boss transition, cycle frames 3-8 (using indexes 1-6)
  if (state.bossTransition) {
    const elapsed = now - state.bossTransitionStartTime;
    const framesToCycle = 6; // total frames to display
    const transitionDuration = 13000; // ms for full cycle
    const interval = transitionDuration / framesToCycle;
    let idx = Math.floor(elapsed / interval);
    if (idx >= framesToCycle) idx = framesToCycle - 1;
    const startIndex = 2; // start from third frame (index 2)
    const frameIndex = startIndex + idx;
    ctx.drawImage(
      bgSprite,
      frameIndex * canvas.width, 0,
      canvas.width, canvas.height,
      0, 0,
      canvas.width, canvas.height
    );
    return;
  }
  // If boss is active, hold on final transition frame (index startIndex+framesToCycle-1)
  if (state.bossActive) {
    const startIndex = 2;
    const framesToCycle = 6;
    const finalFrameIndex = startIndex + framesToCycle - 1;
    ctx.drawImage(
      bgSprite,
      finalFrameIndex * canvas.width, 0,
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