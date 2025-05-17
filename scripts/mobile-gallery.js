// Mobile gallery overlay logic
const galleryImages = [
  'assets/gallery/rugco-empire.png',
  'assets/gallery/unruggabull-saves-the-day.png',
  'assets/gallery/he-was-unruggabull.png',
  'assets/gallery/unruggabull-the-board-game.png'
];
function isMobile() {
  return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop|webOS|BlackBerry/i.test(navigator.userAgent);
}
document.addEventListener('DOMContentLoaded', function() {
  if (isMobile()) {
    // Hide game UI, show gallery overlay
    document.getElementById('title-container').style.display = 'none';
    document.getElementById('gameCanvas').style.display = 'none';
    const overlay = document.getElementById('mobile-gallery-overlay');
    overlay.style.display = 'flex';
    // Splash logic
    const splash = document.getElementById('mobile-splash');
    const galleryUI = document.getElementById('gallery-ui');
    // Gallery logic
    let idx = 0;
    const img = document.getElementById('gallery-image');
    const prevBtn = document.getElementById('gallery-prev');
    const nextBtn = document.getElementById('gallery-next');
    const musicBtn = document.getElementById('gallery-music');
    const theme = new Audio('assets/audio/bgm/energetic-action-rock-music-336531.mp3');
    theme.loop = true;
    let playing = false;
    function showImg(i) {
      img.style.opacity = 0;
      setTimeout(() => {
        img.src = galleryImages[i];
        img.style.opacity = 1;
      }, 150);
    }
    function enterGallery() {
      splash.style.display = 'none';
      galleryUI.style.display = 'flex';
      idx = 0;
      showImg(idx);
    }
    splash.addEventListener('click', enterGallery);
    splash.addEventListener('touchstart', enterGallery);
    prevBtn.onclick = function() {
      idx = (idx - 1 + galleryImages.length) % galleryImages.length;
      showImg(idx);
    };
    nextBtn.onclick = function() {
      idx = (idx + 1) % galleryImages.length;
      showImg(idx);
    };
    // Touch swipe support
    let startX = null;
    img.addEventListener('touchstart', e => {
      startX = e.touches[0].clientX;
    });
    img.addEventListener('touchend', e => {
      if (startX === null) return;
      let dx = e.changedTouches[0].clientX - startX;
      if (dx > 40) prevBtn.onclick();
      else if (dx < -40) nextBtn.onclick();
      startX = null;
    });
    // Play/Pause theme
    musicBtn.onclick = function() {
      if (playing) {
        theme.pause();
        musicBtn.innerHTML = '&#9835;';
      } else {
        theme.currentTime = 0;
        theme.play();
        musicBtn.innerHTML = '&#9835;';
      }
      playing = !playing;
    };
  }
}); 