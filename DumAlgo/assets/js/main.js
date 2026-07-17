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
document.querySelectorAll('[data-brand]').forEach((el) => { el.textContent = SITE.brand; });
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
const status = form.querySelector('.form-status');

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
      '?subject=' + encodeURIComponent('Demande de projet — ' + data.get('nom')) +
      '&body=' + encodeURIComponent(body);
    status.textContent = 'Votre logiciel de messagerie va s’ouvrir avec le message pré-rempli.';
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
    } else {
      status.textContent = 'Une erreur est survenue. Vous pouvez me joindre directement par téléphone ou email.';
    }
  } catch {
    status.textContent = 'Une erreur est survenue. Vous pouvez me joindre directement par téléphone ou email.';
  }
});
