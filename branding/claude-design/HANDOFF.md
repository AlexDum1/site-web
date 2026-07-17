# Handoff : Logo DumAlgo — symbole « Modules » (4a + 4d)

## Overview
Identité finale de **DumAlgo** (sites web & outils numériques sur-mesure, Hérault). Le symbole est une **arborescence de fichiers à nœuds carrés** : une colonne verticale, deux branches à coudes arrondis, trois modules (carrés arrondis) dont le terminal **doré** — le livrable au bout du chemin. Deux graisses : **4a « L'étalon »** (logo de référence) et **4d « Le compact »** (favicon/avatar/tampon).

## Le symbole — construction (grille 64×64)
### Version 4a — Étalon (usage général, trait 3.5)
```svg
<path d="M22 13 V45.5 Q22 50 26.5 50 H35.5 M22 23.5 Q22 28 26.5 28 H31.75"
      fill="none" stroke="#16584E" stroke-width="3.5" stroke-linecap="round"/>
<rect x="17.5" y="8.5"  width="9"  height="9"  rx="2.8" fill="#16584E"/> <!-- entrée -->
<rect x="33"   y="24"   width="8"  height="8"  rx="2.5" fill="#16584E"/> <!-- étape -->
<rect x="36.5" y="44.5" width="11" height="11" rx="3.2" fill="#C9A227"/> <!-- livrable (or) -->
```
### Version 4d — Compact (favicon ≤48 px, trait 4.5)
```svg
<path d="M21 12.5 V45.5 Q21 50.5 26 50.5 H34 M21 23 Q21 28 26 28 H32"
      fill="none" stroke="#16584E" stroke-width="4.5" stroke-linecap="round"/>
<rect x="16"    y="7.5"   width="10"   height="10"   rx="3"   fill="#16584E"/>
<rect x="33.5"  y="23.5"  width="9"    height="9"    rx="2.8" fill="#16584E"/>
<rect x="35.75" y="44.25" width="12.5" height="12.5" rx="3.6" fill="#C9A227"/>
```
Règles : hiérarchie de tailles entrée > étape < livrable (l'or est toujours le plus grand) ; coudes en quart de cercle rayon ~4.5 ; l'or `#C9A227` est **l'unique accent chaud** ; en monochrome tout passe en noir pur (le symbole doit tenir au tampon/photocopie).

## Lockup complet (viewBox 372×96)
- Symbole : grille 64 posée à `translate(8,16)`
- Wordmark : `Dum` + `Algo`, **Fraunces 500, 34px**, baseline y=57, x=88
  - Fond ivoire : `Dum` #1E2528, `Algo` #16584E
  - Fond vert : `Dum` #FAF7F2, `Algo` #C9A227
- Baseline : `SITES WEB · OUTILS NUMÉRIQUES`, **Inter 500, 10.5px, letter-spacing 3.2px**, x=89, y=76
  - Ivoire : #4C5A60 · Vert : #C9D9D5

## Monogramme / favicon
Tuile carrée 64×64, `rx=14`. Fond vert #16584E + symbole ivoire (défaut) ou fond ivoire #FAF7F2 + symbole vert. **Utiliser 4d en ≤48 px**, 4a au-delà.

## Design Tokens
- Vert profond `#16584E` (principal) · Vert nuit `#0E3F38` · Or `#C9A227` (accent unique) · Ivoire `#FAF7F2` · Vert brume `#E3EFEC` · Encre `#1E2528` · Texte secondaire `#4C5A60`
- Typo : **Fraunces** (titres/wordmark, weight 500) + **Inter** (baseline/texte)
- Pas de dégradés, pas d'effets, pas d'ombres sur le logo.

## Assets
Les 9 SVG finaux sont dans `DumAlgo/assets/img/logo/` (identiques au dossier `final/` du projet Claude Design) :
- `dumalgo-logo-ivoire.svg` / `dumalgo-logo-vert.svg` — lockup complet 4a (usage principal)
- `dumalgo-logo-compact-ivoire.svg` / `dumalgo-logo-compact-vert.svg` — lockup 4d
- `dumalgo-monogramme-ivoire.svg` / `dumalgo-monogramme-vert.svg` — tuile 4a
- `dumalgo-favicon.svg` (fond vert, défaut) / `dumalgo-favicon-ivoire.svg` — tuile 4d pour favicon
- `dumalgo-symbole-noir.svg` — symbole seul, noir pur (tampon, filigrane)

⚠️ Les lockups complets utilisent `<text>` avec les polices Fraunces/Inter : OK en usage web (fonts chargées par la page), mais **vectoriser le texte** pour tout usage hors-ligne/print/email.

## Intégration recommandée
- Favicon : servir `dumalgo-favicon.svg` (+ déclinaisons PNG 32/16 générées au build)
- Header du site : lockup ivoire ou vert selon le fond ; hauteur mini 40 px — fait sur le site avec le symbole 4d inliné + wordmark HTML
- L'exploration complète (tours 1-3, 64 variantes SVG) reste dans le projet Claude Design « Planche Logos DumAlgo » (`logos/`)
