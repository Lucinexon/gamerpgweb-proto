/* ==========================================================================
   THE POLYMATH CODEX — js/systems.js  ·  LIVING MAINFRAME UPGRADE
   --------------------------------------------------------------------------
   SystemsEngine — five subsystems, zero new dependencies (no CDNs, no
   modules, no imports). Loaded BEFORE engine.js as a classic script:

     · TelemetryRadar   — 2D canvas radar sweep + oscilloscope (HiDPI,
                          cancelAnimationFrame lifecycle, reduced-motion safe)
     · ProbeManager     — persistent background expeditions via Date.now()
                          vs launchedAt (3 tiers: 2h / 8h / 24h), Telemetry
                          Surge hooks, loot + Data Cache drops, energy economy
     · DecayEngine      — Signal Retention / Node Integrity: Ebbinghaus
                          R(t) = exp(-dt / (S * 86400000)) * 100, status
                          badges (OPTIMAL / ATTENUATED / DEGRADED), 3-question
                          Targeted Audits that restore 100% and increment S
     · DispatchManager  — 0600 Dispatch: deterministic offline daily
                          transmissions (paradox + calibration query), +1
                          Chrono Metric, +25 energy, daily streak
     · BYOKClient       — operator link: custom Base URL + arbitrary model
                          string + masked key (localStorage only) + 1-token
                          connection test with detailed error reporting

   ENGINE COUPLING CONTRACT: this file executes before engine.js, so every
   engine global ($, $$, esc, shuffle, mdInline, typeset, drawSprites, toast,
   sfx, gainXP, celebrate, openModal, S, save, SECTORS, NAVMAP, QUIZZES,
   REDUCED, levelOf) is referenced LAZILY inside function bodies only —
   never at evaluation time. engine.js calls SystemsEngine.init() from its
   own DOMContentLoaded boot cycle.
   ========================================================================== */
'use strict';
(function () {

  /* ========================= SYSTEM STATE (own storage key) ========================= */
  const SYSKEY = 'polymath_codex_sys_v1';
  const SYS_DEFAULT = {
    energy: 40,
    probes: [],            // [{id, tier, launchedAt, duration, surgeMs, done, doneAt}]
    probeSeq: 0,
    inventory: {},         // itemId -> count
    decay: {},             // secId -> {last: timestamp, S: stability days (1..30)}
    dispatch: { lastClaim: null, streak: 0, best: 0, chrono: 0, total: 0, pick: null },
    byok: { url: '', key: '', model: '' },
    audits: { tries: 0, passes: 0 }
  };
  function sysLoad() {
    try {
      const raw = localStorage.getItem(SYSKEY);
      if (raw) {
        const p = JSON.parse(raw);
        return Object.assign({}, SYS_DEFAULT, p, {
          dispatch: Object.assign({}, SYS_DEFAULT.dispatch, p.dispatch || {}),
          byok: Object.assign({}, SYS_DEFAULT.byok, p.byok || {}),
          audits: Object.assign({}, SYS_DEFAULT.audits, p.audits || {})
        });
      }
    } catch (e) { /* corrupted or absent — fresh boot */ }
    return JSON.parse(JSON.stringify(SYS_DEFAULT));
  }
  let SYS = sysLoad();
  function sysSave() { try { localStorage.setItem(SYSKEY, JSON.stringify(SYS)); } catch (e) {} }

  /* ---- local pure helpers (no engine dependency) ---- */
  const P2 = n => (n < 10 ? '0' + n : '' + n);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const hashStr = s => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0; return h; };
  const todayKey = () => { const d = new Date(); return d.getFullYear() + '-' + P2(d.getMonth() + 1) + '-' + P2(d.getDate()); };
  function debounce(fn, ms) { let t = null; return function () { const a = arguments; clearTimeout(t); t = setTimeout(() => fn.apply(null, a), ms); }; }

  /* ========================= PROBE TIERS & LOOT TABLES ========================= */
  const TIERS = {
    sweep: {
      key: 'sweep', name: 'SUBNET SWEEP', dur: 2 * 3600e3, cost: 10, xp: 5, icon: 'radar',
      tag: 'TIER I · 2 HOURS', desc: 'Utility consumables and basic telemetry fragments from the near network.'
    },
    archive: {
      key: 'archive', name: 'DEEP WEB ARCHIVE CRAWL', dur: 8 * 3600e3, cost: 20, xp: 12, icon: 'net',
      tag: 'TIER II · 8 HOURS', desc: 'Encrypted research notes and energy recovery shards from archived layers.'
    },
    deep: {
      key: 'deep', name: 'DEEP SPACE TELEMETRY', dur: 24 * 3600e3, cost: 30, xp: 25, icon: 'moon',
      tag: 'TIER III · 24 HOURS', desc: 'Rare cross-domain synthesis artifacts and system badges from the deep field.'
    }
  };
  const LOOT = {
    sweep: [
      { id: 'frag',  name: 'Telemetry Fragment',          icon: 'chart',  kind: 'material' },
      { id: 'filt',  name: 'Signal Filter',               icon: 'search', kind: 'material' },
      { id: 'cmark', name: 'Cache Marker',                icon: 'target', kind: 'material' }
    ],
    archive: [
      { id: 'note',  name: 'Encrypted Research Note',     icon: 'doc',    kind: 'material' },
      { id: 'shard', name: 'Energy Recovery Shard',       icon: 'bolt',   kind: 'usable', give: 15 },
      { id: 'chks',  name: 'Archive Checksum',            icon: 'check',  kind: 'material' }
    ],
    deep: [
      { id: 'synth', name: 'Cross-Domain Synthesis Artifact', icon: 'atom',   kind: 'rare' },
      { id: 'anom',  name: 'Anomaly Signature',               icon: 'moon',   kind: 'rare' },
      { id: 'dfield',name: 'Deep Field Reading',              icon: 'star',   kind: 'material' },
      { id: 'btmpl', name: 'System Badge Template',           icon: 'trophy', kind: 'rare' }
    ]
  };
  const ALL_LOOT = {};
  Object.keys(LOOT).forEach(k => LOOT[k].forEach(it => { ALL_LOOT[it.id] = it; }));

  /* ========================= 0600 DISPATCH DICTIONARY =========================
     Deterministic offline calendar. 60 paradox/incident entries crossed with
     60 calibration queries: day-of-year index i selects paradox i%60 and
     query (i%60 + 29*floor(i/60))%60 — a proven collision-free pairing for
     every day of any non-leap year (365 unique transmissions), with each
     calendar date additionally stamped into the header. 100% offline. */
  const DISPATCH_PARADOXES = [
    { t: 'The Ship of Theseus', b: 'Every plank of a ship is replaced, one by one. Is it still the same ship? The Internet answers this daily: cables, routers and protocols are swapped out continuously while "the network" persists unchanged.' },
    { t: 'The Liar Paradox', b: '"This transmission is false." If it is true, it is false; if it is false, it is true. Self-reference breaks naive truth predicates — the crack Gödel later widened into incompleteness.' },
    { t: 'Olbers’ Paradox', b: 'In an infinite, static, eternal universe every line of sight ends on a star, and the night sky should blaze like the surface of the sun. Darkness is direct evidence of a finite-age, expanding universe.' },
    { t: 'The Fermi Paradox', b: 'Billions of galaxies, billions of years, no visitors. Where is everybody? Every term of the Drake equation is a fight between telescopes and silence.' },
    { t: 'Maxwell’s Demon', b: 'A tiny doorkeeper sorts fast molecules from slow ones, seemingly violating the second law. The escape hatch: erasing the demon’s memory costs exactly kT ln 2 per bit — information is physical.' },
    { t: 'Laplace’s Demon', b: 'Know every particle’s position and momentum, and the entire future becomes calculable. Quantum indeterminacy and deterministic chaos both refuse to hand over the ledger.' },
    { t: 'The Quantum Zeno Effect', b: 'An unstable particle observed continuously never decays — a watched pot that mathematically refuses to boil. Sufficiently frequent measurement freezes the evolution of the wavefunction.' },
    { t: 'Schrödinger’s Cat', b: 'Seal a cat’s fate to a quantum event and the formalism says it is alive-and-dead until observed. The paradox is a reductio: where, exactly, does the quantum world end?' },
    { t: 'The Twin Paradox', b: 'Both twins see the other’s clock run slow, yet only one comes home younger. The symmetry breaks at the turnaround: acceleration is absolute, arguments are not.' },
    { t: 'The Grandfather Paradox', b: 'Travel back and prevent your own birth — then who traveled? Physics offers chronology protection and branching timelines; logic offers a headache.' },
    { t: 'The Bootstrap Paradox', b: 'A time traveler hands Shakespeare his own collected works, which Shakespeare then "writes". The information exists with no author and no origin — a causal loop missing its first cause.' },
    { t: 'Newcomb’s Problem', b: 'A predictor puts money in opaque boxes. One-boxers and two-boxers both prove their choice is rational, and they cannot both be right. Decision theory still argues about it.' },
    { t: 'The Unexpected Hanging', b: 'The judge promises the prisoner will be surprised by his execution next week. The prisoner proves every day is impossible — and is genuinely surprised on Thursday. Reasoning about your own reasoning is unsafe.' },
    { t: 'The Sorites Paradox', b: 'One grain is not a heap. Adding one grain never makes a heap. Yet somehow, heaps exist. Vague predicates refuse to draw the line you keep asking for.' },
    { t: 'Zeno’s Achilles', b: 'To pass the tortoise, Achilles must first reach its last position, then the next, forever — infinitely many tasks in finite time. Calculus cashes the infinity out; motion survives.' },
    { t: 'The Coastline Paradox', b: 'Measure Britain with a shorter ruler and the coast gets longer, without limit. Coastlines have fractal dimension: finite area, effectively infinite perimeter.' },
    { t: 'The Birthday Paradox', b: 'Put 23 people in a room and there is a 50.7% chance two share a birthday. Intuition counts days; probability counts pairs — 253 of them.' },
    { t: 'Simpson’s Paradox', b: 'A treatment wins in every subgroup of patients yet loses in the combined table. Aggregation re-weights the groups and reverses the conclusion. Always ask for the denominators.' },
    { t: 'The Monty Hall Problem', b: 'Behind one of three doors is a car. The host, who knows, opens a goat door. Switching doubles your odds — the reveal is information, not theater.' },
    { t: 'The St. Petersburg Paradox', b: 'A coin-flip game with unbounded payoff has infinite expected value, yet no one would pay their life savings to play. Expected value is not the whole of rationality.' },
    { t: 'Braess’s Paradox', b: 'Adding a fast new road can slow every driver down, because individually rational route choices jam the shortcut. Seoul deleted a highway and traffic improved.' },
    { t: 'The Jevons Paradox', b: 'Make engines more efficient and coal consumption rises: efficiency lowers the effective price of the work. Conservation at the component scale becomes consumption at the system scale.' },
    { t: 'Goodhart’s Law', b: 'When a measure becomes a target, it stops being a measure. Count cameras and you get cameras, not safety; count lines of code and you get lines.' },
    { t: 'The Hawthorne Effect', b: 'Workers improve simply because someone is watching. The observer contaminates the observation — the lab leaks into the result.' },
    { t: 'The Anthropic Principle', b: 'The constants of nature sit inside the narrow band that permits observers. Is that design, a multiverse lottery, or a selection effect you cannot step outside of?' },
    { t: 'The Doomsday Argument', b: 'If your birth rank among all humans is random, a huge future population makes your early position unlikely. Bayes applied to your own existence date suggests caution about humanity’s census.' },
    { t: 'The Boltzmann Brain', b: 'In an old enough universe, thermal noise will occasionally assemble a self-aware brain complete with false memories. How do you know this reading isn’t one?' },
    { t: 'The Simulation Argument', b: 'If civilizations like ours ever run ancestor simulations at scale, simulated beings vastly outnumber real ones — and you have no observational test to tell which side you are on.' },
    { t: 'The Halting Problem', b: 'No program can decide, for every possible program and input, whether it halts. Diagonalization: feed the decider to itself. There is no universal debugger.' },
    { t: 'P versus NP', b: 'Checking a solution is easy; finding one appears hard. If they are equal, cryptography collapses and logistics becomes trivial. A million dollars awaits the proof either way.' },
    { t: 'The Peter Principle', b: 'People are promoted until they reach their level of incompetence. Hierarchies promote on current-role success, which is a different skill from the next role’s demands.' },
    { t: 'The Dunning–Kruger Effect', b: 'The least skilled lack precisely the skill needed to notice their gaps. Confidence and competence are different axes, and one of them is self-measuring.' },
    { t: 'Survivorship Bias', b: 'WWII engineers wanted to armor where returning bombers were hit. Abraham Wald said: armor where they were NOT hit — the holes you cannot see are the ones that brought planes down.' },
    { t: 'The Lindy Effect', b: 'A technology’s expected remaining life scales with its observed life so far. Python is a safer bet than this year’s framework, precisely because it is already old.' },
    { t: 'The Abilene Paradox', b: 'A group agrees to do what no individual member wanted, because each believes the others want it. Organizations can be collectively governed by imaginary preferences.' },
    { t: 'The Tragedy of the Commons', b: 'Each herder gains from one extra animal and the whole pasture pays. Rational actors, barren field. 2b2t’s spawn region is the pixel-art edition.' },
    { t: 'Arrow’s Impossibility Theorem', b: 'With three or more options, no rank-order voting system converts individual preferences into a fair group ranking without a dictator. Perfect elections are mathematically forbidden.' },
    { t: 'The Condorcet Paradox', b: 'Majorities can prefer A over B, B over C, and C over A. Group preferences can cycle even when every individual voter is perfectly consistent.' },
    { t: 'Buridan’s Ass', b: 'A donkey placed exactly between two identical haystacks starves, waiting for a reason to choose. Symmetry plus strict rationality equals deadlock.' },
    { t: 'The Mpemba Effect', b: 'Under some conditions hot water freezes faster than cold. Named after a student who refused to be told he was wrong — still argued about, still not fully explained.' },
    { t: 'The Tea Leaf Paradox', b: 'Stir tea and the leaves gather in the center, not at the rim. Einstein worked out the secondary flow in 1926 — the same physics guides river bends and industrial separators.' },
    { t: 'The Ehrenfest Paradox', b: 'A rigid rotating disc cannot stay rigid: the rim contracts relative to the center, so its geometry refuses Euclid. Rotation strains the absolutes of space itself.' },
    { t: 'The Black Hole Information Paradox', b: 'Hawking radiation is thermal and seems to carry no information out of a black hole, yet quantum mechanics forbids information loss. Decades of proposals; still open.' },
    { t: 'The Hubble Tension', b: 'Early-universe and local measurements of the expansion rate disagree beyond 5 sigma: roughly 67 versus 73 km/s/Mpc. Something in cosmology is wrong and no one knows which thing.' },
    { t: 'Poincaré Recurrence', b: 'In a finite box with finite energy, the system will eventually revisit any given state to arbitrary precision. Given enough time, this exact reading happens again.' },
    { t: 'Loschmidt’s Paradox', b: 'The microscopic laws are time-symmetric, yet the macroscopic world has a stubborn arrow. The asymmetry hides in the initial conditions, not the equations.' },
    { t: 'The Gibbs Paradox', b: 'Mix two identical gases and entropy does not increase; mix two different gases and it does. Identical particles are fundamentally indistinguishable, and thermodynamics keeps score.' },
    { t: 'Wigner’s Friend', b: 'Wigner’s friend measures a particle and records a definite result; Wigner, outside the sealed lab, assigns it a superposition. Whose facts are the facts?' },
    { t: 'The Quantum Pigeonhole Principle', b: 'Put three pigeons in two holes and classically some pair must share. In quantum mechanics, no two pigeons are in the same hole while every pair is measured — pairs are not built from individuals.' },
    { t: 'Hilbert’s Hotel', b: 'A hotel with infinitely many rooms is completely full — and can still accommodate infinitely many new guests, just by shifting every room. Infinity has room-service problems.' },
    { t: 'Cantor’s Diagonal Argument', b: 'The reals outrank the naturals: any list of reals misses one you can build from its own diagonal. Some infinities are strictly bigger than others.' },
    { t: 'Russell’s Paradox', b: 'Consider the set of all sets that do not contain themselves. Does it contain itself? Both answers explode. Naive set theory needed axioms after this.' },
    { t: 'The Raven Paradox', b: '"All ravens are black" is confirmed by every non-black non-raven — every green apple in the world. Confirmation has logical edges that intuition refuses to walk.' },
    { t: 'Goodman’s Grue', b: 'Define "grue" as green before a certain date and blue after. All emeralds observed so far are equally green and grue. Induction cannot choose between the regularities.' },
    { t: 'Gödel’s Incompleteness', b: 'Any consistent formal system rich enough for arithmetic contains true statements it cannot prove — including, if it is consistent, its own consistency.' },
    { t: 'The Drinker Paradox', b: 'In any non-empty bar there is someone such that, if they are drinking, everyone is drinking. Provably true in classical logic; try asking the bartender to point them out.' },
    { t: 'The Lottery Paradox', b: 'It is rational to believe each individual ticket will lose, and irrational to believe all tickets lose. Rational belief is not closed under conjunction.' },
    { t: 'Parrondo’s Paradox', b: 'Two games, each losing on its own, can be combined — even alternating randomly — into a winning game. The ratchet hides in the coupling between them.' },
    { t: 'The Two-Envelope Paradox', b: 'One envelope holds twice the other. Whichever you hold, switching seems to improve expectation by 25% — for both envelopes. The flaw rides on an improper prior.' },
    { t: 'Benford’s Law', b: 'In real-world datasets the digit 1 leads about 30% of the time and 9 about 5%. Cooked ledgers bend the curve — and forensic accountants read the bend.' }
  ];
  const DISPATCH_QUERIES = [
    { q: 'A bat and a ball cost $1.10 together. The bat costs $1.00 more than the ball. How much is the ball?', o: ['5 cents', '10 cents', '15 cents'], a: 0, w: '$1.05 + $0.05: the difference is exactly $1.00. The intuitive 10¢ answer ignores the "more than".' },
    { q: 'Lily pads double every day and cover the lake on day 48. When was the lake half covered?', o: ['Day 24', 'Day 47', 'Day 46'], a: 1, w: 'Doubling means one day back is one half: 50% on day 47. Exponential growth hides its scale until the last steps.' },
    { q: 'If 5 machines take 5 minutes to make 5 widgets, how long do 100 machines take for 100 widgets?', o: ['100 minutes', '5 minutes', '20 minutes'], a: 1, w: 'Each machine produces one widget per 5 minutes. Scaling machines and widgets together keeps the time flat.' },
    { q: 'Monty Hall: you pick a door, the host (who knows) reveals a goat behind another. Switching wins with what probability?', o: ['1/3', '1/2', '2/3'], a: 2, w: 'Your first pick holds the car only 1/3 of the time; the other 2/3 collapses onto the single unopened door after the reveal.' },
    { q: 'How many people make a shared birthday more likely than not?', o: ['About 23', 'About 60', 'About 183'], a: 0, w: '23 people form 253 pairs — the pair count, not the day count, drives the 50.7%.' },
    { q: 'A disease affects 1% of people. A test is 99% accurate in both directions. You test positive — probability you are actually sick?', o: ['99%', 'About 50%', 'About 10%'], a: 1, w: 'True positives: $0.99 \\times 1\\%$. False positives: $1\\% \\times 99\\%$. They are nearly equal, so the answer hovers near 50% — base rates dominate.' },
    { q: 'Probability of rolling at least one 6 across 4 dice?', o: ['About 52%', 'About 17%', 'About 67%'], a: 0, w: 'Complement rule: $1-(5/6)^4 \\approx 51.8\\%$. Think "none of them", then subtract.' },
    { q: 'A coin flip pays +50% of your stake on heads, −40% on tails. Expected growth of your stake per flip?', o: ['+5%', '−5%', '0%'], a: 0, w: 'Mean wealth factor: $\\frac{1}{2}(1.5)+\\frac{1}{2}(0.6)=1.05$ — a +5% expectation even though it feels like a wash.' },
    { q: 'A banner character has a 0.6% rate. Ignoring pity systems, the expected number of pulls for one copy is about…', o: ['17', '167', '960'], a: 1, w: 'Geometric expectation: $1/0.006 \\approx 167$ pulls. Pity counters exist precisely because unlucky tails run long.' },
    { q: 'Losing two consecutive 50/50 pity rolls has what probability?', o: ['25%', '50%', '10%'], a: 0, w: 'Independent halves: $0.5^2 = 0.25$. Variance is the gacha business model.' },
    { q: 'Improving 1% every single day for a year multiplies you by roughly…', o: ['1.4×', '37.8×', '2×'], a: 1, w: '$1.01^{365} \\approx 37.8$ — compounding is a slope you cannot feel daily.' },
    { q: 'WWII bombers returned with holes in wings and fuselage. Where should the armor go?', o: ['Where the holes are', 'Where there are no holes', 'Only on the engines'], a: 1, w: 'Wald’s insight: the sampled planes SURVIVED their holes. The clean regions mark where the fatal hits landed on planes that never came back.' },
    { q: 'What most improves a poll’s reliability?', o: ['Larger sample size', 'Larger population', 'Weekend fieldwork'], a: 0, w: 'Margin of error scales with $1/\\sqrt{n}$ — sampling a few thousand randomly beats nearly everything else.' },
    { q: 'Rookies of the year often slump in year two. Which effect explains it best?', o: ['Regression to the mean', 'Career burnout', 'Rule changes'], a: 0, w: 'Selection on an extreme debut selects partly on luck; the next season drifts back toward the true average.' },
    { q: 'A treatment wins in both the mild and severe patient groups but loses in the combined table. Why?', o: ['Data corruption', 'Different group sizes re-weight on aggregation', 'Rounding error'], a: 1, w: 'Simpson’s reversal: the aggregate is not the average of the subgroups — it is dominated by whichever group is largest in each arm.' },
    { q: 'Why do Minecraft coordinates glitch into the Far Lands near block 12,550,821?', o: ['Server lag', '32-bit float precision', 'Chunk file corruption'], a: 1, w: 'Near $1.2 \\times 10^7$, a 32-bit float’s representable values are spaced a full block apart — the terrain generator starts sampling garbage.' },
    { q: 'Fiber carries light at roughly 2/3 c. One-way propagation for a ~5,600 km transatlantic hop is about…', o: ['28 ms', '6 ms', '280 ms'], a: 0, w: '$5600\\ \\text{km} \\div 200{,}000\\ \\text{km/s} \\approx 28$ ms — the speed of light is the hard latency floor.' },
    { q: 'A 100 Mbps link downloads at roughly…', o: ['12.5 MB/s', '100 MB/s', '1 MB/s'], a: 0, w: 'MegaBITS to MegaBYTES: divide by 8. $100/8 = 12.5$ MB/s in the ideal case.' },
    { q: 'Why does long-haul backbone traffic use fiber rather than copper?', o: ['It is cheaper per meter', 'Higher bandwidth and far lower attenuation', 'It is easier to splice'], a: 1, w: 'Total internal reflection keeps loss per km tiny, and DWDM packs hundreds of wavelength channels into one glass core.' },
    { q: 'BGP routes Internet traffic on the strength of…', o: ['A central authority', 'Mutually announced trust between autonomous systems', 'Proof of stake'], a: 1, w: 'Anyone can announce almost any prefix — the 1980s trust model behind hijack incidents like the Pakistan–YouTube event.' },
    { q: 'A /24 IPv4 subnet offers how many usable host addresses?', o: ['256', '254', '255'], a: 1, w: '$2^8 = 256$ total, minus the network and broadcast addresses.' },
    { q: 'How long is an IPv6 address?', o: ['64 bits', '128 bits', '256 bits'], a: 1, w: '$2^{128}$ addresses — enough to subnet every grain of sand on Earth many times over.' },
    { q: 'The maximum value of a signed 32-bit integer is…', o: ['2,147,483,647', '4,294,967,295', '1,073,741,823'], a: 0, w: '$2^{31}-1$. The unsigned 4.29 billion variant is the classic off-by-one-sign confusion.' },
    { q: 'The Unix 2038 problem is caused by…', o: ['Two-digit years', 'Signed 32-bit seconds since 1970 overflowing', 'DNS rollover'], a: 1, w: '$2^{31}$ seconds after the epoch lands in January 2038; systems still storing time that way will wrap negative.' },
    { q: 'SHA-256 produces output of…', o: ['256 hex characters', '32 bytes', '64 bytes'], a: 1, w: '256 BITS = 32 bytes, usually rendered as 64 hexadecimal characters.' },
    { q: 'Simple monoalphabetic substitution ciphers fall mainly to…', o: ['Brute force', 'Frequency analysis', 'Quantum search'], a: 1, w: 'Letter frequencies of the underlying language survive substitution — ETAOIN does the lockpicking.' },
    { q: 'RSA’s security rests on the difficulty of…', o: ['Discrete logarithms', 'Factoring large semiprimes', 'Lattice reduction'], a: 1, w: 'Multiplying two big primes is fast; recovering them from the product is (as far as anyone knows) exponentially unpleasant.' },
    { q: 'Shor’s algorithm, run on a sufficient quantum computer, would break…', o: ['AES', 'RSA and ECC', 'SHA-3'], a: 1, w: 'It factors integers and solves discrete logs in polynomial time. Symmetric ciphers like AES only need bigger keys against Grover.' },
    { q: 'A one-time pad is unbreakable if and only if…', o: ['The key is reused monthly', 'The key is truly random and used exactly once', 'The key is hashed first'], a: 1, w: 'Perfect secrecy demands a uniformly random key at least as long as the message, never reused — reuse leaks structure (VENONA).' },
    { q: 'Cicada 3301 recruited solvers through…', o: ['Paid advertisements', 'Layers of puzzles — steganography, runes, dead drops', 'University exams'], a: 1, w: 'Images hiding runes via steganography led to books, phone numbers and physical markers; part of the Liber Primus remains unsolved.' },
    { q: 'Why do LLMs miscount letters — like the r’s in "strawberry"?', o: ['Weak arithmetic', 'BPE tokens do not expose individual characters', 'Training cutoffs'], a: 1, w: 'The model sees tokens, not characters — "strawberry" may be 2–3 tokens with no direct letter-level access without tooling.' },
    { q: 'Attention scales dot products by $1/\\sqrt{d}$ because…', o: ['It saves compute', 'It keeps the softmax input variance stable', 'It prevents integer overflow'], a: 1, w: 'With $d$-dimensional vectors of unit variance, raw dot products have variance $d$; the rescale keeps the softmax from saturating.' },
    { q: 'The RLHF pipeline first trains…', o: ['The policy directly', 'A reward model from human preferences', 'A larger base LLM'], a: 1, w: 'Preference pairs train a reward model; the policy is then optimized (PPO/DPO-style) against that learned reward signal.' },
    { q: 'The Corrupted Blood incident is remembered as…', o: ['A WoW virtual plague studied by epidemiologists', 'A Dota match-fixing scandal', 'A Steam outage'], a: 0, w: 'The 2005 debuff escaped via pet stalling and mirrored real epidemic curves — researchers later mined the event data for models.' },
    { q: '2b2t is best described as…', o: ['The oldest Minecraft anarchy server', 'A private modded server', 'A speedrunning clan'], a: 0, w: 'Founded in 2010, no rules, no resets — a decade-plus case study in ungoverned systems and emergent geography.' },
    { q: 'Landauer’s principle: the minimum energy cost of erasing one bit is…', o: ['$kT \\ln 2$', 'Planck energy', 'Exactly zero'], a: 0, w: 'Information erasure has a thermodynamic price tied to temperature — reversible computing tries to avoid paying it.' },
    { q: 'Herobrine was…', o: ['A real mob in the game', 'A community myth never present in the code', 'Notch’s alternate account'], a: 1, w: 'Pure creepypasta — yet Mojang shipped "Removed Herobrine" in changelogs for years as a running joke.' },
    { q: 'GPS satellite clocks run ~38 μs fast per day. The fix is…', o: ['Bigger solar panels', 'Relativistic correction', 'Colder oscillators'], a: 1, w: '+45 μs from weaker gravity, −7 μs from orbital speed. Uncorrected, positions would drift kilometers per day.' },
    { q: 'The Schwarzschild radius is…', o: ['$GM/c^2$', '$2GM/c^2$', '$c^2/2GM$'], a: 1, w: '$r_s = 2GM/c^2$ — about 3 km per solar mass. Compress inside it and escape velocity exceeds c.' },
    { q: 'The Chandrasekhar limit is roughly…', o: ['1.44 solar masses', '3 solar masses', '0.08 solar masses'], a: 0, w: 'Above about $1.44\\,M_\\odot$, electron degeneracy pressure loses to gravity — white dwarfs collapse or detonate.' },
    { q: 'A teaspoon of neutron-star material weighs about…', o: ['A mountain', 'A billion tons', 'A feather'], a: 1, w: 'Nuclear density is around $10^{17}$ kg/m³ — the teaspoon outweighs a mountain range by orders of magnitude.' },
    { q: 'The Hubble tension is a disagreement about…', o: ['The value of the Hubble constant $H_0$', 'Dark matter composition', 'Exoplanet counts'], a: 0, w: 'Early-universe (CMB) inference says ~67; local distance ladders say ~73 km/s/Mpc — a stubborn crack in the standard model.' },
    { q: 'The cosmic microwave background has a temperature of…', o: ['0 K', '2.725 K', '273 K'], a: 1, w: 'The afterglow of recombination, redshifted to 2.725 K — the oldest observable light in the universe.' },
    { q: 'A higher redshift z means the observed object is…', o: ['Closer and younger', 'Farther away and seen earlier in cosmic time', 'Hotter today'], a: 1, w: 'Redshift stretches lookback time: high-z galaxies are seen as they were billions of years ago, not as they are now.' },
    { q: 'EVE Online’s B-R5RB battle is famous for…', o: ['~$300,000 of destroyed ships in a single day', 'The first esports contract', 'A mining-bot ban wave'], a: 0, w: 'The 2014 flagship clash destroyed 75+ Titans — real-money damage still cited as a large-scale conflict dataset.' },
    { q: 'A star with a parallax of 0.1 arcsec sits at…', o: ['1 parsec', '10 parsecs', '100 parsecs'], a: 1, w: '$d = 1/\\pi$ in parsecs and arcseconds: $1/0.1 = 10$ pc, about 32.6 light-years.' },
    { q: 'Standard candles like Type Ia supernovae are used to measure…', o: ['Distance', 'Surface temperature', 'Stellar age'], a: 0, w: 'Known intrinsic brightness plus observed flux yields distance — the calibration rung from Cepheids out to cosmological redshifts.' },
    { q: 'Main-sequence stars spend most of their lives fusing…', o: ['Hydrogen into helium', 'Iron', 'Helium into carbon'], a: 0, w: 'Core hydrogen burning is the long, stable phase; everything after it is a rapid, luminous decline.' },
    { q: 'Fusion of elements heavier than iron…', o: ['Releases energy', 'Consumes energy', 'Is impossible'], a: 1, w: 'Iron sits at the peak of the binding-energy curve; past it, fusion absorbs energy — hence core collapse and supernovae.' },
    { q: 'Kilonovae are the primary cosmic forge of…', o: ['Gold and platinum', 'Hydrogen', 'Iron'], a: 0, w: 'Neutron-star mergers run the r-process and spray heavy elements — your jewelry is likely kilonova debris.' },
    { q: 'The Drake equation estimates…', o: ['Communicating civilizations in the galaxy', 'Star formation rates', 'Exoplanet sizes'], a: 0, w: 'It multiplies poorly known factors — its real value is framing the question, not the number it prints.' },
    { q: 'Dunbar’s number is approximately…', o: ['150', '1,500', '15'], a: 0, w: 'The cognitive ceiling on stable social relationships — beyond it you need institutions, laws and org charts.' },
    { q: 'Money, nations and law exist…', o: ['Objectively, like rocks', 'As intersubjective realities — shared beliefs', 'Genetically'], a: 1, w: 'No single person can suspend them, yet they are made entirely of coordinated belief — Harari’s core point.' },
    { q: 'The "wheat trap" argument says agriculture domesticated…', o: ['Humans', 'Wheat', 'Both equally'], a: 1, w: 'Wheat spread by making humans work for it: more calories, more labor, more disease, more hierarchy.' },
    { q: 'System 1 is…', o: ['Slow and deliberate', 'Fast and automatic', 'Purely emotional'], a: 1, w: 'Kahneman’s fast lane: effortless pattern completion — brilliant heuristics, systematic biases.' },
    { q: 'Losses typically hurt about…', o: ['The same as gains', 'Twice as much as gains', 'Ten times gains'], a: 1, w: 'The ~2:1 loss-aversion ratio explains endowment effects and why "don’t lose X" beats "gain X" in persuasion.' },
    { q: 'A Nash equilibrium means no player can gain by…', o: ['Cooperating', 'Deviating alone', 'Randomizing'], a: 1, w: 'Unilateral deviation earns nothing — the stable state on which the whole game-theory edifice is built.' },
    { q: 'Tit-for-tat won Axelrod’s tournaments by being…', o: ['Ruthless', 'Nice, retaliatory, forgiving and clear', 'Random'], a: 1, w: 'Start cooperative, punish defection once, then forgive — four simple traits that beat every clever heavyweight strategy.' },
    { q: 'Fisherian runaway best explains…', o: ['Peacock tails', 'Fish schooling', 'Bird migration'], a: 0, w: 'A preference trait selects for itself: choosy females and flashy males spiral together until survival costs intervene.' },
    { q: 'Dead internet theory, stated soberly, claims…', o: ['The internet died in 2015', 'Bot and AI content dominate measurable engagement', 'Wi-Fi harms health'], a: 1, w: 'The verifiable core: automated traffic and generated content already rival human activity on major platforms.' }
  ];

  /* ========================= TELEMETRY CONSOLE (ticker) ========================= */
  const TeleLog = {
    el: null,
    boot() {
      this.el = document.getElementById('teleLog');
      if (!this.el) return;
      this.push('TELEMETRY BAY ONLINE — OPERATOR LINK ESTABLISHED', 'ok');
      this.push('CLOCK SYNC: ' + new Date().toUTCString(), 'dim');
      this.push('AWAITING LAUNCH DIRECTIVES…', 'dim');
    },
    stamp() { const d = new Date(); return P2(d.getHours()) + ':' + P2(d.getMinutes()) + ':' + P2(d.getSeconds()); },
    push(msg, cls) {
      if (!this.el) return;
      const d = document.createElement('div');
      d.className = 'tline' + (cls ? ' ' + cls : '');
      d.innerHTML = '<span class="tt">[' + this.stamp() + ']</span> ' + msg;
      this.el.appendChild(d);
      while (this.el.children.length > 60) this.el.removeChild(this.el.firstChild);
      this.el.scrollTop = this.el.scrollHeight;
    }
  };

  /* ========================= TELEMETRY RADAR (2D canvas) =========================
     High-DPI via devicePixelRatio; sweep + ping blips + oscilloscope strip.
     Lifecycle: resume() on entering #probes, pause() on leaving, suspend()
     when the tab hides. All timers live in ProbeManager, never here. */
  const TelemetryRadar = {
    cv: null, ctx: null, raf: null, running: false, screenLive: false,
    w: 0, h: 0, sweep: 0, lastT: 0, spike: 0,
    dpr: Math.min(2, window.devicePixelRatio || 1),
    layout: { cx: 0, cy: 0, r: 60, scopeY: 0, scopeH: 64 },
    init() {
      this.cv = document.getElementById('telemetryCanvas');
      if (!this.cv) return;
      this.ctx = this.cv.getContext('2d');
      this.size();
      window.addEventListener('resize', debounce(() => { this.size(); if (!this.running && this.w) this.drawStatic(); }, 180));
    },
    size() {
      if (!this.cv || !this.ctx) return;
      const r = this.cv.getBoundingClientRect();
      if (!r.width || !r.height) return;             // screen hidden — heal on next resume
      this.w = r.width; this.h = r.height;
      this.cv.width = Math.round(r.width * this.dpr);
      this.cv.height = Math.round(r.height * this.dpr);
      this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      const scopeH = 64;
      const radarH = this.h - scopeH - 12;
      const R = Math.max(46, Math.min(this.w * 0.34, radarH / 2 - 12));
      this.layout = { cx: this.w * 0.5, cy: 14 + radarH / 2, r: R, scopeY: this.h - scopeH, scopeH: scopeH };
    },
    blips() {
      return ProbeManager.active().map(p => {
        const h = hashStr(p.id + p.tier);
        const rad = p.tier === 'deep' ? 0.92 : p.tier === 'archive' ? 0.68 : 0.42;
        return { id: p.id, tier: p.tier, ang: (h % 628) / 100, rad: rad + ((h >> 9) % 14) / 100 };
      });
    },
    setVisible(on) { this.screenLive = on; if (on) this.resume(); else this.pause(); },
    resume() {
      if (!this.ctx) this.init();
      if (!this.ctx) return;
      this.screenLive = true;
      if (!this.w) this.size();
      if (REDUCED) { this.drawStatic(); return; }     // prefers-reduced-motion: single static frame
      if (this.running) return;
      this.running = true; this.lastT = 0;
      const loop = t => {
        if (!this.running) return;
        if (!this.w) { this.size(); if (!this.w) { this.raf = requestAnimationFrame(loop); return; } }
        this.draw(t);
        this.raf = requestAnimationFrame(loop);
      };
      this.raf = requestAnimationFrame(loop);
    },
    pause() {                                   // leaving the screen — hard stop
      this.screenLive = false; this.running = false;
      if (this.raf) cancelAnimationFrame(this.raf);
      this.raf = null;
    },
    suspend() {                                 // tab hidden while screen may stay live
      this.running = false;
      if (this.raf) cancelAnimationFrame(this.raf);
      this.raf = null;
    },
    jolt(v) { this.spike = Math.max(this.spike, v); if (this.screenLive && !this.running) this.resume(); },
    drawStatic() { this.sweep = 2.1; this.draw(performance.now()); },
    draw(t) {
      const ctx = this.ctx; if (!ctx || !this.w) return;
      const L = this.layout, w = this.w, h = this.h, TAU = Math.PI * 2;
      const dt = this.lastT ? Math.min(64, t - this.lastT) : 16;
      this.lastT = t;
      this.sweep = (this.sweep + dt * 0.0011) % TAU;
      this.spike *= 0.955;
      /* phosphor persistence */
      ctx.fillStyle = 'rgba(5,9,30,0.30)'; ctx.fillRect(0, 0, w, h);
      /* radar grid */
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(63,224,255,0.20)';
      [1 / 3, 2 / 3, 1].forEach(f => { ctx.beginPath(); ctx.arc(L.cx, L.cy, L.r * f, 0, TAU); ctx.stroke(); });
      ctx.beginPath();
      ctx.moveTo(L.cx - L.r, L.cy); ctx.lineTo(L.cx + L.r, L.cy);
      ctx.moveTo(L.cx, L.cy - L.r); ctx.lineTo(L.cx, L.cy + L.r);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(63,224,255,0.34)';
      for (let i = 0; i < 12; i++) {
        const a = i * Math.PI / 6;
        ctx.beginPath();
        ctx.moveTo(L.cx + Math.cos(a) * (L.r + 3), L.cy + Math.sin(a) * (L.r + 3));
        ctx.lineTo(L.cx + Math.cos(a) * (L.r + 8), L.cy + Math.sin(a) * (L.r + 8));
        ctx.stroke();
      }
      /* sweep trail (brightness falls off behind the leading edge) */
      for (let k = 0; k < 26; k++) {
        const a = this.sweep - k * 0.022;
        ctx.strokeStyle = 'rgba(63,224,255,' + (0.5 * (1 - k / 26)).toFixed(3) + ')';
        ctx.beginPath(); ctx.moveTo(L.cx, L.cy);
        ctx.lineTo(L.cx + Math.cos(a) * L.r, L.cy + Math.sin(a) * L.r);
        ctx.stroke();
      }
      /* probe pings */
      const blips = this.blips(), tsec = t / 1000;
      blips.forEach(b => {
        let dd = this.sweep - b.ang; dd = ((dd % TAU) + TAU) % TAU; if (dd > Math.PI) dd = TAU - dd;
        const glow = Math.max(0, 1 - dd / 0.9);
        const bx = L.cx + Math.cos(b.ang) * L.r * b.rad, by = L.cy + Math.sin(b.ang) * L.r * b.rad;
        const col = b.tier === 'deep' ? '255,209,102' : b.tier === 'archive' ? '167,139,250' : '63,224,255';
        const pulse = (tsec * 0.7 + (hashStr(b.id) % 10) / 10) % 1;
        ctx.strokeStyle = 'rgba(' + col + ',' + (0.55 * (1 - pulse)).toFixed(3) + ')';
        ctx.beginPath(); ctx.arc(bx, by, 3 + pulse * 9, 0, TAU); ctx.stroke();
        ctx.fillStyle = 'rgba(' + col + ',' + (0.45 + 0.55 * glow).toFixed(3) + ')';
        ctx.fillRect(bx - 2.5, by - 2.5, 5, 5);
        if (glow > 0.15) {
          ctx.font = '9px "JetBrains Mono", monospace';
          ctx.fillStyle = 'rgba(' + col + ',' + (0.5 + 0.5 * glow).toFixed(3) + ')';
          ctx.fillText(b.id, bx + 7, by - 6);
        }
      });
      /* center + header */
      ctx.fillStyle = '#3fe0ff'; ctx.fillRect(L.cx - 2, L.cy - 2, 4, 4);
      ctx.font = '10px "Silkscreen", monospace';
      ctx.fillStyle = 'rgba(154,167,221,0.75)';
      ctx.fillText('RADAR SWEEP — ACTIVE PROBES: ' + blips.length, 10, 16);
      /* oscilloscope strip */
      ctx.strokeStyle = 'rgba(63,224,255,0.30)';
      ctx.beginPath(); ctx.moveTo(0, L.scopeY); ctx.lineTo(w, L.scopeY); ctx.stroke();
      const mid = L.scopeY + L.scopeH / 2;
      const amp = 7 + blips.length * 4 + this.spike * 26;
      ctx.strokeStyle = 'rgba(63,224,255,0.16)'; ctx.lineWidth = 3;
      this.scopePath(ctx, w, mid, amp, tsec, blips.length); ctx.stroke();
      ctx.strokeStyle = '#3fe0ff'; ctx.lineWidth = 1.2;
      this.scopePath(ctx, w, mid, amp, tsec, blips.length); ctx.stroke();
      ctx.font = '9px "Silkscreen", monospace';
      ctx.fillStyle = 'rgba(154,167,221,0.6)';
      ctx.fillText('SIGNAL ACQUISITION', 10, L.scopeY + 14);
    },
    scopePath(ctx, w, mid, amp, tsec, n) {
      ctx.beginPath();
      for (let x = 0; x <= w; x += 3) {
        const ph = x * (0.05 + n * 0.006);
        const y = mid + Math.sin(ph + tsec * 2.6) * amp * 0.6
                        + Math.sin(x * 0.017 - tsec * 1.7) * amp * 0.4
                        + (Math.random() - 0.5) * 2;
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
    }
  };

  /* ========================= PROBE MANAGER =========================
     Timestamps in localStorage — backgrounding, closing the tab or
     switching devices never halts or desyncs an expedition. */
  const ProbeManager = {
    active() { return SYS.probes.filter(p => !p.done); },
    find(tier) { return SYS.probes.find(p => p.tier === tier && !p.done) || null; },
    remaining(p) { return Math.max(0, p.launchedAt + p.duration - p.surgeMs - Date.now()); },
    fmt(ms) {
      const s = Math.max(0, Math.round(ms / 1000));
      const H = Math.floor(s / 3600), M = Math.floor((s % 3600) / 60);
      return H > 0 ? H + 'h ' + M + 'm' : (M > 0 ? M + 'm ' + (s % 60) + 's' : s + 's');
    },
    fmtClock(ms) {
      const s = Math.max(0, Math.ceil(ms / 1000));
      return P2(Math.floor(s / 3600)) + ':' + P2(Math.floor((s % 3600) / 60)) + ':' + P2(s % 60);
    },
    launch(tier) {
      const T = TIERS[tier]; if (!T) return;
      if (this.find(tier)) { toast('A <b>' + T.name + '</b> probe is already in flight.', 'radar', 2600); return; }
      if (SYS.energy < T.cost) {
        toast('Insufficient energy — need <b>' + T.cost + '</b>. Claim the 0600 Dispatch or spend Energy Recovery Shards.', 'bolt', 3400);
        sfx('bad'); return;
      }
      SYS.energy -= T.cost;
      SYS.probeSeq++;
      const pid = 'P-' + P2(SYS.probeSeq);
      SYS.probes.push({ id: pid, tier: tier, launchedAt: Date.now(), duration: T.dur, surgeMs: 0, done: false, doneAt: 0 });
      sysSave(); sfx('level');
      TeleLog.push('LAUNCH CONFIRMED — <b>' + T.name + '</b> · COST ' + T.cost + ' ⚡ · ETA ' + this.fmt(T.dur), 'ok');
      TeleLog.push(pid + ' // BURN COMPLETE ... TELEMETRY LOCK NOMINAL', 'dim');
      toast('<b>PROBE LAUNCHED</b><br>' + T.name + ' — signal returns in ' + this.fmt(T.dur) + '. It keeps running while you study.', T.icon, 3600);
      TelemetryRadar.jolt(0.6);
      renderProbes(); refreshHUD();
    },
    collect(tier) {
      const i = SYS.probes.findIndex(p => p.tier === tier && p.done);
      if (i < 0) return;
      const p = SYS.probes[i], T = TIERS[tier];
      SYS.probes.splice(i, 1);
      const drops = this.rollLoot(tier);
      drops.forEach(d => { SYS.inventory[d.id] = (SYS.inventory[d.id] || 0) + 1; });
      sysSave(); gainXP(T.xp, true); sfx('badge');
      TeleLog.push('<b>' + p.id + ' RECOVERED</b> — CARGO: ' + drops.map(d => esc(d.name)).join(' · '), 'ok');
      toast('<b>DATA CACHE UPDATED</b><br>' + drops.map(d => esc(d.name)).join('<br>') + '<br><span class="small">+' + T.xp + ' XP · telemetry archived</span>', 'bag', 4400);
      if (tier === 'deep') celebrate(70);
      renderProbes(); refreshHUD();
    },
    rollLoot(tier) {
      const table = LOOT[tier];
      const n = tier === 'deep' ? 2 + (Math.random() < 0.45 ? 1 : 0)
              : tier === 'archive' ? 2
              : 1 + (Math.random() < 0.3 ? 1 : 0);
      const out = [];
      for (let i = 0; i < n; i++) out.push(table[Math.floor(Math.random() * table.length)]);
      return out;
    },
    triggerSurge() {
      const mins = 5 + Math.floor(Math.random() * 11);          // shave 5–15 minutes
      const act = this.active();
      if (!act.length) {
        toast('⚡ TELEMETRY SURGE BUFFERED (−' + mins + 'm) — no probes in flight', 'bolt', 3000);
        TeleLog.push('SURGE BUFFERED (−' + mins + 'm) ... NO ACTIVE PROBES — launch from the Telemetry Bay', 'warn');
        return;
      }
      act.forEach(p => { p.surgeMs += mins * 60e3; });
      sysSave(); sfx('reveal'); TelemetryRadar.jolt(1);
      toast('⚡ TELEMETRY SURGE: PROBE TIME REDUCED (−' + mins + 'm)', 'bolt', 3200);
      TeleLog.push('⚡ SURGE INJECTED — ALL PROBES ACCELERATED BY ' + mins + 'm', 'gold');
      act.forEach(p => TeleLog.push(p.id + ' // ETA RECALCULATED ... T−' + this.fmt(this.remaining(p)), 'dim'));
      renderProbes();
    },
    tick() {
      const now = Date.now();
      let changed = false;
      SYS.probes.forEach(p => {
        if (!p.done && this.remaining(p) <= 0) {
          p.done = true; p.doneAt = now; changed = true;
          TeleLog.push('<b>' + p.id + ' // SIGNAL ACQUIRED</b> — PAYLOAD IN ORBIT ... AWAITING COLLECTION', 'gold');
          toast('<b>SIGNAL ACQUIRED</b><br>' + p.id + ' (' + TIERS[p.tier].name + ') payload ready to collect.', 'trophy', 3800);
          sfx('done'); TelemetryRadar.jolt(0.9);
        }
      });
      if (changed) { sysSave(); renderProbes(); }
      else paintTimers();
    },
    useItem(id) {
      const it = ALL_LOOT[id];
      if (!it || it.kind !== 'usable' || !SYS.inventory[id]) return;
      SYS.inventory[id]--;
      SYS.energy = clamp(SYS.energy + (it.give || 10), 0, 100);
      sysSave(); sfx('ok');
      toast('<b>' + esc(it.name) + '</b> dissipated — energy restored to ' + SYS.energy + '/100.', 'bolt', 2800);
      TeleLog.push('SHARD DISSIPATED ... ENERGY +' + (it.give || 10) + ' → ' + SYS.energy + '/100', 'ok');
      renderProbes(); refreshHUD();
    },
    maybeDrop(context) {                                       // Data Cache Drops
      const chance = context === 'ace' ? 0.4 : 0.3;
      if (Math.random() > chance) return;
      const r = Math.random();
      const tier = r < 0.5 ? 'sweep' : r < 0.85 ? 'archive' : 'deep';
      const it = LOOT[tier][Math.floor(Math.random() * LOOT[tier].length)];
      SYS.inventory[it.id] = (SYS.inventory[it.id] || 0) + 1;
      sysSave();
      TeleLog.push('ORPHAN PACKET RECOVERED — <b>' + esc(it.name).toUpperCase() + '</b> ADDED TO CACHE', 'gold');
      toast('<b>DATA CACHE DROP</b><br>' + esc(it.name) + ' decrypted into your cache.', 'bag', 3600);
      sfx('reveal');
      renderProbes();
    }
  };

  /* ========================= DECAY ENGINE (Signal Retention) =========================
     R(t) = exp(−Δt / (S × 86400000)) × 100%   ·   Δt = Date.now() − lastAudited
     S = sector stability in days (1–30). Status: R ≥ 80 OPTIMAL (cyan),
     50 ≤ R < 80 ATTENUATED (amber), R < 50 DEGRADED (red, terminal jitter). */
  const DAY_MS = 86400e3;
  const DecayEngine = {
    retention(secId) {
      const e = SYS.decay[secId];
      if (!e) return null;
      const dt = Date.now() - e.last;
      return Math.exp(-dt / (e.S * DAY_MS)) * 100;
    },
    statusOf(R) { return R == null ? 'baseline' : R >= 80 ? 'optimal' : R >= 50 ? 'attenuated' : 'degraded'; },
    statusWord(st) {
      return st === 'optimal' ? 'OPTIMAL' : st === 'attenuated' ? 'ATTENUATED' : st === 'degraded' ? 'DEGRADED' : 'NO BASELINE';
    },
    markAudited(secId) {
      const e = SYS.decay[secId];
      SYS.decay[secId] = { last: Date.now(), S: e ? e.S : 3 };
      sysSave(); refreshDecayUI();
    },
    recalibrate(secId) {
      const e = SYS.decay[secId];
      const before = e ? e.S : 3;
      SYS.decay[secId] = { last: Date.now(), S: Math.min(30, before + 1) };
      sysSave();
      TeleLog.push('NODE ' + secId.toUpperCase() + ' RECALIBRATED — INTEGRITY 100% · STABILITY S ' + before + ' → ' + SYS.decay[secId].S + ' DAYS', 'ok');
      return { before: before, after: SYS.decay[secId].S };
    },
    pulseNode(secId) {                                        // Node Resonance
      const card = document.querySelector('#missionMap .card[data-go="' + secId + '"]');
      if (card) { card.classList.remove('resonate'); void card.offsetWidth; card.classList.add('resonate'); setTimeout(() => card.classList.remove('resonate'), 1000); }
      const row = document.getElementById('ret-' + secId);
      if (row) { row.classList.remove('resonate'); void row.offsetWidth; row.classList.add('resonate'); setTimeout(() => row.classList.remove('resonate'), 1000); }
      const chip = document.querySelector('.sec-status[data-audit="' + secId + '"]');
      if (chip) { chip.classList.remove('resonate'); void chip.offsetWidth; chip.classList.add('resonate'); setTimeout(() => chip.classList.remove('resonate'), 1000); }
    }
  };

  /* ========================= TARGETED AUDIT (3-question recalibration) ========================= */
  let AUDIT = null;
  function openAudit(secId) {
    const q = (typeof QUIZZES !== 'undefined') ? QUIZZES[secId] : null;
    if (!q || !q.qs || q.qs.length < 3) return;
    AUDIT = { sec: secId, qs: shuffle(q.qs).slice(0, 3), i: 0, score: 0, picked: [], map: [] };
    renderAudit(); sfx('click');
  }
  function auditLabel() {
    if (typeof NAVMAP !== 'undefined' && NAVMAP[AUDIT.sec]) return NAVMAP[AUDIT.sec].label + ' — ' + (NAVMAP[AUDIT.sec].sub || '');
    return AUDIT.sec.toUpperCase();
  }
  function renderAudit() {
    if (!AUDIT) return;
    if (AUDIT.i < AUDIT.qs.length) {
      const Q = AUDIT.qs[AUDIT.i];
      if (!AUDIT.map[AUDIT.i]) {
        let opts = Q.opts.map((t, idx) => ({ t: t, ok: idx === Q.a }));
        if (Q.opts.length > 2) opts = shuffle(opts);
        AUDIT.map[AUDIT.i] = opts;
      }
      const opts = AUDIT.map[AUDIT.i];
      const picked = AUDIT.picked[AUDIT.i];
      openModal(
        '<p class="sec-kick" style="color:var(--vio)">RECALIBRATION BURST · ' + esc(auditLabel()) + '</p>' +
        '<h4 style="margin-top:6px">TARGETED AUDIT — ' + (AUDIT.i + 1) + ' / ' + AUDIT.qs.length + '</h4>' +
        '<p class="small">Signal retention: $R(t) = e^{-\\Delta t / S}$ — score 2 of 3 to restore node integrity to 100% and increment stability S.</p>' +
        '<p class="qtext">' + mdInline(Q.q) + '</p>' +
        '<div class="opts">' + opts.map((o, i) =>
          '<button class="opt ta-opt' + (picked != null ? (o.ok ? ' good' : (i === picked ? ' bad' : '')) : '') + '" data-i="' + i + '"' + (picked != null ? ' disabled' : '') + '>' +
          '<span class="opt-key">' + String.fromCharCode(65 + i) + '</span><span>' + mdInline(o.t) + '</span></button>').join('') + '</div>' +
        (picked != null
          ? '<div class="qfb ' + (opts[picked].ok ? 'ok' : 'no') + '"><span class="fbic" data-sprite="' + (opts[picked].ok ? 'check' : 'cross') + '" data-px="18" data-tint="' + (opts[picked].ok ? '#54e38a' : '#ff6b7d') + '"></span>' +
            '<div><b>' + (opts[picked].ok ? 'CORRECT' : 'INPUT REJECTED') + '</b><br>' + mdInline(Q.why || '') + '</div></div>' +
            '<div class="mbtns"><button class="btn primary" id="taNext">' + (AUDIT.i === AUDIT.qs.length - 1 ? 'VIEW RESULT' : 'NEXT') + ' <span class="ar"></span></button></div>'
          : ''),
        'NODE AUDIT');
    } else {
      const passed = AUDIT.score >= 2;
      SYS.audits.tries++;
      let html;
      if (passed) {
        SYS.audits.passes++;
        const rec = DecayEngine.recalibrate(AUDIT.sec);
        SYS.energy = clamp(SYS.energy + 5, 0, 100);
        gainXP(10, true); sfx('done'); celebrate(60);
        toast('<b>NODE INTEGRITY RESTORED</b><br>100% · stability S ' + rec.before + ' → ' + rec.after + ' days', 'check', 3800);
        html = '<div style="text-align:center">' +
          '<p class="sec-kick" style="color:var(--teal)">RECALIBRATION COMPLETE</p>' +
          '<div style="font-family:var(--pf);font-size:30px;color:var(--teal);margin:14px 0;text-shadow:3px 3px 0 #05081c">NODE 100%</div>' +
          '<p class="small">Integrity restored to OPTIMAL. Stability S hardened: ' + rec.before + ' → ' + rec.after + ' days.<br>+10 XP · +5 energy · the decay curve just got flatter.</p></div>';
      } else {
        sfx('bad');
        html = '<div style="text-align:center">' +
          '<p class="sec-kick" style="color:var(--red)">RECALIBRATION FAILED</p>' +
          '<div style="font-family:var(--pf);font-size:30px;color:var(--red);margin:14px 0;text-shadow:3px 3px 0 #05081c">' + AUDIT.score + '/3</div>' +
          '<p class="small">Stability S is unchanged and the node keeps decaying. Re-scan the sector terminals, then run the audit again.</p></div>';
      }
      sysSave();
      openModal(html + '<div class="mbtns" style="justify-content:center"><button class="btn primary" id="mOk">CLOSE</button></div>', 'NODE AUDIT');
      AUDIT = null;
      refreshDecayUI(); refreshHUD();
    }
  }

  /* ========================= 0600 DISPATCH MANAGER ========================= */
  const DispatchManager = {
    claimed() { return SYS.dispatch.lastClaim === todayKey(); },
    dayParts() {
      const key = todayKey();
      const d = new Date();
      const doy = Math.round((new Date(d.getFullYear(), d.getMonth(), d.getDate()) - new Date(d.getFullYear(), 0, 1)) / DAY_MS);
      const n = DISPATCH_PARADOXES.length, m = DISPATCH_QUERIES.length;
      const pi = doy % n;
      const bucket = Math.floor(doy / n);
      const qi = (pi + 29 * bucket) % m;
      return { key: key, doy: doy, P: DISPATCH_PARADOXES[pi], Q: DISPATCH_QUERIES[qi] };
    },
    claim() {
      if (this.claimed()) return;
      const y = new Date(); y.setDate(y.getDate() - 1);
      const yk = y.getFullYear() + '-' + P2(y.getMonth() + 1) + '-' + P2(y.getDate());
      SYS.dispatch.streak = (SYS.dispatch.lastClaim === yk) ? SYS.dispatch.streak + 1 : 1;
      SYS.dispatch.best = Math.max(SYS.dispatch.best || 0, SYS.dispatch.streak);
      SYS.dispatch.lastClaim = todayKey();
      SYS.dispatch.chrono = (SYS.dispatch.chrono || 0) + 1;
      SYS.dispatch.total = (SYS.dispatch.total || 0) + 1;
      SYS.energy = clamp(SYS.energy + 25, 0, 100);
      sysSave(); sfx('level'); celebrate(45);
      TeleLog.push('0600 DISPATCH LOGGED — CHRONO METRIC +1 · ENERGY +25 · DAY STREAK ' + SYS.dispatch.streak, 'gold');
      toast('<b>TRANSMISSION LOGGED</b><br>+1 Chrono Metric · +25 energy · streak ' + SYS.dispatch.streak + ' day' + (SYS.dispatch.streak === 1 ? '' : 's'), 'calendar', 3800);
      renderDispatch(); refreshHUD();
    },
    answer(i) {
      const parts = this.dayParts();
      if (!SYS.dispatch.pick || SYS.dispatch.pick.d !== parts.key) SYS.dispatch.pick = { d: parts.key, i: null };
      if (SYS.dispatch.pick.i != null) return;
      SYS.dispatch.pick.i = i; sysSave();
      sfx(parts.Q.a === i ? 'ok' : 'bad');
      renderDispatch();
    },
    nextDispatchMs() {
      const n = new Date(), t = new Date(n);
      t.setHours(6, 0, 0, 0);
      if (t <= n) t.setDate(t.getDate() + 1);
      return t - n;
    }
  };

  /* ========================= BYOK CLIENT (operator link) ========================= */
  const BYOKClient = {
    open() {
      const m = document.getElementById('byokModal'); if (!m) return;
      m.hidden = false;
      document.body.classList.add('modal-open');
      const u = document.getElementById('byokUrl'), k = document.getElementById('byokKey'), mo = document.getElementById('byokModel');
      if (u) u.value = SYS.byok.url || '';
      if (k) k.value = SYS.byok.key || '';
      if (mo) mo.value = SYS.byok.model || '';
      this.result('');
      const dot = document.getElementById('byokStatus');
      if (dot) dot.className = 'byok-dot' + (SYS.byok.url && SYS.byok.model ? ' linked' : '');
      const eye = document.getElementById('byokEye');
      if (eye && k) eye.textContent = k.type === 'text' ? 'HIDE' : 'SHOW';
      sfx('click');
      setTimeout(() => { if (u) u.focus(); }, 40);
    },
    close() {
      const m = document.getElementById('byokModal'); if (!m) return;
      m.hidden = true;
      document.body.classList.remove('modal-open');
    },
    save() {
      const u = document.getElementById('byokUrl'), k = document.getElementById('byokKey'), mo = document.getElementById('byokModel');
      SYS.byok.url = ((u && u.value) || '').trim();
      SYS.byok.key = ((k && k.value) || '').trim();
      SYS.byok.model = ((mo && mo.value) || '').trim();
      sysSave(); sfx('ok');
      const dot = document.getElementById('byokStatus');
      if (dot) dot.className = 'byok-dot' + (SYS.byok.url && SYS.byok.model ? ' linked' : '');
      this.result('<b>LINK SAVED</b> — endpoint: ' + esc(SYS.byok.url || '(none)') + ' · model: ' + esc(SYS.byok.model || '(none)') +
        '<br><span class="small">Stored only in this device’s localStorage. Nothing is transmitted outside a Test Connection or your own future queries.</span>', true);
      toast('Operator link configuration saved to this device.', 'gear', 2600);
    },
    result(html, ok) {
      const r = document.getElementById('byokResult'); if (!r) return;
      if (!html) { r.hidden = true; r.innerHTML = ''; return; }
      r.hidden = false;
      r.className = 'byok-result ' + (ok ? 'ok' : 'err');
      r.innerHTML = html;
    },
    busy(on) {
      const b = document.getElementById('byokTest'); if (!b) return;
      b.disabled = !!on;
      b.innerHTML = on ? 'PINGING…' : 'TEST CONNECTION';
    },
    test() {
      const u = document.getElementById('byokUrl'), k = document.getElementById('byokKey'), mo = document.getElementById('byokModel');
      const url = ((u && u.value) || '').trim().replace(/\/+$/, '');
      const key = ((k && k.value) || '').trim();
      const model = ((mo && mo.value) || '').trim();
      if (!url || !model) {
        this.result('<b>MISSING FIELDS</b> — a base URL and a model name are required before testing.');
        sfx('bad'); return;
      }
      this.busy(true);
      this.result('<b>PINGING</b> ' + esc(url + '/chat/completions') + ' with a 1-token prompt…');
      const ctrl = new AbortController();
      const to = setTimeout(() => ctrl.abort(), 9000);
      const t0 = Date.now();
      const self = this;
      fetch(url + '/chat/completions', {
        method: 'POST',
        signal: ctrl.signal,
        headers: Object.assign({ 'Content-Type': 'application/json' }, key ? { 'Authorization': 'Bearer ' + key } : {}),
        body: JSON.stringify({ model: model, messages: [{ role: 'user', content: 'ping' }], max_tokens: 1, stream: false })
      }).then(res => {
        clearTimeout(to);
        const dt = Date.now() - t0;
        if (res.ok) {
          const finish = (m2) => {
            self.result('<b>✅ CONNECTION VERIFIED</b> [Model: ' + esc(m2) + '] · HTTP ' + res.status + ' · ' + dt + ' ms', true);
            toast('✅ CONNECTION VERIFIED [Model: ' + esc(m2) + ']', 'check', 3200);
            sfx('badge');
          };
          res.json().then(j => { finish((j && j.model) ? j.model : model); })
            .catch(() => finish(model));
        } else {
          res.text().then(tx => {
            self.result('<b>HTTP ' + res.status + ' ' + esc(res.statusText || 'ERROR') + '</b><br>' + esc(String(tx).slice(0, 240)));
            sfx('bad');
          }).catch(() => {
            self.result('<b>HTTP ' + res.status + ' ' + esc(res.statusText || 'ERROR') + '</b>');
            sfx('bad');
          });
        }
      }).catch(err => {
        clearTimeout(to);
        const msg = err && err.name === 'AbortError'
          ? 'TIMEOUT — the endpoint did not answer within 9 s'
          : ((err && err.message) || 'network failure');
        self.result('<b>LINK FAILED</b> — ' + esc(msg) +
          '<br><span class="small">Check the base URL and key, the provider’s CORS policy, and — for local Ollama — that OLLAMA_ORIGINS permits this page’s origin (file:// or localhost).</span>');
        sfx('bad');
      }).then(() => self.busy(false));
    }
  };

  /* ========================= SCREEN BUILDERS ========================= */
  function buildProbesScreen() {
    return '<section id="probes" class="screen noprintsec" aria-labelledby="h-pb">' +
      '<div class="sec-head">' +
      '<span class="sec-ic" data-sprite="radar" data-px="36"></span>' +
      '<span><p class="sec-kick">EXPEDITION CONSOLE · PASSIVE UPLINK</p><h2 class="sec-title" id="h-pb">PROBE TELEMETRY BAY</h2>' +
      '<p class="sec-sub">Long-range expeditions run on real timestamps — background the tab, close it, come back</p></span></div>' +

      '<div class="pb-stats">' +
      '<div class="pb-stat"><span data-sprite="bolt" data-px="20" data-tint="#ffd166"></span><span><b id="pbEnergy">—</b><span class="pl">ENERGY · SPENT ON LAUNCHES</span></span></div>' +
      '<div class="pb-stat"><span data-sprite="radar" data-px="20"></span><span><b id="pbActive">—</b><span class="pl">PROBES IN FLIGHT</span></span></div>' +
      '<div class="pb-stat"><span data-sprite="bag" data-px="20"></span><span><b id="pbCache">—</b><span class="pl">DATA CACHE ITEMS</span></span></div>' +
      '<div class="pb-stat"><span data-sprite="hour" data-px="20"></span><span><b id="pbChrono">—</b><span class="pl">CHRONO METRICS</span></span></div>' +
      '</div>' +

      '<div class="radar-container">' +
      '<canvas id="telemetryCanvas" role="img" aria-label="Radar sweep with active probe pings and a signal acquisition oscilloscope"></canvas>' +
      '</div>' +

      '<div class="grid3" id="probeTiers" style="margin-top:16px"></div>' +

      '<div class="panel" style="margin-top:16px">' +
      '<h3 class="panel-kick" style="color:var(--teal)">LIVE TELEMETRY CONSOLE</h3>' +
      '<div class="tele-console"><div class="tele-scroll" id="teleLog" aria-live="off"></div><div class="tele-cursor"></div></div>' +
      '</div>' +

      '<div class="panel" style="margin-top:16px">' +
      '<h3 class="panel-kick" style="color:var(--gold)">DATA CACHE</h3>' +
      '<p class="small" style="margin:6px 0 0">Encrypted artifacts recovered by probes, sector clears and aced evaluations. Consumables can be spent for energy.</p>' +
      '<div class="inv-grid" id="invGrid"></div>' +
      '</div>' +

      '<div class="panel" style="margin-top:16px">' +
      '<h3 class="panel-kick" style="color:var(--cyan)">SIGNAL RETENTION · NODE INTEGRITY</h3>' +
      '<p class="small" style="margin:6px 0 0">Knowledge decays on an Ebbinghaus curve — $R(t) = e^{-\\Delta t / S}$, with S the sector’s stability in days (1–30). Audit attenuated nodes with a fast 3-question recalibration to restore 100% and harden S.</p>' +
      '<div id="retainGrid" style="margin-top:10px"></div>' +
      '</div>' +
      '</section>';
  }

  function buildDispatchScreen() {
    return '<section id="dispatch" class="screen noprintsec" aria-labelledby="h-dp">' +
      '<div class="sec-head">' +
      '<span class="sec-ic" data-sprite="antenna" data-px="36"></span>' +
      '<span><p class="sec-kick">DAILY CALIBRATION RITUAL</p><h2 class="sec-title" id="h-dp">0600 DISPATCH</h2>' +
      '<p class="sec-sub">One deterministic transmission per calendar day — fully offline, always waiting at 06:00</p></span></div>' +

      '<div class="panel" id="dispatchHero"></div>' +
      '<div class="duo" style="margin-top:16px">' +
      '<div class="panel para-card" id="dispatchParadox"></div>' +
      '<div class="panel" id="dispatchQuery"></div>' +
      '</div>' +
      '<div class="panel" style="margin-top:16px" id="dispatchClaim"></div>' +

      '<div class="panel" style="margin-top:16px">' +
      '<h3 class="panel-kick" style="color:var(--cyan)">THE OPERATOR LOOP</h3>' +
      '<p class="small" style="margin-top:8px">Claim the dispatch each morning for <b>+25 energy</b> and a <b>+1 Chrono Metric</b>. Energy funds Telemetry Bay expeditions; Energy Recovery Shards refund more mid-run. Answering with quiz streaks triggers <b>Telemetry Surges</b> that shave real minutes off active probes. Pair the ritual with the <b>Active Recall Deck</b> (Neural Matrix) and keep every sector node above 80% integrity.</p>' +
      '<div class="toolrow" style="margin-top:12px">' +
      '<button class="btn" data-go="probes"><span data-sprite="radar" data-px="16"></span> TELEMETRY BAY</button>' +
      '<button class="btn" data-go="flash"><span data-sprite="cards" data-px="16"></span> ACTIVE RECALL DECK</button>' +
      '</div></div>' +
      '</section>';
  }

  /* ========================= RENDERERS ========================= */
  function renderProbes() {
    const root = document.getElementById('probes');
    if (!root) return;
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    set('pbEnergy', SYS.energy + '/100');
    set('pbActive', ProbeManager.active().length + '/3');
    set('pbCache', Object.keys(SYS.inventory).reduce((a, k) => a + SYS.inventory[k], 0));
    set('pbChrono', SYS.dispatch.chrono || 0);

    const host = document.getElementById('probeTiers');
    if (host) {
      host.innerHTML = Object.keys(TIERS).map(tk => {
        const T = TIERS[tk];
        const act = ProbeManager.find(tk);
        const done = SYS.probes.find(p => p.tier === tk && p.done);
        let body;
        if (done) {
          body = '<div class="probe-timer done">SIGNAL ACQUIRED</div>' +
            '<button class="btn primary pb-collect" data-tier="' + tk + '"><span data-sprite="bag" data-px="14"></span> COLLECT PAYLOAD</button>';
        } else if (act) {
          const rem = ProbeManager.remaining(act);
          const prog = clamp(Math.round((act.duration - rem) / act.duration * 100), 0, 100);
          body = '<div class="probe-timer" id="tp-' + tk + '">' + ProbeManager.fmtClock(rem) + '</div>' +
            '<div class="bar teal slim"><i id="tbp-' + tk + '" style="width:' + prog + '%"></i></div>' +
            '<p class="small pc-status">' + act.id + ' IN FLIGHT' + (act.surgeMs ? ' · SURGED −' + Math.round(act.surgeMs / 60e3) + 'm' : '') + '</p>';
        } else {
          const can = SYS.energy >= T.cost;
          body = '<div class="probe-timer idle">STANDBY</div>' +
            '<button class="btn primary pb-launch' + (can ? '' : ' off') + '" data-tier="' + tk + '"' + (can ? '' : ' disabled') + '>' +
            '<span data-sprite="' + T.icon + '" data-px="14"></span> LAUNCH · ' + T.cost + ' ⚡</button>';
        }
        return '<div class="probe-card">' +
          '<div class="pc-head"><span data-sprite="' + T.icon + '" data-px="22"></span><b class="pc-name">' + T.name + '</b></div>' +
          '<span class="pc-tag">' + T.tag + ' · ' + ProbeManager.fmt(T.dur) + '</span>' +
          '<p class="small" style="margin:0">' + T.desc + '</p>' +
          '<div class="pc-loot">' + LOOT[tk].map(l => '<span class="loot-chip' + (l.kind === 'rare' ? ' rare' : '') + '">' + esc(l.name) + '</span>').join('') + '</div>' +
          body + '</div>';
      }).join('');
    }

    const inv = document.getElementById('invGrid');
    if (inv) {
      const ids = Object.keys(SYS.inventory).filter(k => SYS.inventory[k] > 0);
      inv.innerHTML = ids.length ? ids.map(k => {
        const it = ALL_LOOT[k]; if (!it) return '';
        const tint = it.kind === 'rare' ? '#ffd166' : it.kind === 'usable' ? '#54e38a' : '#8f9bd4';
        return '<div class="inv-item' + (it.kind === 'rare' ? ' rare' : '') + '">' +
          '<span data-sprite="' + it.icon + '" data-px="24" data-tint="' + tint + '"></span>' +
          '<span class="inv-tx"><b>' + esc(it.name) + '</b><span class="small">' +
          (it.kind === 'usable' ? 'USABLE · +' + it.give + ' ENERGY' : it.kind === 'rare' ? 'RARE ARTIFACT' : 'MATERIAL') + '</span></span>' +
          '<span class="inv-cnt">×' + SYS.inventory[k] + '</span>' +
          (it.kind === 'usable' ? '<button class="btn pb-use" data-item="' + k + '">USE</button>' : '') +
          '</div>';
      }).join('') : '<p class="small" style="margin:0">Cache is empty. Launch probes, clear sectors, or ace evaluations to recover encrypted artifacts.</p>';
    }

    drawSprites(root);
    refreshDecayUI();
  }

  function paintTimers() {                          // 1 Hz, no DOM rebuilds
    Object.keys(TIERS).forEach(tk => {
      const act = ProbeManager.find(tk);
      const tEl = document.getElementById('tp-' + tk);
      if (act && tEl) {
        const rem = ProbeManager.remaining(act);
        tEl.textContent = ProbeManager.fmtClock(rem);
        const bar = document.getElementById('tbp-' + tk);
        if (bar) bar.style.width = clamp(Math.round((act.duration - rem) / act.duration * 100), 0, 100) + '%';
      }
    });
    const nx = document.getElementById('dpNext');
    if (nx) nx.textContent = ProbeManager.fmtClock(DispatchManager.nextDispatchMs());
  }

  function refreshDecayUI() {
    const secs = (typeof SECTORS !== 'undefined') ? SECTORS : [];
    secs.forEach(s => {
      const R = DecayEngine.retention(s.id);
      const st = DecayEngine.statusOf(R);
      const chip = document.querySelector('.sec-status[data-audit="' + s.id + '"]');
      if (chip) {
        chip.className = 'sec-status nstat ' + st;
        chip.innerHTML = R == null
          ? 'NODE INTEGRITY: NO BASELINE'
          : 'NODE INTEGRITY ' + Math.round(R) + '% · ' + DecayEngine.statusWord(st);
        chip.title = 'Node Integrity — ' + DecayEngine.statusWord(st) + '. Click for a Targeted Audit.';
      }
      const dot = document.getElementById('nd-' + s.id);
      if (dot) dot.className = 'ndot ' + st;
    });
    const host = document.getElementById('retainGrid');
    if (host) {
      host.innerHTML = secs.map(s => {
        const R = DecayEngine.retention(s.id);
        const st = DecayEngine.statusOf(R);
        const rv = R == null ? null : Math.round(R);
        const label = (typeof NAVMAP !== 'undefined' && NAVMAP[s.id]) ? NAVMAP[s.id].label + ' — ' + s.label : s.label;
        let act;
        if (st === 'attenuated' || st === 'degraded') act = '<button class="btn ret-audit" data-audit="' + s.id + '">AUDIT</button>';
        else if (st === 'optimal') act = '<span class="small ret-ok">STABLE</span>';
        else act = '<span class="small ret-na">CLEAR THE SECTOR FIRST</span>';
        return '<div class="ret-row ' + st + '" id="ret-' + s.id + '">' +
          '<span class="rl">' + esc(label) + '</span>' +
          '<span class="bar slim' + (st === 'degraded' ? ' pink' : st === 'attenuated' ? ' gold' : '') + '"><i style="width:' + (rv == null ? 0 : rv) + '%"></i></span>' +
          '<span class="rv">' + (rv == null ? '—' : rv + '%') + '</span>' +
          '<span class="nstat ' + st + '">' + DecayEngine.statusWord(st) + '</span>' +
          act + '</div>';
      }).join('') +
      '<p class="small" style="margin:8px 0 0">AUDIT RECORD: ' + SYS.audits.passes + ' PASSED / ' + SYS.audits.tries + ' ATTEMPTS · every pass restores 100% and increments stability S (cap 30 days).</p>';
      drawSprites(host);
    }
  }

  function renderDispatch() {
    if (!document.getElementById('dispatch')) return;
    const parts = DispatchManager.dayParts();
    if (!parts.P || !parts.Q) return;
    const claimed = DispatchManager.claimed();
    const lv = (typeof levelOf === 'function') ? levelOf(S.xp) : 0;
    const role = lv >= 6 ? 'SYSTEMS LEAD' : lv >= 3 ? 'ANALYST' : 'OPERATOR';
    const dstr = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    document.getElementById('dispatchHero').innerHTML =
      '<div class="dh-top">' +
      '<span class="dispatch-greet">MORNING TRANSMISSION · OPERATOR // CLEARANCE: ' + role + '</span>' +
      '<span class="dispatch-date">' + esc(dstr) + '</span></div>' +
      '<div class="dmet">' +
      '<span class="chip">DAY STREAK <b class="c2">' + SYS.dispatch.streak + '</b></span>' +
      '<span class="chip">BEST <b class="c2">' + (SYS.dispatch.best || 0) + '</b></span>' +
      '<span class="chip">CHRONO METRICS <b class="c3">' + (SYS.dispatch.chrono || 0) + '</b></span>' +
      '<span class="chip">ENERGY <b class="c1">' + SYS.energy + '/100</b></span>' +
      '</div>';

    document.getElementById('dispatchParadox').innerHTML =
      '<h3 class="panel-kick" style="color:var(--vio)">PARADOX / INCIDENT OF THE DAY</h3>' +
      '<h4 class="para-title">' + esc(parts.P.t) + '</h4>' +
      '<div class="md-body">' + mdInline(parts.P.b) + '</div>' +
      '<p class="small" style="margin-top:10px">DISPATCH #' + (parts.doy + 1) + ' OF 365 · DETERMINISTIC SEED ' + hashStr(parts.key).toString(16).toUpperCase() + '</p>';

    const Q = parts.Q;
    const pick = (SYS.dispatch.pick && SYS.dispatch.pick.d === parts.key) ? SYS.dispatch.pick.i : null;
    let qh = '<h3 class="panel-kick" style="color:var(--cyan)">CALIBRATION QUERY</h3>' +
      '<p class="qtext">' + mdInline(Q.q) + '</p><div class="opts">';
    Q.o.forEach((o, i) => {
      const on = pick != null;
      const good = on && i === Q.a, bad = on && i === pick && i !== Q.a;
      qh += '<button class="opt dq-opt' + (good ? ' good' : '') + (bad ? ' bad' : '') + '" data-i="' + i + '"' + (on ? ' disabled' : '') + '>' +
        '<span class="opt-key">' + String.fromCharCode(65 + i) + '</span><span>' + mdInline(o) + '</span></button>';
    });
    qh += '</div>';
    if (pick != null) {
      qh += '<div class="qfb ' + (pick === Q.a ? 'ok' : 'no') + '"><span class="fbic" data-sprite="' + (pick === Q.a ? 'check' : 'cross') + '" data-px="18" data-tint="' + (pick === Q.a ? '#54e38a' : '#ff6b7d') + '"></span>' +
        '<div><b>' + (pick === Q.a ? 'CALIBRATED' : 'DRIFT DETECTED') + '</b><br>' + mdInline(Q.w) + '</div></div>';
    } else {
      qh += '<p class="small">Answer to calibrate the analyst baseline — the claim below works either way.</p>';
    }
    document.getElementById('dispatchQuery').innerHTML = qh;

    document.getElementById('dispatchClaim').innerHTML = claimed
      ? '<h3 class="panel-kick" style="color:var(--teal)">TRANSMISSION LOGGED</h3>' +
        '<p class="small">Today’s dispatch is archived. Next transmission arrives in <b id="dpNext">—</b> · claim it to keep the day streak alive.</p>'
      : '<h3 class="panel-kick" style="color:var(--gold)">CLAIM TRANSMISSION</h3>' +
        '<p class="small">Awards <b>+1 Chrono Metric</b>, <b>+25 energy</b>, and maintains the daily study streak. Energy is spent launching Telemetry Bay probes.</p>' +
        '<div style="margin-top:10px"><button class="btn primary" id="claimBtn"><span class="tri"></span>LOG TODAY’S TRANSMISSION</button></div>';

    typeset(document.getElementById('dispatch'));
    paintTimers();
  }

  function refreshHUD() {
    const e = document.getElementById('energyN');
    if (e) e.textContent = SYS.energy;
    const h = document.getElementById('hudEnergy');
    if (h) h.title = 'Energy ' + SYS.energy + '/100 — spent to launch probes';
  }

  /* ========================= FLAVOR TICKER ========================= */
  function flavorLine(p) {
    const f = (1.4 + Math.random() * 17).toFixed(1);
    const i = 85 + Math.floor(Math.random() * 15);
    const s = (6 + Math.random() * 30).toFixed(1);
    const k = 2 + Math.floor(Math.random() * 900);
    const tpl = [
      p.id + ' // FREQUENCY LOCK AT ' + f + ' GHz ... INTEGRITY ' + i + '%',
      p.id + ' // PHASE ARRAY SYNC ' + (90 + Math.floor(Math.random() * 10)) + '% ... DRIFT ' + (Math.random() * 4).toFixed(1) + ' ms',
      p.id + ' // PACKET BURST ' + k + ' KB ... CRC OK',
      p.id + ' // DEEP FIELD SNR ' + s + ' dB ... LOCK NOMINAL',
      p.id + ' // HOP LATENCY ' + (120 + Math.floor(Math.random() * 800)) + ' ms ... ROUTE STABLE'
    ];
    return '<b>' + tpl[Math.floor(Math.random() * tpl.length)] + '</b>';
  }

  /* ========================= GLOBAL 1 Hz TICKER ========================= */
  let tickN = 0;
  function globalTick() {
    tickN++;
    ProbeManager.tick();
    if (tickN % 60 === 0) refreshDecayUI();
    const act = ProbeManager.active();
    if (act.length && Math.random() < 0.12) {
      TeleLog.push(flavorLine(act[Math.floor(Math.random() * act.length)]));
    }
  }

  /* ========================= EVENT WIRING ========================= */
  function bindModalAudit() {
    const mb = document.getElementById('modalBody');
    if (!mb) return;
    mb.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.classList.contains('ta-opt') && AUDIT) {
        const opts = AUDIT.map[AUDIT.i];
        if (AUDIT.picked[AUDIT.i] != null) return;
        AUDIT.picked[AUDIT.i] = +b.dataset.i;
        if (opts[AUDIT.picked[AUDIT.i]].ok) { AUDIT.score++; sfx('ok'); } else sfx('bad');
        renderAudit();
      } else if (b.id === 'taNext' && AUDIT) {
        AUDIT.i++; sfx('click'); renderAudit();
      }
    });
  }

  function bindBYOK() {
    const btn = document.getElementById('byokBtn');
    if (btn) btn.addEventListener('click', () => BYOKClient.open());
    const closeBtn = document.getElementById('byokClose');
    if (closeBtn) closeBtn.addEventListener('click', () => BYOKClient.close());
    const m = document.getElementById('byokModal');
    if (m) m.addEventListener('click', e => { if (e.target === m) BYOKClient.close(); });
    $$('#byokModal .prov-chip').forEach(ch => {
      ch.addEventListener('click', () => {
        const u = document.getElementById('byokUrl'); if (!u) return;
        u.value = ch.dataset.url;
        sfx('click');
        toast('Base URL preset: ' + esc(ch.textContent.trim()), 'gear', 1800);
      });
    });
    const eye = document.getElementById('byokEye');
    if (eye) eye.addEventListener('click', () => {
      const k = document.getElementById('byokKey'); if (!k) return;
      const show = k.type === 'password';
      k.type = show ? 'text' : 'password';
      eye.textContent = show ? 'HIDE' : 'SHOW';
      sfx('click');
    });
    const sv = document.getElementById('byokSave');
    if (sv) sv.addEventListener('click', () => BYOKClient.save());
    const tst = document.getElementById('byokTest');
    if (tst) tst.addEventListener('click', () => BYOKClient.test());
  }

  function bindSystems() {
    const probes = document.getElementById('probes');
    if (probes) probes.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.classList.contains('pb-launch')) ProbeManager.launch(b.dataset.tier);
      else if (b.classList.contains('pb-collect')) ProbeManager.collect(b.dataset.tier);
      else if (b.classList.contains('pb-use')) ProbeManager.useItem(b.dataset.item);
      else if (b.classList.contains('ret-audit')) openAudit(b.dataset.audit);
    });
    const mount = document.getElementById('mount');
    if (mount) mount.addEventListener('click', e => {
      const c = e.target.closest('.sec-status[data-audit]');
      if (c) openAudit(c.dataset.audit);
    });
    const dp = document.getElementById('dispatch');
    if (dp) dp.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.id === 'claimBtn') DispatchManager.claim();
      else if (b.classList.contains('dq-opt')) DispatchManager.answer(+b.dataset.i);
    });
    bindModalAudit();
    bindBYOK();
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) TelemetryRadar.suspend();
      else if (TelemetryRadar.screenLive) TelemetryRadar.resume();
    });
  }

  /* ========================= INIT (called by engine.js boot) ========================= */
  function init() {
    /* 1 — build the two new screens into the dynamic mount */
    const mount = document.getElementById('mount');
    if (mount) {
      const wrap = document.createElement('div');
      wrap.innerHTML = buildProbesScreen() + buildDispatchScreen();
      while (wrap.firstChild) mount.appendChild(wrap.firstChild);
    }
    /* 2 — inject Node Integrity chips into sector heads + dots on the home map */
    if (typeof SECTORS !== 'undefined') {
      SECTORS.forEach(s => {
        const head = document.querySelector('#' + s.id + ' .sec-head');
        if (head) head.insertAdjacentHTML('beforeend',
          '<button class="sec-status nstat baseline" data-audit="' + s.id + '" title="Node Integrity — open Targeted Audit">NODE INTEGRITY: NO BASELINE</button>');
        const mm = document.getElementById('mm-' + s.id);
        if (mm) mm.insertAdjacentHTML('afterend', '<span class="ndot baseline" id="nd-' + s.id + '"></span>');
      });
    }
    /* 3 — subsystem bring-up */
    TeleLog.boot();
    TelemetryRadar.init();
    renderProbes();
    renderDispatch();
    refreshHUD();
    bindSystems();
    ProbeManager.tick();                       // sweep completions that happened while closed
    setInterval(globalTick, 1000);
  }

  /* ========================= PUBLIC API (engine.js hooks) ========================= */
  window.SystemsEngine = {
    init: init,
    onScreen: function (id) {
      TelemetryRadar.setVisible(id === 'probes');
      if (id === 'probes') renderProbes();
      if (id === 'dispatch') renderDispatch();
    },
    onCorrectAnswer: function (qid) {                    // called AFTER S.streak++
      const st = (typeof S !== 'undefined') ? S.streak : 0;
      if (st === 3 || (st > 0 && st % 5 === 0)) ProbeManager.triggerSurge();
      if (qid && qid !== 'exam') DecayEngine.pulseNode(qid);
    },
    onQuizFinish: function (qid, pct) {
      if (qid && qid !== 'exam') DecayEngine.markAudited(qid);
      if (pct >= 80) ProbeManager.maybeDrop('ace');
    },
    onSectorComplete: function (secId) {
      DecayEngine.markAudited(secId);
      ProbeManager.maybeDrop('sector');
    },
    surge: function () { ProbeManager.triggerSurge(); },
    hardReset: function () { try { localStorage.removeItem(SYSKEY); } catch (e) {} },
    openBYOK: function () { BYOKClient.open(); },
    closeBYOK: function () { BYOKClient.close(); },
    TelemetryRadar: TelemetryRadar,
    ProbeManager: ProbeManager,
    DecayEngine: DecayEngine,
    DispatchManager: DispatchManager,
    BYOKClient: BYOKClient
  };

})();
