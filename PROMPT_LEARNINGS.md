# Prompt learning loop: feeding the marathon back into the one-shot prompt

Living document. PROMPT.md v1 stays frozen; everything here is candidate
material for PROMPT v2 (a new results era, cut only when deliberately chosen).
Each learning cites where the marathon taught it.

## What v1 got right (keep in v2)

- The contract + tier structure worked: the seed one-shot honored the output
  contract perfectly (complete file, SEED constant, pinned its own CDN dep,
  controls overlay, `</html>` sentinel). The anti-truncation framing works.
- The open dimension + Minecraft Parity Scale killed saturation: the seed
  landed at 30 exactly in the predicted band, and the same scale priced ten
  rounds of agentic polish without compression at the top.
- Play-verifiable wording: nearly every checklist item proved testable in
  practice (85 items, ~all eventually converted or honestly failed).

## Candidate v2 additions, from verified one-shot/iteration failure modes

1. Truth-in-advertising clause: "the feature-manifest comment must list only
   behaviors actually implemented; a claimed-but-absent feature voids the
   open-dimension bonus." (Rounds 7-8: header claimed cave mouths, overhangs,
   and risk food that censuses proved impossible under the shipped generator.)
2. HUD symmetry item: vitals mirrored about the screen-center column,
   Minecraft-style. (Kevin hands-on, 2026-06-10: hearts/hunger shifted right.)
3. Water-exit item: "swimming at the surface against a 1-block bank, jump
   mounts the bank." (Kevin hands-on: stuck in water, jump just short.)
4. Pointer-lock robustness item: "after Esc and re-lock, mouse-look still
   works and pitch is never stuck; verify look-up after re-lock."
   (Kevin hands-on: camera frozen looking down in real play while injected
   input paths all passed: the classic verification shadow.)
5. Content breadth escalators: "6+ biomes", "12+ distinct placeable block
   types", "3+ tree species", to push one-shots toward breadth, not just the
   mechanics loop. (Kevin steering: many craftables, many biomes.)
6. Input semantics detail items that one-shots and early iterations get wrong:
   scroll-wheel must not zoom the page; right-click must not open the context
   menu (v1 has these, keep); recipe matching semantics and stack splitting
   (round 3: exact-count matching made tool recipes unreachable; only relevant
   if v2 ever adds a crafting tier).

## Planning-layer learnings (apply to every future ultra run, any model)

- Greedy per-round planning leaves multi-round work permanently stalled
  (villages sat at 2.3/3 for four rounds; perf debt carried nine). Future
  runs start with a CAMPAIGN.md from round 1: band roadmap, family ledger,
  debts, arcs; the per-round planner picks from it.
- Rating is the cost center, building is the value center: full panels every
  round re-derive what is already known (seats converged within 0.5 by round
  8). Incremental delta-rating with periodic full panels shifts spend to
  lanes.
- Exit on the planner's calibrated projection of remaining gain, not on
  trailing score deltas alone; deltas carry ~0.3 of panel noise, which is the
  whole margin near a +1.0 threshold.
- Schedule the human checkpoint from round 1 (every ~4 rounds): the real
  input path is invisible to agents and regressed undetected for nine rounds.
- Delta size correlates with family weight opened, not effort spent: lane
  selection should price weights, conversions, and fixes as different asset
  classes.

## Benchmark-protocol learnings (PROTOCOL/ULTRA, not prompt text)

- An observability hook (?test=1 + state API) mandated in round 1 is the
  single highest-leverage lane of the whole marathon; keep it first in every
  future ultra run.
- Injected-input testing leaves a permanent dark cluster (~12-14 checklist
  points). The official protocol already requires a human scorecard session;
  schedule the hands-on EARLY in an ultra run, not only at the end, because
  real-input regressions hide from agents (proven 2026-06-10).
- Judge panels need anti-inflation framing near exit thresholds; the honest
  +1.0 at round 9 and honest +0.6 at round 8 both came after explicit
  "score honestly, exit is legitimate" instructions.
- Adversarial verification works: the held-item viewmodel was wrongly credited
  once, killed by scene-graph audit, rebuilt for real, then passed the same
  audit. Keep "phantom-killing rigor" language for disputed wow items.
- Deterministic sim hooks (step/tickSpawns) beat frame-pumping for anything
  needing more than a second of game time.

## Protocol v3 learnings (research-adjudicated 2026-06-12)

- Verification economics decide loop efficiency: tuned harnesses spend 5-9%
  of build cost on checking; unoptimized agent panels spend 50-70%. Build
  deterministic backpressure (replay suites on the observability hooks) from
  round 1 and graduate every credited feature into it (test ratchet).
- One item per loop is the most replicated finding across practitioner and
  research sources; resist bigger lanes. Parallel fan-out buys wall-clock
  with tokens (~15x); wrong trade when tokens bind.
- Persist exploration: probe sessions emit replay scripts + a probe map so
  coverage compounds instead of being repurchased every round.
- Effort-scale by projected gain, not fixed round shapes; periodically
  regenerate the campaign file from the ledger to kill stale-plan drift.
- Full research corpus with sources: runs/loop-efficiency-research.json.

## Queued for the next era (locked 2026-06-11)

- Rubric v2 adds breadth as a first-class family (craftable count, biome
  count, food/block/tree/structure variety) instead of pricing it only
  through the open-dimension modifier. Deferred so the Fable 5 trajectory
  stays on one rubric end to end.
- Protocol v2 carries the soft cost ceiling (2M tokens per MPS point,
  3-round rolling) so every model's curve ends on the same cost basis.

## Trajectory snapshot (for the v2 decision later)

One-shot (Track 1, unofficial local seed): MPS 30.
Ultra trajectory: 30, 33, 35, 37.5, 40, 41.9, 42.8, 43.4, 44.4, (r9 panel
pending), across rounds 0-9. The one-shot-to-agentic gap after nine rounds:
about +14.4 MPS and climbing slowly. That gap size is itself a model
capability metric worth tracking across model generations.
