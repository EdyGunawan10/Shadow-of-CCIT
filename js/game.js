class ShadowGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.state = 'MENU';
        this.soundManager = new SoundManager();
        this.level = new Level();
        this.hud = new HUDRenderer(this.canvas);
        this.keys = {
            up: false,
            down: false,
            left: false,
            right: false,
            shift: false
        };
        this.lastTimestamp = 0;
        this.elapsedTime = 0;
        this.detectionMeter = 0;
        this.enemiesEliminated = 0;
        this.totalEnemies = this.level.guards.length;
        this.missionComplete = false;
        this.scoreSaved = false;
        this.player = null;
        this.guards = [];
        this.overlayIds = ['menuOverlay', 'authOverlay', 'transitionOverlay', 'gameOverOverlay', 'winOverlay'];
        this.bindControls();
        this.bindUI();
        this.resetGame();
        requestAnimationFrame((timestamp) => this.loop(timestamp));
    }

    resetGame() {
        this.player = new Player(this.level.spawn.x, this.level.spawn.y);
        this.guards = this.level.guards.map((guard) => new Guard(guard.x, guard.y, guard.waypoints));
        this.elapsedTime = 0;
        this.detectionMeter = 0;
        this.enemiesEliminated = 0;
        this.missionComplete = false;
        this.scoreSaved = false;
    }

    bindControls() {
        window.addEventListener('keydown', (event) => {
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'Spacebar'].includes(event.key)) {
                event.preventDefault();
            }

            this.setKey(event.key, true);

            if (event.key === ' ' || event.code === 'Space') {
                if (this.state === 'PLAYING') {
                    const success = this.player.attemptTakedown(this.guards, this.soundManager);
                    if (success) {
                        this.enemiesEliminated = this.guards.filter((guard) => guard.eliminated).length;
                        this.missionComplete = this.enemiesEliminated === this.totalEnemies;
                    }
                }
            }

            if (event.key.toLowerCase() === 'r') {
                this.startGame();
            }
        });

        window.addEventListener('keyup', (event) => {
            this.setKey(event.key, false);
        });
    }

    setKey(key, value) {
        const normalized = key.toLowerCase();
        if (normalized === 'w' || key === 'ArrowUp') this.keys.up = value;
        if (normalized === 's' || key === 'ArrowDown') this.keys.down = value;
        if (normalized === 'a' || key === 'ArrowLeft') this.keys.left = value;
        if (normalized === 'd' || key === 'ArrowRight') this.keys.right = value;
        if (key === 'Shift') this.keys.shift = value;
    }

    bindUI() {
        const startButton = document.getElementById('startButton');
        const retryButton = document.getElementById('retryButton');
        const playAgainButton = document.getElementById('playAgainButton');
        const refreshLeaderboard = document.getElementById('refreshLeaderboard');
        const logoutButton = document.getElementById('logoutButton');
        const authForm = document.getElementById('authForm');
        const toggleAuthMode = document.getElementById('toggleAuthMode');

        if (startButton) startButton.addEventListener('click', () => this.startGame());
        if (retryButton) retryButton.addEventListener('click', () => this.startGame());
        if (playAgainButton) playAgainButton.addEventListener('click', () => this.startGame());
        if (refreshLeaderboard) refreshLeaderboard.addEventListener('click', () => this.loadLeaderboard());
        if (logoutButton) logoutButton.addEventListener('click', () => this.logout());
        if (authForm) authForm.addEventListener('submit', (event) => this.handleAuth(event));
        if (toggleAuthMode) toggleAuthMode.addEventListener('click', () => this.toggleAuthMode());

        this.authMode = 'login';
        this.loadLeaderboard();
    }

    toggleAuthMode() {
        this.authMode = this.authMode === 'login' ? 'register' : 'login';
        document.getElementById('authTitle').textContent = this.authMode === 'login' ? 'Login Agent' : 'Register Agent';
        document.getElementById('toggleAuthMode').textContent = this.authMode === 'login' ? 'Belum punya akun? Register' : 'Sudah punya akun? Login';
        document.getElementById('authMessage').textContent = '';
    }

    async handleAuth(event) {
        event.preventDefault();
        const username = document.getElementById('usernameInput').value.trim();
        const password = document.getElementById('passwordInput').value;
        const endpoint = this.authMode === 'login' ? 'backend/login.php' : 'backend/register.php';
        const message = document.getElementById('authMessage');

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const result = await response.json();

            if (!result.success) {
                message.textContent = result.message || 'Autentikasi gagal.';
                return;
            }

            window.APP_USER = result.user;
            document.getElementById('sessionStatus').textContent = `Agent: ${result.user.username}`;
            this.hideOverlay('authOverlay');
            this.showOverlay('menuOverlay');
            this.loadLeaderboard();
        } catch (error) {
            message.textContent = 'Tidak dapat menghubungi server autentikasi.';
        }
    }

    async logout() {
        try {
            await fetch('backend/logout.php', { method: 'POST' });
        } finally {
            window.location.reload();
        }
    }

    async loadLeaderboard() {
        const body = document.getElementById('leaderboardBody');
        if (!body) return;

        body.innerHTML = '<tr><td colspan="5">Memuat data...</td></tr>';

        try {
            const response = await fetch('backend/leaderboard.php');
            const data = await response.json();
            const items = Array.isArray(data.items) ? data.items : [];

            if (items.length === 0) {
                body.innerHTML = '<tr><td colspan="5">Belum ada skor.</td></tr>';
                return;
            }

            body.innerHTML = items.map((item, index) => {
                const time = Number(item.play_time).toFixed(2);
                const username = this.escapeHtml(item.username);
                return `<tr><td>${index + 1}</td><td>${username}</td><td>${time}s</td><td>${item.enemies_eliminated}</td><td>${item.hp_remaining}</td></tr>`;
            }).join('');
        } catch (error) {
            body.innerHTML = '<tr><td colspan="5">Leaderboard tidak tersedia.</td></tr>';
        }
    }

    escapeHtml(value) {
        return String(value).replace(/[&<>'"]/g, (char) => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#039;',
            '"': '&quot;'
        }[char]));
    }

    startGame() {
        if (!window.APP_USER) {
            this.showOnlyOverlay('authOverlay');
            return;
        }

        this.soundManager.resume();
        this.state = 'TRANSITION';
        this.showOnlyOverlay('transitionOverlay');
        this.resetGame();

        setTimeout(() => {
            this.state = 'PLAYING';
            this.hideAllOverlays();
            this.lastTimestamp = performance.now();
        }, 950);
    }

    loop(timestamp) {
        const delta = Math.min(0.033, (timestamp - this.lastTimestamp) / 1000 || 0);
        this.lastTimestamp = timestamp;

        if (this.state === 'PLAYING') {
            this.update(delta);
        }

        this.render();
        requestAnimationFrame((nextTimestamp) => this.loop(nextTimestamp));
    }

    update(delta) {
        this.elapsedTime += delta;
        this.player.update(delta, this.keys, this.level, this.guards, this.soundManager);

        let playerSeen = false;
        let anyGuardAlert = false;

        this.guards.forEach((guard) => {
            guard.update(delta, this.player, this.level, this.soundManager);
            if (!guard.eliminated && guard.canSeePlayer(this.player, this.level)) playerSeen = true;
            if (!guard.eliminated && guard.state === 'ALERT') anyGuardAlert = true;
        });

        if (playerSeen || anyGuardAlert) {
            this.detectionMeter = Math.min(100, this.detectionMeter + delta * (playerSeen ? 55 : 28));
        } else {
            this.detectionMeter = Math.max(0, this.detectionMeter - delta * 36);
        }

        if (this.detectionMeter > 8) {
            this.soundManager.playHeartbeatSound(this.detectionMeter / 100);
        }

        if (this.player.hp <= 0) {
            this.endGame(false);
            return;
        }

        if (this.missionComplete && this.level.isInsideRect({ x: this.player.x, y: this.player.y }, this.level.objectiveZone)) {
            this.endGame(true);
        }
    }

    endGame(won) {
        this.state = won ? 'WIN' : 'GAME_OVER';

        if (won) {
            const stats = `Waktu ${this.elapsedTime.toFixed(2)} detik, enemy neutralized ${this.enemiesEliminated}, sisa HP ${Math.round(this.player.hp)}.`;
            document.getElementById('winStats').textContent = `${stats} Menyimpan skor ke Animus Archive...`;
            this.showOnlyOverlay('winOverlay');
            this.submitScore();
        } else {
            document.getElementById('gameOverStats').textContent = `Waktu bertahan ${this.elapsedTime.toFixed(2)} detik. Enemy neutralized ${this.enemiesEliminated}/${this.totalEnemies}.`;
            this.showOnlyOverlay('gameOverOverlay');
        }
    }

    async submitScore() {
        if (this.scoreSaved) return;
        this.scoreSaved = true;

        try {
            const response = await fetch('backend/save_score.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    play_time: this.elapsedTime,
                    enemies_eliminated: this.enemiesEliminated,
                    hp_remaining: Math.round(this.player.hp)
                })
            });
            const result = await response.json();
            const prefix = `Waktu ${this.elapsedTime.toFixed(2)} detik, enemy neutralized ${this.enemiesEliminated}, sisa HP ${Math.round(this.player.hp)}.`;
            document.getElementById('winStats').textContent = result.success ? `${prefix} Skor tersimpan.` : `${prefix} ${result.message}`;
            this.loadLeaderboard();
        } catch (error) {
            document.getElementById('winStats').textContent = 'Misi selesai, tetapi skor gagal dikirim ke server.';
        }
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.level.draw(this.ctx, this.missionComplete);
        this.guards.forEach((guard) => guard.draw(this.ctx));
        this.player.draw(this.ctx);
        this.hud.draw(this.ctx, this);
        this.drawPausedState();
    }

    drawPausedState() {
        if (this.state === 'PLAYING') return;

        this.ctx.save();
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.restore();
    }

    showOnlyOverlay(id) {
        this.overlayIds.forEach((overlayId) => {
            const element = document.getElementById(overlayId);
            if (!element) return;
            element.classList.toggle('active', overlayId === id);
        });
    }

    showOverlay(id) {
        const element = document.getElementById(id);
        if (element) element.classList.add('active');
    }

    hideOverlay(id) {
        const element = document.getElementById(id);
        if (element) element.classList.remove('active');
    }

    hideAllOverlays() {
        this.overlayIds.forEach((id) => this.hideOverlay(id));
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.shadowGame = new ShadowGame();
});
