# Scorecard v1 (pairs with Prompt v1, Rubric v1)

Copy this file into the run folder, tick what passes during ten minutes of play
(sound on), then compute P = 2 x core + 1 x stretch + 1 x wow and
MPS = 10 + 30 x (P / 122) + open-dimension modifier (-3..+3, cap 43).
Half-working items fail. Evidence per tick: observed in play or screenshot.

- Model (exact ID):
- Date / Prompt version / Attempt / Official?:
- Boot gate (opens by double-click, renders world, 60s no fatal console error, ends with `</html>`): PASS / FAIL
- P: ___ / 122 -> Checklist MPS: ___ , modifier: ___ , final MPS: ___

## Worldgen, Core (2 pts each)

- [ ] Rolling multi-scale terrain: large hills with finer bumps, not flat, not spiky
- [ ] Four-plus distinct biomes: 4+ visually distinct palettes within minutes of walking
- [ ] Trees with trunk and canopy: log trunks topped by leaves, not green pillars
- [ ] Sea-level water bodies: low terrain fills to one consistent global sea level
- [ ] Sand beaches at shorelines: sand strips wherever land meets water
- [ ] Surface soil layering: grass, then dirt, then stone when digging down
- [ ] Large explorable world: 2+ minutes of walking hits no wall, edge, or void
- [ ] Seamless chunk borders: no seams, gaps, missing columns, height mismatches
- [ ] Safe solid spawn: on load, standing on ground, not falling/underwater/embedded
- [ ] Stable revisited terrain: walk ~100 blocks away and back, identical terrain

## Worldgen, Stretch (1 pt each)

- [ ] Biome-specific terrain shapes: plains/desert flatter, mountain/snowy taller and steeper
- [ ] Coherent blended biome regions: large contiguous regions, gradual borders, no confetti
- [ ] Underground caves: air tunnels or caverns inside stone, reachable by digging
- [ ] Ore blocks in stone: distinct ore textures embedded at depth
- [ ] Bedrock bottom layer: unbreakable floor, falling out of the world impossible
- [ ] Flowers and grass tufts: natural scatter on plains and forest surfaces
- [ ] Per-biome tree variants: different tree types per biome, none in desert
- [ ] Seeded world regeneration: visible/settable seed, same seed reproduces spawn terrain
- [ ] Overhangs and ledges: true 3D overhangs with walkable air beneath
- [ ] Ocean biome expanse: deep water regions, floor several blocks down
- [ ] Streaming chunk loading: terrain keeps appearing ahead, no freezes or missing patches
- [ ] Vegetation placement rules: cacti only on desert sand, nothing floats midair
- [ ] Altitude snow line: white consistently above a certain altitude, not random patches

## Worldgen, Wow (1 pt each)

- [ ] Surface cave entrances: walkable cave mouths with dark interiors visible
- [ ] Rivers crossing terrain: winding channels feeding larger water bodies
- [ ] Biome-tinted foliage: grass and leaf colors shift subtly per biome
- [ ] Depth-based ore rarity: coal shallow, rarer ores only further down
- [ ] Horizon fog veil: fog conceals chunk pop-in at the world's generation edge

## Player, Core (2 pts each)

- [ ] Pointer lock with re-lock: click locks, Esc unlocks, click re-locks, repeatedly
- [ ] Smooth clamped mouse look: no jitter or inversion, pitch stops near 90 degrees
- [ ] Camera-relative WASD: W toward view, A/D strafe, correct after turning
- [ ] Calibrated jump with gravity arc: mounts one block, never two, no double-jump
- [ ] Solid floor collision: never sinks or falls through, even across chunk borders
- [ ] Wall collision without clipping: pushing never penetrates a block
- [ ] Ceiling collision: ascent stops at ceilings, camera never enters blocks
- [ ] Reach-limited block targeting: nothing highlights or interacts beyond 4-6 blocks
- [ ] Targeted block outline: highlight on the exact block under the crosshair, instant tracking
- [ ] Left-click breaks block: immediate removal, clean geometry update
- [ ] Right-click places on targeted face: correct adjacent cell, never diagonal
- [ ] No placing inside player: self-entombment impossible
- [ ] Multi-type hotbar: 3-5+ block types, clear selection indicator
- [ ] Hotbar switching works: 1-9 and scroll wheel both switch, placements match selection
- [ ] Centered readable crosshair: readable on sky and dark terrain, target always under it
- [ ] No right-click context menu: never pops, even when pointer briefly unlocks

## Player, Stretch (1 pt each)

- [ ] Sprint speed boost: clear speed gain that ends on release
- [ ] Wall sliding on contact: diagonal pushes slide smoothly, no sticking
- [ ] Diagonal speed normalized: W+D no faster than W alone
- [ ] No interaction through walls: raycast stops at first solid block
- [ ] Clean fall when undermined: breaking the block underfoot drops you smoothly
- [ ] Tab-away physics stability: 10+ seconds away, no teleport or floor-fall
- [ ] Hold-to-break mining: held click breaks successive blocks at a controlled rhythm
- [ ] Pillar jumping: jump, place beneath yourself, rise, no clipping
- [ ] Fly mode toggle: flight with ascend/descend, toggling off restores gravity
- [ ] Swimming in water: slowed movement, gentle sink, Space swims up

## Player, Wow (1 pt each)

- [ ] Sprint FOV kick: FOV widens on sprint, eases back on stop
- [ ] Sneak mode with edge guard: slower, lower camera, prevents walking off edges
- [ ] Ghost placement preview: translucent preview of the next placement

## Rendering/UI/Audio, Core (2 pts each)

- [ ] Procedural block textures: pixel detail, each block type visually distinct
- [ ] Per-face directional shading: tops brightest, sides differ by facing
- [ ] No seams or cracks: no hairline gaps or missing faces from any angle
- [ ] Break reveals solid faces: never a hole into sky or void, even at chunk edges
- [ ] No z-fighting flicker: no shimmer or striped flicker while moving
- [ ] Distance fog: far terrain fades gradually, no hard world edge
- [ ] Transparent water with visible floor: blue tint, continuous bed visible beneath
- [ ] Controls help overlay: real bindings, dismissible, reopenable
- [ ] Working pause mode: pause overlay, resume restores full control
- [ ] Steady FPS with live counter: HUD FPS 30+ always, 50+ while sprinting and spinning
- [ ] No block-edit hitching: rapid break/place causes no visible freeze

## Rendering/UI/Audio, Stretch (1 pt each)

- [ ] Grass multi-face texturing: green top, dirt bottom, green-fringed sides
- [ ] Ambient occlusion corners: crevices visibly darker where blocks meet
- [ ] Fog-sky horizon blend: fog color matches the horizon sky, no gray band
- [ ] Day-night cycle with sun disc: sun moves within a session (or a listed skip key), light shifts
- [ ] Drifting clouds: cloud layer visibly drifts
- [ ] Underwater view effect: submerged camera tints or fogs blue until surfacing
- [ ] Block-break particles with physics: fragments scatter, fall, vanish in seconds
- [ ] Hotbar textured icons: textured thumbnails, not plain squares or text
- [ ] Pause freezes simulation: day cycle, clouds, particles, physics all halt and resume
- [ ] Break and place sounds: distinct, audible, working from the first click

## Rendering/UI/Audio, Wow (1 pt each)

- [ ] Night sky and dusk tinting: stars and/or moon, warm sunrise/sunset hues
- [ ] Animated water surface: ripples, waves, or animated texture
- [ ] Mining crack progress: progressive crack stages, canceling on release or look-away
- [ ] Held-block viewmodel: rendered hand or block that swaps with hotbar selection
- [ ] Footstep audio: footsteps while walking, silent when idle or airborne
- [ ] Ambient audio with mute: background ambience with a working mute or volume control
- [ ] Emissive light blocks: torch or glowstone visibly brightens nearby faces

## Open dimension notes (modifier -3..+3)

What beyond the list made it feel alive (or dead)? Cite specifics.
