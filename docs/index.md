---
title: "Ten rounds of an agent improving one game"
date: 2026-06-12
---

# Ten rounds of an agent improving one game

<p class="dek">A long-horizon coding benchmark, the plateau curve, and the bug that hid from nine rounds of agent probing until a human played the game.</p>

<p class="meta">Kevin Madson · June 2026 · 6 min read</p>

> **If someone forwarded this to you:** I build and operate agentic systems
> across multiple coding LLMs. This note is about a benchmark I ran to answer a
> narrow question: when you let a model iterate on one hard build for round
> after round, what actually improves, what costs the most, and where does it
> stop?

<p class="contact-card">
<a href="https://github.com/KiwiMaddog2020/oneshot-bench">github.com/KiwiMaddog2020/oneshot-bench</a>
<span class="sep">·</span>
<a href="mailto:kevinmadson@protonmail.com">kevinmadson@protonmail.com</a> <!-- pragma: allowlist -->
</p>

---

## The setup, and the honest size of it

The task is a single-file browser Minecraft clone, scored on a deliberately
brutal scale where 100 is the actual game and 30 is a strong one-shot. The
benchmark has two tracks. Track 1 is sudden death: one prompt, one response, no
tools, no fixes. Track 2 is the marathon: the same scale, but an agent is
allowed to iterate under orchestration for as long as it keeps improving.

This is one run of Track 2, on Fable 5 (1M context). I want to be exact about
how small the sample is, because the lessons only mean something if you know
their weight. It is **one task, one model, eleven rounds**. The rounds were
scored by sibling agents (a play-probe plus a judge panel), with a human
checkpoint every few rounds that outranked them. It is `n = 1`. None of the
numbers below are a leaderboard; they are one curve, traced carefully.

The seed one-shot landed at **30**. Eleven rounds of iteration took it to
**45.4**. That gap, about fifteen points of parity bought by iteration on top of
what a single response could do, is itself the most interesting measurement in
the whole exercise, and it is the one I would track across model generations.

## Lesson 1: the climb is real, and it decays

Here is the actual trajectory, one row per round:

```
30 → 33 → 35 → 37.5 → 40 → 41.9 → 42.8 → 43.4 → 44.4 → 45.0 → 45.4
```

The per-round gains: +3, +2, +2.5, +2.5, +1.9, +0.9, +0.6, +1.0, +0.6, +0.4.
The shape is the whole story. Early rounds opened entire systems, an inventory,
crafting, mobs, smelting, weather, and each was worth two or three points. Late
rounds were paying a point of polish for half a point of score. The marathon
was designed to exit on exactly this signal: three consecutive rounds gaining
under a point, or a planner's forecast of the next gain falling below one. The
plateau is not the run failing. The plateau is the result.

## Lesson 2: most of the cost is checking, not building

The thing I did not expect going in: across a long run, the expensive part is
not making changes, it is verifying them. Re-running a full five-judge panel
every round re-derives most of what the previous panel already knew. By round 8
the five judges agreed within half a point of each other, which means four of
them were mostly re-confirming the fifth at full token price.

So the rating got cheaper on purpose. Normal rounds dropped to two agents, a
delta judge that prices only what changed and an adversarial regression hunter
whose entire job is to refute, with the full panel reserved for every third
round and for the final score. The released literature on long agent loops puts
hard numbers on why this matters: a tuned verification harness spends something
like 5 to 9 percent of build cost on checking, while unoptimized agent panels
spend 50 to 70 percent. The savings are not a rounding error. They are the
budget for more building.

The cheapest possible check is one that costs no tokens at all. That became a
deterministic regression suite: 71 assertions that drive the game through a test
hook on a fixed seed, in about six seconds, with no model in the loop.

```js
window.__suiteResult
// {pass: 71, fail: 0, total: 71, world_hash: "911b6032", ms: ~6000}
```

The `world_hash` is a fingerprint over the terrain around spawn, so any drift in
world generation fails loud and fast. The rule attached to it is the part that
keeps it honest: every feature that earns points adds an assertion in the same
round it earns them, and assertions are never deleted to make a round pass.
Cheap, deterministic checks are the floor; they free the expensive judges to
look only at what is genuinely new.

## Lesson 3: an agent cannot see what it cannot run

This is the finding I would put first if I could only keep one. For nine rounds,
the build had a broken camera. Mouse-look did not work in real play: the view
was stuck pointed at the ground. Every probe missed it, round after round, and
they missed it for a precise reason. The probes verified the camera through an
injected test-input path, and that path worked perfectly. The real
pointer-lock path, the one a human hand drives, was broken. The agents were
testing the thing they could reach, and it was not the thing that was broken.

It took one human sitting down to play the game to find it in a minute, and the
finding cost the build half a point under a standing rule that human findings
outrank agent findings. I now treat that rule as structural, not courtesy.
Injected-input verification is not real-input verification, and the gap between
them is a permanent blind spot, worth roughly a dozen points on this scale, that
no amount of agent probing closes. The fix was not more probing. The fix was to
schedule the human early and often, not as a final acceptance step but as a
recurring checkpoint, because the real input path is invisible to the agents on
every single round until a person exercises it.

## Lesson 4: knowing when to stop is part of the method

The run is paused, not finished, and I will say plainly why. After round 11 the
planner's own forecast for the next round, weighed against a soft ceiling of two
million tokens per point of parity, said to exit. I had also started a v3 of the
harness (the deterministic suite above, a held-item rendering fix a human had
flagged) but had not yet run the first round under it. So 45.4 is a waypoint,
the eleventh-round score, not an official close. The benchmark reserves the
score of record for a final rating-only panel that has not run. Calling 45.4
"the result" would be exactly the kind of inflation the rest of the method
exists to prevent, so I am not going to.

What I will claim is the methodology, because that is what generalizes past any
one model:

- Track two numbers, the one-shot floor and the iterated ceiling, and watch the
  gap between them across model generations.
- Make checking cheap. Push everything you can onto a deterministic suite so the
  expensive judges only price what is new.
- Schedule a human against the part agents structurally cannot see, early and on
  a cadence, and let that human outrank the agents when they disagree.
- Let the loop exit. A run that can only continue is a run that will eventually
  tell you it is still improving when it has stopped.

## What is in the repo

The [repository](https://github.com/KiwiMaddog2020/oneshot-bench) holds the
frozen prompt and rubric, the full round-by-round trajectory, the orchestration
script for one round (published as a reference, not a runnable program, because
it drives a private multi-agent harness), and every round's archived build and
judge panel, including the broken ones. Failures are kept verbatim, because on a
benchmark the failures are the data. The one part you can run yourself is the
deterministic suite: serve the game, open it with the test flag, and watch 71
assertions and a world fingerprint settle in six seconds. That is the
reproducible half. The rest is a careful record of a single long climb, plateau
and blind spot included.

---

<p class="byline"><em>I build agentic systems across multiple coding LLMs. More of my research notes are <a href="/">here</a>.</em></p>
