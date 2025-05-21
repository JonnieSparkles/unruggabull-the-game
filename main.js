// main.js: App startup & system glue (Your "Game Launcher")

// Import the game engine core to expose window.startGame
import './src/game.js';

// Title screen music
const titleMusic = new Audio('assets/audio/bgm/energetic-action-rock-music-336531.mp3');
titleMusic.loop = true;
titleMusic.volume = 0.5;

const letsGoSound = new Audio('assets/audio/sfx/unruggabull/unruggabull-lets-go.mp3');
letsGoSound.volume = 1.0;

/**
 * Enable title music on first user interaction, then remove overlay.
 */
function enableTitleMusic() {
  titleMusic.currentTime = 0;
  titleMusic.play();
  const overlay = document.getElementById('sound-overlay');
  if (overlay) overlay.style.display = 'none';
  document.removeEventListener('click', enableTitleMusic);
  document.removeEventListener('keydown', enableTitleMusic);
  document.removeEventListener('touchstart', enableTitleMusic);
}

/**
 * Detect mobile user agents.
 */
function isMobile() {
  return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop|webOS|BlackBerry/i.test(navigator.userAgent);
}

// Wait for DOM ready to set up UI event handlers
document.addEventListener('DOMContentLoaded', function() {
  // Setup title music on first interaction
  if (!isMobile()) {
    document.addEventListener('click', enableTitleMusic);
    document.addEventListener('keydown', enableTitleMusic);
    document.addEventListener('touchstart', enableTitleMusic);
  }

  const titleContainer = document.getElementById('title-container');
  const startBtn = document.getElementById('start-btn');
  const canvas = document.getElementById('gameCanvas');
  // Disable the game canvas until the game starts
  canvas.style.pointerEvents = 'none';
  
  startBtn.onclick = function() {
    // Transition from title screen to game
    titleMusic.pause();
    titleMusic.currentTime = 0;
    letsGoSound.currentTime = 0;
    letsGoSound.play();
    setTimeout(() => {
      titleContainer.style.opacity = 0;
      canvas.style.opacity = 1;
      setTimeout(() => {
        titleContainer.style.display = 'none';
        canvas.style.pointerEvents = '';
        // Launch the game engine
        window.startGame();
      }, 700);
    }, 1000);
  };

  // Allow pressing Enter to start the game
  document.addEventListener('keydown', function(e) {
    const overlay = document.getElementById('sound-overlay');
    if ((e.key === 'Enter' || e.code === 'Enter') &&
        titleContainer && titleContainer.style.display !== 'none' &&
        (!overlay || overlay.style.display === 'none')) {
      startBtn.click();
    }
  });

  // Version label and credits modal logic
  const versionLabel = document.getElementById('version-label');
  const creditsModal = document.getElementById('credits-modal');
  const closeCredits = document.getElementById('close-credits');
  if (versionLabel && creditsModal && closeCredits) {
    versionLabel.onclick = function() { creditsModal.style.display = 'flex'; };
    closeCredits.onclick = function() { creditsModal.style.display = 'none'; };
    creditsModal.onclick = function(e) { if (e.target === creditsModal) creditsModal.style.display = 'none'; };
  }
});
