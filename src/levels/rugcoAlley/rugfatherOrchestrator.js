import { rugfatherIntroTimeline as introsceneTimeline } from './rugfatherIntroScene.js';
import { setAutoRunLeft, setBossBattleStarted, getBossBattleStarted, setBackgroundFlickerMode } from '../../state.js';
import rugfatherBoss, { __bossState, BOSS_HEIGHT } from './rugfather.js';
import { player } from '../../player.js';
import * as stateModule from '../../state.js';
import levels from '../../levels/index.js';
import { projectiles } from '../../projectiles/index.js';
import { getCurrentLevelKey } from '../../state.js';
import { bgMusic, garageDoorCloseSound } from '../../sound.js';
import { platforms } from '../../physics.js';
import { carpshits, lowerCarpshits } from '../../enemies/carpshits.js';
import { wovenIntoRugSfx } from '../../sound.js';
import { clearEntities } from '../../utils/sceneUtils.js';
import { rugfatherDefeatTimeline } from './rugfatherDefeatScene.js';

let timelineStart = 0;
let timelineIndex = 0;
let defeatTimelineStart = 0;
let defeatTimelineIndex = 0;
let defeatTimelineActive = false;

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
  // Completed all tweens
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
      clearEntities(window.bullets, projectiles, platforms, carpshits, lowerCarpshits);
      // Clear player muzzle flash
      if (player && typeof player.muzzleFlashTimer === 'number') player.muzzleFlashTimer = 0;
      break;
    case 'spawnBoss':
      // Activate boss and its internal state for intro
      stateModule.setCurrentBoss(rugfatherBoss);
      stateModule.setBossActive(true);
      // Use only public boss interface; orchestrator should not mutate boss internals directly
      rugfatherBoss.spawn();
      // Clear existing platforms and enemies so they don't reappear
      clearEntities(platforms, carpshits, lowerCarpshits);
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
      // End intro mode so battle draw (and health bar) will show
      rugfatherBoss.setEntering(false);
      // Play start-of-fight SFX (woven into rug)
      wovenIntoRugSfx.currentTime = 0;
      wovenIntoRugSfx.play();
      completeAllTweens(now);
      setBossBattleStarted(true);
      setAutoRunLeft(false);
      // Clear intro state flags so the intro doesn't restart
      stateModule.setBossHold(false);
      stateModule.setBossTransition(false);
      stateModule.setBossPause(false);
      stateModule.setBlinkingOut(false);
      break;
    case 'tweenBossPosition':
      if (event.data && event.data.y !== undefined) {
        // Default x to current boss x if not provided, and convert floor Y to top coordinate
        const posX = (typeof event.data.x === 'number') ? event.data.x : __bossState.x;
        // If y is 'floor', convert to top for final scale; else treat numeric y as top
        let targetY;
        if (event.data.y === 'floor') {
          const floorY = levels[getCurrentLevelKey()].floorY;
          // Use current scale for correct bottom alignment
          const scaleEvent = introsceneTimeline.find(e => e.time === event.time && e.action === 'tweenBossScale');
          let finalScale = scaleEvent && scaleEvent.data && scaleEvent.data.scale ? scaleEvent.data.scale : 1.0;
          targetY = floorY - BOSS_HEIGHT * finalScale;
        } else if (typeof event.data.y === 'number') {
          targetY = event.data.y;
        }
        // Tween boss position by mutating internal state
        startTween(__bossState, { x: posX, y: targetY }, event.duration || 0, now);
      }
      break;
    case 'tweenBossScale':
      if (event.data && event.data.scale !== undefined) {
        // Tween boss scale by mutating internal state
        startTween(__bossState, { scale: event.data.scale }, event.duration || 0, now);
      }
      break;
    case 'setBossPosition':
      // Position boss: align bottom coordinate (feet) to either floor or specified y
      let posY;
      if (event.data.y === 'floor') {
        const floorY = levels[getCurrentLevelKey()].floorY;
        posY = floorY - BOSS_HEIGHT * (event.data.scale || 1.0);
      } else if (typeof event.data.y === 'number') {
        posY = event.data.y;
      }
      // Default x to current boss x if not provided
      const posX = (typeof event.data.x === 'number') ? event.data.x : __bossState.x;
      rugfatherBoss.setPosition(posX, posY);
      break;
    case 'setBossSprite':
      rugfatherBoss.setSprite(event.data);
      break;
    case 'setBossOpacity':
      rugfatherBoss.setOpacity(event.data);
      break;
    case 'setBossScale':
      rugfatherBoss.setScale(event.data);
      break;
    case 'setPlayerFacing':
      player.facing = event.data === 'left' ? -1 : 1;
      break;
    case 'setBossFacing':
      // Since we don't have a direct setFacing method on the boss,
      // we can use the appropriate sprite that faces the correct direction
      // or implement mirroring in the future if needed
      const facingDirection = event.data || 'right';
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
    case 'tweenBossOpacity':
      if (event.data && typeof event.data.opacity === 'number') {
        startTween(__bossState, { opacity: event.data.opacity }, event.duration || 0, now);
      }
      break;
    case 'setCarpshitsFalling':
      // Make all carpshits die and fall dramatically
      [carpshits, lowerCarpshits].forEach(arr => {
        arr.forEach(c => {
          c.alive = false;
          c.falling = true;
          c.vy = 0;
        });
      });
      break;
    case 'setRugfatherSprite':
      if (stateModule.getCurrentBoss()) {
        stateModule.getCurrentBoss().setSprite(event.data);
      }
      break;
    case 'tweenPlayerPosition':
      // Ensure player is in walk-forward animation during tween
      player.sprite = 'walkForward';
      // Tween horizontal x and feetY for vertical positioning
      startTween(player, { x: event.data.x, feetY: event.data.y }, event.duration, now);
      break;
    case 'tweenPlayerScale':
      startTween(player, { scale: event.data.scale }, event.duration, now);
      break;
    case 'fadeOutPlayer':
      startTween(player, { opacity: 0 }, event.duration, now);
      break;
    case 'playGarageCloseReverse':
      // Play the garage door closing (reverse) sound
      garageDoorCloseSound.currentTime = 0;
      garageDoorCloseSound.play();
      break;
    case 'setBossExitDoorClosing':
      // Trigger the background door-closing animation and end the defeat override
      stateModule.setBossExitDoorClosing(true);
      stateModule.setBossExitDoorStartTime(now);
      break;
    case 'transitionTo':
      stateModule.setGameState(event.data);
      if (event.data === 'bossExit') {
        // clear dying to stop defeat override
        __bossState.dying = false;
      }
      if (event.data === 'congrats') {
        // clear boss so renderGame won't draw it
        stateModule.setBossActive(false);
        stateModule.setCurrentBoss(null);
        __bossState.dying = false;
        stateModule.setCongratsStartTime(performance.now());
      }
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

export function launchRugfatherDefeatScene() {
  defeatTimelineStart = performance.now();
  defeatTimelineIndex = 0;
  // Align boss death animation timing with defeat timeline
  __bossState.deathStart = defeatTimelineStart;
  defeatTimelineActive = true;
}

export function updateRugfatherDefeatScene(now) {
  if (!defeatTimelineActive) return;
  const elapsed = now - defeatTimelineStart;
  while (defeatTimelineIndex < rugfatherDefeatTimeline.length && elapsed >= rugfatherDefeatTimeline[defeatTimelineIndex].time) {
    const event = rugfatherDefeatTimeline[defeatTimelineIndex];
    // Dispatch defeat scene event
    handleEvent(event, now);
    defeatTimelineIndex++;
  }
  // Advance any tweens (player scale/position, opacity)
  updateTweens(now);
} 