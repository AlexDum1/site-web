# Compte rendu de session — 21 juillet 2026

**Chantier : offre « Optimisation & process » pour les PME · DumAlgo**

## Point de départ

Constat d'Alexis : les cas d'exemple du site parlent trop aux artisans et pas assez
aux structures plus grosses, alors que ce sont elles qui ont le plus fort besoin
d'optimisation. Idée complémentaire : un formulaire soigné pour aider les prospects
à mettre le doigt sur leurs frictions.

## Décisions prises (session de grilling)

| Sujet | Décision |
|---|---|
| Cible | PME de 15 à 60 salariés (TPE structurées en continuité) |
| Architecture | Page dédiée `optimisation.html`, nav « Optimisation & process » ; la home garde son identité artisan |
| Routage home | Entrée de nav + bandeau de réorientation sous le hero (« Vous dirigez une équipe de 10 à 60 personnes ? ») |
| Exemples | 3 flows : bons d'intervention ↔ planning (vécu BTP/services d'Alexis, flow vedette), ressaisie inter-services, pilotage à l'aveugle |
| Méthode | Triade « J'observe, j'analyse, je construis » (la home garde « on identifie ») |
| Offre | Escalier : auto-diagnostic gratuit → échange offert 30 min → audit à partir de 890 € intégralement déduit si réalisation → outils |
| Formulaire | 13 questions comportementales, wizard pas-à-pas, scoring sur 5 gisements, restitution immédiate **sans email obligatoire**, chiffre €/an calculé depuis leur propre estimation |

## Réalisé

1. **Spécification du questionnaire** — `docs/diagnostic-optimisation-spec.md`
   (questions mot à mot, barème, 5 blocs de restitution, cas « peu de frictions »).
2. **Contenu rédigé de la page** — `docs/optimisation-page-contenu.md`
   (9 sections, cadre PAS sans pression artificielle, FAQ des objections PME).
3. **Construction** — `optimisation.html` (476 l.), `assets/js/diagnostic.js`
   (~650 l., wizard + scoring + Formspree + accessibilité), `assets/css/optimisation.css`.
4. **Retouches home** — nav, bandeau PME, Schema.org.
5. **Charte « fiche devis » 06.3** (importée du projet Claude Design
   « Propositions de chartes graphiques ») appliquée à **toutes les cartes du site** :
   papier millimétré vert 24 px, bordure `#D9D0BC`, encres document, en-têtes mono
   soulignés en pointillés. Le variant sombre `data-cartes="panneau"` de la home
   a été retiré.

## Tests effectués

- Parcours complet des 13 questions simulé en headless Chrome, deux profils :
  frictions maximales (départage d'égalité correct → Ressaisie + Terrain ;
  10 h/sem → 13 500 €/an) et structure saine (bascule « rien d'alarmant »).
- Un défaut corrigé : chapeau de restitution contradictoire dans le cas sain.
- Vérification visuelle par captures : les deux pages, desktop 1440 px et
  mobile 500 px, de haut en bas.

## Livraison

Commit `6977d6f` poussé sur `main` (`AlexDum1/site-web`) — 7 fichiers,
~2 005 insertions. Déploiement GitHub Pages automatique.

## Reste à faire

- [ ] **Renseigner l'endpoint Formspree** (`SITE.formspree` dans `main.js`) —
      sans lui, aucune réponse du diagnostic ni du formulaire de contact n'arrive.
- [ ] Vérifier le rendu de la page en ligne après déploiement.
- [ ] Relire les passages écrits « en ton nom » (encart vécu, section preuve,
      FAQ « c'est arrivé ») et ajuster si besoin.
- [ ] Prospection PME : l'URL `/optimisation` est prête à servir de page
      d'atterrissage (LinkedIn, email, réseau).
