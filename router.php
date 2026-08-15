<?php
declare(strict_types=1);

// Router for PHP built-in server (Railway).
$uri = urldecode(parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/');
$path = __DIR__ . $uri;

// Serve existing static files / php scripts directly.
if ($uri !== '/' && is_file($path)) {
    if (str_ends_with(strtolower($path), '.php')) {
        require $path;
        return true;
    }
    return false; // built-in server serves the static file
}

// Missing storage files must not fall through to the SPA landing page.
if (str_starts_with($uri, '/storage/')) {
    http_response_code(404);
    header('Content-Type: text/plain; charset=utf-8');
    echo 'File not found';
    return true;
}

// /api/foo.php style routes
if (preg_match('#^/api/([A-Za-z0-9_\-]+\.php)$#', $uri, $m)) {
    $script = __DIR__ . '/api/' . $m[1];
    if (is_file($script)) {
        require $script;
        return true;
    }
    http_response_code(404);
    header('Content-Type: text/plain; charset=utf-8');
    echo "Not found";
    return true;
}

// SPA fallback
$index = __DIR__ . '/index.html';
if (is_file($index)) {
    header('Content-Type: text/html; charset=utf-8');
    readfile($index);
    return true;
}

http_response_code(404);
header('Content-Type: text/plain; charset=utf-8');
echo "index.html missing";
return true;
