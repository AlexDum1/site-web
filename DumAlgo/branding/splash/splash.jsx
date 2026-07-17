/* DumAlgo — splash "L'impact". The median strate loads like an arrow, fires
   across the D and slams into the wordmark; the shock flashes the type gold. */
const { useScene, TweaksPanel, TweakSection, TweakToggle, TweakRadio, useTweaks, SceneStage } = window;

/* ---------- palettes ---------- */
const PALETTES = {
  nuit: {
    bg: "#0E3F38",
    strateHi: "#FAF7F2", strateLo: "#E3EFEC",
    gold: "#C9A227", goldHot: "#F2D879",
    dum: "#FAF7F2", algo: "#C9A227",
    baseline: "#9DBAB2",
  },
  ivoire: {
    bg: "#FAF7F2",
    strateHi: "#16584E", strateLo: "#0E3F38",
    gold: "#C9A227", goldHot: "#E6BE45",
    dum: "#1E2528", algo: "#16584E",
    baseline: "#6E7B78",
  },
};
function tweaks() { return window.__SPLASH_TWEAKS || { theme: "nuit", goldWord: false }; }
function pal() { return PALETTES[tweaks().theme] || PALETTES.nuit; }

/* ---------- easing helpers ---------- */
const clamp01 = (x) => Math.max(0, Math.min(1, x));
const seg = (a, b, x) => clamp01((x - a) / (b - a));            // normalize x over [a,b]
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (t) => t * t * (3 - 2 * t);
const easeOut = (t) => 1 - Math.pow(1 - t, 3);
const easeIn = (t) => t * t * t;
const easeInFast = (t) => t * t * t * t;                        // hard accel for the shot
const backOut = (t, s = 2.2) => { const p = t - 1; return 1 + (s + 1) * p * p * p + s * p * p; };
function mixHex(a, b, t) {
  t = clamp01(t);
  const pa = [parseInt(a.slice(1, 3), 16), parseInt(a.slice(3, 5), 16), parseInt(a.slice(5, 7), 16)];
  const pb = [parseInt(b.slice(1, 3), 16), parseInt(b.slice(3, 5), 16), parseInt(b.slice(5, 7), 16)];
  const c = pa.map((v, i) => Math.round(lerp(v, pb[i], t)));
  return "#" + c.map((v) => v.toString(16).padStart(2, "0")).join("");
}

/* ---------- geometry (stage 1280x720) ---------- */
const S = 1.85;                 // logo mark scale
const MX = 322, MY = 270;       // mark top-left in stage space
const NOSE_HOME = MX + 81 * S;  // x of the gold accent's right edge at rest ≈ 471.9
const WORD_X = 522, WORD_Y = 392;
const IMPACT_X = 522, IMPACT_Y = MY + 47.5 * S;   // ≈ 358 — where the nose meets the "D"
const HIT_DX = 52;              // arrow offset that lands the nose on the wordmark
const LOAD_DX = -150;           // drawn-back (loaded) offset — shorter pull-back
const CX = 640, CY = 360;

const P_HI = "M28 14 H50 A17 17 0 0 1 67 31 V33 H28 Z";
const P_LO = "M28 62 V81 H50 A17 17 0 0 0 67 64 V62 Z";
const P_MED = "M24 38 H71 V57 H24 Z";
const P_ACC = "M71 38 H81 V57 H71 Z";

/* one strate, entering with a fade + slide in LOCAL units */
function Strate({ d, fill, dyLocal, op }) {
  return React.createElement("g", { transform: `translate(0 ${dyLocal})`, opacity: op },
    React.createElement("path", { d, fill }));
}

/* the flying arrow: median bar + gold nose, translated in stage space */
function Arrow({ dx, op, glow, p, sx = 1, sy = 1 }) {
  const P = p;
  return React.createElement("g", {
    transform: `translate(${MX + dx} ${MY}) scale(${S}) translate(0 47.5) scale(${sx} ${sy}) translate(0 -47.5)`, opacity: op,
    style: glow > 0.01 ? { filter: `drop-shadow(0 0 ${glow * 7}px ${P.goldHot})` } : undefined,
  },
    React.createElement("path", { d: P_MED, fill: P.strateHi }),
    React.createElement("path", { d: P_ACC, fill: mixHex(P.gold, P.goldHot, glow) }),
  );
}

/* ---------- wordmark: letters flip gold as the shock-ring edge (frontX px) crosses each one ---------- */
function WordmarkWave({ word, splitAt, x, y, fontSize, frontX, lift, colors, gw }) {
  const measRef = React.useRef(null);
  const [pos, setPos] = React.useState(null);
  React.useLayoutEffect(() => {
    let dead = false;
    const measure = () => {
      const t = measRef.current; if (!t || dead) return;
      try {
        const arr = [];
        for (let i = 0; i < word.length; i++) {
          const s = t.getStartPositionOfChar(i), e = t.getEndPositionOfChar(i);
          arr.push({ cx: (s.x + e.x) / 2 });
        }
        setPos(arr);
      } catch (err) { /* fallback stays */ }
    };
    measure();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
    return () => { dead = true; };
  }, [word, fontSize, x, y]);

  const fontProps = {
    fontFamily: "'Space Grotesk', system-ui, sans-serif", fontWeight: 600, fontSize,
    letterSpacing: "-2px", style: {},
  };
  const finalOf = (i) => (i < splitAt ? (gw ? colors.algo : colors.dum) : colors.algo);

  const kids = [React.createElement("text", {
    key: "meas", ref: measRef, x, y, opacity: 0, "aria-hidden": true,
    style: { pointerEvents: "none" },
    fontFamily: "'Space Grotesk', system-ui, sans-serif", fontWeight: 600, fontSize, letterSpacing: "-2px",
  }, word)];

  if (pos) {
    word.split("").forEach((ch, i) => {
      if (ch === " ") return;
      const cx = pos[i].cx;
      const dist = frontX - cx;                    // px the ring edge has passed this glyph
      const appear = clamp01((dist + 12) / 26);
      if (appear <= 0) return;
      const a = clamp01(dist / 42);
      const hump = Math.sin(Math.PI * a);          // up then back to 0 → "saute puis retombe"
      const dy = -lift * hump;
      const sc = 1 + 0.16 * hump;
      const col = mixHex(colors.goldHot, finalOf(i), easeOut(clamp01(dist / 150)));
      kids.push(React.createElement("text", Object.assign({
        key: "l" + i, x: cx, y, textAnchor: "middle", fill: col, opacity: appear,
        transform: `translate(0 ${dy}) translate(${cx} ${y}) scale(${sc}) translate(${-cx} ${-y})`,
      }, fontProps), ch));
    });
  } else if (frontX > x - 30) {
    // fallback before glyph positions are measured
    const op = clamp01((frontX - x + 60) / 200);
    kids.push(React.createElement("text", Object.assign({ key: "fb", x, y, opacity: op }, fontProps),
      React.createElement("tspan", { fill: gw ? colors.algo : colors.dum }, word.slice(0, splitAt)),
      React.createElement("tspan", { fill: colors.algo }, word.slice(splitAt))));
  }
  return React.createElement("g", { key: "wordwave" }, kids);
}

/* ---------- ugly 2005 WordArt that SHATTERS to the right as the shock front passes ---------- */
function UglyWordmark({ word, x, y, fontSize, blastFront, opacity, splitAt, dumCol, algoCol }) {
  const measRef = React.useRef(null);
  const [pos, setPos] = React.useState(null);
  React.useLayoutEffect(() => {
    let dead = false;
    const measure = () => {
      const t = measRef.current; if (!t || dead) return;
      try {
        const arr = [];
        for (let i = 0; i < word.length; i++) {
          const s = t.getStartPositionOfChar(i), e = t.getEndPositionOfChar(i);
          arr.push({ cx: (s.x + e.x) / 2 });
        }
        setPos(arr);
      } catch (err) { /* fallback stays */ }
    };
    measure();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
    return () => { dead = true; };
  }, [word, fontSize, x, y]);

  const fp = {
    fontFamily: "'Comic Neue', 'Comic Sans MS', 'Comic Sans', cursive",
    fontWeight: 700, fontStyle: "italic", fontSize,
    stroke: "#001b3a", strokeWidth: 3.5,
    style: { paintOrder: "stroke", filter: "drop-shadow(4px 4px 0 #000) drop-shadow(0 0 7px rgba(201,162,39,0.6))" },
  };
  const colOf = (i) => (i < splitAt ? dumCol : algoCol);
  const kids = [React.createElement("text", {
    key: "m", ref: measRef, x, y, opacity: 0, "aria-hidden": true,
    fontFamily: fp.fontFamily, fontWeight: 700, fontStyle: "italic", fontSize,
    style: { pointerEvents: "none" },
  }, word)];

  if (pos) {
    word.split("").forEach((ch, i) => {
      if (ch === " ") return;
      const cx = pos[i].cx;
      const b = clamp01((blastFront - cx) / 72);        // slower, more readable shatter
      const ang = ((i * 137) % 360) * Math.PI / 180;    // scatter in ALL directions
      const speed = 300 + (i * 53 % 190);
      const dx = b * (speed * Math.cos(ang) + 150);     // radial + rightward shock bias
      const dy = b * (speed * Math.sin(ang)) + b * b * 240;  // radial + gravity fall
      const rot = (i % 2 ? 1 : -1) * b * (140 + (i * 41 % 200));
      const sc = 1 + b * 0.3;
      const op = (1 - b) * opacity;
      if (op <= 0.01) return;
      kids.push(React.createElement("text", Object.assign({
        key: "u" + i, x: cx, y, textAnchor: "middle", opacity: op, fill: colOf(i),
        transform: `translate(${dx} ${dy}) translate(${cx} ${y}) rotate(${rot}) scale(${sc}) translate(${-cx} ${-y})`,
      }, fp), ch));
    });
  } else {
    kids.push(React.createElement("text", Object.assign({ key: "fb", x, y, opacity }, fp),
      React.createElement("tspan", { fill: dumCol }, word.slice(0, splitAt)),
      React.createElement("tspan", { fill: algoCol }, word.slice(splitAt))));
  }
  return React.createElement("g", null, kids);
}

/* ---------- the composition, driven entirely by animation values ---------- */
function Composition(v) {
  const P = pal();
  const gw = tweaks().goldWord;

  // shake + camera about centre
  const cam = v.cam;
  const rootT = `translate(${CX} ${CY}) scale(${cam}) translate(${-CX} ${-CY}) translate(${v.shakeX} ${v.shakeY})`;

  const children = [];

  // shockwave edge position (px) — drives BOTH the ring and the letter colour sweep, in sync
  const ringR = lerp(6, 520, easeOut(v.ring));
  const frontX = IMPACT_X + ringR;

  // dull/rich background rect (greyed before impact by the group filter, rich after)
  children.push(React.createElement("rect", {
    key: "bg", x: -120, y: -120, width: 1520, height: 960, fill: P.bg,
  }));
  // premium light that blooms in AFTER the hit
  children.push(React.createElement("ellipse", {
    key: "bloom", cx: 590, cy: IMPACT_Y, rx: 540, ry: 260, fill: "url(#bloom)",
    opacity: (1 - v.grade), style: { mixBlendMode: "screen" },
  }));

  // static D frame (high + low strates) — vibrates on the shot
  children.push(React.createElement("g", { key: "mark", transform: `translate(${MX + (v.dJitterX || 0)} ${MY + (v.dJitterY || 0)}) scale(${S})` },
    React.createElement(Strate, { d: P_HI, fill: P.strateHi, dyLocal: v.hiDy, op: v.hiOp }),
    React.createElement(Strate, { d: P_LO, fill: P.strateLo, dyLocal: v.loDy, op: v.loOp }),
  ));

  // motion-trail ghosts of the arrow during the shot (light)
  if (v.trail > 0.01) {
    [[34, 0.28], [78, 0.12]].forEach(([off, a], i) => {
      children.push(React.createElement(Arrow, {
        key: "ghost" + i, dx: v.arrowDX - off, op: a * v.trail * v.arrowOp, glow: 0, p: P,
      }));
    });
  }

  // the arrow itself (squashes on the snap home)
  children.push(React.createElement(Arrow, { key: "arrow", dx: v.arrowDX, op: v.arrowOp, glow: v.glow, p: P, sx: v.arrowSx, sy: v.arrowSy }));

  // ---- impact FX : a vertical shock FRONT, small at first then growing, travelling right ----
  if (v.ring > 0.01) {
    const cy = IMPACT_Y, hH = lerp(26, 134, v.ring), bulge = lerp(10, 46, v.ring);
    const arc = (fx, b, h) => `M ${fx} ${cy - h} Q ${fx + b} ${cy} ${fx} ${cy + h}`;
    const fade = clamp01(1 - v.ring / 0.58);   // dissipate early so it isn't seen past the word
    // soft wide halo behind the front
    children.push(React.createElement("path", {
      key: "front-glow", d: arc(frontX - 14, bulge + 10, hH), fill: "none",
      stroke: P.goldHot, strokeWidth: 16, strokeLinecap: "round",
      opacity: fade * 0.18, style: { mixBlendMode: "screen", filter: "blur(6px)" },
    }));
    // crisp leading edge
    children.push(React.createElement("path", {
      key: "front", d: arc(frontX, bulge, hH), fill: "none",
      stroke: P.goldHot, strokeWidth: lerp(4, 1.2, v.ring), strokeLinecap: "round",
      opacity: fade * 0.95,
    }));
  }

  // ---- (ugly wordmark is rendered OUTSIDE the grey filter, see below) ----

  // ---- wordmark (cascading gold wave) ----
  children.push(React.createElement(WordmarkWave, {
    key: "word", word: "DumAlgo", splitAt: 3, x: WORD_X, y: WORD_Y, fontSize: 96,
    frontX, lift: v.lift, colors: P, gw,
  }));

  // ---- baseline signature : wipes in riding the same shock front (au fil de l'onde) ----
  if (v.ring > 0.02) {
    children.push(React.createElement("text", {
      key: "base", x: WORD_X + 4, y: 436, fontFamily: "Inter, Helvetica, Arial, sans-serif",
      fontWeight: 500, fontSize: 15, letterSpacing: "3.6px", fill: P.baseline,
      clipPath: "url(#baseClip)",
    }, "SITES WEB · OUTILS NUMÉRIQUES"));
  }

  // UGLY 2005-WordArt placeholder — full garish colour (outside the grey filter), shatters right on impact
  const blastFront = v.ring > 0.02 ? frontX : -99999;
  const uglyEl = v.uglyOp > 0.002 ? React.createElement("g", { key: "uglyG", transform: rootT },
    React.createElement(UglyWordmark, {
      word: "DumAlgo", x: WORD_X, y: WORD_Y - 2, fontSize: 84, blastFront, opacity: v.uglyOp,
      splitAt: 3, dumCol: P.dum, algoCol: P.algo,
    })) : null;

  return React.createElement("svg", {
    viewBox: "0 0 1280 720", width: "100%", height: "100%",
    style: { display: "block", background: P.bg },
  },
    React.createElement("defs", null,
      React.createElement("clipPath", { id: "baseClip" },
        React.createElement("rect", { x: 0, y: 0, width: frontX, height: 720 })),
      React.createElement("radialGradient", { id: "bloom" },
        React.createElement("stop", { offset: "0", stopColor: P.goldHot, stopOpacity: "0.13" }),
        React.createElement("stop", { offset: "1", stopColor: P.goldHot, stopOpacity: "0" })),
      React.createElement("linearGradient", { id: "wordart", x1: "0", y1: "0", x2: "0", y2: "1" },
        React.createElement("stop", { offset: "0", stopColor: "#fff27a" }),
        React.createElement("stop", { offset: "0.42", stopColor: "#ffb300" }),
        React.createElement("stop", { offset: "0.72", stopColor: "#ff4d00" }),
        React.createElement("stop", { offset: "1", stopColor: "#a80000" }))),
    React.createElement("g", {
      transform: rootT,
      style: { filter: `saturate(${lerp(1, 0.1, v.grade)}) brightness(${lerp(1, 0.72, v.grade)})` },
    }, children),
    uglyEl,
    v.flash > 0.001 ? React.createElement("rect", {
      key: "flash", x: 0, y: 0, width: 1280, height: 720, fill: P.goldHot,
      opacity: v.flash * 0.5, style: { mixBlendMode: "screen" },
    }) : null,
  );
}

/* ================= SCENE 1 — L'impact ================= */
function ImpactScene() {
  const { progress: p } = useScene();

  // IMPACT anchor at p≈0.40 (buildup unchanged in seconds, post-impact given ~3.5s to breathe)
  // frame build
  // logo + ugly wordmark are fully visible from the FIRST frame, held, then the action starts
  const hiOp = 1, loOp = 1;
  const hiDy = 0, loDy = 0;

  // arrow: appear → pull back (load) → hold → FIRE → recoil home
  const appear = seg(0.12, 0.18, p);
  const load = backOut(seg(0.30, 0.355, p), 2.6);   // stays as the D's bar, then rips back late — no dead hold
  const fire = easeInFast(seg(0.365, 0.40, p));      // shoot to HIT_DX — quicker
  const ret = seg(0.40, 0.60, p);                    // return to 0 with overshoot
  let arrowDX;
  if (p < 0.365) arrowDX = lerp(0, LOAD_DX, load);
  else if (p < 0.40) arrowDX = lerp(LOAD_DX, HIT_DX, fire);
  else arrowDX = lerp(HIT_DX, 0, backOut(ret, 3));
  const arrowOp = 1;                                 // the bar is part of the D from frame 0
  const glow = Math.max(smooth(seg(0.164, 0.31, p)) * (1 - seg(0.329, 0.38, p)), 0.35 * (1 - seg(0.42, 0.92, p)));
  const trail = seg(0.329, 0.376, p) * (1 - seg(0.376, 0.45, p));

  // impact @ p≈0.40 — intensity 8, slowed to savour the shockwave
  const imp = seg(0.40, 0.80, p);
  const decay = (t, k) => Math.exp(-k * t);
  const shakeEnv = imp > 0 && imp < 1 ? decay(imp, 3.2) * (1 - imp) : 0;
  const shakeX = shakeEnv * 22 * Math.sin(imp * 70);
  const shakeY = shakeEnv * 12 * Math.sin(imp * 58 + 1);
  const ring = seg(0.40, 0.86, p);                   // slower shockwave / colour sweep
  const spark = seg(0.40, 0.66, p);
  const wave = seg(0.40, 0.80, p);

  // D vibrates during the shot (before impact)
  const fireEnv = smooth(seg(0.31, 0.40, p)) * (1 - seg(0.40, 0.47, p));
  const dJitterX = fireEnv * 5 * Math.sin(p * 420);
  const dJitterY = fireEnv * 3 * Math.sin(p * 360 + 1);

  // the gold wave-front sweeps the letters left→right; each pops up then falls
  const wf = lerp(-0.25, 1.3, easeOut(seg(0.40, 0.84, p)));
  const lift = 36;

  // arrow squashes on the snap home
  const sqEnv = Math.sin(Math.PI * clamp01((p - 0.52) / 0.12));
  const arrowSx = 1 + 0.18 * sqEnv;
  const arrowSy = 1 - 0.14 * sqEnv;
  // baseline signature fades in once the comet has passed the word; reflet just before freeze
  const baseOp = smooth(seg(0.80, 0.94, p));
  const glint = seg(0.88, 0.99, p);
  const cam = 1 + smooth(seg(0.31, 0.40, p)) * (1 - seg(0.41, 0.66, p)) * 0.04;
  // ugly Comic-Sans placeholder: shows during the build, knocked out on impact
  const uglyOp = p < 0.92 ? 1 : 0;                   // mounted through the shatter, then gone
  const uglyDrop = seg(0.40, 0.54, p);
  // before = dull & grey, colour snaps back on impact; a quick flash marks the hit
  const grade = 1 - smooth(seg(0.40, 0.50, p));
  const flash = Math.sin(Math.PI * clamp01((p - 0.395) / 0.06));

  return Composition({
    hiOp, loOp, hiDy, loDy, arrowDX, arrowOp, glow, trail,
    shakeX, shakeY, ring, spark, wave, wf, lift, dJitterX, dJitterY, cam,
    arrowSx, arrowSy, baseOp, glint, uglyOp, uglyDrop, grade, flash,
  });
}

/* ================= root ================= */
function Splash() {
  const [t, setTweak] = useTweaks(window.TWEAK_DEFAULTS);
  window.__SPLASH_TWEAKS = t;
  const P = PALETTES[t.theme] || PALETTES.nuit;

  return React.createElement("div", { style: { width: "100%", height: "100%" } },
    React.createElement(SceneStage, {
      width: 1280, height: 720, scenes: window.OM_SCENES, playback: window.OM_PLAYBACK,
      bg: P.bg, transition: "cut",
    }, { Impact: ImpactScene }),
    React.createElement(TweaksPanel, null,
      React.createElement(TweakSection, { label: "Fond & couleurs" }),
      React.createElement(TweakRadio, {
        label: "Thème", value: t.theme, options: ["nuit", "ivoire"],
        onChange: (v) => setTweak("theme", v),
      }),
      React.createElement(TweakToggle, {
        label: "Mot entier doré", value: t.goldWord,
        onChange: (v) => setTweak("goldWord", v),
      }),
      React.createElement(TweakSection, { label: "Édition" }),
      React.createElement(TweakToggle, {
        label: "Éditeur de montage", value: t.motionEditor,
        onChange: (v) => setTweak("motionEditor", v),
      }),
    ),
  );
}
window.Splash = Splash;
