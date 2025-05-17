// Game logic for Unruggabull
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const sprite = new Image();
sprite.src = 'assets/sprites/unruggabull-walking.png';
const carpetSprite = new Image();
carpetSprite.src = 'assets/sprites/enemy-flying-carpet.png';
const deadSprite = new Image();
deadSprite.src = 'assets/sprites/unruggabull-dead.png';

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
  firing: false,
  facing: 1, // 1 for right, -1 for left
  health: 3
};

const keys = {};
const bullets = [];

// Sound effects
const jumpSound = new Audio('assets/audio/sfx/jump_c_02-102843.mp3');
const fireSound = new Audio('assets/audio/sfx/pulse-laser-blast-135820.mp3');
const bgMusic = new Audio('assets/audio/bgm/platform-shoes-8-bit-chiptune-instrumental-336417.mp3');
const carpetDeathSound = new Audio('assets/audio/sfx/man-death-scream-186763.mp3');
const gameOverSound = new Audio('assets/audio/sfx/game-over.mp3');
bgMusic.loop = true;
bgMusic.volume = 0.3;
window.bgMusic = bgMusic;
gameOverSound.volume = 1.0;
let wasWalking = false;
let gameState = 'start'; // 'start', 'controls', 'playing', 'gameover'
let dyingStartTime = null;

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
  { x: 200, y: 260, width: PLATFORM_WIDTH, height: PLATFORM_HEIGHT },
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
  if (gameState === 'dying') {
    // Animate body falling to the floor
    if (player.y < canvas.height - player.height) {
      player.vy += 1.2; // gravity
      player.y += player.vy;
      if (player.y > canvas.height - player.height) {
        player.y = canvas.height - player.height;
        player.vy = 0;
        if (!dyingStartTime) dyingStartTime = performance.now();
      }
    } else {
      if (!dyingStartTime) dyingStartTime = performance.now();
      // Wait 1s after landing, then show game over
      if (performance.now() - dyingStartTime > 1000) {
        gameState = 'gameover';
      }
    }
    return;
  }
  if (gameState !== 'playing') return;
  let isWalking = false;
  if (keys['ArrowRight']) {
    player.vx = player.speed;
    isWalking = true;
    player.facing = 1;
  } else if (keys['ArrowLeft']) {
    player.vx = -player.speed;
    isWalking = true;
    player.facing = -1;
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
  checkPlayerCarpetCollisions();
}

let restartButton = {
  x: 0,
  y: 0,
  width: 200,
  height: 60
};

function resetGame() {
  player.x = 50;
  player.y = 300;
  player.vx = 0;
  player.vy = 0;
  player.jumping = false;
  player.grounded = true;
  player.firing = false;
  player.facing = 1;
  player.health = 3;
  killCount = 0;
  // Reset carpets
  carpets.forEach((carpet, i) => {
    const original = [
      { x: 700, y: 220, vx: -2 },
      { x: 400, y: 150, vx: -1.5 },
      { x: 900, y: 100, vx: -2.5 }
    ][i];
    carpet.x = original.x;
    carpet.y = original.y;
    carpet.vx = original.vx;
    carpet.alive = true;
    carpet.frame = 0;
    carpet.frameTimer = 0;
    carpet.falling = false;
    carpet.vy = 0;
    carpet.onFloor = false;
  });
  lowerCarpets.forEach((carpet, i) => {
    const original = [
      { x: 600, y: 340, vx: -1.5 },
      { x: 300, y: 320, vx: -2 }
    ][i];
    carpet.x = original.x;
    carpet.y = original.y;
    carpet.vx = original.vx;
    carpet.alive = true;
    carpet.frame = 0;
    carpet.frameTimer = 0;
    carpet.falling = false;
    carpet.vy = 0;
    carpet.onFloor = false;
  });
  bullets.length = 0;
  gameState = 'gameover';
}

canvas.addEventListener('click', function(e) {
  if (!gameState.includes('over')) return;
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;
  if (
    mx >= restartButton.x && mx <= restartButton.x + restartButton.width &&
    my >= restartButton.y && my <= restartButton.y + restartButton.height
  ) {
    resetGame();
    bgMusic.currentTime = 0;
    bgMusic.play();
    gameState = 'playing';
    gameLoop();
  }
});

let isRestartHover = false;

canvas.addEventListener('mousemove', function(e) {
  if (!gameState.includes('over')) return;
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;
  isRestartHover = (
    mx >= restartButton.x && mx <= restartButton.x + restartButton.width &&
    my >= restartButton.y && my <= restartButton.y + restartButton.height
  );
  if (gameState.includes('over')) draw();
});

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (gameState === 'controls') {
    showControlsScreen();
    return;
  }

  // draw health
  ctx.save();
  ctx.font = '24px Arial';
  ctx.fillStyle = '#f44';
  ctx.textAlign = 'left';
  ctx.fillText(`Health: ${player.health}`, 20, 40);
  ctx.restore();

  // draw kill counter
  ctx.save();
  ctx.font = '28px Arial';
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.fillText(`Unrugged: ${killCount}`, canvas.width / 2, 40);
  ctx.restore();

  // draw platforms first so sprites are in front
  drawPlatforms();

  // draw player
  if (gameState.includes('over') || gameState === 'dying') {
    ctx.save();
    if (player.facing < 0) {
      // Mirror horizontally, align bottom and center
      ctx.translate(player.x + player.width / 2, player.y + player.height - 80);
      ctx.scale(-1, 1);
      ctx.drawImage(deadSprite, 0, 0, 96, 96, -48, 0, 96, 96);
    } else {
      // Align bottom and center
      ctx.drawImage(deadSprite, 0, 0, 96, 96, player.x + player.width / 2 - 48, player.y + player.height - 80, 96, 96);
    }
    ctx.restore();
  } else {
    let frameIndex;
    if (player.firing) {
      frameIndex = 3; // Use the last frame (index 3) for firing
    } else {
      frameIndex = Math.floor(player.frame / 10) % 4;
    }
    ctx.save();
    if (player.facing < 0) {
      ctx.translate(player.x + 48, player.y);
      ctx.scale(-1, 1);
      ctx.drawImage(sprite, frameIndex * 48, 0, 48, 80, 0, 0, 48, 80);
    } else {
      ctx.drawImage(sprite, frameIndex * 48, 0, 48, 80, player.x, player.y, 48, 80);
    }
    ctx.restore();
  }

  drawBullets();
  drawCarpets();
  drawLowerCarpets();

  // draw game over message
  if (gameState.includes('over')) {
    ctx.save();
    // Game over text with shadow and bold font
    ctx.font = 'bold 45px Arial';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 12;
    ctx.lineWidth = 8;
    ctx.strokeStyle = '#fff';
    ctx.strokeText('Game over! You got rugged!', canvas.width / 2, canvas.height / 2);
    ctx.fillStyle = '#f44';
    ctx.shadowBlur = 0;
    ctx.fillText('Game over! You got rugged!', canvas.width / 2, canvas.height / 2);
    ctx.restore();

    // Draw restart button with hover effect
    ctx.save();
    ctx.font = '32px Arial';
    restartButton.width = 200;
    restartButton.height = 60;
    restartButton.x = canvas.width / 2 - restartButton.width / 2;
    restartButton.y = canvas.height / 2 + 40;
    ctx.textAlign = 'center';
    if (isRestartHover) {
      ctx.save();
      ctx.translate(restartButton.x + restartButton.width / 2, restartButton.y + restartButton.height / 2);
      ctx.scale(1.08, 1.15); // Slightly scale up on hover
      ctx.fillStyle = '#666';
      ctx.strokeStyle = '#ff0';
      ctx.lineWidth = 5;
      ctx.fillRect(-restartButton.width / 2, -restartButton.height / 2, restartButton.width, restartButton.height);
      ctx.strokeRect(-restartButton.width / 2, -restartButton.height / 2, restartButton.width, restartButton.height);
      ctx.fillStyle = '#ff0';
      ctx.font = '32px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Restart', 0, 12);
      ctx.restore();
    } else {
      ctx.fillStyle = '#222';
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 3;
      ctx.fillRect(restartButton.x, restartButton.y, restartButton.width, restartButton.height);
      ctx.strokeRect(restartButton.x, restartButton.y, restartButton.width, restartButton.height);
      ctx.fillStyle = '#fff';
      ctx.font = '32px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Restart', canvas.width / 2, restartButton.y + 40);
    }
    ctx.restore();
  }
}

function fireBullet() {
  // Determine direction: 1 for right, -1 for left
  const direction = player.vx < 0 ? -1 : 1;
  bullets.push({
    x: player.x + player.width / 2 + 20,
    y: player.y + player.height / 2 + 5,
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
        carpet.y = canvas.height - 48;
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
    ctx.drawImage(carpetSprite, frameToDraw * 48, 0, 48, 48, carpet.x, yDraw, 48, 48);
  });
}

let killCount = 0;

function checkBulletCarpetCollisions() {
  carpets.forEach(carpet => {
    if (!carpet.alive) return;
    for (let i = bullets.length - 1; i >= 0; i--) {
      const bullet = bullets[i];
      // Simple AABB collision
      if (
        bullet.x > carpet.x && bullet.x < carpet.x + 48 &&
        bullet.y > carpet.y && bullet.y < carpet.y + 48
      ) {
        carpet.alive = false;
        carpet.frame = 3;
        carpet.falling = true;
        carpet.vy = 0;
        carpetDeathSound.currentTime = 0;
        carpetDeathSound.play();
        bullets.splice(i, 1);
        killCount++;
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
        carpet.y = canvas.height - 48;
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
    ctx.drawImage(carpetSprite, frameToDraw * 48, 0, 48, 48, carpet.x, yDraw, 48, 48);
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
        bullet.y > carpet.y && bullet.y < carpet.y + 48
      ) {
        carpet.alive = false;
        carpet.frame = 3;
        carpet.falling = true;
        carpet.vy = 0;
        carpetDeathSound.currentTime = 0;
        carpetDeathSound.play();
        bullets.splice(i, 1);
        killCount++;
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

function checkPlayerCarpetCollisions() {
  if (gameState !== 'playing') return;
  // Check upper carpets
  carpets.forEach(carpet => {
    if (!carpet.alive) return;
    if (
      player.x + player.width > carpet.x && player.x < carpet.x + 48 &&
      player.y + player.height > carpet.y && player.y < carpet.y + 48
    ) {
      player.health--;
      carpet.alive = false;
      carpet.frame = 3;
      carpet.falling = true;
      carpet.vy = 0;
      carpetDeathSound.currentTime = 0;
      carpetDeathSound.play();
      if (player.health <= 0) {
        if (!gameState.includes('over') && gameState !== 'dying') {
          gameOverSound.currentTime = 0;
          gameOverSound.play();
          gameState = 'dying';
          dyingStartTime = null;
        }
      }
    }
  });
  // Check lower carpets
  lowerCarpets.forEach(carpet => {
    if (!carpet.alive) return;
    if (
      player.x + player.width > carpet.x && player.x < carpet.x + 48 &&
      player.y + player.height > carpet.y && player.y < carpet.y + 48
    ) {
      player.health--;
      carpet.alive = false;
      carpet.frame = 3;
      carpet.falling = true;
      carpet.vy = 0;
      carpetDeathSound.currentTime = 0;
      carpetDeathSound.play();
      if (player.health <= 0) {
        if (!gameState.includes('over') && gameState !== 'dying') {
          gameOverSound.currentTime = 0;
          gameOverSound.play();
          gameState = 'dying';
          dyingStartTime = null;
        }
      }
    }
  });
}

function showControlsScreen() {
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.85)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.font = 'bold 40px Arial';
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.fillText('Controls', canvas.width / 2, 80);
  ctx.font = '28px Arial';
  ctx.fillText('Move: Arrow Keys', canvas.width / 2, 140);
  ctx.fillText('Jump: Space', canvas.width / 2, 180);
  ctx.fillText('Fire: F', canvas.width / 2, 220);
  ctx.fillText('Press any key to start!', canvas.width / 2, 300);
  ctx.restore();
}

document.addEventListener('keydown', function controlsScreenHandler(e) {
  if (gameState === 'controls') {
    gameState = 'playing';
    gameLoop();
    // Remove this handler after first use
    document.removeEventListener('keydown', controlsScreenHandler);
  }
});

canvas.addEventListener('click', function controlsScreenClickHandler(e) {
  if (gameState === 'controls') {
    gameState = 'playing';
    gameLoop();
    // Remove this handler after first use
    canvas.removeEventListener('click', controlsScreenClickHandler);
  }
});

function gameLoop() {
  if (gameState !== 'playing' && gameState !== 'dying') return;
  update();
  draw();
  if ((gameState === 'playing' || gameState === 'dying')) {
    requestAnimationFrame(gameLoop);
  }
}

function startGame() {
  setupControls();
  generatePlatforms();
  bgMusic.currentTime = 0;
  bgMusic.play();
  if (sprite.complete && carpetSprite.complete) {
    gameState = 'controls';
    draw();
  } else {
    let loaded = 0;
    function tryStart() {
      loaded++;
      if (loaded >= 2) {
        gameState = 'controls';
        draw();
      }
    }
    sprite.onload = tryStart;
    carpetSprite.onload = tryStart;
  }
} 