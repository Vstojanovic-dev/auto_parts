<?php
// backend/user_guard.php

declare(strict_types=1);

require_once __DIR__ . '/config.php';

/**
 * Ensures the current session user is logged in.
 * - If no user logged in -> 401
 * Returns the user row on success.
 */
function require_login(): array
{
    if (session_status() !== PHP_SESSION_ACTIVE) {
        session_start();
    }

    header('Content-Type: application/json');

    if (empty($_SESSION['user_id'])) {
        http_response_code(401);
        echo json_encode([
            'status'  => 'error',
            'message' => 'Authentication required',
        ]);
        exit;
    }

    /** @var PDO $pdo */
    global $pdo;

    $stmt = $pdo->prepare('
        SELECT id, name, email, role, is_verified, created_at
        FROM users
        WHERE id = ?
        LIMIT 1
    ');
    $stmt->execute([$_SESSION['user_id']]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        http_response_code(401);
        echo json_encode([
            'status'  => 'error',
            'message' => 'User not found',
        ]);
        exit;
    }

    return $user;
}
