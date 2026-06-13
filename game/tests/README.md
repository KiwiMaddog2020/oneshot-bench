# Voxelcraft stage-0 regression suite (Protocol v3)

Deterministic, near-zero-token regression suite for the single-file game at
`game/index.html`. 71 ordered assertions drive the sim synchronously through
the `window.__vox` TEST API on seed 1337, no judge, no probe session, no
tokens. A full run takes ~6 seconds.

## How to run

1. Serve the `game/` directory (any static server; the marathon preview runs
   on port 8911).
2. Navigate to: `http://localhost:8911/?test=1&suite=1`
3. Poll `window.__suiteResult` until it is non-null:

```js
window.__suiteResult
// {pass: 71, fail: 0, total: 71, failures: [{id, reason}...],
//  world_hash: "911b6032", ms: ~6000}
```

Console output is greppable: one `ERROR <id> <reason>` line per failure and a
final `SUITE PASS|FAIL x/y` line. The suite auto-runs on load;
`window.__suite.run()` re-runs it (only on a FRESH page, assertions assume a
pristine boot; the suite mutates the world as it goes).

Mechanics:

- The loader hook in `index.html` (TEST mode + `suite=1` only) injects
  `tests/suite.js` with a silent-no-op `onerror`, so the single-file artifact
  stays self-contained when `tests/` is absent.
- Hidden tabs starve `requestAnimationFrame`, so the first assertion
  (`boot-complete`) drives `updChunks()` synchronously until world gen
  finishes, the suite works headless and foreground alike.
- The save/load tests boot a real second game instance in a hidden iframe
  (`?test=1&load=1`), assert the round trip (edits, gt, redstone ids, lit-lamp
  light-registry re-arm, emptied-chest persistence, world-spawn anchor), then
  `clearSave()` so the origin is left pristine.
- `world_hash` is an FNV-1a fingerprint over a 7,938-sample pristine block
  lattice around spawn, any worldgen drift fails fast and loud.

## THE TEST RATCHET (locked 2026-06-12, owner rapid-fire)

**Tests are never deleted or weakened except by explicit owner approval.**

- Builders MUST run the suite green before submitting a lane. A red suite is
  a blocked lane, not a negotiable one.
- If an assertion fails because the feature legitimately changed (an owner-
  approved respec), the assertion is updated in the same commit as the change,
  with the approval cited in the commit message. "It was hard to keep green"
  is never grounds for deletion.
- Every newly credited feature adds at least one assertion **at crediting
  time**, the round that banks the MPS adds the test that protects it. The
  rating cascade should refuse credit for a deterministically checkable
  feature that ships without its assertion.
- `FEATURES.json` is the machine-checkable ledger: one entry per credited
  feature with `suite_covered` and `passes` flags. Aesthetic / real-input /
  render-quality items are `suite_covered: false`, they remain judge and
  human territory and follow the verification-debt cadence (human checkpoint
  every ~4 rounds or after any input-path lane).

## Stage-0 role in the v3 rating cascade

This suite is **stage 0** of the three-stage cascade (CAMPAIGN.md, Protocol
v3 adoption):

1. **Stage 0, this suite (free).** Gates every builder lane. Green is a
   precondition for any rating step; a red run short-circuits the round back
   to the builder with the greppable failure list. Zero tokens.
2. **Stage 1, scoped delta judge.** Only examines the lane's claimed deltas
   plus the suite result; never re-verifies what stage 0 already locks.
3. **Stage 2, full panel.** Anchor rounds or stage-1 disagreement only.

The suite therefore carries the regression burden the per-round probes used
to re-pay: spawn/worldgen fingerprints, the recipe matrix, redstone circuit
semantics, save/load round trips, spawn gating, and the exact arithmetic of
hunger/fall/drowning/poison. Probes now spend their budget on NEW surface
only (PROBE_MAP.json record-and-replay covers the rest).

## Known boundaries (honest, by design)

- `__vox.brk()` is a creative-style instant break that **bypasses the tool
  gate**, the suite uses the real `mineHold`+`step` path for all gating
  claims (r11 probe caveat b).
- Wall-clock behaviors (pause-freeze across real seconds, drop despawn
  windows, autosave interval) stay probe territory; the suite is synthetic-
  clock only.
- `audio-generators` passes vacuously if `OfflineAudioContext` is missing
  from the environment (it never is, in the marathon preview).
- The iframe round trip needs the three.js CDN (cached after first load). A
  45s timeout fails the test honestly rather than hanging.
- Foreground FPS, visual quality, and OS pointer-lock feel are explicitly
  NOT covered here, see `FEATURES.json` entries with
  `suite_covered: false`, especially `rd-fps` (11 rounds of rAF exoneration,
  flagged by the r11 hunter) and the dark input cluster.
