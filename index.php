<?php
require_once __DIR__ . '/backend/auth.php';
$user = currentUser();
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Shadow of CCIT: Creed of the Animus</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;700;900&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="css/styles.css">
</head>
<body>
    <main class="app-shell">
        <section class="game-panel">
            <div class="title-strip">
                <div>
                    <p class="eyebrow">CCIT Animus Simulation</p>
                    <h1>Shadow of CCIT</h1>
                    <p class="subtitle">Creed of the Animus</p>
                </div>
                <div class="session-box">
                    <span id="sessionStatus"><?php echo $user ? 'Agent: ' . htmlspecialchars($user['username'], ENT_QUOTES, 'UTF-8') : 'Guest Session'; ?></span>
                    <?php if ($user): ?>
                        <button id="logoutButton" class="mini-button">Logout</button>
                    <?php endif; ?>
                </div>
            </div>

            <div class="canvas-frame">
                <canvas id="gameCanvas" width="1000" height="600" aria-label="Shadow of CCIT stealth game canvas"></canvas>
                <div id="menuOverlay" class="overlay active">
                    <div class="overlay-card wide-card">
                        <div class="animus-ring"></div>
                        <p class="eyebrow">Dark Cyber Assassin Protocol</p>
                        <h2>Sinkronisasi Animus Siap</h2>
                        <p class="overlay-text">Masuki fasilitas CCIT, hindari pandangan penjaga, gunakan semak dan bayangan, lalu capai zona ekstraksi setelah semua ancaman dinetralkan.</p>
                        <div class="control-grid">
                            <span>WASD / Arrow</span><strong>Gerak</strong>
                            <span>Shift</span><strong>Sprint</strong>
                            <span>Space</span><strong>Silent Takedown</strong>
                            <span>R</span><strong>Restart</strong>
                        </div>
                        <button id="startButton" class="primary-button">Start Simulation</button>
                    </div>
                </div>

                <div id="authOverlay" class="overlay <?php echo $user ? '' : 'active'; ?>">
                    <div class="overlay-card auth-card">
                        <p class="eyebrow">Animus Access Gateway</p>
                        <h2 id="authTitle">Login Agent</h2>
                        <form id="authForm" class="auth-form">
                            <label for="usernameInput">Username</label>
                            <input id="usernameInput" name="username" type="text" autocomplete="username" minlength="3" maxlength="24" required placeholder="agent_ccit">
                            <label for="passwordInput">Password</label>
                            <input id="passwordInput" name="password" type="password" autocomplete="current-password" minlength="6" required placeholder="••••••••">
                            <p id="authMessage" class="message-line"></p>
                            <button type="submit" class="primary-button">Masuk</button>
                            <button type="button" id="toggleAuthMode" class="ghost-button">Belum punya akun? Register</button>
                        </form>
                    </div>
                </div>

                <div id="transitionOverlay" class="overlay">
                    <div class="overlay-card compact-card">
                        <div class="scanline-loader"></div>
                        <p class="eyebrow">Animus Synchronizing</p>
                        <h2>Memuat Simulasi</h2>
                        <p class="overlay-text">Memetakan memori, mengunci sinyal deteksi, dan mengaktifkan protokol bayangan.</p>
                    </div>
                </div>

                <div id="gameOverOverlay" class="overlay">
                    <div class="overlay-card compact-card danger-card">
                        <p class="eyebrow">Simulation Failed</p>
                        <h2>Game Over</h2>
                        <p id="gameOverStats" class="overlay-text">Agent terdeteksi dan gagal menyelesaikan misi.</p>
                        <button id="retryButton" class="primary-button">Retry</button>
                    </div>
                </div>

                <div id="winOverlay" class="overlay">
                    <div class="overlay-card compact-card win-card">
                        <p class="eyebrow">Animus Memory Complete</p>
                        <h2>Mission Complete</h2>
                        <p id="winStats" class="overlay-text">Skor sedang diproses.</p>
                        <button id="playAgainButton" class="primary-button">Play Again</button>
                    </div>
                </div>
            </div>
        </section>

        <aside class="side-panel">
            <section class="panel-card">
                <p class="eyebrow">Mission Brief</p>
                <h2>Objective</h2>
                <p>Netralisasi seluruh guard dari belakang tanpa masuk ke status bahaya berkepanjangan. Capai zona emas untuk menyelesaikan simulasi.</p>
                <ul class="brief-list">
                    <li>Hidden di area hijau tua untuk memutus deteksi awal.</li>
                    <li>Sprint memakai stamina, gunakan seperlunya.</li>
                    <li>Detection Meter tinggi akan mempercepat detak jantung sintetis.</li>
                </ul>
            </section>

            <section class="panel-card leaderboard-card">
                <div class="panel-header">
                    <div>
                        <p class="eyebrow">Animus Archive</p>
                        <h2>Leaderboard</h2>
                    </div>
                    <button id="refreshLeaderboard" class="mini-button">Refresh</button>
                </div>
                <div class="table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Agent</th>
                                <th>Time</th>
                                <th>Kills</th>
                                <th>HP</th>
                            </tr>
                        </thead>
                        <tbody id="leaderboardBody">
                            <tr><td colspan="5">Memuat data...</td></tr>
                        </tbody>
                    </table>
                </div>
            </section>
        </aside>
    </main>

    <script>
        window.APP_USER = <?php echo json_encode($user, JSON_UNESCAPED_UNICODE); ?>;
    </script>
    <script src="js/audio.js"></script>
    <script src="js/level.js"></script>
    <script src="js/entities.js"></script>
    <script src="js/ui.js"></script>
    <script src="js/game.js"></script>
</body>
</html>
