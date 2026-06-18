<?php

declare(strict_types=1);

require_once __DIR__ . '/auth.php';

$pdo = getDatabaseConnection();
$statement = $pdo->query(
    'SELECT users.username, leaderboard.play_time, leaderboard.enemies_eliminated, leaderboard.hp_remaining, leaderboard.created_at
     FROM leaderboard
     INNER JOIN users ON users.id = leaderboard.user_id
     ORDER BY leaderboard.play_time ASC, leaderboard.enemies_eliminated DESC, leaderboard.hp_remaining DESC, leaderboard.created_at ASC
     LIMIT 20'
);

sendJson([
    'success' => true,
    'items' => $statement->fetchAll(),
]);
