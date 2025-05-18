// State module: centralize game state and settings

import { difficultyIncreaseSound } from './sound.js';

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
/**
 * Set whether the flash overlay is active.
 */
export function setFlashActive(val) { flashActive = val; }
/**
 * Set the time at which the flash should end.
 */
export function setFlashEndTime(val) { flashEndTime = val; }
export const FLASH_DURATION = 200;
export let PHASE_CHANGE_KILL_COUNT = 15;

export let difficultyLevel = 1;
export let nextPhaseKillCount = PHASE_CHANGE_KILL_COUNT;
export function increaseDifficulty() {
  // Play difficulty increase sound
  difficultyIncreaseSound.currentTime = 0;
  difficultyIncreaseSound.play();
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