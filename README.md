# Unruggabull: RugCo Alley

A browser-based 2D platformer game featuring a jumpy, gun-toting bull! Built with vanilla JavaScript and HTML5 Canvas.

## Features
- Title screen with music, smooth fade-in transition, and version number
- Responsive controls: walk, jump, and fire
- Animated character with directional movement and firing pose
- Dramatic death animation: Unruggabull falls and displays a unique dead sprite
- Game over sequence with sound, message, and a restart button (with hover effect)
- Bullets with sound effects
- Flying carpet enemies with falling death animation
- Kill counter and health display
- Credits modal: click the version number on the title screen to view full attributions (loads `credits.txt` in a modal)
- Background music and sound effects for all actions
- Organized asset structure for easy expansion
- **Mobile-friendly:** On mobile devices, users see a fullscreen Unruggabull gallery with music and swipe/tap navigation
- **Truly Unruggabull:** The game and its assets are saved on Arweave for permanent, censorship-resistant hosting

## Controls
- **A/D**: Move
- **Space**: Jump
- **F, J, or Enter**: Fire
- **Start Game**: Click the button on the title screen
- **Restart**: Click the restart button after game over

## Asset Organization
```
assets/
  audio/
    bgm/
      platform-shoes-8-bit-chiptune-instrumental-336417.mp3
      energetic-action-rock-music-336531.mp3
    sfx/
      jump_c_02-102843.mp3
      pulse-laser-blast-135820.mp3
      lets-go.mp3
      man-death-scream-186763.mp3
      game-over.mp3
  images/
    title-screen.png
    level-rugco-alley.png
  sprites/
    unruggabull-walking.png
    unruggabull-dead.png
    enemy-flying-carpet.png
```

- **audio/bgm/**: Background music
- **audio/sfx/**: Sound effects (jump, fire, death, game over, etc.)
- **images/**: Backgrounds, title screens, UI images
- **sprites/**: Sprite sheets and character images

## Setup & Running
1. Clone or download this repository.
2. Ensure all assets are in the correct folders as shown above.
3. Open `index.html` in your browser.
4. On the title screen, press any key to enable music, then click "Start Game" to play!
5. Click the version number at the bottom of the title screen to view credits.

> **Note:** Gameplay is only available on desktop browsers. On mobile, you can view the Unruggabull gallery and listen to the theme song.

## Credits

See [credits.txt](credits.txt) for full attributions and asset sources. The credits are also viewable in-game via the version link.

If you use or distribute this project, please respect the licenses of all included assets.

---

**Unruggabull is permanently hosted on [Arweave](https://www.arweave.org/), making it truly unruggable!**

## Mobile Gallery

If you open Unruggabull on a mobile device, you'll see a fullscreen gallery of Unruggabull images with swipe/tap navigation and a music button. 

You can customize the gallery images by editing the `galleryImages` array in `scripts/mobile-gallery.js`.

Enjoy Unruggabull!
