// Boss sprite assets for Rugfather
const bossSpriteSheet = new Image();
bossSpriteSheet.src = 'assets/sprites/levels/rugcoAlley/rugfather-sprite.png';
const bossDeadSprite = new Image();
bossDeadSprite.src = 'assets/sprites/levels/rugcoAlley/rugfather-dead.png';

// Map of logical boss states to sprite sheets and animation info
export const RUGFATHER_SPRITES = {
  idle:        { image: bossSpriteSheet, animated: false, frame: 1 },
  spin:        { image: bossSpriteSheet, animated: true,  frameSequence: [2,3,4,5,6,6,5,4,3,2], frameDuration: 200 },
  blink:       { image: bossSpriteSheet, animated: false, frame: 0 },
  attack:      { image: bossSpriteSheet, animated: true,  frameSequence: [7,8,9], frameDuration: 300 },
  dead:        { image: bossDeadSprite,  animated: false, frameSequence: [0,1,2,3], frameDuration: 200 }
}; 