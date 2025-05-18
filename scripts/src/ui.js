// UI module: overlays and HUD

/**
 * Draw the controls intro screen.
 */
export function showControlsScreen(ctx, canvas) {
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.85)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.font = 'bold 40px Arial';
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.fillText('Controls', canvas.width / 2, 80);
  ctx.font = '28px Arial';
  ctx.fillText('Move: A/D', canvas.width / 2, 140);
  ctx.fillText('Jump: Space', canvas.width / 2, 180);
  ctx.fillText('Fire: F, J, or Enter', canvas.width / 2, 220);
  ctx.fillText('Press any key to start!', canvas.width / 2, 300);
  ctx.restore();
}

/**
 * Draw player's health in the top-left.
 */
export function drawHealth(ctx, health) {
  ctx.save();
  ctx.font = '24px Arial';
  ctx.fillStyle = '#f44';
  ctx.textAlign = 'left';
  ctx.fillText(`Health: ${health}`, 20, 40);
  ctx.restore();
}

/**
 * Draw kill counter in the top-center.
 */
export function drawKillCounter(ctx, killCount, canvasWidth) {
  ctx.save();
  ctx.font = '28px Arial';
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.fillText(`Unrugged: ${killCount}`, canvasWidth / 2, 40);
  ctx.restore();
}

/**
 * Draw difficulty level below kill counter when toggled.
 */
export function drawDifficulty(ctx, difficultyLevel, canvasWidth) {
  ctx.save();
  ctx.font = '24px Arial';
  ctx.fillStyle = '#0ff';
  ctx.textAlign = 'center';
  ctx.fillText(`Difficulty: ${difficultyLevel}`, canvasWidth / 2, 70);
  ctx.restore();
}

/**
 * Draw the game over message overlay.
 */
export function drawGameOver(ctx, canvas) {
  ctx.save();
  ctx.font = 'bold 45px Arial';
  ctx.textAlign = 'center';
  ctx.shadowColor = '#000';
  ctx.shadowBlur = 12;
  ctx.lineWidth = 8;
  ctx.strokeStyle = '#fff';
  ctx.strokeText('Game over! You got rugged!', canvas.width / 2, canvas.height / 2);
  ctx.fillStyle = '#f44';
  ctx.shadowBlur = 0;
  ctx.fillText('Game over! You got rugged!', canvas.width / 2, canvas.height / 2);
  ctx.restore();
}

/**
 * Draw the restart button with hover effect.
 */
export function drawRestartButton(ctx, canvas, restartButton, isHover) {
  const { x, y, width, height } = restartButton;
  ctx.save();
  ctx.font = '32px Arial';
  ctx.textAlign = 'center';
  if (isHover) {
    ctx.save();
    ctx.translate(x + width / 2, y + height / 2);
    ctx.scale(1.08, 1.15);
    ctx.fillStyle = '#666';
    ctx.strokeStyle = '#ff0';
    ctx.lineWidth = 5;
    ctx.fillRect(-width / 2, -height / 2, width, height);
    ctx.strokeRect(-width / 2, -height / 2, width, height);
    ctx.fillStyle = '#ff0';
    ctx.fillText('Restart', 0, 12);
    ctx.restore();
  } else {
    ctx.fillStyle = '#222';
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    ctx.fillRect(x, y, width, height);
    ctx.strokeRect(x, y, width, height);
    ctx.fillStyle = '#fff';
    ctx.fillText('Restart', canvas.width / 2, y + height - 12);
  }
  ctx.restore();
} 