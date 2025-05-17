// Game logic for Unruggabull
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const sprite = new Image();
sprite.src = 'assets/sprites/unruggabull-walking.png';
const carpetSprite = new Image();
carpetSprite.src = 'assets/sprites/enemy-flying-carpet.png';

const player = {
  x: 50,
  y: 300,
  width: 48,
  height: 80,
  frame: 0,
  speed: 4,
  vx: 0,
  vy: 0,
  jumping: false,
  grounded: true,
  firing: false
};

const keys = {};
const bullets = [];

// Sound effects
const jumpSound = new Audio('assets/audio/sfx/jump_c_02-102843.mp3');
const fireSound = new Audio('assets/audio/sfx/pulse-laser-blast-135820.mp3');
const bgMusic = new Audio('assets/audio/bgm/platform-shoes-8-bit-chiptune-instrumental-336417.mp3');
const carpetDeathSound = new Audio('assets/audio/sfx/man-death-scream-186763.mp3');
bgMusic.loop = true;
bgMusic.volume = 0.4;
window.bgMusic = bgMusic;
let wasWalking = false;

// Flying carpet enemies
const carpets = [
  { x: 700, y: 220, vx: -2, alive: true, frame: 0, frameTimer: 0, falling: false, vy: 0, onFloor: false },
  { x: 400, y: 150, vx: -1.5, alive: true, frame: 0, frameTimer: 0, falling: false, vy: 0, onFloor: false },
  { x: 900, y: 100, vx: -2.5, alive: true, frame: 0, frameTimer: 0, falling: false, vy: 0, onFloor: false }
];

// Lower flying carpets (animated)
const lowerCarpets = [
  { x: 600, y: 340, vx: -1.5, alive: true, frame: 0, frameTimer: 0, falling: false, vy: 0, onFloor: false },
  { x: 300, y: 320, vx: -2, alive: true, frame: 0, frameTimer: 0, falling: false, vy: 0, onFloor: false }
];

// Platform system (fixed, non-overlapping)
const PLATFORM_WIDTH = 120;
const PLATFORM_HEIGHT = 16;
const platforms = [
  { x: 100, y: 260, width: PLATFORM_WIDTH, height: PLATFORM_HEIGHT },
  { x: 320, y: 210, width: PLATFORM_WIDTH, height: PLATFORM_HEIGHT },
  { x: 550, y: 170, width: PLATFORM_WIDTH, height: PLATFORM_HEIGHT },
  { x: 400, y: 300, width: PLATFORM_WIDTH, height: PLATFORM_HEIGHT }
];
function generatePlatforms() {
  /* No-op for fixed platforms */
}

function setupControls() {
  document.addEventListener('keydown', e => {
    keys[e.key] = true;
    if (e.key === 'f' && !player.firing) {
      player.firing = true;
      fireBullet();
    }
  });
  document.addEventListener('keyup', e => {
    keys[e.key] = false;
    if (e.key === 'f') player.firing = false;
  });
}

function update() {
  let isWalking = false;
  if (keys['ArrowRight']) {
    player.vx = player.speed;
    isWalking = true;
  } else if (keys['ArrowLeft']) {
    player.vx = -player.speed;
    isWalking = true;
  } else {
    player.vx = 0;
  }

  // (Optional) Play walk sound only when starting to walk
  // if (isWalking && !wasWalking) {
  //   walkSound.currentTime = 0;
  //   walkSound.play();
  // }
  wasWalking = isWalking;

  if (keys[' '] && player.grounded) {
    player.vy = -12;
    player.jumping = true;
    player.grounded = false;
    jumpSound.currentTime = 0;
    jumpSound.play();
  }

  player.vy += 0.8; // gravity
  player.x += player.vx;
  player.y += player.vy;

  // platform collision first
  let onPlatform = false;
  if (player.vy >= 0) {
    for (const p of platforms) {
      if (
        player.y + player.height <= p.y + player.vy &&
        player.y + player.height + player.vy >= p.y &&
        player.x + player.width > p.x &&
        player.x < p.x + p.width
      ) {
        player.y = p.y - player.height;
        player.vy = 0;
        player.jumping = false;
        player.grounded = true;
        onPlatform = true;
        break;
      }
    }
  }

  // ground collision (only if not on platform)
  if (!onPlatform) {
    if (player.y >= 300) {
      player.y = 300;
      player.vy = 0;
      player.jumping = false;
      player.grounded = true;
    } else {
      player.grounded = false;
    }
  }

  // horizontal wrap
  if (player.x + player.width < 0) {
    player.x = canvas.width;
  } else if (player.x > canvas.width) {
    player.x = -player.width;
  }

  if (player.vx !== 0) {
    player.frame = (player.frame + 1) % 40;
  } else {
    player.frame = 0;
  }

  updateBullets();
  updateCarpets();
  checkBulletCarpetCollisions();
  updateLowerCarpets();
  checkBulletLowerCarpetCollisions();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // draw player
  let frameIndex;
  if (player.firing) {
    frameIndex = 3; // Use the last frame (index 3) for firing
  } else {
    frameIndex = Math.floor(player.frame / 10) % 4;
  }
  ctx.save();
  if (player.vx < 0) {
    ctx.translate(player.x + 48, player.y);
    ctx.scale(-1, 1);
    ctx.drawImage(sprite, frameIndex * 48, 0, 48, 80, 0, 0, 48, 80);
  } else {
    ctx.drawImage(sprite, frameIndex * 48, 0, 48, 80, player.x, player.y, 48, 80);
  }
  ctx.restore();

  drawBullets();
  drawCarpets();
  drawLowerCarpets();
  drawPlatforms();
}

function fireBullet() {
  // Determine direction: 1 for right, -1 for left
  const direction = player.vx < 0 ? -1 : 1;
  bullets.push({
    x: player.x + player.width / 2 + 20,
    y: player.y + player.height / 2 + 20,
    vx: 10 * direction,
    vy: 0
  });
  fireSound.currentTime = 0;
  fireSound.play();
}

function updateBullets() {
  for (let i = bullets.length - 1; i >= 0; i--) {
    bullets[i].x += bullets[i].vx;
    bullets[i].y += bullets[i].vy;
    // Remove if off screen
    if (bullets[i].x < 0 || bullets[i].x > canvas.width) {
      bullets.splice(i, 1);
    }
  }
}

function drawBullets() {
  ctx.fillStyle = '#ff0';
  bullets.forEach(bullet => {
    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, 6, 0, Math.PI * 2);
    ctx.fill();
  });
}

function updateCarpets() {
  carpets.forEach(carpet => {
    if (carpet.falling) {
      carpet.vy += 0.7; // gravity
      carpet.y += carpet.vy;
      if (carpet.y >= 300) {
        carpet.y = 300;
        carpet.falling = false;
        carpet.onFloor = true;
      }
      return;
    }
    if (!carpet.alive && !carpet.onFloor) return;
    if (carpet.alive) {
      carpet.x += carpet.vx;
      // Animate frames 0-2
      carpet.frameTimer++;
      if (carpet.frameTimer > 8) {
        carpet.frame = (carpet.frame + 1) % 3;
        carpet.frameTimer = 0;
      }
      // Loop carpets to the right if they go off screen
      if (carpet.x < -48) {
        carpet.x = canvas.width + 48;
      }
    }
  });
}

function drawCarpets() {
  carpets.forEach(carpet => {
    if (!carpet.alive && !carpet.falling && !carpet.onFloor) return;
    let frameToDraw = (carpet.alive) ? carpet.frame : 3;
    let yDraw = carpet.y;
    if (!carpet.alive && carpet.onFloor) {
      yDraw += 12;
    }
    ctx.drawImage(carpetSprite, frameToDraw * 48, 0, 48, 80, carpet.x, yDraw, 48, 80);
  });
}

function checkBulletCarpetCollisions() {
  carpets.forEach(carpet => {
    if (!carpet.alive) return;
    for (let i = bullets.length - 1; i >= 0; i--) {
      const bullet = bullets[i];
      // Simple AABB collision
      if (
        bullet.x > carpet.x && bullet.x < carpet.x + 48 &&
        bullet.y > carpet.y && bullet.y < carpet.y + 80
      ) {
        carpet.alive = false;
        carpet.frame = 3;
        carpet.falling = true;
        carpet.vy = 0;
        carpetDeathSound.currentTime = 0;
        carpetDeathSound.play();
        bullets.splice(i, 1);
        break;
      }
    }
  });
}

function updateLowerCarpets() {
  lowerCarpets.forEach(carpet => {
    if (carpet.falling) {
      carpet.vy += 0.7; // gravity
      carpet.y += carpet.vy;
      if (carpet.y >= 300) {
        carpet.y = 300;
        carpet.falling = false;
        carpet.onFloor = true;
      }
      return;
    }
    if (!carpet.alive && !carpet.onFloor) return;
    if (carpet.alive) {
      carpet.x += carpet.vx;
      // Animate frames 0-2
      carpet.frameTimer++;
      if (carpet.frameTimer > 8) {
        carpet.frame = (carpet.frame + 1) % 3;
        carpet.frameTimer = 0;
      }
      // Loop carpets to the right if they go off screen
      if (carpet.x < -48) {
        carpet.x = canvas.width + 48;
      }
    }
  });
}

function drawLowerCarpets() {
  lowerCarpets.forEach(carpet => {
    if (!carpet.alive && !carpet.falling && !carpet.onFloor) return;
    let frameToDraw = (carpet.alive) ? carpet.frame : 3;
    let yDraw = carpet.y;
    if (!carpet.alive && carpet.onFloor) {
      yDraw += 12;
    }
    ctx.drawImage(carpetSprite, frameToDraw * 48, 0, 48, 80, carpet.x, yDraw, 48, 80);
  });
}

function checkBulletLowerCarpetCollisions() {
  lowerCarpets.forEach(carpet => {
    if (!carpet.alive) return;
    for (let i = bullets.length - 1; i >= 0; i--) {
      const bullet = bullets[i];
      // Simple AABB collision
      if (
        bullet.x > carpet.x && bullet.x < carpet.x + 48 &&
        bullet.y > carpet.y && bullet.y < carpet.y + 80
      ) {
        carpet.alive = false;
        carpet.frame = 3;
        carpet.falling = true;
        carpet.vy = 0;
        carpetDeathSound.currentTime = 0;
        carpetDeathSound.play();
        bullets.splice(i, 1);
        break;
      }
    }
  });
}

function drawPlatforms() {
  ctx.fillStyle = '#964B00';
  platforms.forEach(p => {
    ctx.fillRect(p.x, p.y, p.width, p.height);
    ctx.strokeStyle = '#fff8';
    ctx.strokeRect(p.x, p.y, p.width, p.height);
  });
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

function startGame() {
  setupControls();
  generatePlatforms();
  bgMusic.currentTime = 0;
  bgMusic.play();
  if (sprite.complete && carpetSprite.complete) {
    gameLoop();
  } else {
    let loaded = 0;
    function tryStart() {
      loaded++;
      if (loaded >= 2) gameLoop();
    }
    sprite.onload = tryStart;
    carpetSprite.onload = tryStart;
  }
} 