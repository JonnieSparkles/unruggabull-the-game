// Level 1: Rugco Alley background
// Level background sprite sheet for flicker (2 frames)
const bgSprite = new Image();
bgSprite.src = 'assets/sprites/levels/rugcoAlley/background.png';

export default function drawRugcoBackground(ctx, canvas) {
  // Flicker between frames at 1.5Hz
  const now = performance.now();
  const interval = 1000 / 1.5; // ~666.67ms per frame
  const frame = Math.floor(now / interval) % 2;
  ctx.drawImage(
    bgSprite,
    frame * canvas.width, 0,
    canvas.width, canvas.height,
    0, 0,
    canvas.width, canvas.height
  );
} 