<?php
/* ==========================================================================
   Endpoint des formulaires dumalgo.fr — contact + synthèse du diagnostic.
   Traitement 100 % sur l'hébergement OVH (France) : email vers DEST
   + journal JSON-lines hors webroot (purge manuelle à 12 mois).
   Anti-abus : pot de miel _gotcha, contrôle d'origine, limites de taille,
   garde-fou de fréquence par IP. Répond en JSON ; le front ne teste
   que le code HTTP (res.ok).
   ========================================================================== */

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

const DEST        = 'contact@dumalgo.fr';
const EXPEDITEUR  = 'formulaire@dumalgo.fr';
const MAX_PAR_IP  = 5;    // envois autorisés…
const FENETRE     = 600;  // …par tranche de 10 minutes

/* www/api/ → deux niveaux au-dessus = racine du compte, hors web. */
$dataDir = dirname(__DIR__, 2) . '/formdata';

function repondre(int $code, array $corps)
{
  http_response_code($code);
  echo json_encode($corps, JSON_UNESCAPED_UNICODE);
  exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
  repondre(405, ['ok' => false, 'erreur' => 'Méthode non autorisée']);
}

/* Origine : si le navigateur annonce une origine, elle doit être le site. */
$origine = $_SERVER['HTTP_ORIGIN'] ?? $_SERVER['HTTP_REFERER'] ?? '';
if ($origine !== '' && !preg_match('~^https://(www\.)?dumalgo\.fr(/|$)~', $origine)) {
  repondre(403, ['ok' => false, 'erreur' => 'Origine refusée']);
}

/* Pot de miel : un bot qui remplit _gotcha reçoit un faux succès. */
if (trim((string) ($_POST['_gotcha'] ?? '')) !== '') {
  repondre(200, ['ok' => true]);
}

/* Champs, bornés en taille. */
$champ = static function (string $nom, int $max): string {
  return mb_substr(trim((string) ($_POST[$nom] ?? '')), 0, $max);
};
$formName   = $champ('form_name', 80);
$nom        = $champ('nom', 200);
$email      = $champ('email', 254);
$typeProjet = $champ('type_de_projet', 120);
$selection  = $champ('selection', 300);
$gisements  = $champ('gisements_retenus', 300);
$message    = $champ('message', 5000);

/* FILTER_VALIDATE_EMAIL interdit aussi les retours à la ligne :
   protège l'en-tête Reply-To de toute injection. */
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
  repondre(422, ['ok' => false, 'erreur' => 'Email invalide']);
}
$estDiagnostic = ($formName === 'diagnostic-optimisation-synthese');
if (!$estDiagnostic && ($nom === '' || $message === '')) {
  repondre(422, ['ok' => false, 'erreur' => 'Nom et message requis']);
}

if (!is_dir($dataDir) && !mkdir($dataDir, 0700, true)) {
  repondre(500, ['ok' => false, 'erreur' => 'Stockage indisponible']);
}

/* Garde-fou de fréquence : horodatages récents par IP, un fichier par IP. */
$ip          = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
$fichierIp   = $dataDir . '/ip-' . hash('sha256', $ip) . '.json';
$maintenant  = time();
$horodatages = is_file($fichierIp)
  ? (json_decode((string) file_get_contents($fichierIp), true) ?: [])
  : [];
$horodatages = array_values(array_filter(
  $horodatages,
  function ($t) use ($maintenant) { return $maintenant - (int) $t < FENETRE; }
));
if (count($horodatages) >= MAX_PAR_IP) {
  repondre(429, ['ok' => false, 'erreur' => 'Trop d’envois, réessayez dans quelques minutes']);
}
$horodatages[] = $maintenant;
file_put_contents($fichierIp, json_encode($horodatages), LOCK_EX);

/* Journal — filet de sécurité si un email se perd. */
$entree = [
  'date'      => date('c'),
  'form'      => $estDiagnostic ? 'diagnostic' : 'contact',
  'nom'       => $nom,
  'email'     => $email,
  'type'      => $typeProjet,
  'selection' => $selection,
  'gisements' => $gisements,
  'message'   => $message,
];
file_put_contents(
  $dataDir . '/journal.jsonl',
  json_encode($entree, JSON_UNESCAPED_UNICODE) . "\n",
  FILE_APPEND | LOCK_EX
);

/* Email vers la boîte du site, sujet différencié par formulaire. */
if ($estDiagnostic) {
  $sujet = '[dumalgo.fr] Synthèse diagnostic demandée';
  $corps = "Synthèse du diagnostic demandée par : $email\n"
    . 'Gisements retenus : ' . ($gisements !== '' ? $gisements : 'non précisés') . "\n";
} else {
  $sujet = '[dumalgo.fr] Demande de contact — ' . $nom;
  $corps = "Nom : $nom\nEmail : $email\n"
    . 'Type de projet : ' . ($typeProjet !== '' ? $typeProjet : 'Non précisé') . "\n"
    . ($selection !== '' ? "Sélection : $selection\n" : '')
    . ($gisements !== '' ? "Gisements du diagnostic : $gisements\n" : '')
    . "\n$message\n";
}
$entetes = 'From: DumAlgo <' . EXPEDITEUR . ">\r\n"
  . 'Reply-To: ' . $email . "\r\n"
  . "Content-Type: text/plain; charset=UTF-8\r\n"
  . 'Content-Transfer-Encoding: 8bit';

if (!mail(DEST, mb_encode_mimeheader($sujet, 'UTF-8'), $corps, $entetes)) {
  repondre(500, ['ok' => false, 'erreur' => 'Envoi impossible pour le moment']);
}
repondre(200, ['ok' => true]);
