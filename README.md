# Unruggabull: RugCo Alley

A browser-based 2D platformer featuring a jumpy, gun-toting bull and a dramatic boss fight in a seedy alley. Built with vanilla JavaScript and HTML5 Canvas.

## Table of Contents
- [Project Overview](#project-overview)
- [Directory Structure](#directory-structure)
- [Setup & Running](#setup--running)
- [Controls](#controls)
- [Development Workflow](#development-workflow)
- [Asset Organization](#asset-organization)
- [Credits & License](#credits--license)
- [Mobile Gallery](#mobile-gallery)

## Project Overview
Unruggabull is a fast-paced platformer where you control an armored bull, navigate levels, face flying enemies, and battle the formidable Rugfather boss. Key features:
- Responsive movement, jumping, and firing mechanics
- Animated sprites with state-driven frame sequences
- Dynamic enemy behaviors and collision logic
- Dramatic boss intro, multi-phase combat, and exit sequences
- DevTools overlay for live debugging and difficulty adjustments
- Organized, modular codebase for easy expansion

## Directory Structure
```text
unruggabull-the-game/
├── .gitignore
├── LICENSE.txt
├── README.md
├── changelog.txt
├── credits.txt
├── future-work.txt
├── index.html
├── main.js
├── assets/
│   ├── audio/
│   │   ├── bgm/            # Background music tracks
│   │   └── sfx/            # Sound effects (jump, fire, boss, etc.)
│   ├── gallery/            # Mobile-only gallery assets
│   ├── icons/              # UI icons
│   ├── images/             # Static images (title screen, backgrounds)
│   └── sprites/
│       └── levels/
│           └── rugcoAlley/ # Level-specific sprite sheets
└── src/
    ├── assets.js           # Preloaded images and sprites
    ├── constants/          # Game constants (player, timing, states)
    ├── collision.js        # Collision detection logic
    ├── controller.js       # Game loop orchestration
    ├── devtools.js         # DevTools overlay logic
    ├── input.js            # Keyboard input handling
    ├── levels/             # Level configurations and boss logic
    │   └── rugcoAlley/
    ├── mobile-gallery.js   # Mobile gallery logic
    ├── physics.js          # Platform and gravity logic
    ├── player.js           # Player state and input handling
    ├── projectiles/        # Bullet and carpet projectile modules
    ├── render.js           # Canvas rendering of game state
    ├── scripts/            # Additional scripts (if any)
    ├── state.js            # Centralized game state management
    ├── update.js           # Game update cycle (logic and AI)
    └── ui.js               # HUD and UI drawing functions
```

## Setup & Running
1. **Clone or Download** this repository.
2. Ensure assets are in the correct folders as shown above.
3. Open `index.html` in a modern browser (Chrome, Firefox, Edge).
4. On the title screen, press any key to enable audio, then click **Start Game**.
5. Use the in-game DevTools (`Ctrl+Shift+Q`) to toggle hitboxes and adjust difficulty.

## Controls
- **A / D**: Move left / right
- **Space**: Jump
- **F, J, or Enter**: Fire weapon
- **Restart**: Click the restart button after game over

## Development Workflow
- Code is modularized by feature (input, player, physics, enemies, projectiles, UI).
- Pull requests should include concise edits and comments for context.
- Linting and code style: 2-space indentation, 80-character max line length.
- Use the DevTools overlay (`Ctrl+Shift+Q`) to visualize hitboxes, tweak difficulty, and inspect state.

## Asset Organization
```text
assets/
├── audio/
│   ├── bgm/  # Background music tracks (.mp3)
│   └── sfx/  # Sound effects (.mp3)
├── images/   # Static images (title screens, UI)
└── sprites/  # Sprite sheets (characters, enemies, levels)
```

## Credits & License
See `credits.txt` for full attributions and asset sources. The project is MIT-licensed (`LICENSE.txt`).

## Mobile Gallery
On mobile devices, the game loads a fullscreen gallery with swipe/tap navigation:
```js
// scripts/mobile-gallery.js
const galleryImages = [ /* image URLs */ ];
```
Customize the `galleryImages` array to change the displayed images.

Enjoy Unruggabull!
