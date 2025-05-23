import { garageDoorCloseSound, unruggabullVoiceSounds, rugfatherWeaveRemembersSfx } from '../../sound.js';

export const rugfatherDefeatTimeline = [
  // 0. Freeze player and start cinematic

  { time: 0, action: 'setCarpshitsFalling', data: true },
  { time: 0, action: 'setPlayerControl', data: false },
  { time: 0, action: 'setRugfatherSprite', data: 'dead' },
  { time: 0, action: 'tweenBossPosition', data: { y: 'floor'}, duration: 500 },
  { time: 500, action: 'movePlayerToFloor' }, 
  { time: 500, action: 'setPlayerSprite', data: 'idle' },
  { time: 1200, action: 'clearEntities' },

  // 1. Walk to ceter
  { time: 1000, action: 'setPlayerSprite', data: 'walk' },
  { time: 1000, action: 'movePlayerTo', data: { x: 400 }, duration: 1500 },

  // 2. Play farewell
  { time: 2500, action: 'setRugfatherSprite', data: 'dead' },
  { time: 2700, action: 'setPlayerFacing', data: 'left' },
  { time: 2700, action: 'setPlayerSprite', data: 'idle' },
  { time: 2800, action: 'playSfx', data: unruggabullVoiceSounds[1] },

  // 3. Walk into garage
  { time: 4500, action: 'setPlayerSprite', data: 'walkForward' },
  { time: 5000, action: 'playSfx', data: rugfatherWeaveRemembersSfx }, 
  { time: 4500, action: 'tweenPlayerPosition', data: { x: 480, y: 400 }, duration: 3000 },
  { time: 4500, action: 'tweenPlayerScale', data: { scale: 0.5 }, duration: 3000 },
  { time: 4500, action: 'fadeOutPlayer', duration: 3000 },

  // 4. Garage closes
  { time: 5000, action: 'playSfx', data: garageDoorCloseSound },
  { time: 5000, action: 'setBossExitDoorClosing' },

  // 5. End scene
  { time: 12000, action: 'clearEntities' },
  { time: 12000, action: 'transitionTo', data: 'congrats' }
];
