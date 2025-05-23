import { deadSprite, playerMasterSprite } from './assets.js';

// Map of logical player states to their sprite sheets and animation settings
export const PLAYER_SPRITES = {
  idle:        { image: playerMasterSprite,    animated: false, frame: 0, offsetY: 0, frameWidth: 64, frameHeight: 96 },
  walk:        { image: playerMasterSprite,    animated: true,  frameSequence: [
    {frame: 0, mirror: false},
    {frame: 1, mirror: false},
    {frame: 2, mirror: false},
    {frame: 3, mirror: false}
  ], frameDuration: 100, offsetY: 0, frameWidth: 64, frameHeight: 96 },
  crouch:      { image: playerMasterSprite,     animated: true,  frameSequence: [
    {frame: 5, mirror: false},
    {frame: 6, mirror: false},
    {frame: 7, mirror: false},
    {frame: 8, mirror: false}
  ], frameDuration: 100, offsetY: 0, frameWidth: 64, frameHeight: 96 },
  crouchIdle:  { image: playerMasterSprite,     animated: false, frame: 5, offsetY: 0, frameWidth: 64, frameHeight: 96 },
  jump:        { image: playerMasterSprite,    animated: false, frame: 4, offsetY: 0, frameWidth: 64, frameHeight: 96 },
  shocked:     { image: playerMasterSprite,    animated: true,  frameSequence: [
    {frame: 13, mirror: false},
    {frame: 14, mirror: false},
    {frame: 15, mirror: false},
    {frame: 16, mirror: false}
  ], frameDuration: 150, offsetY: 0, frameWidth: 64, frameHeight: 96 },
  hit:         { image: playerMasterSprite,       animated: false, frame: 17, offsetY: 0, frameWidth: 64, frameHeight: 96 },
  walkForward: { image: playerMasterSprite, animated: true, frameSequence: [
    {frame: 9, mirror: false},
    {frame: 10, mirror: false},
    {frame: 11, mirror: false},
    {frame: 12, mirror: false}
  ], frameDuration: 100, offsetY: 0, frameWidth: 64, frameHeight: 96 },
  lookForward:        { image: playerMasterSprite,        animated: false, frame: 13, offsetY: 0, frameWidth: 64, frameHeight: 96 },
  dead:        { image: deadSprite,        animated: false, frame: 0, offsetY: 0, frameWidth: 128, frameHeight: 96 },
  fire:        { image: playerMasterSprite,    animated: false, frame: 3, offsetY: 0, frameWidth: 64, frameHeight: 96 },
  crouchFire:        { image: playerMasterSprite,    animated: false, frame: 8, offsetY: 0, frameWidth: 64, frameHeight: 96 }
}; 