# oneshot-bench

A long-horizon coding benchmark. The question behind it: can a model one-shot a
Minecraft clone, and how far can it climb when you let it iterate? Scores run on
a single brutal scale (RUBRIC.md) where 100 is the actual game and a strong
one-shot lands near 30, so the benchmark never saturates.

The write-up lives at **https://kiwimaddog2020.github.io/oneshot-bench/**.

## Two tracks

- **Track 1, classic one-shot.** One frozen prompt (PROMPT.md), one response, no
  tools, no fixes. Sudden death: attempt-1 is the score of record. Measures raw
  single-response capability, cross-model and cross-year.
- **Track 2, ultra.** The same scale, but the model iterates under
  orchestration round after round until it stops improving. Loop rules are in
  FABLE5_ULTRA.md; the round-by-round curve is in TRAJECTORY.md.

This repo is one Track 2 run, on Fable 5 (1M context): a seed one-shot at MPS 30
climbing to 45.4 over eleven rounds, then paused mid-way through a v3 harness
rebuild. The marathon is `n = 1` (one task, one model), self-rated by sibling
agents with periodic human checkpoints that outrank them. The note explains what
that buys and what it does not.

## What you can run, and what you cannot

- **The deterministic suite is reproducible.** `game/tests/` holds 71 ordered
  assertions that drive the build through a test hook on a fixed seed, in about
  six seconds, with no model in the loop. Serve `game/` and open
  `?test=1&suite=1`; see `game/tests/README.md`.

  ```bash
  cd game && python3 -m http.server 8911
  # then open http://localhost:8911/?test=1&suite=1 and read window.__suiteResult
  # -> {pass: 71, fail: 0, total: 71, world_hash: "911b6032", ms: ~6000}
  ```

- **The orchestration is not.** `bin/ultra-round.js` is the actual workflow
  script for one round, published as a reference so the loop shape is legible. It
  runs against a private multi-agent harness and a browser-preview MCP, so it is
  not a clone-and-run program. It is here as methodology, not as a tool.

## Layout

- `PROMPT.md`, `RUBRIC.md`, `SCORECARD.md`, `PROTOCOL.md`: the frozen benchmark
  spec. Editing any of them starts a new results era.
- `FABLE5_ULTRA.md`: the Track 2 loop (rate, plan, build, verify, checkpoint).
- `TRAJECTORY.md`: the eleven-round curve, one row per round.
- `PROMPT_LEARNINGS.md`, `CAMPAIGN.md`, `HANDS_ON_FINDINGS.md`: what the marathon
  taught, the persistent plan, and the human play sessions that outranked the
  agents.
- `game/`: the living single-file build. `game/tests/`: the deterministic suite.
- `runs/`: archived artifacts, one folder per run, kept verbatim including the
  broken rounds. On a benchmark, the failures are the data.

## License

MIT (see LICENSE).
