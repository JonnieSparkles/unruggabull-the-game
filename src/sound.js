// Sound module: game effects and music

/**
 * Background music (looped).
 */
export const bgMusic = new Audio();
bgMusic.loop = true;
bgMusic.volume = 0.3;

/**
 * Player firing sound.
 */
export const fireSound = new Audio('assets/audio/sfx/blaster-fire.mp3');

/**
 * Unruggabull reactions.
 */
export const difficultyIncreaseSounds = [
  new Audio('assets/audio/sfx/unruggabull/oh-yeaaaa.mp3'),
  new Audio('assets/audio/sfx/unruggabull/permanence.mp3'),
  // Add more as needed
];

/**
 * Carpshit death sound.
 */
export const carpshitDeathSound = new Audio('assets/audio/sfx/carpshit/carpshit-death.mp3');

/**
 * Game over sound.
 */
export const gameOverSound = new Audio('assets/audio/sfx/unruggabull/game-over.mp3');
gameOverSound.volume = 1.0;

/**
 * Garage door opening sound for boss transition.
 */
export const garageDoorSound = new Audio('assets/audio/sfx/garage-door-opening.mp3');

/**
 * Garage door closing sound for the exit sequence after boss defeat.
 */
export const garageDoorCloseSound = new Audio('assets/audio/sfx/garage-door-closing.mp3');
garageDoorCloseSound.volume = 1.0;

// Entrance sound effects
export const evilLaughSfx = new Audio('assets/audio/sfx/rugfather/ha-ha-evil-echo-laugh.mp3');
export const fireWindsSwoosh = new Audio('assets/audio/sfx/fire-winds-swoosh.mp3');
export const helloUnruggabullSfx = new Audio('assets/audio/sfx/rugfather/hello-unruggabull.mp3'); 