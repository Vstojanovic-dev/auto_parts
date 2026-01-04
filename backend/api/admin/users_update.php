
<?php
// backend/api/admin/users_update.php

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

// Validate required fields
$id = isset($data['id']) ? (int) $data['id'] : 0;
$name = isset($data['name']) ? trim((string) $data['name']) : '';
$email = isset($data['email']) ? trim((string) $data['email']) : '';

if ($id <= 0 || $name === '' || $email === '') {
    http_response_code(400);
    echo json_encode([
        'status'  => 'error',
        'message' => 'id, name and email are required',
    ]);
    exit;
}

// Optional role change (admin-only feature)
$role = null;
if (array_key_exists('role', $data)) {
    $roleCandidate = trim((string) $data['role']);
    // Only allow specific roles; adjust if you use different ones
    if (!in_array($roleCandidate, ['user', 'admin'], true)) {
        http_response_code(400);
        echo json_encode([
            'status'  => 'error',
            'message' => 'Invalid role value',
        ]);
        exit;
    }
    $role = $roleCandidate;
}

// Make sure the user exists first
$checkStmt = $pdo->prepare('SELECT id, name, email, role FROM users WHERE id = ? LIMIT 1');
$checkStmt->execute([$id]);
$existing = $checkStmt->fetch(PDO::FETCH_ASSOC);

if (!$existing) {
    http_response_code(404);
    echo json_encode([
        'status'  => 'error',
        'message' => 'User not found',
    ]);
    exit;
}

// Prevent an admin from removing their own admin status (optional safety)
if ($role === 'user' && (int) $existing['id'] === (int) $adminUser['id']) {
    http_response_code(400);
    echo json_encode([
        'status'  => 'error',
        'message' => 'You cannot remove your own admin role',
    ]);
    exit;
}

// Build update query dynamically so we don't touch columns we don't know
$fields = [
    'name'  => $name,
    'email' => $email,
];

if ($role !== null) {
    $fields['role'] = $role;
}

$setParts = [];
$params = [];

foreach ($fields as $column => $value) {
    $setParts[] = "$column = :$column";
    $params[":$column"] = $value;
}

$params[':id'] = $id;

$sql = 'UPDATE users SET ' . implode(', ', $setParts) . ' WHERE id = :id';
$stmt = $pdo->prepare($sql);
$stmt->execute($params);

// Fetch updated user
$fetchStmt = $pdo->prepare('SELECT id, name, email, role FROM users WHERE id = ? LIMIT 1');
$fetchStmt->execute([$id]);
$updated = $fetchStmt->fetch(PDO::FETCH_ASSOC);

echo json_encode([
    'status' => 'ok',
    'data'   => $updated,
]);
