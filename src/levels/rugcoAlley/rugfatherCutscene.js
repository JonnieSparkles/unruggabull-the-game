import { evilLaughSfx, fireWindsSwoosh, helloUnruggabullSfx } from '../../sound.js';
import { FLASH_DURATION, BOSS_HOLD_DURATION, BLINK_OUT_DURATION } from '../../constants/timing.js';
import { garageDoorSound } from '../../sound.js';

// Master cutscene timeline for Rugfather boss intro and transition
export const cutsceneTimeline = [
  // Phase 1: Shock (0ms)
  { time: 0,    action: 'flashScreen',      data: FLASH_DURATION },
  { time: 0,    action: 'screenShake' },
  { time: 0,    action: 'setPlayerControl', data: false },
  { time: 0,    action: 'setPlayerSprite',  data: 'shocked' },

  // Phase 2: Garage Door & Fade Out (2000ms)
  { time: 2000, action: 'playSfx',          data: garageDoorSound },
  { time: 2000, action: 'fadeOutPlatforms' },
  { time: 2000, action: 'fadeOutEnemies' },

  // Phase 3: Clear Level (2700ms)
  { time: 2700, action: 'removePlatforms' },
  { time: 2700, action: 'removeEnemies' },

  // Phase 4: Boss Entrance (2700ms)
  { time: 2700, action: 'fadeInBoss',        duration: 1000 },
  { time: 2700, action: 'tweenBossPosition', data: { x: 300, y: 'floor' }, duration: 1000 },
  { time: 2700, action: 'tweenBossScale',    data: { scale: 2.0 },    duration: 1000 },
  // Boss Blink & Spin
  { time: 3200, action: 'setBossSprite',     data: 'blink' },
  { time: 4700, action: 'setBossSprite',     data: 'spin' },

  // Phase 5: Player Reaction (5200ms)
  { time: 5200, action: 'playSfx',           data: evilLaughSfx },
  { time: 5200, action: 'setPlayerSprite',   data: 'idle' },

  // Phase 6: Dialogue & Move (5700ms)
  { time: 5700, action: 'playSfx',           data: helloUnruggabullSfx },
  { time: 5700, action: 'autoRunLeft',       data: true },
  { time: 5700, action: 'setPlayerSprite',   data: 'walk' },
  { time: 6700, action: 'movePlayerTo',      data: { x: 100 },       duration: 1000 },

  // Phase 7: Battle Start (7700ms)
  { time: 7700, action: 'setPlayerFacing',   data: 'right' },
  { time: 7700, action: 'startBattle' },
  { time: 7700, action: 'setPlayerControl',  data: true },
]; 



