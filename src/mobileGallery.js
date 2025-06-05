// Mobile gallery overlay logic (refactored)
;(function() {
  'use strict';

  // Constants
  const GALLERY_IMAGES = [
    'assets/gallery/rugco-empire.png',
    'assets/gallery/unruggabull-saves-the-day.png',
    'assets/gallery/he-was-unruggabull.png',
    'assets/gallery/unruggabull-the-board-game.png'
  ];
  const SWIPE_THRESHOLD = 40;
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const isSmallScreen = window.matchMedia('(max-width: 768px)').matches;

  document.addEventListener('DOMContentLoaded', () => {
    if (!isTouchDevice || !isSmallScreen) return;

    // UI elements
    const titleContainer = document.getElementById('title-container');
    const gameCanvas = document.getElementById('gameCanvas');
    if (!titleContainer || !gameCanvas) {
      console.warn('Missing #title-container or #gameCanvas');
      return;
    }
    titleContainer.style.display = 'none';
    gameCanvas.style.display = 'none';

    const overlay = document.getElementById('mobile-gallery-overlay');
    const splash = document.getElementById('mobile-splash');
    const galleryUI = document.getElementById('gallery-ui');
    if (!overlay || !splash || !galleryUI) {
      console.warn('Missing gallery overlay elements');
      return;
    }
    overlay.style.display = 'flex';

    // Controls
    const img = document.getElementById('gallery-image');
    const prevBtn = document.getElementById('gallery-prev');
    const nextBtn = document.getElementById('gallery-next');
    const musicBtn = document.getElementById('gallery-music');
    if (!img || !prevBtn || !nextBtn || !musicBtn) {
      console.warn('Missing gallery controls');
      return;
    }

    // Preload images
    GALLERY_IMAGES.forEach(src => {
      const pre = new Image();
      pre.src = src;
    });

    // CSS transition for fade
    img.style.transition = 'opacity 0.15s ease';

    // Accessibility attributes
    prevBtn.setAttribute('role', 'button');
    prevBtn.setAttribute('aria-label', 'Previous image');
    nextBtn.setAttribute('role', 'button');
    nextBtn.setAttribute('aria-label', 'Next image');
    musicBtn.setAttribute('role', 'button');
    musicBtn.setAttribute('aria-label', 'Toggle music');

    // Inject close button
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '&times;';
    closeBtn.setAttribute('role', 'button');
    closeBtn.setAttribute('aria-label', 'Close gallery');
    closeBtn.classList.add('gallery-close-btn');
    overlay.appendChild(closeBtn);

    // State
    let currentIndex = 0;
    let playing = false;
    let touchStartX = null;

    // Audio setup
    const theme = new Audio('assets/audio/bgm/energetic-action-rock-music-336531.mp3');
    theme.loop = true;

    // Functions
    function showImage(i) {
      img.style.opacity = '0';
      setTimeout(() => {
        img.src = GALLERY_IMAGES[i];
        img.style.opacity = '1';
      }, 150);
    }

    function enterGallery() {
      splash.style.display = 'none';
      galleryUI.style.display = 'flex';
      currentIndex = 0;
      showImage(currentIndex);
      document.addEventListener('keydown', handleKey);
    }

    function handleKey(e) {
      if (e.key === 'ArrowLeft') prevBtn.click();
      else if (e.key === 'ArrowRight') nextBtn.click();
      else if (e.key === 'Escape') closeBtn.click();
    }

    // Event bindings
    splash.addEventListener('click', enterGallery);
    splash.addEventListener('touchstart', enterGallery);

    prevBtn.addEventListener('click', () => {
      currentIndex = (currentIndex - 1 + GALLERY_IMAGES.length) % GALLERY_IMAGES.length;
      showImage(currentIndex);
    });

    nextBtn.addEventListener('click', () => {
      currentIndex = (currentIndex + 1) % GALLERY_IMAGES.length;
      showImage(currentIndex);
    });

    musicBtn.addEventListener('click', () => {
      if (playing) {
        theme.pause();
        musicBtn.innerHTML = '►';
      } else {
        theme.currentTime = 0;
        theme.play().catch(err => console.warn('Audio play failed:', err));
        musicBtn.innerHTML = '❚❚';
      }
      playing = !playing;
    });

    img.addEventListener('touchstart', e => {
      touchStartX = e.touches[0].clientX;
    });

    img.addEventListener('touchend', e => {
      if (touchStartX === null) return;
      const dx = e.changedTouches[0].clientX - touchStartX;
      if (dx > SWIPE_THRESHOLD) prevBtn.click();
      else if (dx < -SWIPE_THRESHOLD) nextBtn.click();
      touchStartX = null;
    });

    closeBtn.addEventListener('click', () => {
      overlay.style.display = 'none';
      titleContainer.style.display = '';
      gameCanvas.style.display = '';
      galleryUI.style.display = 'none';
      document.removeEventListener('keydown', handleKey);
    });
  });
})(); 