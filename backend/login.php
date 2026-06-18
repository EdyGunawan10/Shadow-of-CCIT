<?php

declare(strict_types=1);

require_once __DIR__ . '/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJson(['success' => false, 'message' => 'Metode tidak didukung.'], 405);
}

$payload = readJsonBody();
$result = loginAccount((string) ($payload['username'] ?? ''), (string) ($payload['password'] ?? ''));
sendJson($result, $result['success'] ? 200 : 401);
