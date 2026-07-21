/* ==========================================================================
   Configuration centralisée — à compléter avant mise en ligne
   ========================================================================== */
const SITE = {
  brand: 'DumAlgo',            // Nom de marque validé
  phone: '04 11 93 97 53',        // Numéro fixe
  phoneHref: '+33411939753',      // Numéro fixe au format international
  email: 'contact@dumalgo.fr',    // Alias vers alexis.dumas@dumalgo.fr (côté OVH)
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

/* Bouton flottant « retour en haut » : apparaît après environ un écran de
   scroll, s'estompe pendant le scroll actif, pleine opacité à l'arrêt. */
const backToTop = document.querySelector('.back-to-top');
if (backToTop) {
  let idleTimer = 0;
  const syncBackToTop = () => {
    backToTop.classList.toggle('is-visible', window.scrollY > window.innerHeight * 0.9);
  };
  syncBackToTop();
  window.addEventListener('scroll', () => {
    syncBackToTop();
    backToTop.classList.add('is-scrolling');
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => backToTop.classList.remove('is-scrolling'), 160);
  }, { passive: true });
  backToTop.addEventListener('click', () => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  });
}

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
  if (panierSummary()) data.set('selection', panierSummary());

  if (!SITE.formspree) {
    // Endpoint non configuré : repli sur le client mail du visiteur.
    const body = [
      'Nom : ' + data.get('nom'),
      'Email : ' + data.get('email'),
      'Type de projet : ' + (data.get('type_de_projet') || 'Non précisé'),
      panierSummary() ? 'Sélection : ' + panierSummary() : '',
      '',
      data.get('message'),
    ].filter((l, i) => l !== '' || i >= 4).join('\n');
    window.location.href =
      'mailto:' + SITE.email +
      '?subject=' + encodeURIComponent('Demande de projet : ' + data.get('nom')) +
      '&body=' + encodeURIComponent(body);
    status.textContent = 'Votre logiciel de messagerie va s’ouvrir avec le message pré-rempli.' +
      (panierSummary() ? ' Votre sélection (' + panierSummary() + ') est jointe au message.' : '');
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

  /* Même principe pour le laptop : le site est rendu à 1200 px logiques
     (version desktop garantie) puis réduit à la taille du cadre. */
  const laptopFrameBox = viewer.querySelector('.vlaptop__frame');
  const scaleLaptop = () => {
    if (laptopFrameBox.clientWidth > 0) {
      laptopFrameBox.style.setProperty('--lscale', String(laptopFrameBox.clientWidth / 1200));
    }
  };
  new ResizeObserver(scaleLaptop).observe(laptopFrameBox);

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
    viewer.querySelector('[data-viewer-rotate]').hidden = !isLaptop;
    viewer.hidden = false;
    document.body.style.overflow = 'hidden';
    if (!isLaptop) { scalePhone(); requestAnimationFrame(scalePhone); }
    else { scaleLaptop(); requestAnimationFrame(scaleLaptop); }
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

/* ==========================================================================
   v2 — Fiche détail des offres (design « DumAlgo Accueil v2 »)
   ========================================================================== */
const OFFERS = {
  essentiel: { kicker: 'Site vitrine', name: 'Essentiel', price: '489 €', cta: 'Choisir Essentiel', sel: 'offre:essentiel',
    intro: 'Une présence en ligne rapide, propre et professionnelle. L’essentiel, bien fait.',
    inclus: [
      'Site one-page professionnel (ou jusqu’à 3 sections principales : activité, réalisations, contact)',
      'Design personnalisé aux couleurs de votre activité, pas de template générique',
      'Adapté mobile, tablette et ordinateur',
      'Mise en forme de vos textes (à partir des éléments que vous fournissez)',
      'Intégration et optimisation de vos photos (recadrage, compression, chargement rapide)',
      'Formulaire de contact + numéro cliquable depuis mobile',
      'Référencement de base inclus : votre site propre et lisible par Google dès la mise en ligne',
      'Mise en ligne complète, nom de domaine enregistré à votre nom',
      'Maquette gratuite avant engagement + 2 séries d’ajustements après validation',
    ],
    exclus: [
      'Rédaction complète des textes à partir de zéro (option)',
      'Création de logo (option)',
      'Photos professionnelles (option : mise en relation avec un photographe local)',
      'Pages supplémentaires, blog, réservation en ligne, paiement en ligne',
      'Maintenance après livraison (forfaits séparés)',
    ] },
  pro: { kicker: 'Site vitrine', name: 'Pro', price: '989 €', cta: 'Choisir Pro', sel: 'offre:pro',
    intro: 'Un site complet qui met vraiment votre activité en valeur, pensé pour convertir.',
    inclus: [
      'Tout l’Essentiel, plus :',
      'Site multi-pages (jusqu’à 5 à 6 pages : accueil, prestations détaillées, réalisations, à propos, contact...)',
      'Galerie ou portfolio de réalisations (avant/après, chantiers, créations)',
      'Formulaire avancé type demande de devis (champs adaptés à votre métier)',
      'Mise en avant des avis clients',
      'Création ou optimisation de votre fiche Google Business (la carte + les avis dans Google)',
      'Référencement local renforcé : fiche Google Business optimisée, cohérence sur les annuaires, données structurées',
      'Statistiques de visite simples et respectueuses du RGPD (sans bandeau cookies intrusif)',
      '3 séries d’ajustements après validation de la maquette',
    ],
    exclus: [
      'Rédaction complète des textes à partir de zéro (option)',
      'Logo, photos professionnelles (options)',
      'E-commerce, espace client, réservation avec paiement',
      'Maintenance après livraison (forfaits séparés)',
    ] },
  surmesure: { kicker: 'Site vitrine', name: 'Sur-mesure', price: 'Sur devis', cta: 'Demander un devis', sel: 'offre:surmesure',
    intro: 'Périmètre défini ensemble, à partir de votre besoin réel. Quelques exemples de ce qui devient possible :',
    inclus: [
      'Site + outil métier associé (suivi de chantiers, devis, planning, relances)',
      'Réservation en ligne, prise de rendez-vous',
      'Paiement en ligne',
      'Espace client ou espace membre',
      'Reprise/refonte d’un site existant avec migration du domaine',
      'Toute fonctionnalité spécifique issue du diagnostic process',
    ],
    exclus: [
      'Toujours inclus dans un projet sur-mesure :',
      'Cadrage écrit du besoin avant devis (issu du diagnostic si réalisé)',
      'Devis ferme avec délai engagé',
      'Livraison testée et documentée, propriété complète du client',
    ] },
  mEssentiel: { kicker: 'Maintenance & suivi', name: 'Maintenance Essentiel', price: '19 €/mois (annuel) ou 25 €/mois (mensuel)', cta: 'Choisir Essentiel', sel: 'plan:mEssentiel',
    intro: 'Le minimum vital pour un site en bonne santé, sans vous en occuper.',
    inclus: [
      'Hébergement du site inclus',
      'Renouvellement et surveillance du certificat de sécurité (https)',
      'Surveillance de disponibilité : alerte si le site tombe',
      'Sauvegardes mensuelles',
      '1 modification de contenu par mois (non cumulable)',
      'Correction des dysfonctionnements techniques du site livré (hors modifications faites par vos soins)',
      'Support par email sous 5 jours ouvrés',
    ],
    exclus: [
      'Mises à jour techniques régulières',
      'Modifications de contenu supplémentaires',
      'Petites évolutions (section, formulaire, galerie)',
      'Nouvelle page complète, refonte graphique, nouvelle fonctionnalité (devis séparé)',
    ] },
  mConfort: { kicker: 'Maintenance & suivi', name: 'Maintenance Confort', price: '39 €/mois (annuel) ou 49 €/mois (mensuel)', cta: 'Choisir Confort', sel: 'plan:mConfort',
    intro: 'Le bon équilibre : votre site reste à jour, vous gardez la main sans y penser.',
    inclus: [
      'Tout l’Essentiel, plus :',
      'Sauvegardes hebdomadaires',
      'Mises à jour techniques régulières',
      '3 modifications de contenu par mois (non cumulables)',
      'Support prioritaire sous 48 h',
      'Suivi de fréquentation basique + point écrit trimestriel (visites, pages vues, provenance)',
    ],
    exclus: [
      'Modifications de contenu illimitées',
      'Petites évolutions (section, formulaire, galerie)',
      'Nouvelle page complète, refonte graphique, nouvelle fonctionnalité (devis séparé)',
    ] },
  mSerenite: { kicker: 'Maintenance & suivi', name: 'Maintenance Sérénité', price: '79 €/mois (annuel) ou 99 €/mois (mensuel)', cta: 'Choisir Sérénité', sel: 'plan:mSerenite',
    intro: 'Vous ne touchez à rien : je gère votre site comme si c’était le mien.',
    inclus: [
      'Tout le Confort, plus :',
      'Modifications de contenu illimitées (usage raisonnable)',
      'Sauvegardes quotidiennes',
      'Restauration prioritaire en cas de problème (site remis en ligne en priorité absolue)',
      '1 petite évolution incluse par trimestre (jusqu’à 2 h de travail)',
      'Point d’appel mensuel : on fait le tour du site, des stats et des besoins',
      'Recommandations d’amélioration continue (contenus, référencement, conversion)',
    ],
    exclus: [
      'Nouvelle page complète, refonte graphique, nouvelle fonctionnalité (devis séparé)',
      'Rédaction de contenus neufs',
      'Développement d’un nouvel outil métier',
    ] },
  visibilite: { kicker: 'Référencement', name: 'Visibilité', price: '59 €/mois (annuel) ou 69 €/mois (mensuel)', cta: 'Choisir Visibilité', sel: 'seo:visibilite',
    intro: 'Un travail de référencement régulier pour progresser sur Google. Réservé aux clients disposant d’un forfait maintenance actif : le site doit être entretenu pour progresser.',
    inclus: [
      'Chaque mois :',
      'Suivi de vos positions sur Google pour les recherches qui comptent dans votre zone (jusqu’à 10 recherches définies ensemble, ex : « charpentier Clermont-l’Hérault »)',
      'Entretien de votre fiche Google Business : 1 publication par mois, ajout de photos, aide à la réponse aux avis',
      '1 contenu optimisé par mois sur votre site (page locale ou actualité métier, rédigée et mise en ligne)',
      'Corrections techniques de référencement en continu (vitesse, structure, liens cassés)',
      'Rapport écrit trimestriel, en langage clair : vos positions, vos visites, les appels et itinéraires depuis votre fiche Google',
    ],
    exclus: [
      'La publicité payante (Google Ads) : possible sur devis séparé, jamais obligatoire',
      'L’achat de liens ou les techniques risquées qui peuvent faire pénaliser un site',
      'Une position garantie : personne ne peut promettre la première place sur Google, et quiconque le promet vous ment. Je m’engage sur le travail et la transparence des résultats, pas sur un rang.',
    ] },
};

const offerViewer = document.getElementById('offer-viewer');
let currentDetail = null;

const closeDetail = () => {
  offerViewer.hidden = true;
  currentDetail = null;
  document.body.style.overflow = '';
};

const openDetail = (key) => {
  const d = OFFERS[key];
  if (!d) return;
  currentDetail = key;
  offerViewer.querySelector('[data-offer-kicker]').textContent = d.kicker;
  offerViewer.querySelector('[data-offer-name]').textContent = d.name;
  offerViewer.querySelector('[data-offer-price]').textContent = d.price;
  offerViewer.querySelector('[data-offer-intro]').textContent = d.intro;
  const fill = (sel, items) => {
    const ul = offerViewer.querySelector(sel);
    ul.textContent = '';
    items.forEach((t) => { const li = document.createElement('li'); li.textContent = t; ul.append(li); });
  };
  fill('[data-offer-inclus]', d.inclus);
  fill('[data-offer-exclus]', d.exclus);
  offerViewer.querySelector('[data-offer-choose]').textContent = d.cta;
  offerViewer.hidden = false;
  document.body.style.overflow = 'hidden';
  offerViewer.querySelector('.viewer__close').focus();
};

document.querySelectorAll('[data-detail]').forEach((btn) =>
  btn.addEventListener('click', () => openDetail(btn.dataset.detail))
);
offerViewer.addEventListener('click', (e) => {
  if (!e.target.closest('.offer-modal') || e.target.closest('.viewer__close') || e.target.closest('[data-offer-close]')) closeDetail();
});
offerViewer.querySelector('[data-offer-choose]').addEventListener('click', () => {
  if (currentDetail) setSelection(OFFERS[currentDetail].sel, true);
  closeDetail();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !offerViewer.hidden) closeDetail();
});

/* ==========================================================================
   v2 — Sélection d'offres (panier joint au message de contact)
   ========================================================================== */
const PANIER_LABELS = {
  'offre:essentiel': { label: 'Site vitrine Essentiel', price: () => '489 €' },
  'offre:pro': { label: 'Site vitrine Pro', price: () => '989 €' },
  'offre:surmesure': { label: 'Site sur-mesure', price: () => 'Sur devis' },
  'plan:mEssentiel': { label: 'Maintenance Essentiel', prices: { annuel: 19, mensuel: 25 } },
  'plan:mConfort': { label: 'Maintenance Confort', prices: { annuel: 39, mensuel: 49 } },
  'plan:mSerenite': { label: 'Maintenance Sérénité', prices: { annuel: 79, mensuel: 99 } },
  'seo:visibilite': { label: 'Référencement Visibilité', prices: { annuel: 59, mensuel: 69 } },
};
const selection = { offre: null, plan: null, seo: null };
const panierEl = document.getElementById('panier');

const currentBilling = () => {
  const active = document.querySelector('.billing-toggle__btn.is-active');
  return active ? active.dataset.billing : 'annuel';
};

function panierEntry(key) {
  const def = PANIER_LABELS[key];
  const billing = currentBilling();
  if (def.prices) {
    return {
      label: def.label + (billing === 'annuel' ? ' (annuel)' : ' (mensuel)'),
      price: def.prices[billing] + ' €/mois',
    };
  }
  return { label: def.label, price: def.price() };
}

function panierSummary() {
  return ['offre', 'plan', 'seo']
    .filter((t) => selection[t])
    .map((t) => { const e = panierEntry(t + ':' + selection[t]); return e.label + ' : ' + e.price; })
    .join(' + ');
}

function renderPanier() {
  const keys = ['offre', 'plan', 'seo'].filter((t) => selection[t]).map((t) => t + ':' + selection[t]);
  panierEl.hidden = keys.length === 0;
  const lines = panierEl.querySelector('[data-panier-lines]');
  lines.textContent = '';
  keys.forEach((key) => {
    const e = panierEntry(key);
    const li = document.createElement('li');
    const label = document.createElement('span'); label.className = 'panier__label'; label.textContent = e.label;
    const price = document.createElement('span'); price.className = 'panier__price'; price.textContent = e.price;
    const rm = document.createElement('button'); rm.type = 'button'; rm.className = 'panier__remove'; rm.textContent = 'Retirer';
    rm.addEventListener('click', () => setSelection(key, false));
    li.append(label, price, rm);
    lines.append(li);
  });
  panierEl.querySelector('[data-panier-total]').textContent = keys.map((k) => panierEntry(k).price).join(' + ');
  document.querySelectorAll('[data-select]').forEach((btn) => {
    const [type, key] = btn.dataset.select.split(':');
    const active = selection[type] === key;
    btn.classList.toggle('is-selected', active);
    btn.closest('.price-card').classList.toggle('is-selected', active);
    if (!btn.dataset.ctaDefault) btn.dataset.ctaDefault = btn.textContent;
    btn.textContent = active ? '✓ Sélectionné' : btn.dataset.ctaDefault;
  });
}

function setSelection(fullKey, forceOn) {
  const [type, key] = fullKey.split(':');
  selection[type] = forceOn ? key : (selection[type] === key && forceOn === undefined ? null : (forceOn === false ? null : key));
  renderPanier();
}

document.querySelectorAll('[data-select]').forEach((btn) =>
  btn.addEventListener('click', () => setSelection(btn.dataset.select))
);
billingButtons.forEach((btn) => btn.addEventListener('click', renderPanier));

/* ==========================================================================
   v2 — Visionneuse en mode image (captures Symbolea)
   ========================================================================== */
const viewerEl = document.getElementById('viewer');
if (viewerEl) {
  const imgEls = {
    laptop: viewerEl.querySelector('[data-viewer-img="laptop"]'),
    phone: viewerEl.querySelector('[data-viewer-img="phone"]'),
  };
  const frameEls = {
    laptop: viewerEl.querySelector('[data-viewer-frame="laptop"]'),
    phone: viewerEl.querySelector('[data-viewer-frame="phone"]'),
  };
  const setImageMode = (on) => {
    Object.keys(imgEls).forEach((k) => {
      imgEls[k].hidden = true;
      frameEls[k].style.display = on ? 'none' : '';
    });
  };
  /* Les boutons iframe classiques repassent en mode site */
  document.querySelectorAll('[data-slug][data-device]').forEach((btn) =>
    btn.addEventListener('click', () => setImageMode(false), true)
  );
  /* Boutons image (teaser Symbolea) */
  document.querySelectorAll('[data-img][data-device]').forEach((btn) =>
    btn.addEventListener('click', () => {
      const device = btn.dataset.device;
      const isLaptop = device !== 'phone';
      setImageMode(true);
      imgEls[device].hidden = false;
      imgEls[device].src = btn.dataset.img;
      viewerEl.querySelector('.vlaptop').hidden = !isLaptop;
      viewerEl.querySelector('.vphone').hidden = isLaptop;
      viewerEl.querySelectorAll('.viewer__loader').forEach((l) => { l.hidden = true; });
      viewerEl.querySelector('[data-viewer-url]').textContent = btn.dataset.url || '';
      viewerEl.querySelector('[data-viewer-title]').textContent = btn.dataset.title;
      viewerEl.querySelector('[data-viewer-hint]').textContent = isLaptop
        ? 'Version ordinateur : faites défiler dans l’écran'
        : 'Version mobile : faites défiler dans l’écran';
      viewerEl.querySelector('[data-viewer-rotate]').hidden = !isLaptop;
      viewerEl.setAttribute('aria-label', 'Aperçu de ' + btn.dataset.title);
      viewerEl.hidden = false;
      document.body.style.overflow = 'hidden';
      viewerEl.querySelector('.viewer__close').focus();
    })
  );
}
