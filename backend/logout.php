<?php

declare(strict_types=1);

require_once __DIR__ . '/auth.php';

logoutAccount();
sendJson(['success' => true, 'message' => 'Logout berhasil.']);
