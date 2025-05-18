// UI module: overlays and HUD

/**
 * Draw the controls intro screen.
 */
export function showControlsScreen(ctx, canvas) {
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.85)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  // Responsive font sizes
  const titleFont = canvas.width > 900 ? 'bold 56px Arial' : 'bold 40px Arial';
  const textFont = canvas.width > 900 ? '32px Arial' : '24px Arial';
  ctx.font = titleFont;
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.fillText('Controls', canvas.width / 2, 120);
  ctx.font = textFont;
  let y = 210;
  const lineHeight = 48;
  ctx.fillText('Move: A / D', canvas.width / 2, y);
  y += lineHeight;
  ctx.fillText('Jump: Space', canvas.width / 2, y);
  y += lineHeight;
  ctx.fillText('Fire: F, J, or Enter', canvas.width / 2, y);
  y += lineHeight;
  ctx.fillText('Press any key to start!', canvas.width / 2, y + 20);
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
  ctx.font = 'bold 32px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  // Button background
  let grad = ctx.createLinearGradient(x, y, x, y + height);
  grad.addColorStop(0, isHover ? '#ffe066' : '#ffd700');
  grad.addColorStop(1, isHover ? '#ffb300' : '#ff9900');
  ctx.fillStyle = grad;
  ctx.strokeStyle = isHover ? '#fffbe6' : '#fff8';
  ctx.lineWidth = isHover ? 5 : 3;
  ctx.shadowColor = isHover ? '#fffbe6' : '#000a';
  ctx.shadowBlur = isHover ? 18 : 8;
  // Rounded rect
  const radius = 18;
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // Button text
  ctx.shadowColor = isHover ? '#fffbe6' : 'transparent';
  ctx.shadowBlur = isHover ? 16 : 0;
  ctx.fillStyle = isHover ? '#222' : '#fff';
  ctx.fillText('Restart', x + width / 2, y + height / 2);
  ctx.restore();
} 