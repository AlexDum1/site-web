# Signatures mail DumAlgo

Signatures HTML pour les deux adresses du domaine, alignées sur la charte
« vert-de-gris / plan d'atelier » du site.

| Fichier | Usage |
|---|---|
| `signature-contact.html` | identité **contact@dumalgo.fr** |
| `signature-alexis.html` | identité **alexis.dumas@dumalgo.fr** |
| `signature.txt` | version texte brut (mobile, clients sans HTML) |

Le logo est appelé à distance depuis le site :
`https://dumalgo.fr/assets/img/signature/dumalgo-hexagone-128.png`
(fichier source dans `assets/img/signature/`, exporté depuis
`assets/img/logo/dumalgo-hexagone-plein.svg`). Ne pas déplacer ni renommer cette
image : toutes les signatures déjà envoyées pointent dessus.

## Installer dans Apple Mail (Mac) — client principal

Fait le 22/07/2026 par écriture directe dans `~/Library/Mail/V10/MailData/Signatures/` :

- `A1D0C1A0-…-DUMALGOCONT01.mailsignature` → compte `contact@dumalgo.fr`
- `A2D0C1A0-…-DUMALGOALEX01.mailsignature` → compte `alexis.dumas@dumalgo.fr`
- déclarées dans `AllSignatures.plist`, rattachées aux comptes dans `AccountsMap.plist`

Sauvegarde des deux plists d'origine : `_archive/applemail-signatures-backup-2026-07-22/`
(hors dépôt — ces fichiers contiennent les adresses des autres comptes).

**Pour refaire l'opération** : Mail doit être **fermé**, sinon il réécrit les fichiers en
quittant. Le format est un mail MIME : en-têtes `Content-Type: text/html` +
`Content-Transfer-Encoding: quoted-printable`, ligne vide, puis le HTML encodé en
quoted-printable. Si Apple Mail finit par écraser la mise en forme, la parade est de
verrouiller les fichiers après vérification : `chflags uchg <fichier>.mailsignature`.

## Installer sur iPhone

iOS n'a pas de champ signature HTML. Méthode de contournement :

1. Depuis le Mac, s'envoyer un mail signé.
2. Sur l'iPhone, ouvrir ce mail, sélectionner la signature entière, **Copier**.
3. Réglages → Apps → Mail → **Signature** → coller.

Le texte mis en forme survit généralement, le logo souvent pas. Si le rendu est
mauvais, coller à la place le bloc correspondant de `signature.txt`.

## Installer dans le webmail OVH (Roundcube)

Utile en dépannage (accès depuis un autre poste) :


1. Webmail OVH → **Paramètres → Identités** → sélectionner l'adresse.
2. Cocher **Signature HTML**.
3. Basculer l'éditeur en **code source** (bouton `<>` ou « Source ») et coller le
   contenu du fichier `.html` correspondant.
4. Enregistrer, puis répéter pour la seconde identité.

**Si Roundcube casse la mise en forme** (il réécrit parfois le HTML collé en source) :
ouvrir le fichier `.html` dans Chrome, tout sélectionner (⌘A), copier (⌘C), puis coller
dans l'éditeur WYSIWYG de la signature — le presse-papier riche préserve les styles inline.

Après installation, envoyer un mail de test vers une boîte Gmail et le relire sur mobile.

## Contraintes respectées (ne pas « moderniser » ces fichiers)

- Mise en page en `<table>`, **tout le CSS en attribut `style` inline** : pas de balise
  `<style>`, pas de flexbox/grid — Outlook et Gmail les ignorent ou les suppriment.
- **PNG et non SVG** : le SVG n'est pas rendu de façon fiable en mail.
- **Aucune webfont** : Space Grotesk / IBM Plex ne sont pas chargeables dans un mail.
  On utilise les piles système (sans-serif pour le texte, monospace pour `dumalgo.fr`,
  en rappel du logotype).
- Les liens sont doublés d'un `<span>` coloré à l'intérieur du `<a>` pour neutraliser
  le bleu que iOS Mail et Gmail forcent sur les liens.
- La signature reste lisible **images bloquées** : le `alt="DumAlgo"` suffit, aucune
  information n'est portée par l'image seule.

## À mettre à jour plus tard

- Ajouter le **SIREN** dès attribution (micro-entreprise en cours d'immatriculation au
  22/07/2026), en cohérence avec `mentions-legales.html`.
