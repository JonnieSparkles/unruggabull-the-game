// Game logic for Unruggabull
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const sprite = new Image();
sprite.src = 'assets/sprites/unruggabull-walking.png';
const carpetSprite = new Image();
carpetSprite.src = 'assets/sprites/enemy-flying-carpet.png';
const deadSprite = new Image();
deadSprite.src = 'assets/sprites/unruggabull-dead.png';
const crouchSprite = new Image();
crouchSprite.src = 'assets/sprites/unruggabull-crouch.png';

// Sprite dimensions (visual)
const SPRITE_WIDTH = 48;
const SPRITE_HEIGHT = 80;

const player = {
  x: 50,
  feetY: 380, // 300 (ground) + 80 (height)
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
  health: 3,
  crouching: false
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
const NUM_CARPETS = 3;
const carpets = Array.from({ length: NUM_CARPETS }, () => ({
  x: canvas.width + 48 + Math.random() * 200,
  y: 80 + Math.random() * 180,
  vx: -(1.5 + Math.random()), // speed between -1.5 and -2.5
  alive: true,
  frame: 0,
  frameTimer: 0,
  falling: false,
  vy: 0,
  onFloor: false,
  respawnTimer: 0
}));

// Lower flying carpets (animated)
const NUM_LOWER_CARPETS = 2;
const lowerCarpets = Array.from({ length: NUM_LOWER_CARPETS }, () => ({
  x: canvas.width + 48 + Math.random() * 200,
  y: 300 + Math.random() * 40,
  vx: -(1 + Math.random()), // speed between -1 and -2
  alive: true,
  frame: 0,
  frameTimer: 0,
  falling: false,
  vy: 0,
  onFloor: false,
  respawnTimer: 0
}));

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
    const controlledKeys = ['a', 'A', 'd', 'D', 'j', 'J', 'f', 'F', 'Enter', ' ', 'c', 'C'];
    if (controlledKeys.includes(e.key)) e.preventDefault();
    keys[e.key] = true;
    if ((e.key === 'c' || e.key === 'C') && player.grounded) {
      player.crouching = true;
      player.height = 48;
      player.y = player.feetY - player.height;
    }
  });
  document.addEventListener('keyup', e => {
    const controlledKeys = ['a', 'A', 'd', 'D', 'j', 'J', 'f', 'F', 'Enter', ' ', 'c', 'C'];
    if (controlledKeys.includes(e.key)) e.preventDefault();
    keys[e.key] = false;
    if (e.key === 'c' || e.key === 'C') {
      player.crouching = false;
      player.height = 80;
      player.y = player.feetY - player.height;
    }
  });
}

// Insert helper functions to separate player logic
function handleMovement() {
  let isWalking = false;
  if (keys['d'] || keys['D']) {
    player.vx = player.speed;
    isWalking = true;
    player.facing = 1;
  } else if (keys['a'] || keys['A']) {
    player.vx = -player.speed;
    isWalking = true;
    player.facing = -1;
  } else {
    player.vx = 0;
  }
  wasWalking = isWalking;
}
function handleJumping() {
  if (keys[' '] && player.grounded) {
    player.vy = -12;
    player.jumping = true;
    player.grounded = false;
    jumpSound.currentTime = 0;
    jumpSound.play();
  }
}
function handlePhysics() {
  player.vy += 0.8; // gravity
  player.x += player.vx;
  player.feetY += player.vy;
  player.y = player.feetY - player.height;
  // platform collision
  let onPlatform = false;
  if (player.vy >= 0) {
    for (const p of platforms) {
      if (
        player.feetY <= p.y + player.vy &&
        player.feetY + player.vy >= p.y &&
        player.x + player.width > p.x &&
        player.x < p.x + p.width
      ) {
        player.feetY = p.y;
        player.vy = 0;
        player.jumping = false;
        player.grounded = true;
        player.y = player.feetY - player.height;
        onPlatform = true;
        break;
      }
    }
  }
  // ground collision
  if (!onPlatform) {
    if (player.feetY >= 380) {
      player.feetY = 380;
      player.vy = 0;
      player.jumping = false;
      player.grounded = true;
      player.y = player.feetY - player.height;
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
  // frame update
  if (player.vx !== 0) {
    player.frame = (player.frame + 1) % 40;
  } else {
    player.frame = 0;
  }
}
function handleCrouch() {
  if (!player.grounded && player.crouching) {
    player.crouching = false;
    player.height = 80;
    player.y = player.feetY - player.height;
  }
}
function handleFiring() {
  const fireKeyPressed = keys['f'] || keys['F'] || keys['j'] || keys['J'] || keys['Enter'];
  if (fireKeyPressed && !player.firing) {
    player.firing = true;
    fireBullet();
  } else if (!fireKeyPressed) {
    player.firing = false;
  }
}
function updatePlayer() {
  handleMovement();
  handleJumping();
  handlePhysics();
  handleCrouch();
  handleFiring();
}

function update() {
  if (gameState === 'dying') {
    // Animate body falling to the floor
    if (player.feetY < canvas.height - player.height) {
      player.vy += 1.2; // gravity
      player.feetY += player.vy;
      if (player.feetY > canvas.height - player.height) {
        player.feetY = canvas.height - player.height;
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
  updatePlayer();
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
  player.feetY = 380;
  player.vx = 0;
  player.vy = 0;
  player.jumping = false;
  player.grounded = true;
  player.firing = false;
  player.facing = 1;
  player.health = 3;
  killCount = 0;
  // Reset carpets with new random positions and speeds
  carpets.forEach(carpet => {
    carpet.x = canvas.width + 48 + Math.random() * 200;
    carpet.y = 80 + Math.random() * 180;
    carpet.vx = -(1.5 + Math.random());
    carpet.alive = true;
    carpet.frame = 0;
    carpet.frameTimer = 0;
    carpet.falling = false;
    carpet.vy = 0;
    carpet.onFloor = false;
    carpet.respawnTimer = 0;
  });
  // Reset lower carpets with new random positions and speeds
  lowerCarpets.forEach(carpet => {
    carpet.x = canvas.width + 48 + Math.random() * 200;
    carpet.y = 300 + Math.random() * 40;
    carpet.vx = -(1 + Math.random());
    carpet.alive = true;
    carpet.frame = 0;
    carpet.frameTimer = 0;
    carpet.falling = false;
    carpet.vy = 0;
    carpet.onFloor = false;
    carpet.respawnTimer = 0;
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

let DEBUG_HITBOXES = true; // Set to false to hide all debug hitboxes
let showDevSettings = false;
let prevGameState = null;

// Screen flash when reaching 15 kills
let flashActive = false;
let flashEndTime = 0;
const FLASH_DURATION = 200;
const PHASE_CHANGE_KILL_COUNT = 15;

// Difficulty settings
let difficultyLevel = 1;
let nextPhaseKillCount = PHASE_CHANGE_KILL_COUNT;

// Dev overlay: show and manually set difficulty
let showDifficulty = false;

// Spawn additional carpets and lower carpets for difficulty increases
function spawnCarpet() {
  carpets.push({
    x: canvas.width + 48 + Math.random() * 200,
    y: 80 + Math.random() * 180,
    vx: -(1.5 + Math.random()),
    alive: true,
    frame: 0,
    frameTimer: 0,
    falling: false,
    vy: 0,
    onFloor: false,
    respawnTimer: 0
  });
}
function spawnLowerCarpet() {
  lowerCarpets.push({
    x: canvas.width + 48 + Math.random() * 200,
    y: 300 + Math.random() * 40,
    vx: -(1 + Math.random()),
    alive: true,
    frame: 0,
    frameTimer: 0,
    falling: false,
    vy: 0,
    onFloor: false,
    respawnTimer: 0
  });
}
// Increase difficulty: bump level, set next threshold, and add new enemies
function increaseDifficulty() {
  difficultyLevel++;
  nextPhaseKillCount += PHASE_CHANGE_KILL_COUNT;
  spawnCarpet();
  spawnLowerCarpet();
}
// Decrease difficulty: lower level, adjust threshold, and remove spawned enemies
function decreaseDifficulty() {
  if (difficultyLevel > 1) {
    difficultyLevel--;
    nextPhaseKillCount = Math.max(PHASE_CHANGE_KILL_COUNT, nextPhaseKillCount - PHASE_CHANGE_KILL_COUNT);
    // Remove one carpet and lowerCarpet if above initial counts
    if (carpets.length > NUM_CARPETS) carpets.pop();
    if (lowerCarpets.length > NUM_LOWER_CARPETS) lowerCarpets.pop();
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw flash overlay if active
  if (flashActive) {
    const now = performance.now();
    if (now < flashEndTime) {
      ctx.save();
      // Fade out overlay
      const alpha = 0.8 * ((flashEndTime - now) / FLASH_DURATION);
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
    } else {
      flashActive = false;
    }
  }

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

  // draw difficulty if toggled
  if (showDifficulty) {
    ctx.save();
    ctx.font = '24px Arial';
    ctx.fillStyle = '#0ff';
    ctx.textAlign = 'center';
    ctx.fillText(`Difficulty: ${difficultyLevel}`, canvas.width / 2, 70);
    ctx.restore();
  }

  // draw platforms first so sprites are in front
  drawPlatforms();

  // draw player
  if (gameState === 'dying') {
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
    if (player.crouching) {
      ctx.save();
      if (player.facing < 0) {
        ctx.translate(player.x + player.width, player.feetY - SPRITE_HEIGHT);
        ctx.scale(-1, 1);
        ctx.drawImage(crouchSprite, 0, 0, SPRITE_WIDTH, SPRITE_HEIGHT, 0, 0, SPRITE_WIDTH, SPRITE_HEIGHT);
      } else {
        ctx.drawImage(crouchSprite, 0, 0, SPRITE_WIDTH, SPRITE_HEIGHT, player.x, player.feetY - SPRITE_HEIGHT, SPRITE_WIDTH, SPRITE_HEIGHT);
      }
      ctx.restore();
    } else {
      if (player.firing) {
        frameIndex = 3; // Use the last frame (index 3) for firing
      } else {
        frameIndex = Math.floor(player.frame / 10) % 4;
      }
      ctx.save();
      if (player.facing < 0) {
        ctx.translate(player.x + player.width, player.feetY - SPRITE_HEIGHT);
        ctx.scale(-1, 1);
        ctx.drawImage(sprite, frameIndex * SPRITE_WIDTH, 0, SPRITE_WIDTH, SPRITE_HEIGHT, 0, 0, SPRITE_WIDTH, SPRITE_HEIGHT);
      } else {
        ctx.drawImage(sprite, frameIndex * SPRITE_WIDTH, 0, SPRITE_WIDTH, SPRITE_HEIGHT, player.x, player.feetY - SPRITE_HEIGHT, SPRITE_WIDTH, SPRITE_HEIGHT);
      }
      ctx.restore();
    }
  }

  if (DEBUG_HITBOXES) {
    ctx.save();
    ctx.strokeStyle = 'lime';
    ctx.lineWidth = 2;
    ctx.strokeRect(player.x, player.y, player.width, player.height);
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

  // Dev settings overlay
  if (showDevSettings) {
    ctx.save();
    ctx.globalAlpha = 0.95;
    ctx.fillStyle = '#222';
    ctx.fillRect(canvas.width/2 - 180, canvas.height/2 - 80, 360, 260);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    ctx.strokeRect(canvas.width/2 - 180, canvas.height/2 - 80, 360, 260);
    ctx.font = 'bold 28px Arial';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.fillText('Dev Settings', canvas.width/2, canvas.height/2 - 40);
    ctx.font = '22px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Show Hitboxes', canvas.width/2 - 120, canvas.height/2 + 10);
    // Checkbox for hitboxes
    ctx.strokeRect(canvas.width/2 + 60, canvas.height/2 - 10, 28, 28);
    if (DEBUG_HITBOXES) {
      ctx.fillRect(canvas.width/2 + 62, canvas.height/2 - 8, 24, 24);
    }
    // Checkbox for difficulty
    ctx.fillText('Show Difficulty', canvas.width/2 - 120, canvas.height/2 + 50);
    ctx.strokeRect(canvas.width/2 + 60, canvas.height/2 + 30, 28, 28);
    if (showDifficulty) {
      ctx.fillRect(canvas.width/2 + 62, canvas.height/2 + 32, 24, 24);
    }
    // Manual difficulty controls
    ctx.fillText(`Difficulty Level: ${difficultyLevel}`, canvas.width/2 - 120, canvas.height/2 + 90);
    const btnSize = 24;
    const minusX = canvas.width/2 + 60;
    const minusY = canvas.height/2 + 74;
    ctx.strokeRect(minusX, minusY, btnSize, btnSize);
    ctx.textAlign = 'center';
    ctx.fillText('-', minusX + btnSize/2, minusY + btnSize/2 + 4);
    const plusX = minusX + btnSize + 10;
    ctx.strokeRect(plusX, minusY, btnSize, btnSize);
    ctx.fillText('+', plusX + btnSize/2, minusY + btnSize/2 + 4);
    // Draw close 'X' button
    const closeX = canvas.width/2 + 140;
    const closeY = canvas.height/2 - 70;
    ctx.save();
    ctx.font = 'bold 28px Arial';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.fillText('×', closeX + 15, closeY + 25);
    ctx.restore();
    ctx.restore();
  }
}

function fireBullet() {
  const direction = player.facing;

  // Precise offset: always spawn at the front edge of the sprite
  const bulletOffsetX = direction === 1
    ? player.width - 6  // right-facing: front-right
    : -6;               // left-facing: just left of player
  const bulletOffsetY = player.crouching
    ? player.height / 2
    : player.height / 2 + 5;
  const bulletX = player.x + bulletOffsetX;
  const bulletY = player.y + bulletOffsetY;

  // Optional debug
  // console.log("Bullet:", { x: bulletX, y: bulletY, facing: direction, crouching: player.crouching, vx: 10 * direction });
  bullets.push({
    x: bulletX,
    y: bulletY,
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
  if (DEBUG_HITBOXES) {
    ctx.save();
    ctx.fillStyle = 'red';
    bullets.forEach(bullet => {
      ctx.beginPath();
      ctx.arc(bullet.x, bullet.y, 2, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }
}

function updateCarpets() {
  carpets.forEach(carpet => {
    if (carpet.falling) {
      carpet.vy += 0.7; // gravity
      carpet.y += carpet.vy;
      if (carpet.y >= canvas.height - 48) {
        carpet.y = canvas.height - 48;
        carpet.falling = false;
        carpet.onFloor = true;
        carpet.respawnTimer = performance.now();
      }
      return;
    }
    if (!carpet.alive && carpet.onFloor) {
      // Respawn after 2-4 seconds
      if (performance.now() - carpet.respawnTimer > 2000 + Math.random() * 2000) {
        const fromLeft = killCount >= PHASE_CHANGE_KILL_COUNT && Math.random() < 0.5;
        if (fromLeft) {
          carpet.x = -48 - Math.random() * 200;
          carpet.vx = 1.5 + Math.random();
        } else {
          carpet.x = canvas.width + 48 + Math.random() * 200;
          carpet.vx = -(1.5 + Math.random());
        }
        carpet.y = 80 + Math.random() * 180; // random y between 80 and 260
        carpet.alive = true;
        carpet.frame = 0;
        carpet.frameTimer = 0;
        carpet.falling = false;
        carpet.vy = 0;
        carpet.onFloor = false;
        carpet.respawnTimer = 0;
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
      // Wrap carpets on trailing side: left-moving wrap to right, right-moving wrap to left
      if (carpet.vx < 0 && carpet.x < -48) {
        carpet.x = canvas.width + 48;
      } else if (carpet.vx > 0 && carpet.x > canvas.width + 48) {
        carpet.x = -48;
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
    if (DEBUG_HITBOXES) {
      ctx.save();
      ctx.strokeStyle = 'red';
      ctx.lineWidth = 2;
      ctx.strokeRect(carpet.x, yDraw, 48, 48);
      ctx.restore();
    }
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
        // Trigger flash on reaching 15
        if (killCount === nextPhaseKillCount) {
          flashActive = true;
          flashEndTime = performance.now() + FLASH_DURATION;
          increaseDifficulty();
        }
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
      if (carpet.y >= canvas.height - 48) {
        carpet.y = canvas.height - 48;
        carpet.falling = false;
        carpet.onFloor = true;
        carpet.respawnTimer = performance.now();
      }
      return;
    }
    if (!carpet.alive && carpet.onFloor) {
      // Respawn after 2-4 seconds
      if (performance.now() - carpet.respawnTimer > 2000 + Math.random() * 2000) {
        const fromLeft = killCount >= PHASE_CHANGE_KILL_COUNT && Math.random() < 0.5;
        if (fromLeft) {
          carpet.x = -48 - Math.random() * 200;
          carpet.vx = 1 + Math.random();
        } else {
          carpet.x = canvas.width + 48 + Math.random() * 200;
          carpet.vx = -(1 + Math.random());
        }
        carpet.y = 300 + Math.random() * 40; // random y for lower carpets
        carpet.alive = true;
        carpet.frame = 0;
        carpet.frameTimer = 0;
        carpet.falling = false;
        carpet.vy = 0;
        carpet.onFloor = false;
        carpet.respawnTimer = 0;
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
      // Wrap carpets on trailing side: left-moving wrap to right, right-moving wrap to left
      if (carpet.vx < 0 && carpet.x < -48) {
        carpet.x = canvas.width + 48;
      } else if (carpet.vx > 0 && carpet.x > canvas.width + 48) {
        carpet.x = -48;
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
    if (DEBUG_HITBOXES) {
      ctx.save();
      ctx.strokeStyle = 'red';
      ctx.lineWidth = 2;
      ctx.strokeRect(carpet.x, yDraw, 48, 48);
      ctx.restore();
    }
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
        // Trigger flash on reaching 15
        if (killCount === nextPhaseKillCount) {
          flashActive = true;
          flashEndTime = performance.now() + FLASH_DURATION;
          increaseDifficulty();
        }
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
  ctx.fillText('Move: A/D', canvas.width / 2, 140);
  ctx.fillText('Jump: Space', canvas.width / 2, 180);
  ctx.fillText('Fire: F, J, or Enter', canvas.width / 2, 220);
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
  // Add respawn timer property to carpets and lowerCarpets
  carpets.forEach(c => c.respawnTimer = 0);
  lowerCarpets.forEach(c => c.respawnTimer = 0);
}

document.addEventListener('keydown', function(e) {
  // Toggle dev settings window with CTRL+SHIFT+Q
  if (e.ctrlKey && e.shiftKey && (e.key === 'q' || e.key === 'Q')) {
    if (!showDevSettings && (gameState === 'playing' || gameState === 'dying')) {
      prevGameState = gameState;
      gameState = 'paused-dev';
      showDevSettings = true;
      draw();
    } else if (showDevSettings && gameState === 'paused-dev') {
      showDevSettings = false;
      gameState = prevGameState || 'playing';
      prevGameState = null;
      gameLoop();
    } else {
      showDevSettings = !showDevSettings;
      draw();
    }
  }
});

canvas.addEventListener('click', function(e) {
  if (!showDevSettings) return;
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;
  // Checkbox area
  const cbx = canvas.width/2 + 60, cby = canvas.height/2 - 10, cbw = 28, cbh = 28;
  if (mx >= cbx && mx <= cbx + cbw && my >= cby && my <= cby + cbh) {
    DEBUG_HITBOXES = !DEBUG_HITBOXES;
    draw();
    return;
  }
  // Difficulty toggle checkbox
  const dbx = canvas.width/2 + 60, dby = canvas.height/2 + 30, dbw = 28, dbh = 28;
  if (mx >= dbx && mx <= dbx + dbw && my >= dby && my <= dby + dbh) {
    showDifficulty = !showDifficulty;
    draw();
    return;
  }
  // Manual difficulty buttons
  const btnSize = 24;
  const minusX = canvas.width/2 + 60, minusY = canvas.height/2 + 74;
  if (mx >= minusX && mx <= minusX + btnSize && my >= minusY && my <= minusY + btnSize) {
    decreaseDifficulty();
    draw();
    return;
  }
  const plusX = minusX + btnSize + 10;
  if (mx >= plusX && mx <= plusX + btnSize && my >= minusY && my <= minusY + btnSize) {
    increaseDifficulty();
    draw();
    return;
  }
  // Close button area
  const closeX = canvas.width/2 + 140, closeY = canvas.height/2 - 70, closeW = 30, closeH = 30;
  if (mx >= closeX && mx <= closeX + closeW && my >= closeY && my <= closeY + closeH) {
    showDevSettings = false;
    if (gameState === 'paused-dev') {
      gameState = prevGameState || 'playing';
      prevGameState = null;
      gameLoop();
    } else {
      draw();
    }
    return;
  }
}); 