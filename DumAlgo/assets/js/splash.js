/* Splash d'intro DumAlgo — « L'impact ».
   Portage vanilla du prototype Claude Design (branding/splash/) : la strate
   médiane du D se charge comme une flèche, tire, pulvérise l'ancien wordmark
   Comic Sans ; l'onde de choc révèle le wordmark DumAlgo et la baseline.
   Joue une fois par session, cliquable pour passer, ignoré si
   prefers-reduced-motion. Aucune dépendance. */
(function () {
  'use strict';

  var KEY = 'dumalgo_splash_seen';
  try {
    if (sessionStorage.getItem(KEY)) return;
  } catch (e) { /* stockage bloqué : on joue quand même */ }
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  /* ---------- palette « nuit » ---------- */
  var P = {
    bg: '#0E3F38',
    strateHi: '#FAF7F2', strateLo: '#E3EFEC',
    gold: '#C9A227', goldHot: '#F2D879',
    dum: '#FAF7F2', algo: '#C9A227',
    baseline: '#9DBAB2',
  };

  /* ---------- easing ---------- */
  function clamp01(x) { return Math.max(0, Math.min(1, x)); }
  function seg(a, b, x) { return clamp01((x - a) / (b - a)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function smooth(t) { return t * t * (3 - 2 * t); }
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
  function easeInFast(t) { return t * t * t * t; }
  function backOut(t, s) { var p = t - 1; return 1 + (s + 1) * p * p * p + s * p * p; }
  function mixHex(a, b, t) {
    t = clamp01(t);
    var c = '#';
    for (var i = 1; i < 7; i += 2) {
      var v = Math.round(lerp(parseInt(a.slice(i, i + 2), 16), parseInt(b.slice(i, i + 2), 16), t));
      c += (v < 16 ? '0' : '') + v.toString(16);
    }
    return c;
  }

  /* ---------- géométrie (scène 1280x720) ---------- */
  var S = 1.85, MX = 322, MY = 270;
  var WORD_X = 522, WORD_Y = 392;
  var IMPACT_X = 522, IMPACT_Y = MY + 47.5 * S;
  var HIT_DX = 52, LOAD_DX = -150, CX = 640, CY = 360;
  var P_HI = 'M28 14 H50 A17 17 0 0 1 67 31 V33 H28 Z';
  var P_LO = 'M28 62 V81 H50 A17 17 0 0 0 67 64 V62 Z';
  var P_MED = 'M24 38 H71 V57 H24 Z';
  var P_ACC = 'M71 38 H81 V57 H71 Z';
  var WORD = 'DumAlgo', SPLIT = 3;
  var FONT = "'Fraunces', Georgia, serif";
  var UGLY_FONT = "'Comic Sans MS', 'Comic Sans', 'Chalkboard SE', cursive";
  var DUR = 5200;   // ms — une seule lecture

  /* ---------- overlay ---------- */
  var ov = document.createElement('div');
  ov.setAttribute('aria-hidden', 'true');
  ov.style.cssText = 'position:fixed;inset:0;z-index:9999;background:' + P.bg +
    ';display:flex;align-items:center;justify-content:center;cursor:pointer;' +
    'transition:opacity .55s ease;';
  ov.innerHTML = '<svg viewBox="0 0 1280 720" preserveAspectRatio="xMidYMid slice" ' +
    'style="width:100%;height:100%;display:block"></svg>' +
    '<span style="position:absolute;right:18px;bottom:14px;font:500 12px/1 Inter,system-ui,sans-serif;' +
    'letter-spacing:.12em;color:rgba(250,247,242,.45)">PASSER →</span>';
  var svg = ov.querySelector('svg');
  document.body.appendChild(ov);
  document.body.style.overflow = 'hidden';

  /* Cadrage adapté au format de l'écran : la scène est composée en 1280x720 ;
     en portrait, un viewBox plein cadre rognerait le D et le wordmark. On
     recalcule donc un viewBox au ratio exact de l'écran, centré sur la
     composition (zone utile ~x 210-910, impact vertical ~350). */
  function fit() {
    var ar = Math.max(0.3, Math.min(3.5, ov.clientWidth / Math.max(1, ov.clientHeight)));
    var x, y, w, h;
    if (ar >= 1) { h = 720; w = h * ar; x = 640 - w / 2; y = 0; }
    else { w = 760; h = w / ar; x = 158; y = 350 - h / 2; }
    svg.setAttribute('viewBox', x + ' ' + y + ' ' + w + ' ' + h);
  }
  fit();
  window.addEventListener('resize', fit);

  /* centres des lettres, mesurés une fois les polices prêtes */
  var pos = null, uglyPos = null;
  function measure(font, weight, style, size, ls) {
    var t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    t.setAttribute('x', WORD_X); t.setAttribute('y', WORD_Y);
    t.setAttribute('opacity', '0');
    t.setAttribute('style', 'font:' + style + ' ' + weight + ' ' + size + 'px ' + font + ';letter-spacing:' + ls + 'px');
    t.textContent = WORD;
    svg.appendChild(t);
    var arr = null;
    try {
      arr = [];
      for (var i = 0; i < WORD.length; i++) {
        var s = t.getStartPositionOfChar(i), e = t.getEndPositionOfChar(i);
        arr.push((s.x + e.x) / 2);
      }
    } catch (err) { arr = null; }
    svg.removeChild(t);
    return arr;
  }
  function doMeasure() {
    pos = measure(FONT, 600, 'normal', 92, -2);
    uglyPos = measure(UGLY_FONT, 700, 'italic', 78, 0);
  }
  doMeasure();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { doMeasure(); });

  /* ---------- rendu d'une frame (p ∈ [0,1]) ---------- */
  function frame(p) {
    // flèche : en place → armée → tir → retour
    var load = backOut(seg(0.30, 0.355, p), 2.6);
    var fire = easeInFast(seg(0.365, 0.40, p));
    var ret = seg(0.40, 0.60, p);
    var arrowDX = p < 0.365 ? lerp(0, LOAD_DX, load)
      : p < 0.40 ? lerp(LOAD_DX, HIT_DX, fire)
        : lerp(HIT_DX, 0, backOut(ret, 3));
    var glow = Math.max(smooth(seg(0.164, 0.31, p)) * (1 - seg(0.329, 0.38, p)), 0.35 * (1 - seg(0.42, 0.92, p)));
    var trail = seg(0.329, 0.376, p) * (1 - seg(0.376, 0.45, p));

    // impact
    var imp = seg(0.40, 0.80, p);
    var shakeEnv = imp > 0 && imp < 1 ? Math.exp(-3.2 * imp) * (1 - imp) : 0;
    var shakeX = shakeEnv * 22 * Math.sin(imp * 70);
    var shakeY = shakeEnv * 12 * Math.sin(imp * 58 + 1);
    var ring = seg(0.40, 0.86, p);
    var fireEnv = smooth(seg(0.31, 0.40, p)) * (1 - seg(0.40, 0.47, p));
    var dJx = fireEnv * 5 * Math.sin(p * 420), dJy = fireEnv * 3 * Math.sin(p * 360 + 1);
    var sqEnv = Math.sin(Math.PI * clamp01((p - 0.52) / 0.12));
    var sx = 1 + 0.18 * sqEnv, sy = 1 - 0.14 * sqEnv;
    var cam = 1 + smooth(seg(0.31, 0.40, p)) * (1 - seg(0.41, 0.66, p)) * 0.04;
    var grade = 1 - smooth(seg(0.40, 0.50, p));
    var flash = Math.sin(Math.PI * clamp01((p - 0.395) / 0.06));
    var ringR = lerp(6, 520, easeOut(ring));
    var frontX = IMPACT_X + ringR;
    var rootT = 'translate(' + CX + ' ' + CY + ') scale(' + cam + ') translate(' + (-CX) + ' ' + (-CY) + ') translate(' + shakeX + ' ' + shakeY + ')';

    var s = '<defs><clipPath id="spBase"><rect x="0" y="0" width="' + frontX + '" height="720"/></clipPath>' +
      '<radialGradient id="spBloom"><stop offset="0" stop-color="' + P.goldHot + '" stop-opacity="0.13"/>' +
      '<stop offset="1" stop-color="' + P.goldHot + '" stop-opacity="0"/></radialGradient></defs>';

    s += '<g transform="' + rootT + '" style="filter:saturate(' + lerp(1, 0.1, grade) + ') brightness(' + lerp(1, 0.72, grade) + ')">';
    s += '<rect x="-2200" y="-1600" width="5700" height="3950" fill="' + P.bg + '"/>';
    s += '<ellipse cx="590" cy="' + IMPACT_Y + '" rx="540" ry="260" fill="url(#spBloom)" opacity="' + (1 - grade) + '" style="mix-blend-mode:screen"/>';

    // le D (strates haute + basse)
    s += '<g transform="translate(' + (MX + dJx) + ' ' + (MY + dJy) + ') scale(' + S + ')">' +
      '<path d="' + P_HI + '" fill="' + P.strateHi + '"/><path d="' + P_LO + '" fill="' + P.strateLo + '"/></g>';

    // traînées + flèche
    function arrow(dx, op, gl, asx, asy) {
      return '<g transform="translate(' + (MX + dx) + ' ' + MY + ') scale(' + S + ') translate(0 47.5) scale(' + asx + ' ' + asy + ') translate(0 -47.5)" opacity="' + op + '"' +
        (gl > 0.01 ? ' style="filter:drop-shadow(0 0 ' + (gl * 7) + 'px ' + P.goldHot + ')"' : '') + '>' +
        '<path d="' + P_MED + '" fill="' + P.strateHi + '"/><path d="' + P_ACC + '" fill="' + mixHex(P.gold, P.goldHot, gl) + '"/></g>';
    }
    if (trail > 0.01) {
      s += arrow(arrowDX - 34, 0.28 * trail, 0, 1, 1);
      s += arrow(arrowDX - 78, 0.12 * trail, 0, 1, 1);
    }
    s += arrow(arrowDX, 1, glow, sx, sy);

    // front d'onde
    if (ring > 0.01) {
      var hH = lerp(26, 134, ring), bulge = lerp(10, 46, ring);
      var fade = clamp01(1 - ring / 0.58);
      var arc = function (fx, b, h) { return 'M ' + fx + ' ' + (IMPACT_Y - h) + ' Q ' + (fx + b) + ' ' + IMPACT_Y + ' ' + fx + ' ' + (IMPACT_Y + h); };
      s += '<path d="' + arc(frontX - 14, bulge + 10, hH) + '" fill="none" stroke="' + P.goldHot + '" stroke-width="16" stroke-linecap="round" opacity="' + (fade * 0.18) + '" style="mix-blend-mode:screen;filter:blur(6px)"/>';
      s += '<path d="' + arc(frontX, bulge, hH) + '" fill="none" stroke="' + P.goldHot + '" stroke-width="' + lerp(4, 1.2, ring) + '" stroke-linecap="round" opacity="' + (fade * 0.95) + '"/>';
    }

    // wordmark final : vague dorée lettre à lettre
    var fontCss = 'font:600 92px ' + FONT + ';letter-spacing:-2px';
    if (pos) {
      for (var i = 0; i < WORD.length; i++) {
        var cx = pos[i], dist = frontX - cx;
        var appear = clamp01((dist + 12) / 26);
        if (appear <= 0) continue;
        var hump = Math.sin(Math.PI * clamp01(dist / 42));
        var dy = -36 * hump, sc = 1 + 0.16 * hump;
        var fin = i < SPLIT ? P.dum : P.algo;
        var col = mixHex(P.goldHot, fin, easeOut(clamp01(dist / 150)));
        s += '<text x="' + cx + '" y="' + WORD_Y + '" text-anchor="middle" fill="' + col + '" opacity="' + appear + '" style="' + fontCss + '" transform="translate(0 ' + dy + ') translate(' + cx + ' ' + WORD_Y + ') scale(' + sc + ') translate(' + (-cx) + ' ' + (-WORD_Y) + ')">' + WORD[i] + '</text>';
      }
    } else if (frontX > WORD_X - 30) {
      s += '<text x="' + WORD_X + '" y="' + WORD_Y + '" style="' + fontCss + '" opacity="' + clamp01((frontX - WORD_X + 60) / 200) + '">' +
        '<tspan fill="' + P.dum + '">Dum</tspan><tspan fill="' + P.algo + '">Algo</tspan></text>';
    }

    // baseline balayée par le front
    if (ring > 0.02) {
      s += '<text x="' + (WORD_X + 4) + '" y="436" clip-path="url(#spBase)" fill="' + P.baseline + '" style="font:500 15px Inter,system-ui,sans-serif;letter-spacing:3.6px">SITES WEB · OUTILS NUMÉRIQUES</text>';
    }
    s += '</g>';

    // wordmark « 2005 » (hors filtre gris), pulvérisé par le front
    if (p < 0.92) {
      var blast = ring > 0.02 ? frontX : -99999;
      var uFont = 'font:italic 700 78px ' + UGLY_FONT + ';paint-order:stroke';
      s += '<g transform="' + rootT + '">';
      if (uglyPos) {
        for (var j = 0; j < WORD.length; j++) {
          var ucx = uglyPos[j];
          var b = clamp01((blast - ucx) / 72);
          if (b >= 0.99) continue;
          var ang = ((j * 137) % 360) * Math.PI / 180;
          var speed = 300 + (j * 53 % 190);
          var ddx = b * (speed * Math.cos(ang) + 150);
          var ddy = b * (speed * Math.sin(ang)) + b * b * 240;
          var rot = (j % 2 ? 1 : -1) * b * (140 + (j * 41 % 200));
          var usc = 1 + b * 0.3;
          s += '<text x="' + ucx + '" y="' + (WORD_Y - 2) + '" text-anchor="middle" opacity="' + (1 - b) + '" fill="' + (j < SPLIT ? P.dum : P.algo) + '" stroke="#001b3a" stroke-width="3.5" style="' + uFont + ';filter:drop-shadow(4px 4px 0 #000)" transform="translate(' + ddx + ' ' + ddy + ') translate(' + ucx + ' ' + (WORD_Y - 2) + ') rotate(' + rot + ') scale(' + usc + ') translate(' + (-ucx) + ' ' + (-(WORD_Y - 2)) + ')">' + WORD[j] + '</text>';
        }
      } else if (blast < WORD_X) {
        s += '<text x="' + WORD_X + '" y="' + (WORD_Y - 2) + '" stroke="#001b3a" stroke-width="3.5" style="' + uFont + ';filter:drop-shadow(4px 4px 0 #000)">' +
          '<tspan fill="' + P.dum + '">Dum</tspan><tspan fill="' + P.algo + '">Algo</tspan></text>';
      }
      s += '</g>';
    }

    if (flash > 0.001) {
      s += '<rect x="-2200" y="-1600" width="5700" height="3950" fill="' + P.goldHot + '" opacity="' + (flash * 0.5) + '" style="mix-blend-mode:screen"/>';
    }
    svg.innerHTML = s;
  }

  /* ---------- lecture + sortie ---------- */
  var start = null, done = false, raf = 0;
  function dismiss() {
    if (done) return;
    done = true;
    cancelAnimationFrame(raf);
    try { sessionStorage.setItem(KEY, '1'); } catch (e) { /* ignore */ }
    ov.style.opacity = '0';
    document.body.style.overflow = '';
    setTimeout(function () { if (ov.parentNode) ov.parentNode.removeChild(ov); }, 600);
  }
  function tick(now) {
    if (done) return;
    if (start === null) start = now;
    var p = (now - start) / DUR;
    if (p >= 1) { frame(1); setTimeout(dismiss, 350); return; }
    frame(p);
    raf = requestAnimationFrame(tick);
  }
  ov.addEventListener('click', dismiss);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') dismiss(); }, { once: true });
  frame(0);
  // hook de QA : #splashp=0.55 fige la frame demandée (revue visuelle)
  var dbg = /[#&]splashp=([\d.]+)/.exec(location.hash);
  if (dbg) { var fp = parseFloat(dbg[1]); setTimeout(function () { frame(fp); }, 400); }
  else raf = requestAnimationFrame(tick);
})();
