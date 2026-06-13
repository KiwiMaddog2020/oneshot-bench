# Hands-on findings

## Session 2 (Kevin, 2026-06-12): certifications + one new bug

CERTIFIED by human play (lifts the round-10 human override):
- Mouse-look: fast flicks look good in all directions. The parked -0.4 lifts;
  the mouse-look core item converts to a real-input PASS.
- Swim-jump: can jump out of water onto land. PASS.
- Vitals HUD: symmetric, "looking great". PASS.

NEW BUG (severity: high, real-play visual):
4. HELD-BLOCK VIEWMODEL TRANSPARENCY. Some held blocks render transparent
   depending on what is behind them; pronounced when water is in the
   foreground/background. Likely cause: the viewmodel renders with depthTest
   false / renderOrder 999 while water is a transparent depthWrite-false
   pass; the draw-order interaction lets water composite over or through the
   held mesh. Acceptance: held block fully opaque against sky, terrain, and
   water, from all camera angles, day and night.

# Hands-on findings (Kevin, 2026-06-10 evening)

First human play session of the ultra build. These carry MORE authority than
any probe finding: the real input path cannot be exercised headlessly, and the
panels have priced it as dark for nine straight rounds. Lane 1 of the next
round (round 11, on resume) is mandated to fix all three.

## Filed bugs

1. CAMERA STUCK LOOKING DOWN (severity: critical, real-play blocker).
   Movement works but mouse-look does not; the camera points at the ground and
   cannot be raised. The injected TEST look() path works (probe-verified
   repeatedly), so the regression is specific to the REAL pointer-lock mouse
   path (mousemove handler, lock state, or pitch init). Likely introduced or
   masked any time after the round-2 lock hardening; no probe could have
   caught it. Fix must be verified by a human or by an honest real-event
   simulation, not by look().

2. CANNOT JUMP FROM WATER ONTO LAND (severity: high).
   Swimming against a 1-block bank, jump falls just short of mounting it.
   Minecraft solves this with surface swim-jump boost. Acceptance: swimming
   at the surface against a 1-block bank, holding Space (or jump) mounts the
   bank reliably.

3. VITALS HUD NOT MIRROR-SYMMETRIC (severity: polish, explicit owner request).
   Hearts and hunger drumsticks are shifted right of where they belong. Wanted
   layout: symmetric about the screen center column (Minecraft-style: hearts
   ending at center-gap left, hunger starting at center-gap right, both
   anchored to the hotbar width).

## Steering directives (apply to every future planner round)

- BREADTH MATTERS: favor lanes that multiply content variety, not only new
  family mechanics: many craftables, many biomes, more block types, more
  foods, more tree/vegetation variants, more structure variety. A deep game
  that feels thin reads as a tech demo.
- The harness lesson: injected-input verification is not real-input
  verification. Any lane touching input, lock, or camera must state how it
  was actually verified.
