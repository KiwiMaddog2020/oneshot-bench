---
title: "Ten rounds of an agent improving one game"
date: 2026-06-12
---

# Ten rounds of an agent improving one game

<p class="dek">A long-running test of how far an AI climbs when you let it iterate on one hard build: the curve it traced, where it flattened, and the bug that survived nine rounds of automated checking until a human picked up the controls.</p>

<p class="meta">Kevin Madson · June 2026 · 5 min read</p>

> **If someone forwarded this to you:** I build software with AI agents, programs
> that write and change code on their own. This is about a benchmark I ran to answer
> one narrow question: when you let an AI keep reworking the same hard project, round
> after round, what actually improves, what costs the most, and where does it stop?

<p class="contact-card">
<a href="https://github.com/KiwiMaddog2020/oneshot-bench">github.com/KiwiMaddog2020/oneshot-bench</a>
<a href="mailto:kevinmadson@protonmail.com">kevinmadson@protonmail.com</a> <!-- pragma: allowlist -->
</p>

---

## The setup, and the honest size of it

The task: build a small, playable Minecraft clone that runs in a browser. I score it
on a deliberately cruel scale where 100 is the real game, in full, and a strong first
attempt lands near 30. The cruelty is the point. A scale that never tops out stays
useful as models improve.

Two run modes. One-shot is a single request, a single answer, no tools, no second
pass, the equivalent of writing the whole thing from memory in one sitting. The
marathon uses the same scale but lets the model keep revising its own work, round
after round, for as long as the score keeps climbing.

This note covers one marathon, run on a frontier model called Fable 5. I want to be
exact about the sample, because the lessons only mean something if you know their
weight. One task, one model, eleven rounds. Each round was scored by other models (an
AI play-tester plus a panel of judges), with a human stepping in every few rounds to
overrule them. So: n=1. Nothing below is a leaderboard. It is a single curve, traced
with care.

One-shot landed at **30**. Eleven rounds of revision reached **45.4**. That gap,
roughly fifteen points of the distance to the real game bought by iteration alone, is
the number I find most interesting in the whole exercise, and the one I would watch as
models improve.

## Lesson 1: the climb is real, and it decays

The raw round-by-round score:

```
30 → 33 → 35 → 37.5 → 40 → 41.9 → 42.8 → 43.4 → 44.4 → 45.0 → 45.4
```

Per-round gain: +3, +2, +2.5, +2.5, +1.9, +0.9, +0.6, +1.0, +0.6, +0.4. The shape is
the whole story. Early rounds shipped entire systems, an inventory, crafting, hostile
mobs, weather, each worth two or three points. By the end, a full round of work bought
half a point. The loop was built to quit on exactly that signal: three consecutive
rounds under a one-point gain, or a forecast that the next round would land there. The
decay is not the run failing. The decay is the result.

## Lesson 2: most of the cost is verification, not building

The thing I did not predict: over a long run, the expensive part is not making
changes. It is verifying them. Re-running a full panel of five judges every round
mostly re-confirms what the last panel already found. By round eight the five judges
agreed within half a point of each other, which means four of them were paying to
restate the fifth.

So I made verification cheap on purpose. Normal rounds dropped to two judges, one
scoring only the diff, one acting as adversary trying to break the build, with the
full five-judge panel reserved for every third round. The literature on long agentic
loops puts numbers on why this matters: a well-tuned verification regime spends
something like 5 to 9 percent of total effort on checking, while naive judge panels
burn 50 to 70 percent. That is not a rounding error. That delta is the entire build
budget.

The cheapest check is the one with no model in it. That became a deterministic harness
that drives the game through a programmatic back door on a fixed seed, in about six
seconds, no inference involved:

```js
window.__suiteResult
// {pass: 71, fail: 0, total: 71, world_hash: "911b6032", ms: ~6000}
```

That `world_hash` is a fingerprint of the terrain around spawn, so if world generation
drifts by a single block the suite fails loudly. The attached rule: every feature that
earns points ships a check the same round it earns them, and checks are never deleted
to make a round pass. The cheap deterministic tests are the floor. They free the
expensive judges to weigh in only on what is genuinely new.

## Lesson 3: an agent cannot see what it cannot run

Keep one finding, keep this one. For nine rounds straight, the game shipped a broken
camera. In real play the view was pinned at the ground and you could not look up. Every
automated check passed, round after round, for a precise reason: the harness drove the
camera through a test back door that worked perfectly, while the pointer-lock path a
human hand actually uses was broken. The checkers tested the spare key, confirmed it
turned, and never touched the jammed lock.

No quantity of automated checking closes that gap. It took one human sitting down to
play for sixty seconds to catch it, and the catch cost the build half a point under a
standing rule that human findings outrank machine findings. I now treat that rule as
structural, not a courtesy. Testing through a back door is not testing the real thing,
and the space between them is a permanent blind spot, worth something like a dozen
points on this scale, that no amount of AI verification ever reaches. The fix was not
more checking. It was a human at the real controls, early and on a schedule, because
that path is invisible to the machines on every single round until a person uses it.

## Lesson 4: knowing when to stop is part of the method

The run is paused, not finished, and I will say plainly why. After round eleven the
forecast for round twelve, weighed against a budget ceiling I had set in advance, said
stop. I had also begun rebuilding the test harness and had not yet scored a round on
the new version. So 45.4 is a waypoint, the eleventh-round score, not an official
final. The benchmark reserves the final number for a last judging pass that has not
run. Calling 45.4 "the result" would be precisely the rounding-up the rest of the
method exists to prevent. So I won't.

What I will claim is the method, because the method is what carries to the next model:

- Track two numbers, the one-shot floor and the iterated ceiling, and watch the gap
  close as models improve.
- Make verification cheap. Push everything you can onto a fixed, deterministic test so
  the expensive judges only price what is new.
- Put a human in front of the part the machines structurally cannot reach, early and
  often, and let that human overrule them on disagreement.
- Let the loop quit. A run that can only continue will eventually report that it is
  still improving after it has stopped.

## What is in the repo

The [repository](https://github.com/KiwiMaddog2020/oneshot-bench) holds the frozen
prompt and scoring rubric, the full round-by-round ledger, the script that ran one
round (included for reference, not as a runnable program, since it drives a private
multi-agent setup of mine), and every round's saved build and judge notes, the broken
ones included. The failures are kept exactly as they fell, because on a benchmark the
failures are the data. The one piece you can run yourself is the deterministic suite:
serve the game, open it with the test flag, and watch 71 checks and a world fingerprint
settle in six seconds. That is the reproducible half. The rest is a careful record of
one long climb, plateau and blind spot left in.

---

<p class="byline"><em>I build agentic systems across multiple coding LLMs. More of my research notes are <a href="/">here</a>.</em></p>