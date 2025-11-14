<?php
// backend/api/public/auth/me.php

header('Content-Type: application/json');

require_once __DIR__ . '/../../../cors.php';

session_start();

if (empty($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode([
        'status'  => 'error',
        'message' => 'Not authenticated'
    ]);
    exit;
}

echo json_encode([
    'status' => 'ok',
    'user' => [
        'id'    => (int) $_SESSION['user_id'],
        'name'  => $_SESSION['user_name'],
        'email' => $_SESSION['user_email'],
        'role'  => $_SESSION['user_role'],
    ]
]);

