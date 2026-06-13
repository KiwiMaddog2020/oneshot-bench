---
title: "Ten rounds of an agent improving one game"
date: 2026-06-12
---

# Ten rounds of an agent improving one game

<p class="dek">A long-running test of how far an AI can climb when you let it iterate on one hard build, the curve it traced, and the bug that hid from nine rounds of automated checking until a human played the game.</p>

<p class="meta">Kevin Madson · June 2026 · 6 min read</p>

> **If someone forwarded this to you:** I build software with AI agents, programs
> that write and change code on their own. This note is about a benchmark I ran to
> answer a narrow question: when you let an AI keep reworking the same hard project
> round after round, what actually gets better, what costs the most, and where does
> it stop?

<p class="contact-card">
<a href="https://github.com/KiwiMaddog2020/oneshot-bench">github.com/KiwiMaddog2020/oneshot-bench</a>
<span class="sep">·</span>
<a href="mailto:kevinmadson@protonmail.com">kevinmadson@protonmail.com</a> <!-- pragma: allowlist -->
</p>

---

## The setup, and the honest size of it

The task is to build a small playable Minecraft clone that runs in a web browser.
I score it on a deliberately harsh scale where 100 is the actual game, in full,
and a strong first attempt lands around 30. The scale is brutal on purpose so the
test never maxes out and stays useful as models improve.

There are two ways to run it. The first is one-shot: a single request, a single
answer, no tools, no fixes, like asking someone to write the whole thing from
memory in one sitting. The second is the marathon: the same scale, but the AI is
allowed to keep revising its own work, round after round, for as long as it keeps
getting better.

This note is one marathon, run on a frontier model called Fable 5. I want to be
exact about how small the sample is, because the lessons only mean something if you
know their weight. It is one task, one model, eleven rounds. The rounds were
scored by other AI models (a play-tester plus a panel of judges), with a human
stepping in every few rounds to overrule them. It is a sample of one. None of the
numbers below are a leaderboard; they are a single curve, traced carefully.

The one-shot attempt landed at **30**. Eleven rounds of revision took it to
**45.4**. That gap, about fifteen points of the way to the real game bought purely
by letting the model iterate, is the most interesting number in the whole exercise,
and the one I would track as models get better.

## Lesson 1: the climb is real, and it slows down

Here is the actual round-by-round score:

```
30 → 33 → 35 → 37.5 → 40 → 41.9 → 42.8 → 43.4 → 44.4 → 45.0 → 45.4
```

The gain per round: +3, +2, +2.5, +2.5, +1.9, +0.9, +0.6, +1.0, +0.6, +0.4. The
shape is the whole story. Early rounds added entire systems, an inventory, crafting,
monsters, weather, and each was worth two or three points. Late rounds were paying a
full round of work for half a point. The marathon was built to quit on exactly that
signal: three rounds in a row gaining under a point, or a forecast that the next
round would. The slowdown is not the run failing. The slowdown is the answer.

## Lesson 2: most of the cost is checking, not building

The thing I did not expect: over a long run, the expensive part is not making
changes, it is checking them. Re-running a full panel of five AI judges every round
just re-confirms most of what last round's panel already found. By round eight the
five judges agreed within half a point of each other, which means four of them were
mostly paying to repeat the fifth.

So the checking got cheaper on purpose. Normal rounds dropped to two judges (one
pricing only what changed, one trying to break it), with the full five-judge panel
saved for every third round. The published research on long AI loops puts numbers on
why this matters: a well-tuned checking setup spends something like 5 to 9 percent
of its effort on checking, while naive AI panels spend 50 to 70 percent. That is not
a rounding error. The difference is the budget for actually building.

The cheapest check of all is one that needs no AI. That became a fixed test that
drives the game through a back door on a set starting seed, in about six seconds,
with no model involved:

```js
window.__suiteResult
// {pass: 71, fail: 0, total: 71, world_hash: "911b6032", ms: ~6000}
```

That `world_hash` is a fingerprint of the terrain around the spawn point, so if the
world generation ever drifts, the test fails loudly. The rule attached: every feature
that earns points adds a check the same round it earns them, and checks are never
deleted to make a round pass. The cheap, no-AI tests are the floor; they free the
expensive judges to look only at what is genuinely new.

## Lesson 3: an AI cannot see what it cannot run

This is the finding I would keep if I could keep only one. For nine rounds straight,
the game had a broken camera. In real play the view was stuck pointed at the ground
and you could not look up. Every automated check missed it, round after round, for a
precise reason: the checks moved the camera through a test back door that worked
perfectly, while the real controls a human hand uses were broken. The checkers were
testing the spare key, and confirming it turned, while the actual lock was jammed.

No amount of extra automated checking closes that gap. It took one human sitting down
to play for a minute to catch it, and the catch cost the build half a point under a
standing rule that a human's findings outrank the machines'. I now treat that rule as
structural, not a courtesy. Testing through a back door is not the same as testing the
real thing, and the gap between them is a permanent blind spot, worth roughly a dozen
points on this scale, that no amount of AI checking ever closes. The fix was not more
checking. It was to put a human in front of the real controls early and on a schedule,
because that path is invisible to the machines on every single round until a person
uses it.

## Lesson 4: knowing when to stop is part of the method

The run is paused, not finished, and I will say plainly why. After round eleven the
forecast for the next round, weighed against a budget ceiling I had set, said to stop.
I had also started rebuilding the test harness but had not yet run a round on the new
version. So 45.4 is a waypoint, the eleventh-round score, not an official final. The
benchmark reserves the final score for a last judging pass that has not happened.
Calling 45.4 "the result" would be exactly the kind of rounding-up the rest of the
method exists to prevent, so I am not going to.

What I will claim is the method, because that is what carries over to any model:

- Track two numbers, the one-shot floor and the iterated ceiling, and watch the gap
  between them as models improve.
- Make checking cheap. Push everything you can onto a fixed, no-AI test so the
  expensive judges only weigh in on what is new.
- Put a human in front of the part the machines structurally cannot see, early and
  often, and let that human overrule them when they disagree.
- Let the loop quit. A run that can only continue will eventually tell you it is still
  improving after it has stopped.

## What is in the repo

The [repository](https://github.com/KiwiMaddog2020/oneshot-bench) holds the frozen
prompt and scoring guide, the full round-by-round record, the script that ran one
round (included as a reference, not a runnable program, because it drives a private
multi-agent setup of mine), and every round's saved build and judge notes, including
the broken ones. The failures are kept exactly as they were, because on a benchmark
the failures are the data. The one part you can run yourself is the fixed test: serve
the game, open it with the test flag, and watch 71 checks and a world fingerprint
settle in six seconds. That is the reproducible half. The rest is a careful record of
a single long climb, plateau and blind spot included.

---

<p class="byline"><em>I build agentic systems across multiple coding LLMs. More of my research notes are <a href="/">here</a>.</em></p>
