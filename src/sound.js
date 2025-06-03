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
fireSound.volume = 0.08;

/**
 * Unruggabull reactions.
 */
export const difficultyIncreaseSounds = [
  new Audio('assets/audio/sfx/unruggabull/unruggabull-oh-yeaaaa.mp3'),
  new Audio('assets/audio/sfx/unruggabull/unruggabull-permanence.mp3'),
  // Add more as needed
];

/**
 * Unruggabull reactions.
 */
export const unruggabullVoiceSounds = [
  new Audio('assets/audio/sfx/unruggabull/unruggabull-game-over.mp3'),
  new Audio('assets/audio/sfx/unruggabull/unruggabull-goodbye-rugfather.mp3'),
  new Audio('assets/audio/sfx/unruggabull/unruggabull-lets-go.mp3'),
  new Audio('assets/audio/sfx/unruggabull/unruggabull-oh-yeaaaa.mp3'),
  new Audio('assets/audio/sfx/unruggabull/unruggabull-ow.mp3'),
  new Audio('assets/audio/sfx/unruggabull/unruggabull-permanence.mp3'),
  new Audio('assets/audio/sfx/unruggabull/unrugabull-do-do-do.mp3'),
  new Audio('assets/audio/sfx/unruggabull/unruggabull-oh-shit.mp3'),
  // Add more as needed
];

/**
 * Carpshit death sound.
 */
export const carpshitDeathSound = new Audio('assets/audio/sfx/carpshit/carpshit-death.mp3');

/**
 * Game over sound.
 */
export const gameOverSound = new Audio('assets/audio/sfx/unruggabull/unruggabull-game-over.mp3');
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
export const fireWindsSwoosh = new Audio('assets/audio/sfx/fire-winds-swoosh.mp3');

// Rugfather voice lines
export const evilLaughSfx = new Audio('assets/audio/sfx/rugfather/rugfather-ha-ha-evil-echo-laugh.mp3');
export const helloUnruggabullSfx = new Audio('assets/audio/sfx/rugfather/rugfather-hello-unruggabull.mp3');
export const challengeMeSfx = new Audio('assets/audio/sfx/rugfather/rugfather-challenge-me.mp3');
export const wovenIntoRugSfx = new Audio('assets/audio/sfx/rugfather/rugfather-woven-into-rug.mp3');
export const heatThingsUpSfx = new Audio('assets/audio/sfx/rugfather/rugfather-heat-things-up.mp3');
export const muhahahaSfx = new Audio('assets/audio/sfx/rugfather/rugfather-muhahaha.mp3');
export const rugfatherWeaveRemembersSfx = new Audio('assets/audio/sfx/rugfather/rugfather-weave-remembers.mp3');
export const rugfatherOuchSfx = new Audio('assets/audio/sfx/rugfather/rugfather-ouch.mp3');
export const rugfatherOwSfx = new Audio('assets/audio/sfx/rugfather/rugfather-ow.mp3');

// Blaster empty sound for no-energy attempts
export const blasterEmptySound = new Audio('assets/audio/sfx/blaster-fx-343681.mp3');
blasterEmptySound.volume = 1.0;

