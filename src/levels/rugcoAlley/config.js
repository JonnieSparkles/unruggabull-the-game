import drawRugcoBackground from './background.js';
import rugfatherBoss from './rugfather.js';
import { PLATFORM_WIDTH, PLATFORM_HEIGHT } from '../../physics.js';

export default {
  key: 'rugcoAlley',
  name: 'RUGCO ALLEY',
  background: drawRugcoBackground,
  boss: rugfatherBoss,
  music: 'assets/audio/bgm/rugco_alley_theme.mp3',
  floorY: 520,
  wrapHorizontal: false,
  bossTriggerDifficulty: 6,
  phaseChangeKillCount: 15,
  platforms: [
    { x: 200, y: 450, width: PLATFORM_WIDTH, height: PLATFORM_HEIGHT },
    { x: 450, y: 274, width: PLATFORM_WIDTH, height: PLATFORM_HEIGHT },
    { x: 320, y: 350, width: PLATFORM_WIDTH, height: PLATFORM_HEIGHT },
    { x: 400, y: 400, width: PLATFORM_WIDTH, height: PLATFORM_HEIGHT }
  ]
}; 