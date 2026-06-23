<?php
/**
 * photos.php — place this in wp-content/uploads/
 * Returns a JSON array of all full-size image URLs found recursively
 * in the same directory. Skips WordPress thumbnail variants (e.g. photo-1024x682.jpg).
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
// Cache for 5 minutes — fast for visitors, fresh enough when you add photos
header('Cache-Control: public, max-age=300');

$base_dir = __DIR__;
$base_url = rtrim(dirname(dirname($_SERVER['SCRIPT_NAME'])), '/') . '/wp-content/uploads/';

$extensions = ['jpg', 'jpeg', 'png', 'webp', 'gif'];

// Build glob pattern for each extension, search recursively
$files = [];
foreach ($extensions as $ext) {
    $found = glob($base_dir . '/**/*.' . $ext, GLOB_BRACE) ?: [];
    // glob ** doesn't always recurse on all systems — use RecursiveIterator as fallback
    if (empty($found)) {
        $it = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($base_dir));
        foreach ($it as $file) {
            if ($file->isFile() && strtolower($file->getExtension()) === $ext) {
                $found[] = $file->getPathname();
            }
        }
    }
    $files = array_merge($files, $found);
}

// Deduplicate
$files = array_unique($files);

// Filter out WordPress thumbnail variants: filename-WxH.ext
$originals = array_filter($files, function ($path) {
    return !preg_match('/-\d+x\d+\.(jpe?g|png|webp|gif)$/i', basename($path));
});

// Convert absolute paths to root-relative URLs
$urls = array_map(function ($path) use ($base_dir, $base_url) {
    $relative = str_replace($base_dir, '', $path);
    $relative = ltrim(str_replace('\\', '/', $relative), '/');
    return $base_url . $relative;
}, $originals);

// Sort for a stable order (JS will shuffle for display)
sort($urls);

echo json_encode(array_values($urls), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
