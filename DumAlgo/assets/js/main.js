/* ==========================================================================
   Configuration centralisée — à compléter avant mise en ligne
   ========================================================================== */
const SITE = {
  brand: 'DumAlgo',            // Nom de marque validé
  phone: '06 XX XX XX XX',        // TODO : numéro de téléphone réel
  phoneHref: '+33600000000',      // TODO : numéro au format international
  email: 'contact@exemple.fr',    // TODO : adresse email pro
  formspree: '',                  // TODO : endpoint Formspree, ex. 'https://formspree.io/f/xxxxxxx'
};

/* Injection de la config dans le DOM */
/* Wordmark bicolore comme dans le splash : « Dum » neutre, « Algo » doré */
const brandParts = /^(Dum)(Algo)$/.exec(SITE.brand);
document.querySelectorAll('[data-brand]').forEach((el) => {
  el.textContent = '';
  if (brandParts) {
    el.append(brandParts[1]);
    const accent = document.createElement('span');
    accent.className = 'brand-accent';
    accent.textContent = brandParts[2];
    el.append(accent);
  } else {
    el.textContent = SITE.brand;
  }
});
document.querySelectorAll('[data-phone]').forEach((el) => { el.textContent = SITE.phone; });
document.querySelectorAll('[data-phone-link]').forEach((el) => { el.href = 'tel:' + SITE.phoneHref; });
document.querySelectorAll('[data-email]').forEach((el) => { el.textContent = SITE.email; });
document.querySelectorAll('[data-email-link]').forEach((el) => { el.href = 'mailto:' + SITE.email; });
document.querySelectorAll('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });

/* ==========================================================================
   Navigation — ombre au scroll, menu mobile, lien actif
   ========================================================================== */
const header = document.querySelector('.site-header');
const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
onScroll();
window.addEventListener('scroll', onScroll, { passive: true });

const toggle = document.querySelector('.nav__toggle');
const menu = document.getElementById('nav-menu');
toggle.addEventListener('click', () => {
  const open = menu.classList.toggle('is-open');
  toggle.setAttribute('aria-expanded', String(open));
  toggle.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
});
menu.addEventListener('click', (e) => {
  if (e.target.closest('a')) {
    menu.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
  }
});

const navLinks = [...menu.querySelectorAll('a[href^="#"]:not(.nav__cta)')];
const sections = navLinks
  .map((link) => document.querySelector(link.hash))
  .filter(Boolean);

const activeObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navLinks.forEach((link) =>
        link.classList.toggle('is-active', link.hash === '#' + entry.target.id)
      );
    });
  },
  { rootMargin: '-30% 0px -60% 0px' }
);
sections.forEach((s) => activeObserver.observe(s));

/* ==========================================================================
   Forfaits maintenance — bascule Annuel / Mensuel
   ========================================================================== */
const billingButtons = [...document.querySelectorAll('.billing-toggle__btn')];
const setBilling = (mode) => {
  billingButtons.forEach((btn) => {
    const active = btn.dataset.billing === mode;
    btn.classList.toggle('is-active', active);
    btn.setAttribute('aria-pressed', String(active));
  });
  document.querySelectorAll('[data-price]').forEach((el) => {
    el.textContent = el.dataset[mode];
    // classe alternée pour rejouer l'animation d'apparition du prix
    el.classList.remove('price-pop-a', 'price-pop-b');
    el.classList.add(mode === 'annuel' ? 'price-pop-a' : 'price-pop-b');
  });
  document.querySelectorAll('[data-billing-meta]').forEach((el) => { el.textContent = el.dataset[mode]; });
};
billingButtons.forEach((btn) =>
  btn.addEventListener('click', () => setBilling(btn.dataset.billing))
);

/* ==========================================================================
   Révélation au scroll (respecte prefers-reduced-motion via CSS)
   ========================================================================== */
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12 }
);
document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));

/* ==========================================================================
   Formulaire de contact — Formspree si configuré, repli mailto sinon
   ========================================================================== */
const form = document.getElementById('contact-form');

/* Pré-remplissage du type de projet (boutons portant data-prefill) */
document.querySelectorAll('a[data-prefill]').forEach((link) => {
  link.addEventListener('click', () => {
    const select = form.querySelector('select[name="type_de_projet"]');
    if (select) select.value = link.dataset.prefill;
  });
});
const status = form.querySelector('.form-status');
const submitBtn = form.querySelector('button[type="submit"]');
let sentTimer = 0;

/* Feedback visuel du bouton d'envoi (design « Accueil DumAlgo ») */
const markSent = () => {
  submitBtn.classList.add('is-sent');
  submitBtn.textContent = 'Message prêt ✓';
  clearTimeout(sentTimer);
  sentTimer = setTimeout(() => {
    submitBtn.classList.remove('is-sent');
    submitBtn.textContent = 'Envoyer';
  }, 4000);
};

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = new FormData(form);

  if (!SITE.formspree) {
    // Endpoint non configuré : repli sur le client mail du visiteur.
    const body = [
      'Nom : ' + data.get('nom'),
      'Email : ' + data.get('email'),
      'Type de projet : ' + (data.get('type_de_projet') || 'Non précisé'),
      '',
      data.get('message'),
    ].join('\n');
    window.location.href =
      'mailto:' + SITE.email +
      '?subject=' + encodeURIComponent('Demande de projet : ' + data.get('nom')) +
      '&body=' + encodeURIComponent(body);
    status.textContent = 'Votre logiciel de messagerie va s’ouvrir avec le message pré-rempli.';
    markSent();
    return;
  }

  status.textContent = 'Envoi en cours…';
  try {
    const res = await fetch(SITE.formspree, {
      method: 'POST',
      body: data,
      headers: { Accept: 'application/json' },
    });
    if (res.ok) {
      form.reset();
      status.textContent = 'Merci ! Votre message a bien été envoyé, je reviens vers vous rapidement.';
      markSent();
    } else {
      status.textContent = 'Une erreur est survenue. Vous pouvez me joindre directement par téléphone ou email.';
    }
  } catch {
    status.textContent = 'Une erreur est survenue. Vous pouvez me joindre directement par téléphone ou email.';
  }
});

/* ==========================================================================
   Visionneuse de maquettes — écran agrandi (Mac ou iPhone), vrai site en iframe
   Implémentation du design « Accueil DumAlgo.dc.html »
   ========================================================================== */
const viewer = document.getElementById('viewer');
if (viewer) {
  const stageLaptop = viewer.querySelector('.vlaptop');
  const stagePhone = viewer.querySelector('.vphone');
  const phoneFrameBox = viewer.querySelector('.vphone__frame');
  const frames = {
    laptop: viewer.querySelector('[data-viewer-frame="laptop"]'),
    phone: viewer.querySelector('[data-viewer-frame="phone"]'),
  };
  const urlEl = viewer.querySelector('[data-viewer-url]');
  const titleEl = viewer.querySelector('[data-viewer-title]');
  const hintEl = viewer.querySelector('[data-viewer-hint]');
  const closeBtn = viewer.querySelector('.viewer__close');
  let lastFocus = null;

  /* L'iframe mobile rend le site à 390 px logiques puis est mise à l'échelle
     du cadre — recalculé à chaque redimensionnement. */
  const scalePhone = () => {
    if (phoneFrameBox.clientWidth > 0) {
      phoneFrameBox.style.setProperty('--pscale', String(phoneFrameBox.clientWidth / 390));
    }
  };
  new ResizeObserver(scalePhone).observe(phoneFrameBox);

  const openViewer = (slug, title, device) => {
    const isLaptop = device !== 'phone';
    lastFocus = document.activeElement;
    stageLaptop.hidden = !isLaptop;
    stagePhone.hidden = isLaptop;
    const frame = isLaptop ? frames.laptop : frames.phone;
    frame.parentElement.querySelector('.viewer__loader').hidden = false;
    frame.title = 'Maquette ' + title + (isLaptop ? ' : version ordinateur' : ' : version mobile');
    frame.src = '../' + slug + '/';
    urlEl.textContent = 'dumalgo.fr/' + slug + '/';
    titleEl.textContent = title;
    hintEl.textContent = isLaptop
      ? 'Version ordinateur : faites défiler dans l’écran'
      : 'Version mobile : faites défiler dans l’écran';
    viewer.setAttribute('aria-label', 'Aperçu de la maquette ' + title);
    viewer.hidden = false;
    document.body.style.overflow = 'hidden';
    if (!isLaptop) { scalePhone(); requestAnimationFrame(scalePhone); }
    closeBtn.focus();
  };

  const closeViewer = () => {
    viewer.hidden = true;
    frames.laptop.src = 'about:blank';
    frames.phone.src = 'about:blank';
    document.body.style.overflow = '';
    if (lastFocus) lastFocus.focus();
  };

  Object.values(frames).forEach((frame) => {
    frame.addEventListener('load', () => {
      if (frame.src && !frame.src.endsWith('about:blank')) {
        frame.parentElement.querySelector('.viewer__loader').hidden = true;
      }
    });
  });

  viewer.addEventListener('click', (e) => {
    if (!e.target.closest('.viewer__stage') || e.target.closest('.viewer__close')) closeViewer();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !viewer.hidden) closeViewer();
  });

  /* Écrans des cartes + vignettes du pied de page */
  document.querySelectorAll('[data-slug][data-device]').forEach((btn) => {
    btn.addEventListener('click', () => openViewer(btn.dataset.slug, btn.dataset.title, btn.dataset.device));
  });

  /* Démo du héro : rotation des maquettes dans le mini-laptop */
  const shots = [...document.querySelectorAll('.hlap__shot')];
  const heroDemo = document.querySelector('[data-hero-demo]');
  const heroTitle = document.querySelector('[data-hero-title]');
  if (shots.length && heroDemo) {
    let heroIndex = 0;
    const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduceMotion) {
      setInterval(() => {
        shots[heroIndex].classList.remove('is-on');
        heroIndex = (heroIndex + 1) % shots.length;
        shots[heroIndex].classList.add('is-on');
        heroTitle.textContent = shots[heroIndex].dataset.title;
        heroDemo.setAttribute('aria-label', 'Agrandir la maquette ' + shots[heroIndex].dataset.title);
      }, 3500);
    }
    heroDemo.addEventListener('click', () => {
      openViewer(shots[heroIndex].dataset.slug, shots[heroIndex].dataset.title, 'laptop');
    });
  }
}
