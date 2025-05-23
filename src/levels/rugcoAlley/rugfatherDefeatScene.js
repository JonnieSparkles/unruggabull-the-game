import { garageDoorCloseSound, unruggabullVoiceSounds } from '../../sound.js';

export const rugfatherDefeatTimeline = [
  // 0. Freeze player and start cinematic

  { time: 0, action: 'setCarpshitsFalling', data: true },
  { time: 0, action: 'setPlayerControl', data: false },
  { time: 500, action: 'clearEntities' },
  { time: 500, action: 'setRugfatherSprite', data: 'dead' },
  { time: 500, action: 'movePlayerToFloor' }, 
  { time: 500, action: 'setPlayerSprite', data: 'idle' },

  // 1. Walk to boss body
  { time: 1000, action: 'setPlayerSprite', data: 'walk' },
  { time: 1000, action: 'movePlayerTo', data: { x: 300 }, duration: 1500 },

  // 2. Play farewell
  { time: 2700, action: 'setPlayerSprite', data: 'idle' },
  { time: 2800, action: 'playSfx', data: unruggabullVoiceSounds[1] },

  // 3. Walk into garage
  { time: 4500, action: 'setPlayerSprite', data: 'walkForward' },
  { time: 4500, action: 'tweenPlayerPosition', data: { x: 480, y: 200 }, duration: 2000 },
  { time: 4500, action: 'tweenPlayerScale', data: { scale: 0.5 }, duration: 2000 },
  { time: 4500, action: 'fadeOutPlayer', duration: 2000 },

  // 4. Garage closes
  { time: 6700, action: 'playGarageCloseReverse' },
  { time: 6700, action: 'playSfx', data: garageDoorCloseSound },

  // 5. End scene
  { time: 8000, action: 'transitionTo', data: 'congrats' }
];
