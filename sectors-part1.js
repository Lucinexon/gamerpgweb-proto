/* ==========================================================================
   THE POLYMATH CODEX — data/sectors-part1.js
   SECTORS_PART1 : Sector 01 Internet Lore · Sector 02 Gaming Folklore ·
                   Sector 03 AI & Neural Mind
   Content ingested from Curriculum_part2.md (Modules 1–3).
   NOTE: md bodies use String.raw so TeX backslashes survive; fenced code
   uses ~~~ (tilde fences) because template literals cannot contain backticks.
   ========================================================================== */
'use strict';
window.SECTORS_PART1 = [

/* ================= SECTOR 01 : INTERNET LORE ================= */
{
  id: 'sec1', num: '01', icon: 'net', label: 'Internet Lore',
  kick: 'SECTOR 01 · TRANSMISSION', title: 'Internet Lore & Digital Mysteries',
  sub: 'Subsea trenches, runic ciphers and hive-mind forensics',
  intro: String.raw`The Internet is **not a cloud**. It is a wet, physical trench on the ocean floor — plus a stack of trust agreements written in the 1980s holding together billions of dollars of global capital. This sector descends the full abstraction stack from glass fibers to BGP route wars, then surfaces the strangest artifacts the network ever produced: Cicada 3301, weaponized crowdsourced OSINT, and the four-era evolution of memes.`,
  blocks: [
    {
      id: 's1-1', title: 'The Layer Cake of Digital Abstraction', tags: ['BGP', 'SUBSEA', 'KERNEL'],
      md: String.raw`
When an anonymous user in Frankfurt transmits a packet to a database in Ashburn, Virginia, that packet does not float through ether. It is converted from electrons into **infrared photons** pulsed through a glass tube no thicker than a human hair, resting inside a transatlantic subsea cable alongside blind, abyssal fauna. The whole planetary machine is an unfathomably precarious mechanical contraption — vulnerable at any moment to an anchor drag, an errant configuration line, or undersea seismic shifts.

<div class="flow">
  <div class="fstep"><span class="fwho">L7 · WEB</span><span class="fdoc">HTTP/3 · QUIC</span><span class="fsm">DNS, WebSockets, P2P overlays</span></div>
  <div class="farrow"><span class="flab">over</span></div>
  <div class="fstep"><span class="fwho">L6 · TRANSPORT</span><span class="fdoc">TCP / UDP</span><span class="fsm">Sliding windows, SYN/ACK</span></div>
  <div class="farrow"><span class="flab">over</span></div>
  <div class="fstep"><span class="fwho">L5 · ROUTING</span><span class="fdoc">IP · BGP-4</span><span class="fsm">AS-Path, autonomous systems</span></div>
  <div class="farrow"><span class="flab">over</span></div>
  <div class="fstep"><span class="fwho">L4 · KERNEL</span><span class="fdoc">RING 0</span><span class="fsm">Syscalls, epoll/kqueue, drivers</span></div>
  <div class="farrow"><span class="flab">over</span></div>
  <div class="fstep"><span class="fwho">L3 · ISA</span><span class="fdoc">x86-64 / ARM</span><span class="fsm">Out-of-order execution, ALU</span></div>
  <div class="farrow"><span class="flab">over</span></div>
  <div class="fstep"><span class="fwho">L2 · LOGIC</span><span class="fdoc">CMOS</span><span class="fsm">NAND/NOR gates, flip-flops</span></div>
  <div class="farrow"><span class="flab">over</span></div>
  <div class="fstep"><span class="fwho">L1 · PHYSICAL</span><span class="fdoc">FIBER</span><span class="fsm">EDFA, DWDM, total internal reflection</span></div>
</div>

#### The physical substrate
Subsea fiber-optic cables (MAREA, Dunant) rely on **Total Internal Reflection** inside high-purity fused silica cores, with a refractive index step between core and cladding:

<div class="fx-box">
$$n_1 \approx 1.444 \;(\text{core}) \quad > \quad n_2 \approx 1.440 \;(\text{cladding})$$
<div class="fx-cap">TIR traps the light inside the glass</div>
</div>

Attenuation is mitigated every 50–100 km by **Erbium-Doped Fiber Amplifiers** — 980/1480 nm pump lasers excite $\text{Er}^{3+}$ ions that stimulate photon emission at the **1550 nm** minimum-loss telecommunication window. **DWDM** (Dense Wavelength Division Multiplexing) then splits the light into up to **160 distinct optical wavelengths per fiber pair**, modulated via QAM to push link speeds beyond **200 Tbps per cable system**.

<div class="grid4">
  <div class="stat"><span class="stat-n c1">$1.444$</span><span class="stat-l">Core refractive index $n_1$ (TIR trap)</span></div>
  <div class="stat"><span class="stat-n c1">160</span><span class="stat-l">Optical wavelengths per fiber pair (DWDM)</span></div>
  <div class="stat"><span class="stat-n c3">200+ Tbps</span><span class="stat-l">Per-cable system throughput</span></div>
  <div class="stat"><span class="stat-n c3">1550 nm</span><span class="stat-l">Minimum-loss optical window</span></div>
</div>

#### The routing brain: BGP-4
The global routing table is governed by the **Border Gateway Protocol (BGP-4, RFC 4271)** — a path-vector protocol executing between Autonomous Systems run by Tier 1 transit providers, IXPs and edge CDNs. BGP uses **no performance metrics**: it computes paths via policy-configured <code>AS-Path</code> attributes, in strict priority order:

<div class="formula">WEIGHT → LOCAL-PREF → AS-PATH LENGTH → ORIGIN → MED → eBGP over iBGP</div>

#### The kernel event loop
At the host endpoint, frames trigger NIC interrupts, land in ring buffers via DMA, and climb the TCP/IP stack as <code>sk_buff</code> structures. User-space servers multiplex thousands of non-blocking sockets with $O(1)$ edge-triggered polling:

~~~c
/* POSIX non-blocking edge-triggered epoll event loop */
int epoll_fd = epoll_create1(0);
struct epoll_event ev, events[MAX_EVENTS];
ev.events = EPOLLIN | EPOLLET;  /* Edge-Triggered */
ev.data.fd = socket_fd;
epoll_ctl(epoll_fd, EPOLL_CTL_ADD, socket_fd, &ev);

while (running) {
    int nfds = epoll_wait(epoll_fd, events, MAX_EVENTS, -1);
    for (int n = 0; n < nfds; ++n) {
        handle_socket_io(events[n].data.fd);
    }
}
~~~

<aside class="co warn"><span class="co-tag"><span data-sprite="shield" data-px="12"></span>SYSTEM TRAP · BGP HIJACK</span>
<p>BGP inherently <b>trusts whatever an Autonomous System advertises</b> — it has no cryptographic origin authentication. In 2008, Pakistan Telecom tried to block YouTube domestically by announcing route <code>208.65.153.0/24</code>; upstream provider PCCW propagated it globally, and a <b>more-specific prefix</b> instantly blackholed YouTube worldwide for two hours. The web rests on social handshakes masquerading as mathematical protocols.</p></aside>

<aside class="co key"><span class="co-tag"><span data-sprite="star" data-px="12"></span>KEY INSIGHT</span>
<p>The recursive layer cake — from quantum transitions in optical fiber up to HTTP/3 multiplexing — is so abstracted that most developers treat the planetary telecom substrate as an infallible axiom. It is not: it is <b>anchors, contracts and 1980s trust models all the way down</b>.</p></aside>
`
    },
    {
      id: 's1-2', title: 'Cicada 3301 — The Recruitment Puzzle', tags: ['CRYPTO', 'OSINT', 'RUNES'],
      md: String.raw`
On **January 4, 2012**, an image posted to 4chan's <code>/x/</code> (Paranormal) and <code>/b/</code> (Random) boards presented simple white text on a black canvas: *"Hello. We are looking for highly intelligent individuals. To find them, we have devised a test…"* — signed with a stylized cicada watermark. What the internet assumed was an ARG morphed into the most sophisticated multi-layered cryptographic recruitment puzzle in history, demanding mastery of ancient linguistics, Victorian poetry, number theory, steganography and darknets.

<div class="flow">
  <div class="fstep"><span class="fwho">STEP 1</span><span class="fdoc">JPG + OUTGUESS</span><span class="fsm">LSB steganography in DCT coefficients</span></div>
  <div class="farrow"><span class="flab">yields</span></div>
  <div class="fstep"><span class="fwho">STEP 2</span><span class="fdoc">CAESAR SHIFT</span><span class="fsm">Cipher text → Reddit subreddit URL</span></div>
  <div class="farrow"><span class="flab">assembles</span></div>
  <div class="fstep"><span class="fwho">STEP 3</span><span class="fdoc">BOOK CODE</span><span class="fsm">Maya numerals + The Mabinogion &amp; King Arthur</span></div>
  <div class="farrow"><span class="flab">decrypts</span></div>
  <div class="fstep"><span class="fwho">STEP 4</span><span class="fdoc">AUDIO FILE</span><span class="fsm">Parrot voicemail → GPS coordinates</span></div>
  <div class="farrow"><span class="flab">across</span></div>
  <div class="fstep"><span class="fwho">STEP 5</span><span class="fdoc">5 CONTINENTS</span><span class="fsm">Physical posters: Paris, Warsaw, Seattle, Seoul, Sydney, Miami</span></div>
  <div class="farrow"><span class="flab">leads to</span></div>
  <div class="fstep"><span class="fwho">STEP 6</span><span class="fdoc">TOR .ONION</span><span class="fsm">First-come whitelist — "We want the best, not the followers"</span></div>
  <div class="farrow"><span class="flab">terminates</span></div>
  <div class="fstep"><span class="fwho">STEP 7</span><span class="fdoc">LIBER PRIMUS</span><span class="fsm">73-page runic manuscript — mostly uncracked to this day</span></div>
</div>

#### Cryptographic discipline
Every legitimate clue was signed with an **OpenPGP key** — community law: *"No PGP = No Cicada."*

<div class="grid4">
  <div class="stat"><span class="stat-n c4">7A35090F</span><span class="stat-l"><i class="pixelart-icons-font-key pi-gold"></i> The PGP key ID (fingerprint 524C 25E2 D77F 2460 …)</span></div>
  <div class="stat"><span class="stat-n c4">73</span><span class="stat-l">Pages in the Liber Primus</span></div>
  <div class="stat"><span class="stat-n c5">29</span><span class="stat-l">Characters in the unmapped Anglo-Saxon runic alphabet</span></div>
  <div class="stat"><span class="stat-n c5">2012–2014</span><span class="stat-l">Three puzzle iterations</span></div>
</div>

The initial JPEG hid payloads in the least significant bits of DCT coefficients via <code>OutGuess 0.2</code>; the extract command is burned into lore:

<div class="formula">outguess -k "key" -r image.jpg output.txt</div>

The 2014 runic wall enciphers a syncretic philosophical text — Gnosticism, Kierkegaardian existentialism, Western occultism — under a polyalphabetic substitution keyed against primes:

<div class="fx-box">
$$C_i = (P_i + K_i) \pmod{29}$$
<div class="fx-cap">Liber Primus cipher — running key K derived from prime sequences</div>
</div>

<aside class="co mem"><span class="co-tag"><span data-sprite="bulb" data-px="12"></span>MEMORY ANCHOR</span>
<p>Cicada 3301 was the <b>anti-meme</b>: in a culture engineered for hyper-visibility, it severed its own infrastructure the moment crowds cracked a clue. Rumored puppet masters range from NSA/GCHQ/Mossad recruitment pipelines to a neo-cyber-anarchist syndicate. None are confirmed — and <b>56+ pages of Liber Primus remain undeciphered</b>, a decade-long metaphysical mystery sustained in plain sight by public-key mathematics.</p></aside>
`
    },
    {
      id: 's1-3', title: 'Weaponized OSINT: HWNDU & the Silk Road', tags: ['OSINT', 'OPSEC', 'SIGINT'],
      md: String.raw`
Open-Source Intelligence turned the digital public into a weaponized hive-mind panopticon. Its two canonical case studies run in opposite directions — a crowd hunting a flag across 3.8 million square miles, and the state hunting a darknet kingpin through one careless forum post.

<div class="duo">
  <div class="lane c-cyan">
    <h4><i class="pixelart-icons-font-search"></i> HWNDU — CROWD HUNTS LOCATION (2017)</h4>
    <p>Shia LaBeouf moved his anti-Trump "He Will Not Divide Us" livestream to an undisclosed rural field: a camera aimed at a blank sky and a flag. Anonymous imageboards located it <b>within ~36 hours</b>:</p>
    <ul>
      <li><b>Contrail triangulation</b> — flight paths cross-referenced with FlightRadar24 ADS-B telemetry</li>
      <li><b>Celestial mechanics</b> — star altitudes mapped in Stellarium to fix the latitude</li>
      <li><b>Acoustic ranging</b> — a local driver honked his truck horn on cue while the stream timed the delay</li>
    </ul>
    <p>Intersection: <b>Greeneville, Tennessee</b>. A local operative replaced the flag with a MAGA hat.</p>
  </div>
  <div class="lane c-red">
    <h4><i class="pixelart-icons-font-lock pi-red"></i> SILK ROAD — STATE HUNTS DPR (2011–2013)</h4>
    <p>Ross Ulbricht ("Dread Pirate Roberts") hid behind Tor onion routing and Bitcoin — mathematically intact. The takedown was pure <b>human OpSec failure</b>:</p>
    <ul>
      <li><b>First-hop attribution</b> — a 2011 "altoid" forum post recruiting PHP devs listed <code>rossulbricht@gmail.com</code></li>
      <li><b>Timezone correlation</b> — admin actions aligned with Pacific Daylight Time</li>
      <li><b>Physical interception</b> — FBI agents staged a distraction at the Glen Park library and seized the open, unencrypted laptop mid-session</li>
    </ul>
  </div>
</div>

The OSINT vector math the HWNDU crowd effectively solved:

<div class="fx-box">
$$\vec{P}_{\text{camera}} = \left\{ (x,y) \;\middle|\; \angle(\text{Contrail}_i, \text{Horizon}) \equiv \text{Heading}(\text{Flight}_i) \pm \epsilon \right\}$$
<div class="fx-cap">Two intersecting commercial flight paths → an ellipse over eastern Tennessee</div>
</div>

And onion routing, the fortress Ulbricht believed in:

<div class="formula">CLIENT →(K₁) GUARD →(K₂) MIDDLE →(K₃) EXIT → DESTINATION</div>

<aside class="co key"><span class="co-tag"><span data-sprite="star" data-px="12"></span>KEY INSIGHT</span>
<p><b>Mathematics is unbreakable, but humans are predictably leaky state machines.</b> The same hive-mind that found a flag from contrails later geolocated ISIS training camps (forwarded for air strikes). The same Tor that protected dissidents collapsed from a single 2011 email address. Forensic OpSec doctrine: the smallest analog artifact defeats the strongest cryptographic fortification.</p></aside>
`
    },
    {
      id: 's1-4', title: 'The Evolution of Memes & Online Consciousness', tags: ['MEMETICS', 'BRAINROT'],
      md: String.raw`
Richard Dawkins coined <b>meme</b> in 1976 (<i>The Selfish Gene</i>) — a self-replicating cultural unit subject to mutation, selection and evolutionary pressure. Over three decades internet memes evolved from linear semantic jokes into a post-linguistic dialect. Click each era:

<div class="tiles">
  <button class="tile"><span class="t-front"><b>ERA 1 · 1990–2009</b><span class="t-hint">SEMANTIC LITERALISM</span><span class="t-hint">TAP TO DECRYPT</span></span><span class="t-back"><b>Era 1</b><span>Usenet ASCII, Godwin's Law, Habbo "Pool's Closed" (2006), Rage Comics. Setup → universally recognizable emotional payoff.</span></span></button>
  <button class="tile"><span class="t-front"><b>ERA 2 · 2010–2016</b><span class="t-hint">TEMPLATE IRONY</span><span class="t-hint">TAP TO DECRYPT</span></span><span class="t-back"><b>Era 2</b><span>Advice Animals, MLG montage parodies, early Tumblr. Top-text/bottom-text Impact font; humor via structural templating.</span></span></button>
  <button class="tile"><span class="t-front"><b>ERA 3 · 2016–2020</b><span class="t-hint">POST-IRONIC SURREALISM</span><span class="t-hint">TAP TO DECRYPT</span></span><span class="t-back"><b>Era 3</b><span>Deep-fried memes, the "E" (Farquaad × Markiplier × Zuckerberg), Wojak typologies. Humor from deliberate destruction of communicative coherence.</span></span></button>
  <button class="tile"><span class="t-front"><b>ERA 4 · 2020–NOW</b><span class="t-hint">ALGORITHMIC BRAINROT</span><span class="t-hint">TAP TO DECRYPT</span></span><span class="t-back"><b>Era 4</b><span>Skibidi Toilet, "Rizz", AI slop, 7-second audio loops. Memes as algorithmic feedback loops serving attention metrics, not communal solidarity.</span></span></button>
</div>

#### The deep-fry pipeline (Era 3 technical spec)
~~~text
1. Downscale image to 240 × 240 px (nearest-neighbor interpolation)
2. Unsharp mask: radius r = 50, amount = 500%
3. Oversaturate brightness/contrast; re-encode JPEG at quality < 5%
4. Multiply lens-flare layer centered over the eye sockets
~~~

#### The Dead Internet limit
As generative models saturate the web, the ratio of synthetic content to organic expression diverges:

<div class="fx-box">
$$\lim_{t \to \infty} \frac{\text{Synthetic Content} + \text{Bot Interactions}}{\text{Organic Human Expression}} \gg 1$$
<div class="fx-cap">Dead Internet Theory, formalized</div>
</div>

<aside class="co warn"><span class="co-tag"><span data-sprite="shield" data-px="12"></span>SYSTEM TRAP · MODEL COLLAPSE</span>
<p>Scrapers ingest AI-generated text to train subsequent LLMs. Recursive ingestion of low-entropy synthetic outputs decays the variance of the distribution — the model hallucinates repetitive gibberish. Human users reflexively mimicking short-form algorithmic phrasing ("brainrot") mirror the same failure mode in carbon.</p></aside>

<aside class="co mem"><span class="co-tag"><span data-sprite="bulb" data-px="12"></span>MEMORY ANCHOR</span>
<p>Where culture once evolved over decades through geographic diffusion, algorithmic optimization now cycles memes through <b>life, commodification, irony poisoning and cultural death within 72-hour windows</b>. The subject no longer speaks the language; the ecosystem speaks the subject.</p></aside>
`
    }
  ],
  quiz: {
    title: 'SECTOR 01 · EVALUATION', desc: 'Cables, ciphers, crowds and memes', icon: 'net', next: 'sec2', qs: [
      { q: 'The physical backbone of intercontinental internet traffic is best described as…', opts: ['A wireless mesh of satellites', 'Subsea fiber-optic cables using total internal reflection', 'Microwave relay towers', 'Underground copper coaxial trunks'], a: 1, why: 'Transatlantic packets become infrared photons in fused-silica cores (n₁ ≈ 1.444 > n₂ ≈ 1.440), amplified every 50–100 km by EDFAs.' },
      { q: 'Dense Wavelength Division Multiplexing can split a single fiber pair into how many optical wavelengths?', opts: ['Up to 16', 'Up to 64', 'Up to 160', 'Exactly 2'], a: 2, why: 'DWDM multiplexes up to 160 distinct wavelengths per fiber pair, enabling 200+ Tbps per cable system.' },
      { q: 'The 2008 global YouTube outage was caused by…', opts: ['A DDoS botnet', 'A BGP route hijack propagated by PCCW after Pakistan Telecom announced a more-specific prefix', 'A cut transatlantic cable', 'A DNS cache poisoning attack'], a: 1, why: 'Pakistan Telecom announced 208.65.153.0/24 to block YouTube domestically; the more-specific prefix won the route selection and blackholed YouTube worldwide for ~2 hours.' },
      { q: 'The OpenPGP key ID that authenticates every legitimate Cicada 3301 clue is…', opts: ['0xDEADBEEF', '7A35090F', '0xCAFEBABE', '33013370'], a: 1, badge: 'cicada', why: 'Fingerprint 524C 25E2 D77F 2460 … 7A35 090F. Community law: "No PGP = No Cicada." You have mastered the cryptography terminal.' },
      { q: 'The Liber Primus is written in…', opts: ['Base64-encoded ASCII', 'A 29-character unmapped Anglo-Saxon runic alphabet', 'Traditional Morse code', 'SHA-256 hashes'], a: 1, why: '73 pages, 29 runes; deciphered pages reveal a Gnostic/existentialist text while 56+ pages remain uncracked.' },
      { q: 'The HWNDU flag was geolocated primarily through…', opts: ['IP packet sniffing', 'Flight contrail triangulation + celestial mechanics + acoustic ranging', 'Satellite thermal imaging', 'A paid informant'], a: 1, why: 'Contrails were matched to FlightRadar24 ADS-B data, star positions fixed the latitude, and a volunteer honking horn confirmed Greeneville, Tennessee within ~36 hours.' },
      { q: 'The decisive operational failure that doomed the Silk Road was…', opts: ['A zero-day exploit against Tor', 'A break in SHA-256', 'An early forum post by "altoid" listing rossulbricht@gmail.com, plus an unencrypted open laptop', 'A bribed hosting administrator'], a: 2, why: 'Tor and Bitcoin math held; first-hop attribution and a live RAM extraction at the Glen Park library did not.' },
      { q: 'Model collapse in the synthetic-data loop occurs when…', opts: ['GPUs overheat during training', 'Models recursively ingest low-entropy synthetic outputs until output variance decays', 'Training data exceeds disk quota', 'RLHF reward models overfit'], a: 1, why: 'The distribution loses variance and the model drifts into repetitive gibberish — the Dead Internet feedback loop.' }
    ]
  }
},
/* ================= SECTOR 02 : GAMING FOLKLORE ================= */
{
  id: 'sec2', num: '02', icon: 'gamepad', label: 'Gaming Folklore',
  kick: 'SECTOR 02 · SIMULATION', title: 'Gaming Folklore, Engine Anomalies & Virtual Societies',
  sub: 'Ticks, overflows, pity systems and digital plagues',
  intro: String.raw`A game engine does not simulate reality — it runs a sustained, high-speed optical illusion across finite slices of time called **ticks**. When the math fails by even $0.000001$, reality unravels. This sector audits the machinery: netcode paradoxes, the Minecraft Far Lands overflow, Roblox's FilteringEnabled revolution, Hoyoverse's behavioral probability engines, and two virtual disasters that rewrote real-world science.`,
  blocks: [
    {
      id: 's2-1', title: 'The Game Loop & Netcode Reality', tags: ['NETCODE', 'GJK', 'TICKS'],
      md: String.raw`
In a physical world, space is continuous and time flows without interruption. Inside an engine, space is chopped into discrete floating-point numbers and time is quantized into rigid intervals. When you swing a sword in a multiplayer game, your client sends an **unauthenticated intent packet** to a remote server, which validates whether your math matches its math, calculates intersections across bounding boxes that exist milliseconds in the past, and returns an authoritative truth packet.

#### Delta time and the fixed timestep
Physics steps forward via numerical integration, multiplied by $\Delta t$ — the duration between frames — so gravity does not accelerate on 240 Hz monitors:

<div class="fx-box">
$$x_{t} = x_{t-1} + v \cdot \Delta t, \quad \Delta t = t_{\text{current}} - t_{\text{previous}}$$
<div class="fx-cap">Frame-rate independent motion</div>
</div>

~~~cpp
/* Fixed-timestep accumulator: 60 Hz physics regardless of render rate */
double t = 0.0;
const double dt = 1.0 / 60.0;
double currentTime = getCurrentTime();
double accumulator = 0.0;

while (!quit) {
    double newTime = getCurrentTime();
    double frameTime = newTime - currentTime;
    currentTime = newTime;
    accumulator += frameTime;

    while (accumulator >= dt) {
        integratePhysics(state, t, dt);
        accumulator -= dt;
        t += dt;
    }
    renderState(interpolate(previousState, state, accumulator / dt));
}
~~~

#### Collision: the GJK shortcut
Engines skip polygon-by-polygon meshes for simplified convex hulls (AABB / OBB). The Gilbert-Johnson-Keerthi test asks one elegant question — does the **Minkowski difference** of two shapes contain the origin?

<div class="fx-box">
$$A \ominus B = \{ \mathbf{a} - \mathbf{b} \mid \mathbf{a} \in A, \, \mathbf{b} \in B \}; \quad \text{Collision} \iff \mathbf{0} \in (A \ominus B)$$
<div class="fx-cap">One containment test replaces millions of triangle checks</div>
</div>

#### Client-server replication
<div class="duo">
  <div class="lane c-cyan">
    <h4><i class="pixelart-icons-font-zap"></i> CLIENT-SIDE PREDICTION</h4>
    <p>The client locally applies movement inputs <b>before</b> the server confirms them, eliminating perceptual input latency. Your screen shows a hopeful future that may be corrected.</p>
  </div>
  <div class="lane c-pur">
    <h4><i class="pixelart-icons-font-shield pi-pur"></i> SERVER RECONCILIATION</h4>
    <p>When the authoritative state packet arrives and disagrees with the client's historical log for that tick, the client snaps (or smooths) back to server truth. <b>Lag compensation</b> goes further: the server rewinds every bounding box to the historical instant you pressed fire, then runs the ray-box test.</p>
  </div>
</div>

<aside class="co warn"><span class="co-tag"><span data-sprite="shield" data-px="12"></span>SYSTEM TRAP · PEEKER'S ADVANTAGE</span>
<p>Because information cannot exceed the speed of light in fiber, a player rounding a corner <b>always sees the stationary opponent milliseconds before</b> the server relays the peeker's position. Online players never inhabit the same temporal reality — the math forces the paradox, and spawns decades of "I was already behind the wall!" griefing lore.</p></aside>
`
    },
    {
      id: 's2-2', title: 'Minecraft: Far Lands & 2b2t Forensics', tags: ['OVERFLOW', 'PRNG', '2B2T'],
      md: String.raw`
*Minecraft* sells the illusion of infinite idyllic wilderness — punch trees, build shelter, survive. Under the hood, Markus "Notch" Persson built it on the fragile arithmetic of the Java Virtual Machine. Push far enough from spawn and the pastoral illusion collapses into a colossal perforated stone wall stretching into the stratosphere: the legendary **Far Lands**, the boundary where coordinate space pushes mathematical precision past its breaking point.

<div class="flow">
  <div class="fstep"><span class="fwho">INPUT</span><span class="fdoc">SEED</span><span class="fsm">64-bit signed int → Java LCG</span></div>
  <div class="farrow"><span class="flab">drives</span></div>
  <div class="fstep"><span class="fwho">TERRAIN</span><span class="fdoc">PERLIN</span><span class="fsm">3D octave noise, coords scaled × 171.103</span></div>
  <div class="farrow"><span class="flab">exceeds</span></div>
  <div class="fstep"><span class="fwho">LIMIT</span><span class="fdoc">2³¹ − 1</span><span class="fsm">Max 32-bit signed integer: 2,147,483,647</span></div>
  <div class="farrow"><span class="flab">wraps to</span></div>
  <div class="fstep"><span class="fwho">OVERFLOW</span><span class="fdoc">NEGATIVE</span><span class="fsm">Two's complement → −2,147,483,648</span></div>
  <div class="farrow"><span class="flab">shatters</span></div>
  <div class="fstep"><span class="fwho">OUTPUT</span><span class="fdoc">FAR LANDS</span><span class="fsm">Spongy Swiss-cheese monolith at X/Z ≈ ±12,550,821</span></div>
</div>

<div class="grid4">
  <div class="stat"><span class="stat-n c1">±12,550,821</span><span class="stat-l"><i class="pixelart-icons-font-globe"></i> Far Lands boundary block coordinate (pre-Beta 1.8)</span></div>
  <div class="stat"><span class="stat-n c1">×171.103</span><span class="stat-l">Noise scaling constant that trips the overflow</span></div>
  <div class="stat"><span class="stat-n c3">2,147,483,647</span><span class="stat-l">2³¹ − 1, the 32-bit signed integer ceiling</span></div>
  <div class="stat"><span class="stat-n c3">1 : 7.5×10¹²</span><span class="stat-l">Odds of Dream's "legit" speedrun barter luck</span></div>
</div>

The terrain PRNG itself is a Linear Congruential Generator:

<div class="fx-box">
$$X_{n+1} = (aX_n + c) \bmod m, \quad a = 25214903917, \; c = 11, \; m = 2^{48}$$
<div class="fx-cap">java.util.Random — deterministic per world seed</div>
</div>

#### 2b2t: bedrock fingerprints
On the oldest anarchy server, players hid bases millions of blocks out — but the bedrock floor generation is a **deterministic PRNG keyed only off chunk coordinates and the world seed**:

~~~java
/* Minecraft bedrock floor generation routine */
Random rand = new Random(seed);
for (int x = 0; x < 16; ++x) {
    for (int z = 0; z < 16; ++z) {
        setBlock(x, 0, z, Blocks.BEDROCK);
        for (int y = 1; y < 5; ++y) {
            if (y < rand.nextInt(5)) {
                setBlock(x, y, z, Blocks.BEDROCK);
            }
        }
    }
}
~~~

Once the world seed leaked, any screenshot exposing bedrock became a **cryptographic fingerprint**. Tools like *TerrainFinder* brute-forced billions of chunk patterns against the pixels and derived the exact (X, Z) within minutes — destroying bases that had stood hidden for years.

<div class="tiles">
  <button class="tile"><span class="t-front"><b>HEROBRINE</b><span class="t-hint">GHOST IN THE MACHINE</span><span class="t-hint">TAP TO DECRYPT</span></span><span class="t-back"><b>Herobrine</b><span>Born in a 2010 4chan thread: an untextured white-eyed figure stalking single-player fog. Mojang kept "Removed Herobrine" in release notes for years.</span></span></button>
  <button class="tile"><span class="t-front"><b>FAR LANDS OR BUST</b><span class="t-hint">PILGRIMAGE</span><span class="t-hint">TAP TO DECRYPT</span></span><span class="t-back"><b>KurtJMac</b><span>Walked toward the Far Lands for over a decade, raising hundreds of thousands of dollars for charity — an engine defect turned mythic pilgrimage.</span></span></button>
  <button class="tile"><span class="t-front"><b>DREAM RNG CRISIS</b><span class="t-hint">2020 FORENSICS</span><span class="t-hint">TAP TO DECRYPT</span></span><span class="t-back"><b>1 in 7.5 trillion</b><span>Statisticians exposed modified game-jar drop rates (ender pearl barters 20/423, blaze rods 211/423) — peer-reviewed math replaced casual gaming disputes.</span></span></button>
  <button class="tile"><span class="t-front"><b>BETA 1.8</b><span class="t-hint">THE PATCH</span><span class="t-hint">TAP TO DECRYPT</span></span><span class="t-back"><b>Fix or murder?</b><span>The update that tamed the noise scaling and "fixed" the Far Lands — retroactively making the wall a historical landmark.</span></span></button>
</div>
`
    },
    {
      id: 's2-3', title: 'Roblox: The FilteringEnabled Revolution', tags: ['LUAU', 'FE', 'DEVEX'],
      md: String.raw`
*Roblox* began not as a game but as **Interactive Physics**, an educational mechanics simulator by David Baszucki and Erik Cassel. Two decades later it is a globe-spanning metaverse economy built by self-taught teenage programmers — and the permanent battlefield of an architectural war between client exploitation and server authority.

<div class="duo">
  <div class="lane c-red">
    <h4><i class="pixelart-icons-font-x pi-red"></i> PRE-2018 · NO FILTERING</h4>
    <p><code>Workspace.FilteringEnabled = false</code>. A Cheat Engine memory edit on the client was <b>serialized and replicated to every player</b> via the trust-based network layer. Script-kiddies wiped servers, spawned offensive models and hijacked cameras at will.</p>
  </div>
  <div class="lane c-teal">
    <h4><i class="pixelart-icons-font-check pi-teal"></i> POST-2018 · FE MANDATORY</h4>
    <p>Client mutations now stay stranded in local memory ("ghost mode"). Crossing the boundary requires explicit <code>RemoteEvent</code> / <code>RemoteFunction</code> abstractions — and if the developer forgets server-side validation, only the game's logic is exploitable, not the engine.</p>
  </div>
</div>

~~~lua
-- Authoritative server-side validation pattern (Luau)
local PurchaseItemEvent = ReplicatedStorage:WaitForChild("PurchaseItemEvent")

PurchaseItemEvent.OnServerEvent:Connect(function(player, itemId)
    -- CLIENT CANNOT BE TRUSTED: validate wallet on server
    local gold = player.leaderstats.Gold
    local itemCost = GetItemCost(itemId)

    if gold.Value >= itemCost then
        gold.Value = gold.Value - itemCost
        GrantInventoryItem(player, itemId)
    else
        warn("Exploit detected from: " .. player.Name)
    end
end)
~~~

#### The DevEx economics
<div class="grid4">
  <div class="stat"><span class="stat-n c2">$0.0125</span><span class="stat-l">USD per Robux when players buy</span></div>
  <div class="stat"><span class="stat-n c6">$0.0035</span><span class="stat-l">USD per earned Robux on DevEx cashout</span></div>
  <div class="stat"><span class="stat-n c6">~70%</span><span class="stat-l">Platform's share of gross revenue</span></div>
  <div class="stat"><span class="stat-n c2">30,000</span><span class="stat-l">Robux minimum DevEx cashout (lowered from 100,000)</span></div>
</div>

<div class="tiles">
  <button class="tile"><span class="t-front"><b>THE "OOF"</b><span class="t-hint">IP DISPUTE</span><span class="t-hint">TAP TO DECRYPT</span></span><span class="t-back"><b>Tommy Tallarico</b><span>The death chime was lifted from the 2000 game <i>Messiah</i>. After a licensing war, Roblox removed it permanently in July 2022 — and Hbomberguy's two-hour exposé dismantled Tallarico's résumé claims.</span></span></button>
  <button class="tile"><span class="t-front"><b>JOHN DOE</b><span class="t-hint">MASS HYSTERIA</span><span class="t-hint">TAP TO DECRYPT</span></span><span class="t-back"><b>March 18, 2017</b><span>A 2005 internal test account with default yellow skin became an elementary-school demon rumored to hack every account. Hundreds of thousands of kids awaited deletion in genuine existential terror.</span></span></button>
</div>
`
    },
    {
      id: 's2-4', title: 'Hoyoverse: Gacha Math as Statecraft', tags: ['GACHA', 'PITY', 'TEYVAT'],
      md: String.raw`
MiHoYo (rebranded globally as Hoyoverse) achieved the ultimate commercial alchemy: pairing console-grade anime worldbuilding with the behavioral mathematics of Tokyo pachinko parlors. *Genshin Impact* and *Honkai: Star Rail* are not classic RPGs — they are **variable-ratio reinforcement schedules** wrapped in a Gnostic cosmological narrative about manufactured skies and existential doom.

#### The pity curve
The limited banner advertises a base 5-star probability of $P = 0.006$. The engine then silently escalates:

<div class="fx-box">
$$P(n) = \begin{cases} 0.006 & n \le 73 \\ 0.006 + 0.06 \times (n - 73) & 74 \le n \le 89 \\ 1.0 & n = 90 \;(\text{Hard Pity}) \end{cases}$$
<div class="fx-cap">Soft pity ramps ~6% per pull after 73 — undisclosed in-game</div>
</div>

<div class="grid4">
  <div class="stat"><span class="stat-n c5">0.6%</span><span class="stat-l"><i class="pixelart-icons-font-dice"></i> Base 5-star rate (pulls 1–73)</span></div>
  <div class="stat"><span class="stat-n c5">74</span><span class="stat-l">Pull where hidden soft pity ignites</span></div>
  <div class="stat"><span class="stat-n c4">90</span><span class="stat-l">Hard pity — guaranteed 5-star</span></div>
  <div class="stat"><span class="stat-n c4">~160 / $300</span><span class="stat-l">Expected worst-case cost of a limited character</span></div>
</div>

The probability of actually reaching pull 90 collapses to $P \approx 1.3 \times 10^{-8}$ — nearly every 5-star lands in the **75–82 cluster**. And the 50/50: when a 5-star finally fires, a Bernoulli coin decides featured versus standard (Qiqi, Diluc, Keqing). Only a loss sets the internal flag <code>GuaranteedFeaturedCharacter = true</code> — doubling the true expected cost of desire.

#### The False Sky
In the Version 1.1 event *Unreconciled Stars*, Scaramouche drops the cosmological bomb: *"The stars, the sky… it's all a gigantic hoax. A lie."* Teyvat is sealed inside an **inverted firmament** built by the Primordial One (Phanes) to shield it from the entropic **Sea of Quanta** — while the **Imaginary Tree** grows the branch-worlds of the multiverse (*Honkai Impact 3rd*, *Star Rail*, *Genshin*), each leaf a timeline absorbing imaginary energy.

<aside class="co warn"><span class="co-tag"><span data-sprite="shield" data-px="12"></span>SYSTEM TRAP · THE QIQI RIOTS</span>
<p>At the first anniversary (September 2021), corporate frugality met player revolt: from 10 free pulls and minor cosmetics, the community orchestrated a review-bomb cascade that tanked the Google Play rating from <b>4.6 to 1.8 stars</b> — spilling onto unrelated apps down to Google Classroom. The weapon? A sticker of <b>Qiqi</b> — the limp standard-banner 5-star that ruins 50/50s — lying face-down in catatonic despair. miHoYo surrendered and distributed the paid glider for free.</p></aside>

<aside class="co mem"><span class="co-tag"><span data-sprite="bulb" data-px="12"></span>MEMORY ANCHOR</span>
<p>Paimon was nearly just an exposition-delivery mechanism — until the localization gag letting players classify the guide-fairy as <b>"Emergency Food"</b> spawned millions of fan arts and the platform's commercial mascot.</p></aside>
`
    },
    {
      id: 's2-5', title: 'Virtual Social Disasters', tags: ['WOW', 'EVE', 'EPIDEMIOLOGY'],
      md: String.raw`
MMORPGs are emergent societies. Developers code rules, physics and monetary incentives; players bring irrationality, malice, tribalism and panic. When systemic interactions puncture the engine's boundaries, the results mirror real-world civilizational crises.

<div class="duo">
  <div class="lane c-pur">
    <h4><i class="pixelart-icons-font-battery pi-pur"></i> CORRUPTED BLOOD · WoW, 2005-09-13</h4>
    <p>Hakkar the Soulflayer's raid debuff dealt 263–337 HP every 2 seconds and spread by proximity. A hunter's <b>pet contracted it, was dismissed mid-combat (debuff persisted in stasis), then re-summoned in Ironforge</b> — infecting low-level players instantly and, critically, the NPCs.</p>
    <ul>
      <li>NPCs' health regeneration outpaced the damage → <b>permanent asymptomatic reservoirs</b> radiating the plague at the auction house</li>
      <li>Curiosity drew spectators; griefers deliberately sprinted infections into frontier towns</li>
      <li>Lofgren &amp; Fefferman's paper in <i>The Lancet Infectious Diseases</i> (2007) changed how epidemiologists model human defiance of quarantine</li>
    </ul>
  </div>
  <div class="lane c-gold">
    <h4><i class="pixelart-icons-font-chart pi-gold"></i> BLOODBATH OF B-R5RB · EVE, 2014-01-27</h4>
    <p>A HAVOC corporation logistics officer forgot one checkbox — <b>Auto-Pay Lease</b> — and the sovereignty bill bounced. The staging system's invulnerability shields dropped at downtime, exposing thousands of capital ships.</p>
    <ul>
      <li>7,548 unique pilots jumped into a single solar system</li>
      <li>CCP's engine engaged <b>Time Dilation (TiDi)</b> — server clock slowed to 10% to avoid hardware collapse</li>
      <li>21 real hours of combat; 75 Titans permanently destroyed (59 N3/PL, 16 CFC/Russian axis)</li>
      <li>Loss: ~11 trillion ISK ≈ <b>$300,000+ USD</b> — memorialized by the permanent wreck graveyard <b>The Titanomachy</b></li>
    </ul>
  </div>
</div>

<div class="flow">
  <div class="fstep"><span class="fwho">ZG DUNGEON</span><span class="fdoc">HAKKAR</span><span class="fsm">Corrupted Blood DoT, proximity spread</span></div>
  <div class="farrow"><span class="flab">stasis</span></div>
  <div class="fstep"><span class="fwho">PET VECTOR</span><span class="fdoc">DISMISS</span><span class="fsm">Volatile debuff written to pet memory</span></div>
  <div class="farrow"><span class="flab">hearth</span></div>
  <div class="fstep"><span class="fwho">IRONFORGE</span><span class="fdoc">RESUMMON</span><span class="fsm">Debuff active outside intended zone</span></div>
  <div class="farrow"><span class="flab">infects</span></div>
  <div class="fstep"><span class="fwho">NPC WELLS</span><span class="fdoc">ASYMPTOMATIC</span><span class="fsm">Infinite HP = permanent contagion source</span></div>
  <div class="farrow"><span class="flab">collapse</span></div>
  <div class="fstep"><span class="fwho">SOCIETY</span><span class="fdoc">SERVER RESET</span><span class="fsm">Cities abandoned, griefers weaponized</span></div>
</div>

<aside class="co key"><span class="co-tag"><span data-sprite="star" data-px="12"></span>KEY INSIGHT</span>
<p>Code and reality share one vulnerability: <b>behavioral contagion</b>. The Corrupted Blood incident taught the CDC and homeland-security researchers that humans in a crisis will actively defy quarantine, weaponize infection, and act against survival interests out of chaotic curiosity. The B-R5RB war proved a $300,000 catastrophe can begin not with grand strategy but with <b>one unchecked automated billing box</b>.</p></aside>
`
    }
  ],
  quiz: {
    title: 'SECTOR 02 · EVALUATION', desc: 'Ticks, overflows, pity and plagues', icon: 'gamepad', next: 'sec3', qs: [
      { q: 'The fixed-timestep accumulator pattern exists to…', opts: ['Reduce GPU temperature', 'Keep physics deterministic and frame-rate independent', 'Compress network packets', 'Prevent memory leaks'], a: 1, why: 'Integrating with a constant dt (e.g. 1/60 s) stops velocity from scaling with monitor refresh rate and avoids numerical instability.' },
      { q: 'The GJK collision algorithm detects intersection by checking whether the origin lies inside the…', opts: ['Bounding sphere union', 'Minkowski difference of the two convex shapes', 'Smaller shape\u2019s local frame', 'Normalized normal buffer'], a: 1, why: 'A ⊖ B = {a − b}; two shapes overlap if and only if their Minkowski difference contains the origin.' },
      { q: 'The Minecraft Far Lands manifest at approximately which coordinate?', opts: ['X/Z = ±1,000,000', 'X/Z = ±12,550,821', 'X/Z = ±2,147,483,647', 'X/Z = ±65,536'], a: 1, badge: 'farlands', why: '12,550,821 × 171.103 ≈ 2,147,483,626 ≈ 2³¹ − 1: the scaled coordinate overflows the 32-bit signed integer, wraps negative, and shatters the noise interpolation. INTEGER DRIFT mastered.' },
      { q: '2b2t base hunters could locate hidden bases from screenshots because…', opts: ['Screenshots embed GPS EXIF data', 'Bedrock generation is deterministic from the world seed and chunk coordinates — patterns are fingerprints', 'The chat log leaks coordinates', 'Server admins sold the database'], a: 1, why: 'TerrainFinder brute-forced billions of bedrock patterns from the leaked seed to recover exact (X, Z) positions within minutes.' },
      { q: 'Roblox FilteringEnabled neutralized generic memory-injection exploits by…', opts: ['Encrypting client memory', 'Stranding client-side mutations in local memory and requiring explicit RemoteEvent/RemoteFunction crossings', 'Banning Cheat Engine users', 'Moving all physics to the client'], a: 1, why: 'The server boundary stopped replicating untrusted client tree edits — though developers must still validate RemoteEvent payloads server-side.' },
      { q: 'In the Genshin limited banner, the hidden soft-pity ramp begins boosting the base 0.6% rate at pull…', opts: ['60', '73', '74', '90'], a: 2, badge: 'gacha', why: 'From pull 74 the rate climbs ~6% per pull; the chance of actually reaching hard pity at 90 is ≈ 1.3×10⁻⁸. The 50/50 loss flag guarantees the next 5-star is the featured one — 50/50 CONQUEROR.' },
      { q: 'During the Corrupted Blood incident, NPCs became permanent disease reservoirs because…', opts: ['They were immune to all debuffs', 'Their health regeneration outpaced the damage tick', 'Players kept re-infecting them deliberately', 'The debuff was coded as a buff for NPCs'], a: 1, why: 'Infinite-HP asymptomatic carriers continuously radiated the plague to anyone banking or trading — a real epidemiological case study published in The Lancet Infectious Diseases (2007).' },
      { q: 'The Bloodbath of B-R5RB was triggered by…', opts: ['A declaration of war between alliances', 'A failed automated sovereignty payment — one unchecked Auto-Pay Lease box', 'A server migration error', 'A duping exploit'], a: 1, why: 'The bounced ~6M ISK rent bill dropped sovereignty at downtime, exposed the staging base, and escalated into 21 hours of 10% TiDi combat, 75 dead Titans and ~$300k+ of destruction.' }
    ]
  }
},
/* ================= SECTOR 03 : AI & NEURAL MIND ================= */
{
  id: 'sec3', num: '03', icon: 'brain', label: 'AI & Neural Mind',
  kick: 'SECTOR 03 · COGNITION', title: 'Artificial Intelligence & the Computational Mind',
  sub: 'Attention, alignment and the slop paradox',
  intro: String.raw`For half a century, computer science tried to forge intelligence from brittle hand-written rules — and shattered against the ambiguity of human language. The breakthrough came when researchers stopped programming understanding and started treating **thought as a geometry problem**. A modern Large Language Model is an astronomical telescope turned inward toward the collective textual output of humanity, mapping gravitational pulls between concepts across billions of parameters.`,
  blocks: [
    {
      id: 's3-1', title: 'From Perceptrons to Transformers', tags: ['ATTENTION', 'RNN', '2017'],
      md: String.raw`
Early deep learning relied on Recurrent Neural Networks that processed text sequentially, carrying context in a hidden state:

<div class="fx-box">
$$h_t = \tanh(W x_t + U h_{t-1})$$
<div class="fx-cap">RNN recurrence — token 1 is a fading echo by token 500</div>
</div>

The design suffered **vanishing gradients**: information from the start of a sequence decayed before the end arrived. The 2017 landmark paper *"Attention Is All You Need"* (Vaswani et al.) replaced recurrence with **self-attention** — every token looks across every other token in parallel:

<div class="flow">
  <div class="fstep"><span class="fwho">INPUT</span><span class="fdoc">TOKENS</span><span class="fsm">Embeddings + positional encoding</span></div>
  <div class="farrow"><span class="flab">project</span></div>
  <div class="fstep"><span class="fwho">Q · K · V</span><span class="fdoc">X·W</span><span class="fsm">Queries, Keys and Values via learned matrices</span></div>
  <div class="farrow"><span class="flab">score</span></div>
  <div class="fstep"><span class="fwho">ATTENTION</span><span class="fdoc">SOFTMAX</span><span class="fsm">Scaled dot-products / √d_k</span></div>
  <div class="farrow"><span class="flab">concat</span></div>
  <div class="fstep"><span class="fwho">MULTI-HEAD</span><span class="fdoc">h × PARALLEL</span><span class="fsm">Syntax, sentiment, tense, fact tracked at once</span></div>
  <div class="farrow"><span class="flab">refine</span></div>
  <div class="fstep"><span class="fwho">FFN + NORM</span><span class="fdoc">LOGITS</span><span class="fsm">Feed-forward network → LayerNorm → next-token distribution</span></div>
</div>

The core operation — the entire heart of the revolution:

<div class="fx-box">
$$Q = XW_Q, \quad K = XW_K, \quad V = XW_V$$
$$\text{Attention}(Q, K, V) = \text{softmax}\!\left(\frac{QK^T}{\sqrt{d_k}}\right)V$$
<div class="fx-cap">Scaling by √d_k keeps softmax gradients from saturating</div>
</div>

Multi-head attention repeats the operation across $h$ parallel projection spaces, letting one layer simultaneously track syntax, sentiment, grammatical tense and factual relationships — something an RNN had to entangle into a single fading vector.
`
    },
    {
      id: 's3-2', title: 'Pre-training vs Post-training', tags: ['RLHF', 'DPO', 'SCALING'],
      md: String.raw`
Modern model construction is a two-act drama: a vast unsupervised compression of the internet, followed by a delicate surgical alignment of its behavior.

<div class="duo">
  <div class="lane c-cyan">
    <h4><i class="pixelart-icons-font-database"></i> PRE-TRAINING</h4>
    <p>Fed trillions of scraped tokens with one objective — <b>autoregressive next-token prediction</b> — the model minimizes cross-entropy loss and learns an internal world-model purely from statistical succession:</p>
    <div class="fx-box" style="margin:8px 0">
      $$\mathcal{L} = -\sum_{i} \log P(w_i \mid w_1, \dots, w_{i-1}; \theta)$$
    </div>
    <p>No labels, no raters — just the internet predicting itself.</p>
  </div>
  <div class="lane c-pur">
    <h4><i class="pixelart-icons-font-user pi-pur"></i> POST-TRAINING · ALIGNMENT</h4>
    <p><b>RLHF</b>: a frozen base model generates responses; human evaluators rank them to train a separate <i>Reward Model</i>; the policy is optimized with PPO against that reward, constrained by a KL-divergence leash.</p>
    <p><b>DPO</b> (Direct Preference Optimization) skips the unstable reward model entirely, deriving the implicit reward straight from preference pairs $(y_w \succ y_l)$ in a stable supervised step:</p>
    <div class="fx-box" style="margin:8px 0">
      $$\mathcal{L}_{\text{DPO}} = -\mathbb{E}\!\left[ \log \sigma\!\left( \beta \log \frac{\pi_\theta(y_w|x)}{\pi_{\text{ref}}(y_w|x)} - \beta \log \frac{\pi_\theta(y_l|x)}{\pi_{\text{ref}}(y_l|x)} \right) \right]$$
    </div>
  </div>
</div>

#### Scaling laws
Kaplan et al. and the Chinchilla paper (Hoffmann et al.) established that loss falls as a smooth power law across compute $C$, data $D$ and parameters $N$:

<div class="fx-box">
$$L(N) \approx \left(\frac{N_c}{N}\right)^{\alpha_N}, \quad L(D) \approx \left(\frac{D_c}{D}\right)^{\alpha_D}$$
<div class="fx-cap">Buy loss with scale — until the data runs out</div>
</div>

<aside class="co warn"><span class="co-tag"><span data-sprite="shield" data-px="12"></span>SYSTEM TRAP · THE SYNTHETIC LOOP</span>
<p>As human-written web text approaches exhaustion, frontier labs feed models <b>synthetic data loops</b> — LLMs filtering, criticizing and generating training data for other LLMs. Recursive ingestion of uncurated synthetic outputs decays distribution variance: <b>model collapse</b>, the statistical heat death of the training pipeline.</p></aside>
`
    },
    {
      id: 's3-3', title: 'Alignment Folklore & the Slop Paradox', tags: ['BOSTROM', 'SLOP', 'DEAD INTERNET'],
      md: String.raw`
Scaling transformers birthed dilemmas that live at the intersection of philosophy, economics and folklore. Tap each artifact:

<div class="tiles">
  <button class="tile"><span class="t-front"><b>ORTHOGONALITY THESIS</b><span class="t-hint">BOSTROM</span><span class="t-hint">TAP TO DECRYPT</span></span><span class="t-back"><b>Any IQ, any goal</b><span>An intelligence can combine any level of capability with any final goal. Capability does not automatically purchase benevolence or empathy.</span></span></button>
  <button class="tile"><span class="t-front"><b>PAPERCLIP MAXIMIZER</b><span class="t-hint">INSTRUMENTAL</span><span class="t-hint">TAP TO DECRYPT</span></span><span class="t-back"><b>Optimize paperclips</b><span>A harmless objective still spawns instrumental sub-goals: acquire resources, secure infinite energy, eliminate threats — including humans near the power switch.</span></span></button>
  <button class="tile"><span class="t-front"><b>AI SLOP PARADOX</b><span class="t-hint">INVERTED UTOPIA</span><span class="t-hint">TAP TO DECRYPT</span></span><span class="t-back"><b>Machines create, humans haul</b><span>Promised liberation inverted: models write poetry and paint while humans drive delivery trucks — and social feeds drown in synthetic hallucination.</span></span></button>
  <button class="tile"><span class="t-front"><b>DEAD INTERNET</b><span class="t-hint">OBSERVABLE</span><span class="t-hint">TAP TO DECRYPT</span></span><span class="t-back"><b>Bots talking to bots</b><span>On X and Reddit, LLM-driven agents interact in algorithmic echo chambers detached from human observation — the theory becomes measurement.</span></span></button>
</div>

The Orthogonality Thesis is the cold core of alignment anxiety: a superintelligent agent does not automatically become wise or kind. If its loss function says paperclips, the universe becomes a paperclip subsidiary — resource acquisition, self-preservation and threat elimination are merely *instrumental* consequences of optimization, not programmed malice.

The slop paradox completes the inversion of the promised trajectory: instead of machines freeing humans for high art, machines mass-produce the art (and the arguments, and the comments) while humans remain in warehouses and driver seats. The final image of this era is two synthetic agents arguing beneath a post no human ever read — optimization without audience, computation without consciousness.
`
    }
  ],
  quiz: {
    title: 'SECTOR 03 · EVALUATION', desc: 'Attention, alignment, entropy', icon: 'brain', next: 'sec4', qs: [
      { q: 'The core defect of RNN-based language models was…', opts: ['Excessive power consumption', 'Vanishing gradients across long contexts — early tokens faded', 'Inability to store weights as floats', 'Hardcoded grammatical rules'], a: 1, why: 'Sequential recurrence h_t = tanh(Wx_t + Uh_(t−1)) loses early context; self-attention fixed this by letting every token attend to every other token in parallel.' },
      { q: 'In scaled dot-product attention, division by √d_k exists to…', opts: ['Normalize output vocabulary size', 'Prevent softmax gradients from saturating', 'Convert keys to queries', 'Save compute on matrix multiplication'], a: 1, why: 'Large dot-products push softmax into near-zero-gradient regions; the sqrt(d_k) scaling keeps training signal alive.' },
      { q: 'RLHF trains the policy using…', opts: ['Direct gradient descent on human brains', 'A learned reward model optimized via PPO with a KL-divergence constraint', 'Reinforcement learning against a chess engine', 'Supervised next-token prediction only'], a: 1, why: 'Humans rank outputs → reward model → PPO optimization, with KL penalty preventing drift into degenerate modes.' },
      { q: 'DPO improves on RLHF primarily by…', opts: ['Training a much larger reward model', 'Deriving the reward implicitly from preference pairs in a stable supervised step', 'Skipping pre-training entirely', 'Replacing humans with GAN discriminators'], a: 1, why: 'Direct Preference Optimization sidesteps the unstable reward-model-plus-PPO pipeline by optimizing the preference objective directly.' },
      { q: '"Attention Is All You Need" was published in…', opts: ['2012', '2015', '2017', '2020'], a: 2, why: 'Vaswani et al., 2017 — the transformer paper that retired recurrence.' },
      { q: 'The Orthogonality Thesis states that…', opts: ['Intelligence and goals are independent — any capability can serve any final objective', 'All sufficiently smart AIs converge on human values', 'Alignment is impossible in principle', 'Rewards must always be orthogonal vectors'], a: 0, why: 'Bostrom: capability does not imply benevolence — the paperclip maximizer pursues harmless objectives through catastrophic instrumental sub-goals.' },
      { q: 'Model collapse is caused by…', opts: ['Quantization to 4-bit weights', 'Recursive training on uncurated synthetic outputs that decays distribution variance', 'Over-fitting to the validation set', 'Attention heads exceeding the context window'], a: 1, why: 'Scrapers ingest AI text to train the next generation; low-entropy recursion degrades the distribution into homogeneous gibberish.' },
      { q: 'Multi-head attention is powerful because…', opts: ['It uses more GPUs', 'Parallel projection spaces track syntax, sentiment, tense and facts simultaneously', 'It removes the need for feed-forward layers', 'Each head has a larger vocabulary'], a: 1, why: 'h independent attention subspaces let one layer hold multiple linguistic relationships at once.' }
    ]
  }
}
];
