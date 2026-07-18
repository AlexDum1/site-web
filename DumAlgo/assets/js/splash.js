/* ==========================================================================
   Splash « Tracé au compas » — animation d'accueil DumAlgo
   Portage vanilla de « Splash B - Trace au compas.dc.html » (Claude Design).
   Charte Vert-de-gris : l'hexagone facetté se dessine au compas (rayons +
   contour en stroke-draw, cote pointillée), bascule du plan à la verticale,
   puis le wordmark DUMALGO se compose. Joue une fois, respecte
   prefers-reduced-motion, se saute au clic / PASSER.
   ========================================================================== */
(function () {
  if (document.getElementById('dc-splash')) return;

  var reduced = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var HEX = 'points="50,6 88.1,28 88.1,72 50,94 11.9,72 11.9,28"';

  /* ---------- keyframes (préfixées sp- pour éviter toute collision) ---------- */
  var css =
    '@keyframes sp-fadeIn{from{opacity:0}to{opacity:1}}' +
    '@keyframes sp-rise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}' +
    '@keyframes sp-draw{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}' +
    '@keyframes sp-goldOn{0%{opacity:0}40%{opacity:1}55%{opacity:.3}100%{opacity:1}}' +
    '@keyframes sp-cote{0%{opacity:0}20%{opacity:1}70%{opacity:1}100%{opacity:0}}' +
    '@keyframes sp-pop{from{opacity:0}to{opacity:1}}' +
    '@keyframes sp-tiltUp{from{transform:rotateX(52deg)}to{transform:rotateX(0)}}' +
    '#dc-splash .sp-skip:hover{color:#EAF6F0 !important}';
  var style = document.createElement('style');
  style.setAttribute('data-dc-splash', '');
  style.textContent = css;
  document.head.appendChild(style);

  /* ---------- overlay ---------- */
  var ov = document.createElement('div');
  ov.id = 'dc-splash';
  ov.setAttribute('role', 'presentation');
  ov.style.cssText =
    'position:fixed;inset:0;z-index:9999;background:#0B2F26;overflow:hidden;' +
    'display:flex;align-items:center;justify-content:center;cursor:pointer;' +
    'transition:opacity .7s ease;opacity:1;';

  var grid =
    '<div style="position:absolute;inset:0;background-image:' +
    'linear-gradient(rgba(255,255,255,0.05) 1px,transparent 1px),' +
    'linear-gradient(90deg,rgba(255,255,255,0.05) 1px,transparent 1px);' +
    'background-size:28px 28px;animation:sp-fadeIn .7s ease 0s both;"></div>';

  var wordmarkStatic =
    '<div style="font-family:\'IBM Plex Mono\',ui-monospace,monospace;font-size:44px;' +
    'font-weight:700;color:#EAF6F0;letter-spacing:2px;">DUM<span style="color:#F2C94C;">ALGO</span></div>';

  var baseline =
    '<div style="font-family:\'IBM Plex Mono\',ui-monospace,monospace;font-size:12px;' +
    'letter-spacing:4px;color:#8CAE9F;ANIMBASE">SITES WEB · OUTILS NUMÉRIQUES</div>';

  var spokes = '';
  var pts = [[50, 6], [88.1, 28], [88.1, 72], [50, 94], [11.9, 72], [11.9, 28]];
  var delays = [0.5, 0.62, 0.74, 0.86, 0.98, 1.1];
  for (var i = 0; i < pts.length; i++) {
    spokes +=
      '<line x1="50" y1="50" x2="' + pts[i][0] + '" y2="' + pts[i][1] + '" pathLength="1" ' +
      'stroke="#EAF6F0" stroke-width="1" style="stroke-dasharray:1;' +
      'animation:sp-draw .45s ease-out ' + delays[i] + 's both;"></line>';
  }

  var inner;
  if (reduced) {
    /* ---------- version statique (accessibilité) ---------- */
    var staticSpokes = '';
    for (var j = 0; j < pts.length; j++) {
      staticSpokes += '<line x1="50" y1="50" x2="' + pts[j][0] + '" y2="' + pts[j][1] +
        '" stroke="#EAF6F0" stroke-width="1"></line>';
    }
    inner =
      '<div style="position:relative;display:flex;flex-direction:column;align-items:center;gap:26px;">' +
        '<svg width="160" height="160" viewBox="0 0 100 100">' +
          '<polygon ' + HEX + ' fill="none" stroke="#EAF6F0" stroke-width="2"></polygon>' +
          staticSpokes +
          '<polygon points="50,34 63.9,42 50,50 36.1,42" fill="#F2C94C"></polygon>' +
          '<polygon points="63.9,42 63.9,58 50,66 50,50" fill="none" stroke="#EAF6F0" stroke-width="1.5"></polygon>' +
          '<polygon points="36.1,42 50,50 50,66 36.1,58" fill="#EAF6F0"></polygon>' +
        '</svg>' +
        wordmarkStatic +
        baseline.replace('ANIMBASE', '') +
      '</div>';
  } else {
    /* ---------- version animée ---------- */
    var letters = 'DUMALGO';
    var wm = '';
    for (var k = 0; k < letters.length; k++) {
      var gold = k >= 3 ? 'color:#F2C94C;' : '';
      var pd = (2.95 + k * 0.07).toFixed(2);
      wm += '<span style="' + gold + 'animation:sp-pop .02s linear ' + pd + 's both;">' + letters[k] + '</span>';
    }
    inner =
      '<div style="position:relative;display:flex;flex-direction:column;align-items:center;gap:26px;perspective:900px;">' +
        '<div style="position:relative;transform-origin:50% 62%;' +
          'animation:sp-tiltUp 1s cubic-bezier(.2,.7,.25,1) 2.1s both;">' +
          '<svg width="160" height="160" viewBox="0 0 100 100" style="overflow:visible;display:block;">' +
            '<circle cx="50" cy="50" r="1.4" fill="#F2C94C" style="animation:sp-fadeIn .3s ease .25s both;"></circle>' +
            spokes +
            '<polygon ' + HEX + ' pathLength="1" fill="none" stroke="#EAF6F0" stroke-width="2" ' +
              'style="stroke-dasharray:1;animation:sp-draw .9s cubic-bezier(.4,0,.3,1) 1.25s both;"></polygon>' +
            '<polygon points="63.9,42 63.9,58 50,66 50,50" fill="none" stroke="#EAF6F0" stroke-width="1.5" ' +
              'style="animation:sp-fadeIn .5s ease 2.2s both;"></polygon>' +
            '<polygon points="36.1,42 50,50 50,66 36.1,58" fill="#EAF6F0" ' +
              'style="animation:sp-fadeIn .5s ease 2.2s both;"></polygon>' +
            '<polygon points="50,34 63.9,42 50,50 36.1,42" fill="#F2C94C" ' +
              'style="animation:sp-goldOn .6s ease 2.55s both;"></polygon>' +
          '</svg>' +
          '<div style="position:absolute;left:8px;right:8px;bottom:-22px;' +
            'border-top:1px dashed rgba(234,246,240,0.5);display:flex;justify-content:center;' +
            'animation:sp-cote 1.9s ease 1.5s both;">' +
            '<div style="font-family:\'IBM Plex Mono\',ui-monospace,monospace;font-size:10px;' +
            'letter-spacing:2px;color:#8CAE9F;background:#0B2F26;padding:0 10px;margin-top:-7px;">96 PX</div>' +
          '</div>' +
        '</div>' +
        '<div style="font-family:\'IBM Plex Mono\',ui-monospace,monospace;font-size:44px;' +
          'font-weight:700;color:#EAF6F0;letter-spacing:2px;">' + wm + '</div>' +
        baseline.replace('ANIMBASE', 'animation:sp-rise .6s cubic-bezier(.2,.7,.3,1) 3.55s both;') +
      '</div>';
  }

  var passer =
    '<div class="sp-skip" style="position:absolute;right:28px;bottom:24px;' +
    'font-family:\'IBM Plex Mono\',ui-monospace,monospace;font-size:12px;letter-spacing:2px;' +
    'color:#8CAE9F;cursor:pointer;padding:8px;transition:color .2s ease;">PASSER →</div>';

  ov.innerHTML = grid + inner + passer;
  document.body.appendChild(ov);

  /* verrouille le défilement pendant le splash */
  var prevOverflow = document.documentElement.style.overflow;
  document.documentElement.style.overflow = 'hidden';

  var done = false;
  function dismiss() {
    if (done) return;
    done = true;
    clearTimeout(timer);
    document.documentElement.style.overflow = prevOverflow;
    ov.style.opacity = '0';
    setTimeout(function () { if (ov.parentNode) ov.parentNode.removeChild(ov); }, 750);
  }

  /* durée : ANIM_END 4200 ms + maintien 900 ms (statique : 1400 ms) */
  var total = reduced ? 1400 : 4200 + 900;
  var timer = setTimeout(dismiss, total);
  ov.addEventListener('click', dismiss);
})();
