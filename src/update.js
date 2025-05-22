// Update module: game tick logic
import { keys } from './input.js';
import { player, updatePlayerInput, getHitbox } from './player.js';
import { platforms, handlePhysics } from './physics.js';
import { projectiles, updateProjectiles, spawnPlayerBullet } from './projectiles/index.js';
import { updateCarpshits as updateEnemyCarpshits, updateLowerCarpshits as updateEnemyLowerCarpshits, carpshits as enemyCarpshits, lowerCarpshits as enemyLowercarpshits } from './enemies/carpshits.js';
import { checkBulletcarpshitCollisions, checkBulletLowercarpshitCollisions, checkPlayercarpshitCollisions } from './collision.js';
import { handleBulletKill, handlePlayerHit, handleCarpetHit } from './callbacks.js';
import * as state from './state.js';
import { bgMusic, garageDoorSound, garageDoorCloseSound } from './sound.js';
import levels from './levels/index.js';
import { getCurrentLevelKey } from './state.js';
import rugfatherBoss, { checkBossBulletCollision } from './levels/rugcoAlley/rugfather.js';
import { setBossShockedStartTime, getBossShockedStartTime, setAutoRunLeft, getAutoRunLeft, getBossBattleStarted } from './state.js';
import { FLASH_DURATION } from './constants/timing.js';
import { BOSS_HOLD_DURATION, BLINK_OUT_DURATION } from './levels/rugcoAlley/rugfatherConstants.js';
import { GAME_STATES } from './constants/gameStates.js';
import { startBossIntro, updateBossIntro } from './levels/rugcoAlley/rugfatherOrchestrator.js';

/**
 * Perform one update cycle: input, physics, firing, bullet & enemy updates, and collision checks.
 */
export function updateGame(bullets, canvas) {
  const now = performance.now();
  const levelConfig = levels[getCurrentLevelKey()];
  // If the boss intro timeline is running, advance it and skip normal updates
  if (state.getBossTriggered() && !getBossBattleStarted()) {
    updateBossIntro(now);
    return;
  }
  if (state.gameState === 'dying') {
    // Animate body falling to the floor
    const floorY = levelConfig.floorY;
    if (player.feetY < floorY) {
      player.vy += 1.2; // gravity
      player.feetY += player.vy;
      if (player.feetY > floorY) {
        player.feetY = floorY;
        player.vy = 0;
        if (!state.getDyingStartTime()) state.setDyingStartTime(performance.now());
      }
    } else {
      if (!state.getDyingStartTime()) state.setDyingStartTime(performance.now());
      // Wait 1s after landing, then show game over
      if (performance.now() - state.getDyingStartTime() > 1000) {
        state.setGameState('gameover');
      }
    }
    return;
  }
  // Exit sequence handling after boss defeat
  if (state.getGameState() === 'bossExit') {
    const now = performance.now();
    // Dramatic pause before exit movement
    if (state.getExitPause()) {
      if (now - state.getExitPauseStartTime() < state.EXIT_PAUSE_DURATION) {
        return;
      } else {
        // End pause and snap to floor once
        const floorY = levelConfig.floorY;
        player.feetY = floorY;
        state.setExitPause(false);
      }
    }
    const garageFloorY = canvas.height - 120;
    const walkSpeed = 4;
    // Walk horizontally to the center door
    const centerX = Math.round(canvas.width / 2 - player.width / 2);
    if (Math.abs(player.x - centerX) > 2) {
      player.x += player.x < centerX ? walkSpeed : -walkSpeed;
      player.facing = player.x < centerX ? 1 : -1;
      player.frame = (player.frame + 1) % 40;
      return;
    }
    // Then walk 'into' the garage: move up
    if (player.feetY > garageFloorY) {
      player.feetY -= walkSpeed;
      player.frame = (player.frame + 1) % 40;
    } else {
      // Start door closing animation
      state.setGameState('bossExitDoorClosing');
      state.setBossExitDoorStartTime(performance.now());
      state.setBossExitDoorClosing(true);
      garageDoorCloseSound.currentTime = 0;
      garageDoorCloseSound.play();
    }
    return;
  }
  // Skip updates during door closing
  if (state.gameState === 'bossExitDoorClosing') {
    return;
  }
  // Only continue normal updates while playing
  if (state.gameState !== 'playing') return;
  // Reset player invulnerability if expired
  if (player.invulnerable && player.invulnerableUntil != null && now > player.invulnerableUntil) {
    player.invulnerable = false;
    player.invulnerableUntil = null;
  }
  // Boss hold: when reaching the per-level difficulty trigger, start hold phase
  if (!state.getBossHold() && !state.getBossTransition() && !state.getBossActive() && !state.getBossTriggered() && state.difficultyLevel >= levelConfig.bossTriggerDifficulty) {
    state.setBossHold(true);
    state.setBossTriggered(true);
    // Start the boss intro timeline
    startBossIntro();
    state.setBossHoldStartTime(now);
    // Stop music immediately
    bgMusic.pause();
    // Flash and shake to signal upcoming boss
    state.setFlashActive(true);
    state.setFlashEndTime(now + state.FLASH_DURATION);
    state.setScreenShake(true);
    state.setScreenShakeStartTime(now);
    // Reset shocked animation
    player.shockedFrame = 0;
    player.shockedFrameTimer = 0;
  }
  // During hold, wait before starting transition
  if (state.getBossHold()) {
    // Simulate unruggabull falling to ground during hold
    const floorY = levelConfig.floorY;
    if (player.feetY < floorY) {
      player.vy += 0.7;
      player.feetY += player.vy;
      if (player.feetY >= floorY) {
        player.feetY = floorY;
        player.vy = 0;
        player.grounded = true;
      }
      player.y = player.feetY - player.height;
    }
    // Move player to center of screen
    const centerX = Math.round(canvas.width / 2 - player.width / 2);
    const walkSpeed = 4;
    if (Math.abs(player.x - centerX) > 2) {
      player.x += player.x < centerX ? walkSpeed : -walkSpeed;
      player.facing = player.x < centerX ? 1 : -1;
      // Don't animate shocked yet, always show frame 0
      player.shockedFrame = 0;
      player.shockedFrameTimer = 0;
      // Advance walk animation
      player.frame = (player.frame + 1) % 40;
    } else {
      player.x = centerX;
      // Still show frame 0 (no animation) during hold
      player.shockedFrame = 0;
      player.shockedFrameTimer = 0;
      // Start bossPause if not already started
      if (!state.getBossPause()) {
        state.setBossPause(true);
        state.setBossPauseStartTime(now);
      }
      // Wait for pause to finish before starting transition
      if (state.getBossPause()) {
        if (now - state.getBossPauseStartTime() < state.BOSS_PAUSE_DURATION) {
          return;
        } else {
          state.setBossPause(false);
        }
      }
    }
    const elapsedHold = now - state.getBossHoldStartTime();
    if (elapsedHold > state.BOSS_HOLD_DURATION) {
      state.setBossHold(false);
      state.setBossTransition(true);
      state.setBossTransitionStartTime(now);
      // Start blink-out effect
      state.setBlinkingOut(true);
      state.setBlinkingOutStartTime(now);
      // Play garage door opening sound at transition start
      garageDoorSound.currentTime = 0;
      garageDoorSound.play();
      // NEW: Set shocked animation to start after a short delay
      setBossShockedStartTime(now + 300);
    }
    return;
  }
  // During blink-out, wait before removing platforms/carpshits
  if (state.getBlinkingOut()) {
    if (performance.now() - state.getBlinkingOutStartTime() > state.BLINK_OUT_DURATION) {
      enemyCarpshits.length = 0;
      enemyLowercarpshits.length = 0;
      platforms.length = 0;
      bullets.length = 0;
      state.setBlinkingOut(false);
    }
  }
  // During transition, skip normal updates until completed
  if (state.getBossTransition()) {
    // Move player to center if not already there
    const centerX = Math.round(canvas.width / 2 - player.width / 2);
    const walkSpeed = 4;
    if (Math.abs(player.x - centerX) > 2) {
      player.x += player.x < centerX ? walkSpeed : -walkSpeed;
      player.facing = player.x < centerX ? 1 : -1;
      // Don't animate shocked yet
      player.shockedFrame = 0;
      player.shockedFrameTimer = 0;
      // Advance walk animation
      player.frame = (player.frame + 1) % 40;
    } else {
      player.x = centerX;
      // Animate shocked only after delay
      if (now >= getBossShockedStartTime()) {
        player.shockedFrameTimer++;
        if (player.shockedFrameTimer > 10) {
          player.shockedFrame = (player.shockedFrame + 1) % 4;
          player.shockedFrameTimer = 0;
        }
      } else {
        player.shockedFrame = 0;
        player.shockedFrameTimer = 0;
      }
    }
    const elapsed = now - state.getBossTransitionStartTime();
    const framesToCycle = 6; // sprites indexes 2 to 7
    const transitionDuration = 13000; // ms for full cycle
    const interval = transitionDuration / framesToCycle;
    if (elapsed > interval * framesToCycle) {
      state.setBossTransition(false);
      state.setBossActive(true);
      // Spawn boss only if not already defeated
      if (state.gameState !== 'congrats') {
        state.setCurrentBoss(levels[getCurrentLevelKey()].boss);
        state.getCurrentBoss().spawn();
      }
      // Resume level music
      const levelConfig = levels[getCurrentLevelKey()];
      bgMusic.src = levelConfig.music;
      bgMusic.currentTime = 0;
      bgMusic.play();
      // Add after boss entrance logic (e.g., after bossActive is set):
      setAutoRunLeft(false); // restore controls when fight begins
    }
    return;
  }
  // If boss has been spawned (active) update boss entrance logic
  if (state.getCurrentBoss()) {
    state.getCurrentBoss().update();
  }
  // Pre-battle: disable controls only if the boss has been spawned and battle hasn't started
  if (state.getCurrentBoss() && !getBossBattleStarted()) {
    if (getAutoRunLeft()) {
      const safeX = 32;
      player.x -= player.speed;
      player.facing = -1;
      player.frame = (player.frame + 1) % 40;
      if (player.x <= safeX) {
        player.x = safeX;
        setAutoRunLeft(false);
      }
    }
    // Skip input and enemy updates until battle starts
    return;
  }
  // Battle has started: allow player control and boss update
  updatePlayerInput();
  handlePhysics(player, platforms, canvas);
  // Player firing uses projectiles manager
  if ((keys['f'] || keys['F'] || keys['j'] || keys['J'] || keys['Enter']) && !player.firing) {
    player.firing = true;
    spawnPlayerBullet(player);
  } else if (!(keys['f'] || keys['F'] || keys['j'] || keys['J'] || keys['Enter'])) {
    player.firing = false;
  }
  // Sprite state: firing overrides movement
  if (player.health <= 0) {
    player.sprite = 'dead';
    player.width = 128;
  } else {
    if (player.width !== 64) player.width = 64;
    if (player.firing) {
      if (player.crouching) {
        player.sprite = 'crouchFire';
      } else {
        player.sprite = 'fire';
      }
    } else if (!player.grounded && !player.crouching) {
      player.sprite = 'jump';
    } else if (player.crouching) {
      if (player.vx !== 0) {
        player.sprite = 'crouch'; // crouch-walking
      } else {
        player.sprite = 'crouchIdle'; // crouch idle
      }
    } else if (player.vx !== 0) {
      player.sprite = 'walk';
    } else {
      player.sprite = 'idle';
    }
  }
  updateProjectiles(canvas.width);

  // Check boss carpet projectile collisions with player
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i];
    // Only check projectiles that expose getHitbox()
    if (typeof p.getHitbox === 'function') {
      const projHitbox = p.getHitbox();
      const playerHitbox = getHitbox(player);
      if (
        projHitbox.x < playerHitbox.x + playerHitbox.width &&
        projHitbox.x + projHitbox.width > playerHitbox.x &&
        projHitbox.y < playerHitbox.y + playerHitbox.height &&
        projHitbox.y + projHitbox.height > playerHitbox.y
      ) {
        handleCarpetHit(projectiles, i, p);
      }
    }
  }

  // Update boss if present
  if (state.getCurrentBoss()) {
    const boss = state.getCurrentBoss();
    boss.update();
    // Bullet-boss collision: only allow player bullets
    for (let i = projectiles.length - 1; i >= 0; i--) {
      const bullet = projectiles[i];
      const isBossProjectile = bullet.type === 'boss';
      if (!isBossProjectile && checkBossBulletCollision(bullet)) {
        boss.hit(1);
        projectiles.splice(i, 1);
      }
    }
  }

  // Update enemies after battle begins
  if (!state.getBossTransition() && !state.getBossActive() || state.getCarpshitsDuringBoss()) {
    updateEnemyCarpshits();
    checkBulletcarpshitCollisions(projectiles, enemyCarpshits, handleBulletKill);
    updateEnemyLowerCarpshits();
    checkBulletLowercarpshitCollisions(projectiles, enemyLowercarpshits, handleBulletKill);
    checkPlayercarpshitCollisions(player, enemyCarpshits, handlePlayerHit);
    checkPlayercarpshitCollisions(player, enemyLowercarpshits, handlePlayerHit);
  }
} 