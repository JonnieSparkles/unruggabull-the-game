import { walkingSprite, crouchSprite, jumpingSprite, shockedSprite, walkingForwardSprite, deadSprite } from './assets.js';

// Map of logical player states to their sprite sheets and animation settings
export const PLAYER_SPRITES = {
  idle:        { image: walkingSprite,    animated: false, frame: 0, offsetY: 0 },
  walk:        { image: walkingSprite,    animated: true,  frameCount: 4, frameDuration: 100, offsetY: 0 },
  crouch:      { image: crouchSprite,     animated: true,  frameCount: 4, frameDuration: 100, offsetY: 0 },
  jump:        { image: jumpingSprite,    animated: false, frame: 0, offsetY: 0 },
  shocked:     { image: shockedSprite,     animated: true,  frameCount: 4, frameDuration: 150, offsetY: 0 },
  walkForward: { image: walkingForwardSprite, animated: true, frameCount: 4, frameDuration: 100, offsetY: 0 },
  dead:        { image: deadSprite,        animated: false, frame: 0, offsetY: 0 },
  fire:        { image: walkingSprite,    animated: false, frame: 3, offsetY: 0 }
}; 