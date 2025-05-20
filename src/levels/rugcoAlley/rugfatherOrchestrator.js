import { introsceneTimeline } from './rugfatherIntroScene.js';
import { setAutoRunLeft, setBossBattleStarted } from '../../state.js';
import { bossState } from './rugfather.js';
import { player } from '../../player.js';
import * as stateModule from '../../state.js';
import { platforms } from '../../physics.js';
import { carpshits, lowerCarpshits } from '../../enemy.js';
import levels from '../../levels/index.js';
import { getCurrentLevelKey } from '../../state.js';

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
    case 'playSfx':
      if (event.data && typeof event.data.play === 'function') {
        event.data.currentTime = 0;
        event.data.play();
      }
      break;
    case 'fadeInBoss':
      bossState.opacity = 0;
      bossState.fadeInStartTime = now;
      bossState.fadeInDuration = event.duration || 0;
      break;
    case 'setPlayerControl':
      player.controlEnabled = !!event.data;
      break;
    case 'setPlayerSprite':
      player.sprite = event.data;
      break;
    case 'movePlayerTo':
      if (event.duration) {
        startTween(player, { x: event.data.x, y: event.data.y }, event.duration, now);
      } else {
        if (event.data.x !== undefined) player.x = event.data.x;
        if (event.data.y !== undefined) player.y = event.data.y;
      }
      break;
    case 'autoRunLeft':
      setAutoRunLeft(event.data !== false);
      break;
    case 'startBattle':
      setBossBattleStarted(true);
      setAutoRunLeft(false);
      bossState.entering = false;
      bossState.sprite = 'idle';
      break;
    case 'tweenBossPosition':
      if (event.data && typeof event.data.x === 'number' && event.data.y !== undefined) {
        startTween(bossState, { x: event.data.x, y: resolveY(event.data.y) }, event.duration || 0, now);
      }
      break;
    case 'tweenBossScale':
      if (event.data && event.data.scale !== undefined) {
        startTween(bossState, { scale: event.data.scale }, event.duration || 0, now);
      }
      break;
    case 'setPlayerFacing':
      player.facing = event.data === 'left' ? -1 : 1;
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
    case 'fadeOutPlatforms':
      stateModule.setBlinkingOut(true);
      stateModule.setBlinkingOutStartTime(now);
      break;
    case 'fadeOutEnemies':
      stateModule.setBlinkingOut(true);
      break;
    case 'removePlatforms':
      platforms.length = 0;
      break;
    case 'removeEnemies':
      carpshits.length = 0;
      lowerCarpshits.length = 0;
      break;
    default:
      break;
  }
} 