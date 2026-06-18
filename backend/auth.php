<?php

declare(strict_types=1);

require_once __DIR__ . '/database.php';

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

function sendJson(array $payload, int $statusCode = 200): void
{
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

function readJsonBody(): array
{
    $rawInput = file_get_contents('php://input');
    $payload = json_decode($rawInput ?: '{}', true);

    if (!is_array($payload)) {
        sendJson([
            'success' => false,
            'message' => 'Format JSON tidak valid.',
        ], 400);
    }

    return $payload;
}

function normalizeUsername(string $username): string
{
    return strtolower(trim($username));
}

function validateUsername(string $username): ?string
{
    if (!preg_match('/^[a-zA-Z0-9_]{3,24}$/', $username)) {
        return 'Username harus 3-24 karakter dan hanya boleh berisi huruf, angka, atau underscore.';
    }

    return null;
}

function validatePassword(string $password): ?string
{
    if (strlen($password) < 6) {
        return 'Password minimal 6 karakter.';
    }

    return null;
}

function registerAccount(string $username, string $password): array
{
    $username = normalizeUsername($username);
    $usernameError = validateUsername($username);
    $passwordError = validatePassword($password);

    if ($usernameError !== null) {
        return ['success' => false, 'message' => $usernameError];
    }

    if ($passwordError !== null) {
        return ['success' => false, 'message' => $passwordError];
    }

    $pdo = getDatabaseConnection();

    $checkStatement = $pdo->prepare('SELECT id FROM users WHERE username = :username LIMIT 1');
    $checkStatement->execute(['username' => $username]);

    if ($checkStatement->fetch()) {
        return ['success' => false, 'message' => 'Username sudah digunakan.'];
    }

    $hash = password_hash($password, PASSWORD_DEFAULT);
    $insertStatement = $pdo->prepare('INSERT INTO users (username, password_hash) VALUES (:username, :password_hash)');
    $insertStatement->execute([
        'username' => $username,
        'password_hash' => $hash,
    ]);

    $_SESSION['user_id'] = (int) $pdo->lastInsertId();
    $_SESSION['username'] = $username;

    return [
        'success' => true,
        'message' => 'Registrasi berhasil.',
        'user' => ['id' => $_SESSION['user_id'], 'username' => $_SESSION['username']],
    ];
}

function loginAccount(string $username, string $password): array
{
    $username = normalizeUsername($username);
    $pdo = getDatabaseConnection();

    $statement = $pdo->prepare('SELECT id, username, password_hash FROM users WHERE username = :username LIMIT 1');
    $statement->execute(['username' => $username]);
    $user = $statement->fetch();

    if (!$user || !password_verify($password, $user['password_hash'])) {
        return ['success' => false, 'message' => 'Username atau password salah.'];
    }

    session_regenerate_id(true);
    $_SESSION['user_id'] = (int) $user['id'];
    $_SESSION['username'] = $user['username'];

    return [
        'success' => true,
        'message' => 'Login berhasil.',
        'user' => ['id' => $_SESSION['user_id'], 'username' => $_SESSION['username']],
    ];
}

function logoutAccount(): void
{
    $_SESSION = [];

    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'], (bool) $params['secure'], (bool) $params['httponly']);
    }

    session_destroy();
}

function currentUser(): ?array
{
    if (!isset($_SESSION['user_id'], $_SESSION['username'])) {
        return null;
    }

    return [
        'id' => (int) $_SESSION['user_id'],
        'username' => (string) $_SESSION['username'],
    ];
}

function requireLoggedInUser(): array
{
    $user = currentUser();

    if ($user === null) {
        sendJson([
            'success' => false,
            'message' => 'Login diperlukan untuk menyimpan skor.',
        ], 401);
    }

    return $user;
}

function saveScore(int $userId, float $playTime, int $enemiesEliminated, int $hpRemaining): array
{
    $playTime = max(1, round($playTime, 2));
    $enemiesEliminated = max(0, $enemiesEliminated);
    $hpRemaining = max(0, min(100, $hpRemaining));

    $pdo = getDatabaseConnection();
    $statement = $pdo->prepare(
        'INSERT INTO leaderboard (user_id, play_time, enemies_eliminated, hp_remaining) VALUES (:user_id, :play_time, :enemies_eliminated, :hp_remaining)'
    );
    $statement->execute([
        'user_id' => $userId,
        'play_time' => $playTime,
        'enemies_eliminated' => $enemiesEliminated,
        'hp_remaining' => $hpRemaining,
    ]);

    return [
        'success' => true,
        'message' => 'Skor berhasil disimpan.',
        'score_id' => (int) $pdo->lastInsertId(),
    ];
}
