# Track 2: Fable 5 Ultra

Goal: the highest MPS reachable by Fable 5 (1M context) iterating under
ultracode orchestration. Claude agents only, no Codex. Target 93+, which on the
Minecraft Parity Scale means near-parity with the real game: the loop is
expected to plateau long before that, and the plateau itself is the measurement.

## What carries over from Track 1

The soul constraints stay: one self-contained `game/index.html` that runs by
double-click in Chrome, SEED constant drives generation, no external assets
(CDN script libraries allowed), 60fps target, in-game help overlay. The
one-response truncation rule is replaced by: every committed round must pass
the boot gate. Ambition extends past the checklist into the 50+ bands:
inventory, crafting, health, mobs, smelting, farming, lighting, weather.

## Seed (round 0)

A single workflow agent receives the frozen Prompt v1 verbatim and produces a
faithful one-shot response with no tools: an unofficial Track 1 datapoint that
becomes the polish seed. The official Track 1 run remains Kevin's claude.ai
paste, scored separately whenever it lands.

## The rate-polish loop (one round)

1. EVIDENCE: main loop boots the build on the preview server, captures console
   logs and screenshots at fixed vantage points into `runs/ultra/round-N/`.
2. RATE: a judge panel (world, player and physics, survival systems, rendering
   and atmosphere, performance and stability) scores MPS per RUBRIC.md from
   evidence plus hands-on probing, each judge returning ranked gaps.
3. PLAN: a planner merges gaps into 2-4 disjoint feature lanes ranked by
   MPS-impact per risk.
4. BUILD: builder agents implement lanes serially against the canonical file
   (never in parallel: one giant HTML file makes parallel edits a merge
   hazard), each leaving the file statically sane (ends in `</html>`, balanced
   scripts).
5. VERIFY: main loop reruns the boot gate. Regression reverts the round to the
   last good commit.
6. CHECKPOINT: git commit, TRAJECTORY.md row (round, MPS, delta, lanes, notes).

## Exit and survival rules

- Exit only on MPS >= 93 or hard plateau: 3 consecutive committed rounds each
  gaining under 1.0 MPS.
- Session-limit windows never end the run: checkpoint, sleep past the reset,
  resume the loop. The marathon is designed to run as long as it improves.
- Score of record: final committed round, judged by a fresh panel.

## Loop v2 (staged 2026-06-10 during the token pause; active from round 11)

Round 10's resume runs on the v1 runner untouched, to preserve its journal
cache. From round 11 the runner changes:

1. CAMPAIGN LAYER: the planner reads and updates CAMPAIGN.md (band roadmap,
   family ledger, standing debts, arcs) instead of re-deriving strategy
   greedily each round. Owner steering lands in CAMPAIGN, planner obeys it.
2. INCREMENTAL RATING: normal rounds run the probe plus two judges (a delta
   judge pricing what changed against the previous panel, and an adversarial
   regression hunter). The full five-seat panel runs every third round and
   for scores of record. Rationale: seats converged within half a point by
   round 8 while costing ~60-70% of each round; the savings buy build lanes.
3. PROJECTION EXIT: the planner states projected_next_gain for its best
   available lane set; exit triggers when the projection stays under +1.0 for
   two consecutive rounds (trailing-delta rule retained as backstop). The
   projection-vs-realized column in TRAJECTORY.md calibrates the forecaster.
4. HUMAN CHECKPOINT: a hands-on session is a scheduled protocol step every
   ~4 rounds and after any input-path change. Human findings outrank agent
   findings and mandate lane 1 (proven 2026-06-10: a critical real-input
   regression was invisible to nine rounds of agent probing).

Locked 2026-06-11 (rapid-fire session): probe-overrides-campaign rule (fresh
probe evidence forces a dated campaign amendment before lane picks); full
panel cadence confirmed at every 3rd round; soft cost ceiling at 2M tokens
per MPS point on a 3-round rolling basis (planner must recommend exit, owner
decides); breadth gets planner-side selection weight this run (+0.5 projected
MPS bonus) with the rubric breadth axis deferred to Rubric v2 at the next
model era, keeping this trajectory comparable end to end.

## Comparability

Future models rerun this exact loop (same rubric, same round structure, same
exit rules) as `runs/<model>-ultra-<date>/`. The Fable 5 trajectory is the
reference curve.
