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
 * Difficulty increase sound.
 */
export const difficultyIncreaseSound = new Audio('assets/audio/sfx/unruggabull/oh-yeaaaa.mp3');

/**
 * Carpshit death sound.
 */
export const carpshitDeathSound = new Audio('assets/audio/sfx/carpshit-death.mp3');

/**
 * Game over sound.
 */
export const gameOverSound = new Audio('assets/audio/sfx/unruggabull/game-over.mp3');
gameOverSound.volume = 1.0;

/**
 * Garage door opening sound for boss transition.
 */
export const garageDoorSound = new Audio('assets/audio/sfx/garage-door-opening.mp3'); 