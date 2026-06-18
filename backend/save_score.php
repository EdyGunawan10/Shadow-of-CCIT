<?php

declare(strict_types=1);

require_once __DIR__ . '/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJson(['success' => false, 'message' => 'Metode tidak didukung.'], 405);
}

$user = requireLoggedInUser();
$payload = readJsonBody();

$playTime = (float) ($payload['play_time'] ?? 0);
$enemiesEliminated = (int) ($payload['enemies_eliminated'] ?? 0);
$hpRemaining = (int) ($payload['hp_remaining'] ?? 0);

$result = saveScore($user['id'], $playTime, $enemiesEliminated, $hpRemaining);
sendJson($result);
