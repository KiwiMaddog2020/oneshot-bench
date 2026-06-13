// ---------------------------------------------------------------------------
// METHODOLOGY REFERENCE, not a standalone program.
//
// This is the actual workflow script that ran one rate-polish round of the
// Track 2 marathon. It is published verbatim (paths relativized, the live
// preview server id redacted) so the loop structure is legible: a probe agent,
// a rating stage (incremental delta judge + adversarial regression hunter, or a
// five-seat panel every third round), a planner, and three serial builders.
//
// It will NOT run as-is. The agent(), parallel(), phase(), and log() primitives
// come from a private multi-agent orchestration harness, and the probe/build
// agents drive a browser preview over MCP. Read it as the shape of the loop the
// note describes, not as a clone-and-run artifact. The deterministic suite under
// game/tests/ IS clone-and-run; that is the reproducible half of the benchmark.
// ---------------------------------------------------------------------------

export const meta = {
  name: 'ultra-round',
  description: 'One Loop-v2 rate-polish round: live probe, incremental or full-panel rating, campaign-driven planning, 3 serial build lanes',
  phases: [
    { title: 'Probe', detail: 'one agent play-verifies the live build through the ?test=1 hook' },
    { title: 'Rate', detail: 'incremental (delta judge + regression hunter) or full 5-seat panel every 3rd round' },
    { title: 'Plan', detail: 'campaign-driven lanes; probe overrides campaign; projection logged' },
    { title: 'Build', detail: 'serial builders edit the canonical file, one lane at a time' },
  ],
}

const ROUND = 11
const FULL_PANEL = ROUND % 3 === 0
const PREV_SCORE = 45.0
const PREV_PANEL = 'runs/fable-5-ultra-2026-06-10/round-10-panel.json'
const GAME = 'game/index.html'
const CAMPAIGN = 'CAMPAIGN.md'
const SERVER_ID = '<your-preview-server-id>'
const URL = 'http://localhost:8911/?test=1'

const EVIDENCE = [
  'MAIN-LOOP EVIDENCE (verified live after round 10):',
  '- Boot gate PASS on ?test=1: zero console errors.',
  '- Cumulative verified ledger: ' + PREV_PANEL + ' (probe section). Round 10 highlights: redstone family fully cashed in play (lever/wire with 15-power -1/step decay, branching with downstream-only depower, lamp joining the torch light registry with exact 0.25x occlusion and hostile-spawn gating, persistence through save/reload, door with atomic halves); sheep chain is a 90-second loop (natural spawn, wool, bed craft, sleep, respawn at bed); corpse-run + beds compose correctly; the kiting skeleton produces emergent lead-the-target bow play.',
  '- Round 10 landed three lanes: (1) HUMAN-MANDATED TRIO at commit c8cb1fa: real pointermove mouse-look fix, surface swim-jump boost, mirrored vitals HUD. The camera fix is UNCERTIFIED: only human hands can verify the real pointer-lock path. Probe verifies synthetic regressions and code-path changes but must NOT mark the mouse-look core item as real-input-verified. (2) BREADTH PACK: birch tree variant in forest (bit-identical tree positions), a harvestable plant, 3 new foods, 2 new craftable blocks. (3) REDSTONE SLICE 2: powered doors (pair takes max adjacent power over both halves) and a momentary button.',
  '- HUMAN OVERRIDE PRECEDENT (round 10): hands-on findings outrank probe evidence and repriced the merge by -0.5. The mouse-look core item stays FAIL until the human checkpoint certifies it.',
  '- ENVIRONMENTAL: headless tab is rAF-starved (hijack requestAnimationFrame and drive synthetic frames, or advance via screenshots); place() with zero items of the selected type silently no-ops; shore columns reject spawnAt as water (use inland cells); HUD text can be one frame stale.',
  '- COST CONTEXT: 3-round rolling cost is ~1.74M tokens per MPS point against a 2M soft ceiling. Spend probe calls where they convert points.',
].join('\n')

const DOMAINS = [
  { key: 'worldgen', brief: 'World generation: terrain, biomes, water, caves, sinkholes, ores, vegetation, snow line, seeding, chunk streaming; plus structures (hamlets, wells, ruins) and discoverability.' },
  { key: 'player', brief: 'Player and interaction: pointer lock and look (REAL path human-pending), movement, collision, targeting, break/place, hotbar, sprint/sneak/fly/swim, plus inventory, health, hunger, death stakes.' },
  { key: 'rendering', brief: 'Rendering, atmosphere, UI, audio: textures, shading, AO, fog, sky, day-night, weather, water, particles, light and occlusion, HUD and overlays, viewmodel, sounds.' },
  { key: 'systems', brief: 'Survival systems: crafting, tools, smelting, farming, mobs and combat, beds, redstone, save/load. Verify the round-10 additions are real and rank remaining family weight (deeper redstone, mob variety, villages, boats).' },
  { key: 'perf', brief: 'Performance, stability, code quality: FPS, remesh cost, chunk Map eviction debt, memory, error cleanliness, extensibility after ~2000 lines of accreted features.' },
]

const PROBE_SCHEMA = {
  type: 'object', required: ['verified_pass', 'verified_fail', 'observations'],
  properties: {
    verified_pass: { type: 'array', items: { type: 'object', required: ['feature', 'evidence'], properties: { feature: { type: 'string' }, evidence: { type: 'string' } } } },
    verified_fail: { type: 'array', items: { type: 'object', required: ['feature', 'evidence'], properties: { feature: { type: 'string' }, evidence: { type: 'string' } } } },
    observations: { type: 'string' },
  }
}

const GAP_ITEMS = { type: 'array', items: { type: 'object', required: ['title', 'detail', 'mps_gain', 'risk'], properties: {
  title: { type: 'string' }, detail: { type: 'string' }, mps_gain: { type: 'number' }, risk: { type: 'string', enum: ['low', 'medium', 'high'] } } } }

const JUDGE_SCHEMA = {
  type: 'object', required: ['mps', 'confidence', 'item_verdicts', 'top_gaps', 'summary'],
  properties: {
    mps: { type: 'number' }, confidence: { type: 'string' },
    item_verdicts: { type: 'array', items: { type: 'object', required: ['feature', 'verdict'], properties: {
      feature: { type: 'string' }, verdict: { type: 'string', enum: ['pass', 'fail', 'unverified'] }, evidence: { type: 'string' } } } },
    top_gaps: GAP_ITEMS, summary: { type: 'string' },
  }
}

const DELTA_SCHEMA = {
  type: 'object', required: ['mps', 'delta_assessment', 'top_gaps', 'summary'],
  properties: { mps: { type: 'number' }, delta_assessment: { type: 'string' }, top_gaps: GAP_ITEMS, summary: { type: 'string' } }
}

const REGRESSION_SCHEMA = {
  type: 'object', required: ['regressions', 'overcredits', 'mps_opinion', 'summary'],
  properties: {
    regressions: { type: 'array', items: { type: 'object', required: ['title', 'evidence'], properties: { title: { type: 'string' }, evidence: { type: 'string' } } } },
    overcredits: { type: 'array', items: { type: 'object', required: ['title', 'evidence'], properties: { title: { type: 'string' }, evidence: { type: 'string' } } } },
    mps_opinion: { type: 'number' }, summary: { type: 'string' },
  }
}

const PLAN_SCHEMA = {
  type: 'object', required: ['round_mps', 'derivation', 'lanes', 'projected_next_gain', 'exit_recommendation'],
  properties: {
    round_mps: { type: 'number' }, derivation: { type: 'string' },
    lanes: { type: 'array', items: { type: 'object', required: ['name', 'goal', 'spec', 'acceptance'], properties: {
      name: { type: 'string' }, goal: { type: 'string' }, spec: { type: 'string' }, acceptance: { type: 'string' } } } },
    projected_next_gain: { type: 'number' },
    exit_recommendation: { type: 'string' },
    campaign_amendments: { type: 'string' },
  }
}

const BUILD_SCHEMA = {
  type: 'object', required: ['lane', 'changes_summary', 'static_ok'],
  properties: { lane: { type: 'string' }, changes_summary: { type: 'string' }, static_ok: { type: 'boolean' }, notes: { type: 'string' } }
}

const proberPrompt = ['You are the live prober for round ' + ROUND + ' of an iterative benchmark: a single-file browser Minecraft clone served at ' + URL + '. Play-verify the newest features and hunt regressions; report verified passes and fails with evidence. READ-ONLY on files; interact only with the running page.',
  '',
  'Setup: ToolSearch "select:mcp__Claude_Preview__preview_eval,mcp__Claude_Preview__preview_screenshot,mcp__Claude_Preview__preview_console_logs"; serverId "' + SERVER_ID + '". Navigate via preview_eval to ' + URL + ' and poll for window.__vox.',
  '',
  EVIDENCE,
  '',
  'Read SCORECARD.md and the probe section of ' + PREV_PANEL + ' first (do NOT re-verify what passed there; spot-check 2-3 for regressions). Priorities:',
  '1. BREADTH PACK: find a birch tree in forest (distinct trunk/canopy tiles vs oak); find and harvest the new plant; craft and eat the 3 new foods (hunger deltas); craft and place the 2 new blocks. Screenshot the variety.',
  '2. REDSTONE SLICE 2: build a straight wire run to a door and power it open/closed (the round-10 prober failed this via a diagonal wire gap, avoid that); verify the button gives a momentary pulse (door or lamp pulses then reverts); regression-check the round-10 lever-wire-lamp circuit and persistence.',
  '3. LANE-1 SYNTHETIC CHECKS: HUD symmetry (resize to a wide viewport if possible, screenshot, measure the hearts and hunger DOM rects against the viewport center; they should mirror); swim-jump (fly off, enter water, hold space toward a 1-block bank, confirm it mounts); camera fix: confirm the code path changed (real pointermove handler) and that injected look still works, but DO NOT mark the mouse-look core item as passed: it stays human-pending.',
  '4. Spot-check regressions: sheep chain, corpse-run, save/load round trip.',
  '5. Anything else cheap from the scorecard. Use 25-40 tool calls; screenshot generously.'].join('\n')

function fullJudgePrompt(d, probe) {
  return ['You are one judge on a 5-judge panel rating round ' + ROUND + ' (a FULL PANEL anchor round) of an iterative benchmark build: a single-file browser Minecraft clone polished toward Minecraft parity.',
  '',
  'Read first: RUBRIC.md, SCORECARD.md, ' + GAME + ', and ' + PREV_PANEL + ' (previous panel, calibration).',
  '',
  'YOUR DOMAIN, judge through it only: ' + d.brief,
  '',
  EVIDENCE,
  '',
  'PROBE REPORT (live, minutes ago):',
  JSON.stringify(probe, null, 1),
  '',
  'Rules: no preview tools yourself; probe plus code is the evidence base. The real mouse-look core item stays FAIL until a human certifies it, regardless of code reading. Harsh, ties down, half-working fails. item_verdicts for your domain; top_gaps 5-8 with rubric-priced mps_gain; summary 3-5 sentences with your delta read.'].join('\n')
}

function deltaJudgePrompt(probe) {
  return ['You are the DELTA JUDGE for round ' + ROUND + ' (an incremental rating round) of an iterative benchmark build: a single-file browser Minecraft clone scored on the Minecraft Parity Scale.',
  '',
  'Read first: RUBRIC.md, SCORECARD.md, ' + GAME + ', and ' + PREV_PANEL + ' (the previous panel: its merged score was ' + PREV_SCORE + ').',
  '',
  EVIDENCE,
  '',
  'PROBE REPORT (live, minutes ago):',
  JSON.stringify(probe, null, 1),
  '',
  'Your job: price the DELTA, not the whole build. Start from ' + PREV_SCORE + ', credit only what this probe and the lane evidence verify as new or fixed, debit verified regressions and newly discovered fails. The real mouse-look core item stays FAIL until a human certifies it. Output mps (your absolute score = previous plus your delta), delta_assessment (the itemized arithmetic), top_gaps (5-8, rubric-priced), summary. Harsh, ties down, no advance credit.'].join('\n')
}

function regressionHunterPrompt(probe) {
  return ['You are the ADVERSARIAL REGRESSION HUNTER for round ' + ROUND + ' of an iterative benchmark build (single-file Minecraft clone, previous merged score ' + PREV_SCORE + ').',
  '',
  'Read first: RUBRIC.md, ' + GAME + ', and ' + PREV_PANEL + ' (the previous panel and its verified ledger).',
  '',
  EVIDENCE,
  '',
  'PROBE REPORT (live, minutes ago):',
  JSON.stringify(probe, null, 1),
  '',
  'Your job is to REFUTE, not confirm: hunt for (a) regressions, previously verified items the new lanes may have broken that the probe did not re-check (the lanes touched input handling, HUD layout, worldgen tree placement, the power system, and shared data tables: reason about blast radius from the diff surface); (b) overcredits, items the probe or previous panels credited on thin evidence. Cite code or probe evidence for every claim; no speculation without a concrete mechanism. Output regressions, overcredits, mps_opinion (your absolute score), summary. Default to suspicion; if you find nothing, say so plainly.'].join('\n')
}

function plannerPrompt(rating, probe) {
  return ['You are the planner for round ' + ROUND + ' of an iterative build polishing a single-file browser Minecraft clone toward Minecraft parity. Loop v2 rules apply.',
  '',
  'STEP 1, CAMPAIGN RECONCILIATION (do this FIRST, with your file tools): Read ' + CAMPAIGN + '. Apply the probe-overrides-campaign rule: if the probe report below invalidates any arc item or ledger entry, Edit the campaign file with a one-line dated amendment before picking lanes. Also append a dated amendment recording this round: lanes you pick, your merged round_mps, and your projected_next_gain. Keep the file under ~120 lines.',
  '',
  'STEP 2, MERGE THE RATING. Rating agents this round:',
  JSON.stringify(rating, null, 1),
  '',
  'Probe findings: ' + JSON.stringify({ fails: probe.verified_fail, passes: probe.verified_pass.length }, null, 1),
  '',
  'Merge per rubric discipline: median-leaning, harsh, ties down, discount unverified-heavy outliers, honor the human-pending status of the mouse-look core. Previous score ' + PREV_SCORE + '. NOTE: exit rule is 3 consecutive rounds under +1.0 (counter currently 1/3 after round 10 scored +0.6); also output projected_next_gain for your best lane set and exit_recommendation (continue or exit, one sentence why). The soft cost ceiling is 2M tokens per MPS point on a 3-round rolling basis, currently ~1.74M: if your projection implies crossing it, recommend exit. Score honestly; exit is a legitimate outcome.',
  '',
  'STEP 3, LANES: produce EXACTLY 3 build lanes for this round, selected FROM the campaign arcs and debts (Arc B is current: villages to 3/3, second redstone slice landed already, chunk eviction perf debt, creeper or third hostile). Apply the breadth bonus: a strong breadth lane counts +0.5 projected MPS beyond its open-dimension pricing. Disjoint concerns, each sized for one builder pass. Nothing may break ?test=1 / window.__vox, determinism, or the 60fps budget. For each lane: precise spec (function names, file locations, exact behaviors) and acceptance a prober can run.'].join('\n')
}

function builderPrompt(lane, idx) {
  return ['You are builder ' + idx + ' of 3 in round ' + ROUND + ', implementing ONE lane of improvements to a single-file browser Minecraft clone. Other builders edited the file before you this round: ALWAYS Read the current file fresh; never assume content.',
  '',
  'FILE: ' + GAME,
  '',
  'LANE: ' + lane.name,
  'GOAL: ' + lane.goal,
  'SPEC: ' + lane.spec,
  'ACCEPTANCE: ' + lane.acceptance,
  '',
  'Hard constraints:',
  '- Single self-contained HTML file; existing stack only (vanilla JS + pinned three.js 0.160.0); no new network deps; everything procedural.',
  '- SEED-driven determinism preserved. Do not break ?test=1 or window.__vox.',
  '- Mind the frame budget (60fps minimum) and the existing compact style.',
  '- Do not remove or break existing features. File must still end with the closing html tag.',
  '- Do NOT run git commands; the main loop owns commits.',
  '- After editing, verify statically via Bash (file ends with </html>; node --check the extracted script if node exists). Set static_ok accordingly.',
  '- Stay in scope: THIS lane only.',
  '',
  'Return changes_summary, static_ok, notes.'].join('\n')
}

phase('Probe')
log('Prober play-verifying the round-10 build (breadth pack, redstone slice 2, lane-1 synthetic checks)')
const probe = await agent(proberPrompt, { label: 'probe:live', phase: 'Probe', schema: PROBE_SCHEMA })
if (!probe) throw new Error('prober died')
log('Probe: ' + probe.verified_pass.length + ' pass, ' + probe.verified_fail.length + ' fail')

phase('Rate')
let rating
if (FULL_PANEL) {
  log('FULL PANEL round: 5 domain seats')
  const raw = await parallel(DOMAINS.map(d => () => agent(fullJudgePrompt(d, probe), { label: 'judge:' + d.key, phase: 'Rate', schema: JUDGE_SCHEMA })))
  rating = { mode: 'full', seats: DOMAINS.map((d, i) => raw[i] ? Object.assign({ domain: d.key }, raw[i]) : null).filter(Boolean) }
  if (rating.seats.length < 3) throw new Error('too few seats survived')
  log('Seats: ' + rating.seats.map(s => s.domain + '=' + s.mps).join(', '))
} else {
  log('Incremental round: delta judge + regression hunter')
  const pair = await parallel([
    () => agent(deltaJudgePrompt(probe), { label: 'rate:delta', phase: 'Rate', schema: DELTA_SCHEMA }),
    () => agent(regressionHunterPrompt(probe), { label: 'rate:regression', phase: 'Rate', schema: REGRESSION_SCHEMA }),
  ])
  rating = { mode: 'incremental', delta: pair[0], hunter: pair[1] }
  if (!rating.delta && !rating.hunter) throw new Error('both rating agents died')
  log('Delta judge: ' + (rating.delta ? rating.delta.mps : 'dead') + '; hunter opinion: ' + (rating.hunter ? rating.hunter.mps_opinion : 'dead'))
}

phase('Plan')
let plan = await agent(plannerPrompt(rating, probe), { label: 'planner', phase: 'Plan', schema: PLAN_SCHEMA })
if (!plan) {
  log('Planner died; retrying once')
  plan = await agent(plannerPrompt(rating, probe), { label: 'planner-retry', phase: 'Plan', schema: PLAN_SCHEMA })
}
if (!plan) throw new Error('planner failed twice; resume this run to continue from cached probe/rating')
log('Round MPS ' + plan.round_mps + '; projection +' + plan.projected_next_gain + '; ' + plan.exit_recommendation)
log('Lanes: ' + plan.lanes.map(l => l.name).join(' | '))

phase('Build')
const built = []
let idx = 0
for (const lane of plan.lanes) {
  idx++
  const r = await agent(builderPrompt(lane, idx), { label: 'build:' + lane.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 28), phase: 'Build', schema: BUILD_SCHEMA })
  built.push(r)
  log('Lane ' + idx + (r ? ' done: ' + r.changes_summary.slice(0, 100) : ' FAILED'))
}

return { round: ROUND, mode: FULL_PANEL ? 'full' : 'incremental', round_mps: plan.round_mps, derivation: plan.derivation, projected_next_gain: plan.projected_next_gain, exit_recommendation: plan.exit_recommendation, probe: probe, rating: rating, lanes: plan.lanes, built: built }
