// State module: centralize game state and settings

import { difficultyIncreaseSounds } from './sound.js';
import { FLASH_DURATION, INVULNERABLE_TIME, RESPAWN_DELAY } from './constants/timing.js';

// Re-export timing constants for legacy references
export { FLASH_DURATION, INVULNERABLE_TIME, RESPAWN_DELAY };

export let gameState = 'start';
export function setGameState(s) { gameState = s; }
export function getGameState() { return gameState; }

export let dyingStartTime = null;
export function setDyingStartTime(t) { dyingStartTime = t; }
export function getDyingStartTime() { return dyingStartTime; }

export let killCount = 0;
export function resetKillCount() { killCount = 0; }
/**
 * Increment the kill count by one.
 */
export function incrementKillCount() { killCount++; }
/**
 * Get the current kill count.
 */
export function getKillCount() { return killCount; }

export let flashActive = false;
export let flashEndTime = 0;
export let flashColor = 'rgba(255,255,255,0.8)';
export function setFlashActive(val) { flashActive = val; }
/**
 * Set the time at which the flash should end.
 */
export function setFlashEndTime(val) { flashEndTime = val; }
export function setFlashColor(color) { flashColor = color; }
export let PHASE_CHANGE_KILL_COUNT = 15;

export let difficultyLevel = 1;
export let nextPhaseKillCount = PHASE_CHANGE_KILL_COUNT;
export function increaseDifficulty() {
  // Play a random reaction sound
  const sound = difficultyIncreaseSounds[Math.floor(Math.random() * difficultyIncreaseSounds.length)];
  sound.currentTime = 0;
  sound.play();
  difficultyLevel++;
  nextPhaseKillCount += PHASE_CHANGE_KILL_COUNT;
}
export function decreaseDifficulty() {
  if (difficultyLevel > 1) {
    difficultyLevel--;
    nextPhaseKillCount = Math.max(PHASE_CHANGE_KILL_COUNT, nextPhaseKillCount - PHASE_CHANGE_KILL_COUNT);
  }
}
export function setPhaseChangeKillCount(val) {
  PHASE_CHANGE_KILL_COUNT = val;
  // Recalculate nextPhaseKillCount so the next phase is always reachable
  setNextPhaseKillCount(killCount + PHASE_CHANGE_KILL_COUNT);
}
export function setNextPhaseKillCount(val) { nextPhaseKillCount = val; }

// Level selection
export let currentLevelKey = 'rugcoAlley';
export function setCurrentLevelKey(key) { currentLevelKey = key; }
export function getCurrentLevelKey() { return currentLevelKey; }

// Level boss control
export let bossActive = false;
export let currentBoss = null;
// Fight banner control
export let fightBannerActive = false;
export let fightBannerStartTime = 0;
// Boss transition control
export let bossTransition = false;
export let bossTransitionStartTime = 0;
// Screen shake control
export let screenShake = false;
export let screenShakeStartTime = 0;
export const SCREEN_SHAKE_DURATION = 1000;

// Boss hold (pre-transition) control
export let bossHold = false;
export let bossHoldStartTime = 0;

// Boss dramatic pause (after walk to center, before door opens)
export let bossPause = false;
export let bossPauseStartTime = 0;

// Blink-out effect for platforms and carpshits during boss transition
export let blinkingOut = false;
export let blinkingOutStartTime = 0;

// Carpshits return during boss fight phase
export let carpshitsDuringBoss = false;
export function setCarpshitsDuringBoss(val) { carpshitsDuringBoss = val; }
export function getCarpshitsDuringBoss() { return carpshitsDuringBoss; }

export function setBossActive(val) { bossActive = val; }
export function getBossActive() { return bossActive; }

export function setCurrentBoss(boss) { currentBoss = boss; }
export function getCurrentBoss() { return currentBoss; }

export function setBossTransition(val) { bossTransition = val; }
export function getBossTransition() { return bossTransition; }

export function setBossTransitionStartTime(val) { bossTransitionStartTime = val; }
export function getBossTransitionStartTime() { return bossTransitionStartTime; }
// Screen shake setters/getters
export function setScreenShake(val) { screenShake = val; }
export function getScreenShake() { return screenShake; }
export function setScreenShakeStartTime(val) { screenShakeStartTime = val; }
export function getScreenShakeStartTime() { return screenShakeStartTime; }

export function setBossHold(val) { bossHold = val; }
export function getBossHold() { return bossHold; }
export function setBossHoldStartTime(val) { bossHoldStartTime = val; }
export function getBossHoldStartTime() { return bossHoldStartTime; }

export function setBossPause(val) { bossPause = val; }
export function getBossPause() { return bossPause; }
export function setBossPauseStartTime(val) { bossPauseStartTime = val; }
export function getBossPauseStartTime() { return bossPauseStartTime; }

// Player auto-run left after boss entrance
export let playerAutoRunLeft = false;
export function setPlayerAutoRunLeft(val) { playerAutoRunLeft = val; }
export function getPlayerAutoRunLeft() { return playerAutoRunLeft; }

export function setBlinkingOut(val) { blinkingOut = val; }
export function getBlinkingOut() { return blinkingOut; }
export function setBlinkingOutStartTime(val) { blinkingOutStartTime = val; }
export function getBlinkingOutStartTime() { return blinkingOutStartTime; }

// Add bossTriggered flag to prevent boss scene from re-triggering after defeat
export let bossTriggered = false;
export function setBossTriggered(val) { bossTriggered = val; }
export function getBossTriggered() { return bossTriggered; }

// Exit sequence control after boss defeat
export let bossExit = false;
export function setBossExit(val) { bossExit = val; }
export function getBossExit() { return bossExit; }

// Door closing sequence control after exit walking
export let bossExitDoorClosing = false;
export let bossExitDoorStartTime = 0;
export function setBossExitDoorClosing(val) { bossExitDoorClosing = val; }
export function getBossExitDoorClosing() { return bossExitDoorClosing; }
export function setBossExitDoorStartTime(val) { bossExitDoorStartTime = val; }
export function getBossExitDoorStartTime() { return bossExitDoorStartTime; }

// Congrats image fade-in control
export let congratsStartTime = 0;
export function setCongratsStartTime(val) { congratsStartTime = val; }
export function getCongratsStartTime() { return congratsStartTime; }

// Exit boss position and scale
export let exitBossX = 0;
export let exitBossY = 0;
export let exitBossScale = 1;
export function setExitBossX(val) { exitBossX = val; }
export function getExitBossX() { return exitBossX; }
export function setExitBossY(val) { exitBossY = val; }
export function getExitBossY() { return exitBossY; }
export function setExitBossScale(val) { exitBossScale = val; }
export function getExitBossScale() { return exitBossScale; }

// Exit pause control (dramatic pause before unloading boss)
export let exitPause = false;
export let exitPauseStartTime = 0;
export const EXIT_PAUSE_DURATION = 1000; // ms to pause before exit sequence
export function setExitPause(val) { exitPause = val; }
export function getExitPause() { return exitPause; }
export function setExitPauseStartTime(val) { exitPauseStartTime = val; }
export function getExitPauseStartTime() { return exitPauseStartTime; }

// Boss shocked animation timing
export let bossShockedStartTime = 0;
export function setBossShockedStartTime(val) { bossShockedStartTime = val; }
export function getBossShockedStartTime() { return bossShockedStartTime; }

// Auto-run left for Unruggabull
export let autoRunLeft = false;
export function setAutoRunLeft(val) { autoRunLeft = val; }
export function getAutoRunLeft() { return autoRunLeft; }

// Boss battle start control (after entrance and hold)
export let bossBattleStarted = false;
export function setBossBattleStarted(val) { bossBattleStarted = val; }
export function getBossBattleStarted() { return bossBattleStarted; }

// Evil laugh playback control during blink
export let laughPlayed = false;
export function setLaughPlayed(val) { laughPlayed = val; }
export function getLaughPlayed() { return laughPlayed; }

// Boss jump control after battle starts
export let bossJumped = false;
export function setBossJumped(val) { bossJumped = val; }
export function getBossJumped() { return bossJumped; }

/**
 * Show on-screen "FIGHT!" banner and record its start time.
 */
export function setFightBanner(val) { fightBannerActive = val; }
export function getFightBanner() { return fightBannerActive; }
export function setFightBannerStartTime(val) { fightBannerStartTime = val; }
export function getFightBannerStartTime() { return fightBannerStartTime; }

export function playPlayerHitSound() {
  if (!playPlayerHitSound.audio) {
    playPlayerHitSound.audio = new Audio('assets/audio/sfx/unruggabull/unruggabull-ow.mp3');
  }
  const audio = playPlayerHitSound.audio;
  audio.currentTime = 0;
  audio.play();
}

export let playerHitFlashActive = false;
export let playerHitFlashEndTime = 0;
export function setPlayerHitFlashActive(val) { playerHitFlashActive = val; }
export function setPlayerHitFlashEndTime(val) { playerHitFlashEndTime = val; } 