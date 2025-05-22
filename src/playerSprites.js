import { walkingSprite, crouchSprite, jumpingSprite, shockedSprite, walkingForwardSprite, deadSprite } from './assets.js';

// Map of logical player states to their sprite sheets and animation settings
export const PLAYER_SPRITES = {
  idle:        { image: walkingSprite,    animated: false, frame: 0, offsetY: 0, frameWidth: 64, frameHeight: 96 },
  walk:        { image: walkingSprite,    animated: true,  frameSequence: [
    {frame: 0, mirror: false},
    {frame: 1, mirror: false},
    {frame: 2, mirror: false},
    {frame: 3, mirror: false}
  ], frameDuration: 100, offsetY: 0, frameWidth: 64, frameHeight: 96 },
  crouch:      { image: crouchSprite,     animated: true,  frameSequence: [
    {frame: 0, mirror: false},
    {frame: 1, mirror: false},
    {frame: 2, mirror: false},
    {frame: 3, mirror: false}
  ], frameDuration: 100, offsetY: 0, frameWidth: 64, frameHeight: 96 },
  crouchIdle:  { image: crouchSprite,     animated: false, frame: 0, offsetY: 0, frameWidth: 64, frameHeight: 96 },
  jump:        { image: jumpingSprite,    animated: false, frame: 0, offsetY: 0, frameWidth: 64, frameHeight: 96 },
  shocked:     { image: shockedSprite,    animated: true,  frameSequence: [
    {frame: 0, mirror: false},
    {frame: 1, mirror: false},
    {frame: 2, mirror: false},
    {frame: 3, mirror: false}
  ], frameDuration: 150, offsetY: 0, frameWidth: 64, frameHeight: 96 },
  walkForward: { image: walkingForwardSprite, animated: true, frameSequence: [
    {frame: 0, mirror: false},
    {frame: 1, mirror: false},
    {frame: 2, mirror: false},
    {frame: 3, mirror: false}
  ], frameDuration: 100, offsetY: 0, frameWidth: 96, frameHeight: 96 },
  dead:        { image: deadSprite,        animated: false, frame: 0, offsetY: 0, frameWidth: 128, frameHeight: 96 },
  fire:        { image: walkingSprite,    animated: false, frame: 3, offsetY: 0, frameWidth: 64, frameHeight: 96 },
  crouchFire:        { image: crouchSprite,    animated: false, frame: 3, offsetY: 0, frameWidth: 64, frameHeight: 96 }
}; 