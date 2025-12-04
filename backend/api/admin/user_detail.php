<?php
// backend/api/admin/user_detail.php

declare(strict_types=1);

header('Content-Type: application/json');

require_once __DIR__ . '/../../cors.php';
require_once __DIR__ . '/../../admin_guard.php';

// Ensure current user is admin
$adminUser = require_admin();

/** @var PDO $pdo */
global $pdo;

// --- Input validation ---
$id = isset($_GET['id']) ? (int) $_GET['id'] : 0;

if ($id <= 0) {
    http_response_code(400);
    echo json_encode([
        'status'  => 'error',
        'message' => 'Valid id parameter is required',
    ]);
    exit;
}

// --- Fetch user ---
$userStmt = $pdo->prepare('SELECT id, name, email, role FROM users WHERE id = ? LIMIT 1');
$userStmt->execute([$id]);
$user = $userStmt->fetch(PDO::FETCH_ASSOC);

if (!$user) {
    http_response_code(404);
    echo json_encode([
        'status'  => 'error',
        'message' => 'User not found',
    ]);
    exit;
}

// --- Fetch user orders (safe / best-effort) ---
$orders = [];
$ordersError = null;

try {
    // NOTE:
    // This assumes there is an `orders` table with at least:
    //   id, user_id, status, total_amount, created_at
    // If your schema differs, this SELECT may fail. We catch the error and
    // still return the user info, so existing functionality is NOT broken.
    $ordersSql = "
        SELECT
            id,
            user_id,
            status,
            total_amount,
            created_at
        FROM orders
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT 20
    ";

    $ordersStmt = $pdo->prepare($ordersSql);
    $ordersStmt->execute([$id]);
    $orders = $ordersStmt->fetchAll(PDO::FETCH_ASSOC);
} catch (Throwable $e) {
    // Do not break the endpoint if there is no orders table or columns mismatch
    $orders = [];
    $ordersError = 'Failed to load orders (check orders table/schema)';
}

$response = [
    'status' => 'ok',
    'data'   => [
        'user'   => $user,
        'orders' => $orders,
    ],
];

// Only include this if something went wrong with orders query
if ($ordersError !== null) {
    $response['orders_error'] = $ordersError;
}

echo json_encode($response);
