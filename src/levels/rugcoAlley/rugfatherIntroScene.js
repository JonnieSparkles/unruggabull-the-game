/**
 * 🎬 Rugfather Intro Timeline
 *
 * Triggered when difficultyLevel increases to 6.
 * Plays a fully-scripted cinematic intro sequence:
 * 
 * - Flash + music stops
 * - Player auto-walks to center and enters shocked pose
 * - Garage door animates open (13s)
 * - Boss blinks/laughs → spins → walks out to battlefield
 * - Player runs left to battle position
 * - Boss says "Hello Unruggabull"
 * - Fight begins after "FIGHT!" flashes
 */

import { evilLaughSfx, helloUnruggabullSfx, garageDoorSound, fireWindsSwoosh, unruggabullVoiceSounds } from '../../sound.js';
import { FLASH_DURATION } from '../../constants/timing.js';

export const rugfatherIntroTimeline = [
  // 0. Clear all bullets, platforms, and carpshits before intro
  { time: 0, action: 'clearEntities' },

  // 1. Screen flicker + stop music
  { time: 0,    action: 'flashScreen',      data: FLASH_DURATION },
  { time: 0,    action: 'screenShake' },
  { time: 0,    action: 'stopMusic' },
  { time: 0,    action: 'setPlayerControl', data: false },

  // 2. Ground + center the player
  { time: 500,  action: 'movePlayerToFloor' },
  { time: 1500, action: 'setPlayerSprite', data: 'walk' },
  { time: 1500, action: 'playSfx', data: unruggabullVoiceSounds[6] },
  { time: 1500, action: 'movePlayerTo', data: { x: 380 }, duration: 1200 },
  { time: 2700, action: 'setPlayerSprite', data: 'idle' },

  // 3. Garage door starts opening (~13s) + player shocked
  { time: 3000, action: 'playSfx', data: garageDoorSound },
  { time: 3000, action: 'startGarageDoorOpen' },
  { time: 4000, action: 'setPlayerSprite', data: 'lookForward' },
  { time: 16000, action: 'setPlayerSprite', data: 'shocked' },

  // 4. Boss appears at center after door opens
  { time: 16000, action: 'cycleGarageDoorOpen' },
  { time: 16000, action: 'spawnBoss' },
  { time: 16000, action: 'setBossSprite',   data: 'blink' },
  { time: 16000, action: 'setBossPosition', data: { x: 400, y: 280 } },
  { time: 16000, action: 'playSfx',         data: evilLaughSfx },

  // 5. Boss exits garage spinning and grows
  { time: 19000, action: 'setBossSprite',     data: 'spin' },
  { time: 19000, action: 'setBossOpacity',   data: 0 },
  { time: 19000, action: 'playSfx',          data: fireWindsSwoosh, duration: 10000 },
  { time: 19000, action: 'tweenBossPosition', data: { x: 500, y: 'floor' }, duration: 10000 },
  { time: 19000, action: 'tweenBossScale',    data: { scale: 1.0 }, duration: 10000 },
  { time: 19000, action: 'tweenBossOpacity',  data: { opacity: 1 }, duration: 1500 },

  // 6. Player runs left to battle position
  { time: 20000, action: 'autoRunLeft',     data: true },
  { time: 20000, action: 'setPlayerSprite', data: 'walk' },
  { time: 20000, action: 'movePlayerTo',    data: { x: 200, y: 'floor' }, duration: 4000 },
  { time: 24000, action: 'setPlayerFacing', data: 'right' },
  { time: 24000, action: 'setPlayerSprite', data: 'idle' },
  { time: 27500, action: 'playSfx', data: unruggabullVoiceSounds[7] },

  // 7. Both face off and hold
  { time: 29200, action: 'setBossSprite',   data: 'faceCamera' },

  // 8. Boss speaks
  { time: 29500, action: 'playSfx', data: helloUnruggabullSfx },

  // 9. Begin battle after dramatic pause
  { time: 32000, action: 'startMusic' },
  { time: 32000, action: 'startBattle' },
  { time: 32000, action: 'setPlayerControl', data: true },
  { time: 32000, action: 'showFightBanner' }
];
