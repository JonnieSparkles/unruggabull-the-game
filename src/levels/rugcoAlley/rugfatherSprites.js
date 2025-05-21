// Boss sprite assets for Rugfather
const bossSpriteSheet = new Image();
bossSpriteSheet.src = 'assets/sprites/levels/rugcoAlley/rugfather-sprite.png';
const bossDeadSprite = new Image();
bossDeadSprite.src = 'assets/sprites/levels/rugcoAlley/rugfather-dead.png';

// Map of logical boss states to sprite sheets and animation info
export const RUGFATHER_SPRITES = {
  idle:        { image: bossSpriteSheet, animated: false, frame: 1, frameWidth: 128, frameHeight: 128 },
  spin:        { image: bossSpriteSheet, animated: true,  frameSequence: [
    {frame:2, mirror:false},
    {frame:3, mirror:false},
    {frame:4, mirror:false},
    {frame:5, mirror:false},
    {frame:6, mirror:false},
    {frame:5, mirror:true},
    {frame:4, mirror:true},
    {frame:3, mirror:true}
  ], frameDuration: 200, frameWidth: 128, frameHeight: 128 },
  blink:       { image: bossSpriteSheet, animated: false, frame: 0, frameWidth: 128, frameHeight: 128 },
  attack:      { image: bossSpriteSheet, animated: true,  frameSequence: [7,8,9,10,11], frameDuration: 300, frameWidth: 128, frameHeight: 128 },
  hit:       { image: bossSpriteSheet, animated: false, frame: 12, frameWidth: 128, frameHeight: 128 },
  dead:        { image: bossDeadSprite,  animated: true, frameSequence: [0,1,2,3], frameDuration: 200, frameWidth: 192, frameHeight: 192 }
}; 