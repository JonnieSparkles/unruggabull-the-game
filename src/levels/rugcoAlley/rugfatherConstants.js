// Boss-specific timing constants for the Rugfather fight
export const BOSS_HOLD_DURATION = 1000; // ms to pause before boss transition
export const BLINK_OUT_DURATION = 800;  // ms for blink-out effect before platforms disappear

// Boss HP and phase constants
export const MAX_HP = 45;
export const NUM_PHASES = 3;

// Phase configurations: attack cooldown in ms per phase
export const PHASE_ATTACK_COOLDOWNS = {
  1: 3000, // easy
  2: 2000, // medium
  3: 1000  // hard
};

// Phase 1 movement constants
export const PHASE1_MOVE_AMPLITUDE = 80;        // px left/right
export const PHASE1_MOVE_PERIOD = 5000;         // ms for full cycle
export const PHASE1_JUMP_HEIGHT = 40;           // px jump bob
export const PHASE1_JUMP_PERIOD = 8000;         // ms for jump cycle

// Blink pattern and total duration
export const BLINK_PATTERN = [600, 300, 900, 200, 1200, 150, 1500, 100, 1800]; // ms on/off
export const BLINK_TOTAL_DURATION = BLINK_PATTERN.reduce((a, b) => a + b, 0);

// Boss sprite dimensions
export const BOSS_WIDTH = 256;
export const BOSS_HEIGHT = 256; 