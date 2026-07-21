/* ==========================================================================
   Auto-diagnostic « Optimisation & process »
   Wizard pas-à-pas, scoring des gisements, restitution, envoi de la synthèse
   par email via l'endpoint maison (SITE.formEndpoint, api/contact.php).
   JS vanilla — s'appuie sur SITE (défini dans main.js, chargé avant ce script)
   et sur les mêmes conventions visuelles que le reste du site.
   ========================================================================== */
(function () {
  'use strict';

  const root = document.getElementById('diagnostic-app');
  if (!root) return;

  const STORAGE_KEY = 'dumalgo-diagnostic-optimisation';

  /* SITE est déclaré en `const` au niveau racine de main.js : cette liaison
     n'est pas attachée à `window`, mais reste accessible comme identifiant
     partagé entre scripts classiques du même document (main.js est chargé
     avant ce fichier). On y accède via un accesseur défensif pour ne pas
     provoquer de ReferenceError si l'ordre de chargement changeait. */
  function getSite() {
    try {
      // eslint-disable-next-line no-undef
      return typeof SITE !== 'undefined' ? SITE : null;
    } catch {
      return null;
    }
  }

  /* ------------------------------------------------------------------------
     Les 13 questions — textes repris mot à mot de diagnostic-optimisation-spec.md
     ------------------------------------------------------------------------ */
  const STEP_LABELS = {
    1: 'Votre structure',
    2: 'Vos journées, concrètement',
    3: 'Votre environnement',
  };

  const QUESTIONS = [
    {
      id: 'q1', step: 1,
      title: 'Votre activité, c’est plutôt…',
      options: [
        { label: 'BTP / second œuvre / chantiers' },
        { label: 'Services techniques, maintenance, interventions' },
        { label: 'Atelier / production / industrie' },
        { label: 'Négoce / distribution / commerce' },
        { label: 'Bureau d’études / cabinet / prestations intellectuelles' },
        { label: 'Autre' },
      ],
    },
    {
      id: 'q2', step: 1,
      title: 'Vous êtes combien à faire tourner la structure ?',
      options: [
        { label: '5 à 10' },
        { label: '11 à 20' },
        { label: '21 à 40' },
        { label: '41 à 60' },
        { label: 'Plus de 60' },
      ],
    },
    {
      id: 'q3', step: 1,
      title: 'Et vous, dans tout ça ?',
      options: [
        { label: 'Dirigeant(e)' },
        { label: 'Responsable de service / d’équipe' },
        { label: 'Administratif / ADV / compta' },
        { label: 'Autre' },
      ],
    },
    {
      id: 'q4', step: 2, gisement: 'ressaisie',
      title: 'Une même information client (coordonnées, demande, devis…) est saisie combien de fois entre le premier contact et la facture ?',
      options: [
        { label: 'Une fois — tout est relié', points: 0 },
        { label: 'Deux fois — une petite ressaisie au passage', points: 1 },
        { label: 'Trois fois — devis, suivi, facturation, chacun son fichier', points: 2 },
        { label: 'Honnêtement, je ne compte plus', points: 3 },
      ],
    },
    {
      id: 'q5', step: 2, gisement: 'terrain',
      title: 'Comment vos équipes terrain (techniciens, poseurs, commerciaux…) remontent-elles leurs comptes-rendus ou bons d’intervention ?',
      options: [
        { label: 'Dans un outil dédié, visible du bureau en temps réel', points: 0 },
        { label: 'Par formulaire ou photos à peu près structurés', points: 1 },
        { label: 'Par SMS, appels et photos éparpillées', points: 2 },
        { label: 'Sur papier, ressaisi (ou perdu) au bureau — ou pas de remontée formalisée', points: 3 },
        { label: 'Pas d’équipe terrain', points: 0, noTerrain: true },
      ],
    },
    {
      id: 'q6', step: 2, gisement: 'planning',
      title: 'Votre planning d’équipe, il vit où ?',
      options: [
        { label: 'Dans un outil que chacun consulte, y compris en déplacement', points: 0 },
        { label: 'Dans un agenda partagé, à peu près à jour', points: 1 },
        { label: 'Dans un Excel tenu par une seule personne', points: 2 },
        { label: 'Sur un tableau mural, ou dans la tête de quelqu’un', points: 3 },
      ],
    },
    {
      id: 'q7', step: 2, gisement: 'planning',
      title: 'Quand une urgence bouscule le planning, ça se passe comment ?',
      options: [
        { label: 'On réorganise dans l’outil, tout le monde voit la mise à jour', points: 0 },
        { label: 'Quelques coups de fil et ça repart', points: 1 },
        { label: 'Cascade d’appels et de SMS, avec des ratés de temps en temps', points: 2 },
        { label: 'Doublons, oublis, clients pas prévenus : ça arrive plus souvent qu’on ne voudrait', points: 3 },
      ],
    },
    {
      id: 'q8', step: 2, gisement: 'pilotage',
      title: 'Pour savoir où en est votre activité ce mois-ci (chiffre, carnet de commandes, retards de paiement), vous faites comment ?',
      options: [
        { label: 'J’ouvre mon tableau de bord, c’est à jour', points: 0 },
        { label: 'Je compile moi-même quelques fichiers quand je trouve le temps', points: 2 },
        { label: 'Je demande à la compta, ou j’attends le passage de l’expert-comptable', points: 3 },
        { label: 'Au feeling — et le feeling se trompe parfois', points: 3 },
      ],
    },
    {
      id: 'q9', step: 2, gisement: 'dependance',
      title: 'Y a-t-il une tâche importante qu’une seule personne sait faire chez vous ?',
      options: [
        { label: 'Non, l’essentiel est documenté et partagé', points: 0 },
        { label: 'Une ou deux, rien de bloquant', points: 1 },
        { label: 'Oui, plusieurs — on croise les doigts pendant les congés', points: 2 },
        { label: 'Oui, et quand cette personne est absente, ça bloque vraiment', points: 3 },
      ],
    },
    {
      id: 'q10', step: 2, calc: true,
      title: 'À l’échelle de toute votre équipe, combien d’heures par semaine partent dans des tâches sans valeur ajoutée — ressaisies, recherches d’info, coordination, « c’est qui qui a le fichier ? » ?',
      options: [
        { label: 'Moins de 2 h', hours: 1 },
        { label: '2 à 5 h', hours: 3.5 },
        { label: '5 à 15 h', hours: 10 },
        { label: 'Plus de 15 h', hours: 20 },
        { label: 'Aucune idée — et c’est peut-être ça le problème', hours: null },
      ],
    },
    {
      id: 'q11', step: 3, gisement: 'ressaisie',
      title: 'Aujourd’hui, votre organisation repose surtout sur…',
      options: [
        { label: 'Un logiciel métier / ERP bien adopté par les équipes', points: 0 },
        { label: 'Un logiciel métier… que tout le monde contourne', points: 2 },
        { label: 'Excel + mails + bonne volonté', points: 2 },
        { label: 'Papier, Excel et mémoire des anciens', points: 3 },
      ],
    },
    {
      id: 'q12', step: 3,
      title: 'Avez-vous déjà tenté de vous outiller sur ces sujets ?',
      options: [
        { label: 'Jamais vraiment : pas le temps de s’y pencher' },
        { label: 'Oui, mais l’outil du marché était trop rigide ou trop cher pour ce qu’on en faisait' },
        { label: 'Oui, mais les équipes ne l’ont pas adopté' },
        { label: 'Oui, et certains outils tournent bien — il reste des trous' },
      ],
    },
    {
      id: 'q13', step: 3,
      title: 'Et ce sujet, aujourd’hui, c’est…',
      options: [
        { label: 'Un irritant de fond, on vit avec' },
        { label: 'Une vraie priorité de l’année' },
        { label: 'Urgent : on y perd des clients ou des nerfs' },
        { label: 'De la curiosité — je fais le point' },
      ],
    },
  ];

  const GISEMENT_MAX = { ressaisie: 6, terrain: 3, planning: 6, pilotage: 3, dependance: 3 };
  const PRIORITY = ['ressaisie', 'terrain', 'planning', 'pilotage', 'dependance'];
  const THRESHOLD = 0.34;

  const GISEMENT_BLOCKS = {
    ressaisie: {
      num: '①', title: 'Ressaisie — La même information, saisie trois fois',
      text: 'Chez vous, une information fait le tour des bureaux en se refaisant taper à chaque étape : le devis dans un fichier, le suivi dans un autre, la facturation dans un troisième. Chaque ressaisie coûte du temps, et glisse une occasion d’erreur qui se paie plus tard : mauvais tarif, mauvaise adresse, relance oubliée. C’est le gisement le plus fréquent en PME, et souvent le plus rentable à traiter : une donnée saisie une fois, qui circule toute seule.',
      link: 'Voir l’exemple « La ressaisie inter-services » plus haut.',
    },
    terrain: {
      num: '②', title: 'Terrain↔bureau — Le bureau court après l’info du terrain',
      text: 'Vos équipes terrain savent ce qui a été fait ; votre bureau l’apprend trop tard, par papier, SMS ou mémoire. Résultat : facturation qui attend, litiges sans preuve, et des allers-retours téléphoniques qui usent tout le monde. J’ai passé quinze ans dans des services techniques : ce fossé-là, je l’ai vécu des deux côtés. C’est aussi l’un des plus simples à outiller : une saisie sur place, dans le téléphone, rattachée à l’intervention.',
      link: 'Voir l’exemple « Bons d’intervention & planning » plus haut.',
    },
    planning: {
      num: '③', title: 'Planning — Un planning que personne ne voit vraiment',
      text: 'Votre planning existe, mais il vit à un seul endroit : un mur, un Excel, une tête. Chaque changement déclenche sa cascade d’appels, et chaque absence de l’info son lot de doublons et d’oublis. Un planning partagé, visible du terrain comme du bureau, et relié à ce qui est réellement fait : c’est l’outil que je voulais déjà construire quand j’étais chargé d’affaires. Aujourd’hui, je le construis.',
      link: 'Voir l’exemple « Bons d’intervention & planning » plus haut.',
    },
    pilotage: {
      num: '④', title: 'Pilotage — Piloter au rétroviseur',
      text: 'Vous dirigez, mais les chiffres qui devraient éclairer vos décisions arrivent en retard, éparpillés, ou compilés à la main quand le temps le permet. Vous décidez donc au feeling — et le feeling est bon, jusqu’au jour où il ne l’est pas. Un tableau de bord qui agrège ce qui existe déjà (facturation, banque, carnet de commandes) ne demande pas de tout changer : il rend visible ce qui est déjà là.',
      link: 'Voir l’exemple « Piloter sans attendre l’expert-comptable » plus haut.',
    },
    dependance: {
      num: '⑤', title: 'Dépendance-clé — Tout repose sur une personne',
      text: 'Une partie de votre fonctionnement tient parce qu’une personne précise sait le faire. Elle seule. Congés, arrêt, départ : le risque est connu, et repoussé. Outiller un process, c’est aussi le documenter en le construisant : l’outil embarque la méthode, et la connaissance cesse d’être un point de fragilité. C’est souvent le gisement le moins visible au quotidien, et le plus dangereux à long terme.',
      link: null,
    },
  };

  /* ------------------------------------------------------------------------
     État
     ------------------------------------------------------------------------ */
  let state = loadState() || { index: 0, answers: {}, finished: false, result: null };

  function loadState() {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function saveState() {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* stockage indisponible : on continue sans persistance */
    }
  }

  /* ------------------------------------------------------------------------
     Scoring
     ------------------------------------------------------------------------ */
  function computeScores(answers) {
    const raw = { ressaisie: 0, terrain: 0, planning: 0, pilotage: 0, dependance: 0 };
    let terrainNeutralized = false;

    QUESTIONS.forEach((q) => {
      if (!q.gisement) return;
      const answerIndex = answers[q.id];
      if (answerIndex == null) return;
      const opt = q.options[answerIndex];
      if (opt.noTerrain) { terrainNeutralized = true; return; }
      raw[q.gisement] += opt.points;
    });

    const normalized = {};
    Object.keys(raw).forEach((k) => { normalized[k] = raw[k] / GISEMENT_MAX[k]; });

    return { raw, normalized, terrainNeutralized };
  }

  function rankGisements(normalized, terrainNeutralized) {
    let candidates = PRIORITY.filter((k) => !(k === 'terrain' && terrainNeutralized));
    candidates = candidates.map((k) => ({ key: k, score: normalized[k] }));
    candidates = candidates.filter((c) => c.score > THRESHOLD);
    candidates.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return PRIORITY.indexOf(a.key) - PRIORITY.indexOf(b.key);
    });
    return candidates.slice(0, 2).map((c) => c.key);
  }

  function computeCost(answers) {
    const answerIndex = answers.q10;
    if (answerIndex == null) return null;
    const opt = QUESTIONS.find((q) => q.id === 'q10').options[answerIndex];
    if (opt.hours == null) return { unknown: true };
    const perYear = Math.round((opt.hours * 45 * 30) / 100) * 100;
    return { unknown: false, hours: opt.hours, perYear };
  }

  /* ------------------------------------------------------------------------
     Rendu — wizard
     ------------------------------------------------------------------------ */
  function render() {
    root.innerHTML = '';
    if (state.finished && state.result) {
      root.appendChild(buildRestitution(state.result));
      return;
    }
    root.appendChild(buildWizard());
  }

  function buildWizard() {
    const q = QUESTIONS[state.index];
    const total = QUESTIONS.length;
    const progressPct = Math.round(((state.index) / total) * 100);

    const wrap = document.createElement('div');
    wrap.className = 'card wizard';
    wrap.setAttribute('role', 'group');
    wrap.setAttribute('aria-label', 'Auto-diagnostic, question ' + (state.index + 1) + ' sur ' + total);

    const progress = document.createElement('div');
    progress.className = 'wizard__progress';
    progress.setAttribute('aria-hidden', 'true');
    const bar = document.createElement('div');
    bar.className = 'wizard__progress-bar';
    bar.style.width = progressPct + '%';
    progress.appendChild(bar);
    wrap.appendChild(progress);

    const meta = document.createElement('p');
    meta.className = 'wizard__meta';
    meta.textContent = 'Question ' + (state.index + 1) + ' / ' + total + ' · Étape ' + q.step + ' : ' + STEP_LABELS[q.step];
    wrap.appendChild(meta);

    const title = document.createElement('h3');
    title.className = 'wizard__question-title';
    title.id = 'wizard-question-title';
    title.textContent = q.title;
    wrap.appendChild(title);

    const list = document.createElement('ul');
    list.className = 'wizard__options';
    list.setAttribute('role', 'radiogroup');
    list.setAttribute('aria-labelledby', 'wizard-question-title');

    q.options.forEach((opt, i) => {
      const li = document.createElement('li');
      li.className = 'wizard__option';

      const label = document.createElement('label');
      label.className = 'wizard__option-label';
      if (state.answers[q.id] === i) label.classList.add('is-selected');

      const input = document.createElement('input');
      input.type = 'radio';
      input.name = 'wizard-' + q.id;
      input.value = String(i);
      if (state.answers[q.id] === i) input.checked = true;
      input.addEventListener('change', () => selectAnswer(q, i));

      const mark = document.createElement('span');
      mark.className = 'wizard__option-mark';
      mark.setAttribute('aria-hidden', 'true');

      const text = document.createElement('span');
      text.className = 'wizard__option-text';
      text.textContent = opt.label;

      label.append(input, mark, text);
      li.appendChild(label);
      list.appendChild(li);
    });

    wrap.appendChild(list);

    const nav = document.createElement('div');
    nav.className = 'wizard__nav';

    const backBtn = document.createElement('button');
    backBtn.type = 'button';
    backBtn.className = 'btn btn--ghost wizard__back';
    backBtn.textContent = 'Retour';
    backBtn.disabled = state.index === 0;
    backBtn.addEventListener('click', goBack);
    nav.appendChild(backBtn);

    if (state.index === total - 1) {
      const submitBtn = document.createElement('button');
      submitBtn.type = 'button';
      submitBtn.className = 'btn btn--primary wizard__submit';
      submitBtn.textContent = 'Voir mes gisements d’optimisation';
      submitBtn.disabled = state.answers[q.id] == null;
      submitBtn.addEventListener('click', finish);
      nav.appendChild(submitBtn);
    }

    wrap.appendChild(nav);

    /* Navigation clavier : flèches gauche/droite en plus de la navigation
       native des boutons radio (tab, flèches haut/bas, espace). */
    wrap.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft' && state.index > 0) {
        e.preventDefault();
        goBack();
      } else if (e.key === 'ArrowRight' && state.answers[q.id] != null && state.index < total - 1) {
        e.preventDefault();
        goNext();
      }
    });

    return wrap;
  }

  function selectAnswer(q, i) {
    state.answers[q.id] = i;
    saveState();
    const isLast = state.index === QUESTIONS.length - 1;
    if (!isLast) {
      // Petit délai pour laisser voir la sélection avant d'avancer.
      setTimeout(() => { goNext(); }, 280);
      render();
    } else {
      render();
    }
  }

  function goNext() {
    if (state.index < QUESTIONS.length - 1) {
      state.index += 1;
      saveState();
      render();
      focusQuestionTitle();
    }
  }

  function goBack() {
    if (state.index > 0) {
      state.index -= 1;
      saveState();
      render();
      focusQuestionTitle();
    }
  }

  function focusQuestionTitle() {
    const el = document.getElementById('wizard-question-title');
    if (el) {
      el.setAttribute('tabindex', '-1');
      el.focus({ preventScroll: true });
    }
  }

  /* ------------------------------------------------------------------------
     Fin du questionnaire : scoring et restitution.
     Les réponses restent dans le navigateur — rien n'est transmis sans
     action explicite du visiteur (promesse de la page et des mentions
     légales) : seul l'envoi volontaire de la synthèse (buildEmailCapture)
     et le formulaire de contact quittent le poste.
     ------------------------------------------------------------------------ */
  function finish() {
    const { normalized, terrainNeutralized } = computeScores(state.answers);
    const retained = rankGisements(normalized, terrainNeutralized);
    const cost = computeCost(state.answers);

    state.result = { retained, cost, normalized };
    state.finished = true;
    saveState();
    render();

    const restitutionEl = root.querySelector('.restitution');
    if (restitutionEl) restitutionEl.focus({ preventScroll: false });
  }

  /* ------------------------------------------------------------------------
     Rendu — restitution
     ------------------------------------------------------------------------ */
  function buildRestitution(result) {
    const wrap = document.createElement('div');
    wrap.className = 'restitution';
    wrap.setAttribute('aria-live', 'polite');
    wrap.setAttribute('tabindex', '-1');

    const title = document.createElement('h3');
    title.className = 'wizard__question-title';
    title.textContent = 'Vos gisements d’optimisation probables';
    wrap.appendChild(title);

    const chapeau = document.createElement('p');
    chapeau.className = 'restitution__chapeau';
    chapeau.textContent = result.retained.length === 0
      ? 'Un diagnostic honnête ne se fait pas derrière un écran, mais d’après vos réponses, voici déjà une lecture franche de votre situation.'
      : 'D’après vos réponses, voici où votre structure perd vraisemblablement le plus. « Probables », parce qu’un diagnostic honnête ne se fait pas derrière un écran : il se confirme en observant le travail réel. C’est l’objet de l’échange offert.';
    wrap.appendChild(chapeau);

    if (result.retained.length === 0) {
      const bloc = document.createElement('div');
      bloc.className = 'card restitution__bloc';
      const p = document.createElement('p');
      p.className = 'restitution__bloc-text';
      p.innerHTML = '<strong>Bonne nouvelle : rien d’alarmant.</strong> D’après vos réponses, votre structure est plutôt bien organisée : peu de frictions majeures détectées, et ce diagnostic n’a pas vocation à en inventer. Si un point vous chiffonne malgré tout, ou si vous voulez un regard extérieur sur un sujet précis, l’échange offert reste ouvert. Et si un outil ne se justifie pas, je vous le dirai aussi.';
      bloc.appendChild(p);
      wrap.appendChild(bloc);
    } else {
      const blocs = document.createElement('div');
      blocs.className = 'restitution__blocs';
      result.retained.forEach((key) => {
        const g = GISEMENT_BLOCKS[key];
        const bloc = document.createElement('div');
        bloc.className = 'card restitution__bloc';

        const num = document.createElement('span');
        num.className = 'restitution__bloc-num';
        num.textContent = g.num;
        bloc.appendChild(num);

        const h4 = document.createElement('h4');
        h4.className = 'restitution__bloc-title';
        h4.textContent = g.title;
        bloc.appendChild(h4);

        const p = document.createElement('p');
        p.className = 'restitution__bloc-text';
        p.textContent = g.text;
        bloc.appendChild(p);

        if (g.link) {
          const a = document.createElement('a');
          a.href = '#exemples';
          a.textContent = g.link;
          const pLink = document.createElement('p');
          pLink.className = 'restitution__bloc-text';
          pLink.appendChild(a);
          bloc.appendChild(pLink);
        }

        blocs.appendChild(bloc);
      });
      wrap.appendChild(blocs);
    }

    if (result.cost) {
      const chiffre = document.createElement('div');
      chiffre.className = 'restitution__chiffre';
      if (result.cost.unknown) {
        const p = document.createElement('p');
        p.textContent = 'Vous ne savez pas combien d’heures partent en frictions chaque semaine. C’est le premier chiffre qu’un audit met sur la table.';
        chiffre.appendChild(p);
      } else {
        const p1 = document.createElement('p');
        p1.innerHTML = 'Vous estimez vous-même perdre environ <strong>' + result.cost.hours + ' h par semaine</strong>. À l’échelle de votre équipe, c’est de l’ordre de :';
        const value = document.createElement('p');
        value.className = 'restitution__chiffre-value';
        value.textContent = result.cost.perYear.toLocaleString('fr-FR') + ' € par an';
        const p2 = document.createElement('p');
        p2.className = 'restitution__chiffre-note';
        p2.textContent = '(base 45 semaines, 30 € /h chargé). Un ordre de grandeur, rien de plus. Mais il vient de vos chiffres, pas des miens.';
        chiffre.append(p1, value, p2);
      }
      wrap.appendChild(chiffre);
    }

    const cta = document.createElement('div');
    cta.className = 'restitution__cta';
    const ctaBtn = document.createElement('a');
    ctaBtn.className = 'btn btn--primary';
    ctaBtn.href = '#contact';
    ctaBtn.id = 'restitution-cta';
    ctaBtn.textContent = 'Approfondir en 30 min — offert';
    ctaBtn.addEventListener('click', () => prefillContact(result));
    const note = document.createElement('p');
    note.className = 'restitution__cta-note';
    note.textContent = 'Ensuite, si ça se justifie : audit sur site à partir de 890 €, intégralement déduit si vous me confiez la réalisation.';
    cta.append(ctaBtn, note);
    wrap.appendChild(cta);

    wrap.appendChild(buildEmailCapture());

    return wrap;
  }

  function buildEmailCapture() {
    const box = document.createElement('div');
    box.className = 'restitution__email';

    const label = document.createElement('label');
    label.setAttribute('for', 'diagnostic-email');
    label.textContent = 'Recevez cette synthèse par email, et gardez-la sous la main pour notre échange.';
    box.appendChild(label);

    const row = document.createElement('div');
    row.className = 'restitution__email-row';
    const input = document.createElement('input');
    input.type = 'email';
    input.id = 'diagnostic-email';
    input.placeholder = 'vous@structure.fr';
    input.autocomplete = 'email';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn btn--ghost';
    btn.textContent = 'Envoyer';
    row.append(input, btn);
    box.appendChild(row);

    const status = document.createElement('p');
    status.className = 'restitution__email-status';
    status.setAttribute('role', 'status');
    box.appendChild(status);

    btn.addEventListener('click', () => {
      const email = input.value.trim();
      if (!email) {
        status.textContent = 'Merci de renseigner un email.';
        return;
      }
      const site = getSite();
      if (!site || !site.formEndpoint) {
        console.warn('[diagnostic] SITE.formEndpoint non configuré : envoi de la synthèse ignoré.');
        status.textContent = 'Synthèse notée — je reviendrai vers vous directement.';
        return;
      }
      const data = new FormData();
      data.set('form_name', 'diagnostic-optimisation-synthese');
      data.set('email', email);
      data.set('gisements_retenus', (state.result.retained || []).map((k) => GISEMENT_BLOCKS[k].title).join(' + ') || 'Peu de frictions détectées');
      fetch(site.formEndpoint, { method: 'POST', body: data, headers: { Accept: 'application/json' } })
        .then((res) => {
          status.textContent = res.ok
            ? 'Merci, la synthèse vous sera envoyée.'
            : 'Une erreur est survenue, réessayez plus tard.';
        })
        .catch(() => { status.textContent = 'Une erreur est survenue, réessayez plus tard.'; });
    });

    return box;
  }

  function prefillContact(result) {
    const select = document.getElementById('f-type');
    if (select) select.value = 'Diagnostic optimisation';

    const textarea = document.getElementById('f-message');
    if (textarea && !textarea.value) {
      const names = (result.retained || []).map((k) => GISEMENT_BLOCKS[k].title.split(' — ')[0]);
      const gisementsPhrase = names.length
        ? 'D’après le diagnostic en ligne, mes deux gisements probables sont : ' + names.join(' et ') + '. '
        : 'D’après le diagnostic en ligne, ma structure semble plutôt bien organisée, mais je veux un avis extérieur. ';
      textarea.value = gisementsPhrase + 'Je souhaite approfondir cela lors de l’échange offert de 30 minutes.';
    }
  }

  /* ------------------------------------------------------------------------
     Initialisation
     ------------------------------------------------------------------------ */
  render();
})();
