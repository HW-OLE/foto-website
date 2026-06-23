<?php
/**
 * photos.php — liegt in wp-content/uploads/
 * Gibt ein JSON-Array aller vollauflösenden Bilder zurück (rekursiv).
 * WordPress-Thumbnails (z.B. foto-1024x682.jpg) werden übersprungen.
 */

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: public, max-age=300');

$base_dir = __DIR__;

// Alle Bilddateien rekursiv einsammeln
$files = [];
$it = new RecursiveIteratorIterator(new RecursiveDirectoryIterator(
    $base_dir,
    RecursiveDirectoryIterator::SKIP_DOTS
));
foreach ($it as $file) {
    if (!$file->isFile()) continue;
    $name = $file->getFilename();
    // Nur JPGs
    if (!preg_match('/\.jpe?g$/i', $name)) continue;
    // WordPress-Thumbnails überspringen (z.B. foto-800x600.jpg)
    if (preg_match('/-\d+x\d+\.jpe?g$/i', $name)) continue;
    // WordPress -scaled Varianten überspringen
    if (preg_match('/-scaled\.jpe?g$/i', $name)) continue;
    $files[] = $file->getPathname();
}

sort($files);

// Absoluten Dateipfad → root-relativen URL umwandeln
// __DIR__ entspricht dem Verzeichnis der PHP-Datei auf dem Dateisystem.
// Wir schneiden alles bis einschließlich "uploads/" ab und setzen die
// bekannte URL-Basis davor — kein SCRIPT_NAME nötig.
$urls = array_map(function ($path) use ($base_dir) {
    $rel = ltrim(str_replace($base_dir, '', $path), DIRECTORY_SEPARATOR);
    $rel = str_replace('\\', '/', $rel);
    return '/wp-content/uploads/' . $rel;
}, $files);

echo json_encode(array_values($urls), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
