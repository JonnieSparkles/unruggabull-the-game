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
import { startBossIntro, updateBossIntro, launchRugfatherDefeatScene, updateRugfatherDefeatScene } from './levels/rugcoAlley/rugfatherOrchestrator.js';
import { clearEntities } from './utils/sceneUtils.js';
import { BLASTER_RECHARGE_INTERVAL, BLASTER_EMPTY_FLASH_DURATION } from './constants/blaster.js';
import { blasterEmptySound, flawlessVictorySound } from './sound.js';
import { PLAYER_START_HEALTH } from './constants/player.js';

/**
 * Perform one update cycle: input, physics, firing, bullet & enemy updates, and collision checks.
 */
export function updateGame(bullets, canvas) {
  const now = performance.now();
  // Defeat scene override: if boss is dying, run defeat timeline only
  const bossEntity = state.getCurrentBoss && state.getCurrentBoss();
  if (bossEntity && bossEntity.dying) {
    if (!updateGame._defeatSceneStarted) {
      launchRugfatherDefeatScene();
      updateGame._defeatSceneStarted = true;
    }
    updateRugfatherDefeatScene(now);
    return;
  }
  const levelConfig = levels[getCurrentLevelKey()];
  // If the boss intro timeline is running, advance it and skip normal updates
  if (state.getBossTriggered() && !getBossBattleStarted()) {
    updateBossIntro(now);
    return;
  }
  if (state.gameState === 'dying') {
    // Ensure dead sprite is shown and stop invulnerability flicker
    player.sprite = 'dead';
    player.width = 128;
    player.invulnerable = false;
    player.invulnerableUntil = null;
    player.hitHoldUntil = null;
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
  // Only continue normal updates while playing
  if (state.gameState !== 'playing') return;
  // Blaster energy recharge
  if (player.blasterEnergy < player.blasterMaxEnergy) {
    const rechargeElapsed = now - player.blasterLastRechargeTime;
    const chargesToAdd = Math.floor(rechargeElapsed / BLASTER_RECHARGE_INTERVAL);
    if (chargesToAdd > 0) {
      player.blasterEnergy = Math.min(player.blasterEnergy + chargesToAdd, player.blasterMaxEnergy);
      player.blasterLastRechargeTime += chargesToAdd * BLASTER_RECHARGE_INTERVAL;
    }
  }
  // Reset player invulnerability if expired
  if (player.invulnerable && player.invulnerableUntil != null && now > player.invulnerableUntil) {
    player.invulnerable = false;
    player.invulnerableUntil = null;
  }
  // Boss hold: when reaching the per-level difficulty trigger, start hold phase
  if (!state.getBossHold() && !state.getBossTransition() && !state.getBossActive() && !state.getBossTriggered() && state.difficultyLevel >= levelConfig.bossTriggerDifficulty) {
    // Play flawless victory sound if player is at full health
    if (player.health === PLAYER_START_HEALTH) {
      flawlessVictorySound.currentTime = 0;
      flawlessVictorySound.play();
    }
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
      clearEntities(enemyCarpshits, enemyLowercarpshits, platforms, bullets);
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
  // Player firing uses projectiles manager with blaster energy
  if ((keys['f'] || keys['F'] || keys['j'] || keys['J'] || keys['Enter']) && !player.firing) {
    // Attempt to fire
    if (player.blasterEnergy > 0) {
      player.blasterEnergy--;
      spawnPlayerBullet(player);
    } else {
      // No energy: flash bar and play hissing sound
      player.blasterEmptyFlashEndTime = now + BLASTER_EMPTY_FLASH_DURATION;
      blasterEmptySound.currentTime = 0;
      blasterEmptySound.play();
    }
    player.firing = true;
  } else if (!(keys['f'] || keys['F'] || keys['j'] || keys['J'] || keys['Enter'])) {
    player.firing = false;
  }
  // Sprite state: freeze on hit frame if within hit hold duration
  if (player.hitHoldUntil && now < player.hitHoldUntil) {
    player.sprite = 'hit';
  } else {
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
  }
  updateProjectiles(canvas.width);
  // Make boss carpet projectiles shoot-downable by player bullets
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i];
    if (p.type === 'boss' && typeof p.getHitbox === 'function') {
      const projHitbox = p.getHitbox();
      for (let j = projectiles.length - 1; j >= 0; j--) {
        const b = projectiles[j];
        if (b.type === 'player') {
          // Check if bullet inside carpet hitbox
          if (
            b.x > projHitbox.x && b.x < projHitbox.x + projHitbox.width &&
            b.y > projHitbox.y && b.y < projHitbox.y + projHitbox.height
          ) {
            // Remove the bullet after impact
            projectiles.splice(j, 1);
            // Decrement carpet HP
            p.hp -= 1;
            if (p.hp > 0) {
              // First hit: flash sprite
              p.flashEndTime = performance.now() + FLASH_DURATION;
            } else {
              // Second hit: destroy carpet with explosion frame
              p.hit = true;
              p.vx = 0;
              p.vy = 0;
              // Schedule removal after explosion
              setTimeout(() => {
                const idx2 = projectiles.indexOf(p);
                if (idx2 >= 0) projectiles.splice(idx2, 1);
              }, 500);
            }
            break;
          }
        }
      }
    }
  }

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

  // Update boss if present and not dying
  if (state.getCurrentBoss()) {
    const boss = state.getCurrentBoss();
    boss.update();
    // Only handle bullet collisions while boss is alive
    if (!boss.dying) {
      for (let i = projectiles.length - 1; i >= 0; i--) {
        const bullet = projectiles[i];
        const isBossProjectile = bullet.type === 'boss';
        if (!isBossProjectile && checkBossBulletCollision(bullet)) {
          boss.hit(1);
          projectiles.splice(i, 1);
        }
      }
    }
  }

  // Player-body collision with boss
  const bossEntityCollision = state.getCurrentBoss();
  // Only allow body collision if battle started and boss not yet dead
  if (bossEntityCollision && state.getBossBattleStarted() && !bossEntityCollision.dying) {
    const bossHitbox = bossEntityCollision.getHitbox();
    const playerHitbox = getHitbox(player);
    // AABB collision
    if (
      playerHitbox.x < bossHitbox.x + bossHitbox.width &&
      playerHitbox.x + playerHitbox.width > bossHitbox.x &&
      playerHitbox.y < bossHitbox.y + bossHitbox.height &&
      playerHitbox.y + playerHitbox.height > bossHitbox.y
    ) {
      // Damage player on contact if not invulnerable
      if (!player.invulnerable) {
        player.health--;
        player.invulnerable = true;
        player.invulnerableUntil = performance.now() + state.INVULNERABLE_TIME;
        state.setFlashActive(true);
        state.setFlashColor('rgba(255,0,0,0.5)');
        state.setFlashEndTime(performance.now() + FLASH_DURATION);
        state.playPlayerHitSound();
        state.setPlayerHitFlashActive(true);
        state.setPlayerHitFlashEndTime(performance.now() + FLASH_DURATION);
        // Handle death state
        if (player.health <= 0 && state.getGameState() !== 'dying') {
          state.setGameState('dying');
          state.setDyingStartTime(null);
        }
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