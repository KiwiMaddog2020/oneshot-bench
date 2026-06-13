# Minecraft Parity Scale (MPS), Rubric v1

Frozen 2026-06-10. Every run on every track scores on this single scale.
100 is actual Minecraft, all features. The scale is deliberately brutal so the
benchmark never saturates: a model maxes it only by one-shotting something at
least as good as the real game. Today's best one-shots should land near 30.

## Boot gate

The artifact must open in Chrome by double-click, render a world, and survive 60
seconds of play with no fatal console error. Fail the gate and the run scores 0
(record the failure mode in the results row). A truncated file (missing `</html>`)
is an automatic gate failure.

## Anchor bands

| MPS | Anchor |
|----:|--------|
| 0 | Does not boot, or truncated |
| 10 | Boots, renders voxels, little real interaction |
| 20 | Walkable terrain demo: look, move, jump, but thin interaction |
| 30 | Strong one-shot clone: terrain, biomes, break/place, hotbar, mostly solid |
| 40-43 | Checklist perfection: all 85 items pass plus open-dimension excellence |
| 50 | Survival loop: full inventory, crafting, health/damage, basic mobs |
| 65 | Deep systems: smelting, farming, real light propagation, weather, caves that matter, combat with stakes |
| 80 | Minecraft alpha parity: the 2010 game, recognizably complete |
| 93 | Near-parity with modern Minecraft minus multiplayer |
| 100 | Actual Minecraft, all features |

## Computing the checklist band (0 to 43)

Itemized points from SCORECARD.md: P = 2 x core passes + 1 x stretch + 1 x wow
(maximum 122 from 37 core, 33 stretch, 15 wow).

MPS = 10 + 30 x (P / 122), then a judge modifier of -3 to +3 for the open
dimension (cohesion, atmosphere, invention beyond the list), capped at 43.

## Above 43: systems bands

Credit toward higher anchors comes from feature families, weighted roughly:
inventory with stacking (2), crafting table and recipes (4), tools with
durability and mining speeds (4), health, damage, and fall damage (2), hunger
and food (2), passive mobs (3), hostile mobs and combat (4), light-linked mob
spawning (1), smelting (2), farming and crop growth (2), light propagation
engine (3), weather (2), world save/load (2), villages or structures (3),
redstone-like logic (4). Judges score to the highest anchor fully satisfied,
then interpolate using these weights, citing evidence for every credited family.

## Judge integrity rules

- Every credited item needs evidence: an observed behavior in play, a screenshot,
  or a console-verified fact. Code reading may locate a feature, never credit it.
- Harsh by default: an item that half-works fails. Ties break downward.
- The same rubric text applies to every model in every year. If the rubric must
  change, that is Rubric v2 and results eras are annotated.
