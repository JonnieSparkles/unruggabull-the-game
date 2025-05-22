import { rugfatherIntroTimeline as introsceneTimeline } from './rugfatherIntroScene.js';
import { setAutoRunLeft, setBossBattleStarted, getBossBattleStarted, setBackgroundFlickerMode } from '../../state.js';
import rugfatherBoss, { bossState, BOSS_HEIGHT } from './rugfather.js';
import { player } from '../../player.js';
import * as stateModule from '../../state.js';
import levels from '../../levels/index.js';
import { getCurrentLevelKey } from '../../state.js';
import { bgMusic } from '../../sound.js';
import { platforms } from '../../physics.js';
import { carpshits, lowerCarpshits } from '../../enemies/carpshits.js';

let timelineStart = 0;
let timelineIndex = 0;

// Tween support
const tweens = [];

function startTween(target, to, duration, now) {
  const from = {};
  for (const key in to) from[key] = target[key];
  tweens.push({ target, from, to, startTime: now, duration });
}

function updateTweens(now) {
  for (let i = tweens.length - 1; i >= 0; i--) {
    const tw = tweens[i];
    const t = Math.min(1, (now - tw.startTime) / tw.duration);
    for (const key in tw.to) {
      tw.target[key] = tw.from[key] + (tw.to[key] - tw.from[key]) * t;
    }
    if (t >= 1) tweens.splice(i, 1);
  }
}

// Force all tweens to their final state (progress=1)
function completeAllTweens(now) {
  for (let i = tweens.length - 1; i >= 0; i--) {
    const tw = tweens[i];
    for (const key in tw.to) {
      tw.target[key] = tw.to[key];
    }
    tweens.splice(i, 1);
  }
  console.log(`[orchestrator] completeAllTweens: bossState.x=${bossState.x}, y=${bossState.y}, scale=${bossState.scale}`);
}

function resolveY(y) {
  if (y === 'floor') {
    const levelConfig = levels[getCurrentLevelKey()];
    return levelConfig.floorY;
  }
  return y;
}

/**
 * Begin the boss intro sequence.
 */
export function startBossIntro() {
  timelineStart = performance.now();
  timelineIndex = 0;
  // Disable player manual controls by auto-running left
  setAutoRunLeft(true);
  // Ensure background flicker is in default mode at the start
  setBackgroundFlickerMode('default');
}

/**
 * Update the boss intro timeline; call this each frame while entering.
 */
export function updateBossIntro(now) {
  const elapsed = now - timelineStart;
  while (timelineIndex < introsceneTimeline.length && elapsed >= introsceneTimeline[timelineIndex].time) {
    const event = introsceneTimeline[timelineIndex];
    handleEvent(event, now);
    timelineIndex++;
  }
  updateTweens(now);
}

/**
 * Dispatch a single event from the intro timeline.
 */
function handleEvent(event, now) {
  switch (event.action) {
    case 'clearEntities':
      // Clear all bullets, platforms, and carpshits at intro start
      if (window.bullets) window.bullets.length = 0;
      platforms.length = 0;
      carpshits.length = 0;
      lowerCarpshits.length = 0;
      break;
    case 'spawnBoss':
      // Activate boss and its internal state for intro
      stateModule.setCurrentBoss(rugfatherBoss);
      stateModule.setBossActive(true);
      bossState.active = true;
      bossState.entering = true;
      // Clear existing platforms and enemies so they don't reappear
      platforms.length = 0;
      carpshits.length = 0;
      lowerCarpshits.length = 0;
      break;
    case 'stopMusic':
      bgMusic.pause();
      bgMusic.currentTime = 0;
      break;
    case 'playSfx':
      if (event.data && typeof event.data.play === 'function') {
        event.data.currentTime = 0;
        event.data.play();
      }
      break;
    case 'startGarageDoorOpen':
      stateModule.setBossTransition(true);
      stateModule.setBossTransitionStartTime(now);
      break;
    case 'fadeInBoss':
      bossState.opacity = 0;
      if (event.duration) {
        startTween(bossState, { opacity: 1 }, event.duration, now);
      } else {
        bossState.opacity = 1;
      }
      break;
    case 'setPlayerControl':
      player.controlEnabled = !!event.data;
      break;
    case 'setPlayerSprite':
      player.sprite = event.data;
      break;
    case 'movePlayerToFloor':
      // Snap player to floor
      player.feetY = levels[getCurrentLevelKey()].floorY;
      player.y = player.feetY - player.height;
      break;
    case 'movePlayerTo':
      // Normalize target positions
      const targetX = event.data.x !== undefined ? event.data.x : player.x;
      const targetY = event.data.y !== undefined ? resolveY(event.data.y) : player.y;
      if (event.duration) {
        // Preserve current sprite so we can restore it after moving
        const prevSprite = player.sprite;
        startTween(player, { x: targetX, y: targetY }, event.duration, now);
        // If walk is requested and player is on the floor, use walking animation
        if (event.data.walk && player.feetY === levels[getCurrentLevelKey()].floorY) {
          player.sprite = 'walk';
          // Restore previous sprite after the tween completes
          setTimeout(() => { if (player.sprite === 'walk') player.sprite = prevSprite; }, event.duration);
        }
      } else {
        player.x = targetX;
        player.y = targetY;
      }
      break;
    case 'autoRunLeft':
      setAutoRunLeft(event.data !== false);
      break;
    case 'startBattle':
      console.log(`[orchestrator] startBattle PRE: bossState.x=${bossState.x}, y=${bossState.y}, scale=${bossState.scale}`);
      completeAllTweens(now);
      console.log(`[orchestrator] startBattle POST: bossState.x=${bossState.x}, y=${bossState.y}, scale=${bossState.scale}`);
      setBossBattleStarted(true);
      setAutoRunLeft(false);
      bossState.entering = false;
      bossState.sprite = 'idle';
      // Clear intro state flags so the intro doesn't restart
      stateModule.setBossHold(false);
      stateModule.setBossTransition(false);
      stateModule.setBossPause(false);
      stateModule.setBlinkingOut(false);
      break;
    case 'tweenBossPosition':
      if (event.data && typeof event.data.x === 'number' && event.data.y !== undefined) {
        // If y is 'floor', convert to top for final scale; else treat as top
        let targetY, debugBottom;
        if (event.data.y === 'floor') {
          const floorY = levels[getCurrentLevelKey()].floorY;
          let finalScale = bossState.scale;
          const scaleEvent = introsceneTimeline.find(e => e.time === event.time && e.action === 'tweenBossScale');
          if (scaleEvent && scaleEvent.data && scaleEvent.data.scale) {
            finalScale = scaleEvent.data.scale;
          }
          targetY = floorY - BOSS_HEIGHT * finalScale;
          debugBottom = floorY;
        } else if (typeof event.data.y === 'number') {
          targetY = event.data.y;
          debugBottom = event.data.y + BOSS_HEIGHT * bossState.scale;
        }
        console.log(`[orchestrator] tweenBossPosition: target x=${event.data.x}, y=${targetY}, scale=${bossState.scale}`);
        startTween(bossState, { x: event.data.x, y: targetY }, event.duration || 0, now);
      }
      break;
    case 'tweenBossScale':
      if (event.data && event.data.scale !== undefined) {
        startTween(bossState, { scale: event.data.scale }, event.duration || 0, now);
      }
      break;
    case 'setBossPosition':
      // Position boss: align bottom coordinate (feet) to either floor or specified y
      bossState.x = event.data.x;
      let debugBottom;
      if (event.data.y === 'floor') {
        const floorY = levels[getCurrentLevelKey()].floorY;
        bossState.y = floorY - BOSS_HEIGHT * bossState.scale;
        debugBottom = floorY;
      } else if (typeof event.data.y === 'number') {
        const bottom = event.data.y;
        bossState.y = bottom - BOSS_HEIGHT * bossState.scale;
        debugBottom = bottom;
      }
      break;
    case 'setPlayerFacing':
      player.facing = event.data === 'left' ? -1 : 1;
      break;
    case 'setBossFacing':
      bossState.facing = event.data === 'left' ? -1 : 1;
      break;
    case 'setBossSprite':
      bossState.sprite = event.data;
      break;
    case 'flashScreen':
      stateModule.setFlashActive(true);
      stateModule.setFlashEndTime(now + event.data);
      break;
    case 'screenShake':
      stateModule.setScreenShake(true);
      stateModule.setScreenShakeStartTime(now);
      break;
    case 'showFightBanner':
      // Trigger on-screen "FIGHT!" banner
      stateModule.setFightBanner(true);
      stateModule.setFightBannerStartTime(now);
      break;
    case 'startMusic':
      // Resume level music for battle
      const levelConfig = levels[getCurrentLevelKey()];
      bgMusic.src = levelConfig.music;
      bgMusic.currentTime = 0;
      bgMusic.play();
      break;
    case 'cycleGarageDoorOpen':
      setBackgroundFlickerMode('doorOpenFlicker');
      break;
    default:
      break;
  }
}

/**
 * Skip entire intro timeline and jump directly to battle start.
 */
export function skipToBattle() {
  const now = performance.now();
  // Fast-forward timeline start so elapsed >= last event.time
  const lastEvent = introsceneTimeline[introsceneTimeline.length - 1];
  timelineStart = now - lastEvent.time;
  timelineIndex = 0;
  // Process all events up to and including the last
  updateBossIntro(now);
  // Immediately complete any active tweens so position & scale reach final values
  tweens.forEach(tw => tw.startTime = now - tw.duration);
  updateTweens(now);
}

export default class RugfatherCarpet {
  // ... existing code ...
} 