hows about this?

Add a blaster energy bar UI for the player with the following behavior:

• The player starts with 20 blaster charges (max).
• Each time the player fires, 1 charge is consumed.
• If the bar reaches 0, the player cannot shoot until some energy is restored.
• Energy recharges automatically: 1 charge every 300ms until full.
• Show a horizontal bar on screen (e.g., top-left corner) representing energy level.

Visuals:
- Draw a background bar (dark gray or black)
- Draw a filled portion based on current energy (bright blue or orange)
- Flash red and play a sound (steam hissing) if player tries to shoot with no energy 

Variables to use in player state:
- `player.blasterEnergy = 20;` 
- `player.blasterMaxEnergy = 20;` 
- `player.blasterLastRechargeTime = 0;` 

Draw this bar in `render.js` or wherever HUD elements are handled. The recharge logic should run in `update(now)`.

You can use `ctx.fillRect()` to draw the bar.
