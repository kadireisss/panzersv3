<?php
/**
 * Vercel serverless: tüm eski PHP rotalarını php-app/ altındaki gerçek dosyaya yönlendirir.
 * vercel.json rewrite: ?p=/BellaMain/... şeklinde gelir.
 */
declare(strict_types=1);

header('X-Powered-By: PANZER-PHP-Legacy');

$legacyRoot = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'php-app';
if (!is_dir($legacyRoot)) {
    http_response_code(503);
    header('Content-Type: text/plain; charset=utf-8');
    echo "php-app klasörü yok. Yerelde veya CI'da: npm run sync-php-monorepo\n";
    exit;
}

$rawP = isset($_GET['p']) ? (string) $_GET['p'] : '';
unset($_GET['p'], $_REQUEST['p']);

$queryMerge = '';
$p = $rawP;
if (str_contains($rawP, '?')) {
    [$p, $queryMerge] = explode('?', $rawP, 2);
    if ($queryMerge !== '') {
        $_SERVER['QUERY_STRING'] = $queryMerge;
        parse_str($queryMerge, $add);
        $_GET = $add + $_GET;
        $_REQUEST = $add + $_REQUEST;
    }
}

if ($p === '' || $p === '/') {
    http_response_code(404);
    header('Content-Type: text/plain; charset=utf-8');
    echo 'Geçersiz legacy yolu.';
    exit;
}

if ($p[0] !== '/') {
    $p = '/' . $p;
}

$rel = ltrim($p, '/');
$segments = array_values(array_filter(explode('/', $rel), static function ($s) {
    return $s !== '' && $s !== '.' && $s !== '..';
}));
$relClean = implode('/', $segments);

$fullPath = $legacyRoot . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $relClean);
$realLegacy = realpath($legacyRoot);
if ($realLegacy === false) {
    http_response_code(500);
    exit;
}

if (is_dir($fullPath)) {
    $index = $fullPath . DIRECTORY_SEPARATOR . 'index.php';
    if (is_file($index)) {
        $fullPath = $index;
    } else {
        http_response_code(404);
        header('Content-Type: text/plain; charset=utf-8');
        echo 'Dizin için index.php yok.';
        exit;
    }
}

$resolved = realpath($fullPath);
if ($resolved === false || !str_starts_with($resolved, $realLegacy)) {
    http_response_code(404);
    header('Content-Type: text/plain; charset=utf-8');
    echo 'Dosya bulunamadı.';
    exit;
}

if (!is_file($resolved) || !str_ends_with(strtolower($resolved), '.php')) {
    http_response_code(404);
    header('Content-Type: text/plain; charset=utf-8');
    echo 'Sadece .php dosyaları çalıştırılabilir.';
    exit;
}

$scriptPath = '/' . str_replace('\\', '/', substr($resolved, strlen($realLegacy) + 1));
$_SERVER['DOCUMENT_ROOT'] = $realLegacy;
$_SERVER['SCRIPT_FILENAME'] = $resolved;
$_SERVER['SCRIPT_NAME'] = $scriptPath;
$_SERVER['PHP_SELF'] = $scriptPath;

chdir(dirname($resolved));
require $resolved;
