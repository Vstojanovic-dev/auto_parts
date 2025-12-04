<?php


declare(strict_types=1);

header('Content-Type: application/json');

require_once __DIR__ . '/../../cors.php';
require_once __DIR__ . '/../../admin_guard.php';

// This will exit with JSON + 401/403 if not admin
$adminUser = require_admin();

echo json_encode([
    'status'  => 'ok',
    'message' => 'Admin ping successful',
    'admin'   => [
        'id'    => $adminUser['id'] ?? null,
        'name'  => $adminUser['name'] ?? null,
        'email' => $adminUser['email'] ?? null,
        'role'  => $adminUser['role'] ?? null,
    ],
]);
