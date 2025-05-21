// Devtools module: manage developer settings UI and event listeners

// State variables for dev tools
export let showDevSettings = false;
export let showDifficulty = false;
export let DEBUG_HITBOXES = false;
let prevGameState = null;

import * as state from './state.js';
import rugfatherBoss, { bossState } from './levels/rugcoAlley/rugfather.js';
import { player } from './player.js';
import { setCurrentBoss, setBossActive, setBossBattleStarted, setBossTransition, setBossHold, setBossPause, setBlinkingOut, setAutoRunLeft } from './state.js';
import { skipToBattle } from './levels/rugcoAlley/rugfatherOrchestrator.js';

/**
 * Draw the developer settings overlay.
 */
export function drawDevSettings(ctx, canvas, difficultyLevel) {
  // translucent background
  ctx.save();
  ctx.globalAlpha = 0.95;
  ctx.fillStyle = '#222';
  ctx.fillRect(canvas.width/2 - 180, canvas.height/2 - 80, 360, 260);
  ctx.globalAlpha = 1;
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 3;
  ctx.strokeRect(canvas.width/2 - 180, canvas.height/2 - 80, 360, 260);
  // Title
  ctx.font = 'bold 28px Arial';
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.fillText('Dev Settings', canvas.width/2, canvas.height/2 - 40);
  // Show Hitboxes checkbox
  ctx.font = '22px Arial';
  ctx.textAlign = 'left';
  ctx.fillText('Show Hitboxes', canvas.width/2 - 120, canvas.height/2 + 10);
  const cbx = canvas.width/2 + 60;
  const cby = canvas.height/2 - 10;
  const cbw = 28;
  const cbh = 28;
  ctx.strokeRect(cbx, cby, cbw, cbh);
  if (DEBUG_HITBOXES) ctx.fillRect(cbx + 2, cby + 2, cbw - 4, cbh - 4);
  // Show Difficulty checkbox
  ctx.fillText('Show Difficulty', canvas.width/2 - 120, canvas.height/2 + 50);
  const dbx = canvas.width/2 + 60;
  const dby = canvas.height/2 + 30;
  ctx.strokeRect(dbx, dby, cbw, cbh);
  if (showDifficulty) ctx.fillRect(dbx + 2, dby + 2, cbw - 4, cbh - 4);
  // Difficulty controls
  ctx.fillText(`Difficulty Level: ${difficultyLevel}`, canvas.width/2 - 120, canvas.height/2 + 90);
  const btnSize = 24;
  const minusX = canvas.width/2 + 60;
  const minusY = canvas.height/2 + 74;
  ctx.strokeRect(minusX, minusY, btnSize, btnSize);
  ctx.textAlign = 'center';
  ctx.fillText('-', minusX + btnSize/2, minusY + btnSize/2 + 4);
  const plusX = minusX + btnSize + 10;
  ctx.strokeRect(plusX, minusY, btnSize, btnSize);
  ctx.fillText('+', plusX + btnSize/2, minusY + btnSize/2 + 4);
  // Kill count requirement controls
  ctx.textAlign = 'left';
  ctx.font = '20px Arial';
  ctx.fillStyle = '#fff';
  ctx.fillText('Kills per Phase:', canvas.width/2 - 120, canvas.height/2 + 130);
  ctx.textAlign = 'center';
  ctx.font = 'bold 22px Arial';
  ctx.fillStyle = '#ffe066';
  ctx.fillText(state.PHASE_CHANGE_KILL_COUNT, canvas.width/2 + 40, canvas.height/2 + 130);
  // Small +/- buttons for kill count
  const kcBtnSize = 20;
  const kcMinusX = canvas.width/2 + 80;
  const kcY = canvas.height/2 + 115;
  ctx.strokeStyle = '#fff';
  ctx.strokeRect(kcMinusX, kcY, kcBtnSize, kcBtnSize);
  ctx.fillStyle = '#fff';
  ctx.fillText('-', kcMinusX + kcBtnSize/2, kcY + kcBtnSize/2 + 4);
  const kcPlusX = kcMinusX + kcBtnSize + 8;
  ctx.strokeRect(kcPlusX, kcY, kcBtnSize, kcBtnSize);
  ctx.fillText('+', kcPlusX + kcBtnSize/2, kcY + kcBtnSize/2 + 4);
  // --- Boss Shortcuts ---
  ctx.font = 'bold 20px Arial';
  ctx.fillStyle = '#ffe066';
  ctx.textAlign = 'center';
  const bossIntroBtnY = canvas.height/2 + 170;
  ctx.fillStyle = '#444';
  ctx.fillRect(canvas.width/2 - 120, bossIntroBtnY, 110, 36);
  ctx.fillStyle = '#ffe066';
  ctx.fillText('Boss Intro', canvas.width/2 - 65, bossIntroBtnY + 25);
  ctx.fillStyle = '#444';
  ctx.fillRect(canvas.width/2 + 10, bossIntroBtnY, 110, 36);
  ctx.fillStyle = '#ffe066';
  ctx.fillText('Boss Battle', canvas.width/2 + 65, bossIntroBtnY + 25);
  // Close 'X' button
  const closeX = canvas.width/2 + 140;
  const closeY = canvas.height/2 - 70;
  ctx.font = 'bold 28px Arial';
  ctx.fillText('×', closeX + 15, closeY + 25);
  ctx.restore();
}

/**
 * Initialize dev tools: keyboard and mouse listeners.
 */
export function setupDevTools(canvas, draw, gameLoop, increaseDifficulty, decreaseDifficulty, getGameState, setGameState) {
  // Toggle dev settings with Ctrl+Shift+Q
  document.addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.shiftKey && (e.key === 'q' || e.key === 'Q')) {
      const gs = getGameState();
      if (!showDevSettings && (gs === 'playing' || gs === 'dying')) {
        prevGameState = gs;
        showDevSettings = true;
        setGameState('paused-dev');
        draw();
      } else if (showDevSettings && gs === 'paused-dev') {
        showDevSettings = false;
        setGameState(prevGameState || 'playing');
        prevGameState = null;
        gameLoop();
      } else {
        // Toggle overlay from any other state (including 'start')
        showDevSettings = !showDevSettings;
        // If on title screen, hide title UI and show canvas overlay
        if (gs === 'start') {
          const title = document.getElementById('title-container');
          if (title) title.style.display = showDevSettings ? 'none' : '';
          // Adjust canvas style
          if (showDevSettings) {
            canvas.style.opacity = '1';
            canvas.style.zIndex = '999';
          } else {
            canvas.style.opacity = '0';
            canvas.style.zIndex = '1';
          }
        }
        draw();
      }
    }
  });

  // Handle clicks within the dev settings overlay
  canvas.addEventListener('click', function(e) {
    if (!showDevSettings) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    // Hitboxes checkbox
    const cbx = canvas.width/2 + 60, cby = canvas.height/2 - 10, cbw = 28, cbh = 28;
    if (mx >= cbx && mx <= cbx + cbw && my >= cby && my <= cby + cbh) {
      DEBUG_HITBOXES = !DEBUG_HITBOXES;
      draw();
      return;
    }
    // Difficulty toggle checkbox
    const dbx = canvas.width/2 + 60, dby = canvas.height/2 + 30;
    if (mx >= dbx && mx <= dbx + cbw && my >= dby && my <= dby + cbh) {
      showDifficulty = !showDifficulty;
      draw();
      return;
    }
    // Decrease difficulty button
    const minusX = canvas.width/2 + 60, minusY = canvas.height/2 + 74, btnSize = 24;
    if (mx >= minusX && mx <= minusX + btnSize && my >= minusY && my <= minusY + btnSize) {
      decreaseDifficulty();
      draw();
      return;
    }
    // Increase difficulty button
    const plusX = minusX + btnSize + 10;
    if (mx >= plusX && mx <= plusX + btnSize && my >= minusY && my <= minusY + btnSize) {
      increaseDifficulty();
      draw();
      return;
    }
    // Kill count requirement -
    const kcBtnSize = 20;
    const kcMinusX = canvas.width/2 + 80, kcY = canvas.height/2 + 115;
    const kcPlusX = kcMinusX + kcBtnSize + 8;
    if (mx >= kcMinusX && mx <= kcMinusX + kcBtnSize && my >= kcY && my <= kcY + kcBtnSize) {
      if (state.PHASE_CHANGE_KILL_COUNT > 1) {
        state.setPhaseChangeKillCount(state.PHASE_CHANGE_KILL_COUNT - 1);
        draw();
      }
      return;
    }
    // Kill count requirement +
    if (mx >= kcPlusX && mx <= kcPlusX + kcBtnSize && my >= kcY && my <= kcY + kcBtnSize) {
      state.setPhaseChangeKillCount(state.PHASE_CHANGE_KILL_COUNT + 1);
      draw();
      return;
    }
    // --- Boss Shortcuts Clicks ---
    const bossIntroBtnY = canvas.height/2 + 170;
    // Boss Intro button
    if (mx >= canvas.width/2 - 120 && mx <= canvas.width/2 - 10 && my >= bossIntroBtnY && my <= bossIntroBtnY + 36) {
      // Initialize level as if starting game, then go straight to playing
      showDevSettings = false;
      window.startGame();
      setGameState('playing');
      // Set up boss intro
      setCurrentBoss(rugfatherBoss);
      setBossActive(true);
      rugfatherBoss.spawn();
      // Resume main game loop
      gameLoop();
      return;
    }
    // Boss Battle button
    if (mx >= canvas.width/2 + 10 && mx <= canvas.width/2 + 120 && my >= bossIntroBtnY && my <= bossIntroBtnY + 36) {
      // Initialize level and go straight to playing
      showDevSettings = false;
      window.startGame();
      setGameState('playing');
      setCurrentBoss(rugfatherBoss);
      setBossActive(true);
      // Spawn boss intro timeline
      rugfatherBoss.spawn();
      setAutoRunLeft(false);
      skipToBattle();
      // Resume main game loop in battle state
      gameLoop();
      return;
    }
    // Close 'X' button
    const closeX = canvas.width/2 + 140, closeY = canvas.height/2 - 70, closeW = 30, closeH = 30;
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
  });
}
