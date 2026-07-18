# Mise en ligne sur OVH — dumalgo.fr

> Étapes 1 à 3 effectuées le 18/07/2026 (utilisateur FTP, secrets GitHub, multisite/SSL vérifiés).

Le déploiement est automatisé : à chaque mise à jour de la branche `main`, le workflow
GitHub Actions (`.github/workflows/deploy.yml`) assemble le site et l'envoie par SFTP
vers l'hébergement OVH (`dumalgk.cluster100.hosting.ovh.net`, serveur
`ssh.cluster100.hosting.ovh.net`, port 22 — le FTP mutualisé OVH ne supporte pas FTPS).

Ce qui est mis en ligne :

- `DumAlgo/` → racine du site (`https://dumalgo.fr/`), **sans** le dossier interne `DumAlgo/branding/` ;
- les 6 maquettes prospects → sous-dossiers (ex. `https://dumalgo.fr/espace-respire/`), non indexées ;
- `deploy/root/` → fichiers racine (`.htaccess`, `robots.txt`, `sitemap.xml`).

Avant le premier déploiement, trois actions sont à faire une seule fois dans les
interfaces OVH et GitHub (personne d'autre que vous ne peut les faire, elles demandent
vos accès).

## 1. Créer l'utilisateur FTP (OVH)

1. [Manager OVH](https://www.ovh.com/manager/) → **Web Cloud** → **Hébergements** →
   `dumalgk.cluster100.hosting.ovh.net` → onglet **FTP-SSH**.
2. S'il existe déjà un utilisateur principal (généralement `dumalgk`), cliquez sur **⋯ →
   Modifier le mot de passe** et choisissez un mot de passe fort. Sinon, créez un utilisateur.
3. Notez :
   - **Serveur FTP** : `ftp.cluster100.hosting.ovh.net`
   - **Identifiant** : (ex. `dumalgk`)
   - **Mot de passe** : celui que vous venez de définir
   - Le répertoire racine de l'utilisateur doit être `/` (le workflow envoie dans `www/`).

## 2. Ajouter les secrets GitHub

Dans le dépôt GitHub `AlexDum1/site-web` → **Settings** → **Secrets and variables** →
**Actions** → **New repository secret**, créez ces deux secrets :

| Nom | Valeur |
|---|---|
| `OVH_FTP_USERNAME` | l'identifiant FTP (ex. `dumalgk`) |
| `OVH_FTP_PASSWORD` | le mot de passe FTP |

(L'adresse du serveur SFTP est fixée directement dans le workflow ; un éventuel secret
`OVH_FTP_SERVER` n'est plus utilisé.)

## 3. Vérifier le multisite et le SSL (OVH)

1. Manager OVH → votre hébergement → onglet **Multisite**.
2. Vérifiez que `dumalgo.fr` **et** `www.dumalgo.fr` sont attachés, avec :
   - **Dossier racine** : `www`
   - **SSL** activé (Let's Encrypt gratuit).
   S'ils manquent : **Ajouter un domaine ou sous-domaine** ; si le domaine est chez OVH,
   la zone DNS est mise à jour automatiquement (sinon, faites pointer un enregistrement A
   vers `5.135.23.164` et un AAAA vers `2001:41d0:301::100`).
3. Le certificat SSL se génère quelques minutes à quelques heures après l'ajout.

## 4. Premier déploiement

1. Mergez la branche `claude/dumaglo-ovh-migration-gp20ck` dans `main` — le workflow se
   lance automatiquement. (Ou lancez-le à la main : onglet **Actions** → « Déploiement OVH
   (dumalgo.fr) » → **Run workflow**.)
2. Suivez l'exécution dans l'onglet **Actions** ; le premier envoi transfère tout le site
   (les suivants n'envoient que les fichiers modifiés).
3. Vérifiez :
   - `https://dumalgo.fr` → le site DumAlgo s'affiche en HTTPS ;
   - `http://www.dumalgo.fr` → redirige vers `https://dumalgo.fr` ;
   - `https://dumalgo.fr/espace-respire/` → la maquette s'affiche ;
   - `https://dumalgo.fr/robots.txt` et `https://dumalgo.fr/sitemap.xml` répondent.

## Reste à faire (non bloquant)

- **Coordonnées de contact** : renseigner `SITE` dans `DumAlgo/assets/js/main.js`
  (téléphone, email, endpoint [Formspree](https://formspree.io) pour le formulaire).
  Tant que Formspree n'est pas configuré, le formulaire bascule sur un `mailto:`.
- **Emails `@dumalgo.fr`** : votre hébergement OVH inclut des comptes email (Manager OVH →
  Web Cloud → Emails) si vous voulez par ex. `contact@dumalgo.fr`.
- Maquettes : `menuiserie-durand-le-pouget` charge Tailwind depuis un CDN et
  `laetitia-cardinale` utilise Google Fonts — acceptable pour des démos.
