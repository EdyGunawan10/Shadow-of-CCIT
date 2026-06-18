# Shadow of CCIT: Creed of the Animus

Game web 2D top-down stealth action berbasis HTML5 Canvas, CSS3, JavaScript ES6, Web Audio API, dan PHP MySQL. Semua efek suara dibuat secara sintetis melalui `AudioContext` tanpa file audio eksternal.

## Fitur Utama

- Canvas 1000 x 600 dengan loop `requestAnimationFrame()`.
- State game: `MENU`, `TRANSITION`, `PLAYING`, `GAME_OVER`, dan `WIN`.
- Player dengan HP, stamina sprint, status `VISIBLE/HIDDEN`, dan silent takedown.
- Guard AI dengan patrol waypoint, vision cone 90 derajat, jarak pandang 180px, line-of-sight sampling, mode alert, dan chase berbasis vektor.
- Hiding spot, objective zone, mission gate, HUD canvas, detection meter, leaderboard MySQL.
- Backend PHP PDO untuk register, login session, logout, simpan skor, dan fetch leaderboard.
- UI gelap bertema Dark Cyber Assassin dengan Orbitron, crimson, neon blue, gold, dan white.

## Struktur File

```text
shadow_ccit/
├── backend/
│   ├── database.php
│   ├── auth.php
│   ├── register.php
│   ├── login.php
│   ├── logout.php
│   ├── save_score.php
│   └── leaderboard.php
├── css/
│   └── styles.css
├── js/
│   ├── audio.js
│   ├── level.js
│   ├── entities.js
│   ├── ui.js
│   └── game.js
├── index.php
├── schema.sql
└── README.md
```

## Cara Menjalankan di XAMPP/Laragon

1. Salin folder `shadow_ccit` ke direktori server lokal, misalnya `htdocs` pada XAMPP.
2. Buka phpMyAdmin, lalu import file `schema.sql`.
3. Sesuaikan konfigurasi database di `backend/database.php`:
   - `DB_HOST`
   - `DB_NAME`
   - `DB_USER`
   - `DB_PASS`
4. Jalankan Apache dan MySQL.
5. Akses proyek melalui browser:

```text
http://localhost/shadow_ccit/index.php
```

## Kontrol Game

| Tombol | Fungsi |
|---|---|
| WASD / Arrow Keys | Bergerak |
| Shift | Sprint memakai stamina |
| Space | Silent takedown dari belakang guard dalam jarak dekat |
| R | Restart simulasi |

## Aturan Misi

Player harus menetralkan semua guard dari belakang tanpa masuk ke bahaya berkepanjangan. Setelah semua guard netral, objective zone berwarna emas terbuka. Masuk ke zona tersebut untuk menyimpan skor ke leaderboard.

## Catatan Teknis

Canvas browser sudah menggunakan mekanisme rendering internal yang efektif untuk animasi berkelanjutan. Game loop menggunakan delta time agar gerak stabil meskipun frame rate berubah. Audio sintetis dipicu setelah interaksi pengguna karena browser modern membatasi `AudioContext` sebelum gesture pertama.
