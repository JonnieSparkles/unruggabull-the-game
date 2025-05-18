// Sound module: game effects and music

/**
 * Background music (looped).
 */
export const bgMusic = new Audio('assets/audio/bgm/platform-shoes-8-bit-chiptune-instrumental-336417.mp3');
bgMusic.loop = true;
bgMusic.volume = 0.3;
window.bgMusic = bgMusic;

/**
 * Player firing sound.
 */
export const fireSound = new Audio('assets/audio/sfx/pulse-laser-blast-135820.mp3');

/**
 * Enemy death sound.
 */
export const carpetDeathSound = new Audio('assets/audio/sfx/man-death-scream-186763.mp3');

/**
 * Game over sound.
 */
export const gameOverSound = new Audio('assets/audio/sfx/game-over.mp3');
gameOverSound.volume = 1.0; 