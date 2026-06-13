# One-Shot Minecraft Clone Benchmark, Prompt v1

Frozen 2026-06-10. This text never changes silently: any edit becomes Prompt v2 and
starts a new results era in RESULTS.md. Official runs: paste everything below the
horizontal rule, verbatim, into a fresh chat with no custom instructions and no
project context. One prompt, one response, no follow-ups.

Provenance: forged by a 14-agent ensemble (3 domain checklist agents, merge, drafting
panel, 3-lens judge panel, synthesis). Panel note: the "tiered" candidate was lost to
a session-limit failure mid-forge and the "craftsman" candidate went unjudged; the
winning "maximalist" draft was fully judged, and the tiered philosophy's core ideas
(tier gating, completeness over feature count) were independently enforced as hard
rules and survive in the final text. Recorded here for honesty about v1's lineage.

---

BENCHMARK, one shot, rerun for years: the most complete, polished, ambitious Minecraft-style voxel game one response can hold.

OUTPUT CONTRACT (violations score zero)
1.1 One complete self-contained HTML file in one code block: no prose, no questions; the single response is final.
1.2 Runs by double-clicking in modern desktop Chrome: no build step, no server.
1.3 Any stack or rendering approach; public-CDN script libraries (or none) are the only permitted network dependency.
1.4 No external assets (image/audio/texture URLs); everything procedural or embedded.
1.5 One top-of-file constant SEED=1337 drives all generation; reloading reproduces identical spawn terrain.
1.6 Target smooth 60fps on an Apple Silicon MacBook in Chrome; graded under HUD FPS, not zero-gated.
1.7 Truncated or non-running files score zero; complete-and-runnable beats one more feature: budget to finish, ending with the literal closing tag </html> (absence = truncation).

GRADING: ten minutes' play, sound on; items pass/fail (Core 2, Stretch/Wow 1); a failed Core item loses only its points; only contract violations zero the run; A/B means either passes. Finish Core before Stretch/Wow code, attempted only if the file still fits; a flourish breaking Core costs more than its absence.

WORLDGEN
Core:
Terrain mixes large hills with finer bumps; never flat, never spiky.
4+ biomes (plains/desert/forest/snowy), distinct palettes, all within 3 minutes' walk.
Trees: log trunks, leaf canopies, never green pillars.
Low terrain fills to one global sea level.
Sand beaches wherever land meets water.
Dig down: grass, several dirt, then stone.
2+ minutes' walk hits no wall, edge, or void.
Seamless chunk borders: no gaps, missing columns, height mismatches.
Spawn standing on solid ground, camera clear, not falling/underwater/embedded.
Walk 100 blocks away and back: terrain/trees identical.
Stretch:
Plains/desert flatter; mountain/snowy taller, steeper.
Contiguous biome regions tens-of-blocks wide, gradual height/color blends; no confetti/straight-walls.
Caves: 3+ block air tunnels in stone, reachable by digging.
Ore-textured blocks (coal/iron) in deep stone.
Unbreakable bedrock floor; falling out impossible.
Scattered flowers/grass-tufts on plains/forest surfaces.
Per-biome trees (oak vs spruce/snowy-pine); none in desert.
Seed shown on screen AND settable via ?seed= URL parameter.
True overhangs/ledges with air beneath, beyond pure heightmaps.
Deep oceans, floor several blocks down, not one-block puddles.
Chunks stream ahead while walking, no freezes/missing patches.
Cacti only on desert sand, no flowers/leafy-trees there; vegetation never floats.
Consistent altitude snow line: white above, rock/grass below.
Wow: walkable cave mouths, dark interiors; winding rivers feeding larger waters; per-biome grass/leaf tints; coal shallow, rarer ores deeper; fog veils chunk pop-in.

PLAYER
Core:
Click locks pointer; Esc unlocks; click re-locks, repeatedly, cleanly.
Smooth uninverted look; pitch clamps near 90deg, no flip/roll.
Camera-relative WASD, correct after turning: W toward view, A/D strafe.
Parabolic jump mounts one block, never two; no double-jump.
Never sink/fall through floors, even at chunk borders/unloaded terrain.
Walls stop movement; repeated pushing never penetrates.
Ceilings stop ascent; camera never enters blocks above.
Reach 4-6 blocks; no highlight/interaction beyond, or on sky.
Wireframe/highlight on the exact targeted block, tracking instantly.
Left-click breaks the target instantly; geometry updates cleanly.
Right-click places in the targeted face's adjacent cell, never diagonal/wrong-cell.
Placement inside the player rejected; self-entombment impossible.
Visible hotbar, 3-5+ block types, clear selection indicator.
1-9 AND scroll wheel both switch slots (no page scroll/zoom); placements match selection.
Centered crosshair readable on sky and dark ground; affected block always under it.
Right-click never opens the context menu, even briefly unlocked.
Stretch:
Sprint (hold-key or double-tap-W): clear speed gain, ends on release.
Diagonal pushes into walls slide smoothly, no sticking.
Diagonal speed normalized: W+D no faster than W.
Raycast stops at first solid block; nothing acts through walls.
Breaking the block underfoot drops you cleanly, no jitter/stuck-state.
Tab-away 10+ seconds: no teleport/launch/floor-fall (clamp timestep).
Held left-click mines blocks one at a time, visible per-block delay.
Pillar jumping: jump, place beneath yourself, rise, no clipping.
Fly toggle (F/double-Space) with ascend/descend; off restores gravity/collision.
Water: slowed movement, slow sink; Space swims up.
Wow: sprint FOV widens within a second, easing back; sneak: slower, lower camera, edge-guarded; translucent ghost preview of next placement.

RENDERING/UI/AUDIO
Core:
Procedural pixel-detail textures; grass/dirt/stone/sand/wood each distinct; no flat colors.
Directional shading: tops brightest, sides differ by facing.
No hairline gaps, slits, missing faces anywhere, any angle.
Breaking reveals textured faces behind, never sky/void holes, even at chunk edges.
No z-fighting flicker anywhere while moving.
Distance fog fades far terrain; no hard edge.
Semi-transparent blue water; continuous sand/dirt bed visible beneath, no void faces.
Controls overlay at start or via key: real bindings, dismissible, reopenable; testers get no docs.
Esc/labeled-key pause overlay; resuming restores full control cleanly.
HUD: FPS, integer coordinates, seed; FPS 30+ always, 50+ while sprinting/spinning.
Rapid break/place: no hitches (fast remeshing).
Stretch:
Grass blocks: green top, dirt bottom, green-fringed sides.
Ambient occlusion: corners/crevices visibly darker than open faces.
Fog matches horizon sky through time-of-day; no gray band.
Sun disc visibly moves; day-night cycle in 10 minutes OR an overlay-listed key skips time; dusk/dawn light shifts.
Cloud layer drifts visibly.
Submerged camera: blue tint/fog until surfacing.
Break particles match block color: scatter, fall, vanish in seconds.
Hotbar shows textured thumbnails, not plain squares/text.
Pause freezes day-cycle/clouds/particles/physics; resume continues exactly.
Distinct break/place sounds, working from first click.
Wow: night stars/moon, warm dusk/dawn horizons; animated water (ripples/waves/moving texture); progressive crack stages, canceling on release/look-away; held-block viewmodel swapping with selection; footsteps while walking, silent idle/airborne; ambient soundscape with mute; torch/glowstone brightening nearby faces at night.

OPEN DIMENSION (uncapped, never saturates): polish, atmosphere, cohesion, invention beyond this list can outscore the whole Wow tier, judged on how alive it feels; list such features in an HTML comment atop the file. Never risk an incomplete file here: 1.7 wins.

Respond now with the file. Final reminder: 1.7 outranks every checklist item; stop adding features early enough to finish and close </html>.
