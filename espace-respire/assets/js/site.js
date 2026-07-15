// Menu mobile
(function () {
  var burger = document.querySelector('.burger');
  var nav = document.getElementById('nav');
  if (!burger || !nav) return;
  burger.addEventListener('click', function () {
    var ouvert = nav.classList.toggle('ouverte');
    burger.setAttribute('aria-expanded', ouvert ? 'true' : 'false');
    burger.setAttribute('aria-label', ouvert ? 'Fermer le menu' : 'Ouvrir le menu');
  });
  nav.addEventListener('click', function (e) {
    if (e.target.tagName === 'A') {
      nav.classList.remove('ouverte');
      burger.setAttribute('aria-expanded', 'false');
    }
  });
})();

// Bascule typo A/B (maquette uniquement)
(function () {
  var btn = document.querySelector('.bascule-typo');
  if (!btn) return;
  var label = btn.querySelector('[data-typo-label]');
  function maj() {
    label.textContent = document.documentElement.classList.contains('typo-b') ? 'B' : 'A';
  }
  maj();
  btn.addEventListener('click', function () {
    var b = document.documentElement.classList.toggle('typo-b');
    try { localStorage.setItem('er-typo', b ? 'b' : 'a'); } catch (e) {}
    maj();
  });
})();

// Formulaire de démonstration : pas d'envoi réel
(function () {
  var form = document.querySelector('.formulaire');
  if (!form) return;
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var note = form.querySelector('.formulaire-note');
    if (note) note.textContent = 'Formulaire de démonstration : l’envoi sera activé avec la mise en ligne du site.';
  });
})();
