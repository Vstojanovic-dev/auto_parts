<?php
// backend/admin_guard.php

declare(strict_types=1);

require_once __DIR__ . '/config.php';

/**
 * Ensures the current session user is an admin.
 *
 * - If no user logged in  -> 401
 * - If user is not admin  -> 403
 *
 * Returns the admin user row as an associative array on success.
 * Exits with JSON error response on failure.
 */
function require_admin(): array
{
    // In case config.php didn't start the session (safe to call twice)
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

    $stmt = $pdo->prepare('SELECT id, name, email, role FROM users WHERE id = ? LIMIT 1');
    $stmt->execute([$_SESSION['user_id']]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        // Session references a non-existing user
        http_response_code(401);
        echo json_encode([
            'status'  => 'error',
            'message' => 'User not found',
        ]);
        exit;
    }

    if (!isset($user['role']) || $user['role'] !== 'admin') {
        http_response_code(403);
        echo json_encode([
            'status'  => 'error',
            'message' => 'Admin privileges required',
        ]);
        exit;
    }

    return $user;
}

