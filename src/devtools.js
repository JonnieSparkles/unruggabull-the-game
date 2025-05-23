// Devtools module: manage developer settings UI and event listeners

// State variables for dev tools
export let showDevSettings = false;
export let showDifficulty = false;
export let DEBUG_HITBOXES = false;
let prevGameState = null;

import * as state from './state.js';
import rugfatherBoss, { BOSS_WIDTH, BOSS_HEIGHT, __bossState } from './levels/rugcoAlley/rugfather.js';
import { player } from './player.js';
import { setCurrentBoss, setBossActive, setBossBattleStarted, setBossTransition, setBossHold, setBossPause, setBlinkingOut, setAutoRunLeft, setBossTriggered, getCurrentLevelKey } from './state.js';
import { skipToBattle, startBossIntro } from './levels/rugcoAlley/rugfatherOrchestrator.js';
import levels from './levels/index.js';
import { MAX_HP } from './levels/rugcoAlley/rugfatherConstants.js';

/**
 * Draw the developer settings overlay.
 */
export function drawDevSettings(ctx, canvas, difficultyLevel) {
  // enlarged overlay
  const overlayWidth = 440;
  const overlayHeight = 380;
  const overlayX = canvas.width/2 - overlayWidth/2;
  const overlayY = canvas.height/2 - overlayHeight/2;
  ctx.save();
  ctx.globalAlpha = 0.95;
  ctx.fillStyle = '#222';
  ctx.fillRect(overlayX, overlayY, overlayWidth, overlayHeight);
  ctx.globalAlpha = 1;
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 3;
  ctx.strokeRect(overlayX, overlayY, overlayWidth, overlayHeight);
  // Title
  ctx.font = 'bold 28px Arial';
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.fillText('Dev Settings', canvas.width/2, overlayY + 40);

  // Start Y for controls
  let y = overlayY + 80;
  const rowH = 36;
  const labelX = overlayX + 40;
  const valueX = overlayX + overlayWidth - 120;
  const btnW = 28, btnH = 28, btnPad = 8;

  // Show Hitboxes checkbox
  ctx.font = '22px Arial';
  ctx.textAlign = 'left';
  ctx.fillText('Show Hitboxes', labelX, y);
  ctx.strokeRect(valueX, y - btnH + 8, btnW, btnH);
  if (DEBUG_HITBOXES) ctx.fillRect(valueX + 2, y - btnH + 10, btnW - 4, btnH - 4);
  y += rowH;

  // Show Difficulty checkbox
  ctx.fillText('Show Difficulty', labelX, y);
  ctx.strokeRect(valueX, y - btnH + 8, btnW, btnH);
  if (showDifficulty) ctx.fillRect(valueX + 2, y - btnH + 10, btnW - 4, btnH - 4);
  y += rowH;

  // Difficulty controls
  ctx.fillText('Difficulty Level:', labelX, y);
  ctx.textAlign = 'center';
  ctx.fillText(difficultyLevel, valueX, y);
  // -/+ buttons
  ctx.strokeRect(valueX + btnW + btnPad, y - btnH + 8, btnW, btnH);
  ctx.fillText('-', valueX + btnW + btnPad + btnW/2, y - btnH + 8 + btnH/2 + 4);
  ctx.strokeRect(valueX + 2*btnW + 2*btnPad, y - btnH + 8, btnW, btnH);
  ctx.fillText('+', valueX + 2*btnW + 2*btnPad + btnW/2, y - btnH + 8 + btnH/2 + 4);
  y += rowH;

  // Kills per Phase
  ctx.textAlign = 'left';
  ctx.font = '20px Arial';
  ctx.fillStyle = '#fff';
  ctx.fillText('Kills per Phase:', labelX, y);
  ctx.textAlign = 'center';
  ctx.font = 'bold 22px Arial';
  ctx.fillStyle = '#ffe066';
  ctx.fillText(state.PHASE_CHANGE_KILL_COUNT, valueX, y);
  // -/+ buttons
  ctx.strokeStyle = '#fff';
  ctx.strokeRect(valueX + btnW + btnPad, y - btnH + 8, btnW, btnH);
  ctx.fillStyle = '#fff';
  ctx.fillText('-', valueX + btnW + btnPad + btnW/2, y - btnH + 8 + btnH/2 + 4);
  ctx.strokeRect(valueX + 2*btnW + 2*btnPad, y - btnH + 8, btnW, btnH);
  ctx.fillText('+', valueX + 2*btnW + 2*btnPad + btnW/2, y - btnH + 8 + btnH/2 + 4);
  y += rowH;

  // Player health controls
  ctx.textAlign = 'left';
  ctx.font = '20px Arial';
  ctx.fillStyle = '#fff';
  ctx.fillText('Player Health:', labelX, y);
  ctx.textAlign = 'center';
  ctx.fillText(player.health, valueX, y);
  ctx.strokeRect(valueX + btnW + btnPad, y - btnH + 8, btnW, btnH);
  ctx.fillText('-', valueX + btnW + btnPad + btnW/2, y - btnH + 8 + btnH/2 + 4);
  ctx.strokeRect(valueX + 2*btnW + 2*btnPad, y - btnH + 8, btnW, btnH);
  ctx.fillText('+', valueX + 2*btnW + 2*btnPad + btnW/2, y - btnH + 8 + btnH/2 + 4);
  y += rowH;

  // Boss health controls
  ctx.textAlign = 'left';
  ctx.fillText('Boss Health:', labelX, y);
  ctx.textAlign = 'center';
  const bossHp = __bossState ? __bossState.hp : 0;
  ctx.fillText(bossHp, valueX, y);
  ctx.strokeRect(valueX + btnW + btnPad, y - btnH + 8, btnW, btnH);
  ctx.fillText('-', valueX + btnW + btnPad + btnW/2, y - btnH + 8 + btnH/2 + 4);
  ctx.strokeRect(valueX + 2*btnW + 2*btnPad, y - btnH + 8, btnW, btnH);
  ctx.fillText('+', valueX + 2*btnW + 2*btnPad + btnW/2, y - btnH + 8 + btnH/2 + 4);
  y += rowH;

  // --- Boss Shortcuts ---
  ctx.font = 'bold 20px Arial';
  ctx.fillStyle = '#ffe066';
  ctx.textAlign = 'center';
  y += 20;
  ctx.fillStyle = '#444';
  ctx.fillRect(canvas.width/2 - 120, y, 110, 36);
  ctx.fillStyle = '#ffe066';
  ctx.fillText('Boss Intro', canvas.width/2 - 65, y + 25);
  ctx.fillStyle = '#444';
  ctx.fillRect(canvas.width/2 + 10, y, 110, 36);
  ctx.fillStyle = '#ffe066';
  ctx.fillText('Boss Battle', canvas.width/2 + 65, y + 25);
  // Close 'X' button (top right, visually aligned)
  const closeW = 30, closeH = 30;
  const closeX = overlayX + overlayWidth - closeW - 8;
  const closeY = overlayY + 8;
  ctx.font = 'bold 28px Arial';
  ctx.fillStyle = '#ffe066';
  ctx.textAlign = 'center';
  ctx.fillText('×', closeX + closeW/2, closeY + closeH/2 + 2);
  ctx.restore();
}

/**
 * Initialize dev tools: keyboard and mouse listeners.
 */
export function setupDevTools(canvas, draw, gameLoop, increaseDifficulty, decreaseDifficulty, getGameState, setGameState) {
  // Toggle dev settings with Ctrl+Shift+Q
  document.addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.shiftKey && (e.key === 'q' || e.key === 'Q')) {
      // Toggle dev settings overlay and pause/unpause game uniformly
      if (!showDevSettings) {
        prevGameState = getGameState();
        showDevSettings = true;
        setGameState('paused-dev');
        draw();
      } else {
        showDevSettings = false;
        setGameState(prevGameState || 'playing');
        prevGameState = null;
        gameLoop();
      }
    }
  });

  // Handle clicks within the dev settings overlay
  canvas.addEventListener('click', function(e) {
    if (!showDevSettings) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    // Overlay layout variables (must match drawDevSettings)
    const overlayWidth = 440;
    const overlayHeight = 380;
    const overlayX = canvas.width/2 - overlayWidth/2;
    const overlayY = canvas.height/2 - overlayHeight/2;
    let y = overlayY + 80;
    const rowH = 36;
    const labelX = overlayX + 40;
    const valueX = overlayX + overlayWidth - 120;
    const btnW = 28, btnH = 28, btnPad = 8;
    // Close button (top right of overlay)
    const closeW = 30, closeH = 30;
    const closeX = overlayX + overlayWidth - closeW - 8;
    const closeY = overlayY + 8;
    if (mx >= closeX && mx <= closeX + closeW && my >= closeY && my <= closeY + closeH) {
      showDevSettings = false;
      if (getGameState() === 'paused-dev') {
        setGameState(prevGameState || 'playing');
        prevGameState = null;
        gameLoop();
      } else {
        draw();
      }
      return;
    }
    // Show Hitboxes checkbox
    if (mx >= valueX && mx <= valueX + btnW && my >= y - btnH + 8 && my <= y - btnH + 8 + btnH) {
      DEBUG_HITBOXES = !DEBUG_HITBOXES;
      draw();
      return;
    }
    y += rowH;
    // Show Difficulty checkbox
    if (mx >= valueX && mx <= valueX + btnW && my >= y - btnH + 8 && my <= y - btnH + 8 + btnH) {
      showDifficulty = !showDifficulty;
      draw();
      return;
    }
    y += rowH;
    // Difficulty Level -/+
    if (mx >= valueX + btnW + btnPad && mx <= valueX + 2*btnW + btnPad && my >= y - btnH + 8 && my <= y - btnH + 8 + btnH) {
      decreaseDifficulty();
      draw();
      return;
    }
    if (mx >= valueX + 2*btnW + 2*btnPad && mx <= valueX + 3*btnW + 2*btnPad && my >= y - btnH + 8 && my <= y - btnH + 8 + btnH) {
      increaseDifficulty();
      draw();
      return;
    }
    y += rowH;
    // Kills per Phase -/+
    if (mx >= valueX + btnW + btnPad && mx <= valueX + 2*btnW + btnPad && my >= y - btnH + 8 && my <= y - btnH + 8 + btnH) {
      if (state.PHASE_CHANGE_KILL_COUNT > 1) {
        state.setPhaseChangeKillCount(state.PHASE_CHANGE_KILL_COUNT - 1);
        draw();
      }
      return;
    }
    if (mx >= valueX + 2*btnW + 2*btnPad && mx <= valueX + 3*btnW + 2*btnPad && my >= y - btnH + 8 && my <= y - btnH + 8 + btnH) {
      state.setPhaseChangeKillCount(state.PHASE_CHANGE_KILL_COUNT + 1);
      draw();
      return;
    }
    y += rowH;
    // Player Health -/+
    if (mx >= valueX + btnW + btnPad && mx <= valueX + 2*btnW + btnPad && my >= y - btnH + 8 && my <= y - btnH + 8 + btnH) {
      if (player.health > 0) player.health--;
      draw();
      return;
    }
    if (mx >= valueX + 2*btnW + 2*btnPad && mx <= valueX + 3*btnW + 2*btnPad && my >= y - btnH + 8 && my <= y - btnH + 8 + btnH) {
      player.health++;
      draw();
      return;
    }
    y += rowH;
    // Boss Health -/+
    if (mx >= valueX + btnW + btnPad && mx <= valueX + 2*btnW + btnPad && my >= y - btnH + 8 && my <= y - btnH + 8 + btnH) {
      __bossState.hp = Math.max(0, (__bossState.hp || 0) - 1);
      draw();
      return;
    }
    if (mx >= valueX + 2*btnW + 2*btnPad && mx <= valueX + 3*btnW + 2*btnPad && my >= y - btnH + 8 && my <= y - btnH + 8 + btnH) {
      __bossState.hp = Math.min(MAX_HP, (__bossState.hp || 0) + 1);
      draw();
      return;
    }
    y += rowH;
    y += 20;
    // Boss Shortcuts
    // Boss Intro button
    if (mx >= canvas.width/2 - 120 && mx <= canvas.width/2 - 10 && my >= y && my <= y + 36) {
      showDevSettings = false;
      window.startGame();
      setBossTriggered(true);
      setGameState('playing');
      startBossIntro();
      gameLoop();
      return;
    }
    // Boss Battle button
    if (mx >= canvas.width/2 + 10 && mx <= canvas.width/2 + 120 && my >= y && my <= y + 36) {
      showDevSettings = false;
      window.startGame();
      setBossTriggered(true);
      setGameState('playing');
      startBossIntro();
      skipToBattle();
      gameLoop();
      return;
    }
  });
}
