<?php
// backend/api/admin/users_delete.php

declare(strict_types=1);

header('Content-Type: application/json');

require_once __DIR__ . '/../../cors.php';
require_once __DIR__ . '/../../admin_guard.php';

// Ensure current user is admin
$adminUser = require_admin();

/** @var PDO $pdo */
global $pdo;

// Read JSON body
$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);

if (!is_array($data)) {
    http_response_code(400);
    echo json_encode([
        'status'  => 'error',
        'message' => 'Invalid JSON body',
    ]);
    exit;
}

$id = isset($data['id']) ? (int) $data['id'] : 0;

if ($id <= 0) {
    http_response_code(400);
    echo json_encode([
        'status'  => 'error',
        'message' => 'id is required',
    ]);
    exit;
}

// Load the user we want to delete
$checkStmt = $pdo->prepare('SELECT id, name, email, role FROM users WHERE id = ? LIMIT 1');
$checkStmt->execute([$id]);
$targetUser = $checkStmt->fetch(PDO::FETCH_ASSOC);

if (!$targetUser) {
    http_response_code(404);
    echo json_encode([
        'status'  => 'error',
        'message' => 'User not found',
    ]);
    exit;
}

// Safety: do not let an admin delete themselves
if ((int) $targetUser['id'] === (int) $adminUser['id']) {
    http_response_code(400);
    echo json_encode([
        'status'  => 'error',
        'message' => 'You cannot delete your own account from admin panel',
    ]);
    exit;
}

// (Optional) If you want to forbid deleting other admins entirely, uncomment this:
/*
if (isset($targetUser['role']) && $targetUser['role'] === 'admin') {
    http_response_code(400);
    echo json_encode([
        'status'  => 'error',
        'message' => 'Deleting other admin accounts is not allowed',
    ]);
    exit;
}
*/

try {
    $deleteStmt = $pdo->prepare('DELETE FROM users WHERE id = ?');
    $deleteStmt->execute([$id]);
} catch (Throwable $e) {
    // If there are foreign key constraints, this will catch those errors too
    http_response_code(500);
    echo json_encode([
        'status'  => 'error',
        'message' => 'Failed to delete user',
    ]);
    exit;
}

echo json_encode([
    'status' => 'ok',
    'data'   => [
        'id'    => $targetUser['id'],
        'name'  => $targetUser['name'],
        'email' => $targetUser['email'],
        'role'  => $targetUser['role'],
        'deleted' => true,
    ],
]);
