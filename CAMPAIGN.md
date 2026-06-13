# CAMPAIGN.md: the marathon's persistent plan

The planner's source of truth from round 11 onward: read it, pick lanes from
it, update it (keep under ~120 lines). Replaces greedy per-round planning.
Revisable at band crossings and on owner steering; never silently.

PROBE OVERRIDES CAMPAIGN (locked 2026-06-11): every round, before picking
lanes, the planner reconciles this file against the latest probe report. Any
arc item the probe invalidated gets a one-line dated amendment here first.
Fresh evidence always wins; the plan persists through amendments, not denial.

BREADTH BONUS (locked 2026-06-11): breadth lanes (new craftables, biomes,
foods, block/tree/structure variety) get an explicit selection bonus this
run: treat a strong breadth lane as worth +0.5 projected MPS beyond its
open-dimension pricing when ranking lanes. Rubric v2 makes breadth a
first-class family at the next model era; RUBRIC.md v1 stays frozen.

## Position (after round-11 rating, build = round-10 output)

MPS 45.4. Trajectory: 30, 33, 35, 37.5, 40, 41.9, 42.8, 43.4, 44.4, 45.0, 45.4.
Exit counter 2/3 (r10 +0.6, r11 +0.4).
[2026-06-12: corrected stale 45.6 / 0-of-3 line, round-10 score of record is
45.0 per TRAJECTORY.md (human override: -0.4 mouse-look parked, -0.1 swim);
r11 probe filed 1 verified fail, ending the zero-fail streak.]

## Family ledger (weights banked / total; true up from round-10-panel-partial.json)

- Banked whole or near: inventory 2/2, tools 4/4, health 2/2, hunger 2/2,
  smelting 2/2, farming 2/2, weather 2/2, save/load 2/2, hostile+combat ~4/4,
  passive mobs ~2.5/3 (sheep verification pending), light ~2.7/3.
- Open: redstone ~2.0/4 (repeaters/pistons-lite remain), villages ~2.3/3
  (inhabitants or richer sites remain), structures beyond hamlets, mob variety
  (creeper, more species), boats/minecarts, beds verification pending.
- [2026-06-12] save/load docked 2/2 -> ~1.7/2: probe-verified world-spawn drift
  on loaded boots (index.html:941/949, if(!SV) skips the spiral, SPAWN captures
  the loaded position); also falsifies the r10 bedgone-parity credit (hunter).
- [2026-06-12] hunter net-new: picked bushes (39) never regrow after reload (no
  ev===39 re-arm mirroring line 1543's crop re-arm), berry loop is
  intra-session only until fixed.
- [2026-06-12] redstone ~2.0/4 -> ~3/4: slice 2 (powered doors both directions
  + true momentary button on simNow) verified in r11; remaining = inverter/
  logic + non-instant propagation.
- [2026-06-12] seat-staleness guard: the r11 delta seat's "farming proper" gap
  is INVALID, farmland/wheat/bread shipped round 4 (header lines 26-27,
  blocks 18-21, items 107-109); farming stays banked, berry bush was breadth
  credit, not a family opener. Do not plan a farming lane from that gap.

## Standing debts

- VERIFICATION DEBT (human-only): real pointer-lock input cluster, ~12-14
  checklist points, dark all marathon. Kevin's 2026-06-10 session filed three
  real bugs (HANDS_ON_FINDINGS.md). Human checkpoint cadence: every ~4 rounds
  or after any input-path lane.
- PERF DEBT: chunk Map never evicts (carried since ~round 3). Schedule by
  round 13 at latest.
- BREADTH DEBT (owner steering): many craftables, many biomes, block/food/
  tree/structure variety. Counts as first-class lane material, not polish.

## Arcs

- Arc A (rounds 10-11): mandated hands-on trio (camera, swim-jump, HUD
  symmetry) + verify beds/sheep/bow + breadth wave 1 (craftables/foods).
  [2026-06-11 amendment: r10 shipped the trio (camera fix UNCERTIFIED until
  the human checkpoint), breadth wave 1, and redstone slice 2 (powered doors
  + button). Beds/sheep/bow verified in the r10 probe. Arc A closes when
  Kevin certifies the camera.]
- Arc B (rounds 12-13): finish villages to 3/3; second redstone slice
  (repeater or piston-lite); chunk eviction perf debt; creeper or third
  hostile.
  [2026-06-12 amendment: slice 2 landed early in r11 (doors + button,
  verified); successor item is redstone slice 3, redstone-torch inverter,
  the family's first logic. Probe-mandated correctness fix pack (world-spawn
  anchor, bush re-arm, placement support hygiene) added to Arc B as lane
  material; chunk eviction deferred behind it, if exit fires first, the
  eviction debt converts to a documented substitution in the final panel
  (heap healthy at 33MB, down from 47).]
- Arc C (round 14+): biome expansion wave (jungle/swamp candidates), boats or
  minecarts, band-50 audit with full panel.

## Exit discipline

Planner logs projected_next_gain each round; TRAJECTORY records projection vs
realized for calibration. Exit when projection < 1.0 twice consecutively, or
trailing rule (3 rounds under +1.0), whichever first; then final rating-only
panel writes the score of record.

SOFT COST CEILING (locked 2026-06-11): when the 3-round rolling cost exceeds
2M tokens per MPS point, the planner must recommend exit regardless of
projection and Kevin gets a clean decision prompt. Current rolling figure
(rounds 8-10): ~4.9M tokens / +2.8 MPS = ~1.74M per point. Under ceiling,
trending up. The curve's cost basis is
part of the benchmark; the endpoint is a design choice, not a quota artifact.

## Protocol v3 adoption (locked 2026-06-12, owner rapid-fire)

Research-adjudicated (runs/loop-efficiency-research.json). Adopted #1-6:
deterministic __vox regression suite gating every builder (test ratchet:
never delete or edit tests), three-stage rating cascade (free suite ->
scoped delta judge -> panel only on anchor rounds or disagreement), probe
record-and-replay via PROBE_MAP.json, planner-set lane counts (1-4) keyed to
projected_next_gain with periodic campaign regeneration, persisted per-family
rubrics in rubrics/, log-to-file-then-tail output discipline + per-lane
acceptance gates. PARKED: module sharding (#7, until builder read-cost
hurts). GATED: best-of-2 on opener lanes (#8, activates only after a failed
opener). Human checkpoint 2 certified camera/swim/HUD (the -0.4 lifts);
new human bug: held-block viewmodel transparency vs water.

PATH (owner-locked): retrofit round (viewmodel fix + suite backfill + probe
map) -> runner rewritten to v3 -> ONE normal v3 round (round 12, full-panel
anchor) -> exit re-judged with real v3 cost math.

## Round-11 record (2026-06-12)

Merged 45.4 (+0.4): delta seat 45.5 / hunter 45.4; median ties down, and the
hunter carries an unpriced verified bug (bush regrow asymmetry). Counter 2/3.
Round-12 lanes picked: (A) correctness fix pack, world-spawn anchor + bush
re-arm + placement support hygiene; (B) hamlet villager + take-only loot
chest (villages to 3/3, fold in the live-table + cactus probe items); (C)
redstone slice 3, redstone-torch inverter. projected_next_gain 0.9 (breadth
bonus applied to ranking only, not to the projection). Rolling cost projects
to ~2.0-2.5M/point over rounds 10-12, crossing the ceiling, so the planner
recommends EXIT after this build; run Kevin's zero-token human checkpoint
(mouse-look certification incl. fast-flick + foreground-FPS + door-slam feel
test, ~+0.9 potential, lifts or confirms the parked -0.4) BEFORE the final
rating-only panel writes the score of record.
