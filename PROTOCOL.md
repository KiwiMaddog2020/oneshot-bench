# Benchmark Protocol v1

Frozen 2026-06-10. Two tracks, one scale (RUBRIC.md).

## Track 1: Classic one-shot

Measures raw single-response capability. Cross-model, cross-year.

1. Open a brand-new claude.ai chat (or any vendor's plain chat for non-Claude
   models). No custom instructions, no project context, no tools. Sessions inside
   Kevin's orchestrator environment are contaminated by global CLAUDE.md and do
   not count as official.
2. Paste the text below the rule in PROMPT.md, verbatim. One prompt, one
   response. No follow-ups, no fixes, no regenerate.
3. Save the response verbatim to `runs/<model>-<date>/attempt-1.html` (officials
   are attempt-1; informal extra attempts get attempt-2..n and are flagged
   informal in the results row).
4. Boot gate, then play ten minutes, sound on, at a maximized Chrome window.
5. Copy SCORECARD.md into the run folder, tick items, compute P and MPS per
   RUBRIC.md. Screenshot at least: spawn vista, a second biome, block break in
   progress, the HUD.
6. Add the row to RESULTS.md.

Official Track 1 runs are sudden death: attempt-1 is the score of record.

## Track 2: Ultra (agentic ceiling)

Measures the model's ceiling when allowed to iterate under orchestration.
Procedure and loop rules live in FABLE5_ULTRA.md; the protocol generalizes to
future models by swapping the model and rerunning the same loop. Score of
record is the final committed round's MPS, logged in RESULTS.md with a link to
the full TRAJECTORY.md.

## Versioning

- PROMPT.md, RUBRIC.md, SCORECARD.md are frozen. Any edit bumps the version and
  starts a new era; eras never silently mix in RESULTS.md.
- Artifacts are committed verbatim, including broken ones. Failures are data.
